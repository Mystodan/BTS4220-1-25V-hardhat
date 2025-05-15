import { useState, useRef, useEffect } from "react";
import { ethers } from "ethers";
import TodoWeb3 from "../abis/TodoWeb3.json";
import config from "../config.json";
import { v4 as uuidv4 } from "uuid";
import WarnPopup from "../components/popups/WarnPopup";

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
    const TASKS_PER_PAGE = 8;
    const [warnPopup, setWarnPopup] = useState({ open: false, message: "" });

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
        // Filter out deleted tasks (content === "")
        const filtered = myTasks.filter(task => task.content && task.content !== "");
        const mappedTasks = filtered.map(task => ({
            ...task,
            createdAt: task.createdAt && task.createdAt._isBigNumber ? Number(task.createdAt) : (typeof task.createdAt === 'number' ? task.createdAt : undefined),
            completedAt: task.completedAt && task.completedAt._isBigNumber ? Number(task.completedAt) : (typeof task.completedAt === 'number' ? task.completedAt : undefined)
        }));
        setTasks(mappedTasks);
        applyCurrentFilter(mappedTasks, undefined, keepPage);
    };

    // --- Filtering & Sorting ---
    const sortByDateDesc = arr => arr.slice().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    const filterTasksByType = (tasksArr, filter, account) => {
        if (filter === FilterType.PRIVATE) {
            return tasksArr.filter(
                (task) => task.is_private && task.user && account && task.user.toLowerCase() === account.toLowerCase()
            );
        } else if (filter === FilterType.PUBLIC) {
            return tasksArr.filter((task) => !task.is_private);
        } else if (filter === FilterType.ALL) {
            return tasksArr.filter(
                (task) =>
                    !task.is_private ||
                    (task.is_private && task.user && account && task.user.toLowerCase() === account.toLowerCase())
            );
        } else if (filter === FilterType.PENDING) {
            return tasksArr.filter(
                (task) =>
                    !task.completed &&
                    (!task.is_private || (task.is_private && task.user && account && task.user.toLowerCase() === account.toLowerCase()))
            );
        } else if (filter === FilterType.COMPLETED) {
            return tasksArr.filter(
                (task) =>
                    task.completed &&
                    (!task.is_private || (task.is_private && task.user && account && task.user.toLowerCase() === account.toLowerCase()))
            );
        }
        return tasksArr;
    };

    const applyCurrentFilter = (tasksArr, filterOverride, keepPage = false) => {
        const filter = filterOverride || activeFilter;
        let filtered = filterTasksByType(tasksArr, filter, account);
        filtered = sortByDateDesc(filtered);
        setFilteredTasks(filtered);
        if (!keepPage) setCurrentPage(1);
    };

    // --- Task Input ---
    const handleChange = (e) => setNewTask(e.currentTarget.value);

    // --- Task Actions ---
    const addTask = async (t, is_private = false) => {
        if (!t || t.trim() === "") return;
        try {
            const signer = await provider.getSigner();
            const uuid = uuidv4();
            let transaction = await todoWeb3.connect(signer).createTask(uuid, t.trim(), is_private);
            await transaction.wait();
            setNewTask("");
            await getMyTasks(todoWeb3, true);
        } catch (err) {
            if (err && (err.code === 'ACTION_REJECTED' || err.code === 4001)) {
                setWarnPopup({ open: true, message: 'Task creation cancelled by user.' });
                return;
            }
            let msg = "";
            if (err && err.error && err.error.data && err.error.data.message) {
                const match = err.error.data.message.match(/reverted with reason string '([^']+)'/);
                if (match && match[1]) msg = match[1];
            }
            if (!msg && err.reason) {
                msg = err.reason;
            }
            if (!msg && err.message) {
                const match = err.message.match(/reverted with reason string '([^']+)'/);
                if (match && match[1]) msg = match[1];
                else msg = err.message;
            }
            if (!msg) msg = String(err);
            setWarnPopup({ open: true, message: msg });
        }
    };

    const deleteTask = async (id) => {
        // Defensive: check if task exists before contract call
        const task = tasks.find(t => t.uuid === id);
        if (!task || !task.content) {
            setWarnPopup({ open: true, message: "Task does not exist or already deleted." });
            return;
        }
        try {
            const signer = await provider.getSigner();
            let transaction = await todoWeb3.connect(signer).deleteTask(id);
            await transaction.wait();
            await getMyTasks(todoWeb3);
        } catch (err) {
            let msg = "";
            // Try to extract reason string from error
            if (err && err.error && err.error.data && err.error.data.message) {
                // Hardhat/ethers style: ...reverted with reason string '...'
                const match = err.error.data.message.match(/reverted with reason string '([^']+)'/);
                if (match && match[1]) msg = match[1];
            } else if (err && (err.code === 'ACTION_REJECTED' || err.code === 4001)) {
                // User rejected the transaction in wallet
                setWarnPopup({ open: true, message: 'Transaction cancelled by user.' });
                return;
            }
            if (!msg && err && err.reason) {
                msg = err.reason;
            }
            if (!msg && err && err.message) {
                // Try to extract from message
                const match = err.message.match(/reverted with reason string '([^']+)'/);
                if (match && match[1]) msg = match[1];
                else msg = err.message;
            }
            if (!msg) msg = String(err);
            setWarnPopup({ open: true, message: msg });
        }
    };

    const clearCompleted = async () => {
        if (!todoWeb3 || !provider) return;
        try {
            const signer = await provider.getSigner();
            // Only attempt to clear if there are completed tasks owned by the user
            const myCompleted = tasks.filter(
                t => t.completed && t.user && account && t.user.toLowerCase() === account.toLowerCase()
            );
            if (myCompleted.length === 0) {
                setWarnPopup({ open: true, message: "No completed tasks you own to clear." });
                return;
            }
            let transaction = await todoWeb3.connect(signer).clearCompletedTasks();
            await transaction.wait();
            await getMyTasks(todoWeb3);
        } catch (err) {
            let msg = "";
            if (err && err.error && err.error.data && err.error.data.message) {
                const match = err.error.data.message.match(/reverted with reason string '([^']+)'/);
                if (match && match[1]) msg = match[1];
            } else if (err && (err.code === 'ACTION_REJECTED' || err.code === 4001)) {
                // User rejected the transaction in wallet
                setWarnPopup({ open: true, message: 'Transaction cancelled by user.' });
                return;
            }
            if (!msg && err.reason) {
                msg = err.reason;
            }
            if (!msg && err.message) {
                const match = err.message.match(/reverted with reason string '([^']+)'/);
                if (match && match[1]) msg = match[1];
                else msg = err.message;
            }
            if (!msg) msg = String(err);
            setWarnPopup({ open: true, message: msg });
        }
    };

    const handleToggleCompleted = async (id) => {
        // Defensive: check if task exists before contract call
        const task = tasks.find(t => t.uuid === id);
        if (!task || !task.content) {
            setWarnPopup({ open: true, message: "Task does not exist or already deleted." });
            return;
        }
        if (!todoWeb3 || !provider) return;
        try {
          const signer = await provider.getSigner();
          let transaction = await todoWeb3.connect(signer).toggleCompleted(id);
          await transaction.wait();
          await getMyTasks(todoWeb3); // Refresh tasks after toggling
        } catch (err) {
          let msg = "";
          if (err && err.error && err.error.data && err.error.data.message) {
            const match = err.error.data.message.match(/reverted with reason string '([^']+)'/);
            if (match && match[1]) msg = match[1];
          } else if (err && (err.code === 'ACTION_REJECTED' || err.code === 4001)) {
            // User rejected the transaction in wallet
            setWarnPopup({ open: true, message: 'Transaction cancelled by user.' });
            return;
          }
          if (!msg && err.reason) {
            msg = err.reason;
          }
          if (!msg && err.message) {
            const match = err.message.match(/reverted with reason string '([^']+)'/);
            if (match && match[1]) msg = match[1];
            else msg = err.message;
          }
          if (!msg) msg = String(err);
          setWarnPopup({ open: true, message: msg });
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
    }, []);

    // NEW: Load tasks when provider, todoWeb3, and account are set
    useEffect(() => {
        if (provider && todoWeb3 && account) {
            getMyTasks(todoWeb3);
        }
    }, [provider, todoWeb3, account]);

    // Debug: log clear completed button ref and state
    useEffect(() => {
        if (clearBtnRef.current) {
            console.log('Clear completed button ref:', clearBtnRef.current);
            console.log('Button disabled:', clearBtnRef.current.disabled);
        }
    });

    // --- Pagination ---
    let visibleTasks = filteredTasks;
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
        TASKS_PER_PAGE,
        checkOrRequestWalletConnection,
        loadBlockchainData,
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
        totalPages,
        warnPopup,
        setWarnPopup
    };
}
