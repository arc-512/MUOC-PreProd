import { useState, useRef, useEffect } from 'react'
import { Plus } from 'lucide-react'
import useStore, { SHEET_TYPES } from '../../store'

export default function SheetTabs() {
  const sheets = useStore(s => s.sheets)
  const activeSheetId = useStore(s => s.activeSheetId)
  const setActiveSheet = useStore(s => s.setActiveSheet)
  const openModal = useStore(s => s.openModal)

  const [contextMenu, setContextMenu] = useState(null)
  const [renamingId, setRenamingId] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const renameInputRef = useRef(null)

  // Set first sheet active on mount
  useEffect(() => {
    if (!activeSheetId && sheets.length > 0) {
      setActiveSheet(sheets[0].id)
    }
  }, [])

  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus()
      renameInputRef.current.select()
    }
  }, [renamingId])

  // Close context menu on outside click
  useEffect(() => {
    if (!contextMenu) return
    const close = () => setContextMenu(null)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [contextMenu])

  const handleRightClick = (e, sheetId) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, sheetId })
  }

  const startRename = (sheetId, currentName) => {
    setRenamingId(sheetId)
    setRenameValue(currentName)
    setContextMenu(null)
  }

  const commitRename = () => {
    if (renameValue.trim()) {
      useStore.getState().renameSheet(renamingId, renameValue.trim())
    }
    setRenamingId(null)
  }

  return (
    <>
      <div className="app-tabs">
        <div className="tabs-scroll">
          {sheets.map(sheet => {
            const typeMeta = SHEET_TYPES[sheet.type]
            const isActive = sheet.id === activeSheetId
            const isRenaming = sheet.id === renamingId

            return (
              <div
                key={sheet.id}
                className={`sheet-tab ${isActive ? 'active' : ''}`}
                onClick={() => setActiveSheet(sheet.id)}
                onContextMenu={(e) => handleRightClick(e, sheet.id)}
              >
                <span className="sheet-tab-icon">{typeMeta?.icon || '📄'}</span>
                {isRenaming ? (
                  <input
                    ref={renameInputRef}
                    className="layer-name-input"
                    value={renameValue}
                    onChange={e => setRenameValue(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={e => {
                      if (e.key === 'Enter') commitRename()
                      if (e.key === 'Escape') setRenamingId(null)
                    }}
                    onClick={e => e.stopPropagation()}
                    style={{ width: '100px' }}
                  />
                ) : (
                  <span className="sheet-tab-name">{sheet.name}</span>
                )}
              </div>
            )
          })}
        </div>

        {/* Add sheet button */}
        <button
          className="tabs-add-btn"
          title="Add sheet"
          onClick={() => openModal('addSheet')}
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          className="context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={e => e.stopPropagation()}
        >
          <button
            className="context-menu-item"
            onClick={() => {
              const sheet = sheets.find(s => s.id === contextMenu.sheetId)
              startRename(contextMenu.sheetId, sheet.name)
            }}
          >
            ✏️ Rename
          </button>
          <div className="context-menu-divider" />
          <button
            className="context-menu-item danger"
            onClick={() => {
              openModal('deleteSheet', { sheetId: contextMenu.sheetId })
              setContextMenu(null)
            }}
          >
            🗑️ Delete sheet
          </button>
        </div>
      )}
    </>
  )
}