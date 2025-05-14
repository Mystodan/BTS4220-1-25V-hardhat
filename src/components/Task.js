import { useEffect, useState, useRef } from "react";

const Task = ({ task, todoWeb3, provider, id, onDelete, onClick }) => {
  const [completed, setCompleted] = useState(false);
  const [menuOpened, setMenuOpened] = useState(false);
  const menuRef = useRef(null);

  const handleChange = async () => {
    const signer = await provider.getSigner();
    let transaction = await todoWeb3.connect(signer).toggleCompleted(id);
    await transaction.wait();
    setCompleted(!completed);
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

  return (
    <li className="task" style={{ cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
        <input
          onChange={handleChange}
          type="checkbox"
          id={id}
          checked={completed}
          style={{ cursor: 'pointer', width: 18, height: 18, marginRight: 10, zIndex: 2 }}
          onClick={e => e.stopPropagation()}
        />
        <label htmlFor={id} style={{ margin: 0, cursor: 'pointer', userSelect: 'none', flex: 1, minWidth: 0 }}>
          <p className={completed ? "checked" : ""} style={{ margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.content}</p>
        </label>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', marginLeft: 'auto', position: 'relative' }}>
        <button
          type="button"
          aria-label="Open task menu"
          style={{ background: 'none', border: 'none', padding: 0, marginLeft: 8, cursor: 'pointer', zIndex: 2, display: 'flex', alignItems: 'center' }}
          onClick={e => { e.stopPropagation(); setMenuOpened(true); }}
        >
          <i className="uil uil-ellipsis-h" />
        </button>
        <div className="settings" ref={menuRef}>
          <ul className={`task-menu ${menuOpened ? "show" : ""}`} style={{ right: 0 }}>
            <li>
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
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 }}
        onClick={onClick}
      />
    </li>
  );
};

export default Task;