import { useState, useRef, useCallback } from 'react'

export const TILE_SIZE = 512
const MAX_ZOOM = 10
const MAX_VISIBLE_TILES = 25 // cap tiles rendered at once

export default function useTiledCanvas(viewportW = 800, viewportH = 600) {

  // Calculate min zoom so canvas never smaller than viewport
  const getMinZoom = useCallback((vw, vh) => {
    return Math.max(vw / (TILE_SIZE * 8), vh / (TILE_SIZE * 8), 0.1)
  }, [])

  const initialZoom = getMinZoom(viewportW, viewportH)

  const [zoom, setZoom] = useState(initialZoom)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const zoomRef = useRef(initialZoom)
  const panRef = useRef({ x: 0, y: 0 })

  zoomRef.current = zoom
  panRef.current = pan

  // ── Coordinate helpers ───────────────────────────────
  const screenToWorld = useCallback((sx, sy) => {
    const z = zoomRef.current
    const p = panRef.current
    return {
      x: (sx - p.x) / z,
      y: (sy - p.y) / z,
    }
  }, [])

  const worldToTile = useCallback((wx, wy) => ({
    tx: Math.floor(wx / TILE_SIZE),
    ty: Math.floor(wy / TILE_SIZE),
  }), [])

  const worldToTilePixel = useCallback((wx, wy) => ({
    px: ((wx % TILE_SIZE) + TILE_SIZE) % TILE_SIZE,
    py: ((wy % TILE_SIZE) + TILE_SIZE) % TILE_SIZE,
  }), [])

  const screenToTile = useCallback((sx, sy) => {
    const w = screenToWorld(sx, sy)
    const tile = worldToTile(w.x, w.y)
    const pixel = worldToTilePixel(w.x, w.y)
    return { ...tile, ...pixel, wx: w.x, wy: w.y }
  }, [screenToWorld, worldToTile, worldToTilePixel])

  // ── Get visible tiles (capped) ───────────────────────
  const getVisibleTiles = useCallback((viewportW, viewportH) => {
    const topLeft = screenToWorld(0, 0)
    const bottomRight = screenToWorld(viewportW, viewportH)

    const startTX = Math.floor(topLeft.x / TILE_SIZE) - 1
    const startTY = Math.floor(topLeft.y / TILE_SIZE) - 1
    const endTX = Math.ceil(bottomRight.x / TILE_SIZE) + 1
    const endTY = Math.ceil(bottomRight.y / TILE_SIZE) + 1

    const tiles = []
    for (let tx = startTX; tx <= endTX; tx++) {
      for (let ty = startTY; ty <= endTY; ty++) {
        tiles.push({ tx, ty })
        // Cap tiles to prevent lag when zoomed far out
        if (tiles.length >= MAX_VISIBLE_TILES) return tiles
      }
    }
    return tiles
  }, [screenToWorld])

  // ── Zoom ─────────────────────────────────────────────
  const zoomTo = useCallback((newZoom, originX, originY, vw, vh) => {
    const minZoom = getMinZoom(vw || viewportW, vh || viewportH)
    const clamped = Math.min(MAX_ZOOM, Math.max(minZoom, newZoom))
    const z = zoomRef.current
    const p = panRef.current
    const nextPan = {
      x: originX - (originX - p.x) * (clamped / z),
      y: originY - (originY - p.y) * (clamped / z),
    }
    setPan(nextPan)
    setZoom(clamped)
    panRef.current = nextPan
    zoomRef.current = clamped
  }, [getMinZoom, viewportW, viewportH])

  // ── Pan ──────────────────────────────────────────────
  const panBy = useCallback((dx, dy) => {
    setPan(prev => {
      const next = { x: prev.x + dx, y: prev.y + dy }
      panRef.current = next
      return next
    })
  }, [])

  // ── Reset view ───────────────────────────────────────
  const resetView = useCallback((vw, vh) => {
    const minZoom = getMinZoom(vw || viewportW, vh || viewportH)
    setPan({ x: 0, y: 0 })
    setZoom(minZoom)
    panRef.current = { x: 0, y: 0 }
    zoomRef.current = minZoom
  }, [getMinZoom, viewportW, viewportH])

  return {
    zoom,
    pan,
    zoomRef,
    panRef,
    screenToWorld,
    worldToTile,
    worldToTilePixel,
    screenToTile,
    getVisibleTiles,
    getMinZoom,
    zoomTo,
    panBy,
    resetView,
  }
}