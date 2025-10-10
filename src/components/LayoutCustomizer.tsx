import React, { useEffect, useState } from 'react'

export default function LayoutCustomizer({ onChangeOrder }: { onChangeOrder?: (order: string) => void }) {
  const [order, setOrder] = useState(() => localStorage.getItem('layoutOrder') || 'default')

  useEffect(() => {
    localStorage.setItem('layoutOrder', order)
    onChangeOrder?.(order)
  }, [order])

  return (
    <div className="layout-customizer">
      <h4>Layout</h4>
      <div>
        <button onClick={() => setOrder('default')}>Default</button>
        <button onClick={() => setOrder('compact')}>Compact</button>
      </div>
    </div>
  )
}
