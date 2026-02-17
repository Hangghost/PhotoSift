import { create } from 'zustand'
import { api } from '../services/api'
import type { Photo, Session } from '../services/api'

interface PhotoStore {
  // State
  photos: Photo[]
  selectedIndex: number
  session: Session | null
  folderPath: string
  loading: boolean
  error: string | null
  viewerOpen: boolean

  // Actions
  setFolderPath: (path: string) => void
  loadFolder: () => Promise<void>
  refreshPhotos: () => Promise<void>
  selectPhoto: (index: number) => void
  selectNext: () => void
  selectPrev: () => void
  selectNextRow: (cols: number) => void
  selectPrevRow: (cols: number) => void
  markStatus: (status: Photo['status']) => void
  markSelectedStatus: (status: Photo['status']) => void
  toggleFeatured: () => void
  copyFeatured: () => Promise<void>
  deleteMarked: () => Promise<void>
  openViewer: () => void
  closeViewer: () => void
  toggleViewer: () => void
}

export const usePhotoStore = create<PhotoStore>((set, get) => ({
  photos: [],
  selectedIndex: 0,
  session: null,
  folderPath: '',
  loading: false,
  error: null,
  viewerOpen: false,

  setFolderPath: (path) => set({ folderPath: path }),

  loadFolder: async () => {
    const { folderPath } = get()
    if (!folderPath) return
    set({ loading: true, error: null })
    try {
      const session = await api.loadFolder(folderPath)
      const photos = await api.listPhotos(folderPath)
      set({ session, photos, selectedIndex: 0, loading: false })
    } catch (e) {
      set({ error: (e as Error).message, loading: false })
    }
  },

  refreshPhotos: async () => {
    const { session } = get()
    if (!session?.folder_path) return
    try {
      const photos = await api.listPhotos(session.folder_path)
      set((state) => ({
        photos,
        selectedIndex: Math.min(state.selectedIndex, Math.max(0, photos.length - 1)),
      }))
    } catch (e) {
      set({ error: (e as Error).message })
    }
  },

  selectPhoto: (index) => {
    const { photos } = get()
    if (index >= 0 && index < photos.length) {
      set({ selectedIndex: index })
    }
  },

  selectNext: () => {
    const { selectedIndex, photos } = get()
    if (selectedIndex < photos.length - 1) set({ selectedIndex: selectedIndex + 1 })
  },

  selectPrev: () => {
    const { selectedIndex } = get()
    if (selectedIndex > 0) set({ selectedIndex: selectedIndex - 1 })
  },

  selectNextRow: (cols) => {
    const { selectedIndex, photos } = get()
    const next = Math.min(selectedIndex + cols, photos.length - 1)
    set({ selectedIndex: next })
  },

  selectPrevRow: (cols) => {
    const { selectedIndex } = get()
    const prev = Math.max(selectedIndex - cols, 0)
    set({ selectedIndex: prev })
  },

  markStatus: (status) => {
    const { photos, selectedIndex } = get()
    const photo = photos[selectedIndex]
    if (!photo) return
    api.updateStatus(photo.id, status).then((updated) => {
      set((state) => ({
        photos: state.photos.map((p) => (p.id === updated.id ? updated : p)),
      }))
    })
  },

  markSelectedStatus: (status) => {
    get().markStatus(status)
  },

  toggleFeatured: () => {
    const { photos, selectedIndex } = get()
    const photo = photos[selectedIndex]
    if (!photo) return
    api.toggleFeatured(photo.id, !photo.featured).then((updated) => {
      set((state) => ({
        photos: state.photos.map((p) => (p.id === updated.id ? updated : p)),
      }))
    })
  },

  copyFeatured: async () => {
    const { session, refreshPhotos } = get()
    if (!session?.folder_path) return
    set({ loading: true })
    try {
      await api.copyFeatured(session.folder_path)
      await refreshPhotos()
    } catch (e) {
      set({ error: (e as Error).message })
    } finally {
      set({ loading: false })
    }
  },

  deleteMarked: async () => {
    const { session, refreshPhotos } = get()
    if (!session?.folder_path) return
    set({ loading: true })
    try {
      await api.deleteMarked(session.folder_path)
      await refreshPhotos()
    } catch (e) {
      set({ error: (e as Error).message })
    } finally {
      set({ loading: false })
    }
  },

  openViewer: () => set({ viewerOpen: true }),
  closeViewer: () => set({ viewerOpen: false }),
  toggleViewer: () => set((s) => ({ viewerOpen: !s.viewerOpen })),
}))
