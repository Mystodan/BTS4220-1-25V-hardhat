import React from "react";
import Task from "./Task";
import TaskPopup from "./TaskPopup";
import NavMenu from "./NavMenu";

/**
 * AppLayout is a presentational component responsible for rendering the main UI of the todo app.
 * It receives all state and handlers as props from the parent App component.
 * This keeps UI and logic separated for maintainability and clarity.
 */
const AppLayout = ({
  newTask, // Current value of the new task input field
  handleChange, // Handler for input change in new task field
  handleKeyDown, // Handler for Enter key in new task field
  activeFilter, // Current active filter (all, public, private, etc.)
  filterTasks, // Handler for filter tab clicks
  tasks, // All tasks fetched from the contract
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
}) => (
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
        />
      ))}
    </ul>
    {/* Popup for task details (shows when popupTask is set) */}
    {popupTask && (
      <TaskPopup popupTask={popupTask} onClose={() => setPopupTask(null)} />
    )}
    {/* --- PAGE NAVIGATOR (always at the bottom of the main box) --- */}
    <div className="page-navigator-wrapper" style={{
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
      position: 'absolute',
      left: 0,
      bottom: 0,
      zIndex: 2,
      background: 'transparent'
    }}>
      {totalPages > 1 ? (
        <nav className="page-navigator" style={{
          width: '100%',
          maxWidth: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '0.5rem',
          flexWrap: 'wrap',
          background: 'rgba(255,255,255,0.95)',
          borderRadius: '8px 8px 0 0',
          boxShadow: '0 -2px 8px rgba(0,0,0,0.07)',
          padding: '0.5rem 1rem',
          minHeight: '44px',
          borderTop: 'none',
          border: '1px solid #ff9800'
        }}>
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            style={{ minWidth: '3rem', padding: '0.4rem 0.8rem', borderRadius: '4px', border: '1px solid #ff9800', background: currentPage === 1 ? '#eee' : '#fff', color: '#222', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
          >
            Previous
          </button>
          {/* Render page numbers for navigation */}
          {[...Array(totalPages)].map((_, idx) => (
            <button
              key={idx + 1}
              onClick={() => setCurrentPage(idx + 1)}
              style={{
                minWidth: '2.2rem',
                fontWeight: currentPage === idx + 1 ? 'bold' : 'normal',
                background: currentPage === idx + 1 ? '#ff9800' : '#fff',
                color: currentPage === idx + 1 ? '#fff' : '#222',
                border: '1px solid #ff9800',
                borderRadius: '4px',
                cursor: currentPage === idx + 1 ? 'default' : 'pointer',
                outline: 'none',
                padding: '0.3rem 0.7rem',
                margin: '0 0.1rem'
              }}
              disabled={currentPage === idx + 1}
              aria-current={currentPage === idx + 1 ? 'page' : undefined}
            >
              {idx + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            style={{ minWidth: '3rem', padding: '0.4rem 0.8rem', borderRadius: '4px', border: '1px solid #ff9800', background: currentPage === totalPages ? '#eee' : '#fff', color: '#222', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
          >
            Next
          </button>
        </nav>
      ) : (
        <nav className="page-navigator" style={{
          width: '100%',
          maxWidth: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '0.5rem',
          flexWrap: 'wrap',
          background: 'rgba(255,255,255,0.95)',
          borderRadius: '8px 8px 0 0',
          boxShadow: '0 -2px 8px rgba(0,0,0,0.07)',
          padding: '0.5rem 1rem',
          minHeight: '44px',
          borderTop: 'none',
          color: '#888',
          fontSize: '1rem'
        }}>
          No pages
        </nav>
      )}
    </div>
  </div>
);

export default AppLayout;
