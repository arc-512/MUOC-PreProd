import { useRef, useEffect, useState } from 'react'
import useStore from '../../store'

// ── Annotation Canvas store ───────────────────────────
const annotationStore = {}

function getAnnotationCanvas(panelId) {
    if (!annotationStore[panelId]) {
        const canvas = document.createElement('canvas')
        canvas.width = 1200
        canvas.height = 900
        canvas.style.position = 'absolute'
        canvas.style.top = '0'
        canvas.style.left = '0'
        canvas.style.width = '100%'
        canvas.style.height = '100%'
        annotationStore[panelId] = canvas
    }
    return annotationStore[panelId]
}

function isCanvasBlank(canvas) {
    const ctx = canvas.getContext('2d')
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
    return data.every(v => v === 0)
}

function restoreAnnotation(panelId, dataURL) {
    if (!dataURL) return
    const canvas = getAnnotationCanvas(panelId)
    const img = new Image()
    img.onload = () => {
        const ctx = canvas.getContext('2d')
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0)
    }
    img.src = dataURL
}

// ── Annotation Canvas Component ───────────────────────
function AnnotationCanvas({ panel, pageIndex, sheet, activeTool, brushColor, brushSize, brushType }) {
    const containerRef = useRef(null)
    const isDrawing = useRef(false)
    const lastPos = useRef(null)
    const lastRestored = useRef(null)
    const savePanelAnnotation = useStore(s => s.savePanelAnnotation)

    useEffect(() => {
        const container = containerRef.current
        if (!container) return
        const canvas = getAnnotationCanvas(panel.id)
        if (panel.annotation && isCanvasBlank(canvas) && lastRestored.current !== panel.annotation) {
            lastRestored.current = panel.annotation
            restoreAnnotation(panel.id, panel.annotation)
        }
        if (!container.contains(canvas)) container.appendChild(canvas)
        return () => {
            if (container.contains(canvas)) container.removeChild(canvas)
        }
    }, [panel.id])

    useEffect(() => {
        if (!panel.annotation) return
        if (lastRestored.current === panel.annotation) return
        const canvas = getAnnotationCanvas(panel.id)
        if (!isCanvasBlank(canvas)) return
        lastRestored.current = panel.annotation
        restoreAnnotation(panel.id, panel.annotation)
    }, [panel.annotation])

    useEffect(() => {
        const canvas = annotationStore[panel.id]
        if (!canvas) return
        const isDrawingTool = activeTool === 'pen' || activeTool === 'eraser'
        canvas.style.pointerEvents = isDrawingTool ? 'auto' : 'none'
        canvas.style.cursor = activeTool === 'pen' ? 'crosshair'
            : activeTool === 'eraser' ? 'cell' : 'default'
        canvas.style.zIndex = '5'
    }, [activeTool, panel.id])

    useEffect(() => {
        const canvas = annotationStore[panel.id]
        if (!canvas) return

        const getPos = (e) => {
            const rect = canvas.getBoundingClientRect()
            return {
                x: (e.clientX - rect.left) * (canvas.width / rect.width),
                y: (e.clientY - rect.top) * (canvas.height / rect.height),
            }
        }

        const onPointerDown = (e) => {
            if (activeTool !== 'pen' && activeTool !== 'eraser') return
            e.stopPropagation()
            canvas.setPointerCapture(e.pointerId)
            isDrawing.current = true
            const pos = getPos(e)
            lastPos.current = pos
            const ctx = canvas.getContext('2d')
            if (activeTool === 'eraser') {
                ctx.globalCompositeOperation = 'destination-out'
                ctx.beginPath()
                ctx.arc(pos.x, pos.y, brushSize * 1.5, 0, Math.PI * 2)
                ctx.fillStyle = 'rgba(0,0,0,1)'
                ctx.fill()
            } else if (brushType === 'soft') {
                ctx.globalCompositeOperation = 'source-over'
                const radius = Math.max(brushSize * 4, 20)
                const grad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, radius)
                grad.addColorStop(0, brushColor + 'cc')
                grad.addColorStop(0.4, brushColor + '66')
                grad.addColorStop(1, brushColor + '00')
                ctx.fillStyle = grad
                ctx.beginPath()
                ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2)
                ctx.fill()
            } else {
                ctx.globalCompositeOperation = 'source-over'
                ctx.fillStyle = brushColor
                ctx.beginPath()
                ctx.arc(pos.x, pos.y, brushSize / 2, 0, Math.PI * 2)
                ctx.fill()
            }
        }

        const onPointerMove = (e) => {
            if (!isDrawing.current) return
            e.stopPropagation()
            const pos = getPos(e)
            const ctx = canvas.getContext('2d')
            if (activeTool === 'eraser') {
                ctx.globalCompositeOperation = 'destination-out'
                ctx.strokeStyle = 'rgba(0,0,0,1)'
                ctx.lineWidth = brushSize * 3
                ctx.lineCap = 'round'
                ctx.lineJoin = 'round'
                ctx.beginPath()
                ctx.moveTo(lastPos.current.x, lastPos.current.y)
                ctx.lineTo(pos.x, pos.y)
                ctx.stroke()
            } else if (brushType === 'fineliner') {
                ctx.globalCompositeOperation = 'source-over'
                ctx.strokeStyle = brushColor
                ctx.lineWidth = Math.max(1, brushSize * 0.5)
                ctx.lineCap = 'round'
                ctx.lineJoin = 'round'
                ctx.beginPath()
                ctx.moveTo(lastPos.current.x, lastPos.current.y)
                ctx.lineTo(pos.x, pos.y)
                ctx.stroke()
            } else if (brushType === 'flat') {
                ctx.globalCompositeOperation = 'source-over'
                ctx.strokeStyle = brushColor
                ctx.lineWidth = brushSize * 2
                ctx.lineCap = 'square'
                ctx.lineJoin = 'miter'
                ctx.beginPath()
                ctx.moveTo(lastPos.current.x, lastPos.current.y)
                ctx.lineTo(pos.x, pos.y)
                ctx.stroke()
            } else if (brushType === 'soft') {
                const dx = pos.x - lastPos.current.x
                const dy = pos.y - lastPos.current.y
                const dist = Math.sqrt(dx * dx + dy * dy)
                const steps = Math.max(1, Math.floor(dist / (brushSize * 0.5)))
                for (let i = 0; i <= steps; i++) {
                    const t = steps === 0 ? 0 : i / steps
                    const sx = lastPos.current.x + dx * t
                    const sy = lastPos.current.y + dy * t
                    const radius = Math.max(brushSize * 4, 20)
                    const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, radius)
                    grad.addColorStop(0, brushColor + 'cc')
                    grad.addColorStop(0.4, brushColor + '66')
                    grad.addColorStop(1, brushColor + '00')
                    ctx.globalCompositeOperation = 'source-over'
                    ctx.fillStyle = grad
                    ctx.beginPath()
                    ctx.arc(sx, sy, radius, 0, Math.PI * 2)
                    ctx.fill()
                }
            }
            lastPos.current = pos
        }

        const onPointerUp = () => {
            if (!isDrawing.current) return
            isDrawing.current = false
            lastPos.current = null
            const data = canvas.toDataURL()
            lastRestored.current = data
            savePanelAnnotation(sheet.id, pageIndex, panel.id, data)
        }

        canvas.addEventListener('pointerdown', onPointerDown)
        canvas.addEventListener('pointermove', onPointerMove)
        canvas.addEventListener('pointerup', onPointerUp)
        canvas.addEventListener('pointerleave', onPointerUp)
        return () => {
            canvas.removeEventListener('pointerdown', onPointerDown)
            canvas.removeEventListener('pointermove', onPointerMove)
            canvas.removeEventListener('pointerup', onPointerUp)
            canvas.removeEventListener('pointerleave', onPointerUp)
        }
    }, [activeTool, brushColor, brushSize, brushType, panel.id, pageIndex, sheet.id])

    return (
        <div ref={containerRef} style={{ position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'none' }} />
    )
}

// ── Panel Preview (grid view) ─────────────────────────
function PanelPreview({ panel, onUpload }) {
    const fileInputRef = useRef(null)
    return (
        <div style={{ position: 'absolute', inset: 0, zIndex: 4 }}>
            {panel.image ? (
                <img
                    src={panel.image}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    alt=""
                />
            ) : (
                <div style={{
                    width: '100%', height: '100%',
                    border: '2px dashed var(--border)',
                    boxSizing: 'border-box',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--text-muted)', fontSize: 11, opacity: 0.4,
                    flexDirection: 'column', gap: 6,
                }}>
                    <span style={{ fontSize: 24 }}>🖼</span>
                    <span>No image</span>
                </div>
            )}
            {panel.annotation && (
                <img
                    src={panel.annotation}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill', pointerEvents: 'none' }}
                    alt=""
                />
            )}
            {/* Upload button — always visible in bottom right */}
            <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                    position: 'absolute', bottom: 8, right: 8, zIndex: 10,
                    background: 'rgba(0,0,0,0.65)', color: 'white',
                    border: '1px solid rgba(255,255,255,0.25)',
                    borderRadius: 6, padding: '5px 12px',
                    fontSize: 11, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6,
                }}
            >
                🖼 {panel.image ? 'Replace' : 'Upload'}
            </button>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                    const file = e.target.files[0]
                    if (!file) return
                    const reader = new FileReader()
                    reader.onload = (ev) => onUpload(ev.target.result)
                    reader.readAsDataURL(file)
                    e.target.value = ''
                }}
            />
        </div>
    )
}