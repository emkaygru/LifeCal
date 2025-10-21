import React, { useEffect, useState } from 'react'
import ICAL from 'ical.js'
import { getTodos, updateTodoDate } from '../lib/store'
import DayView from './DayView'

function toKey(d: Date) {
  return d.toISOString().slice(0, 10)
}

type EventItem = {
  id: string
  title: string
  start: Date
  end: Date
  description?: string
}

// Your public calendar (webcal). Converted webcal -> https for browser fetch.
const PUBLIC_ICAL_URL = 'https://p131-caldav.icloud.com/published/2/MjEwMDk1ODQyMjEwMDk1OAAGTcEcX0zn4rLjv-0NbqlOx5SoeTqOKOi2X9xNhJPMRqvkVBayYMk6aS3MHrIBMv8AsDzrttK6IkwycW7iXbE'

export default function CalendarView({ selectedDate: selectedKey, onSelectDate }: { selectedDate?: string | null; onSelectDate?: (k: string) => void }) {
  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [view, setView] = useState<'month'|'week'|'day'>('month')
  const [todosList, setTodosList] = useState<any[]>(getTodos())
  const [mealChoice, setMealChoice] = useState<string>('NO PLAN')
  const [multiOpen, setMultiOpen] = useState<boolean>(false)
  const [multiSelected, setMultiSelected] = useState<Record<string, boolean>>({}) // key by YYYY-MM-DD
  const [newTodoText, setNewTodoText] = useState<string>('')
  const [newTodoOwner, setNewTodoOwner] = useState<string>('Emily')
  const [showDayView, setShowDayView] = useState<boolean>(false)

  // Helper: base64 encode that works in browser & node
  const base64Encode = (s: string) => {
    if (typeof window !== 'undefined' && (window as any).btoa) return (window as any).btoa(s)
    try { return Buffer.from(s).toString('base64') } catch (_) { return '' }
  }

  // Fetch public calendar via the server proxy to avoid CORS errors.
  const fetchCalendar = async () => {
    setLoading(true)
    setFetchError(null)
    try {
      // base64 the URL and call our proxy which is same-origin
      const b64 = base64Encode(PUBLIC_ICAL_URL)
      const res = await fetch(`/api/fetch-ical?b64=${encodeURIComponent(b64)}`)
      if (!res.ok) throw new Error('Fetch failed: ' + res.status)
      const data = await res.text()

      try {
        const jcal = ICAL.parse(data)
        const comp = new ICAL.Component(jcal)
        const vevents = comp.getAllSubcomponents('vevent')
        const parsed = vevents.map((v: any) => {
          const e = new ICAL.Event(v)
          return {
            id: e.uid,
            title: e.summary || 'Event',
            start: e.startDate.toJSDate(),
            end: e.endDate.toJSDate(),
            description: e.description
          }
        })
  // sort by start date ascending
  parsed.sort((a, b) => a.start.getTime() - b.start.getTime())

  // Drop events that ended before today. We only want current/new/updated events
  // moving forward (inclusive of today).
  const todayStart = new Date()
  todayStart.setHours(0,0,0,0)
  const futureEvents = parsed.filter(ev => ev.end.getTime() >= todayStart.getTime())

  setEvents(futureEvents)
      } catch (err) {
        console.error('ical parse err', err)
        setFetchError('Failed to parse calendar data')
        setEvents([])
      }
    } catch (err) {
      console.error('calendar fetch failed', err)
      setFetchError(String(err))
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!PUBLIC_ICAL_URL) return
    fetchCalendar()
  }, [])

  // listen to todos changes (separate effect to avoid hook nesting)
  useEffect(() => {
    const h = () => setTodosList(getTodos())
    window.addEventListener('todos-updated', h)
    return () => window.removeEventListener('todos-updated', h)
  }, [])

  useEffect(() => {
    if (selectedKey) setSelectedDate(new Date(selectedKey))
  }, [selectedKey])

  // refresh when meals change elsewhere
  useEffect(() => {
    const h = () => { /* trigger re-render by updating state */ setEvents((e) => [...e]) }
    window.addEventListener('meals-updated', h)
    return () => window.removeEventListener('meals-updated', h)
  }, [])

  const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
  const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate()

  const monthDays = Array.from({ length: daysInMonth }, (_, i) => new Date(selectedDate.getFullYear(), selectedDate.getMonth(), i + 1))
  const monthStartOffset = startOfMonth.getDay() // 0=Sun..6=Sat

  function todosForDay(d: Date) {
    const key = d.toISOString().slice(0,10)
    return todosList.filter(t => t.date === key)
  }

  function handleDrop(e: React.DragEvent, d: Date) {
    const id = e.dataTransfer.getData('text/plain')
    if (!id) return
    const key = d.toISOString().slice(0,10)
    updateTodoDate(id, key)
    setTodosList(getTodos())
    e.preventDefault()
  }

  function allowDrop(e: React.DragEvent) { e.preventDefault() }

  function eventsForDay(d: Date) {
    return events.filter((ev) => ev.start.toDateString() === d.toDateString())
  }

  function percentDoneForDay(d: Date) {
    const key = toKey(d)
    try {
      const todos = JSON.parse(localStorage.getItem('todos') || '[]')
      const list = todos.filter((t: any) => t.date === key)
      if (list.length === 0) return 0
      const done = list.filter((t: any) => t.done).length
      return Math.round((done / list.length) * 100)
    } catch {
      return 0
    }
  }

  function addTodoForDay() {
    if (!newTodoText.trim()) return
    
    const newTodo = {
      id: Date.now().toString(),
      title: newTodoText.trim(),
      date: toKey(selectedDate),
      status: 'todo',
      done: false,
      owner: newTodoOwner
    }
    
    const currentTodos = getTodos()
    const updatedTodos = [...currentTodos, newTodo]
    localStorage.setItem('todos', JSON.stringify(updatedTodos))
    setTodosList(updatedTodos)
    setNewTodoText('')
    
    // Dispatch event so other components know todos updated
    window.dispatchEvent(new CustomEvent('todos-updated'))
  }

  function getEventColorClass(title: string) {
    const lower = title.toLowerCase()
    if (lower.includes('cleaning') || lower.includes('clean')) return 'event-cleaning'
    if (lower.includes('birthday') || lower.includes('party') || lower.includes('celebration')) return 'event-birthday'
    if (lower.includes('meeting') || lower.includes('call')) return 'event-meeting'
    if (lower.includes('appointment') || lower.includes('doctor')) return 'event-appointment'
    return 'event-default'
  }

  // week helpers (Mon-Sun)
  function startOfWeek(d: Date) {
    const dt = new Date(d)
    const day = dt.getDay() // 0 Sun .. 6 Sat
    const diff = (day === 0 ? -6 : 1) - day // shift so Monday is start
    dt.setDate(dt.getDate() + diff)
    dt.setHours(0,0,0,0)
    return dt
  }

  function weekDates(base: Date) {
    const start = startOfWeek(base)
    return Array.from({length:7}, (_,i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      return d
    })
  }

  // keep mealChoice in sync with selected day
  useEffect(() => {
    const key = toKey(selectedDate)
    try {
      const meals = JSON.parse(localStorage.getItem('meals')||'[]')
      const m = meals.find((mm:any)=>mm.date===key)
      setMealChoice((m && m.title) ? m.title : 'NO PLAN')
    } catch { setMealChoice('NO PLAN') }
  }, [selectedDate])

  const availableMealTitles: string[] = (() => {
    try {
      const meals = JSON.parse(localStorage.getItem('meals')||'[]') as any[]
      const titles = Array.from(new Set((meals||[]).map((m:any)=>m.title).filter((x:any)=>typeof x === 'string'))) as string[]
      return ['NO PLAN','FACTOR', ...titles.filter(t => t !== 'NO PLAN' && t !== 'FACTOR')]
    } catch { return ['NO PLAN','FACTOR'] }
  })()

  return (
    <div className="calendar card">
      <div className="calendar-top">
        <div className="upcoming-count">
          Upcoming: {events.length === 0 ? '—' : `${events.length} events`}
        </div>
        <div className="calendar-actions">
          <button className="btn" onClick={() => fetchCalendar()} disabled={loading}>{loading ? 'Refreshing...' : 'Refresh'}</button>
        </div>
      </div>

      {/* upfront compact upcoming list removed — details shown when a date is clicked */}
      <div className="calendar-header">
        <button className="btn" onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))}>{'<'}</button>
        <h2>{selectedDate.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</h2>
        <button className="btn" onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))}>{'>'}</button>
      </div>

      <div className="view-controls">
        <button className={`btn ${view==='month'?'active':''}`} onClick={() => setView('month')}>Month</button>
        <button className={`btn ${view==='week'?'active':''}`} onClick={() => setView('week')}>Week</button>
        <button className={`btn ${view==='day'?'active':''}`} onClick={() => setView('day')}>Day</button>
      </div>

      {view === 'month' && (
        <>
          <div className="weekday-headers">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d} className="weekday">{d}</div>)}
          </div>
          <div className="month-grid">
            {/** Render leading empty cells so the 1st lines up with the correct weekday */}
            {Array.from({ length: monthStartOffset }).map((_, i) => (
              <div key={`empty-${i}`} className="day-cell empty" />
            ))}

            {monthDays.map((d) => (
              <div key={d.toISOString()} className={`day-cell ${toKey(d)===toKey(selectedDate) ? 'selected' : ''}`} onClick={() => { setSelectedDate(d); onSelectDate?.(toKey(d)) }} onDoubleClick={() => { setSelectedDate(d); setShowDayView(true) }} onDrop={(e) => handleDrop(e, d)} onDragOver={allowDrop}>
                <div className="date-num">{d.getDate()}</div>
                <div className="event-preview">
                  {eventsForDay(d).slice(0, 2).map((ev) => (
                    <div key={ev.id} className={`event-pill ${getEventColorClass(ev.title)}`}>{ev.title}</div>
                  ))}
                  {todosForDay(d).slice(0,2).map((td:any)=> (
                    <div key={td.id} className="todo-pill">{td.title}</div>
                  ))}
                  {(() => {
                    const p = percentDoneForDay(d)
                    if (p > 0) return <div className="percent-pill">{p}%</div>
                    return null
                  })()}
                </div>
                <div className="day-meal">{(() => { const m = JSON.parse(localStorage.getItem('meals')||'[]').find((mm:any)=>mm.date===toKey(d)); return m ? m.title : 'NO MEAL' })()}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {fetchError && (
        <div className="calendar-fetch-error">
          <strong>Calendar failed to load:</strong>
          <div>{fetchError}</div>
          <p>If your calendar URL is fragile (contains characters that get encoded), try one of these options:</p>
          <ol>
            <li>POST JSON to the proxy: <code>{`POST /api/fetch-ical { "url": "https://..." }`}</code></li>
            <li>Use base64: <code>?b64=&lt;base64(url)&gt;</code> — URL-safe base64 is supported.</li>
          </ol>
          <div className="helper-note">
            Example:
            <pre>
              {`curl -X POST 'https://your-deploy.example.com/api/fetch-ical' \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://.../public.ics"}'`}
            </pre>
          </div>
        </div>
      )}

      <div className="day-view">
        <h3>Day: {selectedDate.toDateString()}</h3>
        <div className="day-detail">
          <section className="day-events">
            <h4>Appointments</h4>
            {eventsForDay(selectedDate).length === 0 && <div>No appointments</div>}
            {eventsForDay(selectedDate).map((ev) => (
              <div key={ev.id} className="event-row">
                <strong>{ev.title}</strong>
                <div className="time">{ev.start.toLocaleTimeString()} - {ev.end.toLocaleTimeString()}</div>
                <div className="desc">{ev.description}</div>
              </div>
            ))}
          </section>

          <section className="day-todos">
            <h4>To-dos</h4>
            
            <div className="add-todo-inline">
              <input 
                type="text" 
                placeholder="Add todo for this day..." 
                value={newTodoText}
                onChange={(e) => setNewTodoText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addTodoForDay()
                  }
                }}
              />
              <select value={newTodoOwner} onChange={(e) => setNewTodoOwner(e.target.value)}>
                <option value="Emily">Em</option>
                <option value="Steph">Steph</option>
                <option value="Maisie">Maisie</option>
              </select>
              <button className="btn" onClick={addTodoForDay} disabled={!newTodoText.trim()}>
                Add
              </button>
            </div>

            {todosForDay(selectedDate).length === 0 && <div>No todos</div>}
            {todosForDay(selectedDate).map((t:any)=> (
              <div key={t.id} className="todo-row">
                <input type="checkbox" checked={t.done} onChange={() => { const todos = getTodos().map((x:any)=> x.id===t.id?{...x,done:!x.done, status: (!x.done? 'done':'todo')} : x); localStorage.setItem('todos', JSON.stringify(todos)); window.dispatchEvent(new CustomEvent('todos-updated')) }} />
                <span className={`todo-title ${t.done? 'done':''}`}>{t.title}</span>
                <small>Due: {t.date|| '—'}</small>
              </div>
            ))}
          </section>

          <section className="day-meal-edit">
            <h4>Meal</h4>
            <div className="meal-controls">
              <select value={mealChoice} onChange={(e)=>{
                const val = e.target.value
                setMealChoice(val)
                // apply to selected day only
                const meals = JSON.parse(localStorage.getItem('meals')||'[]')
                const key = selectedDate.toISOString().slice(0,10)
                const idx = meals.findIndex((m:any)=>m.date===key)
                if (idx>=0) { meals[idx].title = val; } else { meals.push({ id: Date.now().toString(), date: key, title: val, groceries: [] }) }
                localStorage.setItem('meals', JSON.stringify(meals))
                window.dispatchEvent(new CustomEvent('meals-updated'))
              }}>
                {availableMealTitles.map((t: string) => <option key={t} value={t}>{t}</option>)}
              </select>
              <button className="btn btn-ghost" onClick={() => {
                if (!multiOpen) {
                  // open panel and preselect current day
                  const key = toKey(selectedDate)
                  setMultiSelected({ [key]: true })
                  setMultiOpen(true)
                } else {
                  // confirm apply to selected days, then close
                  const meals = JSON.parse(localStorage.getItem('meals')||'[]')
                  const keys = Object.keys(multiSelected).filter(k => multiSelected[k])
                  const now = Date.now().toString()
                  keys.forEach((k, i) => {
                    const idx = meals.findIndex((m:any)=>m.date===k)
                    if (idx>=0) { meals[idx].title = mealChoice } else { meals.push({ id: now + i, date: k, title: mealChoice, groceries: [] }) }
                  })
                  localStorage.setItem('meals', JSON.stringify(meals))
                  window.dispatchEvent(new CustomEvent('meals-updated'))
                  setMultiOpen(false)
                }
              }}>{multiOpen ? 'Confirm apply' : 'Apply to multiple days'}</button>
            </div>
            {multiOpen && (
              <div className="multi-apply-panel">
                <div className="select-all">
                  <label><input type="checkbox" checked={weekDates(selectedDate).every(d => multiSelected[toKey(d)])} onChange={(e)=>{
                    const checked = e.currentTarget.checked
                    const obj: Record<string,boolean> = {}
                    weekDates(selectedDate).forEach(d => obj[toKey(d)] = checked)
                    setMultiSelected(obj)
                  }} /> Select all (this week)</label>
                </div>
                <div className="week-checkboxes">
                  {weekDates(selectedDate).map((d, idx) => (
                    <label key={toKey(d)} className="week-day">
                      <input type="checkbox" checked={!!multiSelected[toKey(d)]} onChange={(e)=>{
                        const key = toKey(d)
                        setMultiSelected(s => ({ ...s, [key]: e.currentTarget.checked }))
                      }} />
                      <span className="wd-name">{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][idx]}</span>
                      <span className="wd-date">{d.getMonth()+1}/{d.getDate()}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            <div className="meal-ingredients">
              Ingredients: {(() => { const m = JSON.parse(localStorage.getItem('meals')||'[]').find((mm:any)=>mm.date===selectedDate.toISOString().slice(0,10)); return m && m.groceries ? m.groceries.join(', ') : 'None' })()}
            </div>
          </section>
        </div>
      </div>

      {/* Person Columns Layout */}
      <div className="person-columns">
        <div className="person-column">
          <h4>Em</h4>
          <div className="person-todos">
            <h5>To-dos</h5>
            {todosList.filter((t: any) => t.owner === 'Emily' || t.owner === 'Em').map((t: any) => (
              <div key={t.id} className="person-todo-item">
                <input type="checkbox" checked={t.done} onChange={() => {
                  const todos = getTodos().map((x: any) => x.id === t.id ? {...x, done: !x.done, status: (!x.done ? 'done' : 'todo')} : x)
                  localStorage.setItem('todos', JSON.stringify(todos))
                  setTodosList(todos)
                  window.dispatchEvent(new CustomEvent('todos-updated'))
                }} />
                <span className={`todo-title ${t.done ? 'done' : ''}`}>{t.title}</span>
                <small>{t.date}</small>
              </div>
            ))}
          </div>
        </div>

        <div className="person-column">
          <h4>Steph</h4>
          <div className="person-todos">
            <h5>To-dos</h5>
            {todosList.filter((t: any) => t.owner === 'Steph').map((t: any) => (
              <div key={t.id} className="person-todo-item">
                <input type="checkbox" checked={t.done} onChange={() => {
                  const todos = getTodos().map((x: any) => x.id === t.id ? {...x, done: !x.done, status: (!x.done ? 'done' : 'todo')} : x)
                  localStorage.setItem('todos', JSON.stringify(todos))
                  setTodosList(todos)
                  window.dispatchEvent(new CustomEvent('todos-updated'))
                }} />
                <span className={`todo-title ${t.done ? 'done' : ''}`}>{t.title}</span>
                <small>{t.date}</small>
              </div>
            ))}
          </div>
        </div>

        <div className="person-column">
          <h4>Maisie</h4>
          <div className="person-todos">
            <h5>To-dos</h5>
            {todosList.filter((t: any) => t.owner === 'Maisie').map((t: any) => (
              <div key={t.id} className="person-todo-item">
                <input type="checkbox" checked={t.done} onChange={() => {
                  const todos = getTodos().map((x: any) => x.id === t.id ? {...x, done: !x.done, status: (!x.done ? 'done' : 'todo')} : x)
                  localStorage.setItem('todos', JSON.stringify(todos))
                  setTodosList(todos)
                  window.dispatchEvent(new CustomEvent('todos-updated'))
                }} />
                <span className={`todo-title ${t.done ? 'done' : ''}`}>{t.title}</span>
                <small>{t.date}</small>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Enhanced Day View Modal */}
      {showDayView && (
        <DayView 
          date={selectedDate} 
          onClose={() => setShowDayView(false)} 
        />
      )}
    </div>
  )
}
