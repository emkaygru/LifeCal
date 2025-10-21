import { useState } from 'react'

interface IconSidebarProps {
  selectedDate: string | null
  parking: string | null
  setParking: (parking: string | null) => void
}

export default function IconSidebar({ selectedDate, parking, setParking }: IconSidebarProps) {
  const [activePanel, setActivePanel] = useState<string | null>(null)

  const togglePanel = (panel: string) => {
    setActivePanel(activePanel === panel ? null : panel)
  }

  return (
    <div className="icon-sidebar">
      {/* Sidebar Icons */}
      <div className="sidebar-icons">
        <button 
          className={`sidebar-icon ${activePanel === 'meals' ? 'active' : ''}`}
          onClick={() => togglePanel('meals')}
          title="Meal Planner"
        >
          🍽️
        </button>
        
        <button 
          className={`sidebar-icon ${activePanel === 'todos' ? 'active' : ''}`}
          onClick={() => togglePanel('todos')}
          title="Todos"
        >
          ☑️
        </button>
        
        <button 
          className={`sidebar-icon ${activePanel === 'grocery' ? 'active' : ''}`}
          onClick={() => togglePanel('grocery')}
          title="Grocery List"
        >
          🥛
        </button>

        <button 
          className={`sidebar-icon ${activePanel === 'notes' ? 'active' : ''}`}
          onClick={() => togglePanel('notes')}
          title="Quick Notes"
        >
          📝
        </button>

        <button 
          className={`sidebar-icon ${activePanel === 'parking' ? 'active' : ''}`}
          onClick={() => togglePanel('parking')}
          title="Parking"
        >
          🚗
        </button>
      </div>

      {/* Collapsible Panels */}
      {activePanel === 'meals' && (
        <div className="sidebar-panel">
          <div className="panel-header">
            <h3>Meal Planning</h3>
            <button className="close-panel" onClick={() => setActivePanel(null)}>×</button>
          </div>
          <div className="panel-content">
            <p>Quick meal planning for {selectedDate ? new Date(selectedDate).toLocaleDateString() : 'selected day'}</p>
            {/* Add meal planning interface here */}
            <div className="meal-quick-add">
              <select className="meal-select">
                <option>Select meal...</option>
                <option>Breakfast</option>
                <option>Lunch</option>
                <option>Dinner</option>
                <option>Snack</option>
              </select>
              <input type="text" placeholder="Meal description..." className="meal-input" />
              <button className="btn">Add</button>
            </div>
          </div>
        </div>
      )}

      {activePanel === 'todos' && (
        <div className="sidebar-panel">
          <div className="panel-header">
            <h3>Quick Todos</h3>
            <button className="close-panel" onClick={() => setActivePanel(null)}>×</button>
          </div>
          <div className="panel-content">
            <div className="todo-quick-add">
              <input type="text" placeholder="Add a quick todo..." className="todo-input" />
              <select className="owner-select">
                <option>Emily</option>
                <option>Steph</option>
              </select>
              <button className="btn">Add</button>
            </div>
            {/* Display recent todos here */}
            <div className="recent-todos">
              <h4>Recent Todos</h4>
              <div className="todo-item">
                <input type="checkbox" /> 
                <span>Sample todo item</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activePanel === 'grocery' && (
        <div className="sidebar-panel">
          <div className="panel-header">
            <h3>Grocery List</h3>
            <button className="close-panel" onClick={() => setActivePanel(null)}>×</button>
          </div>
          <div className="panel-content">
            <div className="grocery-quick-add">
              <input type="text" placeholder="Add grocery item..." className="grocery-input" />
              <select className="category-select">
                <option>General</option>
                <option>Produce</option>
                <option>Dairy</option>
                <option>Meat</option>
                <option>Pantry</option>
              </select>
              <button className="btn">Add</button>
            </div>
            {/* Display grocery list here */}
            <div className="grocery-categories">
              <h4>Quick Add</h4>
              <div className="quick-grocery-buttons">
                <button className="quick-grocery">🥛 Milk</button>
                <button className="quick-grocery">🍞 Bread</button>
                <button className="quick-grocery">🥚 Eggs</button>
                <button className="quick-grocery">🧀 Cheese</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activePanel === 'notes' && (
        <div className="sidebar-panel">
          <div className="panel-header">
            <h3>Quick Notes</h3>
            <button className="close-panel" onClick={() => setActivePanel(null)}>×</button>
          </div>
          <div className="panel-content">
            <div className="notes-quick-add">
              <textarea 
                placeholder="Write a quick note..." 
                className="note-input"
                rows={3}
                id="quick-note-input"
              />
              <div className="note-actions">
                <div className="todo-assignment">
                  <label>Add to List:</label>
                  <select className="list-select" id="todo-list-select">
                    <option value="">Select list...</option>
                    <option value="todos">Todos</option>
                    <option value="grocery">Grocery</option>
                    <option value="new">+ Create New List</option>
                  </select>
                  
                  <label>Assign to:</label>
                  <select className="owner-select" id="todo-owner-select">
                    <option value="Emily">Emily</option>
                    <option value="Steph">Steph</option>
                    <option value="Maisie">Maisie</option>
                  </select>
                </div>
                
                <div className="action-buttons">
                  <button 
                    className="btn btn-secondary"
                    onClick={() => {
                      const noteInput = document.getElementById('quick-note-input') as HTMLTextAreaElement
                      const listSelect = document.getElementById('todo-list-select') as HTMLSelectElement
                      const ownerSelect = document.getElementById('todo-owner-select') as HTMLSelectElement
                      
                      if (!noteInput.value.trim()) return
                      
                      if (listSelect.value) {
                        // Add to selected todo list
                        const todoItem = {
                          id: Date.now().toString(),
                          text: noteInput.value.trim(),
                          completed: false,
                          user: ownerSelect.value,
                          list: listSelect.value === 'new' ? prompt('Enter new list name:') || 'Custom' : listSelect.value,
                          createdAt: new Date().toISOString()
                        }
                        
                        // Save to localStorage
                        const existingTodos = JSON.parse(localStorage.getItem('todos') || '[]')
                        existingTodos.push(todoItem)
                        localStorage.setItem('todos', JSON.stringify(existingTodos))
                        
                        // Dispatch event for UI updates
                        window.dispatchEvent(new CustomEvent('todos-updated'))
                        
                        // Clear inputs
                        noteInput.value = ''
                        listSelect.value = ''
                        
                        alert(`Added "${todoItem.text}" to ${todoItem.list} list for ${todoItem.user}`)
                      } else {
                        alert('Please select a list to add the todo to')
                      }
                    }}
                  >
                    Add to Todo
                  </button>
                  
                  <button 
                    className="btn btn-primary"
                    onClick={() => {
                      const noteInput = document.getElementById('quick-note-input') as HTMLTextAreaElement
                      if (!noteInput.value.trim()) return
                      
                      // Save as a standalone note
                      const note = {
                        id: Date.now().toString(),
                        text: noteInput.value.trim(),
                        createdAt: new Date().toISOString()
                      }
                      
                      const existingNotes = JSON.parse(localStorage.getItem('quick-notes') || '[]')
                      existingNotes.unshift(note) // Add to beginning
                      localStorage.setItem('quick-notes', JSON.stringify(existingNotes))
                      
                      noteInput.value = ''
                      alert('Note saved!')
                    }}
                  >
                    Save as Note
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activePanel === 'parking' && (
        <div className="sidebar-panel">
          <div className="panel-header">
            <h3>Parking Location</h3>
            <button className="close-panel" onClick={() => setActivePanel(null)}>×</button>
          </div>
          <div className="panel-content">
            <div className="parking-selector">
              <p>Where are you parked?</p>
              <div className="parking-options">
                <button 
                  className={`parking-btn ${parking === 'P2' ? 'active' : ''}`}
                  onClick={() => {
                    const newParking = parking === 'P2' ? null : 'P2'
                    setParking(newParking)
                    localStorage.setItem('parking', newParking || '')
                  }}
                >
                  P2
                </button>
                <button 
                  className={`parking-btn ${parking === 'P3' ? 'active' : ''}`}
                  onClick={() => {
                    const newParking = parking === 'P3' ? null : 'P3'
                    setParking(newParking)
                    localStorage.setItem('parking', newParking || '')
                  }}
                >
                  P3
                </button>
              </div>
              {parking && (
                <div className="current-parking">
                  Currently parked in: <strong>{parking}</strong>
                </div>
              )}
              {!parking && (
                <div className="no-parking">
                  No parking location set
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}