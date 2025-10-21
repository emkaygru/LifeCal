import React, { useState, useEffect } from 'react'

interface SlideshowImage {
  url: string
  id: string
}

export default function IdleSlideshow() {
  const [images, setImages] = useState<SlideshowImage[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch images from iCloud shared album
  useEffect(() => {
    const fetchImages = async () => {
      try {
        setLoading(true)
        // Note: Direct iCloud shared album access requires special handling
        // For now, we'll use a placeholder implementation
        // In production, this would need server-side proxy or iCloud API integration
        
        // Placeholder images for development
        const mockImages: SlideshowImage[] = [
          { id: '1', url: 'https://picsum.photos/1920/1080?random=1' },
          { id: '2', url: 'https://picsum.photos/1080/1920?random=2' },
          { id: '3', url: 'https://picsum.photos/1920/1080?random=3' },
          { id: '4', url: 'https://picsum.photos/1080/1920?random=4' },
          { id: '5', url: 'https://picsum.photos/1920/1080?random=5' },
        ]
        
        setImages(mockImages)
        setLoading(false)
      } catch (err) {
        setError('Failed to load images from shared album')
        setLoading(false)
      }
    }

    fetchImages()
  }, [])

  // Auto-advance slideshow every 3.7 seconds
  useEffect(() => {
    if (images.length === 0) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length)
    }, 3700) // 3.7 seconds

    return () => clearInterval(interval)
  }, [images.length])

  // Preload next image
  useEffect(() => {
    if (images.length > 0) {
      const nextIndex = (currentIndex + 1) % images.length
      const img = new Image()
      img.src = images[nextIndex].url
    }
  }, [currentIndex, images])

  if (loading) {
    return (
      <div className="slideshow-container loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading photos...</p>
        </div>
      </div>
    )
  }

  if (error || images.length === 0) {
    return (
      <div className="slideshow-container error">
        <div className="error-message">
          <h2>Unable to load photos</h2>
          <p>{error || 'No images found in shared album'}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    )
  }

  const currentImage = images[currentIndex]

  return (
    <div className="slideshow-container">
      <div className="slideshow-image-wrapper">
        <img
          key={currentImage.id}
          src={currentImage.url}
          alt={`Slide ${currentIndex + 1}`}
          className="slideshow-image"
          onError={(e) => {
            console.error('Image failed to load:', currentImage.url)
            // Skip to next image on error
            setCurrentIndex((prev) => (prev + 1) % images.length)
          }}
        />
      </div>
      
      <div className="slideshow-progress">
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ 
              animation: `slideProgress 3.7s linear infinite`,
              animationDelay: `0s`
            }}
          />
        </div>
      </div>

      <div className="slideshow-controls">
        <button 
          className="nav-btn prev"
          onClick={() => setCurrentIndex((prev) => prev === 0 ? images.length - 1 : prev - 1)}
        >
          ←
        </button>
        <span className="slide-counter">
          {currentIndex + 1} / {images.length}
        </span>
        <button 
          className="nav-btn next"
          onClick={() => setCurrentIndex((prev) => (prev + 1) % images.length)}
        >
          →
        </button>
      </div>
    </div>
  )
}