import React, { useState } from 'react'
import CalendarView from './components/CalendarView'
import TodoAccordion from './components/TodoAccordion'
import DrawingPad from './components/DrawingPad'
import GroceryList from './components/GroceryList'
import MealPlanner from './components/MealPlanner'
import PeopleManager from './components/PeopleManager'
import LayoutCustomizer from './components/LayoutCustomizer'

export default function App() {
  const [layout, setLayout] = useState('default')
  const [selectedDate, setSelectedDate] = useState<string | null>(null) // format YYYY-MM-DD
  const [theme, setTheme] = useState<'dark'|'light'>(() => (localStorage.getItem('theme') as any) || 'dark')
  const [user, setUser] = useState<string>(() => localStorage.getItem('user') || 'Emily')

  function handleSelectDate(dateKey: string) {
    setSelectedDate(dateKey)
  }

  return (
    <div className="app">
      <header className="topbar">
        <h1>LifeCal</h1>
        <div className="layout-controls">
          <label>
            Layout:
            <select value={layout} onChange={(e) => setLayout(e.target.value)}>
              <option value="default">Default</option>
              <option value="compact">Compact</option>
            </select>
          </label>
          <label>
            Theme:
            <select value={theme} onChange={(e)=>{ const v = e.target.value as any; setTheme(v); localStorage.setItem('theme', v); document.documentElement.setAttribute('data-theme', v) }}>
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </label>
          <label>
            User:
            <select value={user} onChange={(e)=>{ setUser(e.target.value); localStorage.setItem('user', e.target.value) }}>
              <option>Emily</option>
              <option>Steph</option>
            </select>
          </label>
        </div>
      </header>

      <main className="dashboard">
        <section className="calendar-col">
          <CalendarView selectedDate={selectedDate} onSelectDate={handleSelectDate} />
        </section>

        <aside className="side-col">
          <LayoutCustomizer onChangeOrder={(order) => setLayout(order)} />
          <PeopleManager />
          <MealPlanner selectedDate={selectedDate} />
          <TodoAccordion selectedDate={selectedDate} />
          <GroceryList />
          <DrawingPad />
        </aside>
      </main>
    </div>
  )
}

