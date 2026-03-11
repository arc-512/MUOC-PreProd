import useStore from '../../store'
import {
  MousePointer2, Pen, Eraser, Square, Circle, Triangle,
  Type, Image, Link2, Maximize2, Move, AlignLeft, Grid3x3, Ruler
} from 'lucide-react'

function ArrowIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="2" y1="14" x2="13" y2="3" />
      <polyline points="7,3 13,3 13,9" />
    </svg>
  )
}

function SpeechBubbleIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 3 Q2 1 4 1 H12 Q14 1 14 3 V8 Q14 10 12 10 H6 L3 13 V10 H4 Q2 10 2 8 Z" />
    </svg>
  )
}

const TOOL_GROUPS = [
  {
    tools: [
      { id: 'select', icon: MousePointer2, label: 'Select / Move (V)' },
      { id: 'pan', icon: Move, label: 'Pan Canvas (Space)' },
    ]
  },
  {
    tools: [
      { id: 'pen', icon: Pen, label: 'Pen / Brush (B)' },
      { id: 'eraser', icon: Eraser, label: 'Eraser (E)' },
    ]
  },
  {
    tools: [
      { id: 'rect', icon: Square, label: 'Rectangle (R)' },
      { id: 'circle', icon: Circle, label: 'Circle (C)' },
      { id: 'triangle', icon: Triangle, label: 'Triangle' },
      { id: 'arrow', icon: ArrowIcon, label: 'Arrow (A)' },
      { id: 'speech', icon: SpeechBubbleIcon, label: 'Speech Bubble' },
      { id: 'caption', icon: AlignLeft, label: 'Caption Box' },
      { id: 'panel', icon: Maximize2, label: 'Panel Frame (P)' },
    ]
  },
  {
    tools: [
      { id: 'text', icon: Type, label: 'Text (T)' },
      { id: 'image', icon: Image, label: 'Image (I)' },
      { id: 'link', icon: Link2, label: 'Link' },
    ]
  },
  {
    tools: [
      { id: 'ruler', icon: Ruler, label: 'Rulers (Shift+R)' },
      { id: 'grid', icon: Grid3x3, label: 'Grid (Shift+G)' },
    ]
  },
]

export default function Toolbar() {
  const activeTool = useStore(s => s.activeTool)
  const setActiveTool = useStore(s => s.setActiveTool)
  const brushColor = useStore(s => s.brushColor)
  const brushSize = useStore(s => s.brushSize)
  const setBrushSize = useStore(s => s.setBrushSize)
  const openModal = useStore(s => s.openModal)

  return (
    <div className="app-toolbar">
      <div className="toolbar">
        {TOOL_GROUPS.map((group, gi) => (
          <div key={gi}>
            {gi > 0 && <div className="toolbar-divider" />}
            <div className="toolbar-group">
              {group.tools.map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  className={`tool-btn ${activeTool === id ? 'active' : ''}`}
                  onClick={() => setActiveTool(id)}
                >
                  <Icon size={16} />
                  <span className="tooltip">{label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Colour swatch */}
        <div className="toolbar-divider" />
        <div className="toolbar-group">
          <button
            className="colour-swatch"
            style={{ background: brushColor }}
            title="Colour picker"
            onClick={() => openModal('colourPicker')}
          />
        </div>

        {/* Brush size */}
        <div className="toolbar-group" style={{ marginTop: 6 }}>
          {[2, 4, 8, 14].map(size => (
            <button
              key={size}
              className={`tool-btn ${brushSize === size ? 'active' : ''}`}
              onClick={() => setBrushSize(size)}
            >
              <div style={{
                width: Math.min(size + 4, 20),
                height: Math.min(size + 4, 20),
                borderRadius: '50%',
                background: 'currentColor',
              }} />
              <span className="tooltip">Size {size}px</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}