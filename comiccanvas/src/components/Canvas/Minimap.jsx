import { useEffect, useRef } from 'react'

export default function Minimap({ pan, zoom, viewportW, viewportH }) {
  const canvasRef = useRef(null)
  const MINIMAP_W = 160
  const MINIMAP_H = 100
  const WORLD_W = 4000
  const WORLD_H = 3000

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    // Clear
    ctx.clearRect(0, 0, MINIMAP_W, MINIMAP_H)

    // Background
    ctx.fillStyle = 'rgba(0,0,0,0.6)'
    ctx.roundRect(0, 0, MINIMAP_W, MINIMAP_H, 6)
    ctx.fill()

    // Scale factors
    const scaleX = MINIMAP_W / WORLD_W
    const scaleY = MINIMAP_H / WORLD_H

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'
    ctx.lineWidth = 0.5
    for (let x = 0; x < WORLD_W; x += 512) {
      ctx.beginPath()
      ctx.moveTo(x * scaleX, 0)
      ctx.lineTo(x * scaleX, MINIMAP_H)
      ctx.stroke()
    }
    for (let y = 0; y < WORLD_H; y += 512) {
      ctx.beginPath()
      ctx.moveTo(0, y * scaleY)
      ctx.lineTo(MINIMAP_W, y * scaleY)
      ctx.stroke()
    }

    // Viewport rectangle
    const vpX = (-pan.x / zoom) * scaleX
    const vpY = (-pan.y / zoom) * scaleY
    const vpW = (viewportW / zoom) * scaleX
    const vpH = (viewportH / zoom) * scaleY

    // Viewport fill
    ctx.fillStyle = 'rgba(232, 70, 42, 0.15)'
    ctx.fillRect(vpX, vpY, vpW, vpH)

    // Viewport border
    ctx.strokeStyle = 'rgba(232, 70, 42, 0.8)'
    ctx.lineWidth = 1.5
    ctx.strokeRect(vpX, vpY, vpW, vpH)

  }, [pan, zoom, viewportW, viewportH])

  return (
    <div style={{
      position: 'absolute',
      bottom: 16,
      right: 16,
      borderRadius: 8,
      overflow: 'hidden',
      boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
      border: '1px solid rgba(255,255,255,0.1)',
      zIndex: 50,
    }}>
      <canvas
        ref={canvasRef}
        width={MINIMAP_W}
        height={MINIMAP_H}
        style={{ display: 'block' }}
      />
      <div style={{
        position: 'absolute',
        top: 4,
        left: 6,
        fontSize: 9,
        color: 'rgba(255,255,255,0.4)',
        fontFamily: 'var(--font-display)',
        letterSpacing: '0.05em',
        pointerEvents: 'none',
      }}>
        MINIMAP
      </div>
    </div>
  )
}