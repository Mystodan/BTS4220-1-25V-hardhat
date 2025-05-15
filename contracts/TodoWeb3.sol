// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

contract TodoWeb3 {
    uint256 public taskCount = 0;

    struct Task {
        uint256 id;
        string content;
        bool completed;
        address user; // Only set if private
        bool is_private; // true = private, false = public
        uint256 createdAt;
        uint256 completedAt;
    }

    mapping(uint256 => Task) public tasks;
    uint256[] public id_tracker;

    event TaskCreated(uint256 id, string content, bool completed);

    event TaskCompleted(uint256 id, bool completed);

    event TaskDeleted(uint256 id);

    event TasksCleared(uint256[] id_arr);

    function remove_from_tracker(uint256 _id) private {
        uint256 len = id_tracker.length;
        for (uint256 i = 0; i < len; i++) {
            if (id_tracker[i] == _id) {
                if (i != len - 1) {
                    id_tracker[i] = id_tracker[len - 1];
                }
                id_tracker.pop();
                break;
            }
        }
    }

    function deleteTask(uint256 _id) public {
        require(_id > 0 && _id <= taskCount, "Invalid task id");
        require(bytes(tasks[_id].content).length > 0, "Task already deleted");
        if (tasks[_id].is_private) {
            require(tasks[_id].user == msg.sender, "Not your private task");
        }
        // Anyone can delete public tasks
        tasks[_id] = Task(_id, "", false, address(0), false, 0, 0);
        remove_from_tracker(_id);
        emit TaskDeleted(_id);
    }

    function createTask(string memory _content, bool _privateTask) public {
        taskCount++;
        address _user = _privateTask ? msg.sender : address(0);
        tasks[taskCount] = Task(taskCount, _content, false, _user, _privateTask, block.timestamp, 0);
        id_tracker.push(taskCount);
        emit TaskCreated(taskCount, _content, false);
    }

    function toggleCompleted(uint256 _id) public {
        if (tasks[_id].is_private) {
            require(tasks[_id].user == msg.sender, "Not your private task");
        }
        // Anyone can toggle public tasks
        tasks[_id].completed = !tasks[_id].completed;
        if (tasks[_id].completed) {
            tasks[_id].completedAt = block.timestamp;
        } else {
            tasks[_id].completedAt = 0;
        }
        emit TaskCompleted(_id, tasks[_id].completed);
    }

    function clearCompletedTasks() public {
        uint256 completedCount = 0;
        // Count all completed tasks that the user can clear (private owned by user, or public)
        for (uint256 i = 0; i < id_tracker.length; i++) {
            if (
                tasks[id_tracker[i]].completed &&
                (
                    (!tasks[id_tracker[i]].is_private && bytes(tasks[id_tracker[i]].content).length > 0) ||
                    (tasks[id_tracker[i]].is_private && tasks[id_tracker[i]].user == msg.sender)
                )
            ) {
                completedCount++;
            }
        }
        uint256[] memory removedIds = new uint256[](completedCount);
        uint256 idx = 0;
        // Remove from the end to avoid skipping elements
        for (uint256 i = id_tracker.length; i > 0; ) {
            i--;
            if (
                tasks[id_tracker[i]].completed &&
                (
                    (!tasks[id_tracker[i]].is_private && bytes(tasks[id_tracker[i]].content).length > 0) ||
                    (tasks[id_tracker[i]].is_private && tasks[id_tracker[i]].user == msg.sender)
                )
            ) {
                removedIds[idx] = id_tracker[i];
                idx++;
                tasks[id_tracker[i]] = Task(id_tracker[i], "", false, address(0), false, 0, 0);
                remove_from_tracker(id_tracker[i]);
            }
        }
        emit TasksCleared(removedIds);
    }

    function getMyTasks() public view returns (Task[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < id_tracker.length; i++) {
            // Only count tasks visible to the caller:
            // - public tasks (not private, not deleted)
            // - private tasks owned by the caller (not deleted)
            if (
                (!tasks[id_tracker[i]].is_private && bytes(tasks[id_tracker[i]].content).length > 0) ||
                (tasks[id_tracker[i]].is_private && tasks[id_tracker[i]].user == msg.sender && bytes(tasks[id_tracker[i]].content).length > 0)
            ) {
                count++;
            }
        }
        Task[] memory myTasks = new Task[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < id_tracker.length; i++) {
            if (
                (!tasks[id_tracker[i]].is_private && bytes(tasks[id_tracker[i]].content).length > 0) ||
                (tasks[id_tracker[i]].is_private && tasks[id_tracker[i]].user == msg.sender && bytes(tasks[id_tracker[i]].content).length > 0)
            ) {
                myTasks[idx] = tasks[id_tracker[i]];
                idx++;
            }
        }
        return myTasks;
    }

    function getPublicTasks() public view returns (Task[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < id_tracker.length; i++) {
            // Only count public tasks that are not deleted
            if (!tasks[id_tracker[i]].is_private && bytes(tasks[id_tracker[i]].content).length > 0) {
                count++;
            }
        }
        Task[] memory publicTasks = new Task[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < id_tracker.length; i++) {
            if (!tasks[id_tracker[i]].is_private && bytes(tasks[id_tracker[i]].content).length > 0) {
                publicTasks[idx] = tasks[id_tracker[i]];
                idx++;
            }
        }
        return publicTasks;
    }

    // --- Edit functionality ---
    function editTask(uint256 _id, string memory _content) public {
        require(_id > 0 && _id <= taskCount, "Invalid task id");
        require(bytes(tasks[_id].content).length > 0, "Task does not exist");
        if (tasks[_id].is_private) {
            require(tasks[_id].user == msg.sender, "Not your private task");
        }
        // Anyone can edit public tasks
        tasks[_id].content = _content;
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
