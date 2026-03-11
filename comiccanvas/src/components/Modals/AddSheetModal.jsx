import { useState } from 'react'
import useStore, { SHEET_TYPES } from '../../store'

export default function AddSheetModal() {
  const closeModal = useStore(s => s.closeModal)
  const addSheet = useStore(s => s.addSheet)

  const [selectedType, setSelectedType] = useState('brainstorm')
  const [name, setName] = useState('')

  const handleAdd = () => {
    const finalName = name.trim() || SHEET_TYPES[selectedType].label
    addSheet(selectedType, finalName)
    closeModal()
  }

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">ADD SHEET</h2>
        <p className="modal-subtitle">Choose a sheet type and give it a name.</p>

        {/* Type picker */}
        <div className="modal-field">
          <label className="modal-label">Sheet Type</label>
          <div className="sheet-type-grid">
            {Object.entries(SHEET_TYPES).map(([key, meta]) => (
              <button
                key={key}
                className={`sheet-type-card ${selectedType === key ? 'selected' : ''}`}
                onClick={() => setSelectedType(key)}
              >
                <div className="sheet-type-card-icon">{meta.icon}</div>
                <div className="sheet-type-card-label">{meta.label}</div>
                <div className="sheet-type-card-desc">{meta.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div className="modal-field">
          <label className="modal-label">Sheet Name</label>
          <input
            className="modal-input"
            placeholder={SHEET_TYPES[selectedType].label}
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            autoFocus
          />
        </div>

        <div className="modal-actions">
          <button className="modal-btn secondary" onClick={closeModal}>Cancel</button>
          <button className="modal-btn primary" onClick={handleAdd}>
            Add Sheet
          </button>
        </div>
      </div>
    </div>
  )
}