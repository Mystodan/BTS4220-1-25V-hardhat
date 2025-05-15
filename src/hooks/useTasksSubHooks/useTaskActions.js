// useTaskActions.js
// Subhook for all task-related contract actions in the Todo dApp.
// Used by the main useTasks hook to provide add, delete, clear, and toggle actions.

import { v4 as uuidv4 } from "uuid";

/**
 * useTaskActions
 * Provides functions to add, delete, clear, and toggle tasks on the blockchain.
 * Handles user-friendly error reporting and state updates after contract actions.
 *
 * @param {object} params - { provider, todoWeb3, account, setWarnPopup, tasks, setNewTask, getMyTasks }
 * @returns {object} - { addTask, deleteTask, clearCompleted, handleToggleCompleted }
 */
export function useTaskActions({ provider, todoWeb3, account, setWarnPopup, tasks, setNewTask, getMyTasks }) {
  /**
   * Adds a new task to the blockchain (public or private).
   * Shows user-friendly error popups for reverts or user cancellation.
   */
  const addTask = async (t, is_private = false) => {
    if (!t || t.trim() === "") return;
    try {
      const signer = await provider.getSigner();
      const uuid = uuidv4();
      let transaction = await todoWeb3.connect(signer).createTask(uuid, t.trim(), is_private);
      await transaction.wait();
      setNewTask("");
      await getMyTasks(todoWeb3, true);
    } catch (err) {
      if (err && (err.code === 'ACTION_REJECTED' || err.code === 4001)) {
        setWarnPopup({ open: true, message: 'Task creation cancelled by user.' });
        return;
      }
      let msg = "";
      if (err && err.error && err.error.data && err.error.data.message) {
        const match = err.error.data.message.match(/reverted with reason string '([^']+)'/);
        if (match && match[1]) msg = match[1];
      }
      if (!msg && err.reason) {
        msg = err.reason;
      }
      if (!msg && err.message) {
        const match = err.message.match(/reverted with reason string '([^']+)'/);
        if (match && match[1]) msg = match[1];
        else msg = err.message;
      }
      if (!msg) msg = String(err);
      setWarnPopup({ open: true, message: msg });
    }
  };

  /**
   * Deletes a task by ID. Only the creator can delete their public task.
   * Shows user-friendly error popups for reverts or user cancellation.
   */
  const deleteTask = async (id) => {
    try {
      const signer = await provider.getSigner();
      let transaction = await todoWeb3.connect(signer).deleteTask(id);
      await transaction.wait();
      await getMyTasks(todoWeb3);
    } catch (err) {
      let msg = "";
      if (err && err.error && err.error.data && err.error.data.message) {
        const match = err.error.data.message.match(/reverted with reason string '([^']+)'/);
        if (match && match[1]) msg = match[1];
      } else if (err && (err.code === 'ACTION_REJECTED' || err.code === 4001)) {
        setWarnPopup({ open: true, message: 'Transaction cancelled by user.' });
        return;
      }
      if (!msg && err && err.reason) {
        msg = err.reason;
      }
      if (!msg && err && err.message) {
        const match = err.message.match(/reverted with reason string '([^']+)'/);
        if (match && match[1]) msg = match[1];
        else msg = err.message;
      }
      if (!msg) msg = String(err);
      setWarnPopup({ open: true, message: msg });
    }
  };

  /**
   * Clears all completed tasks owned by the user.
   * Shows user-friendly error popups for reverts or user cancellation.
   */
  const clearCompleted = async () => {
    if (!todoWeb3 || !provider) return;
    try {
      const signer = await provider.getSigner();
      const myCompleted = tasks.filter(
        t => t.completed && t.user && account && t.user.toLowerCase() === account.toLowerCase()
      );
      if (myCompleted.length === 0) {
        setWarnPopup({ open: true, message: "No completed tasks you own to clear." });
        return;
      }
      let transaction = await todoWeb3.connect(signer).clearCompletedTasks();
      await transaction.wait();
      await getMyTasks(todoWeb3);
    } catch (err) {
      let msg = "";
      if (err && err.error && err.error.data && err.error.data.message) {
        const match = err.error.data.message.match(/reverted with reason string '([^']+)'/);
        if (match && match[1]) msg = match[1];
      } else if (err && (err.code === 'ACTION_REJECTED' || err.code === 4001)) {
        setWarnPopup({ open: true, message: 'Transaction cancelled by user.' });
        return;
      }
      if (!msg && err.reason) {
        msg = err.reason;
      }
      if (!msg && err.message) {
        const match = err.message.match(/reverted with reason string '([^']+)'/);
        if (match && match[1]) msg = match[1];
        else msg = err.message;
      }
      if (!msg) msg = String(err);
      setWarnPopup({ open: true, message: msg });
    }
  };

  /**
   * Toggles the completion status of a task by ID.
   * Shows user-friendly error popups for reverts or user cancellation.
   */
  const handleToggleCompleted = async (id) => {
    if (!todoWeb3 || !provider) return;
    try {
      const signer = await provider.getSigner();
      let transaction = await todoWeb3.connect(signer).toggleCompleted(id);
      await transaction.wait();
      await getMyTasks(todoWeb3);
    } catch (err) {
      let msg = "";
      if (err && err.error && err.error.data && err.error.data.message) {
        const match = err.error.data.message.match(/reverted with reason string '([^']+)'/);
        if (match && match[1]) msg = match[1];
      } else if (err && (err.code === 'ACTION_REJECTED' || err.code === 4001)) {
        setWarnPopup({ open: true, message: 'Transaction cancelled by user.' });
        return;
      }
      if (!msg && err.reason) {
        msg = err.reason;
      }
      if (!msg && err.message) {
        const match = err.message.match(/reverted with reason string '([^']+)'/);
        if (match && match[1]) msg = match[1];
        else msg = err.message;
      }
      if (!msg) msg = String(err);
      setWarnPopup({ open: true, message: msg });
    }
  };

  return { addTask, deleteTask, clearCompleted, handleToggleCompleted };
}
