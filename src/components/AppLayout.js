import React, { useState, useEffect } from "react";
import Task from "./ui_element/TaskMenu";
import ViewTaskPopup from "./popups/ViewTaskPopup";
import EditTaskPopup from "./popups/EditTaskPopup";
import NavMenu from "./ui_element/NavMenu";
import PageNavigator from "./ui_element/PageNavigator";
import SettingsButton from "./ui_element/SettingsButton";
import SettingsPopup from "./popups/SettingsPopup";
import FilterNavigator from "./ui_element/FilterNavigator";
import WarnPopup from "./popups/WarnPopup";
import "../theme.css";

/**
 * AppLayout is a presentational component responsible for rendering the main UI of the todo app.
 * It receives all state and handlers as props from the parent App component.
 * This keeps UI and logic separated for maintainability and clarity.
 */
const AppLayout = (props) => {
  const {
    newTask, // Current value of the new task input field
    handleChange, // Handler for input change in new task field
    handleKeyDown, // Handler for Enter key in new task field
    activeFilter, // Current active filter (all, public, private, etc.)
    filterTasks, // Handler for filter tab clicks
    tasks, // All tasks fetched from the contract
    setTasks, // Setter for tasks
    setActiveFilter, // Setter for active filter
    setFilteredTasks, // Setter for filtered tasks
    account, // Current connected wallet/account
    filteredTasks, // Tasks after applying the current filter
    clearBtnRef, // Ref for the clear completed button
    clearCompleted, // Handler to clear all completed tasks
    deleteTask, // Handler to delete a task
    todoWeb3, // Contract instance
    provider, // Blockchain provider
    setPopupTask, // Setter for the popup task (for showing details)
    popupTask, // The currently selected task for the popup
    currentPage, // Current page for pagination
    setCurrentPage, // Setter for current page
    totalPages, // Total number of pages for pagination
    paginatedTasks // Tasks after applying pagination
  } = props;
  // Add state for editing popup
  const [editTask, setEditTask] = useState(null);
  // WarnPopup state from logic hook
  const { warnPopup, setWarnPopup } = props;
  const [showSettings, setShowSettings] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem('darkMode');
    return stored ? stored === 'true' : false;
  });
  const [dateSortAsc, setDateSortAsc] = useState(true);
  const [alphaSortAsc, setAlphaSortAsc] = useState(true);
  const [activeSort, setActiveSort] = useState('date');

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  // Debug output for task visibility
  console.log("[DEBUG] Account:", account);
  console.log("[DEBUG] tasks.length:", tasks.length, tasks.map(t => t.uuid));
  console.log("[DEBUG] filteredTasks.length:", filteredTasks.length, filteredTasks.map(t => t.uuid));
  console.log("[DEBUG] paginatedTasks.length:", paginatedTasks.length, paginatedTasks.map(t => t.uuid));

  return (
    <div className={darkMode ? "wrapper darkmode" : "wrapper"} style={{
      minHeight: '700px', // Ensures enough space for tasks, nav, and pagination
      maxHeight: '900px', // Prevents the box from growing too large
      height: '800px',    // Fixed height for consistent layout
      overflow: 'auto',   // Scroll if content overflows
      boxSizing: 'border-box',
      position: 'relative', // Added for absolute positioning of page navigator
      transition: 'background 0.3s, color 0.3s'
    }}>
      {/* Input for adding a new task */}
      <div className="task-input">
        {/* Icon for the input field */}
        <ion-icon name="create-outline">🎙️</ion-icon>
        <input
          id="newTask"
          type="text"
          className="form-control"
          placeholder="Type a task and Enter"
          value={newTask}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          required
          maxLength={100}
        />
        {/* Remove max length warning */}
        {/* Separator line under the max length warning */}
        <hr style={{ margin: '1rem 0', border: 'none', borderTop: '1.5px solid #e0e0e0', width: '100%' }} />
      </div>
      {/* Controls for filtering and clearing tasks */}
      <div className="controls">
        {/* Navigation menu for filters (moved to NavMenu) */}
        <NavMenu
          activeFilter={activeFilter}
          filterTasks={filterTasks}
          tasks={tasks}
          setActiveFilter={setActiveFilter}
          setFilteredTasks={setFilteredTasks}
          account={account}
        />
        {/* Button to clear all completed tasks (disabled if none are completed) */}
        <button
          ref={clearBtnRef}
          type="button"
          tabIndex={0}
          className={`clear-btn active${!tasks.some(t => t.completed && t.user && account && t.user.toLowerCase() === account.toLowerCase()) ? " disabled" : ""}`}
          disabled={!tasks.some(t => t.completed && t.user && account && t.user.toLowerCase() === account.toLowerCase())}
          onClick={e => {
            console.log('DEBUG: onClick handler fired');
            console.log('Clear completed button clicked');
            clearCompleted();
          }}
        >
          Clear completed
        </button>
      </div>
      {/* Alphabetic sort/filter bar for tasks */}
      <FilterNavigator
        filteredTasks={filteredTasks}
        setFilteredTasks={setFilteredTasks}
        dateSortAsc={dateSortAsc}
        setDateSortAsc={setDateSortAsc}
        alphaSortAsc={alphaSortAsc}
        setAlphaSortAsc={setAlphaSortAsc}
        activeSort={activeSort}
        setActiveSort={setActiveSort}
      />
      {/* List of tasks (filtered and sorted, paginated) */}
      <ul className="task-box">
        {paginatedTasks.map((task, index) => (
          <Task
            task={task}
            todoWeb3={todoWeb3}
            provider={provider}
            key={task.uuid}
            onDelete={deleteTask}
            onClick={e => {
              // Only open popup if the click is not on the checkbox or menu
              if (
                e.target.tagName === 'INPUT' ||
                e.target.closest('.settings')
              ) return;
              setPopupTask(task);
            }}
            onEdit={setEditTask}
            handleToggleCompleted={props.handleToggleCompleted}
            account={account}
          />
        ))}
      </ul>
      {/* Details popup (view mode) */}
      {popupTask && (
        <ViewTaskPopup
          task={popupTask}
          onClose={() => setPopupTask(null)}
        />
      )}
      {/* Edit popup (edit mode) */}
      {editTask && (
        <EditTaskPopup
          task={editTask}
          onClose={() => setEditTask(null)}
          todoWeb3={todoWeb3}
          provider={provider}
          account={account}
          reloadTasks={async () => {
            if (todoWeb3) {
              const myTasks = await todoWeb3.getMyTasks();
              const mappedTasks = myTasks.map(task => ({
                ...task,
                id: task.id && task.id._isBigNumber ? Number(task.id) : task.id,
                createdAt: task.createdAt && task.createdAt._isBigNumber ? Number(task.createdAt) : (typeof task.createdAt === 'number' ? task.createdAt : undefined),
                completedAt: task.completedAt && task.completedAt._isBigNumber ? Number(task.completedAt) : (typeof task.completedAt === 'number' ? task.completedAt : undefined)
              }));
              if (typeof setFilteredTasks === 'function') {
                setTasks(mappedTasks);
                setFilteredTasks(mappedTasks);
              }
            }
          }}
        />
      )}
      {/* --- PAGE NAVIGATOR (always at the bottom of the main box) --- */}
      <PageNavigator
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
      />
      <SettingsButton onClick={() => setShowSettings(true)} darkMode={darkMode} pressed={showSettings} />
      <SettingsPopup show={showSettings} onClose={() => setShowSettings(false)} darkMode={darkMode} setDarkMode={setDarkMode} />
      {/* WarnPopup for error/warning display */}
      <WarnPopup open={warnPopup.open} onClose={() => setWarnPopup({ open: false, message: "" })} warning={warnPopup.message} />
    </div>
  );
};

export default AppLayout;
