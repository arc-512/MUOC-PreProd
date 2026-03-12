import { useRef, useCallback, forwardRef, useImperativeHandle, useEffect } from 'react'
import { TILE_SIZE } from '../../hooks/useTiledCanvas'
import { getSheetTiles } from '../../store/tileStore'

export function restoreTilesFromData(sheetId, tilesData) {
  if (!tilesData || Object.keys(tilesData).length === 0) return
  const store = getSheetTiles(sheetId)
  if (Object.keys(store).length > 0) return
  Object.entries(tilesData).forEach(([key, base64]) => {
    const offscreen = document.createElement('canvas')
    offscreen.width = TILE_SIZE
    offscreen.height = TILE_SIZE
    const img = new Image()
    img.onload = () => offscreen.getContext('2d').drawImage(img, 0, 0)
    img.src = base64
    store[key] = offscreen
  })
}

export function serializeTiles(sheetId) {
  const store = getSheetTiles(sheetId)
  const result = {}
  Object.entries(store).forEach(([key, canvas]) => {
    const data = canvas.getContext('2d').getImageData(0, 0, TILE_SIZE, TILE_SIZE).data
    if (data.some(v => v !== 0)) result[key] = canvas.toDataURL()
  })
  return result
}

const TileLayer = forwardRef(({ sheetId, zoom, pan, viewportW, viewportH }, ref) => {
  const canvasRef = useRef(null)
  const zoomRef = useRef(zoom)
  const panRef = useRef(pan)
  zoomRef.current = zoom
  panRef.current = pan

  const getTile = useCallback((tx, ty) => {
    const key = `${tx}_${ty}`
    const store = getSheetTiles(sheetId)
    if (!store[key]) {
      const offscreen = document.createElement('canvas')
      offscreen.width = TILE_SIZE
      offscreen.height = TILE_SIZE
      store[key] = offscreen
    }
    return store[key]
  }, [sheetId])

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const z = zoomRef.current
    const p = panRef.current
    const w = canvas.width
    const h = canvas.height
    ctx.clearRect(0, 0, w, h)
    const store = getSheetTiles(sheetId)
    const startTX = Math.floor(-p.x / z / TILE_SIZE) - 1
    const startTY = Math.floor(-p.y / z / TILE_SIZE) - 1
    const endTX = Math.ceil((w - p.x) / z / TILE_SIZE)
    const endTY = Math.ceil((h - p.y) / z / TILE_SIZE)
    for (let tx = startTX; tx <= endTX; tx++) {
      for (let ty = startTY; ty <= endTY; ty++) {
        const offscreen = store[`${tx}_${ty}`]
        if (!offscreen) continue
        ctx.drawImage(offscreen, tx * TILE_SIZE * z + p.x, ty * TILE_SIZE * z + p.y, TILE_SIZE * z, TILE_SIZE * z)
      }
    }
  }, [sheetId])

  useEffect(() => { render() }, [sheetId, render])
  useEffect(() => { render() }, [zoom, pan, render])

  const drawStroke = useCallback((wx1, wy1, wx2, wy2, color, size, eraser) => {
    const margin = size + 2
    const startTX = Math.floor((Math.min(wx1, wx2) - margin) / TILE_SIZE)
    const endTX = Math.floor((Math.max(wx1, wx2) + margin) / TILE_SIZE)
    const startTY = Math.floor((Math.min(wy1, wy2) - margin) / TILE_SIZE)
    const endTY = Math.floor((Math.max(wy1, wy2) + margin) / TILE_SIZE)
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
    ctx.save()
    ctx.globalCompositeOperation = eraser ? 'destination-out' : 'source-over'
    ctx.fillStyle = eraser ? 'rgba(0,0,0,1)' : color
    ctx.beginPath()
    ctx.arc(wx - tx * TILE_SIZE, wy - ty * TILE_SIZE, size / 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
    render()
  }, [getTile, render])

  const undoSnapshot = useRef({})

  const saveSnapshot = useCallback((tiles) => {
    const store = getSheetTiles(sheetId)
    undoSnapshot.current = {}
    tiles.forEach(({ tx, ty }) => {
      const key = `${tx}_${ty}`
      const offscreen = store[key]
      if (offscreen) {
        const snap = document.createElement('canvas')
        snap.width = TILE_SIZE
        snap.height = TILE_SIZE
        snap.getContext('2d').drawImage(offscreen, 0, 0)
        undoSnapshot.current[key] = { snap, tx, ty }
      }
    })
  }, [sheetId])

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
    getTileData: () => getSheetTiles(sheetId),
    render,
  }), [drawStroke, drawDot, saveSnapshot, restoreSnapshot, render, sheetId])

  return (
    <canvas
      ref={canvasRef}
      width={viewportW}
      height={viewportH}
      style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
    />
  )
})

TileLayer.displayName = 'TileLayer'
export default TileLayer