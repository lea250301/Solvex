import { useEffect, useState } from 'react'
import type { Account, PastService, ProfilePlant } from '../types'
import { apiBase } from '../lib/api'
import { prepareProfileImage } from '../lib/profileImage'

type ProfileData = { plants: ProfilePlant[]; services: PastService[] }

export function useProfile(account: Account | null, onAccountChange: (account: Account) => void) {
  const [data, setData] = useState<ProfileData>({ plants: [], services: [] })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)
  const id = account?.id
  const role = account?.role

  useEffect(() => {
    if (!id) return
    const controller = new AbortController()
    async function load() {
      setLoading(true)
      setError('')
      try {
        const response = await fetch(`${apiBase}/account/profile`, { signal: controller.signal })
        const result = await response.json().catch(() => ({})) as ProfileData & { message?: string }
        if (!response.ok || !Array.isArray(result.plants) || !Array.isArray(result.services)) throw new Error(result.message ?? 'Profila ni bilo mogoče naložiti.')
        if (!controller.signal.aborted) setData({ plants: result.plants, services: result.services })
      } catch (failure) {
        if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : 'Profila ni bilo mogoče naložiti.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    void load()
    return () => controller.abort()
  }, [id, role])

  async function savePhoto(file: File | null) {
    if (!account || saving) return
    setSaving(true)
    setNotice('')
    try {
      const image = file ? await prepareProfileImage(file) : null
      const response = await fetch(`${apiBase}/account/photo`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image }) })
      const result = await response.json().catch(() => ({})) as { account?: Account; message?: string }
      if (!response.ok || !result.account) throw new Error(result.message ?? 'Fotografije ni bilo mogoče shraniti.')
      onAccountChange(result.account)
      setNotice(image ? 'Fotografija je shranjena.' : 'Fotografija je odstranjena.')
    } catch (failure) {
      setNotice(failure instanceof Error ? failure.message : 'Fotografije ni bilo mogoče shraniti.')
    } finally {
      setSaving(false)
    }
  }

  return { ...data, loading, error, notice, saving, savePhoto }
}
