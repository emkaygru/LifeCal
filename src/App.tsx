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
                📅 Calendar
              </button>
              <button 
                className={`nav-btn ${currentPage === 'dashboard' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentPage('dashboard')
                  localStorage.setItem('currentPage', 'dashboard')
                }}
              >
                📊 Dashboard
              </button>
              <button 
                className={`nav-btn ${(currentPage as string) === 'idle' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentPage('idle')
                  localStorage.setItem('currentPage', 'idle')
                }}
              >
                🖼️ Slideshow
              </button>
            </div>
            
            <h1>LifeCal</h1>
            
            <div className="parking-widget">
              <span>Parked in:</span>
              <button 
                className={`parking-btn ${parking === 'P2' ? 'active' : ''}`}
                onClick={() => {
                  const newParking = parking === 'P2' ? null : 'P2'
                  setParking(newParking)
                  localStorage.setItem('parking', newParking || '')
                }}
              >
                P2
              </button>
              <button 
                className={`parking-btn ${parking === 'P3' ? 'active' : ''}`}
                onClick={() => {
                  const newParking = parking === 'P3' ? null : 'P3'
                  setParking(newParking)
                  localStorage.setItem('parking', newParking || '')
                }}
              >
                P3
              </button>
            </div>
            <div className="layout-controls">
              <label>
                Layout:
                <select className="btn" value={layout} onChange={(e) => setLayout(e.target.value)}>
                  <option value="default">Default</option>
                  <option value="compact">Compact</option>
                </select>
              </label>
              <label>
                Theme:
                <select className="btn" value={theme} onChange={(e)=>{ const v = e.target.value as any; setTheme(v); localStorage.setItem('theme', v); document.documentElement.setAttribute('data-theme', v) }}>
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                </select>
              </label>
              <label>
                User:
                <select className="btn" value={user} onChange={(e)=>{ setUser(e.target.value); localStorage.setItem('user', e.target.value) }}>
                  <option>Emily</option>
                  <option>Steph</option>
                </select>
              </label>
            </div>
            <div className="sync-status">
              <span className={`sync-indicator ${syncStatus}`}>
                {syncStatus === 'online' ? '🟢' : syncStatus === 'syncing' ? '🔄' : '🔴'}
              </span>
              <small>{syncStatus === 'online' ? 'Synced' : syncStatus === 'syncing' ? 'Syncing...' : 'Offline'}</small>
            </div>
          </header>

          <main className="dashboard">
            {currentPage === 'dashboard' ? (
              <Dashboard />
            ) : (
              <>
                <section className="calendar-col">
                  <CalendarView selectedDate={selectedDate} onSelectDate={handleSelectDate} />
                </section>

                {/* Icon-based Sidebar for Desktop/Tablet */}
                <IconSidebar selectedDate={selectedDate} />
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

