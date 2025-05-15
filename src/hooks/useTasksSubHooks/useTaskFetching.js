// useTaskFetching.js
// Subhook for fetching and mapping tasks from the TodoWeb3 contract.
// Used by the main useTasks hook to keep the task list in sync with the blockchain.

/**
 * useTaskFetching
 * Provides a function to fetch the user's tasks from the contract, filter out deleted tasks,
 * map BigNumber fields to numbers, and update the main task state.
 *
 * @param {object} params - { provider, todoWeb3, setTasks, applyCurrentFilter }
 * @returns {object} - { getMyTasks } function to fetch and update tasks
 */
export function useTaskFetching({ provider, todoWeb3, setTasks, applyCurrentFilter }) {
  /**
   * Fetches tasks from the contract, filters out deleted ones, maps fields, and updates state.
   * Also applies the current filter to the new task list.
   * @param {object} todoWeb3Instance - ethers.js contract instance
   * @param {boolean} keepPage - If true, keeps the current pagination page
   */
  const getMyTasks = async (todoWeb3Instance, keepPage = false) => {
    if (!provider || !todoWeb3Instance) return;
    const signer = provider.getSigner();
    const myTasks = await todoWeb3Instance.connect(signer).getMyTasks();
    // Filter out deleted tasks (content === "")
    const filtered = myTasks.filter(task => task.content && task.content !== "");
    // Map BigNumber fields to numbers for easier use in JS
    const mappedTasks = filtered.map(task => ({
      ...task,
      createdAt: task.createdAt && task.createdAt._isBigNumber ? Number(task.createdAt) : (typeof task.createdAt === 'number' ? task.createdAt : undefined),
      completedAt: task.completedAt && task.completedAt._isBigNumber ? Number(task.completedAt) : (typeof task.completedAt === 'number' ? task.completedAt : undefined)
    }));
    setTasks(mappedTasks);
    applyCurrentFilter(mappedTasks, undefined, keepPage);
  };
  return { getMyTasks };
}
