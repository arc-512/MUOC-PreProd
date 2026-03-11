import { useState, useRef, useEffect } from 'react'
import { Plus, Eye, EyeOff, Lock, Unlock, Trash2 } from 'lucide-react'
import useStore from '../../store'

export default function LayersPanel() {
  const sheets = useStore(s => s.sheets)
  const activeSheetId = useStore(s => s.activeSheetId)
  const addLayer = useStore(s => s.addLayer)
  const deleteLayer = useStore(s => s.deleteLayer)
  const renameLayer = useStore(s => s.renameLayer)
  const toggleLayerVisibility = useStore(s => s.toggleLayerVisibility)
  const toggleLayerLock = useStore(s => s.toggleLayerLock)
  const setActiveLayer = useStore(s => s.setActiveLayer)

  const [renamingId, setRenamingId] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const renameRef = useRef(null)

  const sheet = sheets.find(s => s.id === activeSheetId)

  useEffect(() => {
    if (renamingId && renameRef.current) {
      renameRef.current.focus()
      renameRef.current.select()
    }
  }, [renamingId])

  if (!sheet) {
    return (
      <div className="app-layers">
        <div className="layers-header">
          <span className="layers-title">LAYERS</span>
        </div>
        <div style={{ padding: 12, color: 'var(--text-muted)', fontSize: 11 }}>
          No sheet selected
        </div>
      </div>
    )
  }

  const startRename = (layer) => {
    setRenamingId(layer.id)
    setRenameValue(layer.name)
  }

  const commitRename = () => {
    if (renameValue.trim()) {
      renameLayer(sheet.id, renamingId, renameValue.trim())
    }
    setRenamingId(null)
  }

  const reversedLayers = [...sheet.layers].reverse()

  return (
    <div className="app-layers">
      <div className="layers-header">
        <span className="layers-title">LAYERS</span>
        <button
          className="layers-add-btn"
          title="Add layer"
          onClick={() => addLayer(sheet.id)}
        >
          <Plus size={14} />
        </button>
      </div>

      <div className="layers-list">
        {reversedLayers.map(layer => (
          <div
            key={layer.id}
            className={`layer-item ${layer.id === sheet.activeLayer ? 'active' : ''} ${layer.locked ? 'locked' : ''}`}
            onClick={() => setActiveLayer(sheet.id, layer.id)}
            onDoubleClick={() => startRename(layer)}
          >
            {/* Visibility */}
            <button
              className={`layer-icon-btn ${layer.visible ? 'active' : 'hidden'}`}
              onClick={e => { e.stopPropagation(); toggleLayerVisibility(sheet.id, layer.id) }}
              title={layer.visible ? 'Hide layer' : 'Show layer'}
            >
              {layer.visible ? <Eye size={12} /> : <EyeOff size={12} />}
            </button>

            {/* Lock */}
            <button
              className={`layer-icon-btn ${layer.locked ? 'active' : ''}`}
              onClick={e => { e.stopPropagation(); toggleLayerLock(sheet.id, layer.id) }}
              title={layer.locked ? 'Unlock layer' : 'Lock layer'}
            >
              {layer.locked ? <Lock size={12} /> : <Unlock size={12} />}
            </button>

            {/* Name */}
            {renamingId === layer.id ? (
              <input
                ref={renameRef}
                className="layer-name-input"
                value={renameValue}
                onChange={e => setRenameValue(e.target.value)}
                onBlur={commitRename}
                onKeyDown={e => {
                  if (e.key === 'Enter') commitRename()
                  if (e.key === 'Escape') setRenamingId(null)
                }}
                onClick={e => e.stopPropagation()}
              />
            ) : (
              <span className="layer-name">{layer.name}</span>
            )}

            {/* Delete */}
            {/* Delete */}
            {sheet.layers.length > 1 && (
              <button
                className="layer-icon-btn layer-delete-btn"
                onClick={e => {
                  e.stopPropagation()
                  deleteLayer(sheet.id, layer.id)
                }}
                title="Delete layer"
              >
                <Trash2 size={11} style={{ color: 'var(--accent)' }} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Object layer indicator */}
      <div style={{
        padding: '8px 12px',
        borderTop: '1px solid var(--border)',
        fontSize: 10,
        color: 'var(--text-muted)',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}>
        <div style={{
          width: 8, height: 8, borderRadius: 2,
          background: 'var(--blue)', opacity: 0.7
        }} />
        Objects layer (always on top)
      </div>
    </div>
  )
}