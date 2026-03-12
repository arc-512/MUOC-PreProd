// Shared in-memory tile store for Brainstorm canvases.
// Keyed by sheetId. Lives outside React so it survives sheet switches.
// Imported by both TileLayer.jsx and store/index.js.

export const tileStore = {}

export function getSheetTiles(sheetId) {
  if (!tileStore[sheetId]) tileStore[sheetId] = {}
  return tileStore[sheetId]
}

export function clearSheetTiles(sheetIds) {
  sheetIds.forEach(id => { delete tileStore[id] })
}