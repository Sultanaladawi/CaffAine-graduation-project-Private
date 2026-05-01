import React, { createContext, useContext, useMemo } from 'react';
import { useAdminAuth } from './useAdminAuth'; 

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const auth = useAdminAuth();
  const value = useMemo(() => auth, [auth]);

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
}

export const useAdminContext = () => {
  const context = useContext(AdminContext);
  
  if (context === null) {
    throw new Error('useAdminContext must be used within an AdminProvider');
  }
  
  return context;
};