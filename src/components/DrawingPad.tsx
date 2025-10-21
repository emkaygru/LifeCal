import React, { useEffect, useRef, useState } from 'react'

interface DrawingPadProps {
  onSave?: (dataUrl: string) => void
  initialDrawing?: string
  storageKey?: string
}

export default function DrawingPad({ onSave, initialDrawing, storageKey = 'sticky-note' }: DrawingPadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [color, setColor] = useState('#000')
  const [isDrawing, setIsDrawing] = useState(false)

  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    c.width = 300
    c.height = 200
    const ctx = c.getContext('2d')!
    ctx.fillStyle = '#fff8c4'
    ctx.fillRect(0, 0, c.width, c.height)
    
    // Use initialDrawing prop or fallback to localStorage
    const saved = initialDrawing || localStorage.getItem(storageKey)
    if (saved) {
      const img = new Image()
      img.onload = () => ctx.drawImage(img, 0, 0)
      img.src = saved
    }
  }, [initialDrawing, storageKey])

  function getPos(e: MouseEvent | TouchEvent) {
    const c = canvasRef.current!
    const rect = c.getBoundingClientRect()
    if (e instanceof TouchEvent) {
      const t = e.touches[0]
      return { x: t.clientX - rect.left, y: t.clientY - rect.top }
    } else {
      return { x: (e as MouseEvent).clientX - rect.left, y: (e as MouseEvent).clientY - rect.top }
    }
  }

  function start(e: React.MouseEvent | React.TouchEvent) {
    setIsDrawing(true)
    const ev = (e.nativeEvent as unknown) as MouseEvent | TouchEvent
    const pos = getPos(ev)
    const ctx = canvasRef.current!.getContext('2d')!
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
  }

  function move(e: React.MouseEvent | React.TouchEvent) {
    if (!isDrawing) return
    const ev = (e.nativeEvent as unknown) as MouseEvent | TouchEvent
    const pos = getPos(ev)
    const ctx = canvasRef.current!.getContext('2d')!
    ctx.strokeStyle = color
    ctx.lineWidth = 3
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
  }

  function end() {
    setIsDrawing(false)
  }

  return (
    <div className="drawing-pad" style={{ maxWidth: 320 }}>
      <h3>Sticky Note</h3>
      <canvas ref={canvasRef} className="sticky-canvas" onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
        onTouchStart={start} onTouchMove={move} onTouchEnd={end} />
      <div className="controls">
        <label>Color: <input type="color" value={color} onChange={(e) => setColor(e.target.value)} /></label>
        <button className="btn" onClick={() => {
          const c = canvasRef.current!
          const data = c.toDataURL()
          localStorage.setItem(storageKey, data)
          if (onSave) {
            onSave(data)
          } else {
            alert('Saved')
          }
        }}>Save</button>
        <button className="btn btn-ghost" onClick={() => {
          const c = canvasRef.current!
          const ctx = c.getContext('2d')!
          ctx.fillStyle = '#fff8c4'
          ctx.fillRect(0, 0, c.width, c.height)
          localStorage.removeItem(storageKey)
          if (onSave) {
            onSave('')
          }
        }}>Clear</button>
      </div>
    </div>
  )
}
