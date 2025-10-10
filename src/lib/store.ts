export function getTodos() {
  try {
    return JSON.parse(localStorage.getItem('todos') || '[]')
  } catch (e) {
    return []
  }
}

export function setTodos(todos: any[]) {
  localStorage.setItem('todos', JSON.stringify(todos))
  // dispatch event so other components can update
  window.dispatchEvent(new CustomEvent('todos-updated', { detail: todos }))
}

export function updateTodoDate(id: string, newDate: string) {
  const todos = getTodos()
  const next = todos.map((t: any) => t.id === id ? { ...t, date: newDate } : t)
  setTodos(next)
  return next
}
