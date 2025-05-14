// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

contract TodoWeb3 {
    uint256 public taskCount = 0;

    struct Task {
        uint256 id;
        string content;
        bool completed;
    }

    mapping(uint256 => Task) public tasks;


    event TaskCreated(uint256 id, string content, bool completed);

    event TaskCompleted(uint256 id, bool completed);

    event TaskDeleted(uint256 id);

    function deleteTask(uint256 _id) public {
        require(_id > 0 && _id <= taskCount, "Invalid task id");
        require(bytes(tasks[_id].content).length > 0, "Task already deleted");
        
        delete tasks[_id];
        emit TaskDeleted(_id);
    }
    
    function createTask(string memory _content) public {
        taskCount++;
        tasks[taskCount] = Task(taskCount, _content, false);
        emit TaskCreated(taskCount, _content, false);
    }

    function toggleCompleted(uint256 _id) public {
        tasks[_id].completed = !tasks[_id].completed;
        emit TaskCompleted(_id, tasks[_id].completed);
    }

    function clearCompletedTasks() public {
        for (uint256 i = 1; i <= taskCount; i++) {
            if (tasks[i].completed) {
                tasks[i] = Task(tasks[i].id, "", false);
                emit TaskDeleted(tasks[i].id);
                delete tasks[i];
            }
        }
    }
}
