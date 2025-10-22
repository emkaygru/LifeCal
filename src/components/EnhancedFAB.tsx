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

  const openPopup = (type: string) => {
    setActivePopup(type)
    setIsOpen(false)
  }

  const closePopup = () => {
    setActivePopup(null)
  }

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
          
          {/* FAB Menu Items */}
          {isOpen && (
            <div className="fab-options">
              <button 
                className="fab-option meal"
                onClick={() => openPopup('meal')}
                style={{ '--delay': '100ms' } as React.CSSProperties}
                title="Add Meal"
              >
                <span className="fab-icon">🍽️</span>
                <span className="fab-label">Meal</span>
              </button>
              <button 
                className="fab-option todo"
                onClick={() => openPopup('todo')}
                style={{ '--delay': '150ms' } as React.CSSProperties}
                title="Add Todo"
              >
                <span className="fab-icon">📝</span>
                <span className="fab-label">Todo</span>
              </button>
              <button 
                className="fab-option sticker"
                onClick={() => openPopup('sticker')}
                style={{ '--delay': '200ms' } as React.CSSProperties}
                title="Add Sticker"
              >
                <span className="fab-icon">✨</span>
                <span className="fab-label">Sticker</span>
              </button>
              <button 
                className="fab-option grocery"
                onClick={() => openPopup('grocery')}
                style={{ '--delay': '250ms' } as React.CSSProperties}
                title="Add Grocery"
              >
                <span className="fab-icon">🛒</span>
                <span className="fab-label">Grocery</span>
              </button>
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