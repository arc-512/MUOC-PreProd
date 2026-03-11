import { useRef, useCallback, forwardRef, useImperativeHandle, useEffect } from 'react'
import { TILE_SIZE } from '../../hooks/useTiledCanvas'

const TileLayer = forwardRef(({ zoom, pan, viewportW, viewportH }, ref) => {
  const canvasRef = useRef(null)
  const tileData = useRef({})
  const zoomRef = useRef(zoom)
  const panRef = useRef(pan)
  zoomRef.current = zoom
  panRef.current = pan

  // ── Get or create offscreen tile ─────────────────────
  const getTile = useCallback((tx, ty) => {
    const key = `${tx}_${ty}`
    if (!tileData.current[key]) {
      const offscreen = document.createElement('canvas')
      offscreen.width = TILE_SIZE
      offscreen.height = TILE_SIZE
      tileData.current[key] = offscreen
    }
    return tileData.current[key]
  }, [])

  // ── Render all tiles onto single canvas ──────────────
  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const z = zoomRef.current
    const p = panRef.current
    const w = canvas.width
    const h = canvas.height

    ctx.clearRect(0, 0, w, h)

    // Figure out which tiles are visible
    const startTX = Math.floor(-p.x / z / TILE_SIZE) - 1
    const startTY = Math.floor(-p.y / z / TILE_SIZE) - 1
    const endTX = Math.ceil((w - p.x) / z / TILE_SIZE)
    const endTY = Math.ceil((h - p.y) / z / TILE_SIZE)

    for (let tx = startTX; tx <= endTX; tx++) {
      for (let ty = startTY; ty <= endTY; ty++) {
        const key = `${tx}_${ty}`
        const offscreen = tileData.current[key]
        if (!offscreen) continue

        const screenX = tx * TILE_SIZE * z + p.x
        const screenY = ty * TILE_SIZE * z + p.y

        ctx.drawImage(offscreen, screenX, screenY, TILE_SIZE * z, TILE_SIZE * z)
      }
    }
  }, [])

  // Re-render whenever zoom or pan changes
  useEffect(() => {
    render()
  }, [zoom, pan, render])

  // ── Drawing API ──────────────────────────────────────
  const drawStroke = useCallback((wx1, wy1, wx2, wy2, color, size, eraser) => {
    const margin = size + 2
    const minX = Math.min(wx1, wx2) - margin
    const maxX = Math.max(wx1, wx2) + margin
    const minY = Math.min(wy1, wy2) - margin
    const maxY = Math.max(wy1, wy2) + margin

    const startTX = Math.floor(minX / TILE_SIZE)
    const endTX = Math.floor(maxX / TILE_SIZE)
    const startTY = Math.floor(minY / TILE_SIZE)
    const endTY = Math.floor(maxY / TILE_SIZE)

    for (let tx = startTX; tx <= endTX; tx++) {
      for (let ty = startTY; ty <= endTY; ty++) {
        const offscreen = getTile(tx, ty)
        const ctx = offscreen.getContext('2d')
        const ox = tx * TILE_SIZE
        const oy = ty * TILE_SIZE

        ctx.save()
        ctx.globalCompositeOperation = eraser ? 'destination-out' : 'source-over'
        ctx.strokeStyle = eraser ? 'rgba(0,0,0,1)' : color
        ctx.lineWidth = eraser ? size * 3 : size
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.beginPath()
        ctx.moveTo(wx1 - ox, wy1 - oy)
        ctx.lineTo(wx2 - ox, wy2 - oy)
        ctx.stroke()
        ctx.restore()
      }
    }
    render()
  }, [getTile, render])

  const drawDot = useCallback((wx, wy, color, size, eraser) => {
    const tx = Math.floor(wx / TILE_SIZE)
    const ty = Math.floor(wy / TILE_SIZE)
    const offscreen = getTile(tx, ty)
    const ctx = offscreen.getContext('2d')
    const ox = tx * TILE_SIZE
    const oy = ty * TILE_SIZE

    ctx.save()
    ctx.globalCompositeOperation = eraser ? 'destination-out' : 'source-over'
    ctx.fillStyle = eraser ? 'rgba(0,0,0,1)' : color
    ctx.beginPath()
    ctx.arc(wx - ox, wy - oy, size / 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
    render()
  }, [getTile, render])

  // ── Undo ─────────────────────────────────────────────
  const undoSnapshot = useRef({})

  const saveSnapshot = useCallback((tiles) => {
    undoSnapshot.current = {}
    tiles.forEach(({ tx, ty }) => {
      const key = `${tx}_${ty}`
      const offscreen = tileData.current[key]
      if (offscreen) {
        const snap = document.createElement('canvas')
        snap.width = TILE_SIZE
        snap.height = TILE_SIZE
        snap.getContext('2d').drawImage(offscreen, 0, 0)
        undoSnapshot.current[key] = { snap, tx, ty }
      }
    })
  }, [])

  const restoreSnapshot = useCallback(() => {
    Object.values(undoSnapshot.current).forEach(({ snap, tx, ty }) => {
      const offscreen = getTile(tx, ty)
      const ctx = offscreen.getContext('2d')
      ctx.clearRect(0, 0, TILE_SIZE, TILE_SIZE)
      ctx.drawImage(snap, 0, 0)
    })
    render()
  }, [getTile, render])

  useImperativeHandle(ref, () => ({
    drawStroke,
    drawDot,
    saveSnapshot,
    restoreSnapshot,
    getTileData: () => tileData.current,
    render,
  }), [drawStroke, drawDot, saveSnapshot, restoreSnapshot, render])

  return (
    <canvas
      ref={canvasRef}
      width={viewportW}
      height={viewportH}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
      }}
    />
  )
})

TileLayer.displayName = 'TileLayer'
export default TileLayer