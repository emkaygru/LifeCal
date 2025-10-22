import React, { useState } from 'react'
import CardContainer from './CardContainer'
import PuppyLog from './PuppyLog'
import TodoContainer from './TodoContainer'
import ListsContainer from './ListsContainer'
import { GrocerySuggestions, MealPlannerBuilder, SurpriseMe } from './MealPlanningSubCards'

interface EditPanelProps {
  selectedDate?: string | null
  parking?: string | null
  setParking?: (parking: string | null) => void
}

export default function EditPanel({ selectedDate, parking, setParking }: EditPanelProps) {
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({
    'meal-planning': true,
    'todos': true,
    'grocery': true,
    'maisie': true,
    'lists': true,
    'parking': true
  })

  const handleCardToggle = (cardId: string, isExpanded: boolean) => {
    setExpandedCards(prev => ({ ...prev, [cardId]: isExpanded }))
  }

  return (
    <div className="edit-panel-container">
      <div className="edit-panel-content">
        <div className="edit-panel-header">
          <h2>Edit Mode</h2>
          <p className="edit-subtitle">Create and manage your content</p>
        </div>
        
        <div className="edit-cards-container">
          {/* Meal Planning Card */}
          <CardContainer
            id="meal-planning"
            title="Meal Planning"
            icon="🍽️"
            initialExpanded={expandedCards['meal-planning']}
            onExpandToggle={handleCardToggle}
            isDraggable={false}
          >
            <div className="meal-planning-grid">
              <div className="meal-sub-card">
                <GrocerySuggestions />
              </div>
              <div className="meal-sub-card">
                <MealPlannerBuilder />
              </div>
              <div className="meal-sub-card">
                <SurpriseMe />
              </div>
            </div>
          </CardContainer>

          {/* Todos Card */}
          <CardContainer
            id="todos"
            title="Todos"
            icon="✅"
            initialExpanded={expandedCards['todos']}
            onExpandToggle={handleCardToggle}
            isDraggable={false}
          >
            <TodoContainer />
          </CardContainer>

          {/* Grocery Card */}
          <CardContainer
            id="grocery"
            title="Grocery Lists"
            icon="🛒"
            initialExpanded={expandedCards['grocery']}
            onExpandToggle={handleCardToggle}
            isDraggable={false}
          >
            <div className="grocery-edit-content">
              <div className="grocery-search">
                <input 
                  type="text" 
                  placeholder="Search grocery items..." 
                  className="grocery-search-input"
                />
                <button className="grocery-search-btn">🔍</button>
              </div>
              <div className="grocery-placeholder">
                <p>Grocery management interface coming soon</p>
              </div>
            </div>
          </CardContainer>

          {/* Maisie's Log Card */}
          <CardContainer
            id="maisie"
            title="Maisie's Log"
            icon="🐕"
            initialExpanded={expandedCards['maisie']}
            onExpandToggle={handleCardToggle}
            isDraggable={false}
          >
            <PuppyLog />
          </CardContainer>

          {/* Lists Card */}
          <CardContainer
            id="lists"
            title="Lists"
            icon="📝"
            initialExpanded={expandedCards['lists']}
            onExpandToggle={handleCardToggle}
            isDraggable={false}
          >
            <ListsContainer />
          </CardContainer>

          {/* Parking Card */}
          <CardContainer
            id="parking"
            title="Parking"
            icon="🚗"
            initialExpanded={expandedCards['parking']}
            onExpandToggle={handleCardToggle}
            isDraggable={false}
          >
            <div className="parking-toggle-content">
              <div className="parking-options">
                <button 
                  className={`parking-option ${parking === 'P2' ? 'active' : ''}`}
                  onClick={() => setParking?.(parking === 'P2' ? null : 'P2')}
                >
                  <span className="parking-icon">🅿️2️⃣</span>
                  <span className="parking-label">P2</span>
                </button>
                <button 
                  className={`parking-option ${parking === 'P3' ? 'active' : ''}`}
                  onClick={() => setParking?.(parking === 'P3' ? null : 'P3')}
                >
                  <span className="parking-icon">🅿️3️⃣</span>
                  <span className="parking-label">P3</span>
                </button>
              </div>
              <p className="parking-status">
                Currently parked: {parking || 'Not set'}
              </p>
            </div>
          </CardContainer>
        </div>
      </div>
    </div>
  )
}