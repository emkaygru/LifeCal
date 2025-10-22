import { useState, useEffect } from 'react'
import DrawingPad from './DrawingPad'
import { getPuppyLogsForDate, getPuppyStats } from '../lib/puppyLog'

interface DaySticker {
  id: string
  url: string
  title: string
  x: number
  y: number
}

interface EventItem {
  id: string
  title: string
  start: Date
  end: Date
  description?: string
}

interface DayViewProps {
  date: Date
  events?: EventItem[]
  onClose: () => void
  initialPosition?: { x: number, y: number, width: number, height: number }
}

export default function DayView({ date, events = [], onClose, initialPosition }: DayViewProps) {
  const [stickers, setStickers] = useState<DaySticker[]>([])

  const [notes, setNotes] = useState('')
  const [drawing, setDrawing] = useState('')
  const [selectedMeal, setSelectedMeal] = useState('')
  const [todos, setTodos] = useState<any[]>([])
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingStickerId, setEditingStickerId] = useState<string | null>(null)
  const [holdTimer, setHoldTimer] = useState<NodeJS.Timeout | null>(null)
  const [isAnimating, setIsAnimating] = useState(true)
  const [currentTool, setCurrentTool] = useState<'draw' | 'emoji'>('draw')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [puppyStats, setPuppyStats] = useState(getPuppyStats())
  const [dayPuppyLogs, setDayPuppyLogs] = useState(getPuppyLogsForDate(date))

  const dateKey = date.toISOString().split('T')[0]

  useEffect(() => {
    // Load existing data for this day
    const savedStickers = localStorage.getItem(`stickers-${dateKey}`)
    const savedNotes = localStorage.getItem(`notes-${dateKey}`)
    const savedDrawing = localStorage.getItem(`drawing-${dateKey}`)
    
    // Load meal from meals array
    const meals = JSON.parse(localStorage.getItem('meals') || '[]')
    const dayMeal = meals.find((m: any) => m.date === dateKey)
    
    // Load todos from todos array
    const allTodos = JSON.parse(localStorage.getItem('todos') || '[]')
    const dayTodos = allTodos.filter((t: any) => t.date === dateKey)

    if (savedStickers) {
      setStickers(JSON.parse(savedStickers))
    }
    if (savedNotes) {
      setNotes(savedNotes)
    }
    if (savedDrawing) {
      setDrawing(savedDrawing)
    }
    if (dayMeal) {
      setSelectedMeal(dayMeal.title || '')
    }
    setTodos(dayTodos)

    // Load puppy data
    setPuppyStats(getPuppyStats())
    setDayPuppyLogs(getPuppyLogsForDate(date))

    // Trigger animation
    setTimeout(() => setIsAnimating(false), 100)
  }, [dateKey])

  // Listen for todos and meals updates
  useEffect(() => {
    const handleTodosUpdate = () => {
      const allTodos = JSON.parse(localStorage.getItem('todos') || '[]')
      const dayTodos = allTodos.filter((t: any) => t.date === dateKey)
      setTodos(dayTodos)
    }

    const handleMealsUpdate = () => {
      const meals = JSON.parse(localStorage.getItem('meals') || '[]')
      const dayMeal = meals.find((m: any) => m.date === dateKey)
      setSelectedMeal(dayMeal ? dayMeal.title || '' : '')
    }

    const handlePuppyLogUpdate = () => {
      setPuppyStats(getPuppyStats())
      setDayPuppyLogs(getPuppyLogsForDate(date))
    }

    window.addEventListener('todos-updated', handleTodosUpdate)
    window.addEventListener('meals-updated', handleMealsUpdate)
    window.addEventListener('puppy-log-updated', handlePuppyLogUpdate)

    return () => {
      window.removeEventListener('todos-updated', handleTodosUpdate)
      window.removeEventListener('meals-updated', handleMealsUpdate)
      window.removeEventListener('puppy-log-updated', handlePuppyLogUpdate)
    }
  }, [dateKey])

  function saveStickers(newStickers: DaySticker[]) {
    setStickers(newStickers)
    localStorage.setItem(`stickers-${dateKey}`, JSON.stringify(newStickers))
    
    // Trigger sync
    window.dispatchEvent(new CustomEvent('localStorageChange', {
      detail: { key: `stickers-${dateKey}`, value: JSON.stringify(newStickers) }
    }))
  }

  function addSticker(giphySticker: any) {
    const newSticker: DaySticker = {
      id: `${Date.now()}-${giphySticker.id}`,
      url: giphySticker.images.fixed_height_small.url,
      title: giphySticker.title,
      x: Math.random() * 300 + 50, // Random position in canvas
      y: Math.random() * 200 + 50
    }
    
    saveStickers([...stickers, newSticker])
  }

  function moveSticker(stickerId: string, x: number, y: number) {
    const newStickers = stickers.map(s => 
      s.id === stickerId ? { ...s, x, y } : s
    )
    saveStickers(newStickers)
  }

  function removeSticker(stickerId: string) {
    saveStickers(stickers.filter(s => s.id !== stickerId))
    setEditingStickerId(null)
  }

  function handleStickerMouseDown(stickerId: string, e: React.MouseEvent) {
    // Start hold timer for delete mode on this specific sticker
    const timer = setTimeout(() => {
      setEditingStickerId(stickerId)
    }, 800) // 800ms hold
    
    setHoldTimer(timer)
  }

  function handleStickerMouseUp() {
    // Clear hold timer
    if (holdTimer) {
      clearTimeout(holdTimer)
      setHoldTimer(null)
    }
  }

  function handleStickerClick(stickerId: string, e: React.MouseEvent) {
    // If we're clicking and not holding, just clear edit mode
    if (editingStickerId && editingStickerId !== stickerId) {
      setEditingStickerId(null)
    }
  }

  function saveMeal(meal: string) {
    setSelectedMeal(meal)
    
    // Update meals array in localStorage
    const meals = JSON.parse(localStorage.getItem('meals') || '[]')
    const existingMealIndex = meals.findIndex((m: any) => m.date === dateKey)
    
    if (existingMealIndex >= 0) {
      meals[existingMealIndex].title = meal
    } else {
      meals.push({
        id: Date.now().toString(),
        date: dateKey,
        title: meal,
        groceries: []
      })
    }
    
    localStorage.setItem('meals', JSON.stringify(meals))
    
    // Trigger sync
    window.dispatchEvent(new CustomEvent('meals-updated'))
  }

  function toggleTodo(todoId: string) {
    const allTodos = JSON.parse(localStorage.getItem('todos') || '[]')
    const todoIndex = allTodos.findIndex((t: any) => t.id === todoId)
    
    if (todoIndex >= 0) {
      allTodos[todoIndex].done = !allTodos[todoIndex].done
      localStorage.setItem('todos', JSON.stringify(allTodos))
      
      // Update local state
      const dayTodos = allTodos.filter((t: any) => t.date === dateKey)
      setTodos(dayTodos)
      
      // Trigger sync
      window.dispatchEvent(new CustomEvent('todos-updated'))
    }
  }

  function saveNotes(newNotes: string) {
    setNotes(newNotes)
    localStorage.setItem(`notes-${dateKey}`, newNotes)
    
    // Trigger sync
    window.dispatchEvent(new CustomEvent('localStorageChange', {
      detail: { key: `notes-${dateKey}`, value: newNotes }
    }))
  }

  function saveDrawing(newDrawing: string) {
    setDrawing(newDrawing)
    localStorage.setItem(`drawing-${dateKey}`, newDrawing)
    
    // Trigger sync
    window.dispatchEvent(new CustomEvent('localStorageChange', {
      detail: { key: `drawing-${dateKey}`, value: newDrawing }
    }))
  }

  const isBirthday = date.getDate() === 26 && date.getMonth() === 0 // Jan 26
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' })
  const dateNumber = date.getDate()
  const monthName = date.toLocaleDateString('en-US', { month: 'short' })

  // Get todos and events for this day
  const dayTodos = todos

  // Use real events passed from CalendarView
  const dayEvents = events.map(event => ({
    time: event.start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    title: event.title,
    description: event.description
  }))

  return (
    <div className="day-view-overlay" onClick={onClose}>
      <div 
        className={`day-card ${isAnimating ? 'zooming-in' : ''}`}
        onClick={(e) => e.stopPropagation()}
        style={initialPosition ? {
          '--initial-x': `${initialPosition.x}px`,
          '--initial-y': `${initialPosition.y}px`,
          '--initial-width': `${initialPosition.width}px`,
          '--initial-height': `${initialPosition.height}px`
        } as React.CSSProperties : {}}
      >
        <button onClick={onClose} className="close-btn">✕</button>
        
        {/* Header Section - Date and Events */}
        <div className="day-header">
          <div className="day-date">
            <div className="date-number">{dateNumber}</div>
            <div className="date-details">
              <div className="month">{monthName}</div>
              <div className="weekday">{dayName}</div>
              {isBirthday && <div className="birthday-badge">🎂</div>}
            </div>
          </div>
          
          <div className="day-events">
            <h4>Events</h4>
            {dayEvents.length === 0 ? (
              <div className="empty-state">No events</div>
            ) : (
              dayEvents.map((event, i) => (
                <div key={i} className="event-item">
                  <span className="event-time">{event.time}</span>
                  <span className="event-title">{event.title}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Puppy Section */}
        <div className="day-puppy">
          <h4>🐕 Maisie</h4>
          {(() => {
            const lastPotty = puppyStats.lastPotty
            const pottyLogs = dayPuppyLogs.filter(log => log.types.includes('pee') || log.types.includes('poop'))
            const lastPottyToday = pottyLogs.length > 0 
              ? pottyLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0]
              : null
            
            const formatTime = (date: Date) => {
              return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
            }

            const getLastPottyInfo = () => {
              if (!lastPottyToday) {
                return lastPotty ? (
                  <div className="puppy-info">
                    Last potty: {formatTime(lastPotty)} (yesterday)
                  </div>
                ) : (
                  <div className="puppy-info">No potty logged yet</div>
                )
              }

              // Check if there was both pee and poop at the same time (within 5 minutes)
              const sameTimeLogs = pottyLogs.filter(log => 
                Math.abs(log.timestamp.getTime() - lastPottyToday.timestamp.getTime()) < 5 * 60 * 1000
              )
              
              const hasPee = sameTimeLogs.some(log => log.types.includes('pee'))
              const hasPoop = sameTimeLogs.some(log => log.types.includes('poop'))

              let emoji = ''
              if (hasPee && hasPoop) emoji = '💧💩'
              else if (hasPee) emoji = '💧'
              else if (hasPoop) emoji = '💩'

              return (
                <div className="puppy-info">
                  Last potty: {formatTime(lastPottyToday.timestamp)} {emoji}
                </div>
              )
            }

            return getLastPottyInfo()
          })()}
        </div>

        {/* Todos Section */}
        <div className="day-todos">
          <div className="todos-header">
            <h4>To-dos</h4>
            {todos.length === 0 ? (
              <div className="add-todo-inline">
                <input 
                  type="text"
                  placeholder="Click to add a todo..."
                  className="todo-input"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const todoText = (e.target as HTMLInputElement).value.trim()
                      if (todoText) {
                        const newTodo = {
                          id: Date.now().toString(),
                          title: todoText,
                          date: dateKey,
                          done: false,
                          owner: 'Emily'
                        }
                        const allTodos = JSON.parse(localStorage.getItem('todos') || '[]')
                        const updatedTodos = [...allTodos, newTodo]
                        localStorage.setItem('todos', JSON.stringify(updatedTodos))
                        setTodos(updatedTodos.filter((t: any) => t.date === dateKey))
                        window.dispatchEvent(new CustomEvent('todos-updated'))
                        ;(e.target as HTMLInputElement).value = ''
                      }
                    }
                  }}
                />
              </div>
            ) : (
              <button 
                className="add-todo-btn"
                onClick={() => {
                  // Add input field when there are existing todos
                  const todoText = prompt('Add a todo:')
                  if (todoText?.trim()) {
                    const newTodo = {
                      id: Date.now().toString(),
                      title: todoText.trim(),
                      date: dateKey,
                      done: false,
                      owner: 'Emily'
                    }
                    const allTodos = JSON.parse(localStorage.getItem('todos') || '[]')
                    const updatedTodos = [...allTodos, newTodo]
                    localStorage.setItem('todos', JSON.stringify(updatedTodos))
                    setTodos(updatedTodos.filter((t: any) => t.date === dateKey))
                    window.dispatchEvent(new CustomEvent('todos-updated'))
                  }
                }}
              >
                Add Todo
              </button>
            )}
          </div>
          
          {todos.length > 0 && (
            <div className="todos-list">
              {todos.map((todo) => (
                <div key={todo.id} className="todo-item">
                  <input 
                    type="checkbox" 
                    checked={todo.done}
                    onChange={() => toggleTodo(todo.id)}
                  />
                  <span className={`todo-text ${todo.done ? 'done' : ''}`}>
                    {todo.title}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notes: Whiteboard Canvas */}
        <div className="notes-canvas">          
          <div className="canvas-tools">
            <div className="tool-group">
              <button 
                className={`tool-btn ${currentTool === 'draw' ? 'active' : ''}`} 
                title="Draw"
                onClick={() => {
                  setCurrentTool('draw')
                  setShowEmojiPicker(false)
                }}
              >
                ✏️
              </button>
              <button 
                className={`tool-btn ${currentTool === 'emoji' ? 'active' : ''}`} 
                title="Add Emoji"
                onClick={() => {
                  setCurrentTool('emoji')
                  setShowEmojiPicker(!showEmojiPicker)
                }}
              >
                😊
              </button>
            </div>
            
            {showEmojiPicker && (
              <div className="emoji-picker">
                {['😊', '❤️', '🎉', '✨', '📝', '☀️', '🌙', '⭐', '🏠', '🍕'].map((emoji) => (
                <button
                  key={emoji}
                  className="emoji-option"
                  onClick={() => {
                    // Add emoji to canvas at random position
                    const newSticker: DaySticker = {
                      id: `emoji-${Date.now()}-${emoji}`,
                      url: '',
                      title: emoji,
                      x: Math.random() * 200 + 20,
                      y: Math.random() * 120 + 20
                    }
                    saveStickers([...stickers, newSticker])
                    setShowEmojiPicker(false)
                  }}
                >
                  {emoji}
                </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="drawing-canvas">
            <DrawingPad />
            
            {/* Emoji stickers overlay */}
            {stickers.map((sticker) => (
              <div
                key={sticker.id}
                className="emoji-sticker"
                style={{ 
                  left: sticker.x + 'px', 
                  top: sticker.y + 'px',
                  position: 'absolute',
                  zIndex: 10,
                  fontSize: '24px',
                  cursor: 'move',
                  userSelect: 'none'
                }}
                draggable
                onDragEnd={(e) => {
                  const rect = e.currentTarget.parentElement!.getBoundingClientRect()
                  const x = Math.max(0, Math.min(e.clientX - rect.left - 12, rect.width - 24))
                  const y = Math.max(0, Math.min(e.clientY - rect.top - 12, rect.height - 24))
                  moveSticker(sticker.id, x, y)
                }}
                onDoubleClick={() => removeSticker(sticker.id)}
                title="Double-click to remove"
              >
                {sticker.title}
              </div>
            ))}
          </div>
          

        </div>

        {/* Meal Plan Section - Bottom */}
        <div className="day-meal">
          <h4>Meal Plan</h4>
          <div className="meal-content">
            <select 
              value={selectedMeal} 
              onChange={(e) => saveMeal(e.target.value)}
              className="meal-select"
            >
              <option value="">No meal planned</option>
              <option value="FACTOR">FACTOR 📦</option>
              <option value="Pasta Night">Pasta Night 🍝</option>
              <option value="Pizza">Pizza 🍕</option>
              <option value="Tacos">Tacos 🌮</option>
              <option value="Date Night">Date Night 💕</option>
              <option value="Takeout">Takeout 🥡</option>
            </select>
            
            {selectedMeal && (
              <div className="meal-display">
                {selectedMeal}
                {isBirthday && ' 🎂'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}