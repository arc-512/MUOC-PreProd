import { useState, useRef, useEffect, useCallback } from 'react'
import useStore from '../../store'

const MIN_SIZE = 40

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
                width: 10,
                height: 10,
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
function ObjectWrapper({ obj, isSelected, onSelect, onChange, zoom, children, extraStyle, showHandles = true }) {
    const dragging = useRef(false)
    const last = useRef({ x: 0, y: 0 })
    const hasMoved = useRef(false)

    const handleResize = useCallback((handle, dx, dy) => {
        const dxw = dx / zoom
        const dyw = dy / zoom
        let { x, y } = obj
        let width = obj.width || 200
        let height = obj.height || 120

        if (handle.includes('e')) width = Math.max(MIN_SIZE, width + dxw)
        if (handle.includes('s')) height = Math.max(MIN_SIZE, height + dyw)
        if (handle.includes('w')) { x += dxw; width = Math.max(MIN_SIZE, width - dxw) }
        if (handle.includes('n')) { y += dyw; height = Math.max(MIN_SIZE, height - dyw) }

        onChange(obj.id, { x, y, width, height })
    }, [obj, onChange, zoom])

    return (
        <div
            style={{
                position: 'absolute',
                left: obj.x * zoom,
                top: obj.y * zoom,
                width: (obj.width || 200) * zoom,
                height: (obj.height || 120) * zoom,
                cursor: 'move',
                userSelect: 'none',
                outline: isSelected ? '2px solid var(--accent)' : 'none',
                outlineOffset: 2,
                boxSizing: 'border-box',
                ...extraStyle,
            }}
            onPointerDown={(e) => {
                e.stopPropagation()
                e.currentTarget.setPointerCapture(e.pointerId)
                onSelect(obj.id)
                dragging.current = true
                hasMoved.current = false
                last.current = { x: e.clientX, y: e.clientY }
            }}
            onPointerMove={(e) => {
                if (!dragging.current) return
                e.stopPropagation()
                const dx = e.clientX - last.current.x
                const dy = e.clientY - last.current.y
                if (Math.abs(dx) > 1 || Math.abs(dy) > 1) hasMoved.current = true
                last.current = { x: e.clientX, y: e.clientY }
                onChange(obj.id, {
                    x: obj.x + dx / zoom,
                    y: obj.y + dy / zoom,
                })
            }}
            onPointerUp={(e) => {
                e.stopPropagation()
                dragging.current = false
            }}
        >
            {children}
            {isSelected && showHandles && (
                <>
                    <ResizeHandle position="nw" onResize={handleResize} />
                    <ResizeHandle position="ne" onResize={handleResize} />
                    <ResizeHandle position="sw" onResize={handleResize} />
                    <ResizeHandle position="se" onResize={handleResize} />
                    <ResizeHandle position="n" onResize={handleResize} />
                    <ResizeHandle position="s" onResize={handleResize} />
                    <ResizeHandle position="w" onResize={handleResize} />
                    <ResizeHandle position="e" onResize={handleResize} />
                </>
            )}
        </div>
    )
}

// ── Rectangle ─────────────────────────────────────────
function RectObject({ obj, isSelected, onSelect, onChange, zoom }) {
    return (
        <ObjectWrapper
            obj={obj}
            isSelected={isSelected}
            onSelect={onSelect}
            onChange={onChange}
            zoom={zoom}
        >
            <div style={{
                width: '100%',
                height: '100%',
                border: `${obj.strokeWidth || 2}px solid ${obj.stroke || '#f0f0f4'}`,
                boxSizing: 'border-box',
                borderRadius: 2,
                pointerEvents: 'none',
            }} />
        </ObjectWrapper>
    )
}

// ── Speech Bubble ─────────────────────────────────────
function SpeechBubbleObject({ obj, isSelected, onSelect, onChange, zoom }) {
    const [editing, setEditing] = useState(false)
    const textRef = useRef(null)
    const clickCount = useRef(0)
    const clickTimer = useRef(null)

    const w = (obj.width || 180) * zoom
    const h = (obj.height || 120) * zoom
    const tailH = 24 * zoom

    useEffect(() => {
        if (editing && textRef.current) {
            textRef.current.focus()
            textRef.current.select()
        }
    }, [editing])

    const handlePointerDown = (e) => {
        e.stopPropagation()
        onSelect(obj.id)
        clickCount.current += 1
        if (clickTimer.current) clearTimeout(clickTimer.current)
        clickTimer.current = setTimeout(() => {
            if (clickCount.current >= 2) setEditing(true)
            clickCount.current = 0
        }, 250)
    }

    return (
        <ObjectWrapper
            obj={{ ...obj, height: (obj.height || 120) + 24 }}
            isSelected={isSelected}
            onSelect={onSelect}
            onChange={onChange}
            zoom={zoom}
            showHandles={!editing}
        >
            <svg
                width={w}
                height={h + tailH}
                style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
            >
                <path
                    d={`
            M ${16 * zoom} 0
            L ${w - 16 * zoom} 0
            Q ${w} 0 ${w} ${16 * zoom}
            L ${w} ${h - 16 * zoom}
            Q ${w} ${h} ${w - 16 * zoom} ${h}
            L ${(16 + 44) * zoom} ${h}
            L ${(16 + 24) * zoom} ${h + tailH}
            L ${(16 + 10) * zoom} ${h}
            L ${16 * zoom} ${h}
            Q 0 ${h} 0 ${h - 16 * zoom}
            L 0 ${16 * zoom}
            Q 0 0 ${16 * zoom} 0 Z
          `}
                    fill={obj.fill || 'white'}
                    stroke={obj.stroke || '#1a1a2e'}
                    strokeWidth={obj.strokeWidth || 2}
                />
            </svg>

            {editing ? (
                <textarea
                    ref={textRef}
                    defaultValue={obj.text || ''}
                    onBlur={(e) => {
                        onChange(obj.id, { text: e.target.value })
                        setEditing(false)
                    }}
                    onKeyDown={(e) => {
                        e.stopPropagation()
                        if (e.key === 'Escape') {
                            onChange(obj.id, { text: e.target.value })
                            setEditing(false)
                        }
                    }}
                    style={{
                        position: 'absolute',
                        top: '15%',
                        left: '10%',
                        width: '80%',
                        height: '55%',
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        resize: 'none',
                        textAlign: 'center',
                        fontSize: (obj.fontSize || 14) * zoom,
                        color: obj.textColor || '#1a1a2e',
                        fontFamily: 'var(--font-body)',
                        zIndex: 5,
                        cursor: 'text',
                    }}
                />
            ) : (
                <div
                    onPointerDown={handlePointerDown}
                    style={{
                        position: 'absolute',
                        top: '15%',
                        left: '10%',
                        width: '80%',
                        height: '55%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: (obj.fontSize || 14) * zoom,
                        color: obj.textColor || '#1a1a2e',
                        textAlign: 'center',
                        wordBreak: 'break-word',
                        overflow: 'hidden',
                        cursor: 'move',
                    }}
                >
                    {obj.text || <span style={{ opacity: 0.5 }}>Double click to edit</span>}
                </div>
            )}
        </ObjectWrapper>
    )
}

// ── Text Box ──────────────────────────────────────────
function TextBoxObject({ obj, isSelected, onSelect, onChange, zoom }) {
    const [editing, setEditing] = useState(false)
    const textRef = useRef(null)
    const clickCount = useRef(0)
    const clickTimer = useRef(null)
    const dragging = useRef(false)
    const last = useRef({ x: 0, y: 0 })
    const hasMoved = useRef(false)

    useEffect(() => {
        if (editing && textRef.current) {
            textRef.current.focus()
        }
    }, [editing])

    const handleResize = useCallback((handle, dx, dy) => {
        const dxw = dx / zoom
        const dyw = dy / zoom
        let { x, y } = obj
        let width = obj.width || 200
        let height = obj.height || 80

        if (handle.includes('e')) width = Math.max(MIN_SIZE, width + dxw)
        if (handle.includes('s')) height = Math.max(MIN_SIZE, height + dyw)
        if (handle.includes('w')) { x += dxw; width = Math.max(MIN_SIZE, width - dxw) }
        if (handle.includes('n')) { y += dyw; height = Math.max(MIN_SIZE, height - dyw) }

        onChange(obj.id, { x, y, width, height })
    }, [obj, onChange, zoom])

    const handlePointerDown = (e) => {
        if (editing) return
        e.stopPropagation()
        e.currentTarget.setPointerCapture(e.pointerId)
        onSelect(obj.id)
        dragging.current = true
        hasMoved.current = false
        last.current = { x: e.clientX, y: e.clientY }

        // Track double click manually
        clickCount.current += 1
        if (clickTimer.current) clearTimeout(clickTimer.current)
        clickTimer.current = setTimeout(() => {
            if (clickCount.current >= 2 && !hasMoved.current) {
                setEditing(true)
            }
            clickCount.current = 0
        }, 300)
    }

    const handlePointerMove = (e) => {
        if (!dragging.current || editing) return
        e.stopPropagation()
        const dx = e.clientX - last.current.x
        const dy = e.clientY - last.current.y
        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) hasMoved.current = true
        last.current = { x: e.clientX, y: e.clientY }
        onChange(obj.id, {
            x: obj.x + dx / zoom,
            y: obj.y + dy / zoom,
        })
    }

    const handlePointerUp = (e) => {
        dragging.current = false
    }

    return (
        <div
            style={{
                position: 'absolute',
                left: obj.x * zoom,
                top: obj.y * zoom,
                width: (obj.width || 200) * zoom,
                height: (obj.height || 80) * zoom,
                cursor: editing ? 'text' : 'move',
                userSelect: 'none',
                outline: isSelected ? '2px solid var(--accent)' : 'none',
                outlineOffset: 2,
                boxSizing: 'border-box',
                minWidth: 80 * zoom,
                minHeight: 30 * zoom,
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
        >
            {editing ? (
                <textarea
                    ref={textRef}
                    defaultValue={obj.text || ''}
                    onBlur={(e) => {
                        onChange(obj.id, { text: e.target.value })
                        setEditing(false)
                    }}
                    onKeyDown={(e) => {
                        e.stopPropagation()
                        if (e.key === 'Escape') {
                            onChange(obj.id, { text: e.target.value })
                            setEditing(false)
                        }
                    }}
                    style={{
                        width: '100%',
                        height: '100%',
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        resize: 'none',
                        fontSize: (obj.fontSize || 16) * zoom,
                        color: obj.fill || 'var(--text-primary)',
                        fontFamily: 'var(--font-body)',
                        lineHeight: 1.4,
                        padding: 4,
                        boxSizing: 'border-box',
                        cursor: 'text',
                    }}
                />
            ) : (
                <div style={{
                    width: '100%',
                    height: '100%',
                    fontSize: (obj.fontSize || 16) * zoom,
                    color: obj.fill || 'var(--text-primary)',
                    fontFamily: 'var(--font-body)',
                    lineHeight: 1.4,
                    padding: 4,
                    boxSizing: 'border-box',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    overflow: 'hidden',
                    pointerEvents: 'none',
                }}>
                    {obj.text || <span style={{ opacity: 0.4 }}>Double click to edit</span>}
                </div>
            )}
            {isSelected && !editing && (
                <>
                    <ResizeHandle position="nw" onResize={handleResize} />
                    <ResizeHandle position="ne" onResize={handleResize} />
                    <ResizeHandle position="sw" onResize={handleResize} />
                    <ResizeHandle position="se" onResize={handleResize} />
                    <ResizeHandle position="n" onResize={handleResize} />
                    <ResizeHandle position="s" onResize={handleResize} />
                    <ResizeHandle position="w" onResize={handleResize} />
                    <ResizeHandle position="e" onResize={handleResize} />
                </>
            )}
        </div>
    )
}

// ── Storyboard Table ──────────────────────────────────
function StoryboardObject({ obj, isSelected, onSelect, onChange, zoom }) {
    const cols = 9
    const rows = 9
    const totalW = (obj.width || (cols * (obj.cellW || 120) + 64)) * zoom
    const totalH = (obj.height || (rows * (obj.cellH || 90))) * zoom
    const headerW = 64 * zoom
    const cellW = (totalW - headerW) / cols
    const cellH = totalH / rows

    return (
        <ObjectWrapper
            obj={{
                ...obj,
                width: obj.width || (cols * (obj.cellW || 120) + 64),
                height: obj.height || (rows * (obj.cellH || 90)),
            }}
            isSelected={isSelected}
            onSelect={onSelect}
            onChange={onChange}
            zoom={zoom}
        >
            <svg
                width={totalW}
                height={totalH}
                style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
            >
                {/* Header column background */}
                <rect width={headerW} height={totalH} fill="rgba(255,255,255,0.08)" />

                {/* Outer border */}
                <rect width={totalW} height={totalH} fill="none"
                    stroke={obj.stroke || '#f0f0f4'} strokeWidth={2} />

                {/* Header right border */}
                <line x1={headerW} y1={0} x2={headerW} y2={totalH}
                    stroke={obj.stroke || '#f0f0f4'} strokeWidth={2} />

                {/* Horizontal lines */}
                {Array.from({ length: rows - 1 }, (_, r) => (
                    <line key={`h${r}`}
                        x1={0} y1={(r + 1) * cellH}
                        x2={totalW} y2={(r + 1) * cellH}
                        stroke={obj.stroke || '#f0f0f4'} strokeWidth={1} />
                ))}

                {/* Vertical lines */}
                {Array.from({ length: cols - 1 }, (_, c) => (
                    <line key={`v${c}`}
                        x1={headerW + (c + 1) * cellW} y1={0}
                        x2={headerW + (c + 1) * cellW} y2={totalH}
                        stroke={obj.stroke || '#f0f0f4'} strokeWidth={1} />
                ))}

                {/* Row scene labels */}
                {Array.from({ length: rows }, (_, r) => (
                    <text key={`row${r}`}
                        x={headerW / 2}
                        y={r * cellH + cellH / 2 + 4}
                        textAnchor="middle"
                        fontSize={10 * zoom}
                        fill={obj.stroke || '#f0f0f4'}
                        fontWeight="bold"
                    >Scene {r + 1}</text>
                ))}

                {/* Cell numbers */}
                {Array.from({ length: rows }, (_, r) =>
                    Array.from({ length: cols }, (_, c) => (
                        <text key={`cell${r}_${c}`}
                            x={headerW + c * cellW + 6}
                            y={r * cellH + 14}
                            fontSize={9 * zoom}
                            fill={obj.stroke || '#f0f0f4'}
                            opacity={0.5}
                        >{r + 1}.{c + 1}</text>
                    ))
                )}
            </svg>
        </ObjectWrapper>
    )
}

// ── Main ObjectLayer ──────────────────────────────────
export default function ObjectLayer({ zoom, pan, viewportW, viewportH, sheet }) {
    const selectedObjectId = useStore(s => s.selectedObjectId)
    const setSelectedObject = useStore(s => s.setSelectedObject)
    const updateObject = useStore(s => s.updateObject)
    const addObject = useStore(s => s.addObject)
    const deleteObject = useStore(s => s.deleteObject)
    const activeTool = useStore(s => s.activeTool)
    const brushColor = useStore(s => s.brushColor)

    useEffect(() => {
        const handleKey = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
            if ((e.key === 'Delete' || e.key === 'Backspace') && selectedObjectId) {
                deleteObject(sheet.id, selectedObjectId)
                setSelectedObject(null)
            }
        }
        window.addEventListener('keydown', handleKey)
        return () => window.removeEventListener('keydown', handleKey)
    }, [selectedObjectId, sheet.id, deleteObject, setSelectedObject])

    const handleLayerClick = (e) => {
        if (e.target !== e.currentTarget) return
        const rect = e.currentTarget.getBoundingClientRect()
        const wx = (e.clientX - rect.left - pan.x) / zoom
        const wy = (e.clientY - rect.top - pan.y) / zoom

        if (activeTool === 'rect') {
            addObject(sheet.id, { type: 'rect', x: wx, y: wy, width: 200, height: 120, stroke: brushColor })
        } else if (activeTool === 'speech') {
            addObject(sheet.id, { type: 'speech', x: wx, y: wy, width: 180, height: 120, stroke: brushColor, text: '' })
        } else if (activeTool === 'storyboard') {
            addObject(sheet.id, { type: 'storyboard', x: wx, y: wy, cellW: 120, cellH: 90, stroke: brushColor })
        } else if (activeTool === 'text') {
            addObject(sheet.id, { type: 'text', x: wx, y: wy, width: 200, height: 80, text: '', fontSize: 16, fill: brushColor })
        } else {
            setSelectedObject(null)
        }
    }

    const isSelectTool = activeTool === 'select'
    const isObjectTool = ['rect', 'speech', 'storyboard', 'text'].includes(activeTool)

    const commonProps = (obj) => ({
        key: obj.id,
        obj,
        isSelected: obj.id === selectedObjectId,
        onSelect: setSelectedObject,
        onChange: (id, changes) => updateObject(sheet.id, id, changes),
        zoom,
    })

    return (
        <div
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: viewportW,
                height: viewportH,
                pointerEvents: isSelectTool || isObjectTool ? 'auto' : 'none',
                overflow: 'hidden',
            }}
            onClick={handleLayerClick}
        >
            <div style={{
                position: 'absolute',
                top: pan.y,
                left: pan.x,
                width: 0,
                height: 0,
            }}>
                {sheet.objects.map(obj => {
                    switch (obj.type) {
                        case 'rect': return <RectObject         {...commonProps(obj)} />
                        case 'speech': return <SpeechBubbleObject  {...commonProps(obj)} />
                        case 'storyboard': return <StoryboardObject    {...commonProps(obj)} />
                        case 'text': return <TextBoxObject       {...commonProps(obj)} />
                        default: return null
                    }
                })}
            </div>
        </div>
    )
}