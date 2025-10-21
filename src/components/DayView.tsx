import { useState, useEffect } from 'react'
import DrawingPad from './DrawingPad'
import { GiphyPicker } from './GiphyPicker'

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
  const [showGiphyPicker, setShowGiphyPicker] = useState(false)
  const [notes, setNotes] = useState('')
  const [drawing, setDrawing] = useState('')
  const [selectedMeal, setSelectedMeal] = useState('')
  const [todos, setTodos] = useState<any[]>([])
  const [isEditMode, setIsEditMode] = useState(false)
  const [holdTimer, setHoldTimer] = useState<NodeJS.Timeout | null>(null)
  const [isAnimating, setIsAnimating] = useState(true)

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

    window.addEventListener('todos-updated', handleTodosUpdate)
    window.addEventListener('meals-updated', handleMealsUpdate)

    return () => {
      window.removeEventListener('todos-updated', handleTodosUpdate)
      window.removeEventListener('meals-updated', handleMealsUpdate)
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
    setShowGiphyPicker(false)
  }

  function moveSticker(stickerId: string, x: number, y: number) {
    const newStickers = stickers.map(s => 
      s.id === stickerId ? { ...s, x, y } : s
    )
    saveStickers(newStickers)
  }

  function removeSticker(stickerId: string) {
    saveStickers(stickers.filter(s => s.id !== stickerId))
    setIsEditMode(false)
  }

  function handleStickerMouseDown(stickerId: string, e: React.MouseEvent) {
    // Start hold timer for delete mode
    const timer = setTimeout(() => {
      setIsEditMode(true)
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

        {/* Todos Section */}
        <div className="day-todos">
          <h4>To-dos</h4>
          {dayTodos.length === 0 ? (
            <div className="empty-state">No todos</div>
          ) : (
            dayTodos.map((todo) => (
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
            ))
          )}
        </div>

        {/* Creative Canvas Section */}
        <div className="day-canvas">
          <div className="canvas-area">
            {/* Stickers on canvas */}
            {stickers.map((sticker) => (
              <div
                key={sticker.id}
                className={`canvas-sticker ${isEditMode ? 'shake' : ''}`}
                style={{ 
                  left: sticker.x + 'px', 
                  top: sticker.y + 'px' 
                }}
                draggable
                onMouseDown={(e) => handleStickerMouseDown(sticker.id, e)}
                onMouseUp={handleStickerMouseUp}
                onMouseLeave={handleStickerMouseUp}
                onDragEnd={(e) => {
                  const rect = e.currentTarget.parentElement!.getBoundingClientRect()
                  const x = Math.max(0, Math.min(e.clientX - rect.left - 25, rect.width - 50))
                  const y = Math.max(0, Math.min(e.clientY - rect.top - 25, rect.height - 50))
                  moveSticker(sticker.id, x, y)
                }}
                title={sticker.title}
              >
                {sticker.url ? (
                  <img src={sticker.url} alt={sticker.title} />
                ) : (
                  <span className="emoji-sticker">{sticker.title}</span>
                )}
                
                {isEditMode && (
                  <button 
                    className="delete-sticker-btn"
                    onClick={() => removeSticker(sticker.id)}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            
            {/* Canvas Controls */}
            <div className="canvas-tools">
              <button 
                className="tool-btn"
                onClick={() => setShowGiphyPicker(!showGiphyPicker)}
              >
                ✨
              </button>
              
              {['🎂', '🎉', '✨', '💖'].map((emoji) => (
                <button
                  key={emoji}
                  className="emoji-btn"
                  onClick={() => {
                    const newSticker: DaySticker = {
                      id: `emoji-${Date.now()}-${emoji}`,
                      url: '',
                      title: emoji,
                      x: Math.random() * 200 + 20,
                      y: Math.random() * 150 + 20
                    }
                    saveStickers([...stickers, newSticker])
                  }}
                >
                  {emoji}
                </button>
              ))}
              
              {isEditMode && (
                <button 
                  className="tool-btn done-btn"
                  onClick={() => setIsEditMode(false)}
                >
                  ✓
                </button>
              )}
            </div>
          </div>
          
          {/* Notes area */}
          <div className="notes-area">
            <textarea
              value={notes}
              onChange={(e) => saveNotes(e.target.value)}
              placeholder="Quick notes..."
              className="notes-input"
              rows={3}
            />
          </div>
          
          {showGiphyPicker && (
            <div className="giphy-picker-popup">
              <div className="giphy-picker-header">
                <h4>Add Sticker</h4>
                <button 
                  className="close-giphy" 
                  onClick={() => setShowGiphyPicker(false)}
                >
                  ×
                </button>
              </div>
              <GiphyPicker 
                onSelect={addSticker}
                searchTerm={isBirthday ? 'birthday celebration' : 'happy'}
              />
            </div>
          )}

          {/* Drawing Pad Section */}
          <div className="drawing-section">
            <h4>Drawing & Notes</h4>
            <DrawingPad />
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