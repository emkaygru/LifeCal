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

interface DayViewProps {
  date: Date
  onClose: () => void
}

export default function DayView({ date, onClose }: DayViewProps) {
  const [stickers, setStickers] = useState<DaySticker[]>([])
  const [showGiphyPicker, setShowGiphyPicker] = useState(false)
  const [notes, setNotes] = useState('')
  const [drawing, setDrawing] = useState('')
  const [selectedMeal, setSelectedMeal] = useState('')
  const [isEditMode, setIsEditMode] = useState(false)
  const [holdTimer, setHoldTimer] = useState<NodeJS.Timeout | null>(null)

  const dateKey = date.toISOString().split('T')[0]

  useEffect(() => {
    // Load existing data for this day
    const savedStickers = localStorage.getItem(`stickers-${dateKey}`)
    const savedNotes = localStorage.getItem(`notes-${dateKey}`)
    const savedDrawing = localStorage.getItem(`drawing-${dateKey}`)
    const savedMeal = localStorage.getItem(`meal-${dateKey}`)

    if (savedStickers) {
      setStickers(JSON.parse(savedStickers))
    }
    if (savedNotes) {
      setNotes(savedNotes)
    }
    if (savedDrawing) {
      setDrawing(savedDrawing)
    }
    if (savedMeal) {
      setSelectedMeal(savedMeal)
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
    localStorage.setItem(`meal-${dateKey}`, meal)
    
    // Trigger sync
    window.dispatchEvent(new CustomEvent('localStorageChange', {
      detail: { key: `meal-${dateKey}`, value: meal }
    }))
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
  const fullDate = date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })

  return (
    <div className="day-view-overlay">
      <div className="day-view">
        <div className="day-view-header">
          <h2>
            {fullDate}
            {isBirthday && ' 🎂✨'}
          </h2>
          <button onClick={onClose} className="close-button">✕</button>
        </div>

        <div className="day-view-content">
          {/* Top Section - Plan/Events */}
          <section className="day-plan-section">
            <h3>📅 Plan</h3>
            <div className="plan-content">
              <div className="day-events">
                <h4>Events & Appointments</h4>
                {/* Events would go here - we can integrate from calendar */}
                <div className="plan-placeholder">No events scheduled</div>
              </div>
            </div>
          </section>

          {/* Middle Section - Freeform Canvas with Stickers & Drawing */}
          <section className="day-canvas-section">
            <h3>🎨 Creative Canvas</h3>
            <div className="freeform-canvas">
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
              
              {/* Add sticker controls */}
              <div className="canvas-controls">
                <button 
                  className="add-sticker-btn"
                  onClick={() => setShowGiphyPicker(!showGiphyPicker)}
                >
                  {showGiphyPicker ? '✕ Close' : '✨ Add Sticker'}
                </button>
                
                {/* Quick emoji stickers */}
                <div className="quick-emojis">
                  {['🎂', '🎉', '✨', '💖', '🎁', '🌟'].map((emoji) => (
                    <button
                      key={emoji}
                      className="quick-emoji-btn"
                      onClick={() => {
                        const newSticker: DaySticker = {
                          id: `emoji-${Date.now()}-${emoji}`,
                          url: '',
                          title: emoji,
                          x: Math.random() * 300 + 50,
                          y: Math.random() * 200 + 50
                        }
                        saveStickers([...stickers, newSticker])
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                
                {isEditMode && (
                  <button 
                    className="exit-edit-btn"
                    onClick={() => setIsEditMode(false)}
                  >
                    ✓ Done Editing
                  </button>
                )}
              </div>
              
              {showGiphyPicker && (
                <div className="giphy-picker-overlay">
                  <GiphyPicker 
                    onSelect={addSticker}
                    searchTerm={isBirthday ? 'birthday celebration' : 'happy'}
                  />
                </div>
              )}
            </div>
          </section>

          {/* Drawing Section */}
          <section className="day-drawing-section">
            <h3>✏️ Drawing & Sketches</h3>
            <div className="drawing-container">
              <DrawingPad 
                onSave={saveDrawing}
                initialDrawing={drawing}
                storageKey={`drawing-${dateKey}`}
              />
            </div>
          </section>

          {/* Notes Section */}
          <section className="day-notes-section">
            <h3>📝 Notes & Thoughts</h3>
            <textarea
              value={notes}
              onChange={(e) => saveNotes(e.target.value)}
              placeholder={isBirthday ? "Birthday thoughts, memories, wishes... 🎂" : "What's on your mind today?"}
              className="day-notes-textarea"
              rows={3}
            />
          </section>

          {/* Meal Plan Section - At Bottom */}
          <section className="day-meal-section">
            <h3>🍽️ Meal Plan</h3>
            <div className="meal-plan-content">
              <select 
                value={selectedMeal} 
                onChange={(e) => saveMeal(e.target.value)}
                className="meal-select"
              >
                <option value="">No meal planned</option>
                <option value="FACTOR">FACTOR</option>
                <option value="Pasta Night">Pasta Night</option>
                <option value="Pizza">Pizza</option>
                <option value="Tacos">Tacos</option>
                <option value="Salad">Salad</option>
                <option value="Stir Fry">Stir Fry</option>
                <option value="Soup">Soup</option>
                <option value="Leftovers">Leftovers</option>
                <option value="Takeout">Takeout</option>
                <option value="Date Night">Date Night</option>
              </select>
              
              {selectedMeal && (
                <div className="meal-display">
                  <strong>Tonight's Plan:</strong> {selectedMeal}
                  {selectedMeal === 'FACTOR' && ' 📦'}
                  {isBirthday && ' 🎂'}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}