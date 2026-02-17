import { usePhotoStore } from '../store/photoStore'

export function PhotoViewer() {
  const {
    photos,
    selectedIndex,
    viewerOpen,
    closeViewer,
    selectNext,
    selectPrev,
    markSelectedStatus,
  } = usePhotoStore()

  if (!viewerOpen) return null

  const photo = photos[selectedIndex]
  if (!photo) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex flex-col"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeViewer()
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-black/50">
        <span className="text-white text-sm">
          {photo.name} ({selectedIndex + 1}/{photos.length})
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => markSelectedStatus('keep')}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
          >
            Keep (K)
          </button>
          <button
            onClick={() => markSelectedStatus('delete')}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
          >
            Delete (D)
          </button>
          <button
            onClick={() => markSelectedStatus('pending')}
            className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm"
          >
            Undo (U)
          </button>
          <button
            onClick={closeViewer}
            className="text-gray-400 hover:text-white px-2 text-lg"
          >
            &times;
          </button>
        </div>
      </div>

      {/* Image */}
      <div className="flex-1 flex items-center justify-center min-h-0 p-4">
        <img
          src={photo.full_image_url ?? ''}
          alt={photo.name}
          className="max-w-full max-h-full object-contain"
        />
      </div>

      {/* Navigation arrows */}
      {selectedIndex > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            selectPrev()
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white text-4xl"
        >
          &#8249;
        </button>
      )}
      {selectedIndex < photos.length - 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            selectNext()
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white text-4xl"
        >
          &#8250;
        </button>
      )}

      {/* Status indicator */}
      <div className="text-center py-2 text-sm">
        {photo.status === 'keep' && (
          <span className="text-green-400 font-bold">KEEP</span>
        )}
        {photo.status === 'delete' && (
          <span className="text-red-400 font-bold">DELETE</span>
        )}
        {photo.status === 'pending' && (
          <span className="text-gray-400">PENDING</span>
        )}
      </div>
    </div>
  )
}
