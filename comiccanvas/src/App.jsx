import { useEffect } from 'react'
import useStore from './store'
import Navbar from './components/Navbar'
import SheetTabs from './components/Sheets/SheetTabs'
import Toolbar from './components/Toolbar/Toolbar'
import CanvasArea from './components/Canvas/CanvasArea'
import LayersPanel from './components/Layers/LayersPanel'
import ModalManager from './components/ModalManager'

export default function App() {
  const theme = useStore(s => s.theme)
  const sheets = useStore(s => s.sheets)
  const activeSheetId = useStore(s => s.activeSheetId)
  const setActiveSheet = useStore(s => s.setActiveSheet)
  const focusedPanelId = useStore(s => s.focusedPanelId)

  const activeSheet = sheets.find(s => s.id === activeSheetId)

  // Show layers panel only for:
  // - Brainstorm sheets (always)
  // - Storyboard sheets only when a panel is in focus mode
  const showLayersPanel = activeSheet && (
    activeSheet.type === 'brainstorm' ||
    (activeSheet.type === 'storyboard' && !!focusedPanelId)
  )

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    if (!activeSheetId && sheets.length > 0) {
      setActiveSheet(sheets[0].id)
    }
  }, [])

  useEffect(() => {
    const handleKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      const setActiveTool = useStore.getState().setActiveTool
      switch (e.key.toLowerCase()) {
        case 'v': setActiveTool('select'); break
        case 'b': setActiveTool('pen'); break
        case 'e': setActiveTool('eraser'); break
        case 'r': setActiveTool('rect'); break
        case 'c': setActiveTool('circle'); break
        case 't': setActiveTool('text'); break
        case 'a': setActiveTool('arrow'); break
        case 'p': setActiveTool('panel'); break
        case 'i': setActiveTool('image'); break
        case ' ':
          e.preventDefault()
          setActiveTool('pan')
          break
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  return (
    <div
      className="app-layout"
      style={{
        gridTemplateColumns: `var(--toolbar-w) 1fr ${showLayersPanel ? 'var(--layers-w)' : '0px'}`,
      }}
    >
      <Navbar />
      <SheetTabs />
      <Toolbar />
      <CanvasArea />
      {showLayersPanel && <LayersPanel />}
      <ModalManager />
    </div>
  )
}