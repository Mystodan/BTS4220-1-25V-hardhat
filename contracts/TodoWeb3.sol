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
    uint256[] public id_tracker;
    uint256[] public cleardTasks;

    event TaskCreated(uint256 id, string content, bool completed);

    event TaskCompleted(uint256 id, bool completed);

    event TaskDeleted(uint256 id);

    event TasksCleared(uint256[] id_arr);

    function remove_from_tracker(uint256 _id) private {
        for (uint256 i = 0; i <= id_tracker.length - 1; i++) {
            if (id_tracker[i] == _id) {
                if (i == id_tracker.length) {
                    id_tracker.pop();
                    break;
                }
                id_tracker[i] = id_tracker.length;
                id_tracker.pop();
                break;
            }
        }
    }

    function deleteTask(uint256 _id) public {
        require(_id > 0 && _id <= taskCount, "Invalid task id");
        require(bytes(tasks[_id].content).length > 0, "Task already deleted");
        delete tasks[_id];
        remove_from_tracker(_id);
        emit TaskDeleted(_id);
    }

    function createTask(string memory _content) public {
        taskCount++;
        tasks[taskCount] = Task(taskCount, _content, false);
        id_tracker.push(taskCount);
        emit TaskCreated(taskCount, _content, false);
    }

    function toggleCompleted(uint256 _id) public {
        tasks[_id].completed = !tasks[_id].completed;
        emit TaskCompleted(_id, tasks[_id].completed);
    }

    function clearCompletedTasks() public {
        for (uint256 i = 1; i <= id_tracker.length - 1; i++) {
            if (tasks[id_tracker[i]].completed) {
                tasks[id_tracker[i]] = Task(tasks[id_tracker[i]].id, "", false);
                delete tasks[id_tracker[i]];
                cleardTasks.push(id_tracker[i]);
            }
        }
        for (uint256 i = 1; i <= cleardTasks.length - 1; i++) {
            remove_from_tracker(cleardTasks[i]);
        }
        emit TasksCleared(cleardTasks);
        delete cleardTasks;
    }
}
