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

  const dateKey = date.toISOString().split('T')[0]

  useEffect(() => {
    // Load existing data for this day
    const savedStickers = localStorage.getItem(`stickers-${dateKey}`)
    const savedNotes = localStorage.getItem(`notes-${dateKey}`)
    const savedDrawing = localStorage.getItem(`drawing-${dateKey}`)

    if (savedStickers) {
      setStickers(JSON.parse(savedStickers))
    }
    if (savedNotes) {
      setNotes(savedNotes)
    }
    if (savedDrawing) {
      setDrawing(savedDrawing)
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
      x: 0, // Simple positioning
      y: 0
    }
    
    saveStickers([...stickers, newSticker])
    setShowGiphyPicker(false)
  }

  function removeSticker(stickerId: string) {
    saveStickers(stickers.filter(s => s.id !== stickerId))
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
              
              <div className="day-stickers">
                <h4>✨ Stickers & Fun</h4>
                <div className="sticker-row">
                  {stickers.slice(0, 6).map((sticker) => (
                    <div 
                      key={sticker.id} 
                      className="mini-sticker"
                      onClick={() => removeSticker(sticker.id)}
                      title={`${sticker.title} (click to remove)`}
                    >
                      {sticker.url ? (
                        <img src={sticker.url} alt={sticker.title} />
                      ) : (
                        <span className="emoji-sticker">{sticker.title}</span>
                      )}
                    </div>
                  ))}
                  <button 
                    className="add-mini-sticker-btn"
                    onClick={() => setShowGiphyPicker(!showGiphyPicker)}
                  >
                    {showGiphyPicker ? '✕' : '+'}
                  </button>
                </div>
                
                {/* Fallback emoji stickers */}
                <div className="emoji-stickers">
                  {['🎂', '🎉', '✨', '💖', '🎁', '🌟', '🦄', '🌈'].map((emoji) => (
                    <button
                      key={emoji}
                      className="emoji-sticker-btn"
                      onClick={() => {
                        const newSticker: DaySticker = {
                          id: `emoji-${Date.now()}-${emoji}`,
                          url: '', // We'll handle emoji differently
                          title: emoji,
                          x: 0,
                          y: 0
                        }
                        saveStickers([...stickers, newSticker])
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
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
            </div>
          </section>

          {/* Middle Section - Drawing */}
          <section className="day-drawing-section">
            <h3>🎨 Drawing & Sketches</h3>
            <div className="drawing-container">
              <DrawingPad 
                onSave={saveDrawing}
                initialDrawing={drawing}
                storageKey={`drawing-${dateKey}`}
              />
            </div>
          </section>

          {/* Bottom Section - Notes */}
          <section className="day-notes-section">
            <h3>📝 Notes & Thoughts</h3>
            <textarea
              value={notes}
              onChange={(e) => saveNotes(e.target.value)}
              placeholder={isBirthday ? "Birthday thoughts, memories, wishes... 🎂" : "What's on your mind today?"}
              className="day-notes-textarea"
              rows={4}
            />
          </section>
        </div>
      </div>
    </div>
  )
}