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

    event TaskCreated(string uuid, string content, bool completed);
    event TaskCompleted(string uuid, bool completed);
    event TaskDeleted(string uuid);
    event TasksCleared(string[] uuid_arr);

    function deleteTask(string memory _uuid) public {
        require(bytes(_uuid).length > 0, "Invalid task uuid");
        require(bytes(tasks[_uuid].content).length > 0, "Task already deleted");
        if (tasks[_uuid].is_private) {
            require(tasks[_uuid].user == msg.sender, "Not your private task");
        } else {
            require(tasks[_uuid].user == msg.sender, "Not your public task");
        }
        // Remove from userTasks or publicTasks array
        if (tasks[_uuid].is_private) {
            string[] storage priv = userTasks[msg.sender];
            for (uint256 i = 0; i < priv.length; i++) {
                if (keccak256(bytes(priv[i])) == keccak256(bytes(_uuid))) {
                    priv[i] = priv[priv.length - 1];
                    priv.pop();
                    break;
                }
            }
        } else {
            for (uint256 i = 0; i < publicTasks.length; i++) {
                if (keccak256(bytes(publicTasks[i])) == keccak256(bytes(_uuid))) {
                    publicTasks[i] = publicTasks[publicTasks.length - 1];
                    publicTasks.pop();
                    break;
                }
            }
        }
        tasks[_uuid] = Task(_uuid, "", false, address(0), false, 0, 0);
        emit TaskDeleted(_uuid);
    }

    function createTask(string memory _uuid, string memory _content, bool _privateTask) public {
        require(bytes(_uuid).length > 0, "Invalid task uuid");
        require(bytes(_content).length > 0, "Task content required");
        // Fix: Only check for existing if mapping entry is not default
        if (bytes(tasks[_uuid].content).length > 0) {
            revert("Task already exists");
        }
        address _user = msg.sender; // Always set to creator
        tasks[_uuid] = Task(_uuid, _content, false, _user, _privateTask, block.timestamp, 0);
        if (_privateTask) {
            userTasks[msg.sender].push(_uuid);
        } else {
            publicTasks.push(_uuid);
        }
        emit TaskCreated(_uuid, _content, false);
    }

    function toggleCompleted(string memory _uuid) public {
        require(bytes(_uuid).length > 0, "Invalid task uuid");
        // Fix: Only check .length if mapping entry is not default
        if (bytes(tasks[_uuid].content).length == 0) {
            revert("Task does not exist");
        }
        if (tasks[_uuid].is_private) {
            require(tasks[_uuid].user == msg.sender, "Not your private task");
        }
        // Anyone can toggle public tasks
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
        // Only clear public tasks created by msg.sender
        for (uint256 i = 0; i < publicTasks.length; i++) {
            string memory tid = publicTasks[i];
            if (
                tasks[tid].completed &&
                bytes(tasks[tid].content).length > 0 &&
                tasks[tid].user == msg.sender
            ) {
                completedCount++;
            }
        }
        // Clear private tasks for sender
        string[] storage priv = userTasks[msg.sender];
        for (uint256 i = 0; i < priv.length; i++) {
            string memory tid = priv[i];
            if (tasks[tid].completed && bytes(tasks[tid].content).length > 0) {
                completedCount++;
            }
        }
        string[] memory removedUuids = new string[](completedCount);
        uint256 idx = 0;
        // Mark public tasks as deleted (only those created by msg.sender)
        for (uint256 i = 0; i < publicTasks.length; i++) {
            string memory tid = publicTasks[i];
            if (
                tasks[tid].completed &&
                bytes(tasks[tid].content).length > 0 &&
                tasks[tid].user == msg.sender
            ) {
                removedUuids[idx++] = tid;
                tasks[tid] = Task(tid, "", false, address(0), false, 0, 0);
            }
        }
        // Mark private tasks as deleted
        for (uint256 i = 0; i < priv.length; i++) {
            string memory tid = priv[i];
            if (tasks[tid].completed && bytes(tasks[tid].content).length > 0) {
                removedUuids[idx++] = tid;
                tasks[tid] = Task(tid, "", false, address(0), true, 0, 0);
            }
        }
        emit TasksCleared(removedUuids);
    }

    function getMyTasks() public view returns (Task[] memory) {
        // Count public tasks
        uint256 count = 0;
        for (uint256 i = 0; i < publicTasks.length; i++) {
            if (bytes(tasks[publicTasks[i]].content).length > 0) {
                count++;
            }
        }
        // Count private tasks for sender
        string[] storage priv = userTasks[msg.sender];
        for (uint256 i = 0; i < priv.length; i++) {
            if (bytes(tasks[priv[i]].content).length > 0) {
                count++;
            }
        }
        Task[] memory myTasks = new Task[](count);
        uint256 idx = 0;
        // Add public tasks
        for (uint256 i = 0; i < publicTasks.length; i++) {
            if (bytes(tasks[publicTasks[i]].content).length > 0) {
                myTasks[idx++] = tasks[publicTasks[i]];
            }
        }
        // Add private tasks
        for (uint256 i = 0; i < priv.length; i++) {
            if (bytes(tasks[priv[i]].content).length > 0) {
                myTasks[idx++] = tasks[priv[i]];
            }
        }
        return myTasks;
    }

    function getPublicTasks() public view returns (Task[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < publicTasks.length; i++) {
            if (bytes(tasks[publicTasks[i]].content).length > 0) {
                count++;
            }
        }
        Task[] memory pubTasks = new Task[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < publicTasks.length; i++) {
            if (bytes(tasks[publicTasks[i]].content).length > 0) {
                pubTasks[idx++] = tasks[publicTasks[i]];
            }
        }
        return pubTasks;
    }

    function editTask(string memory _uuid, string memory _content) public {
        require(bytes(_uuid).length > 0, "Invalid task uuid");
        require(bytes(tasks[_uuid].content).length > 0, "Task does not exist");
        if (tasks[_uuid].is_private) {
            require(tasks[_uuid].user == msg.sender, "Not your private task");
        }
        // Anyone can edit public tasks
        tasks[_uuid].content = _content;
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
