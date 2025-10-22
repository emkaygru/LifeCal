// Puppy Log System for Maisie
export type PuppyActivityType = 'pee' | 'poop' | 'food' | 'treat'

export interface PuppyLogEntry {
  id: string
  timestamp: Date
  type: PuppyActivityType
  notes?: string
  location?: string // inside, outside, backyard, etc.
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
  const pottyLogs = logs.filter(log => log.type === 'pee' || log.type === 'poop')
  const lastPotty = pottyLogs.length > 0 
    ? pottyLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0].timestamp
    : null
  
  // Find last food
  const foodLogs = logs.filter(log => log.type === 'food')
  const lastFood = foodLogs.length > 0
    ? foodLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0].timestamp
    : null
  
  // Count today's activities
  const todayCount = {
    pee: todayLogs.filter(log => log.type === 'pee').length,
    poop: todayLogs.filter(log => log.type === 'poop').length,
    food: todayLogs.filter(log => log.type === 'food').length,
    treat: todayLogs.filter(log => log.type === 'treat').length
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

export function deletePuppyLogEntry(id: string): void {
  const logs = getPuppyLogs()
  const filtered = logs.filter(log => log.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  
  window.dispatchEvent(new CustomEvent('puppy-log-updated'))
}