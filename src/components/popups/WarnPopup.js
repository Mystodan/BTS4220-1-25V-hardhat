import React from "react";
import Popup from "./Popup";
import "../../popup.css";

/**
 * WarnPopup - shows a warning/error message in a themed popup.
 * @param {Object} props
 * @param {boolean} props.open - Whether the popup is open
 * @param {function} props.onClose - Function to close the popup
 * @param {string} props.warning - The warning/error string to display
 */
export default function WarnPopup({ open, onClose, warning }) {
  return (
    <Popup open={open} onClose={onClose} showActions={false}>
      <div className="warn-popup-content">
        <div className="warn-popup-title">Warning</div>
        <div className="warn-popup-message">{warning}</div>
      </div>
    </Popup>
  );
}
