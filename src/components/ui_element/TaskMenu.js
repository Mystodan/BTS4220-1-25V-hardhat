import { useEffect, useState, useRef } from "react";

const Task = ({ task, todoWeb3, provider, onDelete, onClick, onEdit, handleToggleCompleted, account }) => {
  const id = task.uuid;
  const [completed, setCompleted] = useState(false);
  const [menuOpened, setMenuOpened] = useState(false);
  const [menuBtnActive, setMenuBtnActive] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef(null);

  const handleChange = async () => {
    if (handleToggleCompleted) {
      await handleToggleCompleted(id);
    } else {
      const signer = await provider.getSigner();
      let transaction = await todoWeb3.connect(signer).toggleCompleted(id);
      await transaction.wait();
      setCompleted(!completed);
    }
  };

  useEffect(() => {
    setCompleted(task.completed);
  }, [task.completed]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpened(false);
      }
    };
    if (menuOpened) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpened]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <li className="task" style={{ cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
        <input
          onChange={handleChange}
          type="checkbox"
          id={id}
          checked={completed}
          style={{ cursor: 'pointer', width: 18, height: 18, marginRight: 10 }}
          onClick={e => e.stopPropagation()}
        />
        <label htmlFor={id} style={{ margin: 0, cursor: 'pointer', userSelect: 'none', flex: 1, minWidth: 0 }}>
          <p
            className={completed ? "checked" : ""}
            style={{
              margin: 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              background: (task.user && account && task.user.toLowerCase() === account.toLowerCase()) ? 'var(--task-gradient-text)' : 'none',
              WebkitBackgroundClip: (task.user && account && task.user.toLowerCase() === account.toLowerCase()) ? 'text' : undefined,
              WebkitTextFillColor: (task.user && account && task.user.toLowerCase() === account.toLowerCase()) ? 'transparent' : undefined,
              backgroundClip: (task.user && account && task.user.toLowerCase() === account.toLowerCase()) ? 'text' : undefined,
              color: (task.user && account && task.user.toLowerCase() === account.toLowerCase()) ? undefined : undefined
            }}
          >
            {task.content}
          </p>
        </label>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', marginLeft: 'auto', position: 'relative' }}>
        <button
          type="button"
          aria-label="Open task menu"
          className={`open-task-menu${menuBtnActive ? ' active' : ''}${scrolled ? ' scrolled' : ''}`}
          onClick={e => { e.stopPropagation(); setMenuOpened(true); setMenuBtnActive(true); }}
          onBlur={() => setMenuBtnActive(false)}
          onMouseDown={() => setMenuBtnActive(true)}
          onMouseUp={() => setMenuBtnActive(false)}
        >
          <i className="uil uil-ellipsis-h" ></i>
        </button>
        <div className="settings" ref={menuRef}>
          <ul className={`task-menu ${menuOpened ? "show" : ""}`} style={{ right: 0 }}>
            <li onClick={e => { e.stopPropagation(); setMenuOpened(false); if (onEdit) onEdit(task); }}>
              <i className="uil uil-pen"></i>Edit
            </li>
            <li onClick={e => { e.stopPropagation(); onDelete(id); }}>
              <i className="uil uil-trash"></i>Delete
            </li>
          </ul>
        </div>
      </div>
      <div
        className="task-click-capture"
        style={{ position: 'absolute', top: 0, left: 0, right: 48, bottom: 0 }}
        onClick={onClick}
      />
    </li>
  );
};

export default Task;