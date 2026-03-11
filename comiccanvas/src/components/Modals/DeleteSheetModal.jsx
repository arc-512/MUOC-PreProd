import { useState } from 'react'
import useStore from '../../store'

export default function DeleteSheetModal() {
  const closeModal = useStore(s => s.closeModal)
  const modalData = useStore(s => s.modalData)
  const sheets = useStore(s => s.sheets)
  const deleteSheet = useStore(s => s.deleteSheet)

  const [reason, setReason] = useState('')

  const sheet = sheets.find(s => s.id === modalData?.sheetId)
  if (!sheet) return null

  const canDelete = reason.trim().length >= 3

  const handleDelete = () => {
    if (!canDelete) return
    deleteSheet(sheet.id)
    closeModal()
  }

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title" style={{ color: 'var(--accent)' }}>
          DELETE SHEET
        </h2>
        <p className="modal-subtitle">
          This action cannot be undone. All drawing layers and objects on this sheet will be permanently lost.
        </p>

        <div className="delete-warning">
          ⚠️ You are about to delete <strong>"{sheet.name}"</strong>
        </div>

        <p className="delete-confirm-label">
          Please provide a reason for deleting this sheet. This will be recorded in the commit history.
        </p>

        <div className="modal-field">
          <label className="modal-label">Reason for deletion</label>
          <input
            className="modal-input"
            placeholder="e.g. Replaced by new storyboard, no longer needed..."
            value={reason}
            onChange={e => setReason(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleDelete()}
            autoFocus
          />
        </div>

        <div className="modal-actions">
          <button className="modal-btn secondary" onClick={closeModal}>
            Cancel
          </button>
          <button
            className="modal-btn danger"
            onClick={handleDelete}
            disabled={!canDelete}
          >
            Delete Sheet
          </button>
        </div>
      </div>
    </div>
  )
}