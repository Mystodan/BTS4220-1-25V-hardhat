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
        totalPages, // Total number of pages for pagination
        setUsername, //setUsername Function
        getMyTasks,
        usernames,
    } = props;
    // Add state for editing popup
    const [editTask, setEditTask] = useState(null);
    // Add state for dropdown toggle
    const [showDropdown, setShowDropdown] = useState(false);

    const localCreateTask = async (is_private = false) => {
        const textField = document.getElementById("newTask");
        if (textField.value == "") return;
        const signer = await provider.getSigner();
        let transaction = await todoWeb3
            .connect(signer)
            .createTask(textField.value, is_private);
        await transaction.wait();
        textField.value = "";
        await getMyTasks(todoWeb3);
    };

    return (
        <div
            className="wrapper"
            style={{
                minHeight: "700px", // Ensures enough space for tasks, nav, and pagination
                maxHeight: "900px", // Prevents the box from growing too large
                height: "800px", // Fixed height for consistent layout
                overflow: "auto", // Scroll if content overflows
                boxSizing: "border-box",
                position: "relative", // Added for absolute positioning of page navigator
            }}
        >
            {/* Input for adding a new task */}
            <div
                className="task-input"
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    position: "relative",
                    width: "100%",
                    gap: "0.5rem",
                }}
            >
                {/* Icon for the input field */}
                <ion-icon
                    name="create-outline"
                    style={{ marginRight: "0.5rem", flexShrink: 0 }}
                >
                    🎙️
                </ion-icon>
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
                    style={{ flex: 1, minWidth: 0, width: "auto" }}
                    disabled={
                        tasks.filter(
                            (task) =>
                                task.user &&
                                account &&
                                task.user.toLowerCase() ===
                                    account.toLowerCase()
                        ).length >= (maxTasks || 8)
                    }
                />
                {/* Dropdown toggle button */}
                <button
                    type="button"
                    style={{
                        marginLeft: "0.5rem",
                        height: "38px",
                        minWidth: "38px",
                        background: "#ff9800",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: "1.2rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        padding: 0,
                    }}
                    onClick={() => setShowDropdown((prev) => !prev)}
                    aria-label="Show options"
                >
                    ...
                </button>
                {/* Dropdown menu for options */}
                {showDropdown && (
                    <div
                        style={{
                            position: "absolute",
                            top: "110%",
                            right: 0,
                            background: "#fff",
                            border: "1px solidrgba(255, 153, 0, 0.36)",
                            borderRadius: "6px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                            marginTop: "0.5rem",
                            zIndex: 1001,
                            minWidth: "160px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.5rem",
                            padding: "0.75rem 1rem",
                        }}
                    >
                        <button
                            type="button"
                            style={{ width: "100%" }}
                            onClick={() => localCreateTask(false)}
                        >
                            Post Public
                        </button>
                        <button
                            type="button"
                            style={{ width: "100%" }}
                            onClick={() => localCreateTask(true)}
                        >
                            Post Private
                        </button>
                        <button
                            type="button"
                            style={{ width: "100%" }}
                            onClick={() => setUsername()}
                        >
                            Set Username
                        </button>
                    </div>
                )}
                {/* Show a warning if max tasks reached */}
                {tasks.filter(
                    (task) =>
                        task.user &&
                        account &&
                        task.user.toLowerCase() === account.toLowerCase()
                ).length >= (maxTasks || 8) && (
                    <div
                        style={{
                            color: "red",
                            fontSize: "0.95rem",
                            marginTop: "0.5rem",
                        }}
                    >
                        You have reached the maximum of {maxTasks || 8} tasks.
                    </div>
                )}
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
                    style={{
                        visibility: "visible",
                        opacity: filteredTasks.some((t) => t.completed)
                            ? 1
                            : 0.5,
                        pointerEvents: "auto",
                        zIndex: 1000,
                    }}
                    className={`clear-btn active${
                        !filteredTasks.some((t) => t.completed)
                            ? " disabled"
                            : ""
                    }`}
                    disabled={!filteredTasks.some((t) => t.completed)}
                >
                    Clear completed
                </button>
            </div>
            {/* Alphabetic sort/filter bar for tasks */}
            <div
                className="filters"
                style={{ marginTop: "0.5rem", marginBottom: "0.5rem" }}
            >
                {/* Sort tasks by ID ascending */}
                <span
                    onClick={() => {
                        setFilteredTasks(
                            [...filteredTasks].sort(
                                (a, b) => Number(a.id) - Number(b.id)
                            )
                        );
                    }}
                    style={{
                        marginLeft: "1rem",
                        cursor: "pointer",
                        fontWeight: "bold",
                        color: "#ff9800",
                    }}
                >
                    ID
                </span>
                {/* Sort tasks A-Z */}
                <span
                    onClick={() => {
                        setFilteredTasks(
                            [...filteredTasks].sort((a, b) =>
                                a.content.localeCompare(b.content)
                            )
                        );
                    }}
                    style={{
                        cursor: "pointer",
                        fontWeight: "bold",
                        color: "#ff9800",
                    }}
                >
                    A-Z
                </span>
                {/* Sort tasks Z-A */}
                <span
                    onClick={() => {
                        setFilteredTasks(
                            [...filteredTasks].sort((a, b) =>
                                b.content.localeCompare(a.content)
                            )
                        );
                    }}
                    style={{
                        marginLeft: "1rem",
                        cursor: "pointer",
                        fontWeight: "bold",
                        color: "#ff9800",
                    }}
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
                        onClick={(e) => {
                            // Only open popup if the click is not on the checkbox or menu
                            if (
                                e.target.tagName === "INPUT" ||
                                e.target.closest(".settings")
                            )
                                return;
                            setPopupTask(task);
                        }}
                        onEdit={setEditTask}
                        usernames={usernames}
                    />
                ))}
            </ul>
            {/* Details popup (view mode) */}
            {popupTask && (
                <ViewTaskPopup
                    task={popupTask}
                    onClose={() => setPopupTask(null)}
                    usernames={usernames}
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
                            const mappedTasks = myTasks.map((task) => ({
                                ...task,
                                id:
                                    task.id && task.id._isBigNumber
                                        ? Number(task.id)
                                        : task.id,
                                createdAt:
                                    task.createdAt &&
                                    task.createdAt._isBigNumber
                                        ? Number(task.createdAt)
                                        : typeof task.createdAt === "number"
                                        ? task.createdAt
                                        : undefined,
                                completedAt:
                                    task.completedAt &&
                                    task.completedAt._isBigNumber
                                        ? Number(task.completedAt)
                                        : typeof task.completedAt === "number"
                                        ? task.completedAt
                                        : undefined,
                            }));
                            if (typeof setFilteredTasks === "function") {
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
