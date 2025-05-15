// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

contract TodoWeb3 {
    uint256 public taskCount = 0; // Task id counter to make sure all tasks have an unique id

    struct Task {
        uint256 id; //The id of the task
        string content; // The content/description of the task
        bool completed; //If the task is completed
        address user; // Always set, so that users can only manipulate their own tasks
        bool is_private; // true = private, false = public
        uint256 createdAt; //When the task was created
        uint256 completedAt; //When the task was completed, 0 if incomplete
    }

    mapping(uint256 => Task) private tasks; //Dictionary for storing all tasks, must be private so people can't read tasks marked as private
    uint256[] private id_tracker; //An array for keeping track of which tasks exist, allowing us to only loop over existing tasks whenever possible

    address[] public pseudo_add;
    string[] public pseudo_usr;

    //An assortment of events/signals, they should be self explanatory
    event TaskCreated(uint256 id, string content);

    event TaskCompleted(uint256 id, bool completed);

    event TaskDeleted(uint256 id);

    event TasksCleared();

    //Function for removing the given id from the tracker, used only in other functions (hence private)
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

    function getPseudonymLen() public view returns (uint256) {
        return pseudo_add.length;
    }

    function getAddIdx(address add) private view returns (int256 idx) {
        for (int256 i = 0; i < int256(pseudo_add.length); i++) {
            if (add == pseudo_add[uint256(i)]) {
                return i;
            }
        }
        return -1;
    }

    // Function for updating your own username in the pseudonym dict
    function setUsername(string memory _name) external {
        int256 idx = getAddIdx(msg.sender);
        if (idx < 0) {
            pseudo_add.push(msg.sender);
            pseudo_usr.push(_name);
        } else {
            pseudo_usr[uint(idx)] = _name;
        }
    }

    //Function for deleting a task
    function deleteTask(uint256 _id) public {
        require(_id > 0 && _id <= taskCount, "Invalid task id");
        require(bytes(tasks[_id].content).length > 0, "Task already deleted");
        // Only the owner of a task can delete it
        require(tasks[_id].user == msg.sender, "Not your private task");

        // Set task data to default before deleting and removing from the tracker
        tasks[_id] = Task(_id, "", false, address(0), false, 0, 0);
        delete tasks[_id];
        remove_from_tracker(_id);
        emit TaskDeleted(_id);
    }

    //Function for creating a task
    function createTask(string memory _content, bool _privateTask) public {
        taskCount++;
        address _user = _privateTask ? msg.sender : msg.sender;
        tasks[taskCount] = Task(
            taskCount,
            _content,
            false,
            _user,
            _privateTask,
            block.timestamp,
            0
        );
        id_tracker.push(taskCount);
        emit TaskCreated(taskCount, _content);
    }

    //Function for toggling completion of tasks, only owner of private tasks can edit their own
    function toggleCompleted(uint256 _id) public {
        // Only owner of a task can edit their own private task
        if (tasks[_id].is_private) {
            require(tasks[_id].user == msg.sender, "Not your private task");
        }
        // Anyone can toggle public tasks
        tasks[_id].completed = !tasks[_id].completed;
        if (tasks[_id].completed) {
            //If task is set to completed, update timestamp
            tasks[_id].completedAt = block.timestamp;
        } else {
            //If task is toggled to incomplete, reset completedAt time
            tasks[_id].completedAt = 0;
        }
        emit TaskCompleted(_id, tasks[_id].completed);
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

    //Deletes all the tasks the requestor has marked as completed
    function clearCompletedTasks() public {
        // Iterate backwards to avoid index issues when removing
        for (uint256 i = id_tracker.length; i > 0; i--) {
            if (
                tasks[id_tracker[i - 1]].user == msg.sender && //Users can only delete their own tasks
                tasks[id_tracker[i - 1]].completed
            ) {
                // Could technically call the deleteTask() function here, but it would require more gas
                delete tasks[id_tracker[i - 1]];
                remove_from_tracker(id_tracker[i - 1]);
            }
        }
        emit TasksCleared();
    }

    //Function to return all tasks owned by the user AND public tasks
    function getMyTasks() public view returns (Task[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < id_tracker.length; i++) {
            // Only count tasks visible to the caller:
            // - public tasks (not private, not deleted)
            // - private tasks owned by the caller (not deleted)
            if (
                (!tasks[id_tracker[i]].is_private &&
                    bytes(tasks[id_tracker[i]].content).length > 0) ||
                (tasks[id_tracker[i]].is_private &&
                    tasks[id_tracker[i]].user == msg.sender &&
                    bytes(tasks[id_tracker[i]].content).length > 0)
            ) {
                count++;
            }
        }
        //Create temporary task array to send back tasks available to the user
        // Uses the count from earlier to create a fixed length array to save on gas (dynamic arrays are gas intensive)
        Task[] memory myTasks = new Task[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < id_tracker.length; i++) {
            // Adds tasks that are ... to the myTasks array (return array)
            // - public tasks (not private, not deleted)
            // - private tasks owned by the caller (not deleted)
            if (
                (!tasks[id_tracker[i]].is_private &&
                    bytes(tasks[id_tracker[i]].content).length > 0) ||
                (tasks[id_tracker[i]].is_private &&
                    tasks[id_tracker[i]].user == msg.sender &&
                    bytes(tasks[id_tracker[i]].content).length > 0)
            ) {
                //Adds the task to the myTasks array if above criteraia is met
                myTasks[idx] = tasks[id_tracker[i]];
                idx++;
            }
        }
        return myTasks; //Returns the tasks to the caller
    }

    //Function to return all public tasks
    // This code works essentially the same as getMyTasks(), but ommits your own private tasks as well.
    function getPublicTasks() public view returns (Task[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < id_tracker.length; i++) {
            // Only count public tasks that are not deleted
            if (
                !tasks[id_tracker[i]].is_private &&
                bytes(tasks[id_tracker[i]].content).length > 0
            ) {
                count++;
            }
        }
        //Create temporary task array to send back all public tasks
        // Uses the count from earlier to create a fixed length array to save on gas (dynamic arrays are gas intensive)
        Task[] memory publicTasks = new Task[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < id_tracker.length; i++) {
            if (
                !tasks[id_tracker[i]].is_private &&
                bytes(tasks[id_tracker[i]].content).length > 0
            ) {
                publicTasks[idx] = tasks[id_tracker[i]];
                idx++;
            }
        }
        return publicTasks;
    }

    fallback() external payable {
        // List of harmless selectors to silently revert
        if (
            msg.sig == 0x01ffc9a7 || // supportsInterface(bytes4)
            msg.sig == 0x95d89b41 || // name()
            msg.sig == 0x313ce567 // decimals()
        ) {
            revert(); // Silently revert for harmless probes
        }
        revert(
            string(
                abi.encodePacked(
                    "Unknown selector: ",
                    toHexString(uint256(uint32(msg.sig)), 4)
                )
            )
        );
    }

    receive() external payable {
        revert("This contract does not accept direct ETH transfers");
    }

    //Helper function for fallback
    function toHexString(
        uint256 value,
        uint256 length
    ) internal pure returns (string memory) {
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
