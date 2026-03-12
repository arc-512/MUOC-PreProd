import { useState, useRef, useEffect, useCallback } from 'react'
import useStore from '../../store'

const MIN_SIZE = 40
const GRID_SNAP = 20

function snapToGrid(val) {
  return Math.round(val / GRID_SNAP) * GRID_SNAP
}

// ── Resize Handle ─────────────────────────────────────
function ResizeHandle({ position, onResize }) {
  const dragging = useRef(false)
  const last = useRef({ x: 0, y: 0 })
  const posStyles = {
    'nw': { top: -5, left: -5, cursor: 'nw-resize' },
    'ne': { top: -5, right: -5, cursor: 'ne-resize' },
    'sw': { bottom: -5, left: -5, cursor: 'sw-resize' },
    'se': { bottom: -5, right: -5, cursor: 'se-resize' },
    'n':  { top: -5, left: 'calc(50% - 5px)', cursor: 'n-resize' },
    's':  { bottom: -5, left: 'calc(50% - 5px)', cursor: 's-resize' },
    'w':  { top: 'calc(50% - 5px)', left: -5, cursor: 'w-resize' },
    'e':  { top: 'calc(50% - 5px)', right: -5, cursor: 'e-resize' },
  }
  return (
    <div
      style={{
        position: 'absolute',
        width: 10, height: 10,
        background: 'white',
        border: '2px solid var(--accent)',
        borderRadius: 2,
        zIndex: 100,
        boxSizing: 'border-box',
        ...posStyles[position],
      }}
      onPointerDown={(e) => {
        e.stopPropagation()
        e.preventDefault()
        e.currentTarget.setPointerCapture(e.pointerId)
        dragging.current = true
        last.current = { x: e.clientX, y: e.clientY }
      }}
      onPointerMove={(e) => {
        if (!dragging.current) return
        e.stopPropagation()
        const dx = e.clientX - last.current.x
        const dy = e.clientY - last.current.y
        last.current = { x: e.clientX, y: e.clientY }
        onResize(position, dx, dy)
      }}
      onPointerUp={() => { dragging.current = false }}
    />
  )
}

// ── Image Item ────────────────────────────────────────
function ImageItem({ obj, isSelected, onSelect, onChange, onDelete, onBringToFront }) {
  const dragging = useRef(false)
  const last = useRef({ x: 0, y: 0 })

  const handleResize = (handle, dx, dy) => {
    let { x, y, width, height } = obj
    width = width || 200
    height = height || 150
    if (handle.includes('e')) width = Math.max(MIN_SIZE, width + dx)
    if (handle.includes('s')) height = Math.max(MIN_SIZE, height + dy)
    if (handle.includes('w')) { x += dx; width = Math.max(MIN_SIZE, width - dx) }
    if (handle.includes('n')) { y += dy; height = Math.max(MIN_SIZE, height - dy) }
    onChange({ x: snapToGrid(x), y: snapToGrid(y), width, height })
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: obj.x, top: obj.y,
        width: obj.width || 200,
        height: obj.height || 150,
        cursor: 'move',
        outline: isSelected ? '2px solid var(--accent)' : '2px solid transparent',
        outlineOffset: 2,
        boxSizing: 'border-box',
        zIndex: obj.zIndex || 1,
        userSelect: 'none',
        borderRadius: 3,
        overflow: 'hidden',
        boxShadow: isSelected
          ? '0 4px 20px rgba(0,0,0,0.4)'
          : '0 2px 8px rgba(0,0,0,0.3)',
        transition: 'box-shadow 0.15s',
      }}
      onPointerDown={(e) => {
        e.stopPropagation()
        e.currentTarget.setPointerCapture(e.pointerId)
        onSelect()
        onBringToFront()
        dragging.current = true
        last.current = { x: e.clientX, y: e.clientY }
      }}
      onPointerMove={(e) => {
        if (!dragging.current) return
        e.stopPropagation()
        const dx = e.clientX - last.current.x
        const dy = e.clientY - last.current.y
        last.current = { x: e.clientX, y: e.clientY }
        onChange({ x: obj.x + dx, y: obj.y + dy })
      }}
      onPointerUp={(e) => {
        dragging.current = false
        // Snap on release
        onChange({ x: snapToGrid(obj.x), y: snapToGrid(obj.y) })
      }}
    >
      <img
        src={obj.src} alt=""
        style={{
          width: '100%', height: '100%',
          objectFit: 'cover', display: 'block',
          pointerEvents: 'none',
        }}
      />
      {/* Always visible on hover delete */}
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); onDelete() }}
        className="img-delete-btn"
        style={{
          position: 'absolute', top: 6, right: 6,
          width: 22, height: 22,
          background: 'rgba(232,70,42,0.85)', color: 'white',
          border: 'none', borderRadius: '50%', cursor: 'pointer',
          fontSize: 12, zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: 0,
          transition: 'opacity 0.15s',
        }}
      >✕</button>

      {isSelected && (
        <>
          <ResizeHandle position="nw" onResize={handleResize} />
          <ResizeHandle position="ne" onResize={handleResize} />
          <ResizeHandle position="sw" onResize={handleResize} />
          <ResizeHandle position="se" onResize={handleResize} />
          <ResizeHandle position="n"  onResize={handleResize} />
          <ResizeHandle position="s"  onResize={handleResize} />
          <ResizeHandle position="w"  onResize={handleResize} />
          <ResizeHandle position="e"  onResize={handleResize} />
        </>
      )}
    </div>
  )
}

// ── Sticky Note ───────────────────────────────────────
function StickyNote({ obj, isSelected, onSelect, onChange, onDelete, onBringToFront }) {
  const [editing, setEditing] = useState(false)
  const textRef = useRef(null)
  const dragging = useRef(false)
  const last = useRef({ x: 0, y: 0 })
  const clickCount = useRef(0)
  const clickTimer = useRef(null)
  const hasMoved = useRef(false)

  useEffect(() => {
    if (editing && textRef.current) textRef.current.focus()
  }, [editing])

  const handleResize = (handle, dx, dy) => {
    let { x, y, width, height } = obj
    width = width || 160
    height = height || 120
    if (handle.includes('e')) width = Math.max(MIN_SIZE, width + dx)
    if (handle.includes('s')) height = Math.max(MIN_SIZE, height + dy)
    if (handle.includes('w')) { x += dx; width = Math.max(MIN_SIZE, width - dx) }
    if (handle.includes('n')) { y += dy; height = Math.max(MIN_SIZE, height - dy) }
    onChange({ x: snapToGrid(x), y: snapToGrid(y), width, height })
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: obj.x, top: obj.y,
        width: obj.width || 160,
        height: obj.height || 120,
        cursor: editing ? 'text' : 'move',
        outline: isSelected ? '2px solid var(--accent)' : 'none',
        outlineOffset: 1,
        boxSizing: 'border-box',
        zIndex: obj.zIndex || 1,
        userSelect: 'none',
        background: '#fffde7',
        border: '1px solid #f0c040',
        borderRadius: 4,
        boxShadow: isSelected
          ? '0 4px 20px rgba(0,0,0,0.4)'
          : '2px 2px 8px rgba(0,0,0,0.2)',
      }}
      onPointerDown={(e) => {
        if (editing) return
        e.stopPropagation()
        e.currentTarget.setPointerCapture(e.pointerId)
        onSelect()
        onBringToFront()
        dragging.current = true
        hasMoved.current = false
        last.current = { x: e.clientX, y: e.clientY }
        clickCount.current += 1
        if (clickTimer.current) clearTimeout(clickTimer.current)
        clickTimer.current = setTimeout(() => {
          if (clickCount.current >= 2 && !hasMoved.current) setEditing(true)
          clickCount.current = 0
        }, 300)
      }}
      onPointerMove={(e) => {
        if (!dragging.current || editing) return
        e.stopPropagation()
        const dx = e.clientX - last.current.x
        const dy = e.clientY - last.current.y
        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) hasMoved.current = true
        last.current = { x: e.clientX, y: e.clientY }
        onChange({ x: obj.x + dx, y: obj.y + dy })
      }}
      onPointerUp={() => {
        dragging.current = false
        onChange({ x: snapToGrid(obj.x), y: snapToGrid(obj.y) })
      }}
    >
      {/* Header */}
      <div style={{
        padding: '4px 8px', fontSize: 10, fontWeight: 600,
        color: '#8a7000', borderBottom: '1px solid #f0c040',
        pointerEvents: 'none',
      }}>
        📝 Note
      </div>
      {editing ? (
        <textarea
          ref={textRef}
          defaultValue={obj.text || ''}
          onBlur={(e) => { onChange({ text: e.target.value }); setEditing(false) }}
          onKeyDown={(e) => {
            e.stopPropagation()
            if (e.key === 'Escape') { onChange({ text: e.target.value }); setEditing(false) }
          }}
          style={{
            width: '100%', height: 'calc(100% - 26px)',
            background: 'transparent', border: 'none', outline: 'none', resize: 'none',
            fontSize: 12, color: '#5a4000',
            fontFamily: 'var(--font-body)', padding: '4px 8px',
            boxSizing: 'border-box', lineHeight: 1.4,
          }}
        />
      ) : (
        <div style={{
          padding: '4px 8px', fontSize: 12, color: '#5a4000',
          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          overflow: 'hidden', height: 'calc(100% - 26px)',
          pointerEvents: 'none',
        }}>
          {obj.text || <span style={{ opacity: 0.5 }}>Double click to edit</span>}
        </div>
      )}
      {isSelected && !editing && (
        <>
          <ResizeHandle position="nw" onResize={handleResize} />
          <ResizeHandle position="ne" onResize={handleResize} />
          <ResizeHandle position="sw" onResize={handleResize} />
          <ResizeHandle position="se" onResize={handleResize} />
          <ResizeHandle position="n"  onResize={handleResize} />
          <ResizeHandle position="s"  onResize={handleResize} />
          <ResizeHandle position="w"  onResize={handleResize} />
          <ResizeHandle position="e"  onResize={handleResize} />
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            style={{
              position: 'absolute', top: -22, right: 0,
              fontSize: 10, padding: '2px 6px',
              background: '#e8462a', color: 'white',
              border: 'none', borderRadius: 3, cursor: 'pointer',
              zIndex: 200,
            }}
          >✕ Delete</button>
        </>
      )}
    </div>
  )
}

// ── Text Label ────────────────────────────────────────
function TextLabel({ obj, isSelected, onSelect, onChange, onDelete, onBringToFront }) {
  const [editing, setEditing] = useState(false)
  const textRef = useRef(null)
  const dragging = useRef(false)
  const last = useRef({ x: 0, y: 0 })
  const clickCount = useRef(0)
  const clickTimer = useRef(null)
  const hasMoved = useRef(false)

  useEffect(() => {
    if (editing && textRef.current) textRef.current.focus()
  }, [editing])

  return (
    <div
      style={{
        position: 'absolute',
        left: obj.x, top: obj.y,
        width: obj.width || 150,
        height: obj.height || 40,
        cursor: editing ? 'text' : 'move',
        outline: isSelected ? '2px solid var(--accent)' : '1px dashed transparent',
        outlineOffset: 1,
        boxSizing: 'border-box',
        zIndex: obj.zIndex || 1,
        userSelect: 'none',
      }}
      onPointerDown={(e) => {
        if (editing) return
        e.stopPropagation()
        e.currentTarget.setPointerCapture(e.pointerId)
        onSelect()
        onBringToFront()
        dragging.current = true
        hasMoved.current = false
        last.current = { x: e.clientX, y: e.clientY }
        clickCount.current += 1
        if (clickTimer.current) clearTimeout(clickTimer.current)
        clickTimer.current = setTimeout(() => {
          if (clickCount.current >= 2 && !hasMoved.current) setEditing(true)
          clickCount.current = 0
        }, 300)
      }}
      onPointerMove={(e) => {
        if (!dragging.current || editing) return
        e.stopPropagation()
        const dx = e.clientX - last.current.x
        const dy = e.clientY - last.current.y
        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) hasMoved.current = true
        last.current = { x: e.clientX, y: e.clientY }
        onChange({ x: obj.x + dx, y: obj.y + dy })
      }}
      onPointerUp={() => { dragging.current = false }}
    >
      {editing ? (
        <input
          ref={textRef}
          defaultValue={obj.text || ''}
          onBlur={(e) => { onChange({ text: e.target.value }); setEditing(false) }}
          onKeyDown={(e) => {
            e.stopPropagation()
            if (e.key === 'Enter' || e.key === 'Escape') {
              onChange({ text: e.target.value })
              setEditing(false)
            }
          }}
          style={{
            width: '100%', height: '100%',
            background: 'transparent', border: 'none', outline: 'none',
            fontSize: obj.fontSize || 16, fontWeight: 600,
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-body)', padding: '4px',
            boxSizing: 'border-box',
          }}
        />
      ) : (
        <div style={{
          width: '100%', height: '100%',
          fontSize: obj.fontSize || 16, fontWeight: 600,
          color: 'var(--text-primary)',
          padding: 4, boxSizing: 'border-box',
          whiteSpace: 'nowrap', overflow: 'hidden',
          textOverflow: 'ellipsis', pointerEvents: 'none',
        }}>
          {obj.text || <span style={{ opacity: 0.4 }}>Double click to edit</span>}
        </div>
      )}
      {isSelected && !editing && (
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          style={{
            position: 'absolute', top: -22, right: 0,
            fontSize: 10, padding: '2px 6px',
            background: '#e8462a', color: 'white',
            border: 'none', borderRadius: 3, cursor: 'pointer',
            zIndex: 200,
          }}
        >✕ Delete</button>
      )}
    </div>
  )
}

// ── Main MoodboardView ────────────────────────────────
export default function MoodboardView({ sheet }) {
  const updateObject = useStore(s => s.updateObject)
  const addObject = useStore(s => s.addObject)
  const deleteObject = useStore(s => s.deleteObject)
  const activeTool = useStore(s => s.activeTool)

  const [selectedId, setSelectedId] = useState(null)
  const [zCounter, setZCounter] = useState(100)
  const fileInputRef = useRef(null)
  const boardRef = useRef(null)

  const objects = sheet.objects || []

  // ── Paste from clipboard ─────────────────────────────
  useEffect(() => {
    const handlePaste = async (e) => {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          const reader = new FileReader()
          reader.onload = (ev) => {
            const board = boardRef.current
            const rect = board?.getBoundingClientRect()
            addObject(sheet.id, {
              type: 'image',
              src: ev.target.result,
              x: snapToGrid(Math.random() * 400 + 40),
              y: snapToGrid(Math.random() * 300 + 40),
              width: 240, height: 180,
              zIndex: zCounter,
            })
            setZCounter(z => z + 1)
          }
          reader.readAsDataURL(file)
          break
        }
      }
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [sheet.id, zCounter, addObject])

  // ── Delete key ───────────────────────────────────────
  useEffect(() => {
    const handleKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        deleteObject(sheet.id, selectedId)
        setSelectedId(null)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [selectedId, sheet.id, deleteObject])

  // ── File upload ──────────────────────────────────────
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files)
    files.forEach((file, i) => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        addObject(sheet.id, {
          type: 'image',
          src: ev.target.result,
          x: snapToGrid(40 + i * GRID_SNAP * 2),
          y: snapToGrid(40 + i * GRID_SNAP * 2),
          width: 240, height: 180,
          zIndex: zCounter + i,
        })
        setZCounter(z => z + files.length)
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  // ── Board click — place objects ──────────────────────
  const handleBoardClick = (e) => {
    if (e.target !== e.currentTarget) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = snapToGrid(e.clientX - rect.left)
    const y = snapToGrid(e.clientY - rect.top)

    if (activeTool === 'text') {
      addObject(sheet.id, {
        type: 'text-label', x, y,
        width: 150, height: 40,
        text: '', fontSize: 16,
        zIndex: zCounter,
      })
      setZCounter(z => z + 1)
    } else if (activeTool === 'comment') {
      addObject(sheet.id, {
        type: 'sticky', x, y,
        width: 160, height: 120,
        text: '', zIndex: zCounter,
      })
      setZCounter(z => z + 1)
    } else if (activeTool === 'image') {
      fileInputRef.current?.click()
    } else {
      setSelectedId(null)
    }
  }

  const bringToFront = (id) => {
    setZCounter(z => {
      updateObject(sheet.id, id, { zIndex: z + 1 })
      return z + 1
    })
  }

  const isObjectTool = ['select', 'text', 'comment', 'image'].includes(activeTool)

  const commonProps = (obj) => ({
    key: obj.id,
    obj,
    isSelected: obj.id === selectedId,
    onSelect: () => setSelectedId(obj.id),
    onChange: (changes) => updateObject(sheet.id, obj.id, changes),
    onDelete: () => { deleteObject(sheet.id, obj.id); setSelectedId(null) },
    onBringToFront: () => bringToFront(obj.id),
  })

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      background: 'var(--bg-base)',
      overflow: 'hidden',
    }}>
      {/* Top hint bar */}
      <div style={{
        padding: '6px 16px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-surface)',
        fontSize: 11,
        color: 'var(--text-muted)',
        flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <span>🎨 Moodboard</span>
        <span>Ctrl+V to paste images from clipboard</span>
        <span>Select image tool to upload from disk</span>
      </div>

      {/* Board */}
      <div
        ref={boardRef}
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'auto',
          cursor: activeTool === 'text' || activeTool === 'comment' ? 'crosshair'
            : activeTool === 'image' ? 'copy' : 'default',
        }}
        onClick={handleBoardClick}
      >
        {/* Dot grid background */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `radial-gradient(circle, var(--border-strong) 1px, transparent 1px)`,
          backgroundSize: `${GRID_SNAP}px ${GRID_SNAP}px`,
          pointerEvents: 'none',
          minWidth: '100%', minHeight: '100%',
        }} />

        {/* Objects */}
        {[...objects]
          .sort((a, b) => (a.zIndex || 1) - (b.zIndex || 1))
          .map(obj => {
            if (obj.type === 'image') return <ImageItem {...commonProps(obj)} />
            if (obj.type === 'sticky') return <StickyNote {...commonProps(obj)} />
            if (obj.type === 'text-label') return <TextLabel {...commonProps(obj)} />
            return null
          })
        }
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />
    </div>
  )
}