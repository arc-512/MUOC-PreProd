import { create } from 'zustand'

const SHEET_TYPES = {
  storyboard: {
    label: 'Storyboard',
    icon: '🎬',
    description: 'Scene table with structured columns',
  },
  timeline: {
    label: 'Timeline',
    icon: '🕐',
    description: 'Swimlane layout for plot threads',
  },
  moodboard: {
    label: 'Moodboard',
    icon: '🎨',
    description: 'Free canvas with preset heading',
  },
  brainstorm: {
    label: 'Brainstorm',
    icon: '🧠',
    description: 'Plain infinite canvas',
  },
  character: {
    label: 'Character Sheet',
    icon: '👤',
    description: 'Character profile template',
  },
  location: {
    label: 'Location Sheet',
    icon: '📍',
    description: 'Location profile template',
  },
}

const createSheet = (type, name) => ({
  id: `sheet-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  type,
  name,
  createdAt: Date.now(),
  layers: [
    { id: 'layer-1', name: 'Layer 1', visible: true, locked: false },
  ],
  activeLayer: 'layer-1',
  objects: [],
  background: null,
})

const useStore = create((set, get) => ({
  // ── Theme ──────────────────────────────────────────────
  theme: localStorage.getItem('cc-theme') || 'dark',
  toggleTheme: () => set(s => {
    const next = s.theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem('cc-theme', next)
    return { theme: next }
  }),

  // ── Sheets ─────────────────────────────────────────────
  sheets: [
    createSheet('storyboard', 'Storyboard'),
    createSheet('timeline', 'Timeline'),
    createSheet('brainstorm', 'Brainstorm'),
  ],
  activeSheetId: null,

  setActiveSheet: (id) => set({ activeSheetId: id }),

  addSheet: (type, name) => {
    const sheet = createSheet(type, name)
    set(s => ({
      sheets: [...s.sheets, sheet],
      activeSheetId: sheet.id,
    }))
  },

  renameSheet: (id, name) => set(s => ({
    sheets: s.sheets.map(sh => sh.id === id ? { ...sh, name } : sh),
  })),

  deleteSheet: (id) => set(s => {
    const sheets = s.sheets.filter(sh => sh.id !== id)
    const activeSheetId = s.activeSheetId === id
      ? (sheets[0]?.id || null)
      : s.activeSheetId
    return { sheets, activeSheetId }
  }),

  // ── Layers ─────────────────────────────────────────────
  addLayer: (sheetId) => set(s => ({
    sheets: s.sheets.map(sh => {
      if (sh.id !== sheetId) return sh
      const newLayer = {
        id: `layer-${Date.now()}`,
        name: `Layer ${sh.layers.length + 1}`,
        visible: true,
        locked: false,
      }
      return { ...sh, layers: [...sh.layers, newLayer], activeLayer: newLayer.id }
    }),
  })),

  deleteLayer: (sheetId, layerId) => set(s => ({
    sheets: s.sheets.map(sh => {
      if (sh.id !== sheetId) return sh
      if (sh.layers.length <= 1) return sh
      const layers = sh.layers.filter(l => l.id !== layerId)
      const activeLayer = sh.activeLayer === layerId ? layers[0]?.id : sh.activeLayer
      return { ...sh, layers, activeLayer }
    }),
  })),

  renameLayer: (sheetId, layerId, name) => set(s => ({
    sheets: s.sheets.map(sh => sh.id !== sheetId ? sh : {
      ...sh,
      layers: sh.layers.map(l => l.id === layerId ? { ...l, name } : l),
    }),
  })),

  toggleLayerVisibility: (sheetId, layerId) => set(s => ({
    sheets: s.sheets.map(sh => sh.id !== sheetId ? sh : {
      ...sh,
      layers: sh.layers.map(l => l.id === layerId ? { ...l, visible: !l.visible } : l),
    }),
  })),

  toggleLayerLock: (sheetId, layerId) => set(s => ({
    sheets: s.sheets.map(sh => sh.id !== sheetId ? sh : {
      ...sh,
      layers: sh.layers.map(l => l.id === layerId ? { ...l, locked: !l.locked } : l),
    }),
  })),

  setActiveLayer: (sheetId, layerId) => set(s => ({
    sheets: s.sheets.map(sh => sh.id !== sheetId ? sh : { ...sh, activeLayer: layerId }),
  })),

  reorderLayers: (sheetId, layers) => set(s => ({
    sheets: s.sheets.map(sh => sh.id !== sheetId ? sh : { ...sh, layers }),
  })),

  // ── Active Tool ────────────────────────────────────────
  activeTool: 'select',
  setActiveTool: (tool) => set({ activeTool: tool }),

  // ── Brush Settings ─────────────────────────────────────
  brushColor: '#f0f0f4',
  brushSize: 4,
  brushOpacity: 1,
  setBrushColor: (brushColor) => set({ brushColor }),
  setBrushSize: (brushSize) => set({ brushSize }),
  setBrushOpacity: (brushOpacity) => set({ brushOpacity }),

  // ── GitHub Settings ────────────────────────────────────
  githubPAT: localStorage.getItem('cc-github-pat') || '',
  githubRepo: localStorage.getItem('cc-github-repo') || '',
  githubOwner: localStorage.getItem('cc-github-owner') || '',
  setGithubConfig: ({ pat, repo, owner }) => {
    if (pat !== undefined) localStorage.setItem('cc-github-pat', pat)
    if (repo !== undefined) localStorage.setItem('cc-github-repo', repo)
    if (owner !== undefined) localStorage.setItem('cc-github-owner', owner)
    set(s => ({
      githubPAT: pat ?? s.githubPAT,
      githubRepo: repo ?? s.githubRepo,
      githubOwner: owner ?? s.githubOwner,
    }))
  },
  clearGithubConfig: () => {
    localStorage.removeItem('cc-github-pat')
    localStorage.removeItem('cc-github-repo')
    localStorage.removeItem('cc-github-owner')
    set({ githubPAT: '', githubRepo: '', githubOwner: '' })
  },

  // ── Modals ─────────────────────────────────────────────
  activeModal: null,
  modalData: null,
  openModal: (name, data = null) => set({ activeModal: name, modalData: data }),
  closeModal: () => set({ activeModal: null, modalData: null }),

  // ── Objects ────────────────────────────────────────────
  addObject: (sheetId, object) => set(s => ({
    sheets: s.sheets.map(sh => sh.id !== sheetId ? sh : {
      ...sh,
      objects: [...sh.objects, {
        id: `obj-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        ...object,
      }]
    })
  })),

  updateObject: (sheetId, objectId, changes) => set(s => ({
    sheets: s.sheets.map(sh => sh.id !== sheetId ? sh : {
      ...sh,
      objects: sh.objects.map(o => o.id !== objectId ? o : { ...o, ...changes })
    })
  })),

  deleteObject: (sheetId, objectId) => set(s => ({
    sheets: s.sheets.map(sh => sh.id !== sheetId ? sh : {
      ...sh,
      objects: sh.objects.filter(o => o.id !== objectId)
    })
  })),

  selectedObjectId: null,
  setSelectedObject: (id) => set({ selectedObjectId: id }),

  // ── Sync status ────────────────────────────────────────
  lastSynced: null,
  syncStatus: 'idle',
  syncMessage: '',
  setSyncStatus: (syncStatus, syncMessage = '') => set({ syncStatus, syncMessage }),
  setLastSynced: (lastSynced) => set({ lastSynced }),
}))

export { SHEET_TYPES }
export default useStore