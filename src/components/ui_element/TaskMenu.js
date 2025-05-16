import { useEffect, useRef } from "react";
import ReactDOM from "react-dom";

const TaskMenu = ({
  task,
  todoWeb3,
  provider,
  onDelete,
  onClick,
  onEdit,
  handleToggleCompleted,
  account,
  toggleTaskPrivacy,
  menuOpened,
  setMenuOpened,
  setPopupTask
}) => {
  const id = task.uuid;
  const menuRef = useRef(null);
  // Close menu on outside click
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
  }, [menuOpened, setMenuOpened]);

  // Handlers
  const handleCheckboxClick = async (e) => {
    e.stopPropagation();
    if (handleToggleCompleted) {
      await handleToggleCompleted(id);
    } else if (provider && todoWeb3) {
      const signer = await provider.getSigner();
      let transaction = await todoWeb3.connect(signer).toggleCompleted(id);
      await transaction.wait();
    }
  };

  return (
    <li
      className="task"
      style={{ cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      onContextMenu={e => {
        // Only open menu if not right-clicking the menu button
        if (e.target.closest('.open-task-menu-btn')) return;
        e.preventDefault();
        setMenuOpened({ x: e.clientX, y: e.clientY });
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
        <input
          onChange={handleCheckboxClick}
          type="checkbox"
          id={id}
          checked={task.completed}
          style={{ cursor: 'pointer', width: 18, height: 18, marginRight: 10 }}
          onClick={e => e.stopPropagation()}
        />
        <label
          // Removed htmlFor to prevent label click from toggling checkbox
          style={{ margin: 0, cursor: 'pointer', userSelect: 'none', flex: 1, minWidth: 0 }}
          onClick={e => {
            if (typeof onClick === 'function') onClick(e);
          }}
        >
          <p
            className={
              `${task.completed ? "checked " : ""}` +
              (task.user && account && task.user.toLowerCase() === account.toLowerCase()
                ? "owned-by-user"
                : task.user
                ? "owned"
                : "")
            }
            style={{
              margin: 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {task.content}
          </p>
        </label>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', marginLeft: 'auto', position: 'relative' }}>
        <button
          type="button"
          aria-label={task.is_private ? "Set task public" : "Set task private"}
          className="open-task-menu-btn"
          style={{
            position: 'absolute',
            top: '50%',
            right: 0,
            transform: 'translateY(-50%)',
            zIndex: 10
          }}
          onClick={e => {
            e.stopPropagation();
            if (typeof toggleTaskPrivacy === 'function') toggleTaskPrivacy(task.uuid);
          }}
          onContextMenu={e => {
            e.preventDefault();
            e.stopPropagation();
            const btn = e.currentTarget;
            const rect = btn.getBoundingClientRect();
            setMenuOpened({ x: rect.right, y: rect.bottom });
          }}
        >
          <span style={{ fontSize: '1.2em', lineHeight: 1 }}>
            {task.is_private ? '🔐' : '🌍'}
          </span>
        </button>
        {menuOpened && menuOpened.x && menuOpened.y && (
          <div
            className="settings"
            ref={menuRef}
            style={{
              position: 'fixed',
              left: menuOpened.x,
              top: menuOpened.y,
              zIndex: 2099,
              minWidth: 120,
              pointerEvents: 'auto',
            }}
          >
            <ul className="task-menu show">
              <li onClick={e => { e.stopPropagation(); setMenuOpened(false); if (onEdit) onEdit(task); }}>
                <i className="uil uil-pen" style={{ fontSize: '0.96em' }}></i>Edit
              </li>
              {/* Details button removed */}
              <li onClick={e => { e.stopPropagation(); onDelete(id); }}>
                <i className="uil uil-trash" style={{ fontSize: '0.96em' }}></i>Delete
              </li>
            </ul>
          </div>
        )}
      </div>
    </li>
  );
};

export default TaskMenu;