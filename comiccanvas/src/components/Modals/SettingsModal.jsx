import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import useStore from '../../store'

export default function SettingsModal() {
  const closeModal = useStore(s => s.closeModal)
  const githubPAT = useStore(s => s.githubPAT)
  const githubRepo = useStore(s => s.githubRepo)
  const githubOwner = useStore(s => s.githubOwner)
  const setGithubConfig = useStore(s => s.setGithubConfig)
  const clearGithubConfig = useStore(s => s.clearGithubConfig)

  const [pat, setPat] = useState(githubPAT)
  const [repo, setRepo] = useState(githubRepo)
  const [owner, setOwner] = useState(githubOwner)
  const [showPat, setShowPat] = useState(false)

  const handleSave = () => {
    setGithubConfig({ pat, repo, owner })
    closeModal()
  }

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">SETTINGS</h2>
        <p className="modal-subtitle">
          Configure your GitHub repository to enable saving and syncing.
        </p>

        <div className="modal-field">
          <label className="modal-label">GitHub Username / Org</label>
          <input
            className="modal-input"
            placeholder="e.g. your-username"
            value={owner}
            onChange={e => setOwner(e.target.value)}
          />
        </div>

        <div className="modal-field">
          <label className="modal-label">Repository Name</label>
          <input
            className="modal-input"
            placeholder="e.g. my-comic-project"
            value={repo}
            onChange={e => setRepo(e.target.value)}
          />
        </div>

        <div className="modal-field">
          <label className="modal-label">Personal Access Token (PAT)</label>
          <div style={{ position: 'relative' }}>
            <input
              className="modal-input"
              type={showPat ? 'text' : 'password'}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              value={pat}
              onChange={e => setPat(e.target.value)}
              style={{ paddingRight: 36 }}
            />
            <button
              onClick={() => setShowPat(v => !v)}
              style={{
                position: 'absolute', right: 10, top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            >
              {showPat ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <p style={{
            fontSize: 10,
            color: 'var(--text-muted)',
            marginTop: 6,
            lineHeight: 1.5
          }}>
            Needs <code style={{
              background: 'var(--bg-base)',
              padding: '1px 4px',
              borderRadius: 3
            }}>repo</code> scope. Your PAT is stored in your browser's localStorage only.
          </p>
        </div>

        <div style={{
          background: 'var(--bg-base)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          padding: '10px 12px',
          fontSize: 11,
          color: 'var(--text-muted)',
          marginBottom: 16,
          lineHeight: 1.6,
        }}>
          💡 Data saves to the <strong style={{ color: 'var(--text-secondary)' }}>canvas</strong> branch.
          App code lives in the <strong style={{ color: 'var(--text-secondary)' }}>code</strong> branch.
        </div>

        <div className="modal-actions">
          {githubPAT && (
            <button
              className="modal-btn"
              style={{ color: 'var(--accent)', marginRight: 'auto' }}
              onClick={() => { clearGithubConfig(); closeModal() }}
            >
              Sign out
            </button>
          )}
          <button className="modal-btn secondary" onClick={closeModal}>Cancel</button>
          <button className="modal-btn primary" onClick={handleSave}>
            Save Settings
          </button>
        </div>
      </div>
    </div>
  )
}