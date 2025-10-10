import React, { useEffect, useRef, useState } from 'react'

export default function DrawingPad() {
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
    const saved = localStorage.getItem('sticky-note')
    if (saved) {
      const img = new Image()
      img.onload = () => ctx.drawImage(img, 0, 0)
      img.src = saved
    }
  }, [])

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
      <canvas ref={canvasRef} onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
        onTouchStart={start} onTouchMove={move} onTouchEnd={end} style={{ borderRadius: 6, touchAction: 'none', width: '100%' }} />
      <div className="controls">
        <label>Color: <input type="color" value={color} onChange={(e) => setColor(e.target.value)} /></label>
        <button onClick={() => {
          const c = canvasRef.current!
          const data = c.toDataURL()
          localStorage.setItem('sticky-note', data)
          alert('Saved')
        }}>Save</button>
        <button onClick={() => {
          const c = canvasRef.current!
          const ctx = c.getContext('2d')!
          ctx.fillStyle = '#fff8c4'
          ctx.fillRect(0, 0, c.width, c.height)
          localStorage.removeItem('sticky-note')
        }}>Clear</button>
      </div>
    </div>
  )
}
