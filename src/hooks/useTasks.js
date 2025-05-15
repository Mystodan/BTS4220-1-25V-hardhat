// useTasks.js
// Main hook for managing all task-related state and logic in the Todo dApp.
// Composes subhooks for fetching, filtering, actions, and input handling.

import { useState, useRef } from "react";
import { FilterType } from "./useTasksSubHooks/useTaskFiltering";
import { useTaskFetching } from "./useTasksSubHooks/useTaskFetching";
import { useTaskFiltering } from "./useTasksSubHooks/useTaskFiltering";
import { useTaskActions } from "./useTasksSubHooks/useTaskActions";
import { useTaskInputHandlers } from "./useTasksSubHooks/useTaskInputHandlers";

export { FilterType };

/**
 * useTasks
 * Centralized hook for all task state and logic in the Todo dApp.
 * Handles fetching, filtering, CRUD actions, and input events for tasks.
 *
 * @param {object} params - { provider, todoWeb3, account, setWarnPopup }
 * @returns {object} - All state and handlers needed for task management UI
 */
export function useTasks({ provider, todoWeb3, account, setWarnPopup }) {
  // --- State ---
  // All tasks fetched from the contract (after mapping/cleaning)
  const [tasks, setTasks] = useState([]);
  // Tasks after applying current filter/sort
  const [filteredTasks, setFilteredTasks] = useState([]);
  // Current filter type (public/private/all/pending/completed)
  const [activeFilter, setActiveFilter] = useState(FilterType.ALL);
  // New task input value
  const [newTask, setNewTask] = useState("");
  // Task currently being viewed/edited in a popup
  const [popupTask, setPopupTask] = useState(null);
  // Ref for the clear completed button (for focus/enable/disable)
  const clearBtnRef = useRef(null);
  // Current page for pagination
  const [currentPage, setCurrentPage] = useState(1);
  // Number of tasks per page
  const TASKS_PER_PAGE = 8;

  // --- Filtering logic ---
  // Provides applyCurrentFilter to filter and sort tasks for display
  const { applyCurrentFilter } = useTaskFiltering({ account, activeFilter, setFilteredTasks, setCurrentPage });

  // --- Fetching logic ---
  // Provides getMyTasks to fetch tasks from the contract and update state
  const { getMyTasks } = useTaskFetching({ provider, todoWeb3, setTasks, applyCurrentFilter });

  // --- Actions logic ---
  // Provides addTask, deleteTask, clearCompleted, handleToggleCompleted for contract actions
  const { addTask, deleteTask, clearCompleted, handleToggleCompleted } = useTaskActions({ provider, todoWeb3, account, setWarnPopup, tasks, setNewTask, getMyTasks });

  // --- Input handlers ---
  // Provides handlers for input changes, keydown, and form submit
  const { handleChange, handleKeyDown, handleSubmit } = useTaskInputHandlers({ setNewTask, addTask, activeFilter, FilterType });

  // --- UI Event Handler for filter changes ---
  // Updates the active filter and applies it to the current task list
  const filterTasks = (e) => {
    const filterKey = e.currentTarget.id.toUpperCase();
    setActiveFilter(FilterType[filterKey] || e.currentTarget.id);
    applyCurrentFilter(tasks, FilterType[filterKey] || e.currentTarget.id);
  };

  // --- Pagination logic ---
  // Slices filteredTasks for the current page
  let visibleTasks = filteredTasks;
  const paginatedTasks = visibleTasks.slice((currentPage - 1) * TASKS_PER_PAGE, currentPage * TASKS_PER_PAGE);
  const totalPages = Math.ceil(visibleTasks.length / TASKS_PER_PAGE);

  // --- Return unified API for use in UI components ---
  return {
    // State
    tasks,
    setTasks,
    filteredTasks,
    setFilteredTasks,
    activeFilter,
    setActiveFilter,
    newTask,
    setNewTask,
    popupTask,
    setPopupTask,
    clearBtnRef,
    currentPage,
    setCurrentPage,
    TASKS_PER_PAGE,
    // Logic
    getMyTasks,
    applyCurrentFilter,
    handleChange,
    addTask,
    deleteTask,
    clearCompleted,
    handleToggleCompleted,
    filterTasks,
    handleKeyDown,
    handleSubmit,
    paginatedTasks,
    totalPages
  };
}
