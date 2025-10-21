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
      x: Math.random() * 200 + 50, // Random position
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
          {/* Sticker Canvas */}
          <div className="day-canvas">
            <h3>Stickers & Decorations</h3>
            <div className="sticker-container">
              {stickers.map((sticker) => (
                <div
                  key={sticker.id}
                  className="placed-sticker"
                  style={{ 
                    left: sticker.x + 'px', 
                    top: sticker.y + 'px' 
                  }}
                  draggable
                  onDragEnd={(e) => {
                    const rect = e.currentTarget.parentElement!.getBoundingClientRect()
                    const x = e.clientX - rect.left
                    const y = e.clientY - rect.top
                    moveSticker(sticker.id, x, y)
                  }}
                  onDoubleClick={() => removeSticker(sticker.id)}
                  title={`${sticker.title} (double-click to remove)`}
                >
                  <img src={sticker.url} alt={sticker.title} />
                </div>
              ))}
              
              <button 
                className="add-sticker-btn"
                onClick={() => setShowGiphyPicker(!showGiphyPicker)}
              >
                {showGiphyPicker ? '✕ Close' : '✨ Add Sticker'}
              </button>
            </div>

            {showGiphyPicker && (
              <div className="giphy-picker-container">
                <GiphyPicker 
                  onSelect={addSticker}
                  searchTerm={isBirthday ? 'birthday celebration' : 'happy'}
                />
              </div>
            )}
          </div>

          {/* Drawing Pad */}
          <div className="day-drawing">
            <h3>Doodles & Sketches</h3>
            <DrawingPad 
              onSave={saveDrawing}
              initialDrawing={drawing}
              storageKey={`drawing-${dateKey}`}
            />
          </div>

          {/* Notes */}
          <div className="day-notes">
            <h3>Notes & Thoughts</h3>
            <textarea
              value={notes}
              onChange={(e) => saveNotes(e.target.value)}
              placeholder={isBirthday ? "Birthday thoughts, memories, wishes... 🎂" : "What's on your mind today?"}
              className="day-notes-input"
              rows={6}
            />
          </div>
        </div>
      </div>
    </div>
  )
}