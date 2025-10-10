import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

// apply theme
const theme = localStorage.getItem('theme') || 'dark'
document.documentElement.setAttribute('data-theme', theme)
