import { useState } from 'react'
import { usePhotoStore } from '../store/photoStore'

export function Toolbar() {
  const {
    folderPath,
    setFolderPath,
    loadFolder,
    loading,
    session,
    photos,
    deleteMarked,
  } = usePhotoStore()

  const [inputPath, setInputPath] = useState(folderPath)

  const stats = {
    total: photos.length,
    pending: photos.filter((p) => p.status === 'pending').length,
    keep: photos.filter((p) => p.status === 'keep').length,
    delete: photos.filter((p) => p.status === 'delete').length,
  }

  const handleLoad = () => {
    setFolderPath(inputPath)
    setTimeout(() => loadFolder(), 0)
  }

  return (
    <div className="bg-gray-900 border-b border-gray-700 px-4 py-3">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold text-white shrink-0">PhotoSift</h1>

        <input
          type="text"
          value={inputPath}
          onChange={(e) => setInputPath(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleLoad()}
          placeholder="Enter folder path, e.g. ~/Pictures/trip"
          className="flex-1 bg-gray-800 text-white px-3 py-1.5 rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
        />

        <button
          onClick={handleLoad}
          disabled={loading || !inputPath}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-1.5 rounded text-sm font-medium"
        >
          {loading ? 'Loading...' : 'Load'}
        </button>

        {stats.delete > 0 && (
          <button
            onClick={deleteMarked}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-4 py-1.5 rounded text-sm font-medium"
          >
            Delete Marked ({stats.delete})
          </button>
        )}
      </div>

      {session && (
        <div className="flex gap-4 mt-2 text-xs text-gray-400">
          <span>Total: {stats.total}</span>
          <span className="text-yellow-400">Pending: {stats.pending}</span>
          <span className="text-green-400">Keep: {stats.keep}</span>
          <span className="text-red-400">Delete: {stats.delete}</span>
        </div>
      )}
    </div>
  )
}
