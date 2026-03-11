import useStore from '../store'
import AddSheetModal from './Modals/AddSheetModal'
import DeleteSheetModal from './Modals/DeleteSheetModal'
import SettingsModal from './Modals/SettingsModal'

export default function ModalManager() {
  const activeModal = useStore(s => s.activeModal)

  switch (activeModal) {
    case 'addSheet': return <AddSheetModal />
    case 'deleteSheet': return <DeleteSheetModal />
    case 'settings': return <SettingsModal />
    default: return null
  }
}