import { useEffect, useState, useRef } from "react";
import { ethers } from "ethers";

// Components
//import Navigation from "./components/Navigation";
import Task from "./components/Task";
import BackgroundVideo from "./components/BackgroundVideo";
import TaskPopup from "./components/popups/ViewTaskPopup";
import AppLayout from "./components/AppLayout";
//import Logic from "./components/logic";

// ABIs
import TodoWeb3 from "./abis/TodoWeb3.json";

// Config
import config from "./config.json";
import "./popup.css";

// Add background video CSS
import "./backgroundVideo.css";
import { useTodoLogic } from "./hooks/useTodoLogic";

function App() {
    const {
        provider,
        account,
        todoWeb3,
        taskCount,
        tasks,
        setTasks,
        activeFilter,
        setActiveFilter,
        filteredTasks,
        setFilteredTasks,
        newTask,
        setNewTask,
        popupTask,
        setPopupTask,
        clearBtnRef,
        currentPage,
        setCurrentPage,
        MAX_TASKS,
        checkOrRequestWalletConnection,
        loadBlockchainData,
        getMyTasks,
        applyCurrentFilter,
        handleChange,
        addTask,
        deleteTask,
        clearCompleted,
        filterTasks,
        handleKeyDown,
        handleSubmit,
        paginatedTasks,
        totalPages
    } = useTodoLogic();

    return (
        <>
            <BackgroundVideo />
            <AppLayout
                newTask={newTask}
                handleChange={handleChange}
                handleKeyDown={handleKeyDown}
                activeFilter={activeFilter}
                filterTasks={filterTasks}
                tasks={tasks}
                setTasks={setTasks}
                setActiveFilter={setActiveFilter}
                setFilteredTasks={setFilteredTasks}
                account={account}
                filteredTasks={paginatedTasks}
                clearBtnRef={clearBtnRef}
                clearCompleted={clearCompleted}
                deleteTask={deleteTask}
                todoWeb3={todoWeb3}
                provider={provider}
                setPopupTask={setPopupTask}
                popupTask={popupTask}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                totalPages={totalPages}
                maxTasks={MAX_TASKS}
            />
        </>
    );
}

export default App;
