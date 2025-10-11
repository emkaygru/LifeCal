import React, { useEffect, useState } from 'react'

type Meal = { id: string; date: string; title: string; groceries?: string[] }

export default function MealPlanner({ selectedDate }: { selectedDate?: string | null }) {
  const [meals, setMeals] = useState<Meal[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('meals') || '[]')
    } catch {
      return []
    }
  })
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [title, setTitle] = useState('')

  useEffect(() => {
    if (selectedDate) setDate(selectedDate)
  }, [selectedDate])

  useEffect(() => {
    localStorage.setItem('meals', JSON.stringify(meals))
    // notify listeners
    window.dispatchEvent(new CustomEvent('meals-updated'))
  }, [meals])

  function addMeal() {
    if (!title) return
    const m: Meal = { id: Date.now().toString(), date, title, groceries: [] }
    setMeals((s) => [...s, m])
    setTitle('')
  }

  return (
    <div className="meal-planner">
      <h3>Meal Planner</h3>
      <div className="add-row">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Meal" />
  <button className="btn" onClick={addMeal}>Add</button>
      </div>

      <div className="meals-list">
        {meals.length === 0 && <div>No meals</div>}
        {meals.map((m) => (
          <div key={m.id} className="meal-row">
            <strong>{m.date}</strong>
            <span>{m.title}</span>
            <input placeholder="comma-separated groceries" defaultValue={(m.groceries || []).join(', ')} onBlur={(e) => {
              const list = e.currentTarget.value.split(',').map(s => s.trim()).filter(Boolean)
              setMeals(s => s.map(x => x.id === m.id ? { ...x, groceries: list } : x))
            }} />
            <button className="btn btn-ghost" onClick={() => {
              const groceries = m.groceries || []
              const existing = JSON.parse(localStorage.getItem('grocery') || '[]')
              const now = Date.now().toString()
              const merged = existing.concat(groceries.map((g: string, i:number) => ({ id: now + i, name: g, category: 'From Meal' })))
              localStorage.setItem('grocery', JSON.stringify(merged))
              // notify grocery listeners
              window.dispatchEvent(new CustomEvent('grocery-updated'))
              alert('Added meal groceries to grocery list')
            }}>Add groceries</button>
          </div>
        ))}
      </div>
    </div>
  )
}
