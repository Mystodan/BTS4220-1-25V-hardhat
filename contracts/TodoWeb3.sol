// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

contract TodoWeb3 {
    struct Task {
        string uuid;
        string content;
        bool completed;
        address user; // Only set if private
        bool is_private; // true = private, false = public
        uint256 createdAt;
        uint256 completedAt;
    }

    mapping(string => Task) public tasks;
    mapping(address => string[]) private userTasks; // Only for private tasks
    string[] public publicTasks; // Only for public tasks
    mapping(string => uint256) private publicTaskIndex; // O(1) index for publicTasks
    mapping(address => mapping(string => uint256)) private userTaskIndex; // O(1) index for userTasks

    event TaskCreated(string uuid, string content, bool completed);
    event TaskCompleted(string uuid, bool completed);
    event TaskDeleted(string uuid);
    event TasksCleared(string[] uuid_arr);
    event TaskPrivacyToggled(string uuid, bool is_private);
    event TaskEdited(string uuid, string content, bool completed, bool is_private);

    function deleteTask(string calldata _uuid) public {
        require(bytes(_uuid).length > 0, "Invalid task uuid");
        require(bytes(tasks[_uuid].content).length > 0, "Task already deleted");
        if (tasks[_uuid].is_private) {
            require(tasks[_uuid].user == msg.sender, "Not your private task");
            string[] storage priv = userTasks[msg.sender];
            uint256 idx = userTaskIndex[msg.sender][_uuid];
            uint256 lastIdx = priv.length - 1;
            if (idx != lastIdx) {
                string memory lastUuid = priv[lastIdx];
                priv[idx] = lastUuid;
                userTaskIndex[msg.sender][lastUuid] = idx;
            }
            priv.pop();
            delete userTaskIndex[msg.sender][_uuid];
        } else {
            require(tasks[_uuid].user == msg.sender, "Not your public task");
            uint256 idx = publicTaskIndex[_uuid];
            uint256 lastIdx = publicTasks.length - 1;
            if (idx != lastIdx) {
                string memory lastUuid = publicTasks[lastIdx];
                publicTasks[idx] = lastUuid;
                publicTaskIndex[lastUuid] = idx;
            }
            publicTasks.pop();
            delete publicTaskIndex[_uuid];
        }
        tasks[_uuid] = Task(_uuid, "", false, address(0), false, 0, 0);
        emit TaskDeleted(_uuid);
    }

    function createTask(string calldata _uuid, string calldata _content, bool _privateTask) public {
        require(bytes(_uuid).length > 0, "Invalid task uuid");
        require(bytes(_content).length > 0, "Task content required");
        if (bytes(tasks[_uuid].content).length > 0) revert("Task already exists");
        address _user = msg.sender;
        tasks[_uuid] = Task(_uuid, _content, false, _user, _privateTask, block.timestamp, 0);
        if (_privateTask) {
            userTasks[msg.sender].push(_uuid);
            userTaskIndex[msg.sender][_uuid] = userTasks[msg.sender].length - 1;
        } else {
            publicTasks.push(_uuid);
            publicTaskIndex[_uuid] = publicTasks.length - 1;
        }
        emit TaskCreated(_uuid, _content, false);
    }

    function toggleCompleted(string calldata _uuid) public {
        require(bytes(_uuid).length > 0, "Invalid task uuid");
        if (bytes(tasks[_uuid].content).length == 0) revert("Task does not exist");
        if (tasks[_uuid].is_private) require(tasks[_uuid].user == msg.sender, "Not your private task");
        tasks[_uuid].completed = !tasks[_uuid].completed;
        if (tasks[_uuid].completed) {
            tasks[_uuid].completedAt = block.timestamp;
        } else {
            tasks[_uuid].completedAt = 0;
        }
        emit TaskCompleted(_uuid, tasks[_uuid].completed);
    }

    function clearCompletedTasks() public {
        uint256 completedCount = 0;
        uint256 pubLen = publicTasks.length;
        for (uint256 i = 0; i < pubLen; ) {
            string memory tid = publicTasks[i];
            if (
                tasks[tid].completed &&
                bytes(tasks[tid].content).length > 0 &&
                tasks[tid].user == msg.sender
            ) {
                completedCount++;
            }
            unchecked { ++i; }
        }
        string[] storage priv = userTasks[msg.sender];
        uint256 privLen = priv.length;
        for (uint256 i = 0; i < privLen; ) {
            string memory tid = priv[i];
            if (tasks[tid].completed && bytes(tasks[tid].content).length > 0) {
                completedCount++;
            }
            unchecked { ++i; }
        }
        string[] memory removedUuids = new string[](completedCount);
        uint256 idx = 0;
        for (uint256 i = 0; i < pubLen; ) {
            string memory tid = publicTasks[i];
            if (
                tasks[tid].completed &&
                bytes(tasks[tid].content).length > 0 &&
                tasks[tid].user == msg.sender
            ) {
                removedUuids[idx++] = tid;
                tasks[tid] = Task(tid, "", false, address(0), false, 0, 0);
            }
            unchecked { ++i; }
        }
        for (uint256 i = 0; i < privLen; ) {
            string memory tid = priv[i];
            if (tasks[tid].completed && bytes(tasks[tid].content).length > 0) {
                removedUuids[idx++] = tid;
                tasks[tid] = Task(tid, "", false, address(0), true, 0, 0);
            }
            unchecked { ++i; }
        }
        emit TasksCleared(removedUuids);
    }

    function getMyTasks() public view returns (Task[] memory) {
        uint256 count = 0;
        uint256 pubLen = publicTasks.length;
        for (uint256 i = 0; i < pubLen; ) {
            if (bytes(tasks[publicTasks[i]].content).length > 0) {
                count++;
            }
            unchecked { ++i; }
        }
        string[] storage priv = userTasks[msg.sender];
        uint256 privLen = priv.length;
        for (uint256 i = 0; i < privLen; ) {
            if (bytes(tasks[priv[i]].content).length > 0) {
                count++;
            }
            unchecked { ++i; }
        }
        Task[] memory myTasks = new Task[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < pubLen; ) {
            if (bytes(tasks[publicTasks[i]].content).length > 0) {
                myTasks[idx++] = tasks[publicTasks[i]];
            }
            unchecked { ++i; }
        }
        for (uint256 i = 0; i < privLen; ) {
            if (bytes(tasks[priv[i]].content).length > 0) {
                myTasks[idx++] = tasks[priv[i]];
            }
            unchecked { ++i; }
        }
        return myTasks;
    }

    function getPublicTasks() public view returns (Task[] memory) {
        uint256 count = 0;
        uint256 pubLen = publicTasks.length;
        for (uint256 i = 0; i < pubLen; ) {
            if (bytes(tasks[publicTasks[i]].content).length > 0) {
                count++;
            }
            unchecked { ++i; }
        }
        Task[] memory pubTasks = new Task[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < pubLen; ) {
            if (bytes(tasks[publicTasks[i]].content).length > 0) {
                pubTasks[idx++] = tasks[publicTasks[i]];
            }
            unchecked { ++i; }
        }
        return pubTasks;
    }

    function editTask(string calldata _uuid, string calldata _content) public {
        require(bytes(_uuid).length > 0, "Invalid task uuid");
        require(bytes(tasks[_uuid].content).length > 0, "Task does not exist");
        if (tasks[_uuid].is_private) require(tasks[_uuid].user == msg.sender, "Not your private task");
        tasks[_uuid].content = _content;
    }

    function toggleTaskPrivacy(string calldata _uuid) public {
        require(bytes(_uuid).length > 0, "Invalid task uuid");
        require(bytes(tasks[_uuid].content).length > 0, "Task does not exist");
        Task storage t = tasks[_uuid];
        require(t.user == msg.sender, "Not your task");
        if (t.is_private) {
            string[] storage priv = userTasks[msg.sender];
            uint256 idx = userTaskIndex[msg.sender][_uuid];
            uint256 lastIdx = priv.length - 1;
            if (idx != lastIdx) {
                string memory lastUuid = priv[lastIdx];
                priv[idx] = lastUuid;
                userTaskIndex[msg.sender][lastUuid] = idx;
            }
            priv.pop();
            delete userTaskIndex[msg.sender][_uuid];
            publicTasks.push(_uuid);
            publicTaskIndex[_uuid] = publicTasks.length - 1;
            t.is_private = false;
        } else {
            uint256 idx = publicTaskIndex[_uuid];
            uint256 lastIdx = publicTasks.length - 1;
            if (idx != lastIdx) {
                string memory lastUuid = publicTasks[lastIdx];
                publicTasks[idx] = lastUuid;
                publicTaskIndex[lastUuid] = idx;
            }
            publicTasks.pop();
            delete publicTaskIndex[_uuid];
            userTasks[msg.sender].push(_uuid);
            userTaskIndex[msg.sender][_uuid] = userTasks[msg.sender].length - 1;
            t.is_private = true;
        }
        emit TaskPrivacyToggled(_uuid, t.is_private);
    }

    function editTaskFull(string calldata _uuid, string calldata _content, bool _completed, bool _isPrivate) public {
        require(bytes(_uuid).length > 0, "Invalid task uuid");
        require(bytes(tasks[_uuid].content).length > 0, "Task does not exist");
        Task storage t = tasks[_uuid];
        require(t.user == msg.sender, "Not your task");
        bool changed = false;
        if (keccak256(bytes(_content)) != keccak256(bytes(t.content))) {
            t.content = _content;
            changed = true;
        }
        if (t.completed != _completed) {
            t.completed = _completed;
            if (_completed) {
                t.completedAt = block.timestamp;
            } else {
                t.completedAt = 0;
            }
            emit TaskCompleted(_uuid, _completed);
            changed = true;
        }
        if (t.is_private != _isPrivate) {
            if (_isPrivate) {
                uint256 idx = publicTaskIndex[_uuid];
                uint256 lastIdx = publicTasks.length - 1;
                if (idx != lastIdx) {
                    string memory lastUuid = publicTasks[lastIdx];
                    publicTasks[idx] = lastUuid;
                    publicTaskIndex[lastUuid] = idx;
                }
                publicTasks.pop();
                delete publicTaskIndex[_uuid];
                userTasks[msg.sender].push(_uuid);
                userTaskIndex[msg.sender][_uuid] = userTasks[msg.sender].length - 1;
                t.is_private = true;
            } else {
                string[] storage priv = userTasks[msg.sender];
                uint256 idx = userTaskIndex[msg.sender][_uuid];
                uint256 lastIdx = priv.length - 1;
                if (idx != lastIdx) {
                    string memory lastUuid = priv[lastIdx];
                    priv[idx] = lastUuid;
                    userTaskIndex[msg.sender][lastUuid] = idx;
                }
                priv.pop();
                delete userTaskIndex[msg.sender][_uuid];
                publicTasks.push(_uuid);
                publicTaskIndex[_uuid] = publicTasks.length - 1;
                t.is_private = false;
            }
            emit TaskPrivacyToggled(_uuid, t.is_private);
            changed = true;
        }
        if (changed) {
            emit TaskEdited(_uuid, t.content, t.completed, t.is_private);
        }
    }

    fallback() external payable {
        // List of harmless selectors to silently revert
       if (
            msg.sig == 0x01ffc9a7 || // supportsInterface(bytes4)
            msg.sig == 0x95d89b41 || // name()
            msg.sig == 0x313ce567    // decimals()
        ) {
            revert(); // Silently revert for harmless probes
        } 
        revert(string(abi.encodePacked("Unknown selector: ", toHexString(uint256(uint32(msg.sig)), 4))));
   
    }

    receive() external payable {
        revert("This contract does not accept direct ETH transfers");
    }

    function toHexString(uint256 value, uint256 length) internal pure returns (string memory) {
        bytes16 _HEX_SYMBOLS = "0123456789abcdef";
        bytes memory buffer = new bytes(2 * length + 2);
        buffer[0] = "0";
        buffer[1] = "x";
        for (uint256 i = 2 * length + 1; i > 1; --i) {
            buffer[i] = _HEX_SYMBOLS[value & 0xf];
            value >>= 4;
        }
        require(value == 0, "Strings: hex length insufficient");
        return string(buffer);
    }
}
