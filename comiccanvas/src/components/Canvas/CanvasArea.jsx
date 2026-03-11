import useStore, { SHEET_TYPES } from '../../store'
import InfiniteCanvas from './InfiniteCanvas'

export default function CanvasArea() {
  const sheets = useStore(s => s.sheets)
  const activeSheetId = useStore(s => s.activeSheetId)

  const sheet = sheets.find(s => s.id === activeSheetId)

  if (!sheet) {
    return (
      <div className="app-canvas">
        <div className="canvas-empty">
          <div className="canvas-empty-icon">🎨</div>
          <div className="canvas-empty-title">NO SHEET SELECTED</div>
          <div className="canvas-empty-sub">Select or add a sheet to start</div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-canvas">
      <InfiniteCanvas key={sheet.id} sheet={sheet} />
    </div>
  )
}