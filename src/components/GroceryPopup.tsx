import { useState } from 'react'

interface GroceryPopupProps {
  onClose: () => void
  selectedDate?: string | null
}

export default function GroceryPopup({ onClose, selectedDate }: GroceryPopupProps) {
  const [itemName, setItemName] = useState('')
  const [category, setCategory] = useState('General')
  const [quantity, setQuantity] = useState('')

  const categories = [
    'General',
    'Produce',
    'Dairy',
    'Meat',
    'Pantry',
    'Frozen',
    'Bakery',
    'Household',
    'From Meal'
  ]

  const quickItems = [
    'Milk', 'Bread', 'Eggs', 'Chicken', 'Bananas', 
    'Apples', 'Pasta', 'Rice', 'Cheese', 'Yogurt'
  ]

  const handleAddItem = () => {
    if (!itemName.trim()) return

    const groceries = JSON.parse(localStorage.getItem('grocery') || '[]')
    const newItem = {
      id: Date.now().toString(),
      name: itemName.trim(),
      category,
      qty: quantity,
      bought: false
    }

    groceries.push(newItem)
    localStorage.setItem('grocery', JSON.stringify(groceries))
    window.dispatchEvent(new CustomEvent('grocery-updated'))
    
    // Trigger sync
    window.dispatchEvent(new CustomEvent('localStorageChange', {
      detail: { key: 'grocery', value: JSON.stringify(groceries) }
    }))

    onClose()
  }

  const handleQuickAdd = (item: string) => {
    const groceries = JSON.parse(localStorage.getItem('grocery') || '[]')
    const newItem = {
      id: Date.now().toString(),
      name: item,
      category: 'General',
      qty: '',
      bought: false
    }

    groceries.push(newItem)
    localStorage.setItem('grocery', JSON.stringify(groceries))
    window.dispatchEvent(new CustomEvent('grocery-updated'))
    
    // Trigger sync
    window.dispatchEvent(new CustomEvent('localStorageChange', {
      detail: { key: 'grocery', value: JSON.stringify(groceries) }
    }))

    onClose()
  }

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-content grocery-popup" onClick={e => e.stopPropagation()}>
        <div className="popup-header">
          <h3>Add to Grocery List</h3>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>
        
        <div className="popup-form">
          <div className="form-group">
            <label>Quick Add</label>
            <div className="quick-items">
              {quickItems.map(item => (
                <button
                  key={item}
                  className="quick-item"
                  onClick={() => handleQuickAdd(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="form-divider">OR</div>
          
          <div className="form-group">
            <label>Item Name</label>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="e.g., Organic Bananas"
              className="form-input"
              autoFocus
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="form-select"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>Quantity</label>
              <input
                type="text"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g., 2 lbs"
                className="form-input"
              />
            </div>
          </div>
        </div>
        
        <div className="popup-actions">
          <button onClick={onClose} className="btn btn-ghost">Cancel</button>
          <button 
            onClick={handleAddItem} 
            className="btn" 
            disabled={!itemName.trim()}
          >
            Add to List
          </button>
        </div>
      </div>
    </div>
  )
}