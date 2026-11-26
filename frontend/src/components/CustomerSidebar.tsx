import type { CustomerPage } from '../types'
import { DashboardIcon } from './DashboardIcon'

const pages = [
  { page: 'overview', label: 'Domov', icon: 'home' },
  { page: 'plants', label: 'Moje elektrarne', icon: 'plants' },
  { page: 'current-services', label: 'Trenutni servisi', icon: 'services' },
  { page: 'history', label: 'Pretekli servisi', icon: 'history' },
  { page: 'information', label: 'Koristne informacije', icon: 'information' },
] as const

export function CustomerSidebar({ page, onNavigate, onLogout }: {
  page: CustomerPage
  onNavigate: (page: CustomerPage) => void
  onLogout: () => void
}) {
  return (
    <aside className="dashboard-sidebar">
      <nav className="sidebar-navigation" aria-label="Navigacija lastnika">
        {pages.map((item) => (
          <button key={item.page} className={`sidebar-link${page === item.page ? ' active' : ''}`}
            type="button" aria-label={item.label} title={item.label}
            aria-current={page === item.page ? 'page' : undefined} onClick={() => onNavigate(item.page)}>
            <DashboardIcon name={item.icon} />
          </button>
        ))}
      </nav>
      <button className="sidebar-logout" type="button" aria-label="Odjava" title="Odjava" onClick={onLogout}>
        <DashboardIcon name="logout" />
      </button>
    </aside>
  )
}
