import React, { useState, useEffect } from 'react'
import { savePuppyLogEntry, getPuppyStats, getRecentPuppyLogs, deletePuppyLogEntry, PuppyActivityType, PuppyLogEntry } from '../lib/puppyLog'

interface PuppyLogProps {
  onClose?: () => void
}

export default function PuppyLog({ onClose }: PuppyLogProps) {
  const [selectedType, setSelectedType] = useState<PuppyActivityType>('pee')
  const [location, setLocation] = useState('outside')
  const [amount, setAmount] = useState<'small' | 'medium' | 'large'>('medium')
  const [notes, setNotes] = useState('')
  const [recentLogs, setRecentLogs] = useState<PuppyLogEntry[]>([])
  const [stats, setStats] = useState(getPuppyStats())

  useEffect(() => {
    loadData()
    
    const handleUpdate = () => loadData()
    window.addEventListener('puppy-log-updated', handleUpdate)
    return () => window.removeEventListener('puppy-log-updated', handleUpdate)
  }, [])

  const loadData = () => {
    setRecentLogs(getRecentPuppyLogs(20))
    setStats(getPuppyStats())
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const entry = {
      type: selectedType,
      timestamp: new Date(),
      location: ['pee', 'poop'].includes(selectedType) ? location : undefined,
      amount: ['food', 'treat'].includes(selectedType) ? amount : undefined,
      notes: notes.trim() || undefined
    }
    
    savePuppyLogEntry(entry)
    setNotes('')
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(50)
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatRelativeTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    
    if (minutes < 60) {
      return `${minutes}m ago`
    } else if (hours < 24) {
      return `${hours}h ago`
    } else {
      const days = Math.floor(hours / 24)
      return `${days}d ago`
    }
  }

  const getActivityIcon = (type: PuppyActivityType) => {
    switch (type) {
      case 'pee': return '💧'
      case 'poop': return '💩'
      case 'food': return '🍽️'
      case 'treat': return '🦴'
    }
  }

  const getActivityColor = (type: PuppyActivityType) => {
    switch (type) {
      case 'pee': return '#3b82f6'
      case 'poop': return '#8b5cf6'
      case 'food': return '#10b981'
      case 'treat': return '#f59e0b'
    }
  }

  return (
    <div className="puppy-log">
      {onClose && (
        <div className="puppy-log-header">
          <h3>🐕 Maisie's Log</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
      )}

      {/* Quick Stats */}
      <div className="puppy-stats">
        <div className="stat-item">
          <span className="stat-label">Last Potty:</span>
          <span className="stat-value">
            {stats.lastPotty ? formatRelativeTime(stats.lastPotty) : 'Never'}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Last Food:</span>
          <span className="stat-value">
            {stats.lastFood ? formatRelativeTime(stats.lastFood) : 'Never'}
          </span>
        </div>
      </div>

      {/* Today's Count */}
      <div className="today-count">
        <h4>Today's Activity</h4>
        <div className="count-grid">
          <div className="count-item">
            <span className="count-icon">💧</span>
            <span className="count-number">{stats.todayCount.pee}</span>
            <span className="count-label">Pees</span>
          </div>
          <div className="count-item">
            <span className="count-icon">💩</span>
            <span className="count-number">{stats.todayCount.poop}</span>
            <span className="count-label">Poops</span>
          </div>
          <div className="count-item">
            <span className="count-icon">🍽️</span>
            <span className="count-number">{stats.todayCount.food}</span>
            <span className="count-label">Meals</span>
          </div>
          <div className="count-item">
            <span className="count-icon">🦴</span>
            <span className="count-number">{stats.todayCount.treat}</span>
            <span className="count-label">Treats</span>
          </div>
        </div>
      </div>

      {/* Log Entry Form */}
      <form onSubmit={handleSubmit} className="log-form">
        <h4>Log Activity</h4>
        
        <div className="activity-types">
          {(['pee', 'poop', 'food', 'treat'] as const).map((type) => (
            <button
              key={type}
              type="button"
              className={`activity-btn ${selectedType === type ? 'active' : ''}`}
              style={{ '--activity-color': getActivityColor(type) } as React.CSSProperties}
              onClick={() => setSelectedType(type)}
            >
              <span className="activity-icon">{getActivityIcon(type)}</span>
              <span className="activity-name">{type.charAt(0).toUpperCase() + type.slice(1)}</span>
            </button>
          ))}
        </div>

        {/* Location for potty activities */}
        {['pee', 'poop'].includes(selectedType) && (
          <div className="form-group">
            <label>Location:</label>
            <select value={location} onChange={(e) => setLocation(e.target.value)}>
              <option value="outside">Outside</option>
              <option value="backyard">Backyard</option>
              <option value="inside">Inside</option>
              <option value="walk">On Walk</option>
            </select>
          </div>
        )}

        {/* Amount for food/treats */}
        {['food', 'treat'].includes(selectedType) && (
          <div className="form-group">
            <label>Amount:</label>
            <select value={amount} onChange={(e) => setAmount(e.target.value as any)}>
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>
        )}

        <div className="form-group">
          <label>Notes:</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes..."
          />
        </div>

        <button type="submit" className="log-btn">
          Log {selectedType.charAt(0).toUpperCase() + selectedType.slice(1)}
        </button>
      </form>

      {/* Recent Activity */}
      <div className="recent-activity">
        <h4>Recent Activity</h4>
        <div className="activity-list">
          {recentLogs.slice(0, 10).map((log) => (
            <div key={log.id} className="activity-item">
              <div className="activity-main">
                <span className="activity-icon">{getActivityIcon(log.type)}</span>
                <div className="activity-details">
                  <span className="activity-type">
                    {log.type.charAt(0).toUpperCase() + log.type.slice(1)}
                    {log.location && ` - ${log.location}`}
                    {log.amount && ` (${log.amount})`}
                  </span>
                  <span className="activity-time">{formatTime(log.timestamp)}</span>
                </div>
              </div>
              {log.notes && <div className="activity-notes">{log.notes}</div>}
              <button 
                className="delete-log-btn"
                onClick={() => deletePuppyLogEntry(log.id)}
                title="Delete entry"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}