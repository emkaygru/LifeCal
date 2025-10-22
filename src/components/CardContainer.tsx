import React, { useState } from 'react'

interface CardContainerProps {
  id: string
  title: string
  icon: string
  children: React.ReactNode
  initialExpanded?: boolean
  onReorder?: (draggedId: string, targetId: string) => void
  onExpandToggle?: (id: string, isExpanded: boolean) => void
  isDraggable?: boolean
  sidebarState?: 'closed' | 'narrow' | 'expanded'
  onIconClick?: () => void
}

export default function CardContainer({ 
  id, 
  title, 
  icon, 
  children, 
  initialExpanded = true,
  onReorder,
  onExpandToggle,
  isDraggable = true,
  sidebarState = 'closed',
  onIconClick
}: CardContainerProps) {
  const [isExpanded, setIsExpanded] = useState(initialExpanded)
  const [isDragging, setIsDragging] = useState(false)

  // Icon mode when sidebar is expanded
  const isIconMode = sidebarState === 'expanded'

  const handleToggle = () => {
    if (isIconMode) {
      // In icon mode, clicking calls the icon click handler
      onIconClick?.()
      return
    }
    const newExpanded = !isExpanded
    setIsExpanded(newExpanded)
    onExpandToggle?.(id, newExpanded)
  }

  const handleDragStart = (e: React.DragEvent) => {
    if (!isDraggable) return
    setIsDragging(true)
    e.dataTransfer.setData('text/plain', id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    if (!isDraggable) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent) => {
    if (!isDraggable) return
    e.preventDefault()
    const draggedId = e.dataTransfer.getData('text/plain')
    if (draggedId !== id && onReorder) {
      onReorder(draggedId, id)
    }
  }

  return (
    <div 
      className={`card-container card ${isDragging ? 'dragging' : ''} ${!isExpanded ? 'collapsed' : ''} ${isIconMode ? 'icon-mode' : ''}`}
      draggable={isDraggable && !isIconMode}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {isIconMode ? (
        // Icon Mode: Show only icon
        <div className="card-icon-display" onClick={handleToggle}>
          <span className="card-icon-large">{icon}</span>
          <span className="card-icon-title">{title}</span>
        </div>
      ) : (
        // Normal Mode: Show full card
        <>
          <div className="card-header">
            {isDraggable && (
              <div className="drag-handle">
                <div className="grip-dots">
                  <div className="dot"></div>
                  <div className="dot"></div>
                  <div className="dot"></div>
                  <div className="dot"></div>
                  <div className="dot"></div>
                  <div className="dot"></div>
                </div>
              </div>
            )}
            
            <div className="card-title">
              <span className="card-icon">{icon}</span>
              <h2>{title}</h2>
            </div>
            
            <button 
              className="expand-toggle"
              onClick={handleToggle}
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              <span className={`arrow ${isExpanded ? 'expanded' : 'collapsed'}`}>▼</span>
            </button>
          </div>
          
          {isExpanded && (
            <div className="card-content">
              {children}
            </div>
          )}
        </>
      )}
    </div>
  )
}