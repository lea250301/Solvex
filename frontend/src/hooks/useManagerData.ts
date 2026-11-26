import { useEffect, useState } from 'react'
import { apiBase } from '../lib/api'
import type { Service, ServiceReport } from '../types'

export type ManagerView = 'overview' | 'requests' | 'services' | 'employees' | 'reports' | 'calendar' | 'inventory' | 'profile'
export type ManagerRequest = {
  id: string; request_type: string; description: string | null; status: string
  solar_plant_name: string; customer_first_name: string; customer_last_name: string
}
export type ManagerEmployee = { id: string; first_name: string; last_name: string; email: string; service_type: string; active_services: number }
type ManagerData = {
  overview?: { active_services: number; pending_requests: number; employees: number; submitted_reports: number }
  services?: Service[]; reports?: ServiceReport[]; requests?: ManagerRequest[]; employees?: ManagerEmployee[]
}
const endpoints = { overview: 'managers/overview', requests: 'managers/requests', services: 'services', employees: 'managers/employees', reports: 'managers/service-reports' }

export function useManagerData(view: ManagerView) {
  const [data, setData] = useState<ManagerData>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    if (!(view in endpoints)) return
    const controller = new AbortController()
    async function load() {
      setData({})
      setLoading(true)
      setError('')
      try {
        const response = await fetch(`${apiBase}/${endpoints[view as keyof typeof endpoints]}`, { signal: controller.signal })
        const result = await response.json() as ManagerData & { message?: string }
        if (!response.ok) throw new Error(result.message ?? 'Podatkov ni bilo mogoče naložiti.')
        if (!controller.signal.aborted) setData(result)
      } catch (reason) {
        if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Podatkov ni bilo mogoče naložiti.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    void load()
    return () => controller.abort()
  }, [view, revision])
  const active = view in endpoints
  return { data: active ? data : {}, loading: active && loading, error: active ? error : '', retry: () => setRevision(value => value + 1) }
}
