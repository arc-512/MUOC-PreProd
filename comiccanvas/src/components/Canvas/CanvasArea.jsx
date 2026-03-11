import useStore, { SHEET_TYPES } from '../../store'

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

  const meta = SHEET_TYPES[sheet.type]

  return (
    <div className="app-canvas">
      <div className="canvas-empty">
        <div className="canvas-empty-icon">{meta.icon}</div>
        <div className="canvas-empty-title">{sheet.name.toUpperCase()}</div>
        <div className="canvas-empty-sub">
          {meta.label} — Canvas engine coming in Stage 2
        </div>
        <div style={{
          marginTop: 24,
          padding: '10px 20px',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          fontSize: 11,
          color: 'var(--text-muted)',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          textAlign: 'center',
        }}>
          <div>Sheet ID: <code style={{ color: 'var(--blue)' }}>{sheet.id}</code></div>
          <div>Type: <code style={{ color: 'var(--green)' }}>{sheet.type}</code></div>
          <div>Layers: <code style={{ color: 'var(--yellow)' }}>{sheet.layers.length}</code></div>
        </div>
      </div>
    </div>
  )
}