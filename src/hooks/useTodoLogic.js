import { useState, useRef, useEffect } from "react";
import { ethers } from "ethers";
import TodoWeb3 from "../abis/TodoWeb3.json";
import config from "../config.json";

// Enum for filter types
export const FilterType = Object.freeze({
    PRIVATE: "private",
    PUBLIC: "public",
    ALL: "all",
    PENDING: "pending",
    COMPLETED: "completed"
});

export function useTodoLogic() {
    // --- State ---
    const [provider, setProvider] = useState(null);
    const [account, setAccount] = useState(null);
    const [todoWeb3, setTodoWeb3] = useState(null);
    const [taskCount, setTaskCount] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [activeFilter, setActiveFilter] = useState(FilterType.ALL);
    const [filteredTasks, setFilteredTasks] = useState([]);
    const [newTask, setNewTask] = useState("");
    const [popupTask, setPopupTask] = useState(null);
    const clearBtnRef = useRef(null);
    const [currentPage, setCurrentPage] = useState(1);
    const MAX_TASKS = 8;
    const TASKS_PER_PAGE = 8;

    // --- Wallet Connection ---
    const checkOrRequestWalletConnection = async () => {
        if (!window.ethereum) {
            setAccount(null);
            return false;
        }
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts && accounts.length > 0) {
            setAccount(accounts[0]);
            await loadBlockchainData(accounts[0]);
            return true;
        }
        try {
            const reqAccounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            if (reqAccounts && reqAccounts.length > 0) {
                setAccount(reqAccounts[0]);
                await loadBlockchainData(reqAccounts[0]);
                return true;
            }
        } catch (err) {
            setAccount(null);
        }
        return false;
    };

    // --- Blockchain Data ---
    const loadBlockchainData = async (selectedAccount = null) => {
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(provider);
        const network = await provider.getNetwork();
        const todoWeb3 = new ethers.Contract(
            config[network.chainId].TodoWeb3.address,
            TodoWeb3,
            provider
        );
        setTodoWeb3(todoWeb3);
        const accounts = await provider.listAccounts();
        const accountToUse = selectedAccount || (accounts && accounts.length > 0 ? accounts[0] : null);
        if (accountToUse) setAccount(accountToUse);
        await getMyTasks(todoWeb3);
    };

    // --- Task Fetching ---
    const getMyTasks = async (todoWeb3Instance, keepPage = false) => {
        if (!provider || !todoWeb3Instance) return;
        const signer = provider.getSigner();
        const myTasks = await todoWeb3Instance.connect(signer).getMyTasks();
        const mappedTasks = myTasks.map(task => ({
            ...task,
            id: task.id && task.id._isBigNumber ? Number(task.id) : task.id,
            createdAt: task.createdAt && task.createdAt._isBigNumber ? Number(task.createdAt) : (typeof task.createdAt === 'number' ? task.createdAt : undefined),
            completedAt: task.completedAt && task.completedAt._isBigNumber ? Number(task.completedAt) : (typeof task.completedAt === 'number' ? task.completedAt : undefined)
        }));
        setTasks(mappedTasks);
        applyCurrentFilter(mappedTasks, undefined, keepPage);
    };

    // --- Filtering ---
    const applyCurrentFilter = (tasksArr, filterOverride, keepPage = false) => {
        let filtered = tasksArr;
        const filter = filterOverride || activeFilter;
        if (filter === FilterType.PRIVATE) {
            filtered = tasksArr.filter(
                (task) => task.is_private && task.user && account && task.user.toLowerCase() === account.toLowerCase()
            );
        } else if (filter === FilterType.PUBLIC) {
            filtered = tasksArr.filter((task) => !task.is_private);
        } else if (filter === FilterType.ALL) {
            filtered = tasksArr.filter(
                (task) =>
                    !task.is_private ||
                    (task.is_private && task.user && account && task.user.toLowerCase() === account.toLowerCase())
            );
        } else if (filter === FilterType.PENDING) {
            filtered = tasksArr.filter(
                (task) =>
                    !task.completed &&
                    (!task.is_private || (task.is_private && task.user && account && task.user.toLowerCase() === account.toLowerCase()))
            );
        } else if (filter === FilterType.COMPLETED) {
            filtered = tasksArr.filter(
                (task) =>
                    task.completed &&
                    (!task.is_private || (task.is_private && task.user && account && task.user.toLowerCase() === account.toLowerCase()))
            );
        }
        setFilteredTasks(filtered);
        if (!keepPage) setCurrentPage(1);
    };

    // --- Task Input ---
    const handleChange = (e) => setNewTask(e.currentTarget.value);

    // --- Task Actions ---
    const addTask = async (t, is_private = false) => {
        const userTasks = tasks.filter(task => task.user && account && task.user.toLowerCase() === account.toLowerCase());
        if (userTasks.length >= MAX_TASKS) {
            alert(`You can only have up to ${MAX_TASKS} tasks. Please delete a task before adding a new one.`);
            return;
        }
        if (!t || t.trim() === "") return;
        const signer = await provider.getSigner();
        let transaction = await todoWeb3.connect(signer).createTask(t.trim(), is_private);
        await transaction.wait();
        setNewTask("");
        await getMyTasks(todoWeb3, true);
    };

    const deleteTask = async (id) => {
        const signer = await provider.getSigner();
        let transaction = await todoWeb3.connect(signer).deleteTask(id);
        await transaction.wait();
        await getMyTasks(todoWeb3);
    };

    const clearCompleted = async () => {
        if (!todoWeb3 || !provider) return;
        try {
            const signer = await provider.getSigner();
            let transaction = await todoWeb3.connect(signer).clearCompletedTasks();
            await transaction.wait();
            await getMyTasks(todoWeb3);
        } catch (err) {
            window.console.error("Failed to clear completed tasks:", err);
        }
    };

    // --- UI Event Handlers ---
    const filterTasks = (e) => {
        const filterKey = e.currentTarget.id.toUpperCase();
        setActiveFilter(FilterType[filterKey] || e.currentTarget.id);
        applyCurrentFilter(tasks, FilterType[filterKey] || e.currentTarget.id);
    };

    const handleKeyDown = async (e) => {
        if (e.key === "Enter") {
            const inputTask = e.currentTarget.value;
            const isPrivate = activeFilter === FilterType.PRIVATE;
            if (inputTask.trim() === "") return;
            await addTask(inputTask, isPrivate);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const isPrivate = activeFilter === FilterType.PRIVATE;
        await addTask(newTask, isPrivate);
    };

    // --- Effects ---
    // Listen for account changes
    useEffect(() => {
        if (!window.ethereum) return;
        const handleAccountsChanged = (accounts) => {
            if (accounts && accounts.length > 0) {
                setAccount(accounts[0]);
                loadBlockchainData(accounts[0]);
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
    }, []);

    // Listen for contract events
    useEffect(() => {
        if (!todoWeb3) return;
        const onTaskCreated = (id, content, completed, event) => {
            if (event && event.args && event.address === todoWeb3.address) getMyTasks(todoWeb3);
        };
        const onTaskCompleted = (id, completed, event) => {
            if (event && event.args && event.address === todoWeb3.address) getMyTasks(todoWeb3);
        };
        const onTaskDeleted = (id, event) => {
            if (event && event.args && event.address === todoWeb3.address) getMyTasks(todoWeb3);
        };
        const onTasksCleared = (id_arr, event) => {
            if (event && event.args && event.address === todoWeb3.address) getMyTasks(todoWeb3);
        };
        todoWeb3.on("TaskCreated", onTaskCreated);
        todoWeb3.on("TaskCompleted", onTaskCompleted);
        todoWeb3.on("TaskDeleted", onTaskDeleted);
        todoWeb3.on("TasksCleared", onTasksCleared);
        return () => {
            todoWeb3.off("TaskCreated", onTaskCreated);
            todoWeb3.off("TaskCompleted", onTaskCompleted);
            todoWeb3.off("TaskDeleted", onTaskDeleted);
            todoWeb3.off("TasksCleared", onTasksCleared);
        };
    }, [todoWeb3, account, activeFilter]);

    // On mount: connect wallet and load blockchain data
    useEffect(() => {
        checkOrRequestWalletConnection();
        loadBlockchainData();
    }, []);

    // Debug: log clear completed button ref and state
    useEffect(() => {
        if (clearBtnRef.current) {
            console.log('Clear completed button ref:', clearBtnRef.current);
            console.log('Button disabled:', clearBtnRef.current.disabled);
        }
    });

    // --- Pagination ---
    let visibleTasks = filteredTasks;
    if (activeFilter === FilterType.PRIVATE) {
        visibleTasks = filteredTasks.filter(
            (task) => task.is_private && task.user && account && task.user.toLowerCase() === account.toLowerCase()
        );
    }
    const paginatedTasks = visibleTasks.slice((currentPage - 1) * TASKS_PER_PAGE, currentPage * TASKS_PER_PAGE);
    const totalPages = Math.ceil(visibleTasks.length / TASKS_PER_PAGE);

    // --- Return API ---
    return {
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
        TASKS_PER_PAGE,
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
    };
}
