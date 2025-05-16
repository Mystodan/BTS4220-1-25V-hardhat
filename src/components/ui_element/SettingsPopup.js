import React, { useState, useEffect } from "react";
import Popup from "../popups/Popup";

const SettingsPopup = ({ show, onClose, darkMode, setDarkMode, position }) => {
  const [isConnected, setIsConnected] = useState(false);

  // Check wallet connection status on mount and when open changes
  useEffect(() => {
    async function checkConnection() {
      if (window.ethereum && window.ethereum.selectedAddress) {
        setIsConnected(true);
      } else if (window.ethereum && window.ethereum.request) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        setIsConnected(accounts && accounts.length > 0);
      } else {
        setIsConnected(false);
      }
    }
    if (show) checkConnection();
  }, [show]);

  // Connect wallet logic
  const handleConnect = async () => {
    if (window.ethereum && window.ethereum.request) {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        setIsConnected(true);
      } catch (err) {
        // Optionally handle error
      }
    }
  };

  // Disconnect wallet logic (MetaMask does not support programmatic disconnect, so we force a disconnect by reloading the page and clearing state)
  const handleDisconnect = async () => {
    setIsConnected(false);
  
    // Attempt to disconnect MetaMask (EIP-1193, not widely supported)
    if (window.ethereum && window.ethereum.request) {
      try {
        await window.ethereum.request({ method: 'wallet_requestPermissions', params: [{ eth_accounts: {} }] });
      } catch (e) {
        // Ignore if not supported or user rejects
      }
    }

  };

  if (!show) return null;
  return (
    <div
      className="popup-overlay"
      onClick={onClose}
      style={{ zIndex: 2001 }}
    >
      <div
        className="popup-content task-popup"
        onClick={e => e.stopPropagation()}
        style={position ? {
          position: 'fixed',
          left: position.x,
          top: position.y,
          zIndex: 2002,
          minWidth: 320,
          maxWidth: '90vw',
        } : {}}
      >
        <h3>Settings</h3>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 500, fontSize: 16 }}>
          <span style={{marginRight: 8}}>Dark mode (Obsidian)</span>
          <span
            className="toggle-switch-track"
            tabIndex={0}
            role="switch"
            aria-checked={darkMode}
            onClick={() => setDarkMode(!darkMode)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setDarkMode(!darkMode); }}
            style={{
              background: darkMode
                ? 'linear-gradient(90deg, #7c3aed 0%, #a78bfa 100%)'
                : 'linear-gradient(90deg, #ff9800 0%, #ffd580 100%)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              borderRadius: 24,
              width: 44,
              height: 24,
              display: 'inline-block',
              position: 'relative',
              transition: 'background 0.3s',
              verticalAlign: 'middle',
              marginTop: -2 // Lower the switch for better alignment
            }}
          >
            <span
              className="toggle-switch-thumb"
              style={{
                left: darkMode ? 22 : 2,
                background: '#fff',
                position: 'absolute',
                top: 2,
                width: 20,
                height: 20,
                borderRadius: '50%',
                boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
                transition: 'left 0.3s'
              }}
            ></span>
          </span>
        </label>
        <button
          className="popup-btn"
          style={{ marginTop: 18, width: '100%' }}
          onClick={isConnected ? handleDisconnect : handleConnect}
        >
          {isConnected ? 'Disconnect Wallet' : 'Connect Wallet'}
        </button>
      </div>
    </div>
  );
};

export default SettingsPopup;
