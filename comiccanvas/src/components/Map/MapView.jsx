import { useState, useRef, useEffect } from 'react'
import useStore from '../../store'
import { Trash2, Upload, Layers } from 'lucide-react'

const MIN_ZOOM = 0.2
const MAX_ZOOM = 8

// ── Location Pin ──────────────────────────────────────
function LocationPin({ pin, zoom, isSelected, onSelect, onUpdate, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const [editingCaption, setEditingCaption] = useState(false)
  const [caption, setCaption] = useState(pin.caption || '')
  const fileInputRef = useRef(null)
  const cardRef = useRef(null)

  const screenX = pin.mapX * zoom
  const screenY = pin.mapY * zoom

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => onUpdate({ image: ev.target.result })
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // Paste image into pin when expanded and card is focused
  useEffect(() => {
    if (!expanded) return
    const handlePaste = (e) => {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.stopPropagation()
          const file = item.getAsFile()
          const reader = new FileReader()
          reader.onload = (ev) => onUpdate({ image: ev.target.result })
          reader.readAsDataURL(file)
          break
        }
      }
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [expanded])

  return (
    <div
      style={{
        position: 'absolute',
        left: screenX, top: screenY,
        zIndex: expanded ? 20 : 10,
        transform: 'translate(-50%, -50%)',
        userSelect: 'none',
      }}
    >
      {/* Pin dot */}
      <div
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation()
          onSelect()
          setExpanded(v => !v)
        }}
        style={{
          width: 24, height: 24,
          borderRadius: '50% 50% 50% 0',
          transform: 'rotate(-45deg)',
          background: isSelected || expanded ? 'var(--accent)' : '#e8462a',
          border: '2px solid white',
          cursor: 'pointer',
          boxShadow: isSelected
            ? '0 0 0 3px var(--accent), 0 2px 8px rgba(0,0,0,0.4)'
            : '0 2px 8px rgba(0,0,0,0.4)',
          transition: 'background 0.15s, box-shadow 0.15s',
          position: 'relative', zIndex: 2,
        }}
      />

      {/* Expanded card */}
      {expanded && (
        <div
          ref={cardRef}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: 28, left: '50%',
            transform: 'translateX(-50%)',
            width: 220,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            overflow: 'hidden',
            zIndex: 30,
          }}
        >
          {/* Image area */}
          <div
            style={{
              width: '100%', height: 130,
              background: 'var(--bg-base)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', position: 'relative', overflow: 'hidden',
            }}
            onClick={() => !pin.image && fileInputRef.current?.click()}
          >
            {pin.image ? (
              <>
                <img
                  src={pin.image} alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
                <button
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
                  style={{
                    position: 'absolute', bottom: 4, right: 4,
                    fontSize: 10, padding: '2px 6px',
                    background: 'rgba(0,0,0,0.6)', color: 'white',
                    border: 'none', borderRadius: 3, cursor: 'pointer',
                  }}
                >Change</button>
              </>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, padding: 8 }}>
                <div style={{ fontSize: 24, marginBottom: 4 }}>🖼</div>
                <div>Click to upload</div>
                <div style={{ marginTop: 4, fontSize: 11, opacity: 0.7 }}>or Ctrl+V to paste</div>
              </div>
            )}
          </div>

          {/* Caption */}
          <div style={{ padding: '6px 8px' }}>
            {editingCaption ? (
              <textarea
                autoFocus
                value={caption}
                onChange={e => setCaption(e.target.value)}
                onBlur={() => { onUpdate({ caption }); setEditingCaption(false) }}
                onKeyDown={(e) => {
                  e.stopPropagation()
                  if (e.key === 'Escape') { onUpdate({ caption }); setEditingCaption(false) }
                }}
                placeholder="Add a caption..."
                style={{
                  width: '100%', minHeight: 50,
                  background: 'var(--bg-base)',
                  border: '1px solid var(--accent)',
                  borderRadius: 3, outline: 'none', resize: 'none',
                  fontSize: 12, color: 'var(--text-primary)',
                  fontFamily: 'var(--font-body)',
                  padding: 4, boxSizing: 'border-box', lineHeight: 1.4,
                }}
              />
            ) : (
              <div
                onClick={() => setEditingCaption(true)}
                style={{
                  fontSize: 12,
                  color: pin.caption ? 'var(--text-primary)' : 'var(--text-muted)',
                  cursor: 'text', minHeight: 36, padding: 4,
                  borderRadius: 3,
                  border: '1px dashed var(--border)',
                  lineHeight: 1.4,
                }}
              >
                {pin.caption || 'Click to add caption...'}
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '4px 8px', borderTop: '1px solid var(--border)',
          }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              📍 Location Pin
            </span>
            <button
              onClick={() => onDelete()}
              style={{
                fontSize: 10, padding: '2px 8px',
                background: '#e8462a', color: 'white',
                border: 'none', borderRadius: 3, cursor: 'pointer',
              }}
            >✕ Delete</button>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file" accept="image/*"
        style={{ display: 'none' }}
        onChange={handleImageUpload}
      />
    </div>
  )
}

// ── Drawing Canvas ─────────────────────────────────────
function MapDrawingCanvas({ layer, sheet, activeTool, brushColor, brushSize }) {
    const canvasRef = useRef(null)
    const isDrawing = useRef(false)
    const lastPos = useRef(null)
    const saveMapDrawing = useStore(s => s.saveMapDrawing)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas || !layer.drawing) return
        const img = new Image()
        img.onload = () => canvas.getContext('2d').drawImage(img, 0, 0)
        img.src = layer.drawing
    }, [layer.id])

    useEffect(() => {
        return () => {
            const canvas = canvasRef.current
            if (canvas) saveMapDrawing(sheet.id, layer.id, canvas.toDataURL())
        }
    }, [layer.id, sheet.id])

    const getPos = (e) => {
        const rect = canvasRef.current.getBoundingClientRect()
        return {
            x: (e.clientX - rect.left) * (canvasRef.current.width / rect.width),
            y: (e.clientY - rect.top) * (canvasRef.current.height / rect.height),
        }
    }

    const isDrawingTool = activeTool === 'pen' || activeTool === 'eraser'

    const handlePointerDown = (e) => {
        if (!isDrawingTool) return
        e.stopPropagation()
        e.currentTarget.setPointerCapture(e.pointerId)
        isDrawing.current = true
        const pos = getPos(e)
        lastPos.current = pos
        const ctx = canvasRef.current.getContext('2d')
        ctx.globalCompositeOperation = activeTool === 'eraser' ? 'destination-out' : 'source-over'
        ctx.fillStyle = brushColor
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
        const canvas = canvasRef.current
        if (canvas) saveMapDrawing(sheet.id, layer.id, canvas.toDataURL())
    }

    return (
        <canvas
            ref={canvasRef}
            width={3000} height={3000}
            style={{
                position: 'absolute', top: 0, left: 0,
                width: '100%', height: '100%',
                pointerEvents: isDrawingTool ? 'auto' : 'none',
                cursor: activeTool === 'pen' ? 'crosshair' : activeTool === 'eraser' ? 'cell' : 'default',
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
        />
    )
}

// ── Main MapView ──────────────────────────────────────
export default function MapView({ sheet }) {
    const addMapLayer = useStore(s => s.addMapLayer)
    const setActiveMapLayer = useStore(s => s.setActiveMapLayer)
    const deleteMapLayer = useStore(s => s.deleteMapLayer)
    const addMapPin = useStore(s => s.addMapPin)
    const updateMapPin = useStore(s => s.updateMapPin)
    const deleteMapPin = useStore(s => s.deleteMapPin)
    const activeTool = useStore(s => s.activeTool)
    const brushColor = useStore(s => s.brushColor)
    const brushSize = useStore(s => s.brushSize)

    const mapLayers = sheet.mapLayers || []
    const activeMapLayerId = sheet.activeMapLayer
    const activeLayer = mapLayers.find(l => l.id === activeMapLayerId)

    const [pan, setPan] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [selectedPinId, setSelectedPinId] = useState(null)
    const [pinPlacementMode, setPinPlacementMode] = useState(false)
    const [imgSize, setImgSize] = useState({ w: 1200, h: 800 })

    const isPanning = useRef(false)
    const hasMoved = useRef(false)
    const lastPan = useRef({ x: 0, y: 0 })
    const fileInputRef = useRef(null)
    const viewportRef = useRef(null)

    // Load image size
    useEffect(() => {
        if (!activeLayer?.src) return
        const img = new Image()
        img.onload = () => setImgSize({ w: img.naturalWidth, h: img.naturalHeight })
        img.src = activeLayer.src
    }, [activeLayer?.src])

    // Zoom with scroll
    useEffect(() => {
        const el = viewportRef.current
        if (!el) return
        const handleWheel = (e) => {
            e.preventDefault()
            const delta = e.deltaY > 0 ? 0.9 : 1.1
            setZoom(z => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z * delta)))
        }
        el.addEventListener('wheel', handleWheel, { passive: false })
        return () => el.removeEventListener('wheel', handleWheel)
    }, [])

    const handlePointerDown = (e) => {
        if (e.button !== 0) return
        isPanning.current = true
        hasMoved.current = false
        lastPan.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }
        e.currentTarget.setPointerCapture(e.pointerId)
    }

    const handlePointerMove = (e) => {
        if (!isPanning.current) return
        const dx = Math.abs(e.clientX - (lastPan.current.x + pan.x))
        const dy = Math.abs(e.clientY - (lastPan.current.y + pan.y))
        if (dx > 3 || dy > 3) hasMoved.current = true
        setPan({
            x: e.clientX - lastPan.current.x,
            y: e.clientY - lastPan.current.y,
        })
    }

    const handlePointerUp = (e) => {
        if (!hasMoved.current && pinPlacementMode && activeLayer) {
            const rect = viewportRef.current.getBoundingClientRect()
            const mapX = (e.clientX - rect.left - pan.x) / zoom
            const mapY = (e.clientY - rect.top - pan.y) / zoom
            addMapPin(sheet.id, activeLayer.id, {
                mapX, mapY, caption: '', image: null,
            })
            setPinPlacementMode(false)
        }
        isPanning.current = false
        hasMoved.current = false
    }

    const handleFileUpload = (e) => {
        const file = e.target.files[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = (ev) => addMapLayer(sheet.id, ev.target.result)
        reader.readAsDataURL(file)
        e.target.value = ''
    }

    return (
        <div style={{
            width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column',
            background: 'var(--bg-base)', overflow: 'hidden',
        }}>
            {/* Top bar */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 16px',
                borderBottom: '1px solid var(--border)',
                background: 'var(--bg-surface)',
                flexShrink: 0, zIndex: 30, flexWrap: 'wrap',
            }}>
                <Layers size={14} style={{ color: 'var(--text-muted)' }} />

                {/* Layer tabs */}
                {mapLayers.map(layer => (
                    <button
                        key={layer.id}
                        onClick={() => setActiveMapLayer(sheet.id, layer.id)}
                        style={{
                            padding: '3px 10px', fontSize: 12,
                            background: layer.id === activeMapLayerId ? 'var(--accent)' : 'var(--bg-elevated)',
                            color: layer.id === activeMapLayerId ? 'white' : 'var(--text-secondary)',
                            border: '1px solid var(--border)',
                            borderRadius: 4, cursor: 'pointer',
                        }}
                    >{layer.name}</button>
                ))}

                {/* Upload map */}
                <button
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        padding: '3px 10px', fontSize: 12,
                        background: 'var(--bg-elevated)',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border)',
                        borderRadius: 4, cursor: 'pointer',
                    }}
                >
                    <Upload size={12} /> Upload Map
                </button>

                {/* Delete layer */}
                {mapLayers.length > 1 && activeLayer && (
                    <button
                        onClick={() => deleteMapLayer(sheet.id, activeMapLayerId)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 4,
                            padding: '3px 10px', fontSize: 12,
                            background: 'transparent', color: 'var(--text-secondary)',
                            border: '1px solid var(--border)',
                            borderRadius: 4, cursor: 'pointer',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#e8462a'; e.currentTarget.style.borderColor = '#e8462a' }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border)' }}
                    >
                        <Trash2 size={12} /> Delete Layer
                    </button>
                )}

                <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }} />

                {/* Add Pin */}
                {activeLayer && (
                    <button
                        onClick={() => { setPinPlacementMode(v => !v); setSelectedPinId(null) }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 4,
                            padding: '3px 10px', fontSize: 12,
                            background: pinPlacementMode ? 'var(--accent)' : 'var(--bg-elevated)',
                            color: pinPlacementMode ? 'white' : 'var(--text-secondary)',
                            border: `1px solid ${pinPlacementMode ? 'var(--accent)' : 'var(--border)'}`,
                            borderRadius: 4, cursor: 'pointer',
                        }}
                    >
                        📍 {pinPlacementMode ? 'Click on map...' : 'Add Pin'}
                    </button>
                )}

                {/* Remove Pin */}
                {selectedPinId && (
                    <button
                        onClick={() => {
                            deleteMapPin(sheet.id, activeMapLayerId, selectedPinId)
                            setSelectedPinId(null)
                        }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 4,
                            padding: '3px 10px', fontSize: 12,
                            background: '#e8462a', color: 'white',
                            border: '1px solid #e8462a',
                            borderRadius: 4, cursor: 'pointer',
                        }}
                    >
                        <Trash2 size={12} /> Remove Pin
                    </button>
                )}

                <div style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>
                    {Math.round(zoom * 100)}% — Scroll to zoom, drag to pan
                </div>
            </div>

            {/* Viewport */}
            <div
                ref={viewportRef}
                style={{
                    flex: 1, position: 'relative', overflow: 'hidden',
                    cursor: pinPlacementMode ? 'crosshair'
                        : activeTool === 'pen' ? 'crosshair'
                            : activeTool === 'eraser' ? 'cell'
                                : 'grab',
                    background: 'var(--bg-base)',
                }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
            >
                {!activeLayer ? (
                    <div style={{
                        width: '100%', height: '100%',
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        gap: 12, color: 'var(--text-muted)',
                    }}>
                        <div style={{ fontSize: 40 }}>📍</div>
                        <div style={{ fontSize: 14 }}>No map uploaded yet</div>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '8px 16px', fontSize: 13,
                                background: 'var(--accent)', color: 'white',
                                border: 'none', borderRadius: 4, cursor: 'pointer',
                            }}
                        >
                            <Upload size={14} /> Upload Map Image
                        </button>
                    </div>
                ) : (
                    <div
                        style={{
                            position: 'absolute',
                            left: pan.x, top: pan.y,
                            width: imgSize.w * zoom,
                            height: imgSize.h * zoom,
                        }}
                    >
                        {/* Map image */}
                        <img
                            src={activeLayer.src} alt="map"
                            style={{
                                position: 'absolute', top: 0, left: 0,
                                width: '100%', height: '100%',
                                display: 'block', pointerEvents: 'none',
                                userSelect: 'none',
                            }}
                            draggable={false}
                        />

                        {/* Drawing canvas */}
                        <MapDrawingCanvas
                            layer={activeLayer}
                            sheet={sheet}
                            activeTool={activeTool}
                            brushColor={brushColor}
                            brushSize={brushSize}
                        />

                        {/* Pins */}
                        {activeLayer.pins.map(pin => (
                            <LocationPin
                                key={pin.id}
                                pin={pin}
                                zoom={zoom}
                                isSelected={pin.id === selectedPinId}
                                onSelect={() => setSelectedPinId(pin.id)}
                                onUpdate={(changes) => updateMapPin(sheet.id, activeLayer.id, pin.id, changes)}
                                onDelete={() => {
                                    deleteMapPin(sheet.id, activeLayer.id, pin.id)
                                    setSelectedPinId(null)
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file" accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
            />
        </div>
    )
}