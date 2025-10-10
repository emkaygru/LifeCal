import React, { useEffect, useState } from 'react'

type Todo = {
  id: string
  title: string
  owner: string
  done: boolean
  date: string
  status: 'todo' | 'doing' | 'done'
}

const OWNER_COLORS: Record<string, string> = {
  Steph: '#0b6623',
  Emily: '#00a2ff',
  Maisie: '#b57edc',
}

export default function TodoAccordion({ selectedDate }: { selectedDate?: string | null }) {
  const [todos, setTodos] = useState<Todo[]>(() => {
    try {
      const raw = localStorage.getItem('todos')
      const parsed = raw ? JSON.parse(raw) : []
      // normalize missing status
      return parsed.map((t: any) => ({ status: 'todo', ...t }))
    } catch {
      return []
    }
  })
  const [openDate, setOpenDate] = useState<string | null>(selectedDate || null)
  const [newTitle, setNewTitle] = useState('')
  const [newOwner, setNewOwner] = useState<string>('Emily')
  const [people, setPeople] = useState<{id:string;name:string;color:string}[]>(() => {
    try { return JSON.parse(localStorage.getItem('people') || '[]') } catch { return [] }
  })

  useEffect(() => {
    function onStorage() {
      try { setPeople(JSON.parse(localStorage.getItem('people') || '[]')) } catch {}
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos))
  }, [todos])

  function addTodo() {
    if (!newTitle) return
    const key = openDate || new Date().toISOString().slice(0, 10)
    setTodos((t) => [...t, { id: Date.now().toString(), title: newTitle, owner: newOwner, done: false, date: key, status: 'todo' }])
    setNewTitle('')
  }

  function toggleDone(id: string) {
    setTodos((t) => t.map((x) => x.id === id ? { ...x, done: !x.done, status: (!x.done ? 'done' : 'todo') } : x))
  }

  function setStatus(id: string, status: Todo['status']) {
    setTodos(t => t.map(x => x.id === id ? { ...x, status, done: status === 'done' } : x))
  }

  function setOwner(id: string, owner: string) {
    setTodos(t => t.map(x => x.id === id ? { ...x, owner } : x))
  }

  // Drag and drop
  const onDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id)
  }

  const onDropTo = (e: React.DragEvent, status: Todo['status']) => {
    const id = e.dataTransfer.getData('text/plain')
    if (!id) return
    setStatus(id, status)
    e.preventDefault()
  }

  const onDragOver = (e: React.DragEvent) => e.preventDefault()

  const grouped = todos.reduce<Record<string, Todo[]>>((acc, t) => {
    acc[t.date] = acc[t.date] || []
    acc[t.date].push(t)
    return acc
  }, {})

  const dates = Object.keys(grouped).sort()

  useEffect(() => {
    if (selectedDate) setOpenDate(selectedDate)
  }, [selectedDate])

  return (
    <div className="todo-accordion">
      <h3>To-dos</h3>
      <div className="add-row">
        <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="New task" />
        <select value={newOwner} onChange={(e) => setNewOwner(e.target.value)}>
          {people.length === 0 ? (
            <>
              <option>Emily</option>
              <option>Steph</option>
              <option>Maisie</option>
            </>
          ) : (
            people.map(p => <option key={p.id} value={p.name}>{p.name}</option>)
          )}
        </select>
        <button onClick={addTodo}>Add</button>
      </div>

      <div className="accordion-list">
        {dates.length === 0 && <div>No todos</div>}
        {dates.map((d) => (
          <div key={d} className="accordion-item">
            <button className="accordion-header" onClick={() => setOpenDate(openDate === d ? null : d)}>
              {d} <span>({grouped[d].length})</span>
            </button>
            {openDate === d && (
              <div className="accordion-body">
                <div className="status-columns">
                  {(['todo','doing','done'] as Todo['status'][]).map(s => (
                    <div key={s} className={`status-column status-${s}`} onDrop={(e) => onDropTo(e, s)} onDragOver={onDragOver}>
                      <h4>{s === 'todo' ? 'To Do' : s === 'doing' ? 'Doing' : 'Done'}</h4>
                      {grouped[d].filter(t => t.status === s).map(t => (
                        <div key={t.id} draggable onDragStart={(e) => onDragStart(e, t.id)} className="todo-card">
                          <div className="card-top">
                            <input type="checkbox" checked={t.done} onChange={() => toggleDone(t.id)} />
                            <span className="title" style={{ textDecoration: t.done ? 'line-through' : 'none' }}>{t.title}</span>
                          </div>
                          <div className="card-bottom">
                            <select value={t.owner} onChange={(e) => setOwner(t.id, e.target.value)}>
                              {people.length === 0 ? (
                                <>
                                  <option>Emily</option>
                                  <option>Steph</option>
                                  <option>Maisie</option>
                                </>
                              ) : (
                                people.map(p => <option key={p.id} value={p.name}>{p.name}</option>)
                              )}
                            </select>
                            <span className="owner" style={{ background: OWNER_COLORS[t.owner] || (t.owner.toLowerCase().includes('mais') ? '#b57edc' : '#ccc') }}>{t.owner}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
