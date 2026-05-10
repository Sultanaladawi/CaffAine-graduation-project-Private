import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { openingHours } from '../data/shopData';

const StoreContext = createContext();

export const StoreProvider = ({ children }) => {
  const [manualStatus, setManualStatus] = useState('auto');
  const [isStoreOpen, setIsStoreOpen] = useState(true);

  const checkAutoStatus = () => {
    const now = new Date();
    const day = now.getDay();
    const time = now.getHours() * 100 + now.getMinutes();

    let openTime, closeTime;
    if (day >= 1 && day <= 5) { openTime = 730; closeTime = 1700; }
    else if (day === 6) { openTime = 900; closeTime = 1800; }
    else { openTime = 1000; closeTime = 1600; }

    return time >= openTime && time < closeTime;
  };

  const API_BASE = ''; // Use relative path, proxy in package.json will handle it on localhost, and ngrok will handle it on mobile

  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      if (isUpdating) return; // Skip polling if we are currently updating the status
      try {
        const res = await axios.get(`${API_BASE}/api/store-status`);
        setManualStatus(res.data.mode || 'auto');
        setIsStoreOpen(res.data.status === 'open');
      } catch (err) {
        console.error("Fetch Status Error:", err);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, [isUpdating]);

  const toggleStatus = async () => {
    setIsUpdating(true);
    let next;
    if (manualStatus === 'auto') next = 'manual_closed';
    else if (manualStatus === 'manual_closed') next = 'manual_open';
    else next = 'auto';
    
    setManualStatus(next);

    try {
      await axios.post(`${API_BASE}/api/store-status`, { status: next });
      // Small delay before allowing polling again to ensure backend is ready
      setTimeout(() => setIsUpdating(false), 2000);
    } catch (err) {
      console.error("Failed to update store status:", err);
      setIsUpdating(false);
      alert("Error: Could not connect to server.");
    }
  };

  return (
    <StoreContext.Provider value={{ isStoreOpen, manualStatus, toggleStatus }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => useContext(StoreContext);
