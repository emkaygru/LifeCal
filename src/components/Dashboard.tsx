import React, { useState, useEffect } from 'react'

interface WeatherData {
  temperature: number
  condition: string
  alerts: string[]
  tip: string
  icon: string
}

interface TodoData {
  id: string
  text: string
  completed: boolean
  user: string
}

interface Event {
  id: string
  title: string
  time: string
  location?: string
}

interface DashboardProps {
  parking?: string | null
  setParking?: (parking: string | null) => void
}

export default function Dashboard({ parking, setParking }: DashboardProps = {}) {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [todos, setTodos] = useState<TodoData[]>([])
  const [todaysEvents, setTodaysEvents] = useState<Event[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())

  // Load weather data for Denver
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // For now, mock weather data
        // In production, integrate with weather API (OpenWeather, etc.)
        const mockWeather: WeatherData = {
          temperature: 72,
          condition: 'Partly Cloudy',
          alerts: ['Air Quality Alert in effect until 6 PM'],
          tip: 'Perfect weather for a walk! Maybe grab a light jacket for evening.',
          icon: '⛅'
        }
        setWeather(mockWeather)
      } catch (error) {
        console.error('Failed to fetch weather:', error)
      }
    }

    fetchWeather()
    // Refresh weather every 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // Load todos from localStorage
  useEffect(() => {
    const loadTodos = () => {
      try {
        const stored = localStorage.getItem('todos')
        if (stored) {
          const allTodos = JSON.parse(stored)
          setTodos(allTodos.filter((todo: TodoData) => !todo.completed))
        }
      } catch (error) {
        console.error('Failed to load todos:', error)
      }
    }

    loadTodos()
    
    // Listen for todo updates
    const handleTodosUpdate = () => loadTodos()
    window.addEventListener('todos-updated', handleTodosUpdate)
    return () => window.removeEventListener('todos-updated', handleTodosUpdate)
  }, [])

  // Load today's events
  useEffect(() => {
    const loadTodaysEvents = () => {
      try {
        const stored = localStorage.getItem('events')
        if (stored) {
          const allEvents = JSON.parse(stored)
          const today = new Date().toISOString().split('T')[0]
          const filtered = allEvents.filter((event: any) => 
            event.date === today
          ).map((event: any) => ({
            id: event.id,
            title: event.title,
            time: event.time || 'All day',
            location: event.location
          }))
          setTodaysEvents(filtered)
        }
      } catch (error) {
        console.error('Failed to load events:', error)
      }
    }

    loadTodaysEvents()
    
    // Listen for event updates
    const handleEventsUpdate = () => loadTodaysEvents()
    window.addEventListener('events-updated', handleEventsUpdate)
    return () => window.removeEventListener('events-updated', handleEventsUpdate)
  }, [])

  // Update current date every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDate(new Date())
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  const getUserTodos = (user: string) => {
    return todos.filter(todo => todo.user === user)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Family Dashboard</h1>
        <div className="header-right">
          <div className="parking-mobile">
            <span>🚗</span>
            <select 
              value={parking || ''} 
              onChange={(e) => {
                const newParking = e.target.value || null
                setParking(newParking)
                localStorage.setItem('parking', newParking || '')
              }}
              className="parking-select"
            >
              <option value="">No parking set</option>
              <option value="P2">Parked in P2</option>
              <option value="P3">Parked in P3</option>
            </select>
          </div>
          <div className="datetime">
            <div className="date">{formatDate(currentDate)}</div>
            <div className="time">{formatTime(currentDate)}</div>
          </div>
        </div>
      </div>

      {/* Row 1: Weather (cols 1-3) + Calendar (col 4) */}
      <div className="dashboard-row row-1">
        <div className="weather-section span-3">
          {weather ? (
            <>
              <div className="weather-main">
                <div className="weather-icon">{weather.icon}</div>
                <div className="weather-temp">{weather.temperature}°F</div>
                <div className="weather-condition">{weather.condition}</div>
              </div>
              <div className="weather-details">
                <div className="weather-location">📍 Denver, Colorado</div>
                {weather.alerts.length > 0 && (
                  <div className="weather-alerts">
                    {weather.alerts.map((alert, index) => (
                      <div key={index} className="alert">⚠️ {alert}</div>
                    ))}
                  </div>
                )}
                <div className="weather-tip">💡 {weather.tip}</div>
              </div>
            </>
          ) : (
            <div className="loading">Loading weather...</div>
          )}
        </div>

        <div className="calendar-overview">
          <h3>This Month</h3>
          <div className="mini-calendar">
            {/* Mini calendar implementation */}
            <div className="calendar-grid">
              {/* This would show a small calendar view */}
              <p>Calendar overview coming soon...</p>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Todos (cols 1-3) + Events (col 4) */}
      <div className="dashboard-row row-2">
        <div className="todo-section">
          <div className="todo-column">
            <h3>👩 Emily</h3>
            <div className="todo-list">
              {getUserTodos('Emily').map(todo => (
                <div key={todo.id} className="todo-item">
                  <span>{todo.text}</span>
                </div>
              ))}
              {getUserTodos('Emily').length === 0 && (
                <div className="no-todos">All caught up! 🎉</div>
              )}
            </div>
          </div>

          <div className="todo-column">
            <h3>👩 Steph</h3>
            <div className="todo-list">
              {getUserTodos('Steph').map(todo => (
                <div key={todo.id} className="todo-item">
                  <span>{todo.text}</span>
                </div>
              ))}
              {getUserTodos('Steph').length === 0 && (
                <div className="no-todos">All caught up! 🎉</div>
              )}
            </div>
          </div>

          <div className="todo-column">
            <h3>👶 Maisie</h3>
            <div className="todo-list">
              {getUserTodos('Maisie').map(todo => (
                <div key={todo.id} className="todo-item">
                  <span>{todo.text}</span>
                </div>
              ))}
              {getUserTodos('Maisie').length === 0 && (
                <div className="no-todos">All caught up! 🎉</div>
              )}
            </div>
          </div>
        </div>

        <div className="events-section">
          <h3>Today's Schedule</h3>
          <div className="events-list">
            {todaysEvents.map(event => (
              <div key={event.id} className="event-item">
                <div className="event-time">{event.time}</div>
                <div className="event-details">
                  <div className="event-title">{event.title}</div>
                  {event.location && (
                    <div className="event-location">📍 {event.location}</div>
                  )}
                </div>
              </div>
            ))}
            {todaysEvents.length === 0 && (
              <div className="no-events">No events scheduled for today</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}