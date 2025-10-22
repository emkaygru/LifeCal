import React, { useState } from 'react'

interface LeftSidebarProps {
  parking?: string | null
}

export default function LeftSidebar({ parking }: LeftSidebarProps) {
  const [activeIcon, setActiveIcon] = useState<string | null>('calendar')

  const handleIconClick = (iconId: string) => {
    setActiveIcon(activeIcon === iconId ? null : iconId)
  }

  return (
    <aside className="left-sidebar">
      <div className="left-sidebar-icons">
        <button 
          className={`sidebar-icon ${activeIcon === 'calendar' ? 'active' : ''}`}
          onClick={() => handleIconClick('calendar')}
          title="Calendar"
        >
          📅
        </button>
        
        <button 
          className={`sidebar-icon ${activeIcon === 'todos' ? 'active' : ''}`}
          onClick={() => handleIconClick('todos')}
          title="Todos"
        >
          ✅
        </button>
        
        <button 
          className={`sidebar-icon ${activeIcon === 'lists' ? 'active' : ''}`}
          onClick={() => handleIconClick('lists')}
          title="Lists"
        >
          📝
        </button>

        {/* Parking Status Icon - shows P2 or P3 based on current parking */}
        <div className="parking-status-icon" title={`Parked: ${parking || 'None'}`}>
          {parking === 'P2' ? '🅿️2️⃣' : parking === 'P3' ? '🅿️3️⃣' : '🚗'}
        </div>
      </div>
    </aside>
  )
}