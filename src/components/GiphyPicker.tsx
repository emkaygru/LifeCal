import { useState, useEffect } from 'react'

// Simple Giphy integration for stickers
const GIPHY_API_KEY = 'your_giphy_api_key_here' // We'll use the public API

interface GiphySticker {
  id: string
  url: string
  title: string
  images: {
    fixed_height_small: {
      url: string
      width: string
      height: string
    }
  }
}

export function GiphyPicker({ onSelect, searchTerm = 'birthday' }: { onSelect: (sticker: GiphySticker) => void, searchTerm?: string }) {
  const [stickers, setStickers] = useState<GiphySticker[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState(searchTerm)

  useEffect(() => {
    fetchStickers(search)
  }, [search])

  async function fetchStickers(query: string) {
    setLoading(true)
    try {
      // Using Giphy's public demo API key
      const response = await fetch(
        `https://api.giphy.com/v1/stickers/search?api_key=C5wkWsK0BhP9ilm08Pq7xyNEhkwCjcFQ&q=${encodeURIComponent(query)}&limit=24&rating=g&offset=0`
      )
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('Giphy API response:', data) // Debug log
      
      if (data.data && Array.isArray(data.data)) {
        setStickers(data.data)
      } else {
        console.warn('Unexpected API response format:', data)
        setStickers([])
      }
    } catch (error) {
      console.error('Error fetching stickers:', error)
      setStickers([])
    }
    setLoading(false)
  }

  return (
    <div className="giphy-picker">
      <div className="giphy-search">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search stickers..."
          className="giphy-search-input"
        />
      </div>
      
      {loading && <div className="giphy-loading">🔍 Finding stickers...</div>}
      
      <div className="giphy-grid">
        {stickers.map((sticker) => (
          <button
            key={sticker.id}
            className="giphy-sticker"
            onClick={() => onSelect(sticker)}
            title={sticker.title}
          >
            <img
              src={sticker.images.fixed_height_small.url}
              alt={sticker.title}
              loading="lazy"
            />
          </button>
        ))}
      </div>
      
      {stickers.length === 0 && !loading && (
        <div className="giphy-empty">No stickers found for "{search}"</div>
      )}
    </div>
  )
}