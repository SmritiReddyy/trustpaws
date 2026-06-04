import React, { createContext, useContext, useState } from 'react';

const ParentAuthContext = createContext(null);

export function ParentAuthProvider({ children }) {
  const [parentUser, setParentUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('parent_user')); } catch { return null; }
  });

  const logout = () => {
    localStorage.removeItem('parent_token');
    localStorage.removeItem('parent_user');
    setParentUser(null);
  };

  return (
    <ParentAuthContext.Provider value={{ parentUser, setParentUser, logout }}>
      {children}
    </ParentAuthContext.Provider>
  );
}

export const useParentAuth = () => useContext(ParentAuthContext);
