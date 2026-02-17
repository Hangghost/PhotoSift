import { useEffect, useState } from 'react'
import { Toolbar } from './components/Toolbar'
import { PhotoGrid } from './components/PhotoGrid'
import { PhotoViewer } from './components/PhotoViewer'
import { HelpOverlay } from './components/HelpOverlay'
import { useKeyboard } from './hooks/useKeyboard'

function App() {
  const [helpOpen, setHelpOpen] = useState(false)

  useKeyboard()

  useEffect(() => {
    function handleHelp(e: KeyboardEvent) {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return
      if (e.key === '?') {
        e.preventDefault()
        setHelpOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', handleHelp)
    return () => window.removeEventListener('keydown', handleHelp)
  }, [])

  return (
    <div className="h-screen flex flex-col bg-gray-950 text-white">
      <Toolbar />
      <PhotoGrid />
      <PhotoViewer />
      <HelpOverlay open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  )
}

export default App
