type DashboardIconName = 'home' | 'plants' | 'services' | 'history' | 'information' | 'arrow' | 'logout'

export function DashboardIcon({ name }: { name: DashboardIconName }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {name === 'home' && <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z" /></>}
      {name === 'plants' && <><path d="m5 6-2 12h18L19 6ZM4 12h16M9 6 8 18M15 6l1 12M12 18v3M8 21h8" /></>}
      {name === 'services' && <><path d="m14 6 4-4a6 6 0 0 1-7 8L4 20a2 2 0 0 1-3-3l10-7a6 6 0 0 1 8-7l-4 4" /></>}
      {name === 'history' && <><path d="M3 11a9 9 0 1 1 2 7M3 4v7h7M12 7v5l3 2" /></>}
      {name === 'information' && <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7h.01" /></>}
      {name === 'arrow' && <path d="M5 12h14m-5-5 5 5-5 5" />}
      {name === 'logout' && <path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5M14 8l4 4-4 4M8 12h13" />}
    </svg>
  )
}
