import React from "react";
import Popup from "./Popup";

/**
 * ViewTaskPopup
 * -------------
 * Dedicated popup for viewing a task's details. Uses the unified Popup framework.
 */
const ViewTaskPopup = ({ task, onClose }) => {
  if (!task) return null;
  return (
    <Popup
      open={!!task}
      onClose={onClose}
      title="Task Details"
      overlayClosable={true}
      showActions={false}
    >
      <div>
        <b>ID:</b> {String(task.id)}<br />
        <b>Content:</b> {task.content}<br />
        <b>Private:</b> {task.is_private ? "Yes" : "No"}<br />
        <b>Created by:</b> {task.user}<br />
        <b>Completed:</b> {task.completed ? "Yes" : "No"}<br />
        <b>Created At:</b> {task.createdAt && !isNaN(task.createdAt) ? new Date(task.createdAt * 1000).toLocaleString() : "-"}<br />
        <b>Completed At:</b> {task.completedAt && !isNaN(task.completedAt) && task.completedAt !== 0 ? new Date(task.completedAt * 1000).toLocaleString() : "-"}
      </div>
    </Popup>
  );
};

export default ViewTaskPopup;
