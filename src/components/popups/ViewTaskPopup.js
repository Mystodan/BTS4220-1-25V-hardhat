import React from "react";
import Popup from "./Popup";

const formatDate = ts => {
  if (!ts || isNaN(ts)) return "-";
  // If it's in the future, probably ms, else s
  const date = ts > 1e12 ? new Date(ts) : new Date(ts * 1000);
  return date.toLocaleString();
};

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
        <b>UUID:</b> {String(task.uuid)}<br />
        <b>Content:</b> {task.content}<br />
        <b>Private:</b> {task.is_private ? "Yes" : "No"}<br />
        <b>User:</b> {task.user}<br />
        <b>Completed:</b> {task.completed ? "Yes" : "No"}<br />
        <b>Created At:</b> {formatDate(task.createdAt)}<br />
        <b>Completed At:</b> {task.completedAt && !isNaN(task.completedAt) && task.completedAt !== 0 ? formatDate(task.completedAt) : "-"}
      </div>
    </Popup>
  );
};

export default ViewTaskPopup;
