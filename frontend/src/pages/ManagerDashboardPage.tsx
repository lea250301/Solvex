import { useState } from 'react'
import { DashboardHeader } from '../components/DashboardHeader'
import { DashboardIcon } from '../components/DashboardIcon'
import { useManagerData, type ManagerView } from '../hooks/useManagerData'
import type { Account } from '../types'
import ProfilePage from './ProfilePage'
import './DashboardPage.css'
import './ManagerDashboardPage.css'

const navigation = [
  ['overview', 'Pregled', 'home'], ['requests', 'Zahtevki', 'information'], ['services', 'Servisi', 'services'],
  ['employees', 'Serviserji', 'plants'], ['reports', 'Oddana poročila', 'information'],
  ['calendar', 'Koledar', 'history'], ['inventory', 'Zaloga', 'plants'],
] as const
const labels: Record<string, string> = { cleaning: 'Čiščenje', electrical: 'Elektro servis', installer: 'Montaža', planned: 'Načrtovan', scheduled: 'Dogovorjen', in_progress: 'V teku', completed: 'Zaključen', cancelled: 'Preklican', submitted: 'Oddan', reviewing: 'V pregledu', rejected: 'Zavrnjen', fault_report: 'Prijava okvare', regular_inspection: 'Redni pregled', nujno: 'Nujno', resno: 'Resno', standardno: 'Standardno' }
const label = (value: string) => labels[value] ?? value

export default function ManagerDashboardPage({ account, onAccountChange, onLogout }: {
  account: Account; onAccountChange: (account: Account) => void; onLogout: () => void
}) {
  const [view, setView] = useState<ManagerView>('overview')
  const [search, setSearch] = useState('')
  const { data, loading, error, retry } = useManagerData(view)
  const matches = (values: (string | null)[]) => values.join(' ').toLocaleLowerCase('sl').includes(search.toLocaleLowerCase('sl'))
  function navigate(next: ManagerView) { setSearch(''); setView(next) }
  const empty = !loading && !error && ((view === 'services' && data.services?.length === 0) || (view === 'requests' && data.requests?.length === 0) || (view === 'employees' && data.employees?.length === 0) || (view === 'reports' && data.reports?.length === 0))
  return <main className="dashboard-page manager-dashboard">
    <aside className="dashboard-sidebar">
      <nav className="sidebar-navigation" aria-label="Navigacija vodje servisa">
        {navigation.map(([id, title, icon]) => <button key={id} type="button" className={`sidebar-link${view === id ? ' active' : ''}`} title={title} aria-label={title} aria-current={view === id ? 'page' : undefined} onClick={() => navigate(id)}><DashboardIcon name={icon} /><span className="sidebar-label">{title}</span></button>)}
      </nav>
      <button className="sidebar-logout" type="button" aria-label="Odjava" title="Odjava" onClick={onLogout}><DashboardIcon name="logout" /></button>
    </aside>
    <DashboardHeader isProfile={view === 'profile'} onProfile={() => navigate('profile')} profileImage={account.profile_image_data} searchValue={search} searchLabel="Išči po pregledu vodje" onSearch={setSearch} />
    {view === 'profile' ? <ProfilePage account={account} onAccountChange={onAccountChange} /> : <section className="dashboard-content manager-content">
      <h1>{view === 'overview' ? `Dober dan, ${account.first_name}.` : navigation.find(([id]) => id === view)?.[1]}</h1>
      {view === 'overview' && <p>Pregled servisne ekipe in dela.</p>}
      {loading && <p role="status">Nalaganje podatkov ...</p>}
      {error && <div role="alert"><p>{error}</p><button type="button" onClick={retry}>Poskusi znova</button></div>}
      {view === 'overview' && data.overview && <div className="manager-metrics">
        {([['Aktivni servisi', data.overview.active_services], ['Odprti zahtevki', data.overview.pending_requests], ['Serviserji', data.overview.employees], ['Oddana poročila', data.overview.submitted_reports]] as const).map(([title, value]) => <article key={title}><span>{title}</span><strong>{value}</strong></article>)}
      </div>}
      {empty && <p>Za zdaj ni podatkov.</p>}
      <div className="manager-records">
        {view === 'services' && data.services?.filter(item => matches([item.solar_plant_name, item.customer_first_name, item.customer_last_name, item.employee_first_name, item.employee_last_name])).map(item => <article key={item.id}><h2>{item.solar_plant_name}</h2><p>{item.customer_first_name} {item.customer_last_name} · {item.installation_address}, {item.city}</p><p>{label(item.service_type)} · {label(item.urgency)} · {label(item.status)}</p><p>Serviser: {item.employee_first_name ? `${item.employee_first_name} ${item.employee_last_name}` : 'Ni dodeljen'}</p></article>)}
        {view === 'requests' && data.requests?.filter(item => matches([item.solar_plant_name, item.customer_first_name, item.customer_last_name, item.description])).map(item => <article key={item.id}><h2>{item.solar_plant_name}</h2><p>{item.customer_first_name} {item.customer_last_name} · {label(item.request_type)} · {label(item.status)}</p><p>{item.description || 'Brez dodatnega opisa.'}</p></article>)}
        {view === 'employees' && data.employees?.filter(item => matches([item.first_name, item.last_name, item.email])).map(item => <article key={item.id}><h2>{item.first_name} {item.last_name}</h2><p>{label(item.service_type)} · {item.email}</p><p>Aktivni servisi: {item.active_services}</p></article>)}
        {view === 'reports' && data.reports?.filter(item => matches([item.solar_plant_name, item.employee_first_name, item.employee_last_name, item.work_summary])).map(item => <article key={item.id}><h2>{item.solar_plant_name}</h2><p>{item.employee_first_name} {item.employee_last_name} · {label(item.service_type)}</p><h3>Opravljeno delo</h3><p>{item.work_summary}</p>{item.findings && <><h3>Ugotovitve</h3><p>{item.findings}</p></>}{item.recommendations && <><h3>Priporočila</h3><p>{item.recommendations}</p></>}</article>)}
      </div>
      {(view === 'calendar' || view === 'inventory') && <p>Ta funkcionalnost še ni implementirana.</p>}
    </section>}
  </main>
}
