import useStore from '../../store'
import InfiniteCanvas from './InfiniteCanvas'
import StoryboardView from '../Storyboard/StoryboardView'
import MoodboardView from '../Moodboard/Moodboard'
import MapView from '../Map/MapView'
import MindmapView from '../MindMap/MindMapView'

export default function CanvasArea() {
  const sheets = useStore(s => s.sheets)
  const activeSheetId = useStore(s => s.activeSheetId)
  const sheet = sheets.find(s => s.id === activeSheetId)

  if (!sheet) return (
    <div style={{
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--text-muted)',
      fontSize: 14,
      background: 'var(--bg-base)',
    }}>
      No sheet selected. Add one from the tabs above.
    </div>
  )

  const renderSheet = () => {
    switch (sheet.type) {
      case 'storyboard':
        return <StoryboardView sheet={sheet} />
      case 'moodboard':
        return <MoodboardView sheet={sheet} />
      case 'map':
      case 'location':
        return <MapView sheet={sheet} />
      case 'mindmap':
        return <MindmapView sheet={sheet} />
      case 'brainstorm':
      case 'timeline':
      default:
        return <InfiniteCanvas sheet={sheet} />
    }
  }

  return (
    <div style={{
      flex: 1,
      position: 'relative',
      overflow: 'hidden',
      background: 'var(--bg-base)',
    }}>
      {renderSheet()}
    </div>
  )
}