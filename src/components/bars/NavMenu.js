import React from "react";

/**
 * NavMenu component
 * -----------------
 * Renders the filter navigation menu for the todo app.
 * Handles switching between all, public, private, pending, and completed filters.
 *
 * Props:
 *   activeFilter: current filter string
 *   filterTasks: handler for filter tab clicks
 *   tasks: all tasks
 *   setActiveFilter: setter for active filter
 *   setFilteredTasks: setter for filtered tasks
 *   account: current user account
 */
const NavMenu = ({ activeFilter, filterTasks, tasks, setActiveFilter, setFilteredTasks, account }) => (
  <div className="filters" style={{
    display: 'flex',
    alignItems: 'center',
    minHeight: '2.5rem', // Just barely bigger than the filter elements
    height: '2.5rem',
    gap: '0.75rem',
    marginBottom: '0.5rem',
    padding: 0
  }}>
    {/* Filter: All tasks */}
    <span
      onClick={filterTasks}
      className={activeFilter === "all" ? "active" : ""}
      id="all"
    >
      All
    </span>
    {/* Filter: Toggle between public and private tasks */}
    <span
      onClick={() => {
        const next = activeFilter === "public" ? "private" : "public";
        setActiveFilter(next);
        setFilteredTasks(
          tasks.filter(task =>
            next === "private"
              ? task.is_private && task.user && account && task.user.toLowerCase() === account.toLowerCase()
              : !task.is_private
          )
        );
      }}
      className={activeFilter === "public" || activeFilter === "private" ? "active" : ""}
      id="privacy-toggle"
      style={{ marginLeft: '1rem', cursor: 'pointer' }}
      tabIndex={0}
      role="button"
      aria-pressed={activeFilter === "public" || activeFilter === "private"}
    >
      {activeFilter === "private" ? "Private" : "Public"}
    </span>
    {/* Filter: Pending (not completed) tasks */}
    <span
      onClick={filterTasks}
      className={activeFilter === "pending" ? "active" : ""}
      id="pending"
    >
      Pending
    </span>
    {/* Filter: Completed tasks */}
    <span
      onClick={filterTasks}
      className={activeFilter === "completed" ? "active" : ""}
      id="completed"
    >
      Completed
    </span>
  </div>
);

export default NavMenu;
