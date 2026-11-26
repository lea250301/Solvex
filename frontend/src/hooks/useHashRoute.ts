import { useEffect, useState } from 'react'

export function useHashRoute() {
  const [route, setRoute] = useState(() => window.location.hash)
  useEffect(() => {
    const update = () => setRoute(window.location.hash)
    window.addEventListener('hashchange', update)
    return () => window.removeEventListener('hashchange', update)
  }, [])
  return route
}
