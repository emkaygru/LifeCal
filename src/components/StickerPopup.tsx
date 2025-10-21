import { useState, useEffect } from 'react'

interface StickerPopupProps {
  onClose: () => void
  selectedDate?: string | null
}

interface GiphySticker {
  id: string
  title: string
  images: {
    fixed_height_small: {
      url: string
    }
  }
}

export default function StickerPopup({ onClose, selectedDate }: StickerPopupProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [stickers, setStickers] = useState<GiphySticker[]>([])
  const [loading, setLoading] = useState(false)
  const [targetDate, setTargetDate] = useState(selectedDate || new Date().toISOString().split('T')[0])

  useEffect(() => {
    if (searchQuery.trim()) {
      fetchStickers(searchQuery)
    } else {
      // Show default birthday/celebration stickers
      fetchStickers('celebration')
    }
  }, [searchQuery])

  const fetchStickers = async (query: string) => {
    setLoading(true)
    try {
      const response = await fetch(
        `https://api.giphy.com/v1/stickers/search?api_key=C5wkWsK0BhP9ilm08Pq7xyNEhkwCjcFQ&q=${encodeURIComponent(query)}&limit=6&rating=g`
      )
      const data = await response.json()
      setStickers(data.data || [])
    } catch (error) {
      console.error('Error fetching stickers:', error)
      setStickers([])
    }
    setLoading(false)
  }

  const handleSelectSticker = (sticker: GiphySticker) => {
    // Add sticker to the selected date
    const existingStickers = JSON.parse(localStorage.getItem(`stickers-${selectedDate}`) || '[]')
    const newSticker = {
      id: `${Date.now()}-${sticker.id}`,
      url: sticker.images.fixed_height_small.url,
      title: sticker.title,
      x: Math.random() * 200 + 50,
      y: Math.random() * 150 + 50
    }
    
    const updatedStickers = [...existingStickers, newSticker]
    localStorage.setItem(`stickers-${selectedDate}`, JSON.stringify(updatedStickers))
    
    // Trigger sync
    window.dispatchEvent(new CustomEvent('localStorageChange', {
      detail: { key: `stickers-${selectedDate}`, value: JSON.stringify(updatedStickers) }
    }))

    onClose()
  }

  // Quick emoji options
  const quickEmojis = ['🎂', '🎉', '✨', '💖', '🎁', '🌟', '🦄', '🌈']

  const handleEmojiSelect = (emoji: string) => {
    const existingStickers = JSON.parse(localStorage.getItem(`stickers-${selectedDate}`) || '[]')
    const newSticker = {
      id: `emoji-${Date.now()}-${emoji}`,
      url: '',
      title: emoji,
      x: Math.random() * 200 + 50,
      y: Math.random() * 150 + 50
    }
    
    const updatedStickers = [...existingStickers, newSticker]
    localStorage.setItem(`stickers-${selectedDate}`, JSON.stringify(updatedStickers))
    
    // Trigger sync
    window.dispatchEvent(new CustomEvent('localStorageChange', {
      detail: { key: `stickers-${selectedDate}`, value: JSON.stringify(updatedStickers) }
    }))

    onClose()
  }

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-content sticker-popup" onClick={e => e.stopPropagation()}>
        <div className="popup-header">
          <h3>Add Sticker</h3>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>
        
        <div className="popup-form">
          <div className="form-group">
            <label>Add to Date</label>
            <input
              type="date"
              value={targetDate}
                            onChange={(e) => setTargetDate(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Quick Emojis</label>
            <div className="emoji-grid">
              {quickEmojis.map(emoji => (
                <button
                  key={emoji}
                  className="emoji-option"
                  onClick={() => handleEmojiSelect(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
          
          <div className="form-group">
            <label>Search Stickers</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for stickers..."
              className="form-input"
            />
          </div>
        </div>
        
        {loading && <div className="loading">Searching stickers...</div>}
        
        {stickers.length > 0 && (
          <div className="sticker-results">
            <div className="sticker-grid">
              {stickers.map(sticker => (
                <button
                  key={sticker.id}
                  className="sticker-option"
                  onClick={() => handleSelectSticker(sticker)}
                  title={sticker.title}
                >
                  <img 
                    src={sticker.images.fixed_height_small.url} 
                    alt={sticker.title}
                  />
                </button>
              ))}
            </div>
          </div>
        )}
        
        {!loading && stickers.length === 0 && searchQuery && (
          <div className="no-results">No stickers found for "{searchQuery}"</div>
        )}
      </div>
    </div>
  )
}