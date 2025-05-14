// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

contract TodoWeb3 {
    uint256 public taskCount = 0;

    struct Task {
        uint256 id; //Task ID, counts upward with each new task
        string content; //The content in the task / The text
        uint createdAt; //When the task was created
        bool completed; //If the task is completed or not
        uint completedAt; //Shows the last time the "completed" field was updated, 0 at creation
        address creator; //Who created/owns the task
        bool priv; //Wether the task is private or not
    }

    mapping(uint256 => Task) private tasks; //Dictionary for storing all tasks, must be private so people can't read tasks marked as private
    uint256[] private id_tracker; //An array for keeping track of which tasks exist, allowing us to only loop over existing tasks whenever possible

    //Decided to only emit one signal, mostly to save my fingers from typing way too much
    // Only really use this to tell clients when to update the data shown on the frontend
    // In a real world application it might be prudent to have different events for different actions
    event UpdateSignal(bool updated);

    // Function to remove an element from the tracker
    function remove_from_tracker(uint256 _id) private {
        for (uint256 i = 0; i < id_tracker.length; i++) {
            if (id_tracker[i] == _id) {
                // Move the last element into the place to delete and pop
                // Solidity doesn't have a pop at index method, so this had to be done manually
                id_tracker[i] = id_tracker[id_tracker.length - 1];
                id_tracker.pop();
                break;
            }
        }
        emit UpdateSignal(true);
    }

    // Function for deleting a task, also removes it from the task tracker
    function deleteTask(uint256 _id) public {
        // Makes sure the delete request is valid
        require(
            msg.sender == tasks[_id].creator,
            "You can only delete your own tasks!"
        );
        require(_id > 0 && _id <= taskCount, "Invalid task id");
        require(bytes(tasks[_id].content).length > 0, "Task already deleted");
        delete tasks[_id];
        remove_from_tracker(_id);
        emit UpdateSignal(true);
    }

    //Function to create a new task
    function createTask(string memory _content, bool _is_private) public {
        taskCount++; //Increment the task counter, so all tasks have an unique id. Part of the assignment
        tasks[taskCount] = Task(
            taskCount, // id
            _content, // content
            block.timestamp, // createdAt
            false, // completed
            0, // completedAt
            msg.sender, // creator
            _is_private // priv
        );
        id_tracker.push(taskCount);
        emit UpdateSignal(true);
    }

    //Function for toggling the completion of a specified task, you can only modify your own tasks
    function toggleCompleted(uint256 _id) public {
        require(
            msg.sender == tasks[_id].creator,
            "You can only complete your own tasks!"
        );
        tasks[_id].completed = !tasks[_id].completed;
        tasks[_id].completedAt = block.timestamp;
        emit UpdateSignal(true);
    }

    //Function for toggling the privacy of a specified task, you can only modify your own tasks
    function togglePrivate(uint256 _id) public {
        require(
            msg.sender == tasks[_id].creator,
            "You can only toggle privacy of your own tasks!"
        );
        tasks[_id].priv = !tasks[_id].priv;
        emit UpdateSignal(true);
    }

    //Function for updating the contents of a specified task, you can only modify your own tasks
    function updateTask(uint256 _id, string memory _content) public {
        require(
            msg.sender == tasks[_id].creator,
            "You can only update your own tasks!"
        );
        tasks[_id].content = _content;
        emit UpdateSignal(true);
    }

    //Deletes all the tasks the requestor has marked as completed
    function clearCompletedTasks() public {
        // Iterate backwards to avoid index issues when removing
        for (uint256 i = id_tracker.length; i > 0; i--) {
            uint256 idx = i - 1;
            if (
                tasks[id_tracker[idx]].creator == msg.sender &&
                tasks[id_tracker[idx]].completed
            ) {
                // Could technically call the deleteTask() function here, but it would require more gas
                delete tasks[id_tracker[idx]];
                remove_from_tracker(id_tracker[idx]);
            }
        }
        emit UpdateSignal(true);
    }

    //Function to get all tasks visible to the requester.
    function getTasks() public view returns (Task[] memory) {
        uint256 count = 0;
        // Only count tasks that are either public or owned by the caller
        for (uint256 i = 0; i < id_tracker.length; i++) {
            if (
                (tasks[id_tracker[i]].creator == msg.sender) ||
                (tasks[id_tracker[i]].priv == false)
            ) {
                count++;
            }
        }
        Task[] memory taskArr = new Task[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < id_tracker.length; i++) {
            // Only include public tasks or tasks owned by the caller
            if (
                (tasks[id_tracker[i]].creator == msg.sender) ||
                (tasks[id_tracker[i]].priv == false)
            ) {
                taskArr[idx] = tasks[id_tracker[i]];
                idx++;
            }
        }
        return taskArr;
    }
}
