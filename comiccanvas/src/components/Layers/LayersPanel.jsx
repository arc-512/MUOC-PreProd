import { useState, useRef } from 'react'
import { Eye, EyeOff, Lock, Unlock, Plus, Trash2, GripVertical } from 'lucide-react'
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
  const reorderLayers = useStore(s => s.reorderLayers)

  const sheet = sheets.find(s => s.id === activeSheetId)
  const [renamingId, setRenamingId] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const dragItem = useRef(null)
  const dragOverItem = useRef(null)

  if (!sheet) return null

  const layers = [...sheet.layers].reverse() // Show top layer first

  // ── Rename ───────────────────────────────────────────
  const startRename = (layer) => {
    setRenamingId(layer.id)
    setRenameValue(layer.name)
  }

  const finishRename = () => {
    if (renamingId && renameValue.trim()) {
      renameLayer(sheet.id, renamingId, renameValue.trim())
    }
    setRenamingId(null)
  }

  // ── Drag to reorder ──────────────────────────────────
  const handleDragStart = (e, index) => {
    dragItem.current = index
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    dragOverItem.current = index
  }

  const handleDrop = () => {
    if (dragItem.current === null || dragOverItem.current === null) return
    if (dragItem.current === dragOverItem.current) return

    const reordered = [...layers]
    const dragged = reordered.splice(dragItem.current, 1)[0]
    reordered.splice(dragOverItem.current, 0, dragged)

    // Reverse back before saving (store keeps bottom layer first)
    reorderLayers(sheet.id, [...reordered].reverse())
    dragItem.current = null
    dragOverItem.current = null
  }

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-surface)',
      borderLeft: '1px solid var(--border)',
      userSelect: 'none',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 12px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <span style={{
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}>
          Layers
        </span>
        <button
          onClick={() => addLayer(sheet.id)}
          title="Add Layer"
          style={{
            width: 24,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
            borderRadius: 'var(--radius-sm)',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--bg-elevated)'
            e.currentTarget.style.color = 'var(--text-primary)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--text-secondary)'
          }}
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Layer list */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '4px 0',
      }}>
        {layers.map((layer, index) => {
          const isActive = layer.id === sheet.activeLayer
          const isRenaming = renamingId === layer.id

          return (
            <div
              key={layer.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={handleDrop}
              onClick={() => setActiveLayer(sheet.id, layer.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '6px 8px',
                cursor: 'pointer',
                background: isActive ? 'var(--bg-elevated)' : 'transparent',
                borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                transition: 'all 0.1s',
              }}
              onMouseEnter={e => {
                if (!isActive) e.currentTarget.style.background = 'var(--bg-hover)'
              }}
              onMouseLeave={e => {
                if (!isActive) e.currentTarget.style.background = 'transparent'
              }}
            >
              {/* Drag handle */}
              <div style={{
                color: 'var(--text-muted)',
                cursor: 'grab',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
              }}>
                <GripVertical size={12} />
              </div>

              {/* Layer name */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {isRenaming ? (
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={e => setRenameValue(e.target.value)}
                    onBlur={finishRename}
                    onKeyDown={e => {
                      if (e.key === 'Enter') finishRename()
                      if (e.key === 'Escape') setRenamingId(null)
                      e.stopPropagation()
                    }}
                    onClick={e => e.stopPropagation()}
                    style={{
                      width: '100%',
                      background: 'var(--bg-base)',
                      border: '1px solid var(--accent)',
                      borderRadius: 3,
                      padding: '1px 4px',
                      fontSize: 12,
                      color: 'var(--text-primary)',
                      outline: 'none',
                    }}
                  />
                ) : (
                  <span
                    onDoubleClick={(e) => {
                      e.stopPropagation()
                      startRename(layer)
                    }}
                    style={{
                      fontSize: 12,
                      color: layer.visible
                        ? 'var(--text-primary)'
                        : 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: 'block',
                      textDecoration: layer.locked ? 'none' : 'none',
                      opacity: layer.visible ? 1 : 0.5,
                    }}
                  >
                    {layer.name}
                  </span>
                )}
              </div>

              {/* Action buttons */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                flexShrink: 0,
              }}>
                {/* Visibility */}
                <button
                  title={layer.visible ? 'Hide layer' : 'Show layer'}
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleLayerVisibility(sheet.id, layer.id)
                  }}
                  style={{
                    width: 22,
                    height: 22,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: layer.visible ? 'var(--text-secondary)' : 'var(--text-muted)',
                    borderRadius: 3,
                    opacity: layer.visible ? 1 : 0.4,
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-base)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {layer.visible
                    ? <Eye size={12} />
                    : <EyeOff size={12} />
                  }
                </button>

                {/* Lock */}
                <button
                  title={layer.locked ? 'Unlock layer' : 'Lock layer'}
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleLayerLock(sheet.id, layer.id)
                  }}
                  style={{
                    width: 22,
                    height: 22,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: layer.locked ? 'var(--accent)' : 'var(--text-secondary)',
                    borderRadius: 3,
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-base)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {layer.locked
                    ? <Lock size={12} />
                    : <Unlock size={12} />
                  }
                </button>

                {/* Delete */}
                {sheet.layers.length > 1 && (
                  <button
                    title="Delete layer"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteLayer(sheet.id, layer.id)
                    }}
                    style={{
                      width: 22,
                      height: 22,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-muted)',
                      borderRadius: 3,
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'var(--bg-base)'
                      e.currentTarget.style.color = '#e8462a'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = 'var(--text-muted)'
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer — layer count */}
      <div style={{
        padding: '6px 12px',
        borderTop: '1px solid var(--border)',
        fontSize: 10,
        color: 'var(--text-muted)',
        flexShrink: 0,
      }}>
        {sheet.layers.length} layer{sheet.layers.length !== 1 ? 's' : ''}
      </div>
    </div>
  )
}