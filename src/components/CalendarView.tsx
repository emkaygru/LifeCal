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
  const [dayViewPosition, setDayViewPosition] = useState<{x: number, y: number, width: number, height: number} | undefined>()
  const [mealsUpdateTrigger, setMealsUpdateTrigger] = useState<number>(0)
  const [activeMealDropdown, setActiveMealDropdown] = useState<string | null>(null)

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

        parsed.sort((a, b) => a.start.getTime() - b.start.getTime())

        // Drop events that ended before today. We only want current/new/updated events
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
    const h = () => { 
      /* trigger re-render by updating state */ 
      setEvents((e) => [...e])
      setMealsUpdateTrigger(prev => prev + 1)
    }
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

  function getMealForDay(d: Date) {
    // Force re-render when mealsUpdateTrigger changes
    const trigger = mealsUpdateTrigger
    try {
      const meals = JSON.parse(localStorage.getItem('meals')||'[]')
      return meals.find((m:any) => m.date === toKey(d))
    } catch {
      return null
    }
  }

  function saveMealForDay(date: Date, mealTitle: string) {
    const dateKey = toKey(date)
    const meals = JSON.parse(localStorage.getItem('meals') || '[]')
    const existingMealIndex = meals.findIndex((m: any) => m.date === dateKey)
    
    if (existingMealIndex >= 0) {
      meals[existingMealIndex].title = mealTitle
    } else {
      meals.push({
        id: Date.now().toString(),
        date: dateKey,
        title: mealTitle,
        groceries: []
      })
    }
    
    localStorage.setItem('meals', JSON.stringify(meals))
    setMealsUpdateTrigger(prev => prev + 1)
    window.dispatchEvent(new CustomEvent('meals-updated'))
  }

  function getMealOptions() {
    // Get base meal options (same as DayView)
    const baseMeals = [
      'No meal planned',
      'FACTOR 📦',
      'Pasta Night 🍝', 
      'Pizza 🍕',
      'Tacos 🌮',
      'Date Night 💕',
      'Takeout 🥡'
    ]
    
    // Get existing custom meals from localStorage
    try {
      const meals = JSON.parse(localStorage.getItem('meals')||'[]') as any[]
      const customTitles = Array.from(new Set(
        (meals||[])
          .map((m:any) => m.title)
          .filter((x:any) => typeof x === 'string' && x !== '' && !baseMeals.includes(x))
      )) as string[]
      
      return [...baseMeals, ...customTitles]
    } catch { 
      return baseMeals 
    }
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

  // week helpers (Sun-Sat)
  function startOfWeek(d: Date) {
    const dt = new Date(d)
    const day = dt.getDay() // 0 Sun .. 6 Sat
    dt.setDate(dt.getDate() - day) // go back to Sunday
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
            {Array.from({ length: monthStartOffset }).map((_, i) => (
              <div key={`empty-${i}`} className="day-cell empty" />
            ))}

            {monthDays.map((d) => (
              <div key={d.toISOString()} className={`day-cell ${toKey(d)===toKey(selectedDate) ? 'selected' : ''}`} onClick={() => { setSelectedDate(d); onSelectDate?.(toKey(d)) }} onDoubleClick={(e) => { 
                const rect = e.currentTarget.getBoundingClientRect()
                setDayViewPosition({
                  x: rect.left,
                  y: rect.top,
                  width: rect.width,
                  height: rect.height
                })
                setSelectedDate(d); 
                setShowDayView(true) 
              }} onDrop={(e) => handleDrop(e, d)} onDragOver={allowDrop}>
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
                <div className="day-meal">{(() => { 
                  const m = getMealForDay(d); 
                  return m ? m.title : 'NO MEAL' 
                })()}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {view === 'week' && (
        <div 
          className="week-view"
          onClick={() => setActiveMealDropdown(null)}
        >
          <div 
            className="week-container"
            onWheel={(e) => {
              // Horizontal scrolling with mouse wheel
              const container = e.currentTarget
              container.scrollLeft += e.deltaY
              e.preventDefault()
            }}
          >
            {weekDates(selectedDate).map((d, index) => {
              const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
              const isSelected = toKey(d) === toKey(selectedDate)
              
              return (
                <div 
                  key={toKey(d)} 
                  className={`week-day-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedDate(d)
                    onSelectDate?.(toKey(d))
                    
                    // Haptic feedback on mobile
                    if ('vibrate' in navigator) {
                      navigator.vibrate(50)
                    }
                  }}
                  onDoubleClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    setDayViewPosition({
                      x: rect.left,
                      y: rect.top,
                      width: rect.width,
                      height: rect.height
                    })
                    setSelectedDate(d)
                    setShowDayView(true)
                    
                    // Haptic feedback on mobile
                    if ('vibrate' in navigator) {
                      navigator.vibrate([50, 100, 50])
                    }
                  }}
                >
                  <div className="week-day-header">
                    <div className="week-day-name">{dayNames[index]}</div>
                    <div className="week-day-date">
                      <span className="month">{d.toLocaleDateString('en-US', { month: 'short' })}</span>
                      <span className="day-num">{d.getDate()}</span>
                    </div>
                  </div>
                  
                  {/* Events for this day */}
                  <div className="week-events">
                    {eventsForDay(d).slice(0, 3).map((ev) => (
                      <div key={ev.id} className={`week-event ${getEventColorClass(ev.title)}`}>
                        <div className="event-time">{ev.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        <div className="event-title">{ev.title}</div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Todos for this day */}
                  <div className="week-todos">
                    {todosForDay(d).slice(0, 4).map((todo: any) => (
                      <div key={todo.id} className="week-todo">
                        <input 
                          type="checkbox" 
                          checked={todo.done}
                          onChange={(e) => {
                            e.stopPropagation()
                            const todos = getTodos().map((x: any) => x.id === todo.id ? {...x, done: !todo.done, status: (!todo.done ? 'done' : 'todo')} : x)
                            localStorage.setItem('todos', JSON.stringify(todos))
                            setTodosList(todos)
                            window.dispatchEvent(new CustomEvent('todos-updated'))
                            
                            // Haptic feedback for todo completion
                            if ('vibrate' in navigator) {
                              navigator.vibrate(30)
                            }
                          }}
                        />
                        <span className={`todo-text ${todo.done ? 'done' : ''}`}>{todo.title}</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Meal for this day */}
                  <div className="week-meal">
                    {(() => { 
                      const m = getMealForDay(d)
                      const dateKey = toKey(d)
                      const isDropdownActive = activeMealDropdown === dateKey
                      
                      return (
                        <div className="meal-dropdown-container">
                          <button 
                            className={`meal-button ${m ? 'has-meal' : 'no-meal'}`}
                            onClick={(e) => {
                              e.stopPropagation()
                              setActiveMealDropdown(isDropdownActive ? null : dateKey)
                            }}
                          >
                            {m ? `🍽️ ${m.title}` : 'No meal planned'}
                            <span className="dropdown-arrow">{isDropdownActive ? '▲' : '▼'}</span>
                          </button>
                          
                          {isDropdownActive && (
                            <div className="meal-dropdown">
                              {getMealOptions().map((option, index) => (
                                <button
                                  key={index}
                                  className="meal-option"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (option === 'No meal planned') {
                                      // Remove meal if exists
                                      const meals = JSON.parse(localStorage.getItem('meals') || '[]')
                                      const filtered = meals.filter((meal: any) => meal.date !== dateKey)
                                      localStorage.setItem('meals', JSON.stringify(filtered))
                                      setMealsUpdateTrigger(prev => prev + 1)
                                      window.dispatchEvent(new CustomEvent('meals-updated'))
                                    } else {
                                      // Clean the option (remove emojis for storage)
                                      const cleanOption = option.replace(/\s*[\u{1F300}-\u{1F9FF}][\u{1F300}-\u{1F9FF}]?/gu, '').trim()
                                      saveMealForDay(d, cleanOption)
                                    }
                                    setActiveMealDropdown(null)
                                  }}
                                >
                                  {option}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })()}
                  </div>
                  
                  {/* Frosted glass sticker preview */}
                  <div className="week-stickers">
                    <div className="sticker-preview-frosted">
                      {/* Get actual stickers from localStorage or show placeholder */}
                      {(() => {
                        try {
                          const stickers = JSON.parse(localStorage.getItem('stickers')||'[]')
                          const dayStickers = stickers.filter((s:any) => s.date === toKey(d))
                          return dayStickers.length > 0 ? (
                            <div className="sticker-blur">
                              {dayStickers.slice(0, 3).map((s:any, i:number) => (
                                <span key={i}>{s.emoji || '✨'}</span>
                              ))}
                            </div>
                          ) : (
                            <div className="sticker-blur">🎂✨🎉</div>
                          )
                        } catch {
                          return <div className="sticker-blur">🎂✨🎉</div>
                        }
                      })()}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {view === 'day' && (
        <div className="single-day-view">
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

      {/* Enhanced Day View Modal */}
      {showDayView && (
        <DayView 
          date={selectedDate}
          events={eventsForDay(selectedDate)}
          onClose={() => setShowDayView(false)}
          initialPosition={dayViewPosition}
        />
      )}
    </div>
  )
}