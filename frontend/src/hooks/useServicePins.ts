import { useState } from 'react'

function loadPins(employeeId: string) {
  try {
    const stored: unknown = JSON.parse(window.localStorage.getItem(`solvex:pinned-services:${employeeId}`) ?? '[]')
    return {
      ids: new Set(Array.isArray(stored) ? stored.filter((id): id is string => typeof id === 'string') : []),
      notice: '',
    }
  } catch {
    return { ids: new Set<string>(), notice: 'Pripeti servisi se ne morejo naložiti iz brskalnika.' }
  }
}

export function useServicePins(employeeId: string) {
  const [initial] = useState(() => loadPins(employeeId))
  const [pinnedServiceIds, setPinnedServiceIds] = useState(initial.ids)
  const [servicePinNotice, setServicePinNotice] = useState(initial.notice)

  function toggleServicePin(serviceId: string) {
    const next = new Set(pinnedServiceIds)
    if (next.has(serviceId)) next.delete(serviceId)
    else next.add(serviceId)
    setPinnedServiceIds(next)
    try {
      window.localStorage.setItem(`solvex:pinned-services:${employeeId}`, JSON.stringify([...next]))
      setServicePinNotice('')
    } catch {
      setServicePinNotice('Sprememba pripetih servisov se ne more shraniti v brskalnik.')
    }
  }

  return { pinnedServiceIds, servicePinNotice, toggleServicePin }
}
