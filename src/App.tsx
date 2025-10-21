import React, { useState, useEffect } from 'react'
import CalendarView from './components/CalendarView'
import Dashboard from './components/Dashboard'
import IdleSlideshow from './components/IdleSlideshow'
import TodoAccordion from './components/TodoAccordion'
import DrawingPad from './components/DrawingPad'
import GroceryList from './components/GroceryList'
import MealPlanner from './components/MealPlanner'
import PeopleManager from './components/PeopleManager'
import LayoutCustomizer from './components/LayoutCustomizer'
import EnhancedFAB from './components/EnhancedFAB'
import IconSidebar from './components/IconSidebar'
import { initSync } from './lib/sync'

export default function App() {
  const [currentPage, setCurrentPage] = useState<'calendar' | 'dashboard' | 'idle'>(() => {
    const saved = localStorage.getItem('currentPage')
    if (saved === 'calendar' || saved === 'dashboard' || saved === 'idle') {
      return saved
    }
    return 'calendar'
  })
  const [layout, setLayout] = useState('default')
  const [selectedDate, setSelectedDate] = useState<string | null>(null) // format YYYY-MM-DD
  const [theme, setTheme] = useState<'dark'|'light'>(() => (localStorage.getItem('theme') as any) || 'dark')
  const [user, setUser] = useState<string>(() => localStorage.getItem('user') || 'Emily')
  const [parking, setParking] = useState<string | null>(() => localStorage.getItem('parking') || null)
  const [syncStatus, setSyncStatus] = useState<'online' | 'offline' | 'syncing'>('offline')

  function handleSelectDate(dateKey: string) {
    setSelectedDate(dateKey)
  }

  // Initialize real-time sync
  useEffect(() => {
    const sync = initSync();
    
    // Update sync status
    const updateSyncStatus = () => {
      setSyncStatus(navigator.onLine ? 'online' : 'offline');
    };
    
    updateSyncStatus();
    window.addEventListener('online', updateSyncStatus);
    window.addEventListener('offline', updateSyncStatus);
    
    // Listen for sync events to update UI
    const handleTodosSync = (e: any) => {
      setSyncStatus('syncing');
      setTimeout(() => setSyncStatus('online'), 1000);
      window.dispatchEvent(new CustomEvent('todos-updated'));
    };
    
    const handleMealsSync = (e: any) => {
      setSyncStatus('syncing');
      setTimeout(() => setSyncStatus('online'), 1000);
      window.dispatchEvent(new CustomEvent('meals-updated'));
    };

    window.addEventListener('todos-synced', handleTodosSync);
    window.addEventListener('meals-synced', handleMealsSync);

    return () => {
      window.removeEventListener('online', updateSyncStatus);
      window.removeEventListener('offline', updateSyncStatus);
      window.removeEventListener('todos-synced', handleTodosSync);
      window.removeEventListener('meals-synced', handleMealsSync);
    };
  }, []);

  return (
    <div className="app">
      {currentPage === 'idle' ? (
        <IdleSlideshow />
      ) : (
        <>
          <header className="topbar">
            <div className="page-nav">
              <button 
                className={`nav-btn ${currentPage === 'calendar' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentPage('calendar')
                  localStorage.setItem('currentPage', 'calendar')
                }}
              >
                Cal
              </button>
              <button 
                className={`nav-btn ${currentPage === 'dashboard' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentPage('dashboard')
                  localStorage.setItem('currentPage', 'dashboard')
                }}
              >
                Dashboard
              </button>
              <button 
                className={`nav-btn ${currentPage === 'idle' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentPage('idle')
                  localStorage.setItem('currentPage', 'idle')
                }}
              >
                Idle
              </button>
            </div>
            
            <h1>LifeCal</h1>
            
            <div className="header-controls">
              <button 
                className="theme-toggle"
                onClick={() => {
                  const newTheme = theme === 'dark' ? 'light' : 'dark'
                  setTheme(newTheme)
                  localStorage.setItem('theme', newTheme)
                  document.documentElement.setAttribute('data-theme', newTheme)
                }}
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
              
              <label className="user-select">
                <select className="btn" value={user} onChange={(e)=>{ setUser(e.target.value); localStorage.setItem('user', e.target.value) }}>
                  <option>Emily</option>
                  <option>Steph</option>
                </select>
              </label>
              
              <div className="sync-status">
                <span className={`sync-indicator ${syncStatus}`}>
                  {syncStatus === 'online' ? '🟢' : syncStatus === 'syncing' ? '🔄' : '🔴'}
                </span>
                <small>{syncStatus === 'online' ? 'Synced' : syncStatus === 'syncing' ? 'Syncing...' : 'Offline'}</small>
              </div>
            </div>
          </header>          <main className="dashboard">
            {currentPage === 'dashboard' ? (
              <Dashboard />
            ) : (
              <>
                <section className="calendar-col">
                  <CalendarView selectedDate={selectedDate} onSelectDate={handleSelectDate} />
                </section>

                {/* Icon-based Sidebar for Desktop/Tablet */}
                <IconSidebar selectedDate={selectedDate} parking={parking} setParking={setParking} />
              </>
            )}
          </main>

          {/* Enhanced Mobile Floating Action Button - only show on calendar page */}
          {currentPage === 'calendar' && <EnhancedFAB selectedDate={selectedDate} />}
        </>
      )}
    </div>
  )
}

