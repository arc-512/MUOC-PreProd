import { useState, useRef, useEffect, useCallback } from 'react'
import useStore from '../../store'
import { Trash2, GitBranch } from 'lucide-react'

const NODE_WIDTH = 160
const NODE_HEIGHT = 60
const MIN_ZOOM = 0.2
const MAX_ZOOM = 4

// ── Edge (connector) ──────────────────────────────────
function Edge({ edge, nodes, isSelected, onSelect, onUpdateLabel }) {
  const [editingLabel, setEditingLabel] = useState(false)
  const [label, setLabel] = useState(edge.label || '')

  const fromNode = nodes.find(n => n.id === edge.fromId)
  const toNode = nodes.find(n => n.id === edge.toId)
  if (!fromNode || !toNode) return null

  const x1 = fromNode.x + NODE_WIDTH / 2
  const y1 = fromNode.y + NODE_HEIGHT / 2
  const x2 = toNode.x + NODE_WIDTH / 2
  const y2 = toNode.y + NODE_HEIGHT / 2

  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2

  const angle = Math.atan2(y2 - y1, x2 - x1)
  const arrowSize = 10
  const ax1 = x2 - arrowSize * Math.cos(angle - Math.PI / 7)
  const ay1 = y2 - arrowSize * Math.sin(angle - Math.PI / 7)
  const ax2 = x2 - arrowSize * Math.cos(angle + Math.PI / 7)
  const ay2 = y2 - arrowSize * Math.sin(angle + Math.PI / 7)

  // Shorten line so arrow doesn't overlap node border
  const shorten = 6
  const len = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
  const ex = len > 0 ? x2 - (shorten / len) * (x2 - x1) : x2
  const ey = len > 0 ? y2 - (shorten / len) * (y2 - y1) : y2

  return (
    <g>
      {/* Clickable wider invisible line */}
      <line
        x1={x1} y1={y1} x2={ex} y2={ey}
        stroke="transparent" strokeWidth={12}
        style={{ cursor: 'pointer' }}
        onClick={(e) => { e.stopPropagation(); onSelect() }}
      />
      {/* Visible line */}
      <line
        x1={x1} y1={y1} x2={ex} y2={ey}
        stroke={isSelected ? 'var(--accent)' : 'var(--text-secondary)'}
        strokeWidth={isSelected ? 2 : 1.5}
        style={{ pointerEvents: 'none' }}
      />
      {/* Arrow head */}
      <polygon
        points={`${x2},${y2} ${ax1},${ay1} ${ax2},${ay2}`}
        fill={isSelected ? 'var(--accent)' : 'var(--text-secondary)'}
        style={{ pointerEvents: 'none' }}
      />
      {/* Label */}
      {editingLabel ? (
        <foreignObject x={mx - 50} y={my - 14} width={100} height={28}>
          <input
            autoFocus
            value={label}
            onChange={e => setLabel(e.target.value)}
            onBlur={() => { onUpdateLabel(label); setEditingLabel(false) }}
            onKeyDown={(e) => {
              e.stopPropagation()
              if (e.key === 'Enter' || e.key === 'Escape') {
                onUpdateLabel(label)
                setEditingLabel(false)
              }
            }}
            style={{
              width: '100%', height: '100%',
              background: 'var(--bg-surface)',
              border: '1px solid var(--accent)',
              borderRadius: 3, outline: 'none',
              fontSize: 11, color: 'var(--text-primary)',
              textAlign: 'center', padding: '0 4px',
              boxSizing: 'border-box',
            }}
          />
        </foreignObject>
      ) : (
        <text
          x={mx} y={my - 6}
          textAnchor="middle"
          fontSize={11}
          fill={isSelected ? 'var(--accent)' : 'var(--text-secondary)'}
          style={{ cursor: 'pointer', userSelect: 'none' }}
          onClick={(e) => { e.stopPropagation(); onSelect(); setEditingLabel(true) }}
        >
          {edge.label || (isSelected ? '+ label' : '')}
        </text>
      )}
    </g>
  )
}

// ── Node ──────────────────────────────────────────────
function Node({ node, isSelected, isSecondSelected, onSelect, onUpdate, zoom }) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(node.label || '')
  const textareaRef = useRef(null)
  const dragging = useRef(false)
  const hasMoved = useRef(false)
  const last = useRef({ x: 0, y: 0 })
  const clickCount = useRef(0)
  const clickTimer = useRef(null)

  useEffect(() => {
    if (editing && textareaRef.current) textareaRef.current.focus()
  }, [editing])

  const borderColor = isSelected
    ? 'var(--accent)'
    : isSecondSelected
    ? '#f0c040'
    : 'var(--border-strong)'

  return (
    <div
      style={{
        position: 'absolute',
        left: node.x, top: node.y,
        width: NODE_WIDTH, height: NODE_HEIGHT,
        background: 'var(--bg-surface)',
        border: `2px solid ${borderColor}`,
        borderRadius: 6,
        boxSizing: 'border-box',
        cursor: editing ? 'text' : 'move',
        boxShadow: isSelected || isSecondSelected
          ? '0 4px 16px rgba(0,0,0,0.3)'
          : '0 2px 8px rgba(0,0,0,0.2)',
        userSelect: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: isSelected || isSecondSelected ? 10 : 1,
      }}
      onPointerDown={(e) => {
        if (editing) return
        e.stopPropagation()
        e.currentTarget.setPointerCapture(e.pointerId)
        dragging.current = true
        hasMoved.current = false
        last.current = { x: e.clientX, y: e.clientY }
        clickCount.current += 1
        if (clickTimer.current) clearTimeout(clickTimer.current)
        clickTimer.current = setTimeout(() => {
          if (clickCount.current >= 2 && !hasMoved.current) setEditing(true)
          clickCount.current = 0
        }, 300)
        onSelect()
      }}
      onPointerMove={(e) => {
        if (!dragging.current || editing) return
        e.stopPropagation()
        const dx = (e.clientX - last.current.x) / zoom
        const dy = (e.clientY - last.current.y) / zoom
        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) hasMoved.current = true
        last.current = { x: e.clientX, y: e.clientY }
        onUpdate({ x: node.x + dx, y: node.y + dy })
      }}
      onPointerUp={() => { dragging.current = false }}
    >
      {editing ? (
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onBlur={() => { onUpdate({ label: text }); setEditing(false) }}
          onKeyDown={(e) => {
            e.stopPropagation()
            if (e.key === 'Escape') { onUpdate({ label: text }); setEditing(false) }
          }}
          style={{
            width: '100%', height: '100%',
            background: 'transparent',
            border: 'none', outline: 'none', resize: 'none',
            fontSize: 13, color: 'var(--text-primary)',
            fontFamily: 'var(--font-body)',
            textAlign: 'center', padding: 8,
            boxSizing: 'border-box', lineHeight: 1.4,
          }}
        />
      ) : (
        <div style={{
          fontSize: 13, color: 'var(--text-primary)',
          padding: '4px 8px', textAlign: 'center',
          wordBreak: 'break-word', overflow: 'hidden',
          pointerEvents: 'none', lineHeight: 1.4,
        }}>
          {node.label || <span style={{ opacity: 0.4 }}>New Node</span>}
        </div>
      )}
    </div>
  )
}

// ── Main MindmapView ──────────────────────────────────
export default function MindmapView({ sheet }) {
  const addMindmapNode = useStore(s => s.addMindmapNode)
  const updateMindmapNode = useStore(s => s.updateMindmapNode)
  const deleteMindmapNode = useStore(s => s.deleteMindmapNode)
  const addMindmapEdge = useStore(s => s.addMindmapEdge)
  const updateMindmapEdge = useStore(s => s.updateMindmapEdge)
  const deleteMindmapEdge = useStore(s => s.deleteMindmapEdge)

  const nodes = sheet.mindmapNodes || []
  const edges = sheet.mindmapEdges || []

  const [selectedId, setSelectedId] = useState(null)
  const [secondId, setSecondId] = useState(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState(null)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)

  const isPanning = useRef(false)
  const hasMoved = useRef(false)
  const lastPan = useRef({ x: 0, y: 0 })
  const viewportRef = useRef(null)

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

  // Delete key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedEdgeId) {
          deleteMindmapEdge(sheet.id, selectedEdgeId)
          setSelectedEdgeId(null)
        } else if (selectedId) {
          deleteMindmapNode(sheet.id, selectedId)
          setSelectedId(null)
          setSecondId(null)
        }
      }
      if (e.key === 'Escape') {
        setSelectedId(null)
        setSecondId(null)
        setSelectedEdgeId(null)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [selectedId, selectedEdgeId, sheet.id])

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

  const handlePointerUp = () => {
    isPanning.current = false
  }

  // Double click canvas to create node
  const handleDoubleClick = (e) => {
    if (e.target !== e.currentTarget) return
    const rect = viewportRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left - pan.x) / zoom - NODE_WIDTH / 2
    const y = (e.clientY - rect.top - pan.y) / zoom - NODE_HEIGHT / 2
    addMindmapNode(sheet.id, { x, y, label: '' })
    setSelectedId(null)
    setSecondId(null)
    setSelectedEdgeId(null)
  }

  // Click canvas to deselect
  const handleClick = (e) => {
    if (e.target !== e.currentTarget) return
    setSelectedId(null)
    setSecondId(null)
    setSelectedEdgeId(null)
  }

  // Select node — first or second
  const handleNodeSelect = (nodeId) => {
    setSelectedEdgeId(null)
    if (!selectedId || selectedId === nodeId) {
      setSelectedId(nodeId)
      setSecondId(null)
    } else {
      setSecondId(nodeId)
    }
  }

  // Connect two selected nodes
  const handleConnect = () => {
    if (!selectedId || !secondId) return
    // Prevent duplicate edges
    const exists = edges.find(e =>
      (e.fromId === selectedId && e.toId === secondId) ||
      (e.fromId === secondId && e.toId === selectedId)
    )
    if (!exists) {
      addMindmapEdge(sheet.id, { fromId: selectedId, toId: secondId, label: '' })
    }
    setSelectedId(null)
    setSecondId(null)
  }

  const canConnect = selectedId && secondId && selectedId !== secondId

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
        flexShrink: 0, zIndex: 30,
      }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Double click canvas to add node · Double click node to edit
        </span>

        <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }} />

        {/* Connect button */}
        <button
          onClick={handleConnect}
          disabled={!canConnect}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '3px 10px', fontSize: 12,
            background: canConnect ? 'var(--accent)' : 'var(--bg-elevated)',
            color: canConnect ? 'white' : 'var(--text-muted)',
            border: `1px solid ${canConnect ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: 4, cursor: canConnect ? 'pointer' : 'default',
          }}
        >
          <GitBranch size={12} />
          {canConnect ? `Connect ${nodes.find(n => n.id === selectedId)?.label || 'Node'} → ${nodes.find(n => n.id === secondId)?.label || 'Node'}` : 'Connect (select 2 nodes)'}
        </button>

        {/* Delete selected */}
        {(selectedId || selectedEdgeId) && (
          <button
            onClick={() => {
              if (selectedEdgeId) {
                deleteMindmapEdge(sheet.id, selectedEdgeId)
                setSelectedEdgeId(null)
              } else if (selectedId) {
                deleteMindmapNode(sheet.id, selectedId)
                setSelectedId(null)
                setSecondId(null)
              }
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '3px 10px', fontSize: 12,
              background: '#e8462a', color: 'white',
              border: '1px solid #e8462a',
              borderRadius: 4, cursor: 'pointer',
            }}
          >
            <Trash2 size={12} /> Delete
          </button>
        )}

        <div style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>
          {Math.round(zoom * 100)}%
        </div>
      </div>

      {/* Viewport */}
      <div
        ref={viewportRef}
        style={{
          flex: 1, position: 'relative', overflow: 'hidden',
          cursor: 'default',
          background: 'var(--bg-base)',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onDoubleClick={handleDoubleClick}
        onClick={handleClick}
      >
        {/* Dot grid */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `radial-gradient(circle, var(--border-strong) 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
          pointerEvents: 'none',
        }} />

        {/* Pan + zoom container */}
        <div style={{
          position: 'absolute',
          left: pan.x, top: pan.y,
          transform: `scale(${zoom})`,
          transformOrigin: '0 0',
          width: 4000, height: 4000,
        }}>
          {/* SVG layer for edges */}
          <svg
            style={{
              position: 'absolute', top: 0, left: 0,
              width: '100%', height: '100%',
              pointerEvents: 'none', overflow: 'visible',
            }}
          >
            <g style={{ pointerEvents: 'all' }}>
              {edges.map(edge => (
                <Edge
                  key={edge.id}
                  edge={edge}
                  nodes={nodes}
                  isSelected={edge.id === selectedEdgeId}
                  onSelect={() => {
                    setSelectedEdgeId(edge.id)
                    setSelectedId(null)
                    setSecondId(null)
                  }}
                  onUpdateLabel={(label) => updateMindmapEdge(sheet.id, edge.id, { label })}
                />
              ))}
            </g>
          </svg>

          {/* Nodes */}
          {nodes.map(node => (
            <Node
              key={node.id}
              node={node}
              isSelected={node.id === selectedId}
              isSecondSelected={node.id === secondId}
              onSelect={() => handleNodeSelect(node.id)}
              onUpdate={(changes) => updateMindmapNode(sheet.id, node.id, changes)}
              zoom={zoom}
            />
          ))}
        </div>

        {/* Empty state */}
        {nodes.length === 0 && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>💡</div>
              <div>Double click anywhere to create your first node</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}