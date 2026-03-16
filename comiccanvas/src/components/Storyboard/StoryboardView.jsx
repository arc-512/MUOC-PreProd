import { useEffect, useRef } from 'react'
import useStore from '../../store'
import StoryboardPanel from './StoryboardPanel'
import { ChevronLeft, ChevronRight, Plus, Trash2, X } from 'lucide-react'

function formatCreatedAt(ts) {
  if (!ts) return null
  const d = new Date(ts)
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function StoryboardView({ sheet }) {
  const addStoryboardPage = useStore(s => s.addStoryboardPage)
  const deleteStoryboardPage = useStore(s => s.deleteStoryboardPage)
  const setStoryboardPage = useStore(s => s.setStoryboardPage)
  const focusedPanelId = useStore(s => s.focusedPanelId)
  const setFocusedPanelId = useStore(s => s.setFocusedPanelId)
  const swapPanels = useStore(s => s.swapPanels)

  const dragPanelIndex = useRef(null)

  const pages = sheet.pages || []
  const activePage = sheet.activePage || 0
  const page = pages[activePage]

  useEffect(() => {
    setFocusedPanelId(null)
    return () => setFocusedPanelId(null)
  }, [sheet.id])

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') setFocusedPanelId(null)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  if (!page) return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'var(--text-muted)', fontSize: 14,
    }}>
      No pages yet.
      <button
        onClick={() => addStoryboardPage(sheet.id)}
        style={{
          marginLeft: 8, padding: '4px 12px',
          background: 'var(--accent)', color: 'white',
          border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13,
        }}
      >Add Page</button>
    </div>
  )

  const focusedPanel = focusedPanelId
    ? (page.panels.find(p => p.id === focusedPanelId) || null)
    : null

  const createdLabel = formatCreatedAt(sheet.createdAt)

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      background: 'var(--bg-base)', overflow: 'hidden',
    }}>

      {/* ── Top bar ──────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 16px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-surface)',
        flexShrink: 0, zIndex: 30,
      }}>
        <button
          onClick={() => setStoryboardPage(sheet.id, Math.max(0, activePage - 1))}
          disabled={activePage === 0}
          style={{
            width: 28, height: 28,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: activePage === 0 ? 'var(--text-muted)' : 'var(--text-secondary)',
            borderRadius: 'var(--radius-sm)',
            cursor: activePage === 0 ? 'default' : 'pointer',
            background: 'transparent', border: 'none',
          }}
        >
          <ChevronLeft size={16} />
        </button>

        <span style={{ fontSize: 12, color: 'var(--text-secondary)', minWidth: 80, textAlign: 'center' }}>
          Page {activePage + 1} of {pages.length}
        </span>

        <button
          onClick={() => setStoryboardPage(sheet.id, Math.min(pages.length - 1, activePage + 1))}
          disabled={activePage === pages.length - 1}
          style={{
            width: 28, height: 28,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: activePage === pages.length - 1 ? 'var(--text-muted)' : 'var(--text-secondary)',
            borderRadius: 'var(--radius-sm)',
            cursor: activePage === pages.length - 1 ? 'default' : 'pointer',
            background: 'transparent', border: 'none',
          }}
        >
          <ChevronRight size={16} />
        </button>

        <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }} />

        <button
          onClick={() => addStoryboardPage(sheet.id)}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '4px 10px',
            background: 'var(--accent)', color: 'white',
            border: 'none', borderRadius: 'var(--radius-sm)',
            fontSize: 12, cursor: 'pointer',
          }}
        >
          <Plus size={12} /> Add Page
        </button>
        {pages.length > 1 && (
          <button
            onClick={() => deleteStoryboardPage(sheet.id, activePage)}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '4px 10px',
              background: 'transparent', color: 'var(--text-secondary)',
              border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
              fontSize: 12, cursor: 'pointer',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#e8462a'; e.currentTarget.style.color = '#e8462a' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
          >
            <Trash2 size={12} /> Delete Page
          </button>
        )}

        {focusedPanel && (
          <>
            <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }} />
            <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>
              Focus: {focusedPanel.label}
            </span>
            <button
              onClick={() => setFocusedPanelId(null)}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '4px 10px',
                background: 'transparent', color: 'var(--text-secondary)',
                border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                fontSize: 12, cursor: 'pointer',
              }}
            >
              <X size={12} /> Exit Focus
            </button>
          </>
        )}

        {createdLabel && (
          <>
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.02em' }}>
              Created {createdLabel}
            </span>
          </>
        )}
      </div>

      {/* ── Content area ─────────────────────────────── */}
      <div style={{
        flex: 1,
        overflow: focusedPanel ? 'hidden' : 'auto',
        padding: focusedPanel ? 0 : 16,
        boxSizing: 'border-box',
      }}>
        {focusedPanel ? (
          <div style={{ width: '100%', height: '100%' }}>
            <StoryboardPanel
              key={focusedPanel.id}
              panel={focusedPanel}
              pageIndex={activePage}
              sheet={sheet}
              isFocused={true}
              onFocus={() => { }}
            />
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gridTemplateRows: 'repeat(3, 1fr)',
            gap: 12,
            width: '100%',
            minHeight: '100%',
            boxSizing: 'border-box',
          }}>
            {page.panels.map((panel, index) => (
              <div
                key={panel.id}
                draggable
                onDragStart={() => { dragPanelIndex.current = index }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragPanelIndex.current !== null && dragPanelIndex.current !== index) {
                    swapPanels(sheet.id, activePage, dragPanelIndex.current, index)
                  }
                  dragPanelIndex.current = null
                }}
                style={{ aspectRatio: '4/3', minHeight: 200, position: 'relative' }}
              >
                {/* Drag handle */}
                <div style={{
                  position: 'absolute', top: 6, left: 50, zIndex: 25,
                  color: 'var(--text-muted)', fontSize: 14,
                  cursor: 'grab', pointerEvents: 'none',
                  opacity: 0.4,
                }}>
                  ⠿
                </div>
                <StoryboardPanel
                  panel={panel}
                  pageIndex={activePage}
                  sheet={sheet}
                  isFocused={false}
                  onFocus={() => setFocusedPanelId(panel.id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}