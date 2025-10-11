import React, { useEffect, useState } from 'react'

type Item = { id: string; name: string; qty?: string; category?: string; bought?: boolean }

export default function GroceryList() {
  const [items, setItems] = useState<Item[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('grocery') || '[]')
    } catch {
      return []
    }
  })
  const [newItem, setNewItem] = useState('')
  const [category, setCategory] = useState('General')
  const [sortBy, setSortBy] = useState<'department'|'recipe'|'date'>('date')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [recipeSuggestions, setRecipeSuggestions] = useState<any[]>([])
  const [selectedRecipe, setSelectedRecipe] = useState<any | null>(null)
  const [recipeDetails, setRecipeDetails] = useState<any | null>(null)

  useEffect(() => {
    localStorage.setItem('grocery', JSON.stringify(items))
  }, [items])

  // listen for external grocery updates (e.g. from MealPlanner)
  useEffect(() => {
    const h = () => {
      try {
        setItems(JSON.parse(localStorage.getItem('grocery') || '[]'))
      } catch {
        // ignore
      }
    }
    window.addEventListener('grocery-updated', h)
    return () => window.removeEventListener('grocery-updated', h)
  }, [])

  function add() {
    if (!newItem) return
    setItems((s) => [...s, { id: Date.now().toString(), name: newItem, category }])
    setNewItem('')
  }

  function toggleBought(id: string) {
    setItems((s) => s.map((it) => it.id === id ? { ...it, bought: !it.bought } : it))
  }

  // basic keyword -> grocery suggestions
  function suggestFor(text: string) {
    const map: Record<string,string[]> = {
      pork: ['pork chops','salt','pepper','garlic'],
      "mashed potatoes": ['russet potatoes','butter','milk','garlic'],
      chicken: ['chicken breast','thyme','salt','pepper'],
      salad: ['lettuce','olive oil','lemon','salt']
    }
    const key = text.toLowerCase()
    for (const k of Object.keys(map)) {
      if (key.includes(k)) return map[k]
    }
    return []
  }

  function addSuggestionsFor(text: string) {
    const sug = suggestFor(text)
    if (sug.length === 0) return alert('No suggestions found')
    const now = Date.now().toString()
    setItems(s => s.concat(sug.map((sugItem, i) => ({ id: now + i, name: sugItem, category: 'Suggested' })) ))
  }

  // fetch recipe suggestions from server proxy (optional)
  async function fetchRecipeSearch(q: string) {
    try {
      const url = `/recipe-search?query=${encodeURIComponent(q)}`
      const r = await fetch(url)
      if (!r.ok) return []
      const j = await r.json()
      return j.results || []
    } catch (e) {
      return []
    }
  }

  useEffect(() => {
    if (!newItem) { setSuggestions([]); setRecipeSuggestions([]); return }
    const local = suggestFor(newItem)
    setSuggestions(local)
    let active = true
    // try recipe search but don't block
    fetchRecipeSearch(newItem).then(rs => { if (active) setRecipeSuggestions(rs) })
    return () => { active = false }
  }, [newItem])

  useEffect(() => {
    if (!selectedRecipe) return
    // try to fetch details from server
    fetch(`/recipe-details?id=${selectedRecipe.id}`).then(r => r.json()).then(j => setRecipeDetails(j)).catch(() => setRecipeDetails(null))
  }, [selectedRecipe])

  return (
    <div className="grocery">
      <h3>Grocery List</h3>
      <div className="add-row" style={{ position: 'relative' }}>
        <input value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder="Item" />
        {(suggestions.length>0 || recipeSuggestions.length>0) && (
          <div className="suggestions">
            {suggestions.map((s, i) => <div key={'s'+i} className="suggest-item" onClick={() => { setNewItem(s); setSuggestions([]); }}>{s}</div>)}
            {recipeSuggestions.map((r:any, i:number) => (
              <div key={'r'+i} className="suggest-item recipe" onClick={() => { setSelectedRecipe(r); }}>{r.title}</div>
            ))}
          </div>
        )}
        <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" />
  <button className="btn" onClick={add}>Add</button>
  <button className="btn btn-ghost" onClick={() => addSuggestionsFor(newItem)}>Suggest</button>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
          <option value="date">By date</option>
          <option value="department">By department</option>
          <option value="recipe">By recipe</option>
        </select>
      </div>
      <ul>
        {items.map((it) => (
          <li key={it.id} className={it.bought ? 'bought' : ''}>
            <input type="checkbox" checked={!!it.bought} onChange={() => toggleBought(it.id)} />
            {it.name} <small>({it.category})</small>
          </li>
        ))}
      </ul>
      {recipeDetails && (
        <div className="recipe-detail">
          <h4>{recipeDetails.title}</h4>
          {recipeDetails.image && <img src={recipeDetails.image} style={{ maxWidth: 200 }} />}
          <div dangerouslySetInnerHTML={{ __html: recipeDetails.summary || '' }} />
          <h5>Ingredients</h5>
          <ul>
            {(recipeDetails.extendedIngredients||[]).map((ing:any)=> <li key={ing.id || ing.name}>{ing.original}</li>)}
          </ul>
          <div>
            <label>Date: <input type="date" defaultValue={new Date().toISOString().slice(0,10)} id="add-recipe-date" /></label>
            <button className="btn" onClick={() => {
              const date = (document.getElementById('add-recipe-date') as HTMLInputElement).value
              const meals = JSON.parse(localStorage.getItem('meals')||'[]')
              meals.push({ id: Date.now().toString(), date, title: recipeDetails.title, groceries: (recipeDetails.extendedIngredients||[]).map((i:any)=>i.name) })
              localStorage.setItem('meals', JSON.stringify(meals))
                // also add ingredients to grocery list and notify listeners
                const ings = (recipeDetails.extendedIngredients||[]).map((i:any, idx:number) => ({ id: Date.now().toString() + idx, name: i.name, category: 'From Recipe' }))
                setItems(s => s.concat(ings))
                // dispatch events so other components update
                window.dispatchEvent(new CustomEvent('meals-updated'))
                window.dispatchEvent(new CustomEvent('grocery-updated'))
                alert('Added recipe to meals and grocery list')
            }}>Add to Meal</button>
            <button className="btn btn-ghost" onClick={() => { setSelectedRecipe(null); setRecipeDetails(null) }}>Close</button>
          </div>
        </div>
      )}
    </div>
  )
}
