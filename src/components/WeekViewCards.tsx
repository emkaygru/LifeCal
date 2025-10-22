import React, { useState } from 'react'

interface EventItem {
  id: string
  title: string
  start: Date
  end: Date
  description?: string
}

interface WeekViewCardsProps {
  selectedDate: Date
  onSelectDate?: (key: string) => void
  onDoubleClick?: (date: Date, position: {x: number, y: number, width: number, height: number}) => void
  events: EventItem[]
  todos: any[]
}

function toKey(d: Date) {
  return d.toISOString().slice(0, 10)
}

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

// Check if a day has notes or drawings for preview
function hasNotes(date: Date) {
  const dateKey = toKey(date)
  const savedStickers = localStorage.getItem(`stickers-${dateKey}`)
  const savedDrawing = localStorage.getItem(`drawing-${dateKey}`)
  
  const hasStickers = savedStickers && JSON.parse(savedStickers).length > 0
  const hasDrawing = savedDrawing && savedDrawing.length > 0
  
  return hasStickers || hasDrawing
}

function eventsForDay(date: Date, events: EventItem[]) {
  const targetDate = toKey(date)
  return events.filter(ev => toKey(ev.start) === targetDate)
}

function todosForDay(date: Date, todos: any[]) {
  const targetDate = toKey(date)
  return todos.filter((t: any) => t.date === targetDate)
}

function getMealForDay(date: Date) {
  try {
    const meals = JSON.parse(localStorage.getItem('meals') || '[]')
    return meals.find((m: any) => m.date === toKey(date))
  } catch {
    return null
  }
}

export default function WeekViewCards({ selectedDate, onSelectDate, onDoubleClick, events, todos }: WeekViewCardsProps) {
  const [weekViewIndex, setWeekViewIndex] = useState(3) // Start with middle day for mobile
  
  return (
    <div className="week-view-modern">
      <div className="week-cards-container">
        {weekDates(selectedDate).map((d, index) => {
          const isToday = toKey(d) === toKey(new Date())
          const isSelected = toKey(d) === toKey(selectedDate)
          const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][index]
          const hasNotesContent = hasNotes(d)
          const dayEvents = eventsForDay(d, events)
          const dayTodos = todosForDay(d, todos)
          
          return (
            <div 
              key={toKey(d)} 
              className={`week-card ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
              data-index={index}
              onClick={() => {
                setWeekViewIndex(index)
                onSelectDate?.(toKey(d))
              }}
              onDoubleClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                onDoubleClick?.(d, {
                  x: rect.left,
                  y: rect.top,
                  width: rect.width,
                  height: rect.height
                })
              }}
            >
              {/* Card Header */}
              <div className="week-card-header">
                <div className="day-number">{d.getDate()}</div>
                <div className="day-name">{dayName}</div>
              </div>
              
              {/* Events Badge */}
              {dayEvents.length > 0 && (
                <div className="content-badge events-badge">
                  Events ({dayEvents.length})
                </div>
              )}
              
              {/* Todos Badge */}
              {dayTodos.length > 0 && (
                <div className="content-badge todos-badge">
                  Todos ({dayTodos.length})
                </div>
              )}
              
              {/* Notes Preview Area */}
              <div className="notes-preview-area">
                {hasNotesContent ? (
                  <div className="notes-preview">
                    <div className="frosted-overlay">
                      <div className="preview-icon">📝</div>
                      <div className="preview-text">Notes</div>
                    </div>
                  </div>
                ) : (
                  <div className="empty-notes">
                    <div className="empty-icon">✏️</div>
                  </div>
                )}
              </div>
              
              {/* Meal Plan */}
              <div className="week-meal-plan">
                {(() => { 
                  const m = getMealForDay(d)
                  return m ? m.title : 'Meal plan'
                })()}
              </div>
            </div>
          )
        })}
      </div>
      
      {/* Mobile Navigation Dots */}
      <div className="week-navigation mobile-only">
        {weekDates(selectedDate).map((_, index) => (
          <button
            key={index}
            className={`nav-dot ${index === weekViewIndex ? 'active' : ''}`}
            onClick={() => {
              setWeekViewIndex(index)
              const targetDate = weekDates(selectedDate)[index]
              onSelectDate?.(toKey(targetDate))
            }}
          />
        ))}
      </div>
    </div>
  )
}