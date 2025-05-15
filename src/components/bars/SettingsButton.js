// ...existing code from SettingsButton.js...
// Remove this file after moving SettingsButton to ui_element/ directory.
import React, { useState } from "react";

const SettingsButton = () => {
  const [settingsPressed, setSettingsPressed] = useState(false);
  return (
    <button
      type="button"
      aria-label="Settings"
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
    >
      {/* Orange gear SVG icon with interactive color swap, border and outside revert to previous */}
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="10" cy="10" r="9" fill={settingsPressed ? '#ff9800' : 'none'} stroke={settingsPressed ? 'none' : 'transparent'} />
        <g>
          <path d="M10 6.5A3.5 3.5 0 1 1 6.5 10 3.5 3.5 0 0 1 10 6.5m0-2A5.5 5.5 0 1 0 15.5 10 5.5 5.5 0 0 0 10 4.5z" fill={settingsPressed ? 'white' : '#ff9800'}/>
          <path d="M10 1v2M10 17v2M3.22 3.22l1.42 1.42M15.36 15.36l1.42 1.42M1 10h2M17 10h2M3.22 16.78l1.42-1.42M15.36 4.64l1.42-1.42" stroke={settingsPressed ? 'white' : '#ff9800'} strokeWidth="1.2" strokeLinecap="round"/>
        </g>
      </svg>
    </button>
  );
};

export default SettingsButton;
// ...existing code from SettingsButton.js...
