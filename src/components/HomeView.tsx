import React, { useState } from 'react'
import CardContainer from './CardContainer'
import CalendarView from './CalendarView'
import TodoContainer from './TodoContainer'
import ListsContainer from './ListsContainer'

interface HomeViewProps {
  selectedDate?: string | null
  onSelectDate?: (k: string) => void
  parking?: string
  setParking?: (parking: string) => void
}

interface CardOrder {
  id: string
  title: string
  icon: string
  component: React.ComponentType<any>
  props?: any
}

export default function HomeView({ selectedDate, onSelectDate, parking, setParking }: HomeViewProps) {
  const [cardOrder, setCardOrder] = useState<CardOrder[]>([
    {
      id: 'calendar',
      title: 'Calendar',
      icon: '📅',
      component: CalendarView,
      props: { selectedDate, onSelectDate, parking, setParking }
    },
    {
      id: 'todos',
      title: 'To-Dos',
      icon: '✅',
      component: TodoContainer,
      props: {}
    },
    {
      id: 'lists',
      title: 'Lists',
      icon: '📝',
      component: ListsContainer,
      props: {}
    }
  ])

  const [cardStates, setCardStates] = useState<Record<string, boolean>>({
    calendar: true,
    todos: true,
    lists: true
  })

  const handleReorder = (draggedId: string, targetId: string) => {
    const draggedIndex = cardOrder.findIndex(card => card.id === draggedId)
    const targetIndex = cardOrder.findIndex(card => card.id === targetId)
    
    if (draggedIndex === -1 || targetIndex === -1) return
    
    const newOrder = [...cardOrder]
    const [draggedCard] = newOrder.splice(draggedIndex, 1)
    newOrder.splice(targetIndex, 0, draggedCard)
    
    setCardOrder(newOrder)
    
    // Save order to localStorage
    const orderIds = newOrder.map(card => card.id)
    localStorage.setItem('cardOrder', JSON.stringify(orderIds))
  }

  const handleCardToggle = (cardId: string, isExpanded: boolean) => {
    setCardStates(prev => ({
      ...prev,
      [cardId]: isExpanded
    }))
    
    // Save states to localStorage
    localStorage.setItem('cardStates', JSON.stringify({
      ...cardStates,
      [cardId]: isExpanded
    }))
  }

  const handleIconClick = () => {
    // Icon click functionality can be implemented later if needed
    console.log('Card icon clicked')
  }

  // Load saved order and states on mount
  React.useEffect(() => {
    const savedOrder = localStorage.getItem('cardOrder')
    const savedStates = localStorage.getItem('cardStates')
    
    if (savedOrder) {
      try {
        const orderIds = JSON.parse(savedOrder)
        const reorderedCards = orderIds.map((id: string) => 
          cardOrder.find(card => card.id === id)
        ).filter(Boolean)
        
        // Add any new cards that weren't in saved order
        const existingIds = reorderedCards.map(card => card.id)
        const newCards = cardOrder.filter(card => !existingIds.includes(card.id))
        
        setCardOrder([...reorderedCards, ...newCards])
      } catch (error) {
        console.error('Failed to load card order:', error)
      }
    }
    
    if (savedStates) {
      try {
        setCardStates(JSON.parse(savedStates))
      } catch (error) {
        console.error('Failed to load card states:', error)
      }
    }
  }, [])

  return (
    <div className="home-view">
      <div className="cards-container">
        {cardOrder.map(card => {
          const Component = card.component
          const isExpanded = cardStates[card.id] ?? true
          
          return (
            <CardContainer
              key={card.id}
              id={card.id}
              title={card.title}
              icon={card.icon}
              initialExpanded={isExpanded}
              onReorder={handleReorder}
              onExpandToggle={handleCardToggle}
              isDraggable={true}
              onIconClick={handleIconClick}
            >
              <Component {...card.props} />
            </CardContainer>
          )
        })}
      </div>
    </div>
  )
}