// Puppy Log System for Maisie
export type PuppyActivityType = 'pee' | 'poop' | 'food' | 'treat'

export interface PuppyLogEntry {
  id: string
  timestamp: Date
  types: PuppyActivityType[] // Changed from 'type' to 'types' for multiple activities
  notes?: string
  location?: string // inside, outside, on walk, on turf
  amount?: 'small' | 'medium' | 'large' // for food/treats
}

export interface PuppyStats {
  lastPotty: Date | null
  lastFood: Date | null
  todayCount: {
    pee: number
    poop: number
    food: number
    treat: number
  }
}

const STORAGE_KEY = 'maisie-puppy-log'

export function savePuppyLogEntry(entry: Omit<PuppyLogEntry, 'id'>): PuppyLogEntry {
  const logs = getPuppyLogs()
  const newEntry: PuppyLogEntry = {
    ...entry,
    id: Date.now().toString(),
    timestamp: new Date(entry.timestamp)
  }
  
  logs.push(newEntry)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs))
  
  // Trigger update event
  window.dispatchEvent(new CustomEvent('puppy-log-updated', {
    detail: newEntry
  }))
  
  return newEntry
}

export function getPuppyLogs(): PuppyLogEntry[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return []
    
    const parsed = JSON.parse(saved)
    return parsed.map((entry: any) => ({
      ...entry,
      timestamp: new Date(entry.timestamp)
    }))
  } catch (error) {
    console.error('Failed to load puppy logs:', error)
    return []
  }
}

export function getPuppyStats(): PuppyStats {
  const logs = getPuppyLogs()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const todayLogs = logs.filter(log => log.timestamp >= today)
  
  // Find last potty (pee or poop)
  const pottyLogs = logs.filter(log => log.types.includes('pee') || log.types.includes('poop'))
  const lastPotty = pottyLogs.length > 0 
    ? pottyLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0].timestamp
    : null
  
  // Find last food
  const foodLogs = logs.filter(log => log.types.includes('food'))
  const lastFood = foodLogs.length > 0
    ? foodLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0].timestamp
    : null
  
  // Count today's activities
  const todayCount = {
    pee: todayLogs.filter(log => log.types.includes('pee')).length,
    poop: todayLogs.filter(log => log.types.includes('poop')).length,
    food: todayLogs.filter(log => log.types.includes('food')).length,
    treat: todayLogs.filter(log => log.types.includes('treat')).length
  }
  
  return {
    lastPotty,
    lastFood,
    todayCount
  }
}

export function getRecentPuppyLogs(limit: number = 10): PuppyLogEntry[] {
  const logs = getPuppyLogs()
  return logs
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit)
}

export function updatePuppyLogEntry(id: string, updates: Partial<Omit<PuppyLogEntry, 'id'>>): void {
  const logs = getPuppyLogs()
  const index = logs.findIndex(log => log.id === id)
  
  if (index !== -1) {
    logs[index] = { 
      ...logs[index], 
      ...updates,
      timestamp: updates.timestamp ? new Date(updates.timestamp) : logs[index].timestamp
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs))
    
    window.dispatchEvent(new CustomEvent('puppy-log-updated'))
  }
}

export function deletePuppyLogEntry(id: string): void {
  const logs = getPuppyLogs()
  const filtered = logs.filter(log => log.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  
  window.dispatchEvent(new CustomEvent('puppy-log-updated'))
}

export function getPuppyLogsForDate(date: Date): PuppyLogEntry[] {
  const logs = getPuppyLogs()
  const targetDate = new Date(date)
  targetDate.setHours(0, 0, 0, 0)
  const nextDay = new Date(targetDate)
  nextDay.setDate(nextDay.getDate() + 1)
  
  return logs.filter(log => {
    const logDate = new Date(log.timestamp)
    return logDate >= targetDate && logDate < nextDay
  })
}

export function getDayPottyCount(date: Date): { pee: number, poop: number } {
  const dayLogs = getPuppyLogsForDate(date)
  return {
    pee: dayLogs.filter(log => log.types.includes('pee')).length,
    poop: dayLogs.filter(log => log.types.includes('poop')).length
  }
}