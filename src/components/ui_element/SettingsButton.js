import React, { useState } from "react";

const SettingsButton = ({ onClick, darkMode, pressed, onContextMenu }) => {
  const [settingsPressed, setSettingsPressed] = useState(false);
  // Use darkMode prop directly for accent color
  const accent = darkMode
    ? 'url(#settings-gradient-purple)'
    : '#ff9800';
  const isPressed = settingsPressed || pressed;
  return (
    <button
      type="button"
      aria-label="Settings"
      className="settings-btn"
      style={{
        position: 'absolute',
        bottom: 20,
        right: 20,
        zIndex: 2000,
        background: 'transparent',
        border: 'none',
        borderRadius: '50%',
        width: 24,
        height: 24,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        padding: 0
      }}
      onMouseDown={() => setSettingsPressed(true)}
      onMouseUp={() => setSettingsPressed(false)}
      onMouseLeave={() => setSettingsPressed(false)}
      onClick={onClick}
      onContextMenu={onContextMenu}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        {darkMode && (
          <defs>
            <linearGradient id="settings-gradient-purple" x1="0" y1="0" x2="20" y2="20" gradientUnits="userSpaceOnUse">
              <stop stopColor="#7c3aed" />
              <stop offset="1" stopColor="#a78bfa" />
            </linearGradient>
          </defs>
        )}
        <circle cx="10" cy="10" r="9" fill={isPressed ? accent : 'none'} stroke={isPressed ? 'none' : accent} />
        <g>
          <path d="M10 6.5A3.5 3.5 0 1 1 6.5 10 3.5 3.5 0 0 1 10 6.5m0-2A5.5 5.5 0 1 0 15.5 10 5.5 5.5 0 0 0 10 4.5z" fill={isPressed ? '#fff' : accent}/>
          <path d="M10 1v2M10 17v2M3.22 3.22l1.42 1.42M15.36 15.36l1.42 1.42M1 10h2M17 10h2M3.22 16.78l1.42-1.42M15.36 4.64l1.42-1.42" stroke={isPressed ? '#fff' : accent} strokeWidth="1.2" strokeLinecap="round"/>
        </g>
      </svg>
    </button>
  );
};

export default SettingsButton;

