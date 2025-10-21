import { useState } from 'react'

interface MealPopupProps {
  onClose: () => void
  selectedDate?: string | null
}

export default function MealPopup({ onClose, selectedDate }: MealPopupProps) {
  const [date, setDate] = useState(selectedDate || new Date().toISOString().split('T')[0])
  const [mealType, setMealType] = useState('dinner')
  const [mealName, setMealName] = useState('')
  const [showGroceryPrompt, setShowGroceryPrompt] = useState(false)
  const [suggestedIngredients, setSuggestedIngredients] = useState<string[]>([])
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([])

  const mealIngredients: Record<string, string[]> = {
    'spaghetti': ['pasta', 'ground beef', 'tomato sauce', 'onion', 'garlic'],
    'pizza': ['pizza dough', 'mozzarella cheese', 'pizza sauce', 'pepperoni', 'mushrooms'],
    'tacos': ['ground beef', 'taco shells', 'cheese', 'lettuce', 'tomatoes'],
    'salad': ['mixed greens', 'cucumber', 'tomatoes', 'dressing', 'croutons'],
    'pasta': ['pasta', 'olive oil', 'garlic', 'parmesan cheese', 'basil'],
    'stir fry': ['rice', 'vegetables', 'soy sauce', 'chicken', 'ginger']
  }

  const handleAddMeal = () => {
    if (!mealName.trim()) return

    // Add meal to meals list
    const meals = JSON.parse(localStorage.getItem('meals') || '[]')
    const newMeal = {
      id: Date.now().toString(),
      date,
      title: mealName,
      type: mealType,
      groceries: []
    }
    meals.push(newMeal)
    localStorage.setItem('meals', JSON.stringify(meals))
    window.dispatchEvent(new CustomEvent('meals-updated'))

    // Check for grocery suggestions
    const suggestions = getGrocerySuggestions(mealName)
    if (suggestions.length > 0) {
      setSuggestedIngredients(suggestions)
      setShowGroceryPrompt(true)
    } else {
      onClose()
    }
  }

  const getGrocerySuggestions = (meal: string): string[] => {
    const mealLower = meal.toLowerCase()
    for (const [key, ingredients] of Object.entries(mealIngredients)) {
      if (mealLower.includes(key)) {
        return ingredients
      }
    }
    return []
  }

  const handleIngredientToggle = (ingredient: string) => {
    setSelectedIngredients(prev => 
      prev.includes(ingredient) 
        ? prev.filter(i => i !== ingredient)
        : [...prev, ingredient]
    )
  }

  const handleAddGroceries = () => {
    if (selectedIngredients.length > 0) {
      const groceries = JSON.parse(localStorage.getItem('grocery') || '[]')
      const now = Date.now()
      
      selectedIngredients.forEach((ingredient, i) => {
        groceries.push({
          id: (now + i).toString(),
          name: ingredient,
          category: 'From Meal',
          bought: false
        })
      })
      
      localStorage.setItem('grocery', JSON.stringify(groceries))
      window.dispatchEvent(new CustomEvent('grocery-updated'))
    }
    onClose()
  }

  if (showGroceryPrompt) {
    return (
      <div className="popup-overlay" onClick={onClose}>
        <div className="popup-content grocery-prompt" onClick={e => e.stopPropagation()}>
          <div className="popup-header">
            <h3>Add Groceries for {mealName}?</h3>
            <button onClick={onClose} className="close-btn">✕</button>
          </div>
          
          <div className="grocery-suggestions">
            <p>Select ingredients to add to your grocery list:</p>
            {suggestedIngredients.map(ingredient => (
              <label key={ingredient} className="ingredient-option">
                <input
                  type="checkbox"
                  checked={selectedIngredients.includes(ingredient)}
                  onChange={() => handleIngredientToggle(ingredient)}
                />
                <span>{ingredient}</span>
              </label>
            ))}
          </div>
          
          <div className="popup-actions">
            <button onClick={() => onClose()} className="btn btn-ghost">
              Skip Groceries
            </button>
            <button onClick={handleAddGroceries} className="btn">
              Add Selected ({selectedIngredients.length})
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-content meal-popup" onClick={e => e.stopPropagation()}>
        <div className="popup-header">
          <h3>Add Meal</h3>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>
        
        <div className="popup-form">
          <div className="form-group">
            <label>Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="form-input"
            />
          </div>
          
          <div className="form-group">
            <label>Meal Type</label>
            <select
              value={mealType}
              onChange={(e) => setMealType(e.target.value)}
              className="form-select"
            >
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snack</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Meal Name</label>
            <input
              type="text"
              value={mealName}
              onChange={(e) => setMealName(e.target.value)}
              placeholder="e.g., Spaghetti Bolognese"
              className="form-input"
            />
          </div>
        </div>
        
        <div className="popup-actions">
          <button onClick={onClose} className="btn btn-ghost">Cancel</button>
          <button onClick={handleAddMeal} className="btn" disabled={!mealName.trim()}>
            Add Meal
          </button>
        </div>
      </div>
    </div>
  )
}