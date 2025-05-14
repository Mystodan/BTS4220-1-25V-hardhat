import { useEffect, useState, useRef } from "react";
import { ethers } from "ethers";

// Components
//import Navigation from "./components/Navigation";
import Task from "./components/Task";
import BackgroundVideo from "./components/BackgroundVideo";
import TaskPopup from "./components/TaskPopup";
import AppLayout from "./components/AppLayout";
//import Logic from "./components/logic";

// ABIs
import TodoWeb3 from "./abis/TodoWeb3.json";

// Config
import config from "./config.json";
import "./popup.css";

// Add background video CSS
import "./backgroundVideo.css";

function App() {
    // State for blockchain provider (ethers.js)
    const [provider, setProvider] = useState(null);
    // State for connected wallet/account address
    const [account, setAccount] = useState(null);
    // State for TodoWeb3 contract instance
    const [todoWeb3, setTodoWeb3] = useState(null);
    // State for total task count (not always used)
    const [taskCount, setTaskCount] = useState(null);

    // State for all tasks fetched from the contract
    const [tasks, setTasks] = useState([]);
    // State for which filter is active (all, public, private, etc.)
    const [activeFilter, setActiveFilter] = useState("all");
    // State for tasks after applying the current filter
    const [filteredTasks, setFilteredTasks] = useState([]);
    // State for the new task input field
    const [newTask, setNewTask] = useState("");
    // State for the currently selected task in the popup
    const [popupTask, setPopupTask] = useState(null);

    // Ref for the clear completed button (for debugging/UI state)
    const clearBtnRef = useRef(null);

    // State for current page in pagination
    const [currentPage, setCurrentPage] = useState(1);
    // Max allowed tasks per user
    const MAX_TASKS = 8;
    // Number of tasks per page
    const TASKS_PER_PAGE = 8;

    // Checks if a wallet is connected, and requests connection if not
    const checkOrRequestWalletConnection = async () => {
        if (window.ethereum) {
            // Check for existing accounts
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts && accounts.length > 0) {
                setAccount(accounts[0]);
                return true;
            } else {
                // No wallet connected, request connection
                try {
                    const reqAccounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                    if (reqAccounts && reqAccounts.length > 0) {
                        setAccount(reqAccounts[0]);
                        return true;
                    }
                } catch (err) {
                    setAccount(null);
                    return false;
                }
            }
        } else {
            setAccount(null);
            return false;
        }
    };

    // On mount, check or request wallet connection
    useEffect(() => {
        checkOrRequestWalletConnection();
    }, []);

    // Fetches all tasks for the connected user from the contract
    const getMyTasks = async (todoWeb3) => {
        // Call the contract's getMyTasks method
        const myTasks = await todoWeb3.getMyTasks();
        // Map BigNumber fields to JS numbers for createdAt and completedAt, and ensure all fields are primitive
        const mappedTasks = myTasks.map(task => ({
            ...task,
            id: task.id && task.id._isBigNumber ? Number(task.id) : task.id,
            createdAt: task.createdAt && task.createdAt._isBigNumber ? Number(task.createdAt) : (typeof task.createdAt === 'number' ? task.createdAt : undefined),
            completedAt: task.completedAt && task.completedAt._isBigNumber ? Number(task.completedAt) : (typeof task.completedAt === 'number' ? task.completedAt : undefined)
        }));
        setTasks(mappedTasks);
        applyCurrentFilter(mappedTasks);
        setCurrentPage(1); // Reset to first page on reload
    };

    // Loads blockchain data: connects wallet, sets provider, loads contract, fetches tasks
    const loadBlockchainData = async () => {
        // Request wallet connection
        await window.ethereum.request({ method: "eth_requestAccounts" });
        // Create ethers.js provider
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(provider);
        // Get current network
        const network = await provider.getNetwork();

        // Load TodoWeb3 contract instance for the current network
        const todoWeb3 = new ethers.Contract(
            config[network.chainId].TodoWeb3.address,
            TodoWeb3,
            provider
        );
        setTodoWeb3(todoWeb3);
        // Set account after connection
        const accounts = await provider.listAccounts();
        if (accounts && accounts.length > 0) setAccount(accounts[0]);
        // Fetch tasks for the connected account
        await getMyTasks(todoWeb3);
    };

    // Applies the current filter to the tasks array and updates filteredTasks
    const applyCurrentFilter = (tasksArr) => {
        let filteredTasks = tasksArr;
        if (activeFilter === "private") {
            // Only show private tasks belonging to the current user
            filteredTasks = tasksArr.filter(
                (task) => task.is_private && task.user && account && task.user.toLowerCase() === account.toLowerCase()
            );
        } else if (activeFilter === "public") {
            // Only show public tasks
            filteredTasks = tasksArr.filter(
                (task) => !task.is_private
            );
        } else if (activeFilter === "all") {
            // Show all public tasks and private tasks belonging to the user
            filteredTasks = tasksArr.filter(
                (task) =>
                    !task.is_private ||
                    (task.is_private && task.user && account && task.user.toLowerCase() === account.toLowerCase())
            );
        } else if (activeFilter === "pending") {
            // Show only pending (not completed) tasks
            filteredTasks = tasksArr.filter(
                (task) =>
                    !task.completed &&
                    (!task.is_private || (task.is_private && task.user && account && task.user.toLowerCase() === account.toLowerCase()))
            );
        } else if (activeFilter === "completed") {
            // Show only completed tasks
            filteredTasks = tasksArr.filter(
                (task) =>
                    task.completed &&
                    (!task.is_private || (task.is_private && task.user && account && task.user.toLowerCase() === account.toLowerCase()))
            );
        }
        setFilteredTasks(filteredTasks);
        setCurrentPage(1); // Reset to first page on filter change
    };

    // Handles input change for the new task field
    const handleChange = (e) => {
        setNewTask(e.currentTarget.value);
    };

    // Handles form submit for adding a new task
    const handleSubmit = async (e) => {
        e.preventDefault();
        // If under private tab, set task as private (is_private = true)
        const isPrivate = activeFilter === "private";
        await addTask(newTask, isPrivate); // is_private = true if private tab, false otherwise
    };

    // Deletes a task by id
    const deleteTask = async (id) => {
        // Get signer for transaction
        const signer = await provider.getSigner();
        let transaction = await todoWeb3.connect(signer).deleteTask(id);
        await transaction.wait();
        await getMyTasks(todoWeb3);
    };

    // Adds a new task (private or public)
    const addTask = async (t, is_private = false) => {
        // Prevent adding more than MAX_TASKS for the user
        const userTasks = tasks.filter(task => task.user && account && task.user.toLowerCase() === account.toLowerCase());
        if (userTasks.length >= MAX_TASKS) {
            alert(`You can only have up to ${MAX_TASKS} tasks. Please delete a task before adding a new one.`);
            return;
        }
        if (!t || t.trim() === "") return; // Prevent empty tasks
        const signer = await provider.getSigner();
        let transaction = await todoWeb3.connect(signer).createTask(t.trim(), is_private);
        await transaction.wait();
        setNewTask("");
        await getMyTasks(todoWeb3);
        // Stay on the current tab after adding a task
        // Do not change activeFilter or privateTabActive here
    };

    // Handles filter tab clicks and updates filteredTasks
    const filterTasks = (e) => {
        const selectedFilter = e.currentTarget.id;
        let filteredTasks = tasks;
        if (selectedFilter === "private") {
            filteredTasks = tasks.filter(
                (task) => task.is_private && task.user && account && task.user.toLowerCase() === account.toLowerCase()
            );
        } else if (selectedFilter === "public") {
            filteredTasks = tasks.filter(
                (task) => !task.is_private
            );
        } else if (selectedFilter === "all") {
            filteredTasks = tasks.filter(
                (task) =>
                    !task.is_private ||
                    (task.is_private && task.user && account && task.user.toLowerCase() === account.toLowerCase())
            );
        } else if (selectedFilter === "pending") {
            filteredTasks = tasks.filter(
                (task) =>
                    !task.completed &&
                    (!task.is_private || (task.is_private && task.user && account && task.user.toLowerCase() === account.toLowerCase()))
            );
        } else if (selectedFilter === "completed") {
            filteredTasks = tasks.filter(
                (task) =>
                    task.completed &&
                    (!task.is_private || (task.is_private && task.user && account && task.user.toLowerCase() === account.toLowerCase()))
            );
        }
        setFilteredTasks(filteredTasks);
        setActiveFilter(selectedFilter);
    };

    // Handles Enter key for adding a new task
    const handleKeyDown = async (e) => {
        if (e.key === "Enter") {
            let inputTask = e.currentTarget.value;
            // If under private tab, set task as private (is_private = true)
            const isPrivate = activeFilter === "private";
            if (inputTask.trim() === "") return; // Prevent empty tasks
            // Add task
            await addTask(inputTask, isPrivate); // is_private = true if private tab, false otherwise
        }
    };

    // Clears all completed tasks for the user
    const clearCompleted = async () => {
        // DEBUG: Button click
        window.console.log("Clear completed button pressed");
        if (!todoWeb3 || !provider) return;
        try {
            const signer = await provider.getSigner();
            let transaction = await todoWeb3.connect(signer).clearCompletedTasks();
            await transaction.wait();
            // Refetch all tasks and re-apply the current filter
            const myTasks = await todoWeb3.getMyTasks();
            setTasks(myTasks);
            applyCurrentFilter(myTasks);
        } catch (err) {
            window.console.error("Failed to clear completed tasks:", err);
        }
    };

    // On mount, load blockchain data (connect wallet, load contract, fetch tasks)
    useEffect(() => {
        loadBlockchainData();
    }, []);

    // Listen for contract events and update tasks accordingly
    useEffect(() => {
        if (!todoWeb3) return;
        // Only update tasks if the event is relevant to the current account
        const onTaskCreated = (id, content, completed, event) => {
            if (event && event.args && event.address === todoWeb3.address) {
                getMyTasks(todoWeb3);
            }
        };
        const onTaskCompleted = (id, completed, event) => {
            if (event && event.args && event.address === todoWeb3.address) {
                getMyTasks(todoWeb3);
            }
        };
        const onTaskDeleted = (id, event) => {
            if (event && event.args && event.address === todoWeb3.address) {
                getMyTasks(todoWeb3);
            }
        };
        const onTasksCleared = (id_arr, event) => {
            if (event && event.args && event.address === todoWeb3.address) {
                getMyTasks(todoWeb3);
            }
        };
        // Subscribe to contract events
        todoWeb3.on("TaskCreated", onTaskCreated);
        todoWeb3.on("TaskCompleted", onTaskCompleted);
        todoWeb3.on("TaskDeleted", onTaskDeleted);
        todoWeb3.on("TasksCleared", onTasksCleared);
        // Cleanup event listeners on unmount or dependency change
        return () => {
            todoWeb3.off("TaskCreated", onTaskCreated);
            todoWeb3.off("TaskCompleted", onTaskCompleted);
            todoWeb3.off("TaskDeleted", onTaskDeleted);
            todoWeb3.off("TasksCleared", onTasksCleared);
        };
    }, [todoWeb3, account, activeFilter]);

    // Listen for account changes and reload data
    useEffect(() => {
        if (window.ethereum) {
            const handleAccountsChanged = (accounts) => {
                if (accounts && accounts.length > 0) {
                    setAccount(accounts[0]);
                    loadBlockchainData();
                } else {
                    setAccount(null);
                    setTasks([]);
                    setFilteredTasks([]);
                }
            };
            window.ethereum.on('accountsChanged', handleAccountsChanged);
            return () => {
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
            };
        }
    }, []);

    // Debug: log clear completed button ref and state on every render
    useEffect(() => {
        if (clearBtnRef.current) {
            console.log('Clear completed button ref:', clearBtnRef.current);
            console.log('Button disabled:', clearBtnRef.current.disabled);
        }
    });

    // Calculate paginated tasks for current page
    // Only show private tasks to their owners in the private tab
    let visibleTasks = filteredTasks;
    if (activeFilter === "private") {
        visibleTasks = filteredTasks.filter(
            (task) => task.is_private && task.user && account && task.user.toLowerCase() === account.toLowerCase()
        );
    }
    const paginatedTasks = visibleTasks.slice((currentPage - 1) * TASKS_PER_PAGE, currentPage * TASKS_PER_PAGE);
    const totalPages = Math.ceil(visibleTasks.length / TASKS_PER_PAGE);

    // Render the app layout and background video
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
