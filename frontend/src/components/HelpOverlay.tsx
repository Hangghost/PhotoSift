interface Props {
  open: boolean
  onClose: () => void
}

const shortcuts = [
  { key: '← / →', desc: 'Previous / next photo' },
  { key: '↑ / ↓', desc: 'Previous / next row' },
  { key: 'Space', desc: 'Toggle full-size viewer' },
  { key: 'Esc', desc: 'Close viewer' },
  { key: 'D', desc: 'Mark for deletion' },
  { key: 'K', desc: 'Mark as keep' },
  { key: 'U', desc: 'Undo mark (set pending)' },
  { key: 'Shift+D', desc: 'Delete all marked photos' },
  { key: '?', desc: 'Toggle this help' },
]

export function HelpOverlay({ open, onClose }: Props) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-white text-lg font-bold mb-4">Keyboard Shortcuts</h2>
        <div className="space-y-2">
          {shortcuts.map((s) => (
            <div key={s.key} className="flex justify-between text-sm">
              <kbd className="bg-gray-700 text-gray-200 px-2 py-0.5 rounded font-mono text-xs">
                {s.key}
              </kbd>
              <span className="text-gray-300">{s.desc}</span>
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          className="mt-4 w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded text-sm"
        >
          Close
        </button>
      </div>
    </div>
  )
}
