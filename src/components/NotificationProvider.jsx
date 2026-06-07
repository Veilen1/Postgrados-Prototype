import React, { createContext, useState, useContext } from 'react'
import { Snackbar, Alert } from '@mui/material'

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
  const [msg, setMsg] = useState(null)

  function notify(message, severity = 'info') {
    setMsg({ message, severity })
  }

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      <Snackbar open={!!msg} autoHideDuration={4000} onClose={() => setMsg(null)}>
        {msg && <Alert onClose={() => setMsg(null)} severity={msg.severity} sx={{ width: '100%' }}>{msg.message}</Alert>}
      </Snackbar>
    </NotificationContext.Provider>
  )
}

export function useNotify() {
  return useContext(NotificationContext)
}
