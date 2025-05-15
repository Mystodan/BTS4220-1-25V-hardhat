import React from "react";
import '../../popup.css';

/**
 * Reusable Popup component (refactored)
 * -------------------------------------
 * Handles all common modal logic: title, close/cancel/save buttons, error display, loading state, and overlay click.
 * Children only provide the main content (fields or view info).
 *
 * Props:
 *   open:     Boolean, whether the popup is visible
 *   onClose:  Function to call to close the popup (for overlay or close button)
 *   onSave:   (Optional) Function to call to save (for edit modals)
 *   onCancel: (Optional) Function to call to cancel (for edit modals)
 *   title:    (Optional) Title string for the popup
 *   children: Content to render inside the popup
 *   error:    (Optional) Error string to display
 *   loading:  (Optional) Boolean, disables buttons if true
 *   overlayClosable: (Optional) Boolean, if false, clicking the overlay does not close the popup
 *   saveLabel: (Optional) Label for save button (default: 'Save')
 *   cancelLabel: (Optional) Label for cancel button (default: 'Cancel')
 *   showActions: (Optional) Boolean, if true shows Save/Cancel, if false shows only Close
 */
const Popup = ({
  open,
  onClose,
  onSave,
  onCancel,
  title,
  children,
  error,
  loading = false,
  overlayClosable = true,
  saveLabel = 'Save',
  cancelLabel = 'Cancel',
  showActions = false
}) => {
  if (!open) return null;
  const handleOverlayClick = (e) => {
    if (overlayClosable && onClose) onClose(e);
  };
  return (
    <div className="popup-overlay" onClick={handleOverlayClick}>
      <div
        className="popup-content task-popup"
        onClick={e => {
          e.stopPropagation();
        }}
      >
        {title && <h3>{title}</h3>}
        <div>{children}</div>
        {error && <div style={{ color: 'red', marginTop: '0.5rem' }}>{error}</div>}
        {showActions ? (
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            {onSave && <button type="button" onClick={onSave} disabled={loading} className="popup-btn popup-btn-save">{saveLabel}</button>}
            {onCancel && <button type="button" onClick={onCancel} disabled={loading} className="popup-btn popup-btn-cancel">{cancelLabel}</button>}
          </div>
        ) : (
          onClose && overlayClosable && <button onClick={onClose} className="popup-btn popup-btn-close">Close</button>
        )}
      </div>
    </div>
  );
};

export default Popup;
