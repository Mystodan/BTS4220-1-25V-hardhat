import { useState, useRef, useEffect } from "react";
import { ethers } from "ethers";
import TodoWeb3 from "../abis/TodoWeb3.json";
import config from "../config.json";
import { v4 as uuidv4 } from "uuid";
import WarnPopup from "../components/popups/WarnPopup";
import { useTaskActions } from "./useTasksSubHooks/useTaskActions";

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
    const TASKS_PER_PAGE = 7;
    const [warnPopup, setWarnPopup] = useState({ open: false, message: "" });
    const [sortType, setSortType] = useState('date'); // 'date' or 'alpha'
    const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'
    const [search, setSearch] = useState("");
    const [lastFilter, setLastFilter] = useState(activeFilter);
    // --- NEW: Persistent refs for UI state ---
    const filterRef = useRef(activeFilter);
    const sortTypeRef = useRef(sortType);
    const sortOrderRef = useRef(sortOrder);
    const searchRef = useRef(search);
    const pageRef = useRef(currentPage);
    // Keep refs in sync with state
    useEffect(() => { filterRef.current = activeFilter; }, [activeFilter]);
    useEffect(() => { sortTypeRef.current = sortType; }, [sortType]);
    useEffect(() => { sortOrderRef.current = sortOrder; }, [sortOrder]);
    useEffect(() => { searchRef.current = search; }, [search]);
    useEffect(() => { pageRef.current = currentPage; }, [currentPage]);

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
    const getMyTasks = async (todoWeb3Instance, keepPage = false, keepFilter = true) => {
        if (!provider || !todoWeb3Instance) return;
        // Use refs to guarantee previous UI state
        const prevFilter = filterRef.current;
        const prevSortType = sortTypeRef.current;
        const prevSortOrder = sortOrderRef.current;
        const prevSearch = searchRef.current;
        const prevPage = pageRef.current;
        const signer = provider.getSigner();
        const myTasks = await todoWeb3Instance.connect(signer).getMyTasks();
        // Filter out deleted tasks (content === "")
        const filtered = myTasks.filter(task => task.content && task.content !== "");
        // Map BigNumber fields to numbers for easier use in JS
        const mappedTasks = filtered.map(task => ({
            ...task,
            createdAt: task.createdAt && task.createdAt._isBigNumber ? Number(task.createdAt) : (typeof task.createdAt === 'number' ? task.createdAt : (task.createdAt ? parseInt(task.createdAt) : 0)),
            completedAt: task.completedAt && task.completedAt._isBigNumber ? Number(task.completedAt) : (typeof task.completedAt === 'number' ? task.completedAt : (task.completedAt ? parseInt(task.completedAt) : 0))
        }));
        setTasks(mappedTasks);
        // Always restore previous UI state after reload
        applyCurrentFilterAndSort(
            mappedTasks,
            keepFilter ? prevFilter : FilterType.ALL,
            keepPage ? prevPage : false,
            prevSortType,
            prevSortOrder,
            prevSearch
        );
        if (keepPage && prevPage) setCurrentPage(prevPage);
    };

    // Unified sort function
    const sortTasks = (arr, type = sortType, order = sortOrder) => {
        if (type === 'date') {
            return arr.slice().sort((a, b) =>
                order === 'desc'
                    ? (b.createdAt || 0) - (a.createdAt || 0)
                    : (a.createdAt || 0) - (b.createdAt || 0)
            );
        } else if (type === 'alpha') {
            return arr.slice().sort((a, b) =>
                order === 'desc'
                    ? b.content.localeCompare(a.content)
                    : a.content.localeCompare(b.content)
            );
        }
        return arr;
    };

    // Fuzzy match: returns true if all chars in pattern appear in order in str (unified)
    function fuzzyMatch(str, pattern) {
        str = (str || "").toLowerCase();
        pattern = (pattern || "").toLowerCase();
        let j = 0;
        for (let i = 0; i < str.length && j < pattern.length; i++) {
            if (str[i] === pattern[j]) j++;
        }
        return j === pattern.length;
    }

    // Unified filter function (with fuzzy search)
    const filterTasksByType = (tasksArr, filter, account, searchString = "") => {
        let filtered = tasksArr;
        if (filter === FilterType.PRIVATE) {
            filtered = filtered.filter(
                (task) => task.is_private && task.user && account && task.user.toLowerCase() === account.toLowerCase()
            );
        } else if (filter === FilterType.PUBLIC) {
            filtered = filtered.filter((task) => !task.is_private);
        } else if (filter === FilterType.ALL) {
            filtered = filtered.filter(
                (task) =>
                    !task.is_private ||
                    (task.is_private && task.user && account && task.user.toLowerCase() === account.toLowerCase())
            );
        } else if (filter === FilterType.PENDING) {
            filtered = filtered.filter(
                (task) =>
                    !task.completed &&
                    (!task.is_private || (task.is_private && task.user && account && task.user.toLowerCase() === account.toLowerCase()))
            );
        } else if (filter === FilterType.COMPLETED) {
            filtered = filtered.filter(
                (task) =>
                    task.completed &&
                    (!task.is_private || (task.is_private && task.user && account && task.user.toLowerCase() === account.toLowerCase()))
            );
        }
        // Unified fuzzy search
        if (searchString && searchString.trim() !== "") {
            const s = searchString.trim().toLowerCase();
            filtered = filtered.filter(task => fuzzyMatch(task.content || "", s));
        }
        return filtered;
    };

    // Unified apply function
    const applyCurrentFilterAndSort = (tasksArr, filterOverride, keepPage = false, sortTypeOverride, sortOrderOverride, searchOverride) => {
        const filter = filterOverride !== undefined ? filterOverride : lastFilter;
        const type = sortTypeOverride || sortType;
        const order = sortOrderOverride || sortOrder;
        const searchString = typeof searchOverride === "string" ? searchOverride : search;
        setLastFilter(filter);
        let filtered = filterTasksByType(tasksArr, filter, account, searchString);
        filtered = sortTasks(filtered, type, order);
        setFilteredTasks(filtered);
        if (!keepPage) setCurrentPage(1);
    };

    // --- Task Input ---
    const handleChange = (e) => setNewTask(e.currentTarget.value);

    // --- Actions logic ---
    const { addTask, deleteTask, clearCompleted, handleToggleCompleted, toggleTaskPrivacy } = useTaskActions({ provider, todoWeb3, account, setWarnPopup, tasks, setNewTask, getMyTasks });

    // --- UI Event Handlers ---
    const filterTasks = (e) => {
        const filterKey = e.currentTarget.id.toUpperCase();
        setActiveFilter(FilterType[filterKey] || e.currentTarget.id);
        setLastFilter(FilterType[filterKey] || e.currentTarget.id);
        // Always apply current search when switching tabs
        applyCurrentFilterAndSort(tasks, FilterType[filterKey] || e.currentTarget.id, false, undefined, undefined, search);
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

    // Unified sort type/order handlers
    const handleSortTypeChange = (type) => {
        setSortType(type);
        applyCurrentFilterAndSort(tasks, lastFilter, true, type, sortOrder);
    };
    const handleSortOrderChange = (order) => {
        setSortOrder(order);
        applyCurrentFilterAndSort(tasks, lastFilter, true, sortType, order);
    };
    // Unified search handler
    const handleSearch = (e) => {
        setSearch(e.target.value);
        applyCurrentFilterAndSort(tasks, lastFilter, true, sortType, sortOrder, e.target.value);
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

    // Unified event handler for contract events
    const handleContractEvent = () => {
        getMyTasks(todoWeb3, true, true); // keepPage=true, keepFilter=true
    };

    // Listen for contract events
    useEffect(() => {
        if (!todoWeb3) return;
        todoWeb3.on("TaskCreated", handleContractEvent);
        todoWeb3.on("TaskCompleted", handleContractEvent);
        todoWeb3.on("TaskDeleted", handleContractEvent);
        todoWeb3.on("TasksCleared", handleContractEvent);
        return () => {
            todoWeb3.off("TaskCreated", handleContractEvent);
            todoWeb3.off("TaskCompleted", handleContractEvent);
            todoWeb3.off("TaskDeleted", handleContractEvent);
            todoWeb3.off("TasksCleared", handleContractEvent);
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
        applyCurrentFilter: applyCurrentFilterAndSort,
        handleChange,
        addTask,
        deleteTask,
        clearCompleted,
        handleToggleCompleted,
        toggleTaskPrivacy,
        filterTasks,
        handleKeyDown,
        handleSubmit,
        paginatedTasks,
        totalPages,
        warnPopup,
        setWarnPopup,
        sortType,
        setSortType: handleSortTypeChange,
        sortOrder,
        setSortOrder: handleSortOrderChange,
        search,
        setSearch,
        handleSearch,
        lastFilter,
        setLastFilter
    };
}
