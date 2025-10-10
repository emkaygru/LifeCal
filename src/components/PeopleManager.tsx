import React, { useEffect, useState } from 'react'

type Person = { id: string; name: string; color: string }

export default function PeopleManager({ onChange }: { onChange?: (people: Person[]) => void }) {
  const [people, setPeople] = useState<Person[]>(() => {
    try { return JSON.parse(localStorage.getItem('people') || '[]') } catch { return [] }
  })
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#00a2ff')

  useEffect(() => {
    localStorage.setItem('people', JSON.stringify(people))
    onChange?.(people)
  }, [people])

  function add() {
    if (!newName) return
    setPeople(p => [...p, { id: Date.now().toString(), name: newName, color: newColor }])
    setNewName('')
  }

  function remove(id: string) {
    setPeople(p => p.filter(x => x.id !== id))
  }

  return (
    <div className="people-manager">
      <h3>People</h3>
      <div className="add-row">
        <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Name" />
        <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} />
        <button onClick={add}>Add</button>
      </div>
      <ul>
        {people.map(p => (
          <li key={p.id}>
            <span style={{ background: p.color, width:12, height:12, display:'inline-block', borderRadius:6, marginRight:8 }} />
            {p.name}
            <button onClick={() => remove(p.id)} style={{ marginLeft: 8 }}>Remove</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
