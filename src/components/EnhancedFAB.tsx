import { useState } from 'react'
import MealPopup from './MealPopup'
import TodoPopup from './TodoPopup'
import StickerPopup from './StickerPopup'
import GroceryPopup from './GroceryPopup'

interface EnhancedFABProps {
  selectedDate: string | null
}

export default function EnhancedFAB({ selectedDate }: EnhancedFABProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activePopup, setActivePopup] = useState<string | null>(null)
  const [currentOptionIndex, setCurrentOptionIndex] = useState(0)

  const options = [
    { type: 'meal', icon: '🍽️', label: 'Meal' },
    { type: 'todo', icon: '📝', label: 'Todo' },
    { type: 'sticker', icon: '✨', label: 'Sticker' },
    { type: 'grocery', icon: '🛒', label: 'Grocery' }
  ]

  const openPopup = (type: string) => {
    setActivePopup(type)
    setIsOpen(false)
  }

  const closePopup = () => {
    setActivePopup(null)
  }

  const handleScroll = (direction: 'next' | 'prev') => {
    if (direction === 'next') {
      setCurrentOptionIndex((prev) => (prev + 1) % options.length)
    } else {
      setCurrentOptionIndex((prev) => (prev - 1 + options.length) % options.length)
    }
  }

  const currentOption = options[currentOptionIndex]

  return (
    <>
      <div className="enhanced-fab">
        <div className={`fab-container ${isOpen ? 'open' : ''}`}>
          {/* Main FAB Button */}
          <button 
            className="fab-main"
            onClick={() => setIsOpen(!isOpen)}
          >
            <span className={`fab-icon ${isOpen ? 'open' : ''}`}>+</span>
          </button>
          
          {/* Scrollable FAB Options */}
          {isOpen && (
            <div className="fab-scroll-container">
              {/* Previous/Next Navigation */}
              <button 
                className="fab-nav fab-prev"
                onClick={() => handleScroll('prev')}
              >
                ←
              </button>
              
              {/* Current Option Display */}
              <div className="fab-current-option">
                <button 
                  className="fab-option-active"
                  onClick={() => openPopup(currentOption.type)}
                  title={`Add ${currentOption.label}`}
                >
                  <span className="fab-icon">{currentOption.icon}</span>
                  <span className="fab-label">{currentOption.label}</span>
                </button>
              </div>
              
              {/* Next Navigation */}
              <button 
                className="fab-nav fab-next"
                onClick={() => handleScroll('next')}
              >
                →
              </button>
              
              {/* Option Indicators */}
              <div className="fab-indicators">
                {options.map((_, index) => (
                  <div 
                    key={index}
                    className={`fab-indicator ${index === currentOptionIndex ? 'active' : ''}`}
                    onClick={() => setCurrentOptionIndex(index)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Popups */}
      {activePopup === 'meal' && <MealPopup onClose={closePopup} selectedDate={selectedDate} />}
      {activePopup === 'todo' && <TodoPopup onClose={closePopup} selectedDate={selectedDate} />}
      {activePopup === 'sticker' && <StickerPopup onClose={closePopup} selectedDate={selectedDate} />}
      {activePopup === 'grocery' && <GroceryPopup onClose={closePopup} selectedDate={selectedDate} />}
    </>
  )
}