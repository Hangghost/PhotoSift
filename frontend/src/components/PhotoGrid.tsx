import { usePhotoStore } from '../store/photoStore'

const statusColors: Record<string, string> = {
  pending: 'border-transparent',
  keep: 'border-green-500 ring-2 ring-green-500/30',
  delete: 'border-red-500 ring-2 ring-red-500/30 opacity-50',
  uploaded: 'border-blue-500 ring-2 ring-blue-500/30',
}

const statusBadge: Record<string, { label: string; color: string }> = {
  keep: { label: 'KEEP', color: 'bg-green-600' },
  delete: { label: 'DEL', color: 'bg-red-600' },
  uploaded: { label: 'UP', color: 'bg-blue-600' },
}

export function PhotoGrid() {
  const { photos, selectedIndex, selectPhoto, openViewer } = usePhotoStore()

  if (photos.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <p className="text-lg mb-2">No photos loaded</p>
          <p className="text-sm">Enter a folder path above and click Load</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto p-4">
      <div className="grid grid-cols-4 gap-3">
        {photos.map((photo, i) => (
          <div
            key={photo.id}
            onClick={() => selectPhoto(i)}
            onDoubleClick={() => {
              selectPhoto(i)
              openViewer()
            }}
            className={`
              relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all
              ${statusColors[photo.status]}
              ${i === selectedIndex ? 'ring-2 ring-blue-400 border-blue-400' : ''}
            `}
          >
            <div className="aspect-square bg-gray-800">
              <img
                src={photo.thumbnail_url ?? ''}
                alt={photo.name}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Status badge */}
            {statusBadge[photo.status] && (
              <span
                className={`absolute top-1 right-1 ${statusBadge[photo.status].color} text-white text-[10px] font-bold px-1.5 py-0.5 rounded`}
              >
                {statusBadge[photo.status].label}
              </span>
            )}

            {/* Featured badge */}
            {photo.featured && (
              <span className="absolute top-1 left-1 bg-yellow-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                ★
              </span>
            )}

            {/* Filename */}
            <div className="absolute bottom-0 inset-x-0 bg-black/60 px-2 py-1">
              <p className="text-[11px] text-gray-300 truncate">{photo.name}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
