// useTaskEvents.js
// Hook for subscribing to TodoWeb3 contract events and triggering UI updates.
// Ensures the frontend stays in sync with the blockchain in real time.

import { useEffect } from "react";

/**
 * useTaskEvents
 * Subscribes to contract events (TaskCreated, TaskCompleted, TaskDeleted, TasksCleared)
 * and triggers a refresh of the user's tasks when relevant events occur.
 *
 * @param {object} todoWeb3 - ethers.js contract instance
 * @param {string} account - Current user account
 * @param {string} activeFilter - Current filter type
 * @param {function} getMyTasks - Function to refresh tasks from the contract
 */
export function useTaskEvents(todoWeb3, account, activeFilter, getMyTasks) {
  useEffect(() => {
    if (!todoWeb3) return;
    // Event handler for TaskCreated
    const onTaskCreated = (id, content, completed, event) => {
      if (event && event.args && event.address === todoWeb3.address) getMyTasks(todoWeb3);
    };
    // Event handler for TaskCompleted
    const onTaskCompleted = (id, completed, event) => {
      if (event && event.args && event.address === todoWeb3.address) getMyTasks(todoWeb3);
    };
    // Event handler for TaskDeleted
    const onTaskDeleted = (id, event) => {
      if (event && event.args && event.address === todoWeb3.address) getMyTasks(todoWeb3);
    };
    // Event handler for TasksCleared
    const onTasksCleared = (id_arr, event) => {
      if (event && event.args && event.address === todoWeb3.address) getMyTasks(todoWeb3);
    };
    // Subscribe to contract events
    todoWeb3.on("TaskCreated", onTaskCreated);
    todoWeb3.on("TaskCompleted", onTaskCompleted);
    todoWeb3.on("TaskDeleted", onTaskDeleted);
    todoWeb3.on("TasksCleared", onTasksCleared);
    // Cleanup event listeners on unmount or dependency change
    return () => {
      todoWeb3.off("TaskCreated", onTaskCreated);
      todoWeb3.off("TaskCompleted", onTaskCompleted);
      todoWeb3.off("TaskDeleted", onTaskDeleted);
      todoWeb3.off("TasksCleared", onTasksCleared);
    };
  }, [todoWeb3, account, activeFilter, getMyTasks]);
}
