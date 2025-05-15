import React, { useState, useEffect } from "react";
import Popup from "./Popup";

/**
 * EditTaskPopup
 * -------------
 * Dedicated popup for editing a task (content and completed status).
 * Uses the reusable Popup framework, disables closing by overlay, only Save/Cancel can close.
 */
const EditTaskPopup = ({ task, onClose, todoWeb3, provider, account, reloadTasks }) => {
  const [content, setContent] = useState(task ? task.content : "");
  const [completed, setCompleted] = useState(task ? task.completed : false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setContent(task ? task.content : "");
    setCompleted(task ? task.completed : false);
    setError("");
  }, [task]);

  // Only allow editing if public or (private and user is owner)
  const canEdit = task && (!task.is_private || (task.user && account && task.user.toLowerCase() === account.toLowerCase()));

  const handleSave = async () => {
    if (!todoWeb3 || !provider) return;
    setLoading(true);
    setError("");
    try {
      const signer = await provider.getSigner();
      if (content !== task.content) {
        await (await todoWeb3.connect(signer).editTask(task.id, content)).wait();
      }
      if (completed !== task.completed) {
        await (await todoWeb3.connect(signer).toggleCompleted(task.id)).wait();
      }
      if (reloadTasks) await reloadTasks();
      onClose();
    } catch (err) {
      if (err && (err.code === 'ACTION_REJECTED' || err.code === 4001)) {
        setError('Transaction cancelled on other end');
      } else {
        setError("Failed to save: " + (err && err.message ? err.message : err));
      }
    } finally {
      setLoading(false);
    }
  };

  if (!task) return null;

  return (
    <Popup
      open={!!task}
      onClose={null}
      onSave={handleSave}
      onCancel={onClose}
      title={"Edit Task"}
      error={error}
      loading={loading}
      overlayClosable={false}
      showActions={canEdit}
      saveLabel="Save"
      cancelLabel="Cancel"
    >
      {canEdit ? (
        <>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontWeight: 600 }}>Content:<br />
              <input
                type="text"
                value={content}
                onChange={e => setContent(e.target.value)}
                maxLength={100}
                style={{ width: '100%', padding: '0.5rem', fontSize: '1rem', borderRadius: 4, border: '1px solid #ccc', marginTop: 4 }}
                disabled={loading}
                required
              />
            </label>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={completed}
                onChange={e => setCompleted(e.target.checked)}
                disabled={loading}
                style={{ marginRight: 8 }}
              />
              Completed
            </label>
          </div>
        </>
      ) : (
        <div style={{ color: 'red' }}>You do not have permission to edit this task.</div>
      )}
    </Popup>
  );
};

export default EditTaskPopup;
