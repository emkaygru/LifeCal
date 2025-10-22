import React, { useState, useEffect } from 'react'
import { getTodos } from '../lib/store'

interface Todo {
  id: string
  title: string
  done: boolean
  owner: string
  date?: string
}

interface TodoSubCardProps {
  owner: string
  todos: Todo[]
  onTodoToggle: (id: string) => void
  onTodoAdd: (title: string, owner: string) => void
  onTodoDelete: (id: string) => void
}

function TodoSubCard({ owner, todos, onTodoToggle, onTodoAdd, onTodoDelete }: TodoSubCardProps) {
  const [newTodoText, setNewTodoText] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const ownerTodos = todos.filter(todo => todo.owner === owner && !todo.date) // Only general todos, not date-specific ones
  const completedCount = ownerTodos.filter(todo => todo.done).length
  const totalCount = ownerTodos.length

  const handleAddTodo = () => {
    if (newTodoText.trim()) {
      onTodoAdd(newTodoText.trim(), owner)
      setNewTodoText('')
      setIsAdding(false)
    }
  }

  const getOwnerIcon = (owner: string) => {
    switch (owner) {
      case 'Emily': return '👩‍💻'
      case 'Steph': return '👨‍🍳'
      case 'Maisie': return '🐕'
      default: return '👤'
    }
  }

  return (
    <div className="todo-subcard">
      <div className="subcard-header">
        <div className="subcard-title">
          <span className="subcard-icon">{getOwnerIcon(owner)}</span>
          <h4>{owner}</h4>
          <span className="todo-count">{completedCount}/{totalCount}</span>
        </div>
        <button 
          className="add-todo-btn"
          onClick={() => setIsAdding(true)}
          title={`Add todo for ${owner}`}
        >
          +
        </button>
      </div>

      <div className="todo-list">
        {ownerTodos.map(todo => (
          <div key={todo.id} className={`todo-item ${todo.done ? 'completed' : ''}`}>
            <input
              type="checkbox"
              checked={todo.done}
              onChange={() => onTodoToggle(todo.id)}
              className="todo-checkbox"
            />
            <span className="todo-text">{todo.title}</span>
            <button
              className="delete-todo-btn"
              onClick={() => onTodoDelete(todo.id)}
              title="Delete todo"
            >
              ✕
            </button>
          </div>
        ))}

        {isAdding && (
          <div className="add-todo-form">
            <input
              type="text"
              value={newTodoText}
              onChange={(e) => setNewTodoText(e.target.value)}
              placeholder={`Add todo for ${owner}...`}
              className="new-todo-input"
              autoFocus
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleAddTodo()
                if (e.key === 'Escape') setIsAdding(false)
              }}
              onBlur={() => {
                if (newTodoText.trim()) {
                  handleAddTodo()
                } else {
                  setIsAdding(false)
                }
              }}
            />
          </div>
        )}

        {ownerTodos.length === 0 && !isAdding && (
          <div className="empty-todos">
            <span>No todos yet</span>
            <button className="add-first-todo" onClick={() => setIsAdding(true)}>
              Add first todo
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function TodoContainer() {
  const [todos, setTodos] = useState<Todo[]>([])

  useEffect(() => {
    loadTodos()
    
    const handleTodosUpdate = () => loadTodos()
    window.addEventListener('todos-updated', handleTodosUpdate)
    return () => window.removeEventListener('todos-updated', handleTodosUpdate)
  }, [])

  const loadTodos = () => {
    setTodos(getTodos())
  }

  const handleTodoToggle = (id: string) => {
    const updatedTodos = todos.map(todo => 
      todo.id === id ? { ...todo, done: !todo.done } : todo
    )
    setTodos(updatedTodos)
    localStorage.setItem('todos', JSON.stringify(updatedTodos))
    window.dispatchEvent(new CustomEvent('todos-updated'))
  }

  const handleTodoAdd = (title: string, owner: string) => {
    const newTodo: Todo = {
      id: Date.now().toString(),
      title,
      done: false,
      owner
    }
    const updatedTodos = [...todos, newTodo]
    setTodos(updatedTodos)
    localStorage.setItem('todos', JSON.stringify(updatedTodos))
    window.dispatchEvent(new CustomEvent('todos-updated'))
  }

  const handleTodoDelete = (id: string) => {
    const updatedTodos = todos.filter(todo => todo.id !== id)
    setTodos(updatedTodos)
    localStorage.setItem('todos', JSON.stringify(updatedTodos))
    window.dispatchEvent(new CustomEvent('todos-updated'))
  }

  return (
    <div className="todo-container-content">
      <div className="todo-subcards">
        <TodoSubCard 
          owner="Emily" 
          todos={todos}
          onTodoToggle={handleTodoToggle}
          onTodoAdd={handleTodoAdd}
          onTodoDelete={handleTodoDelete}
        />
        <TodoSubCard 
          owner="Steph" 
          todos={todos}
          onTodoToggle={handleTodoToggle}
          onTodoAdd={handleTodoAdd}
          onTodoDelete={handleTodoDelete}
        />
        <TodoSubCard 
          owner="Maisie" 
          todos={todos}
          onTodoToggle={handleTodoToggle}
          onTodoAdd={handleTodoAdd}
          onTodoDelete={handleTodoDelete}
        />
      </div>
    </div>
  )
}