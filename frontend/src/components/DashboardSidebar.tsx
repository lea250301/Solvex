import type { DashboardPage } from '../types'

type DashboardSidebarProps = {
  dashboardPage: DashboardPage
  onNavigate: (page: DashboardPage) => void
  onLogout: () => void
}

export function DashboardSidebar({ dashboardPage, onNavigate, onLogout }: DashboardSidebarProps) {
  return (
    <aside className="dashboard-sidebar">
      <nav className="sidebar-navigation" aria-label="Navigacija zaposlenega">
        <button type="button" className={`sidebar-link${dashboardPage === 'services' ? ' active' : ''}`}
          aria-label="Servisi" title="Servisi" aria-current={dashboardPage === 'services' ? 'page' : undefined}
          onClick={() => onNavigate('services')}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" /></svg>
          <span className="sidebar-label">Servisi</span>
        </button>
        <button type="button" className={`sidebar-link${dashboardPage === 'reports' ? ' active' : ''}`}
          aria-label="Servisna poročila" title="Servisna poročila" aria-current={dashboardPage === 'reports' ? 'page' : undefined}
          onClick={() => onNavigate('reports')}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z" /><path d="M14 3v6h6M8 13h8M8 17h5" /></svg>
          <span className="sidebar-label">Servisna poročila</span>
        </button>
        <button type="button" className={`sidebar-link${dashboardPage === 'calendar' ? ' active' : ''}`}
          aria-label="Koledar" title="Koledar" aria-current={dashboardPage === 'calendar' ? 'page' : undefined}
          onClick={() => onNavigate('calendar')}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M7 3v4M17 3v4M3 11h18" /></svg>
          <span className="sidebar-label">Koledar</span>
        </button>
      </nav>
      <button className="sidebar-logout" type="button" aria-label="Odjava" title="Odjava" onClick={onLogout}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5M14 8l4 4-4 4M8 12h13" /></svg>
      </button>
    </aside>
  )
}
