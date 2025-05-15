// useTaskFiltering.js
// Subhook for filtering and sorting tasks in the Todo dApp.
// Used by the main useTasks hook to provide robust filtering and sorting logic.

/**
 * Enum for all supported filter types for tasks.
 * PRIVATE: Only user's private tasks
 * PUBLIC: All public tasks
 * ALL: All tasks visible to the user
 * PENDING: All incomplete tasks
 * COMPLETED: All completed tasks
 */
export const FilterType = Object.freeze({
    PRIVATE: "private",
    PUBLIC: "public",
    ALL: "all",
    PENDING: "pending",
    COMPLETED: "completed"
});

/**
 * useTaskFiltering
 * Provides filtering and sorting logic for the task list.
 *
 * @param {object} params - { account, activeFilter, setFilteredTasks, setCurrentPage }
 * @returns {object} - { applyCurrentFilter, filterTasksByType, sortByDateDesc }
 */
export function useTaskFiltering({ account, activeFilter, setFilteredTasks, setCurrentPage }) {
  // Sorts tasks by creation date, newest first
  const sortByDateDesc = arr => arr.slice().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  // Filters tasks by the selected filter type and user account
  const filterTasksByType = (tasksArr, filter, account) => {
    if (filter === FilterType.PRIVATE) {
      return tasksArr.filter(
        (task) => task.is_private && task.user && account && task.user.toLowerCase() === account.toLowerCase()
      );
    } else if (filter === FilterType.PUBLIC) {
      return tasksArr.filter((task) => !task.is_private);
    } else if (filter === FilterType.ALL) {
      return tasksArr.filter(
        (task) =>
          !task.is_private ||
          (task.is_private && task.user && account && task.user.toLowerCase() === account.toLowerCase())
      );
    } else if (filter === FilterType.PENDING) {
      return tasksArr.filter(
        (task) =>
          !task.completed &&
          (!task.is_private || (task.is_private && task.user && account && task.user.toLowerCase() === account.toLowerCase()))
      );
    } else if (filter === FilterType.COMPLETED) {
      return tasksArr.filter(
        (task) =>
          task.completed &&
          (!task.is_private || (task.is_private && task.user && account && task.user.toLowerCase() === account.toLowerCase()))
      );
    }
    return tasksArr;
  };

  /**
   * Applies the current filter and sort to the provided task list, updates filteredTasks state.
   * Optionally resets pagination to page 1.
   */
  const applyCurrentFilter = (tasksArr, filterOverride, keepPage = false) => {
    const filter = filterOverride || activeFilter;
    let filtered = filterTasksByType(tasksArr, filter, account);
    filtered = sortByDateDesc(filtered);
    setFilteredTasks(filtered);
    if (!keepPage) setCurrentPage(1);
  };

  return { applyCurrentFilter, filterTasksByType, sortByDateDesc };
}
