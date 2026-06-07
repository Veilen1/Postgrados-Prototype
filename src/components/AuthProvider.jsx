import React, { createContext, useContext, useState, useEffect } from 'react'
import { getCurrentUser as dpGetCurrentUser, login as dpLogin, logout as dpLogout } from './DataProvider'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => dpGetCurrentUser())

  useEffect(() => {
    // keep in sync if other tabs modify localStorage
    function onStorage(e) {
      if (e.key === 'posgrado_current_user') setUser(dpGetCurrentUser())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  async function signIn(username, password) {
    const u = dpLogin(username, password)
    if (u) setUser(u)
    return u
  }

  function signOut() {
    dpLogout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, signIn, signOut, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
