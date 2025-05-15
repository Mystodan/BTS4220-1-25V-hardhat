import React, { useState } from "react";
import Task from "./Task";
import ViewTaskPopup from "./popups/ViewTaskPopup";
import NavMenu from "./bars/NavMenu";
import EditTaskPopup from "./popups/EditTaskPopup";
import PageNavigator from "./bars/PageNavigator";

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
    maxTasks, // Maximum number of tasks allowed
    currentPage, // Current page for pagination
    setCurrentPage, // Setter for current page
    totalPages // Total number of pages for pagination
  } = props;
  // Add state for editing popup
  const [editTask, setEditTask] = useState(null);

  return (
    <div className="wrapper" style={{
      minHeight: '700px', // Ensures enough space for tasks, nav, and pagination
      maxHeight: '900px', // Prevents the box from growing too large
      height: '800px',    // Fixed height for consistent layout
      overflow: 'auto',   // Scroll if content overflows
      boxSizing: 'border-box',
      position: 'relative' // Added for absolute positioning of page navigator
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
          disabled={tasks.filter(task => task.user && account && task.user.toLowerCase() === account.toLowerCase()).length >= (maxTasks || 8)}
        />
        {/* Show a warning if max tasks reached */}
        {tasks.filter(task => task.user && account && task.user.toLowerCase() === account.toLowerCase()).length >= (maxTasks || 8) && (
          <div style={{ color: 'red', fontSize: '0.95rem', marginTop: '0.5rem' }}>
            You have reached the maximum of {maxTasks || 8} tasks.
          </div>
        )}
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
          style={{ visibility: 'visible', opacity: filteredTasks.some(t => t.completed) ? 1 : 0.5, pointerEvents: 'auto', zIndex: 1000 }}
          className={`clear-btn active${!filteredTasks.some(t => t.completed) ? " disabled" : ""}`}
          disabled={!filteredTasks.some(t => t.completed)}
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
      <div className="filters" style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
        {/* Sort tasks by ID ascending */}
        <span
          onClick={() => {
            setFilteredTasks([...filteredTasks].sort((a, b) => Number(a.id) - Number(b.id)));
          }}
          style={{ marginLeft: '1rem', cursor: 'pointer', fontWeight: 'bold', color: '#ff9800' }}
        >
          ID
        </span>
        {/* Sort tasks A-Z */}
        <span
          onClick={() => {
            setFilteredTasks([...filteredTasks].sort((a, b) => a.content.localeCompare(b.content)));
          }}
          style={{ cursor: 'pointer', fontWeight: 'bold', color: '#ff9800' }}
        >
          A-Z
        </span>
        {/* Sort tasks Z-A */}
        <span
          onClick={() => {
            setFilteredTasks([...filteredTasks].sort((a, b) => b.content.localeCompare(a.content)));
          }}
          style={{ marginLeft: '1rem', cursor: 'pointer', fontWeight: 'bold', color: '#ff9800' }}
        >
          Z-A
        </span>
      </div>
      {/* List of tasks (filtered and sorted, paginated) */}
      <ul className="task-box">
        {filteredTasks.map((task, index) => (
          <Task
            task={task}
            todoWeb3={todoWeb3}
            provider={provider}
            id={task.id}
            key={task.id}
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
    </div>
  );
};

export default AppLayout;
