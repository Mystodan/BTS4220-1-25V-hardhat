import { useEffect, useState, useRef } from "react";

const Task = ({ task, todoWeb3, provider, id, onDelete }) => {
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
    <li className="task">
      <label htmlFor={id}>
        <input
          onChange={handleChange}
          type="checkbox"
          id={id}
          checked={completed}
        />
        <p className={completed ? "checked" : ""}>{task.content}</p>
      </label>
      <div className="settings" ref={menuRef}>
        <i
          onClick={() => setMenuOpened(true)}
          className="uil uil-ellipsis-h"
        ></i>
        <ul className={`task-menu ${menuOpened ? "show" : ""}`}>
          <li>
            <i className="uil uil-pen"></i>Edit
          </li>
          <li onClick={() => onDelete(id)}>
            <i className="uil uil-trash"></i>Delete
          </li>
        </ul>
      </div>
    </li>
  );
};

export default Task;