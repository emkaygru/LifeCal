import React, { useState, useEffect } from 'react'
import CalendarView from './components/CalendarView'
import Dashboard from './components/Dashboard'
import IdleSlideshow from './components/IdleSlideshow'
import HomeView from './components/HomeView'
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
  const [sidebarState, setSidebarState] = useState<'closed' | 'narrow' | 'expanded'>(() => {
    return (localStorage.getItem('sidebarState') as any) || 'narrow'
  })

  function handleSelectDate(dateKey: string) {
    setSelectedDate(dateKey)
  }

  function toggleSidebar() {
    const nextState = sidebarState === 'closed' ? 'narrow' : 
                      sidebarState === 'narrow' ? 'expanded' : 'closed'
    setSidebarState(nextState)
    localStorage.setItem('sidebarState', nextState)
  }

  function setSidebarWidth(state: 'closed' | 'narrow' | 'expanded') {
    setSidebarState(state)
    localStorage.setItem('sidebarState', state)
  }

  function handleSidebarResize(event: React.MouseEvent) {
    // Get the mouse position relative to the window
    const mouseX = event.clientX
    const windowWidth = window.innerWidth
    const relativePosition = mouseX / windowWidth

    // Determine state based on position
    if (relativePosition > 0.8) {
      setSidebarWidth('closed')
    } else if (relativePosition > 0.6) {
      setSidebarWidth('narrow')
    } else {
      setSidebarWidth('expanded')
    }
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
        <IdleSlideshow onExit={() => {
          setCurrentPage('calendar')
          localStorage.setItem('currentPage', 'calendar')
        }} />
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
                className="nav-btn"
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
          </header>          <main className={`dashboard ${sidebarState !== 'closed' ? 'sidebar-open' : ''}`}>
            {currentPage === 'dashboard' ? (
              <Dashboard parking={parking} setParking={setParking} />
            ) : (
              <div className={`main-layout ${sidebarState}`}>
                <section className={`calendar-col ${sidebarState === 'expanded' ? 'collapsed' : ''}`}>
                  <HomeView 
                    selectedDate={selectedDate} 
                    onSelectDate={handleSelectDate} 
                    parking={parking} 
                    setParking={setParking} 
                    sidebarState={sidebarState}
                    onSidebarStateChange={setSidebarWidth}
                  />
                </section>

                {/* Floating Toggle Button - visible when sidebar is closed */}
                {sidebarState === 'closed' && (
                  <button className="floating-sidebar-toggle" onClick={toggleSidebar}>
                    ←
                  </button>
                )}

                {/* Sliding Sidebar */}
                <aside className={`sliding-sidebar ${sidebarState}`}>
                  <div className="sidebar-header">
                    <div className="sidebar-state-indicator">
                      <span className="sidebar-title">
                        {sidebarState === 'narrow' ? 'Quick View' : sidebarState === 'expanded' ? 'Detailed View' : 'Hidden'}
                      </span>
                      <div className="sidebar-state-dots">
                        <span className={`state-dot ${sidebarState === 'closed' ? 'active' : ''}`}></span>
                        <span className={`state-dot ${sidebarState === 'narrow' ? 'active' : ''}`}></span>
                        <span className={`state-dot ${sidebarState === 'expanded' ? 'active' : ''}`}></span>
                      </div>
                    </div>
                    <button className="sidebar-toggle" onClick={toggleSidebar}>
                      {sidebarState === 'closed' ? '←' : sidebarState === 'narrow' ? '→' : '×'}
                    </button>
                  </div>
                  <div className="sidebar-content">
                    {sidebarState !== 'closed' && (
                      <IconSidebar 
                        selectedDate={selectedDate} 
                        parking={parking} 
                        setParking={setParking} 
                        sidebarState={sidebarState}
                      />
                    )}
                  </div>
                </aside>
              </div>
            )}
          </main>

          {/* Enhanced Mobile Floating Action Button - only show on calendar page */}
          {currentPage === 'calendar' && <EnhancedFAB selectedDate={selectedDate} />}
        </>
      )}
    </div>
  )
}

