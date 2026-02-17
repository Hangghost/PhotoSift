import { useEffect } from 'react'
import { usePhotoStore } from '../store/photoStore'

const GRID_COLS = 4

export function useKeyboard() {
  const {
    selectNext,
    selectPrev,
    selectNextRow,
    selectPrevRow,
    markSelectedStatus,
    toggleViewer,
    closeViewer,
    deleteMarked,
    viewerOpen,
  } = usePhotoStore()

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault()
          selectNext()
          break
        case 'ArrowLeft':
          e.preventDefault()
          selectPrev()
          break
        case 'ArrowDown':
          e.preventDefault()
          selectNextRow(GRID_COLS)
          break
        case 'ArrowUp':
          e.preventDefault()
          selectPrevRow(GRID_COLS)
          break
        case ' ':
          e.preventDefault()
          toggleViewer()
          break
        case 'Escape':
          e.preventDefault()
          closeViewer()
          break
        case 'd':
        case 'D':
          if (e.shiftKey) {
            deleteMarked()
          } else {
            markSelectedStatus('delete')
          }
          break
        case 'k':
        case 'K':
          markSelectedStatus('keep')
          break
        case 'u':
        case 'U':
          markSelectedStatus('pending')
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    selectNext,
    selectPrev,
    selectNextRow,
    selectPrevRow,
    markSelectedStatus,
    toggleViewer,
    closeViewer,
    deleteMarked,
    viewerOpen,
  ])
}
