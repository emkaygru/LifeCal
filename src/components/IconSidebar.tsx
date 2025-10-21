import { useState } from 'react'

interface IconSidebarProps {
  selectedDate: string | null
}

export default function IconSidebar({ selectedDate }: IconSidebarProps) {
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
                placeholder="Create a quick note or todo..." 
                className="note-input"
                rows={3}
              />
              <div className="note-actions">
                <button className="btn btn-primary">Save as Note</button>
                <button className="btn btn-secondary">Add to Todo</button>
              </div>
            </div>
            
            {/* Display saved notes */}
            <div className="saved-notes">
              <h4>Saved Notes</h4>
              <div className="note-item" draggable>
                <div className="note-content">
                  <span className="note-text">Sample note that can be dragged to days</span>
                  <span className="note-date">Oct 21</span>
                </div>
                <div className="note-actions-small">
                  <button className="drag-btn" title="Drag to calendar">⋮⋮</button>
                  <button className="delete-btn" title="Delete">×</button>
                </div>
              </div>
              
              <div className="note-item" draggable>
                <div className="note-content">
                  <span className="note-text">Another note example</span>
                  <span className="note-date">Oct 20</span>
                </div>
                <div className="note-actions-small">
                  <button className="drag-btn" title="Drag to calendar">⋮⋮</button>
                  <button className="delete-btn" title="Delete">×</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}