import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { paymentAPI } from "../services/paymentAPI";
import { getUserData } from "../lib/localStorage";

const WalletContext = createContext();

const WalletProvider = ({ children }) => {
  const [wallet, setWallet] = useState({
    balance: 0,
    lockedBalance: 0,
    totalDeposited: 0,
    totalWithdrawn: 0,
    totalReceived: 0,
    currency: "PKR",
  });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const checkAuth = useCallback(() => {
    const user = getUserData();
    // Only fetch if authenticated, approved, and has a role
    return !!(user && user.id && user.role && user.status === "approved");
  }, []);

  const abortControllerRef = useRef(null);
  const mountedRef = useRef(true);

  const loadWallet = useCallback(
    async (showLoading = true) => {
      if (!checkAuth()) return;

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      if (showLoading) setLoading(true);
      setError(null);

      try {
        const response = await paymentAPI.getWallet();

        if (mountedRef.current && !abortControllerRef.current.signal.aborted) {
          if (response?.data?.success && response?.data?.data) {
            setWallet(response.data.data.wallet || {
              balance: 0,
              lockedBalance: 0,
              totalDeposited: 0,
              totalWithdrawn: 0,
              totalReceived: 0,
            });
            setTransactions(response.data.data.transactions || []);
          } else if (response?.data?.wallet) {
            setWallet(response.data.wallet);
            setTransactions(response.data.transactions || []);
          }
        }
      } catch (error) {
        if (error.name === "CanceledError" || error.code === "ERR_CANCELED") return;
        if (error.response?.status === 401 || error.response?.status === 403) return;
        if (mountedRef.current) {
          setError(error.message || "Failed to load wallet");
        }
      } finally {
        if (mountedRef.current && showLoading) {
          setLoading(false);
        }
        setRefreshing(false);
      }
    },
    [checkAuth]
  );

  const refreshWallet = useCallback(() => {
    if (!checkAuth()) return;
    setRefreshing(true);
    loadWallet(false);
  }, [loadWallet, checkAuth]);

  useEffect(() => {
    mountedRef.current = true;
    if (checkAuth()) {
      loadWallet().catch(() => {});
    } else {
      setWallet({
        balance: 0,
        lockedBalance: 0,
        totalDeposited: 0,
        totalWithdrawn: 0,
        totalReceived: 0,
        currency: "PKR",
      });
      setTransactions([]);
    }
    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [checkAuth, loadWallet]);

  const formatCurrency = useCallback((amount) => {
    if (amount === undefined || amount === null) return "PKR 0";
    return `PKR ${amount.toLocaleString()}`;
  }, []);

  const value = {
    wallet,
    transactions,
    loading,
    refreshing,
    error,
    refreshWallet,
    formatCurrency,
    loadWallet,
    isAuthenticated: checkAuth(),
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
};

const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};

export { WalletProvider, useWallet };



