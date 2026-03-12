import { Sun, Moon, Settings, GitBranch, FolderOpen, Loader } from 'lucide-react'
import useStore from '../store'
import { useGithubSync } from '../github/useGithubSync'

export default function Navbar() {
  const theme = useStore(s => s.theme)
  const toggleTheme = useStore(s => s.toggleTheme)
  const openModal = useStore(s => s.openModal)
  const githubStatus = useStore(s => s.githubStatus)
  const githubError = useStore(s => s.githubError)

  const { save, load, isConfigured } = useGithubSync()

  const statusLabel = {
    idle: isConfigured ? 'GitHub connected' : 'GitHub not configured',
    saving: 'Saving...',
    loading: 'Loading...',
    success: 'Saved ✓',
    error: githubError || 'Error',
  }[githubStatus] || ''

  const statusColor = {
    idle: isConfigured ? 'var(--text-muted)' : '#f0c040',
    saving: 'var(--accent)',
    loading: 'var(--accent)',
    success: '#4caf50',
    error: '#e8462a',
  }[githubStatus] || 'var(--text-muted)'

  const isBusy = githubStatus === 'saving' || githubStatus === 'loading'

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

      {/* Status */}
      <div style={{
        fontSize: 11,
        color: statusColor,
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '0 8px',
      }}>
        {isBusy && (
          <Loader size={11} style={{ animation: 'spin 1s linear infinite' }} />
        )}
        {statusLabel}
      </div>

      {/* Save to GitHub */}
      <button
        className="navbar-btn primary"
        title={isConfigured ? 'Save to GitHub' : 'Configure GitHub in Settings first'}
        onClick={save}
        disabled={isBusy}
        style={{ opacity: isBusy ? 0.6 : 1 }}
      >
        <GitBranch size={14} />
        Save
      </button>

      {/* Load from GitHub */}
      <button
        className="navbar-btn"
        title={isConfigured ? 'Load from GitHub' : 'Configure GitHub in Settings first'}
        onClick={load}
        disabled={isBusy}
        style={{ opacity: isBusy ? 0.6 : 1 }}
      >
        <FolderOpen size={14} />
        Load
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