// useTaskInputHandlers.js
// Subhook for handling input and UI event handlers for tasks in the Todo dApp.
// Used by the main useTasks hook to provide input change, keydown, and submit logic.

/**
 * useTaskInputHandlers
 * Provides handlers for task input changes, Enter key, and form submission.
 *
 * @param {object} params - { setNewTask, addTask, activeFilter, FilterType }
 * @returns {object} - { handleChange, handleKeyDown, handleSubmit }
 */
export function useTaskInputHandlers({ setNewTask, addTask, activeFilter, FilterType }) {
  /**
   * Updates the new task input value in state.
   */
  const handleChange = (e) => setNewTask(e.currentTarget.value);

  /**
   * Handles Enter key in the task input. Adds a new task if input is not empty.
   */
  const handleKeyDown = async (e) => {
    if (e.key === "Enter") {
      const inputTask = e.currentTarget.value;
      const isPrivate = activeFilter === FilterType.PRIVATE;
      if (inputTask.trim() === "") return;
      await addTask(inputTask, isPrivate);
    }
  };

  /**
   * Handles form submission for adding a new task.
   */
  const handleSubmit = async (e, newTask) => {
    e.preventDefault();
    const isPrivate = activeFilter === FilterType.PRIVATE;
    await addTask(newTask, isPrivate);
  };

  return { handleChange, handleKeyDown, handleSubmit };
}
