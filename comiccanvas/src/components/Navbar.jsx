import { Sun, Moon, Settings, GitBranch, Save, Download } from 'lucide-react'
import useStore from '../store'

export default function Navbar() {
  const theme = useStore(s => s.theme)
  const toggleTheme = useStore(s => s.toggleTheme)
  const openModal = useStore(s => s.openModal)
  const syncStatus = useStore(s => s.syncStatus)
  const syncMessage = useStore(s => s.syncMessage)
  const lastSynced = useStore(s => s.lastSynced)

  const syncLabel = {
    idle: lastSynced ? `Saved ${formatTime(lastSynced)}` : 'Not saved',
    syncing: 'Saving...',
    success: 'Saved to GitHub',
    error: syncMessage || 'Save failed',
    notify: syncMessage || 'New changes available',
  }[syncStatus] || ''

  return (
    <nav className="app-navbar">
      {/* Logo */}
      <a className="navbar-logo" href="#">
        <img src="/icon.svg" alt="ComicCanvas" className="navbar-logo-icon" />
        <span className="navbar-logo-text">
          COMIC<span>CANVAS</span>
        </span>
      </a>

      <div className="navbar-spacer" />

      {/* Sync status */}
      <div className={`navbar-sync-status ${syncStatus}`}>
        <span className={`sync-dot ${syncStatus === 'syncing' ? 'pulse' : ''}`} />
        {syncLabel}
      </div>

      {/* Save local */}
      <button
        className="navbar-btn"
        title="Save locally"
        onClick={() => openModal('saveLocal')}
      >
        <Save size={14} />
        Save Local
      </button>

      {/* Commit & Push */}
      <button
        className="navbar-btn primary"
        onClick={() => openModal('commit')}
      >
        <GitBranch size={14} />
        Commit & Push
      </button>

      {/* Export */}
      <button
        className="navbar-btn icon-only"
        title="Export"
        onClick={() => openModal('export')}
      >
        <Download size={15} />
      </button>

      {/* Theme toggle */}
      <button
        className="navbar-btn icon-only"
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        onClick={toggleTheme}
      >
        {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
      </button>

      {/* Settings */}
      <button
        className="navbar-btn icon-only"
        title="Settings"
        onClick={() => openModal('settings')}
      >
        <Settings size={15} />
      </button>
    </nav>
  )
}

function formatTime(ts) {
  const diff = Date.now() - ts
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  return `${Math.floor(diff / 3600000)}h ago`
}