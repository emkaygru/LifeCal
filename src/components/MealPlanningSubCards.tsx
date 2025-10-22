import React, { useState, useEffect } from 'react'

type Meal = { id: string; date: string; title: string; groceries?: string[] }

// Grocery Suggestions Sub-Card
export function GrocerySuggestions() {
  const [meals, setMeals] = useState<Meal[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [isEditMode, setIsEditMode] = useState(false)

  useEffect(() => {
    // Load meals from localStorage
    try {
      const storedMeals = JSON.parse(localStorage.getItem('meals') || '[]')
      setMeals(storedMeals)
      
      // Generate grocery suggestions from all meals
      const allGroceries = storedMeals.reduce((acc: string[], meal: Meal) => {
        if (meal.groceries) {
          return [...acc, ...meal.groceries]
        }
        return acc
      }, [])
      
      // Remove duplicates and sort
      const uniqueGroceries = [...new Set(allGroceries)].sort() as string[]
      setSuggestions(uniqueGroceries)
    } catch {
      setMeals([])
      setSuggestions([])
    }
  }, [])

  useEffect(() => {
    // Listen for meal updates
    const handleMealsUpdate = () => {
      try {
        const storedMeals = JSON.parse(localStorage.getItem('meals') || '[]')
        setMeals(storedMeals)
        
        const allGroceries = storedMeals.reduce((acc: string[], meal: Meal) => {
          if (meal.groceries) {
            return [...acc, ...meal.groceries]
          }
          return acc
        }, [])
        
        const uniqueGroceries = [...new Set(allGroceries)].sort() as string[]
        setSuggestions(uniqueGroceries)
      } catch {
        setMeals([])
        setSuggestions([])
      }
    }

    window.addEventListener('meals-updated', handleMealsUpdate)
    return () => window.removeEventListener('meals-updated', handleMealsUpdate)
  }, [])

  const toggleItemSelection = (item: string) => {
    setSelectedItems(prev => 
      prev.includes(item) 
        ? prev.filter(i => i !== item)
        : [...prev, item]
    )
  }

  const addToGroceryList = (item: string) => {
    try {
      const existing = JSON.parse(localStorage.getItem('grocery') || '[]')
      const newItem = {
        id: Date.now().toString(),
        name: item,
        category: 'From Meal Plans',
        completed: false
      }
      
      // Check if item already exists
      const itemExists = existing.some((g: any) => g.name.toLowerCase() === item.toLowerCase())
      if (!itemExists) {
        const updated = [...existing, newItem]
        localStorage.setItem('grocery', JSON.stringify(updated))
        window.dispatchEvent(new CustomEvent('grocery-updated'))
      }
    } catch (error) {
      console.error('Error adding to grocery list:', error)
    }
  }

  const addSelectedToGroceryList = () => {
    if (selectedItems.length === 0) return

    try {
      const existing = JSON.parse(localStorage.getItem('grocery') || '[]')
      const existingNames = existing.map((g: any) => g.name.toLowerCase())
      
      const newItems = selectedItems
        .filter(item => !existingNames.includes(item.toLowerCase()))
        .map(item => ({
          id: Date.now().toString() + Math.random(),
          name: item,
          category: 'From Meal Plans',
          completed: false
        }))
      
      if (newItems.length > 0) {
        const updated = [...existing, ...newItems]
        localStorage.setItem('grocery', JSON.stringify(updated))
        window.dispatchEvent(new CustomEvent('grocery-updated'))
        alert(`Added ${newItems.length} items to grocery list`)
      }

      // Clear selections and exit edit mode
      setSelectedItems([])
      setIsEditMode(false)
    } catch (error) {
      console.error('Error adding selected to grocery list:', error)
    }
  }

  const addAllToGroceryList = () => {
    try {
      const existing = JSON.parse(localStorage.getItem('grocery') || '[]')
      const existingNames = existing.map((g: any) => g.name.toLowerCase())
      
      const newItems = suggestions
        .filter(item => !existingNames.includes(item.toLowerCase()))
        .map(item => ({
          id: Date.now().toString() + Math.random(),
          name: item,
          category: 'From Meal Plans',
          completed: false
        }))
      
      if (newItems.length > 0) {
        const updated = [...existing, ...newItems]
        localStorage.setItem('grocery', JSON.stringify(updated))
        window.dispatchEvent(new CustomEvent('grocery-updated'))
        alert(`Added ${newItems.length} items to grocery list`)
      } else {
        alert('All suggested items are already in your grocery list')
      }
    } catch (error) {
      console.error('Error adding all to grocery list:', error)
    }
  }

  const selectAllItems = () => {
    setSelectedItems(suggestions)
  }

  const clearSelections = () => {
    setSelectedItems([])
  }

  return (
    <div className="grocery-suggestions-card">
      <div className="suggestions-header">
        <h4>Grocery Suggestions</h4>
        <div className="suggestions-actions">
          {!isEditMode ? (
            <>
              <button className="btn btn-sm btn-secondary" onClick={() => setIsEditMode(true)}>
                Select Items
              </button>
              {suggestions.length > 0 && (
                <button className="btn btn-sm" onClick={addAllToGroceryList}>
                  Add All ({suggestions.length})
                </button>
              )}
            </>
          ) : (
            <>
              <button className="btn btn-xs btn-secondary" onClick={selectAllItems}>
                All
              </button>
              <button className="btn btn-xs btn-secondary" onClick={clearSelections}>
                None
              </button>
              <button className="btn btn-xs btn-secondary" onClick={() => {setIsEditMode(false); setSelectedItems([])}}>
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
      
      {isEditMode && selectedItems.length > 0 && (
        <div className="bulk-actions">
          <button className="btn btn-primary btn-sm" onClick={addSelectedToGroceryList}>
            Add Selected ({selectedItems.length}) to Grocery List
          </button>
        </div>
      )}
      
      {suggestions.length === 0 ? (
        <p className="empty-state">No grocery suggestions yet. Add meals with ingredients to see suggestions here.</p>
      ) : (
        <div className="suggestions-list">
          {suggestions.map((item, index) => (
            <div key={index} className={`suggestion-item ${isEditMode ? 'selectable' : ''} ${selectedItems.includes(item) ? 'selected' : ''}`}>
              {isEditMode ? (
                <label className="suggestion-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item)}
                    onChange={() => toggleItemSelection(item)}
                  />
                  <span className="suggestion-name">{item}</span>
                </label>
              ) : (
                <>
                  <span className="suggestion-name">{item}</span>
                  <button 
                    className="btn btn-xs"
                    onClick={() => addToGroceryList(item)}
                    title="Add to grocery list"
                  >
                    +
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
      
      <div className="suggestions-stats">
        <small className="text-muted">
          Based on {meals.length} planned meals
        </small>
      </div>
    </div>
  )
}

// Meal Planner Builder Sub-Card
export function MealPlannerBuilder() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10))
  const [mealOption, setMealOption] = useState('meal')
  const [mealTitle, setMealTitle] = useState('')
  const [mealType, setMealType] = useState('Dinner')
  const [ingredients, setIngredients] = useState('')
  const [selectedDays, setSelectedDays] = useState<string[]>([])
  const [showDaySelector, setShowDaySelector] = useState(false)
  const [meals, setMeals] = useState<Meal[]>([])

  useEffect(() => {
    // Load meals from localStorage
    try {
      const storedMeals = JSON.parse(localStorage.getItem('meals') || '[]')
      setMeals(storedMeals)
    } catch {
      setMeals([])
    }
  }, [])

  useEffect(() => {
    // Listen for meal updates
    const handleMealsUpdate = () => {
      try {
        const storedMeals = JSON.parse(localStorage.getItem('meals') || '[]')
        setMeals(storedMeals)
      } catch {
        setMeals([])
      }
    }

    window.addEventListener('meals-updated', handleMealsUpdate)
    return () => window.removeEventListener('meals-updated', handleMealsUpdate)
  }, [])

  const get14Days = () => {
    const today = new Date()
    const dates = []
    
    for (let i = 0; i < 14; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      dates.push({
        date: date.toISOString().slice(0, 10),
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: date.getDate(),
        month: date.toLocaleDateString('en-US', { month: 'short' })
      })
    }
    
    return dates
  }

  const handleDayToggle = (date: string) => {
    setSelectedDays(prev => 
      prev.includes(date) 
        ? prev.filter(d => d !== date)
        : [...prev, date]
    )
  }

  const addMeal = () => {
    if (mealOption === 'meal' && !mealTitle.trim()) return
    if (mealOption === 'meal' && selectedDays.length === 0) return

    const groceries = ingredients
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0)

    let mealContent = ''
    switch (mealOption) {
      case 'factor__':
        mealContent = `${mealType}: Factor meal`
        break
      case 'eat-out':
        mealContent = `${mealType}: Eat out`
        break
      case 'date-night':
        mealContent = `${mealType}: Date night`
        break
      case 'meal':
        mealContent = `${mealType}: ${mealTitle}`
        break
    }

    const datesToUse = mealOption === 'meal' ? selectedDays : [selectedDate]
    const newMeals: Meal[] = datesToUse.map(date => ({
      id: Date.now().toString() + Math.random(),
      date,
      title: mealContent,
      groceries: mealOption === 'meal' ? groceries : []
    }))

    const updatedMeals = [...meals, ...newMeals]
    setMeals(updatedMeals)
    localStorage.setItem('meals', JSON.stringify(updatedMeals))
    window.dispatchEvent(new CustomEvent('meals-updated'))

    // Clear form
    setMealTitle('')
    setIngredients('')
    setSelectedDays([])
    setShowDaySelector(false)
  }

  const removeMeal = (mealId: string) => {
    const updatedMeals = meals.filter(meal => meal.id !== mealId)
    setMeals(updatedMeals)
    localStorage.setItem('meals', JSON.stringify(updatedMeals))
    window.dispatchEvent(new CustomEvent('meals-updated'))
  }

  const getMealsForDate = (date: string) => {
    return meals.filter(meal => meal.date === date)
  }

  const handleMealOptionChange = (option: string) => {
    setMealOption(option)
    if (option === 'meal') {
      setShowDaySelector(true)
    } else {
      setShowDaySelector(false)
      setSelectedDays([])
    }
  }

  return (
    <div className="meal-builder-card">
      <h4>Meal Planner Builder</h4>
      
      {/* Meal Option Selector */}
      <div className="meal-option-selector">
        <label>Meal Type:</label>
        <select
          value={mealOption}
          onChange={(e) => handleMealOptionChange(e.target.value)}
          className="form-select"
        >
          <option value="factor__">Factor__</option>
          <option value="meal">Meal (custom)</option>
          <option value="eat-out">Eat Out</option>
          <option value="date-night">Date Night</option>
        </select>
      </div>

      {/* Quick Add Form */}
      <div className="meal-add-form">
        <div className="form-row">
          {mealOption !== 'meal' && (
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="form-input"
            />
          )}
          <select
            value={mealType}
            onChange={(e) => setMealType(e.target.value)}
            className="form-select"
          >
            <option value="Breakfast">Breakfast</option>
            <option value="Lunch">Lunch</option>
            <option value="Dinner">Dinner</option>
            <option value="Snack">Snack</option>
          </select>
        </div>
        
        {mealOption === 'meal' && (
          <>
            <input
              type="text"
              placeholder="Meal name..."
              value={mealTitle}
              onChange={(e) => setMealTitle(e.target.value)}
              className="form-input"
            />
            
            <input
              type="text"
              placeholder="Ingredients (comma-separated)..."
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              className="form-input"
            />
          </>
        )}
        
        {/* Multi-Day Selector for custom meals */}
        {showDaySelector && (
          <div className="day-selector">
            <label>Select days for this meal:</label>
            <div className="day-selector-grid">
              {get14Days().map(({ date, dayName, dayNum, month }) => (
                <button
                  key={date}
                  type="button"
                  className={`day-selector-btn ${selectedDays.includes(date) ? 'selected' : ''}`}
                  onClick={() => handleDayToggle(date)}
                >
                  <div className="day-btn-name">{dayName}</div>
                  <div className="day-btn-date">{month} {dayNum}</div>
                </button>
              ))}
            </div>
            <div className="selected-days-summary">
              {selectedDays.length > 0 && (
                <small>Selected {selectedDays.length} day{selectedDays.length !== 1 ? 's' : ''}</small>
              )}
            </div>
          </div>
        )}
        
        <button 
          className="btn btn-primary" 
          onClick={addMeal}
          disabled={mealOption === 'meal' && (!mealTitle.trim() || selectedDays.length === 0)}
        >
          {mealOption === 'meal' ? `Add to ${selectedDays.length} day${selectedDays.length !== 1 ? 's' : ''}` : 'Add Meal'}
        </button>
      </div>

      {/* 14-Day Planner View */}
      <div className="week-planner">
        <h5>Next 14 Days</h5>
        <div className="fourteen-day-grid">
          {get14Days().map(({ date, dayName, dayNum, month }) => {
            const dateMeals = getMealsForDate(date)
            const isToday = date === new Date().toISOString().slice(0, 10)
            
            return (
              <div key={date} className={`day-column ${isToday ? 'today' : ''}`}>
                <div className="day-header">
                  <div className="day-name">{dayName}</div>
                  <div className="day-number">{dayNum}</div>
                  <div className="day-month">{month}</div>
                </div>
                
                <div className="day-meals">
                  {dateMeals.length === 0 ? (
                    <div className="no-meals">No meals planned</div>
                  ) : (
                    dateMeals.map(meal => (
                      <div key={meal.id} className="meal-item">
                        <div className="meal-title">{meal.title}</div>
                        <button
                          className="remove-meal-btn"
                          onClick={() => removeMeal(meal.id)}
                          title="Remove meal"
                        >
                          ×
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// Surprise Me Sub-Card with Restaurant Finder
export function SurpriseMe() {
  const [suggestion, setSuggestion] = useState<string>('')
  const [restaurants, setRestaurants] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [mealType, setMealType] = useState('Dinner')
  const [suggestionType, setSuggestionType] = useState<'homemade' | 'restaurant'>('homemade')
  const [selectedCuisine, setSelectedCuisine] = useState('American')

  const mealSuggestions = {
    'Breakfast': [
      'Avocado Toast with Eggs',
      'Greek Yogurt Parfait',
      'Pancakes with Berries',
      'Oatmeal with Nuts',
      'Smoothie Bowl',
      'French Toast',
      'Breakfast Burrito',
      'Chia Pudding'
    ],
    'Lunch': [
      'Caesar Salad',
      'Grilled Chicken Sandwich',
      'Quinoa Bowl',
      'Soup and Sandwich',
      'Pasta Salad',
      'Buddha Bowl',
      'Wrap with Hummus',
      'Stir-fry Vegetables'
    ],
    'Dinner': [
      'Grilled Salmon with Vegetables',
      'Chicken Stir-fry',
      'Pasta Carbonara',
      'Beef Tacos',
      'Vegetarian Curry',
      'Pizza Margherita',
      'Roasted Chicken',
      'Spaghetti Bolognese',
      'Fish and Chips',
      'Vegetable Lasagna'
    ],
    'Snack': [
      'Apple with Peanut Butter',
      'Trail Mix',
      'Cheese and Crackers',
      'Hummus with Vegetables',
      'Fruit Smoothie',
      'Yogurt with Granola',
      'Nuts and Dried Fruit',
      'Dark Chocolate'
    ]
  }

  // Mock restaurant data for Denver area (80205)
  const mockRestaurants = {
    'American': [
      { name: 'Root Down', cuisine: 'American', website: 'https://rootdownrestaurant.com', address: '1600 W 33rd Ave' },
      { name: 'Denver Biscuit Company', cuisine: 'American', website: 'https://denbisco.com', address: '3237 E Colfax Ave' },
      { name: 'Snooze', cuisine: 'American', website: 'https://snoozeeatery.com', address: '2262 Larimer St' }
    ],
    'Italian': [
      { name: 'Barolo Grill', cuisine: 'Italian', website: 'https://barologrilldenver.com', address: '3030 E 6th Ave' },
      { name: 'Panzano', cuisine: 'Italian', website: 'https://panzano-denver.com', address: '909 17th St' },
      { name: 'North Italia', cuisine: 'Italian', website: 'https://northitalia.com', address: '1405 15th St' }
    ],
    'Mexican': [
      { name: 'El Five', cuisine: 'Mexican', website: 'https://elfivedenver.com', address: '2930 Utica St' },
      { name: 'Comida', cuisine: 'Mexican', website: 'https://comidadenver.com', address: '4401 Tennyson St' },
      { name: 'Los Chingones', cuisine: 'Mexican', website: 'https://loschingones.com', address: '2463 Larimer St' }
    ],
    'Asian': [
      { name: 'ChoLon', cuisine: 'Asian Fusion', website: 'https://cholon.com', address: '1555 Blake St' },
      { name: 'Tavernetta', cuisine: 'Asian', website: 'https://tavernettadenver.com', address: '1889 16th St' },
      { name: 'Hop Alley', cuisine: 'Asian', website: 'https://hopalley.com', address: '3500 Larimer St' }
    ],
    'Pizza': [
      { name: 'Dio Mio', cuisine: 'Pizza', website: 'https://diomiopizza.com', address: '1519 Boulder St' },
      { name: 'Cart-Driver', cuisine: 'Pizza', website: 'https://cart-driver.com', address: '2500 Larimer St' },
      { name: 'Atomic Cowboy', cuisine: 'Pizza', website: 'https://atomiccowboy.net', address: '3237 E Colfax Ave' }
    ]
  }

  const cuisineOptions = ['American', 'Italian', 'Mexican', 'Asian', 'Pizza']

  const generateHomemadeSuggestion = () => {
    const suggestions = mealSuggestions[mealType as keyof typeof mealSuggestions] || mealSuggestions.Dinner
    const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)]
    setSuggestion(randomSuggestion)
    setRestaurants([])
  }

  const generateRestaurantSuggestions = () => {
    const cuisineRestaurants = mockRestaurants[selectedCuisine as keyof typeof mockRestaurants] || mockRestaurants.American
    setRestaurants(cuisineRestaurants)
    setSuggestion('')
  }

  const generateSuggestion = () => {
    setIsLoading(true)
    
    setTimeout(() => {
      if (suggestionType === 'homemade') {
        generateHomemadeSuggestion()
      } else {
        generateRestaurantSuggestions()
      }
      setIsLoading(false)
    }, 500)
  }

  const addSuggestionToMeals = () => {
    if (!suggestion) return

    const today = new Date().toISOString().slice(0, 10)
    const newMeal: Meal = {
      id: Date.now().toString(),
      date: today,
      title: `${mealType}: ${suggestion}`,
      groceries: []
    }

    try {
      const existingMeals = JSON.parse(localStorage.getItem('meals') || '[]')
      const updatedMeals = [...existingMeals, newMeal]
      localStorage.setItem('meals', JSON.stringify(updatedMeals))
      window.dispatchEvent(new CustomEvent('meals-updated'))
      
      alert(`Added "${suggestion}" to today's meal plan!`)
      setSuggestion('')
    } catch (error) {
      console.error('Error adding suggestion to meals:', error)
    }
  }

  const addRestaurantToMeals = (restaurant: any) => {
    const today = new Date().toISOString().slice(0, 10)
    const contextualMealType = mealType === 'Snack' ? 'Coffee' : mealType
    const newMeal: Meal = {
      id: Date.now().toString(),
      date: today,
      title: `${contextualMealType} at ${restaurant.name}`,
      groceries: []
    }

    try {
      const existingMeals = JSON.parse(localStorage.getItem('meals') || '[]')
      const updatedMeals = [...existingMeals, newMeal]
      localStorage.setItem('meals', JSON.stringify(updatedMeals))
      window.dispatchEvent(new CustomEvent('meals-updated'))
      
      alert(`Added "${contextualMealType} at ${restaurant.name}" to today's meal plan!`)
      setRestaurants([])
    } catch (error) {
      console.error('Error adding restaurant to meals:', error)
    }
  }

  return (
    <div className="surprise-me-card">
      <h4>Surprise Me</h4>
      <p className="card-description">Get meal suggestions or find restaurants near you!</p>
      
      <div className="surprise-type-selector">
        <label>Suggestion Type:</label>
        <select
          value={suggestionType}
          onChange={(e) => setSuggestionType(e.target.value as 'homemade' | 'restaurant')}
          className="form-select"
        >
          <option value="homemade">Homemade Meals</option>
          <option value="restaurant">Restaurants (Denver 80205)</option>
        </select>
      </div>
      
      <div className="surprise-controls">
        <select
          value={mealType}
          onChange={(e) => setMealType(e.target.value)}
          className="form-select"
        >
          <option value="Breakfast">Breakfast</option>
          <option value="Lunch">Lunch</option>
          <option value="Dinner">Dinner</option>
          <option value="Snack">Coffee/Snack</option>
        </select>
        
        {suggestionType === 'restaurant' && (
          <select
            value={selectedCuisine}
            onChange={(e) => setSelectedCuisine(e.target.value)}
            className="form-select"
          >
            {cuisineOptions.map(cuisine => (
              <option key={cuisine} value={cuisine}>{cuisine}</option>
            ))}
          </select>
        )}
        
        <button 
          className="btn btn-surprise"
          onClick={generateSuggestion}
          disabled={isLoading}
        >
          {isLoading ? '🎲 Searching...' : '🎲 Surprise Me!'}
        </button>
      </div>
      
      {suggestion && (
        <div className="suggestion-result">
          <div className="suggestion-text">
            <span className="suggestion-label">How about:</span>
            <h5 className="suggestion-meal">{suggestion}</h5>
          </div>
          
          <div className="suggestion-actions">
            <button className="btn btn-primary" onClick={addSuggestionToMeals}>
              Add to Today
            </button>
            <button className="btn btn-secondary" onClick={generateSuggestion}>
              Try Again
            </button>
          </div>
        </div>
      )}

      {restaurants.length > 0 && (
        <div className="restaurant-suggestions">
          <div className="restaurant-header">
            <span className="suggestion-label">Restaurant Options:</span>
            <small className="location-info">Within 10mi of Denver, CO 80205</small>
          </div>
          
          {restaurants.map((restaurant, index) => (
            <div key={index} className="restaurant-option">
              <div className="restaurant-info">
                <h6 className="restaurant-name">{restaurant.name}</h6>
                <p className="restaurant-cuisine">{restaurant.cuisine} • {restaurant.address}</p>
                <a 
                  href={restaurant.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="restaurant-website"
                >
                  View Menu →
                </a>
              </div>
              <button 
                className="btn btn-primary btn-sm"
                onClick={() => addRestaurantToMeals(restaurant)}
              >
                Add to Plan
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}