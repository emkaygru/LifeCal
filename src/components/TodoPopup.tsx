import { useState } from 'react'

interface TodoPopupProps {
  onClose: () => void
  selectedDate?: string | null
}

export default function TodoPopup({ onClose, selectedDate }: TodoPopupProps) {
  const [todoText, setTodoText] = useState('')
  const [selectedOwners, setSelectedOwners] = useState<string[]>(['Emily'])
  const [dueDate, setDueDate] = useState(selectedDate || new Date().toISOString().split('T')[0])
  const [todoList, setTodoList] = useState('main')
  const [newListName, setNewListName] = useState('')
  const [showNewList, setShowNewList] = useState(false)

  const owners = ['Emily', 'Steph', 'Maisie']
  const existingLists = ['main', 'birthday-prep', 'grocery-list', 'work-tasks']

  const handleOwnerToggle = (owner: string) => {
    setSelectedOwners(prev => 
      prev.includes(owner)
        ? prev.filter(o => o !== owner)
        : [...prev, owner]
    )
  }

  const handleCreateNewList = () => {
    if (newListName.trim()) {
      setTodoList(newListName.trim())
      setShowNewList(false)
      setNewListName('')
    }
  }

  const handleAddTodo = () => {
    if (!todoText.trim() || selectedOwners.length === 0) return

    const todos = JSON.parse(localStorage.getItem('todos') || '[]')
    
    // Create a todo for each selected owner
    selectedOwners.forEach((owner, index) => {
      const newTodo = {
        id: `${Date.now()}-${index}`,
        title: todoText,
        date: dueDate,
        owner,
        done: false,
        status: 'todo',
        list: todoList
      }
      todos.push(newTodo)
    })

    localStorage.setItem('todos', JSON.stringify(todos))
    window.dispatchEvent(new CustomEvent('todos-updated'))
    
    // Trigger sync
    window.dispatchEvent(new CustomEvent('localStorageChange', {
      detail: { key: 'todos', value: JSON.stringify(todos) }
    }))

    onClose()
  }

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-content todo-popup" onClick={e => e.stopPropagation()}>
        <div className="popup-header">
          <h3>Add Todo</h3>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>
        
        <div className="popup-form">
          <div className="form-group">
            <label>Todo</label>
            <input
              type="text"
              value={todoText}
              onChange={(e) => setTodoText(e.target.value)}
              placeholder="What needs to be done?"
              className="form-input"
              autoFocus
            />
          </div>
          
          <div className="form-group">
            <label>Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="form-input"
            />
          </div>
          
          <div className="form-group">
            <label>Assign To</label>
            <div className="owner-options">
              {owners.map(owner => (
                <label key={owner} className="owner-option">
                  <input
                    type="checkbox"
                    checked={selectedOwners.includes(owner)}
                    onChange={() => handleOwnerToggle(owner)}
                  />
                  <span className="owner-name">{owner}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div className="form-group">
            <label>Add to List</label>
            <div className="list-selection">
              <select
                value={todoList}
                onChange={(e) => setTodoList(e.target.value)}
                className="form-select"
              >
                {existingLists.map(list => (
                  <option key={list} value={list}>
                    {list.replace('-', ' ').toUpperCase()}
                  </option>
                ))}
              </select>
              <button 
                onClick={() => setShowNewList(true)}
                className="btn btn-ghost btn-sm"
              >
                + New List
              </button>
            </div>
            
            {showNewList && (
              <div className="new-list-form">
                <input
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="New list name"
                  className="form-input"
                />
                <div className="new-list-actions">
                  <button onClick={() => setShowNewList(false)} className="btn btn-ghost btn-sm">
                    Cancel
                  </button>
                  <button onClick={handleCreateNewList} className="btn btn-sm">
                    Create
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="popup-actions">
          <button onClick={onClose} className="btn btn-ghost">Cancel</button>
          <button 
            onClick={handleAddTodo} 
            className="btn" 
            disabled={!todoText.trim() || selectedOwners.length === 0}
          >
            Add Todo
          </button>
        </div>
      </div>
    </div>
  )
}