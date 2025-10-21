import React, { useState, useEffect } from 'react'
import { FAMILY_PHOTOS } from '../config/photos'

interface SlideshowImage {
  url: string
  id: string
}

interface IdleSlideshowProps {
  onExit: () => void
}

export default function IdleSlideshow({ onExit }: IdleSlideshowProps) {
  const [images, setImages] = useState<SlideshowImage[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch images from configuration
  useEffect(() => {
    const loadImages = () => {
      try {
        setLoading(true)
        
        // Convert configured photo URLs to slideshow format
        const images: SlideshowImage[] = FAMILY_PHOTOS.map((url, index) => ({
          id: `photo-${index + 1}`,
          url: url
        }))
        
        if (images.length === 0) {
          setError('No photos configured. Please add photo URLs to src/config/photos.ts')
          setLoading(false)
          return
        }
        
        console.log(`Loaded ${images.length} photos for slideshow`)
        setImages(images)
        setLoading(false)
      } catch (err) {
        console.error('Failed to load photos:', err)
        setError('Failed to load photos from configuration')
        setLoading(false)
      }
    }

    loadImages()
  }, [])

  // Keyboard support for exit
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'q' || e.key === 'Q') {
        onExit()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [onExit])

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
      {/* Exit Button */}
      <button className="slideshow-exit" onClick={onExit} title="Exit Slideshow">
        ×
      </button>

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