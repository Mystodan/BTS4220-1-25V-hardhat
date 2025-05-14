import React from "react";
import "../popup.css";

/**
 * TaskPopup component
 * -------------------
 * Displays a modal popup with detailed information about a selected task.
 * - Shows task ID, content, privacy status, creator, completion status, and timestamps.
 * - Clicking outside the popup or the Close button will close the popup.
 * - Returns null if no popupTask is provided (popup is hidden).
 *
 * Props:
 *   popupTask: The task object to display details for (null to hide popup)
 *   onClose:   Function to call to close the popup
 */
const TaskPopup = ({ popupTask, onClose }) => {
  if (!popupTask) return null; // Hide popup if no task is selected
  return (
    <div className="popup-overlay" onClick={onClose}>
      {/* Prevent click inside the popup from closing it */}
      <div
        className="popup-content"
        onClick={e => {
          e.stopPropagation();
          // Debug: log to ensure event is stopped
          console.log("Popup content clicked, event propagation stopped.");
        }}
      >
        <h3>Task Details</h3>
        <div style={{ marginBottom: '1rem' }}>
          {/* Display all relevant task details */}
          <b>ID:</b> {String(popupTask.id)}<br />
          <b>Content:</b> {popupTask.content}<br />
          <b>Private:</b> {popupTask.is_private ? "Yes" : "No"}<br />
          <b>Created by:</b> {popupTask.user}<br />
          <b>Completed:</b> {popupTask.completed ? "Yes" : "No"}<br />
          <b>Created At:</b> {popupTask.createdAt && !isNaN(popupTask.createdAt) ? new Date(popupTask.createdAt * 1000).toLocaleString() : "-"}<br />
          <b>Completed At:</b> {popupTask.completedAt && !isNaN(popupTask.completedAt) && popupTask.completedAt !== 0 ? new Date(popupTask.completedAt * 1000).toLocaleString() : "-"}
        </div>
        {/* Button to close the popup */}
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default TaskPopup;
