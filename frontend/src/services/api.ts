export interface Photo {
  id: string
  name: string
  folder_path: string | null
  thumbnail_url: string | null
  full_image_url: string | null
  status: 'pending' | 'keep' | 'delete' | 'uploaded'
  blur_score: number | null
  duplicate_group_id: string | null
  composition_score: number | null
}

export interface Session {
  id: string
  folder_path: string | null
  total_photos: number
  processed_photos: number
  status: string
}

const BASE = '/api'

async function request<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  })
  if (!res.ok) {
    const detail = await res.text()
    throw new Error(`API error ${res.status}: ${detail}`)
  }
  return res.json()
}

export const api = {
  loadFolder(folderPath: string) {
    return request<Session>('/photos/load-folder', {
      method: 'POST',
      body: JSON.stringify({ folder_path: folderPath }),
    })
  },

  listPhotos(folderPath?: string, status?: string) {
    const params = new URLSearchParams()
    if (folderPath) params.set('folder_path', folderPath)
    if (status) params.set('status', status)
    const qs = params.toString()
    return request<Photo[]>(`/photos${qs ? '?' + qs : ''}`)
  },

  updateStatus(photoId: string, status: Photo['status']) {
    return request<Photo>(`/photos/${photoId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  },

  batchUpdateStatus(photoIds: string[], status: Photo['status']) {
    return request<{ updated: number }>('/photos/batch/status', {
      method: 'PATCH',
      body: JSON.stringify({ photo_ids: photoIds, status }),
    })
  },

  deleteMarked(folderPath: string) {
    return request<{ deleted: number; errors: unknown[] }>(
      `/photos/batch/delete-marked?folder_path=${encodeURIComponent(folderPath)}`,
      { method: 'DELETE' },
    )
  },

  listSessions() {
    return request<Session[]>('/photos/sessions')
  },
}
