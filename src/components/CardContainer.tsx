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
  onIconClick
}: CardContainerProps) {
  const [isExpanded, setIsExpanded] = useState(initialExpanded)
  const [isDragging, setIsDragging] = useState(false)

  const handleToggle = () => {
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
      className={`card-container card ${isDragging ? 'dragging' : ''} ${!isExpanded ? 'collapsed' : ''}`}
      draggable={isDraggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
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
    </div>
  )
}