import React, { useEffect, useState } from 'react'
import ICAL from 'ical.js'
import { getTodos, updateTodoDate } from '../lib/store'

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
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [view, setView] = useState<'month'|'week'|'day'>('month')
  const [todosList, setTodosList] = useState<any[]>(getTodos())

  // Fetch public calendar via the server proxy to avoid CORS errors.
  useEffect(() => {
    if (!PUBLIC_ICAL_URL) return

    const base64Encode = (s: string) => {
      if (typeof window !== 'undefined' && window.btoa) return window.btoa(s)
      try { return Buffer.from(s).toString('base64') } catch (_) { return '' }
    }

    const fetchCalendar = async () => {
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
          setEvents(parsed)
        } catch (err) {
          console.error('ical parse err', err)
          setFetchError('Failed to parse calendar data')
        }
      } catch (err) {
        console.error('calendar fetch failed', err)
        setFetchError(String(err))
      }
    }

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

  return (
    <div className="calendar">
      <div className="calendar-header">
        <button onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))}>{'<'}</button>
        <h2>{selectedDate.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</h2>
        <button onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))}>{'>'}</button>
      </div>

      <div className="view-controls">
        <button onClick={() => setView('month')}>Month</button>
        <button onClick={() => setView('week')}>Week</button>
        <button onClick={() => setView('day')}>Day</button>
      </div>

      {view === 'month' && (
        <>
          <div className="weekday-headers">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d} className="weekday">{d}</div>)}
          </div>
          <div className="month-grid">
            {monthDays.map((d) => (
              <div key={d.toISOString()} className="day-cell" onClick={() => { setSelectedDate(d); onSelectDate?.(toKey(d)) }} onDrop={(e) => handleDrop(e, d)} onDragOver={allowDrop}>
                <div className="date-num">{d.getDate()}</div>
                <div className="event-preview">
                  {eventsForDay(d).slice(0, 2).map((ev) => (
                    <div key={ev.id} className="event-pill">{ev.title}</div>
                  ))}
                  {todosForDay(d).slice(0,2).map((td:any)=> (
                    <div key={td.id} className="todo-pill">{td.title}</div>
                  ))}
                  {(() => {
                    const p = percentDoneForDay(d)
                    if (p > 0) return <div className="percent-pill" style={{ background: '#f6d365' }}>{p}%</div>
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
        <div className="calendar-fetch-error" style={{ padding: 12, border: '1px solid #f2a', background: '#fff6f6', marginTop: 12 }}>
          <strong>Calendar failed to load:</strong>
          <div>{fetchError}</div>
          <p>If your calendar URL is fragile (contains characters that get encoded), try one of these options:</p>
          <ol>
            <li>POST JSON to the proxy: <code>{`POST /api/fetch-ical { "url": "https://..." }`}</code></li>
            <li>Use base64: <code>?b64=&lt;base64(url)&gt;</code> — URL-safe base64 is supported.</li>
          </ol>
          <div style={{ fontSize: 12, color: '#666' }}>
            Example:
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
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
            {todosForDay(selectedDate).length === 0 && <div>No todos</div>}
            {todosForDay(selectedDate).map((t:any)=> (
              <div key={t.id} className="todo-row">
                <input type="checkbox" checked={t.done} onChange={() => { const todos = getTodos().map((x:any)=> x.id===t.id?{...x,done:!x.done, status: (!x.done? 'done':'todo')} : x); localStorage.setItem('todos', JSON.stringify(todos)); window.dispatchEvent(new CustomEvent('todos-updated')) }} />
                <span style={{ textDecoration: t.done? 'line-through':'none' }}>{t.title}</span>
                <small>Due: {t.date|| '—'}</small>
              </div>
            ))}
          </section>

          <section className="day-meal-edit">
            <h4>Meal</h4>
            <div>
              <select defaultValue={(JSON.parse(localStorage.getItem('meals')||'[]').find((m:any)=>m.date===selectedDate.toISOString().slice(0,10))||{title:'NO MEAL'}).title} onChange={(e)=>{
                const val = e.target.value
                // apply to selected day only
                const meals = JSON.parse(localStorage.getItem('meals')||'[]')
                const idx = meals.findIndex((m:any)=>m.date===selectedDate.toISOString().slice(0,10))
                if (idx>=0) { meals[idx].title = val; } else { meals.push({ id: Date.now().toString(), date: selectedDate.toISOString().slice(0,10), title: val, groceries: [] }) }
                localStorage.setItem('meals', JSON.stringify(meals))
                window.dispatchEvent(new CustomEvent('meals-updated'))
              }}>
                <option>NO MEAL</option>
                <option>FACTOR</option>
                <option>LEFTOVERS</option>
              </select>
              <button onClick={()=>{ alert('Apply to multiple days: (not implemented)') }}>Apply to multiple days</button>
            </div>
            <div className="meal-ingredients">
              Ingredients: {(() => { const m = JSON.parse(localStorage.getItem('meals')||'[]').find((mm:any)=>mm.date===selectedDate.toISOString().slice(0,10)); return m && m.groceries ? m.groceries.join(', ') : 'None' })()}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
