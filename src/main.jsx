import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { initDemoData } from './components/DataProvider'
import './index.css'
import { AuthProvider } from './components/AuthProvider'
import { NotificationProvider } from './components/NotificationProvider'

// Initialize demo data (only on first load)
initDemoData()

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <App />
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
