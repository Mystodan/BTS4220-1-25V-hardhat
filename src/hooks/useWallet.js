// useWallet.js
// Hook for managing wallet connection and contract instance in the Todo dApp.
// Handles connecting to MetaMask, tracking the current account, and providing the ethers.js contract instance.

import { useState } from "react";
import { ethers } from "ethers";
import config from "../config.json";
import TodoWeb3 from "../abis/TodoWeb3.json";

/**
 * useWallet
 * Handles wallet connection, account state, and contract instance setup.
 *
 * @param {function} setWarnPopup - Optional. Function to show user-friendly error popups.
 * @returns {object} - Wallet state, contract instance, and connection logic.
 */
export function useWallet(setWarnPopup) {
  // ethers.js provider for blockchain interaction
  const [provider, setProvider] = useState(null);
  // Current connected wallet address
  const [account, setAccount] = useState(null);
  // ethers.js contract instance for TodoWeb3
  const [todoWeb3, setTodoWeb3] = useState(null);

  /**
   * Attempts to connect to the user's wallet (MetaMask).
   * If already connected, loads blockchain data. If not, requests connection.
   * Handles user rejection and missing wallet gracefully.
   */
  const checkOrRequestWalletConnection = async () => {
    if (!window.ethereum) {
      setAccount(null);
      return false;
    }
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    if (accounts && accounts.length > 0) {
      setAccount(accounts[0]);
      await loadBlockchainData(accounts[0]);
      return true;
    }
    try {
      const reqAccounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (reqAccounts && reqAccounts.length > 0) {
        setAccount(reqAccounts[0]);
        await loadBlockchainData(reqAccounts[0]);
        return true;
      }
    } catch (err) {
      setAccount(null);
      if (setWarnPopup) setWarnPopup({ open: true, message: 'Wallet connection cancelled by user.' });
    }
    return false;
  };

  /**
   * Loads the ethers.js provider and TodoWeb3 contract instance for the current network/account.
   * Updates state with provider, contract, and account.
   */
  const loadBlockchainData = async (selectedAccount = null) => {
    await window.ethereum.request({ method: "eth_requestAccounts" });
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    setProvider(provider);
    const network = await provider.getNetwork();
    const todoWeb3 = new ethers.Contract(
      config[network.chainId].TodoWeb3.address,
      TodoWeb3,
      provider
    );
    setTodoWeb3(todoWeb3);
    const accounts = await provider.listAccounts();
    const accountToUse = selectedAccount || (accounts && accounts.length > 0 ? accounts[0] : null);
    if (accountToUse) setAccount(accountToUse);
  };

  // Expose wallet and contract state, plus connection logic
  return {
    provider,
    account,
    todoWeb3,
    checkOrRequestWalletConnection,
    loadBlockchainData,
    setProvider,
    setAccount,
    setTodoWeb3
  };
}
