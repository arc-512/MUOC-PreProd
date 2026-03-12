import { useCallback } from 'react'
import useStore from '../store'
import { saveProject, loadProject } from './githubapi'

export function useGithubSync() {
  const pat = useStore(s => s.githubPAT)
  const repo = useStore(s => s.githubRepo)
  const owner = useStore(s => s.githubOwner)
  const branch = useStore(s => s.githubBranch)
  const sheets = useStore(s => s.sheets)
  const setGithubStatus = useStore(s => s.setGithubStatus)
  const loadSheets = useStore(s => s.loadSheets)

  const fullRepo = owner && repo ? `${owner}/${repo}` : ''
  const isConfigured = !!(pat && fullRepo)

  const save = useCallback(async () => {
    if (!isConfigured) {
      setGithubStatus('error', 'GitHub not configured. Open Settings and add your PAT and repo.')
      return
    }
    try {
      setGithubStatus('saving')
      await saveProject(pat, fullRepo, branch, sheets)
      setGithubStatus('success')
      setTimeout(() => setGithubStatus('idle'), 3000)
    } catch (err) {
      setGithubStatus('error', err.message)
      setTimeout(() => setGithubStatus('idle'), 5000)
    }
  }, [pat, fullRepo, branch, sheets, setGithubStatus])

  const load = useCallback(async () => {
    if (!isConfigured) {
      setGithubStatus('error', 'GitHub not configured. Open Settings and add your PAT and repo.')
      return
    }
    try {
      setGithubStatus('loading')
      const loadedSheets = await loadProject(pat, fullRepo, branch)
      if (loadedSheets.length === 0) {
        setGithubStatus('error', 'No saved data found in this repo.')
        setTimeout(() => setGithubStatus('idle'), 4000)
        return
      }
      loadSheets(loadedSheets)
      setGithubStatus('success')
      setTimeout(() => setGithubStatus('idle'), 3000)
    } catch (err) {
      setGithubStatus('error', err.message)
      setTimeout(() => setGithubStatus('idle'), 5000)
    }
  }, [pat, fullRepo, branch, loadSheets, setGithubStatus])

  return { save, load, isConfigured }
}