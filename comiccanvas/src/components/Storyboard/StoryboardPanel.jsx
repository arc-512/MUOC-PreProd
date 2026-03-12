import { useRef, useEffect, useState, useCallback } from 'react'
import useStore from '../../store'

const MIN_SIZE = 30

// ── Resize Handle ─────────────────────────────────────
function ResizeHandle({ position, onResize }) {
    const dragging = useRef(false)
    const last = useRef({ x: 0, y: 0 })
    const posStyles = {
        'nw': { top: -5, left: -5, cursor: 'nw-resize' },
        'ne': { top: -5, right: -5, cursor: 'ne-resize' },
        'sw': { bottom: -5, left: -5, cursor: 'sw-resize' },
        'se': { bottom: -5, right: -5, cursor: 'se-resize' },
        'n': { top: -5, left: 'calc(50% - 5px)', cursor: 'n-resize' },
        's': { bottom: -5, left: 'calc(50% - 5px)', cursor: 's-resize' },
        'w': { top: 'calc(50% - 5px)', left: -5, cursor: 'w-resize' },
        'e': { top: 'calc(50% - 5px)', right: -5, cursor: 'e-resize' },
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
            onPointerUp={(e) => {
                e.stopPropagation()
                dragging.current = false
            }}
        />
    )
}

// ── Object Wrapper ────────────────────────────────────
function ObjWrapper({ obj, isSelected, onSelect, onDelete, onChange, children, extraStyle }) {
    const dragging = useRef(false)
    const last = useRef({ x: 0, y: 0 })
    const hasMoved = useRef(false)

    const handleResize = (handle, dx, dy) => {
        let { x, y } = obj
        let width = obj.width || 150
        let height = obj.height || 60
        if (handle.includes('e')) width = Math.max(MIN_SIZE, width + dx)
        if (handle.includes('s')) height = Math.max(MIN_SIZE, height + dy)
        if (handle.includes('w')) { x += dx; width = Math.max(MIN_SIZE, width - dx) }
        if (handle.includes('n')) { y += dy; height = Math.max(MIN_SIZE, height - dy) }
        onChange({ x, y, width, height })
    }

    return (
        <div
            style={{
                position: 'absolute',
                left: obj.x, top: obj.y,
                width: obj.width || 150,
                height: obj.height || 60,
                cursor: 'move',
                outline: isSelected ? '2px solid var(--accent)' : 'none',
                outlineOffset: 1,
                boxSizing: 'border-box',
                zIndex: isSelected ? 10 : 1,
                userSelect: 'none',
                ...extraStyle,
            }}
            onPointerDown={(e) => {
                e.stopPropagation()
                e.currentTarget.setPointerCapture(e.pointerId)
                onSelect()
                dragging.current = true
                hasMoved.current = false
                last.current = { x: e.clientX, y: e.clientY }
            }}
            onPointerMove={(e) => {
                if (!dragging.current) return
                e.stopPropagation()
                const dx = e.clientX - last.current.x
                const dy = e.clientY - last.current.y
                if (Math.abs(dx) > 2 || Math.abs(dy) > 2) hasMoved.current = true
                last.current = { x: e.clientX, y: e.clientY }
                onChange({ x: obj.x + dx, y: obj.y + dy })
            }}
            onPointerUp={() => { dragging.current = false }}
        >
            {children}
            {isSelected && (
                <>
                    <ResizeHandle position="nw" onResize={handleResize} />
                    <ResizeHandle position="ne" onResize={handleResize} />
                    <ResizeHandle position="sw" onResize={handleResize} />
                    <ResizeHandle position="se" onResize={handleResize} />
                    <ResizeHandle position="n" onResize={handleResize} />
                    <ResizeHandle position="s" onResize={handleResize} />
                    <ResizeHandle position="w" onResize={handleResize} />
                    <ResizeHandle position="e" onResize={handleResize} />
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

// ── Text Object ───────────────────────────────────────
function TextObj({ obj, isSelected, onSelect, onDelete, onChange }) {
    const [editing, setEditing] = useState(false)
    const textRef = useRef(null)
    const clickCount = useRef(0)
    const clickTimer = useRef(null)

    useEffect(() => {
        if (editing && textRef.current) textRef.current.focus()
    }, [editing])

    return (
        <ObjWrapper
            obj={{ ...obj, width: obj.width || 150, height: obj.height || 60 }}
            isSelected={isSelected}
            onSelect={() => { onSelect(); clickCount.current += 1; if (clickTimer.current) clearTimeout(clickTimer.current); clickTimer.current = setTimeout(() => { if (clickCount.current >= 2) setEditing(true); clickCount.current = 0 }, 300) }}
            onDelete={onDelete}
            onChange={onChange}
            extraStyle={{ border: '1px dashed var(--border)' }}
        >
            {editing ? (
                <textarea
                    ref={textRef}
                    defaultValue={obj.text || ''}
                    onBlur={(e) => { onChange({ text: e.target.value }); setEditing(false) }}
                    onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Escape') { onChange({ text: e.target.value }); setEditing(false) } }}
                    style={{
                        width: '100%', height: '100%',
                        background: 'transparent', border: 'none', outline: 'none', resize: 'none',
                        fontSize: obj.fontSize || 13, color: 'var(--text-primary)',
                        fontFamily: 'var(--font-body)', padding: 4, boxSizing: 'border-box', lineHeight: 1.4,
                    }}
                />
            ) : (
                <div style={{
                    width: '100%', height: '100%',
                    fontSize: obj.fontSize || 13, color: 'var(--text-primary)',
                    padding: 4, boxSizing: 'border-box',
                    whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflow: 'hidden',
                    pointerEvents: 'none',
                }}>
                    {obj.text || <span style={{ opacity: 0.4 }}>Double click to edit</span>}
                </div>
            )}
        </ObjWrapper>
    )
}

// ── Comment Object ────────────────────────────────────
function CommentObj({ obj, isSelected, onSelect, onDelete, onChange }) {
  const [editing, setEditing] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const textRef = useRef(null)
  const clickCount = useRef(0)
  const clickTimer = useRef(null)

  useEffect(() => {
    if (editing && textRef.current) textRef.current.focus()
  }, [editing])

  // Collapsed dot
  if (!expanded) {
    return (
      <div
        style={{
          position: 'absolute',
          left: obj.x, top: obj.y,
          width: 20, height: 20,
          borderRadius: '50%',
          background: '#f0c040',
          border: '2px solid #8a7000',
          cursor: 'pointer',
          zIndex: isSelected ? 10 : 2,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10,
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
          userSelect: 'none',
        }}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation()
          onSelect()
          setExpanded(true)
        }}
        title={obj.text || 'Comment'}
      >
        💬
      </div>
    )
  }

  // Expanded state
  return (
    <ObjWrapper
      obj={{ ...obj, width: obj.width || 160, height: obj.height || 80 }}
      isSelected={isSelected}
      onSelect={() => {
        onSelect()
        clickCount.current += 1
        if (clickTimer.current) clearTimeout(clickTimer.current)
        clickTimer.current = setTimeout(() => {
          if (clickCount.current >= 2) setEditing(true)
          clickCount.current = 0
        }, 300)
      }}
      onDelete={onDelete}
      onChange={onChange}
      extraStyle={{
        background: '#fffde7',
        border: '1px solid #f0c040',
        borderRadius: 4,
        boxShadow: '2px 2px 6px rgba(0,0,0,0.15)',
      }}
    >
      {/* Collapse button */}
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); setExpanded(false) }}
        style={{
          position: 'absolute', top: 2, right: 2,
          width: 16, height: 16,
          background: 'transparent', border: 'none',
          cursor: 'pointer', fontSize: 10,
          color: '#8a7000', zIndex: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >−</button>
      <div style={{
        padding: '3px 8px', fontSize: 10, fontWeight: 600,
        color: '#8a7000', borderBottom: '1px solid #f0c040', pointerEvents: 'none',
      }}>
        💬 Comment
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
          whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflow: 'hidden',
          height: 'calc(100% - 26px)', pointerEvents: 'none',
        }}>
          {obj.text || <span style={{ opacity: 0.5 }}>Double click to edit</span>}
        </div>
      )}
    </ObjWrapper>
  )
}

// ── Rectangle Object ──────────────────────────────────
function RectObj({ obj, isSelected, onSelect, onDelete, onChange }) {
    return (
        <ObjWrapper
            obj={{ ...obj, width: obj.width || 150, height: obj.height || 100 }}
            isSelected={isSelected}
            onSelect={onSelect}
            onDelete={onDelete}
            onChange={onChange}
        >
            <div style={{
                width: '100%', height: '100%',
                border: `2px solid ${obj.stroke || 'var(--text-primary)'}`,
                boxSizing: 'border-box', borderRadius: 2,
                pointerEvents: 'none',
            }} />
        </ObjWrapper>
    )
}

// ── Image Object ──────────────────────────────────────
function ImageObj({ obj, isSelected, onSelect, onDelete, onChange }) {
  const [expanded, setExpanded] = useState(false)

  // Collapsed dot
  if (!expanded) {
    return (
      <div
        style={{
          position: 'absolute',
          left: obj.x, top: obj.y,
          width: 20, height: 20,
          borderRadius: '50%',
          background: 'var(--accent)',
          border: '2px solid var(--text-secondary)',
          cursor: 'pointer',
          zIndex: isSelected ? 10 : 2,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10,
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
          userSelect: 'none',
          overflow: 'hidden',
        }}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation()
          onSelect()
          setExpanded(true)
        }}
        title="Image"
      >
        🖼
      </div>
    )
  }

  // Expanded state
  return (
    <ObjWrapper
      obj={{ ...obj, width: obj.width || 200, height: obj.height || 150 }}
      isSelected={isSelected}
      onSelect={onSelect}
      onDelete={onDelete}
      onChange={onChange}
      extraStyle={{ overflow: 'hidden', borderRadius: 2 }}
    >
      {/* Collapse button */}
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); setExpanded(false) }}
        style={{
          position: 'absolute', top: 4, right: 4,
          width: 20, height: 20,
          background: 'rgba(0,0,0,0.5)', border: 'none',
          cursor: 'pointer', fontSize: 11,
          color: 'white', zIndex: 10,
          borderRadius: 3,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >−</button>
      <img
        src={obj.src} alt=""
        style={{
          width: '100%', height: '100%',
          objectFit: 'cover', pointerEvents: 'none', display: 'block',
        }}
      />
    </ObjWrapper>
  )
}

// ── Drawing Canvas ────────────────────────────────────
function DrawingCanvas({ panel, pageIndex, sheet, activeTool, brushColor, brushSize }) {
    const canvasRef = useRef(null)
    const isDrawing = useRef(false)
    const lastPos = useRef(null)
    const savePanelDrawing = useStore(s => s.savePanelDrawing)

    // Restore drawing from store on mount
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas || !panel.drawing) return
        const img = new Image()
        img.onload = () => {
            canvas.getContext('2d').drawImage(img, 0, 0)
        }
        img.src = panel.drawing
    }, [panel.id])

    // Save drawing to store on unmount
    useEffect(() => {
        return () => {
            const canvas = canvasRef.current
            if (!canvas) return
            savePanelDrawing(sheet.id, pageIndex, panel.id, canvas.toDataURL())
        }
    }, [panel.id, pageIndex, sheet.id])

    const getPos = (e) => {
        const rect = canvasRef.current.getBoundingClientRect()
        return {
            x: (e.clientX - rect.left) * (canvasRef.current.width / rect.width),
            y: (e.clientY - rect.top) * (canvasRef.current.height / rect.height),
        }
    }

    const handlePointerDown = (e) => {
        if (activeTool !== 'pen' && activeTool !== 'eraser') return
        e.stopPropagation()
        e.currentTarget.setPointerCapture(e.pointerId)
        isDrawing.current = true
        const pos = getPos(e)
        lastPos.current = pos
        const ctx = canvasRef.current.getContext('2d')
        ctx.globalCompositeOperation = activeTool === 'eraser' ? 'destination-out' : 'source-over'
        ctx.fillStyle = activeTool === 'eraser' ? 'rgba(0,0,0,1)' : brushColor
        ctx.beginPath()
        ctx.arc(pos.x, pos.y, brushSize / 2, 0, Math.PI * 2)
        ctx.fill()
    }

    const handlePointerMove = (e) => {
        if (!isDrawing.current) return
        e.stopPropagation()
        const pos = getPos(e)
        const ctx = canvasRef.current.getContext('2d')
        ctx.globalCompositeOperation = activeTool === 'eraser' ? 'destination-out' : 'source-over'
        ctx.strokeStyle = activeTool === 'eraser' ? 'rgba(0,0,0,1)' : brushColor
        ctx.lineWidth = activeTool === 'eraser' ? brushSize * 3 : brushSize
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.beginPath()
        ctx.moveTo(lastPos.current.x, lastPos.current.y)
        ctx.lineTo(pos.x, pos.y)
        ctx.stroke()
        lastPos.current = pos
    }

    const handlePointerUp = () => {
        if (!isDrawing.current) return
        isDrawing.current = false
        lastPos.current = null
        // Save on every stroke end
        const canvas = canvasRef.current
        if (canvas) savePanelDrawing(sheet.id, pageIndex, panel.id, canvas.toDataURL())
    }

    const isDrawingTool = activeTool === 'pen' || activeTool === 'eraser'

    return (
        <canvas
            ref={canvasRef}
            width={1200}
            height={900}
            style={{
                position: 'absolute',
                top: 0, left: 0,
                width: '100%', height: '100%',
                cursor: activeTool === 'pen' ? 'crosshair' : activeTool === 'eraser' ? 'cell' : 'default',
                pointerEvents: isDrawingTool ? 'auto' : 'none',
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
        />
    )
}

// ── Main Panel ────────────────────────────────────────
export default function StoryboardPanel({ panel, pageIndex, sheet, isFocused, onFocus }) {
    const [selectedObjId, setSelectedObjId] = useState(null)
    const [labelEditing, setLabelEditing] = useState(false)
    const [labelValue, setLabelValue] = useState(panel.label)
    const panelRef = useRef(null)
    const fileInputRef = useRef(null)

    const activeTool = useStore(s => s.activeTool)
    const brushColor = useStore(s => s.brushColor)
    const brushSize = useStore(s => s.brushSize)
    const addPanelObject = useStore(s => s.addPanelObject)
    const updatePanelObject = useStore(s => s.updatePanelObject)
    const deletePanelObject = useStore(s => s.deletePanelObject)
    const updatePanelLabel = useStore(s => s.updatePanelLabel)

    // Deselect on Escape
    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === 'Escape') setSelectedObjId(null)
            if ((e.key === 'Delete' || e.key === 'Backspace') && selectedObjId) {
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
                deletePanelObject(sheet.id, pageIndex, panel.id, selectedObjId)
                setSelectedObjId(null)
            }
        }
        window.addEventListener('keydown', handleKey)
        return () => window.removeEventListener('keydown', handleKey)
    }, [selectedObjId, panel.id, pageIndex, sheet.id])

    const handleImageUpload = (e) => {
        const file = e.target.files[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = (ev) => {
            addPanelObject(sheet.id, pageIndex, panel.id, {
                type: 'image',
                src: ev.target.result,
                x: 20, y: 60,
                width: 200, height: 150,
            })
        }
        reader.readAsDataURL(file)
        e.target.value = ''
    }

    const handlePanelClick = (e) => {
        if (e.target !== e.currentTarget) return
        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        if (activeTool === 'rect') {
            addPanelObject(sheet.id, pageIndex, panel.id, {
                type: 'rect', x, y, width: 150, height: 100,
                stroke: brushColor,
            })
        } else if (activeTool === 'text') {
            addPanelObject(sheet.id, pageIndex, panel.id, {
                type: 'text', x, y, width: 150, height: 60, text: '', fontSize: 13,
            })
        } else if (activeTool === 'comment') {
            addPanelObject(sheet.id, pageIndex, panel.id, {
                type: 'comment', x, y, width: 160, height: 80, text: '',
            })
        } else if (activeTool === 'image') {
            fileInputRef.current?.click()
        } else {
            setSelectedObjId(null)
        }
    }

    const isObjectTool = ['select', 'text', 'comment', 'image', 'rect'].includes(activeTool)
    const isDrawingTool = activeTool === 'pen' || activeTool === 'eraser'

    return (
        <div
            ref={panelRef}
            style={{
                position: 'relative',
                width: '100%', height: '100%',
                background: 'var(--bg-surface)',
                border: '2px solid var(--border-strong)',
                boxSizing: 'border-box',
                overflow: 'hidden',
            }}
        >
            {/* Label badge */}
            <div style={{
                position: 'absolute', top: 6, left: 6, zIndex: 20,
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: 4, padding: '2px 8px',
                fontSize: 11, color: 'var(--text-secondary)',
                cursor: 'text', maxWidth: 140,
            }}>
                {labelEditing ? (
                    <input
                        autoFocus
                        value={labelValue}
                        onChange={e => setLabelValue(e.target.value)}
                        onBlur={() => {
                            updatePanelLabel(sheet.id, pageIndex, panel.id, labelValue)
                            setLabelEditing(false)
                        }}
                        onKeyDown={e => {
                            if (e.key === 'Enter' || e.key === 'Escape') {
                                updatePanelLabel(sheet.id, pageIndex, panel.id, labelValue)
                                setLabelEditing(false)
                            }
                            e.stopPropagation()
                        }}
                        style={{
                            background: 'transparent', border: 'none', outline: 'none',
                            fontSize: 11, color: 'var(--text-primary)', width: 120,
                        }}
                    />
                ) : (
                    <span onClick={() => setLabelEditing(true)}>
                        {panel.label || 'Panel'}
                    </span>
                )}
            </div>

            {/* Focus button */}
            {!isFocused && (
                <button
                    onClick={(e) => { e.stopPropagation(); onFocus() }}
                    title="Focus panel"
                    style={{
                        position: 'absolute', top: 6, right: 6, zIndex: 20,
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border)',
                        borderRadius: 4, padding: '2px 8px',
                        fontSize: 11, color: 'var(--text-secondary)', cursor: 'pointer',
                    }}
                >⤢ Focus</button>
            )}

            {/* Drawing canvas */}
            <DrawingCanvas
                panel={panel}
                pageIndex={pageIndex}
                sheet={sheet}
                activeTool={activeTool}
                brushColor={brushColor}
                brushSize={brushSize}
            />

            {/* Objects */}
            <div style={{
                position: 'absolute', inset: 0,
                pointerEvents: activeTool === 'select' ? 'auto' : 'none',
                zIndex: 6,
            }}>
                {panel.objects.map(obj => {
                    const commonProps = {
                        key: obj.id,
                        obj,
                        isSelected: obj.id === selectedObjId,
                        onSelect: () => setSelectedObjId(obj.id),
                        onChange: (changes) => updatePanelObject(sheet.id, pageIndex, panel.id, obj.id, changes),
                        onDelete: () => {
                            deletePanelObject(sheet.id, pageIndex, panel.id, obj.id)
                            setSelectedObjId(null)
                        },
                    }
                    if (obj.type === 'text') return <TextObj    {...commonProps} />
                    if (obj.type === 'comment') return <CommentObj {...commonProps} />
                    if (obj.type === 'rect') return <RectObj    {...commonProps} />
                    if (obj.type === 'image') return <ImageObj   {...commonProps} />
                    return null
                })}
            </div>

            {/* Object placement overlay — click to place new objects */}
            {['rect', 'text', 'comment', 'image'].includes(activeTool) && (
                <div
                    style={{
                        position: 'absolute', inset: 0,
                        zIndex: 15,
                        cursor: 'crosshair',
                        pointerEvents: 'auto',
                    }}
                    onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        const x = e.clientX - rect.left
                        const y = e.clientY - rect.top

                        if (activeTool === 'rect') {
                            addPanelObject(sheet.id, pageIndex, panel.id, {
                                type: 'rect', x, y, width: 150, height: 100,
                                stroke: brushColor,
                            })
                        } else if (activeTool === 'text') {
                            addPanelObject(sheet.id, pageIndex, panel.id, {
                                type: 'text', x, y, width: 150, height: 60, text: '', fontSize: 13,
                            })
                        } else if (activeTool === 'comment') {
                            addPanelObject(sheet.id, pageIndex, panel.id, {
                                type: 'comment', x, y, width: 160, height: 80, text: '',
                            })
                        } else if (activeTool === 'image') {
                            fileInputRef.current?.click()
                        }
                    }}
                />
            )}

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageUpload}
            />
        </div>
    )
}