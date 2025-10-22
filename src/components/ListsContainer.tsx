import React, { useState, useEffect } from 'react'

interface ListItem {
  id: string
  text: string
  checked: boolean
}

interface List {
  id: string
  name: string
  items: ListItem[]
  isDefault: boolean
  icon: string
}

interface ListSubCardProps {
  list: List
  onItemToggle: (listId: string, itemId: string) => void
  onItemAdd: (listId: string, text: string) => void
  onItemDelete: (listId: string, itemId: string) => void
  onListDelete?: (listId: string) => void
}

function ListSubCard({ list, onItemToggle, onItemAdd, onItemDelete, onListDelete }: ListSubCardProps) {
  const [newItemText, setNewItemText] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const checkedCount = list.items.filter(item => item.checked).length
  const totalCount = list.items.length

  const handleAddItem = () => {
    if (newItemText.trim()) {
      onItemAdd(list.id, newItemText.trim())
      setNewItemText('')
      setIsAdding(false)
    }
  }

  return (
    <div className="list-subcard">
      <div className="subcard-header">
        <div className="subcard-title">
          <span className="subcard-icon">{list.icon}</span>
          <h4>{list.name}</h4>
          <span className="list-count">{checkedCount}/{totalCount}</span>
        </div>
        <div className="list-actions">
          <button 
            className="add-item-btn"
            onClick={() => setIsAdding(true)}
            title={`Add item to ${list.name}`}
          >
            +
          </button>
          {!list.isDefault && onListDelete && (
            <button 
              className="delete-list-btn"
              onClick={() => onListDelete(list.id)}
              title={`Delete ${list.name} list`}
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      <div className="list-items">
        {list.items.map(item => (
          <div key={item.id} className={`list-item ${item.checked ? 'checked' : ''}`}>
            <input
              type="checkbox"
              checked={item.checked}
              onChange={() => onItemToggle(list.id, item.id)}
              className="item-checkbox"
            />
            <span className="item-text">{item.text}</span>
            <button
              className="delete-item-btn"
              onClick={() => onItemDelete(list.id, item.id)}
              title="Delete item"
            >
              ✕
            </button>
          </div>
        ))}

        {isAdding && (
          <div className="add-item-form">
            <input
              type="text"
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              placeholder={`Add to ${list.name}...`}
              className="new-item-input"
              autoFocus
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleAddItem()
                if (e.key === 'Escape') setIsAdding(false)
              }}
              onBlur={() => {
                if (newItemText.trim()) {
                  handleAddItem()
                } else {
                  setIsAdding(false)
                }
              }}
            />
          </div>
        )}

        {list.items.length === 0 && !isAdding && (
          <div className="empty-list">
            <span>No items yet</span>
            <button className="add-first-item" onClick={() => setIsAdding(true)}>
              Add first item
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ListsContainer() {
  const [lists, setLists] = useState<List[]>([])
  const [newListName, setNewListName] = useState('')
  const [isCreatingList, setIsCreatingList] = useState(false)

  const defaultLists: Omit<List, 'items'>[] = [
    { id: 'grocery', name: 'Grocery', isDefault: true, icon: '🛒' },
    { id: 'shopping', name: 'Shopping', isDefault: true, icon: '🛍️' },
    { id: 'packing', name: 'Packing', isDefault: true, icon: '🧳' }
  ]

  useEffect(() => {
    loadLists()
  }, [])

  const loadLists = () => {
    const savedLists = localStorage.getItem('lists')
    if (savedLists) {
      setLists(JSON.parse(savedLists))
    } else {
      // Initialize with default lists
      const initialLists = defaultLists.map(list => ({ ...list, items: [] }))
      setLists(initialLists)
      localStorage.setItem('lists', JSON.stringify(initialLists))
    }
  }

  const saveLists = (updatedLists: List[]) => {
    setLists(updatedLists)
    localStorage.setItem('lists', JSON.stringify(updatedLists))
  }

  const handleItemToggle = (listId: string, itemId: string) => {
    const updatedLists = lists.map(list => 
      list.id === listId 
        ? {
            ...list,
            items: list.items.map(item => 
              item.id === itemId ? { ...item, checked: !item.checked } : item
            )
          }
        : list
    )
    saveLists(updatedLists)
  }

  const handleItemAdd = (listId: string, text: string) => {
    const newItem: ListItem = {
      id: Date.now().toString(),
      text,
      checked: false
    }
    
    const updatedLists = lists.map(list => 
      list.id === listId 
        ? { ...list, items: [...list.items, newItem] }
        : list
    )
    saveLists(updatedLists)
  }

  const handleItemDelete = (listId: string, itemId: string) => {
    const updatedLists = lists.map(list => 
      list.id === listId 
        ? { ...list, items: list.items.filter(item => item.id !== itemId) }
        : list
    )
    saveLists(updatedLists)
  }

  const handleListAdd = () => {
    if (newListName.trim()) {
      const newList: List = {
        id: Date.now().toString(),
        name: newListName.trim(),
        items: [],
        isDefault: false,
        icon: '📝'
      }
      saveLists([...lists, newList])
      setNewListName('')
      setIsCreatingList(false)
    }
  }

  const handleListDelete = (listId: string) => {
    const updatedLists = lists.filter(list => list.id !== listId)
    saveLists(updatedLists)
  }

  return (
    <div className="lists-container-content">
      <div className="lists-grid">
        {lists.map(list => (
          <ListSubCard
            key={list.id}
            list={list}
            onItemToggle={handleItemToggle}
            onItemAdd={handleItemAdd}
            onItemDelete={handleItemDelete}
            onListDelete={handleListDelete}
          />
        ))}

        {/* Add new list card */}
        <div className="add-list-card">
          {isCreatingList ? (
            <div className="new-list-form">
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="List name..."
                className="new-list-input"
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleListAdd()
                  if (e.key === 'Escape') setIsCreatingList(false)
                }}
                onBlur={() => {
                  if (newListName.trim()) {
                    handleListAdd()
                  } else {
                    setIsCreatingList(false)
                  }
                }}
              />
            </div>
          ) : (
            <button 
              className="create-list-btn"
              onClick={() => setIsCreatingList(true)}
            >
              <span className="plus-icon">+</span>
              <span>Create New List</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}