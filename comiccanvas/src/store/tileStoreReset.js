// Helper module to clear the TileLayer in-memory store on GitHub load.
// Kept separate to avoid circular imports between store/index.js and TileLayer.jsx.

// This mirrors the tileStore in TileLayer.jsx — we clear it here by importing
// the same reference via a shared singleton approach.
// Since JS modules are singletons, importing tileStore from TileLayer works fine.

export function clearTileStore(sheetIds) {
  // We can't import TileLayer directly here (would be circular),
  // so we use a global event that TileLayer listens for.
  window.dispatchEvent(new CustomEvent('cc:clearTileStore', { detail: { sheetIds } }))
}