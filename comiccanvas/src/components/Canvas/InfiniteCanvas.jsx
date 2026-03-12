import { useEffect, useRef, useState, useCallback } from 'react'
import TileLayer, { restoreTilesFromData, serializeTiles } from './TileLayer'
import ObjectLayer from './ObjectLayer'
import useStore from '../../store'
import { TILE_SIZE } from '../../hooks/useTiledCanvas'

const MIN_ZOOM = 0.2
const MAX_ZOOM = 10

export default function InfiniteCanvas({ sheet }) {
  const containerRef = useRef(null)
  const tileLayerRef = useRef(null)
  const [viewportSize, setViewportSize] = useState({ w: 800, h: 600 })
  const [zoom, setZoom] = useState(MIN_ZOOM)
  const [pan, setPan] = useState({ x: 0, y: 0 })

  const zoomRef = useRef(MIN_ZOOM)
  const panRef = useRef({ x: 0, y: 0 })
  const viewportRef = useRef({ w: 800, h: 600 })

  const activeTool = useStore(s => s.activeTool)
  const brushColor = useStore(s => s.brushColor)
  const brushSize = useStore(s => s.brushSize)
  const saveBrainstormTiles = useStore(s => s.saveBrainstormTiles)
  const activeToolRef = useRef(activeTool)
  const brushColorRef = useRef(brushColor)
  const brushSizeRef = useRef(brushSize)
  activeToolRef.current = activeTool
  brushColorRef.current = brushColor
  brushSizeRef.current = brushSize

  const isPanning = useRef(false)
  const lastPanPos = useRef({ x: 0, y: 0 })
  const isDrawing = useRef(false)
  const lastWorldPos = useRef(null)
  const undoStack = useRef([])

  // Restore tiles from GitHub-loaded data when sheet first mounts
  useEffect(() => {
    if (sheet.brainstormTiles) {
      restoreTilesFromData(sheet.id, sheet.brainstormTiles)
      // Trigger render after tiles are restored
      setTimeout(() => tileLayerRef.current?.render(), 100)
    }
  }, [sheet.id, sheet.brainstormTiles])

  // Save tiles to store on unmount so GitHub save picks them up
  useEffect(() => {
    return () => {
      const tiles = serializeTiles(sheet.id)
      if (Object.keys(tiles).length > 0) {
        saveBrainstormTiles(sheet.id, tiles)
      }
    }
  }, [sheet.id])

  // ── Helpers ──────────────────────────────────────────
  const updateZoomPan = useCallback((newZoom, newPan) => {
    zoomRef.current = newZoom
    panRef.current = newPan
    setZoom(newZoom)
    setPan(newPan)
  }, [])

  const screenToWorld = useCallback((sx, sy) => ({
    x: (sx - panRef.current.x) / zoomRef.current,
    y: (sy - panRef.current.y) / zoomRef.current,
  }), [])

  const getVisibleTiles = useCallback(() => {
    const { w, h } = viewportRef.current
    const z = zoomRef.current
    const p = panRef.current
    const topLeftX = -p.x / z
    const topLeftY = -p.y / z
    const bottomRightX = (w - p.x) / z
    const bottomRightY = (h - p.y) / z

    const startTX = Math.floor(topLeftX / TILE_SIZE) - 1
    const startTY = Math.floor(topLeftY / TILE_SIZE) - 1
    const endTX = Math.ceil(bottomRightX / TILE_SIZE)
    const endTY = Math.ceil(bottomRightY / TILE_SIZE)

    const tiles = []
    for (let tx = startTX; tx <= endTX; tx++) {
      for (let ty = startTY; ty <= endTY; ty++) {
        tiles.push({ tx, ty })
        if (tiles.length >= 30) return tiles
      }
    }
    return tiles
  }, [])

  // ── Viewport tracking ────────────────────────────────
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const w = entry.contentRect.width
        const h = entry.contentRect.height
        viewportRef.current = { w, h }
        setViewportSize({ w, h })
      }
    })
    observer.observe(container)
    const w = container.clientWidth
    const h = container.clientHeight
    viewportRef.current = { w, h }
    setViewportSize({ w, h })
    const fitZoom = Math.min(w, h) / (TILE_SIZE * 4)
    updateZoomPan(fitZoom, { x: w / 2 - (TILE_SIZE * 4 * fitZoom) / 2, y: h / 2 - (TILE_SIZE * 4 * fitZoom) / 2 })
    return () => observer.disconnect()
  }, [])

  // ── Wheel zoom ───────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const handleWheel = (e) => {
      e.preventDefault()
      const rect = container.getBoundingClientRect()
      const originX = e.clientX - rect.left
      const originY = e.clientY - rect.top
      const delta = e.deltaY > 0 ? 0.9 : 1.1
      const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoomRef.current * delta))
      const newPan = {
        x: originX - (originX - panRef.current.x) * (newZoom / zoomRef.current),
        y: originY - (originY - panRef.current.y) * (newZoom / zoomRef.current),
      }
      updateZoomPan(newZoom, newPan)
    }
    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [updateZoomPan])

  // ── Keyboard shortcuts ───────────────────────────────
  useEffect(() => {
    const handleKey = (e) => {
      console.log('key', e.key, 'ctrl', e.ctrlKey, 'stack', undoStack.current.length)
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        if (undoStack.current.length === 0) return
        undoStack.current.pop()
        tileLayerRef.current?.restoreSnapshot()
      }
      if (e.key === '0') {
        const { w, h } = viewportRef.current
        const fitZoom = Math.min(w, h) / (TILE_SIZE * 4)
        updateZoomPan(fitZoom, {
          x: w / 2 - (TILE_SIZE * 4 * fitZoom) / 2,
          y: h / 2 - (TILE_SIZE * 4 * fitZoom) / 2,
        })
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [updateZoomPan])

  // ── Pointer events ───────────────────────────────────
  const handlePointerDown = useCallback((e) => {
    if (e.pointerType === 'touch' && !e.isPrimary) return

    const tool = activeToolRef.current
    if (tool === 'select' || tool === 'rect' || tool === 'speech' || tool === 'storyboard') return

    const rect = containerRef.current.getBoundingClientRect()
    const sx = e.clientX - rect.left
    const sy = e.clientY - rect.top
    const isPanTool = tool === 'pan'
    const isDrawingTool = tool === 'pen' || tool === 'eraser'

    if (isPanTool || (e.pointerType === 'touch' && !isDrawingTool)) {
      isPanning.current = true
      lastPanPos.current = { x: sx, y: sy }
      return
    }

    if (isDrawingTool) {
      e.currentTarget.setPointerCapture(e.pointerId)
      isDrawing.current = true

      // Snapshot a generous area around the pointer, not just visible tiles
      const w = screenToWorld(sx, sy)
      const radius = 10 // tiles in each direction
      const snapTiles = []
      const centerTX = Math.floor(w.x / TILE_SIZE)
      const centerTY = Math.floor(w.y / TILE_SIZE)
      for (let tx = centerTX - radius; tx <= centerTX + radius; tx++) {
        for (let ty = centerTY - radius; ty <= centerTY + radius; ty++) {
          snapTiles.push({ tx, ty })
        }
      }
      tileLayerRef.current?.saveSnapshot(snapTiles)
      undoStack.current.push(true)
      if (undoStack.current.length > 3) undoStack.current.shift()

      lastWorldPos.current = w
      tileLayerRef.current?.drawDot(w.x, w.y, brushColorRef.current, brushSizeRef.current, tool === 'eraser')
    }
  }, [getVisibleTiles, screenToWorld])

  const handlePointerMove = useCallback((e) => {
    if (e.pointerType === 'touch' && !e.isPrimary) return

    const tool = activeToolRef.current
    if (tool === 'select' || tool === 'rect' || tool === 'speech' || tool === 'storyboard') return

    const rect = containerRef.current.getBoundingClientRect()
    const sx = e.clientX - rect.left
    const sy = e.clientY - rect.top

    if (isPanning.current) {
      const dx = sx - lastPanPos.current.x
      const dy = sy - lastPanPos.current.y
      const newPan = {
        x: panRef.current.x + dx,
        y: panRef.current.y + dy,
      }
      panRef.current = newPan
      setPan({ ...newPan })
      lastPanPos.current = { x: sx, y: sy }
      return
    }

    if (!isDrawing.current) return
    if (!lastWorldPos.current) return
    if (tool !== 'pen' && tool !== 'eraser') return

    const w = screenToWorld(sx, sy)
    tileLayerRef.current?.drawStroke(
      lastWorldPos.current.x,
      lastWorldPos.current.y,
      w.x, w.y,
      brushColorRef.current,
      brushSizeRef.current,
      tool === 'eraser'
    )
    lastWorldPos.current = w
  }, [screenToWorld])

  const handlePointerUp = useCallback(() => {
    isPanning.current = false
    isDrawing.current = false
    lastWorldPos.current = null
  }, [])

  const getCursor = () => {
    if (activeTool === 'pan') return 'grab'
    if (activeTool === 'pen') return 'crosshair'
    if (activeTool === 'eraser') return 'cell'
    return 'default'
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        cursor: getCursor(),
        touchAction: 'none',
        background: 'var(--bg-base)',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* Dot grid */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `radial-gradient(circle, var(--border-strong) 1px, transparent 1px)`,
        backgroundSize: `${32 * zoom}px ${32 * zoom}px`,
        backgroundPosition: `${pan.x % (32 * zoom)}px ${pan.y % (32 * zoom)}px`,
        pointerEvents: 'none',
      }} />

      {/* Tile layer */}
      <TileLayer
        ref={tileLayerRef}
        sheetId={sheet.id}
        zoom={zoom}
        pan={pan}
        viewportW={viewportSize.w}
        viewportH={viewportSize.h}
      />

      {/* Object layer */}
      <ObjectLayer
        zoom={zoom}
        pan={pan}
        viewportW={viewportSize.w}
        viewportH={viewportSize.h}
        sheet={sheet}
      />

      {/* Zoom controls */}
      <div style={{
        position: 'absolute',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '4px 8px',
        zIndex: 50,
        boxShadow: 'var(--shadow-md)',
      }}>
        <button
          onClick={() => {
            const { w, h } = viewportRef.current
            const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoomRef.current / 1.2))
            const newPan = {
              x: w / 2 - (w / 2 - panRef.current.x) * (newZoom / zoomRef.current),
              y: h / 2 - (h / 2 - panRef.current.y) * (newZoom / zoomRef.current),
            }
            updateZoomPan(newZoom, newPan)
          }}
          style={{
            width: 24, height: 24,
            display: 'flex', alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)', fontSize: 16,
          }}
        >−</button>
        <button
          onClick={() => {
            const { w, h } = viewportRef.current
            const fitZoom = Math.min(w, h) / (TILE_SIZE * 4)
            updateZoomPan(fitZoom, {
              x: w / 2 - (TILE_SIZE * 4 * fitZoom) / 2,
              y: h / 2 - (TILE_SIZE * 4 * fitZoom) / 2,
            })
          }}
          style={{
            padding: '2px 8px', fontSize: 11,
            color: 'var(--text-secondary)',
            minWidth: 48, textAlign: 'center',
          }}
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          onClick={() => {
            const { w, h } = viewportRef.current
            const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoomRef.current * 1.2))
            const newPan = {
              x: w / 2 - (w / 2 - panRef.current.x) * (newZoom / zoomRef.current),
              y: h / 2 - (h / 2 - panRef.current.y) * (newZoom / zoomRef.current),
            }
            updateZoomPan(newZoom, newPan)
          }}
          style={{
            width: 24, height: 24,
            display: 'flex', alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)', fontSize: 16,
          }}
        >+</button>
      </div>
    </div>
  )
}