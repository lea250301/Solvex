import { useEffect, useState, type SubmitEvent } from 'react'
import './App.css'

type Employee = {
  first_name: string
  last_name: string
  email: string
  service_type: string
}

type Service = {
  id: string
  service_type: string
  status: string
  scheduled_at: string | null
  completed_at: string | null
  notes: string | null
  solar_plant_name: string
  installation_address: string
  postal_code: string
  city: string
  customer_first_name: string
  customer_last_name: string
  employee_first_name: string | null
  employee_last_name: string | null
}

type DashboardPage = 'services' | 'reports'

const serviceTypeLabels: Record<string, string> = {
  cleaning: 'Čiščenje',
  electrical: 'Elektro servis',
  installer: 'Montaža',
}

const serviceStatusLabels: Record<string, string> = {
  planned: 'Načrtovan',
  scheduled: 'Dogovorjen',
  in_progress: 'V teku',
  completed: 'Zaključen',
  cancelled: 'Preklican',
}

function formatDate(value: string | null) {
  if (!value) {
    return 'Ni določeno'
  }

  return new Intl.DateTimeFormat('sl-SI', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function App() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [dashboardPage, setDashboardPage] = useState<DashboardPage>('services')
  const [notice, setNotice] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [services, setServices] = useState<Service[]>([])
  const [servicesState, setServicesState] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle')
  const [servicesError, setServicesError] = useState('')

  useEffect(() => {
    if (!employee || dashboardPage !== 'services') {
      return
    }

    const controller = new AbortController()

    async function loadServices() {
      setServicesState('loading')
      setServicesError('')

      try {
        const response = await fetch('/api/services', {
          signal: controller.signal,
        })
        const result = (await response.json().catch(() => ({}))) as {
          message?: string
          services?: Service[]
        }

        if (!response.ok) {
          throw new Error(result.message ?? 'Seznama servisov ni bilo mogoče naložiti.')
        }

        if (!Array.isArray(result.services)) {
          throw new Error('Backend je vrnil neveljaven seznam servisov.')
        }

        setServices(result.services)
        setServicesState('loaded')
      } catch (error) {
        if (controller.signal.aborted) {
          return
        }

        console.error('Service list request failed:', error)
        setServicesError(
          error instanceof Error
            ? error.message
            : 'Seznama servisov ni bilo mogoče naložiti.',
        )
        setServicesState('error')
      }
    }

    void loadServices()

    return () => controller.abort()
  }, [employee, dashboardPage])

  async function handleLogin(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice('')
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/employees/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const result = (await response.json().catch(() => ({}))) as {
        message?: string
        employee?: Employee
      }

      if (!response.ok) {
        setNotice(result.message ?? 'Prijava ni uspela.')
        return
      }

      if (!result.employee) {
        setNotice('Prijava ni uspela. Poskusi znova.')
        return
      }

      setEmployee(result.employee)
      setPassword('')
    } catch {
      setNotice('Backend trenutno ni dosegljiv. Poskusi znova.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleLogout() {
    setEmployee(null)
    setEmail('')
    setPassword('')
    setNotice('')
    setServices([])
    setServicesState('idle')
    setServicesError('')
  }

  if (employee) {
    return (
      <main className="dashboard-page">
        <header className="dashboard-header">
          <a className="brand" href="#" aria-label="Solvex">
            <span className="brand-mark" aria-hidden="true">S</span>
            <span>solvex</span>
          </a>
          <nav className="dashboard-nav" aria-label="Navigacija zaposlenega">
            <button
              className={`dashboard-nav-button${dashboardPage === 'services' ? ' active' : ''}`}
              type="button"
              aria-current={dashboardPage === 'services' ? 'page' : undefined}
              onClick={() => setDashboardPage('services')}
            >
              Servisi
            </button>
            <button
              className={`dashboard-nav-button${dashboardPage === 'reports' ? ' active' : ''}`}
              type="button"
              aria-current={dashboardPage === 'reports' ? 'page' : undefined}
              onClick={() => setDashboardPage('reports')}
            >
              Servisna poročila
            </button>
          </nav>
          <button className="text-button" type="button" onClick={handleLogout}>
            Odjava
          </button>
        </header>
        <section className="dashboard-content">
          <h1>
            {dashboardPage === 'services'
              ? `Živjo, ${employee.first_name}!`
              : 'Servisna poročila'}
          </h1>
          <div className="dashboard-placeholder">
            {dashboardPage === 'services' ? (
              <>
                <div className="services-heading">
                  <div>
                    <h2>Vsi servisi</h2>
                    <p>Pregled servisov in njihovih terminov.</p>
                  </div>
                  {servicesState === 'loaded' && (
                    <span className="service-count">
                      {services.length} {services.length === 1 ? 'servis' : 'servisov'}
                    </span>
                  )}
                </div>

                {servicesState === 'loading' && (
                  <p className="services-message" role="status">Nalaganje servisov ...</p>
                )}
                {servicesState === 'error' && (
                  <p className="services-message services-error" role="alert">
                    {servicesError}
                  </p>
                )}
                {servicesState === 'loaded' && services.length === 0 && (
                  <p className="services-message">V bazi še ni ustvarjenih servisov.</p>
                )}
                {servicesState === 'loaded' && services.length > 0 && (
                  <ul className="service-list">
                    {services.map((service) => (
                      <li className="service-card" key={service.id}>
                        <div className="service-card-heading">
                          <div>
                            <span className="service-type">
                              {serviceTypeLabels[service.service_type] ?? service.service_type}
                            </span>
                            <h3>{service.solar_plant_name}</h3>
                          </div>
                          <span className={`service-status status-${service.status}`}>
                            {serviceStatusLabels[service.status] ?? service.status}
                          </span>
                        </div>
                        <dl className="service-details">
                          <div>
                            <dt>Stranka</dt>
                            <dd>{service.customer_first_name} {service.customer_last_name}</dd>
                          </div>
                          <div>
                            <dt>Lokacija</dt>
                            <dd>
                              {service.installation_address}, {service.postal_code} {service.city}
                            </dd>
                          </div>
                          <div>
                            <dt>Termin</dt>
                            <dd>{formatDate(service.scheduled_at)}</dd>
                          </div>
                          <div>
                            <dt>Zaposleni</dt>
                            <dd>
                              {service.employee_first_name
                                ? `${service.employee_first_name} ${service.employee_last_name}`
                                : 'Ni dodeljen'}
                            </dd>
                          </div>
                          {service.completed_at && (
                            <div>
                              <dt>Zaključen</dt>
                              <dd>{formatDate(service.completed_at)}</dd>
                            </div>
                          )}
                          {service.notes && (
                            <div>
                              <dt>Opombe</dt>
                              <dd>{service.notes}</dd>
                            </div>
                          )}
                        </dl>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <>
                <span className="placeholder-icon" aria-hidden="true">✦</span>
                <h2>Servisna poročila bodo prikazana tukaj</h2>
                <p>Pregled in urejanje servisnih poročil bomo dodali v naslednjem koraku.</p>
              </>
            )}
          </div>
        </section>
      </main>
    )
  }

  //LOGIN PAGE
  return (
    <main className="auth-page">
      <section className="auth-visual" aria-label="O Solvexu">
        <a className="brand brand-light" href="#" aria-label="Solvex">
          <span className="brand-mark" aria-hidden="true">S</span>
          <span>solvex</span>
        </a>
        <div className="visual-copy">
          <span className="eyebrow">SONČNA ENERGIJA, BREZ SKRBI</span>
          <h1>Skrb za energijo na enem mestu.</h1>
          <p>
            Dobrodošli v delovnem prostoru ekipe Solvex. Vpišite se za dostop do
            svojega dashboarda.
          </p>
        </div>
        <div className="visual-footer">
          <span className="sun-icon" aria-hidden="true">☼</span>
          <span>Več energije. Manj skrbi.</span>
        </div>
        <div className="visual-orb visual-orb-one" />
        <div className="visual-orb visual-orb-two" />
      </section>

      <section className="auth-panel">
        <div className="auth-form-wrap">
          <span className="mobile-brand brand">
            <span className="brand-mark" aria-hidden="true">S</span>
            <span>solvex</span>
          </span>
          <span className="eyebrow">DOSTOP ZA ZAPOSLENE</span>
          <h2>Prijava v račun</h2>
          <p className="form-intro">
            Vpišite se s službenim e-poštnim naslovom in geslom.
          </p>

          <form className="auth-form login-form" onSubmit={handleLogin}>
            <div className="field">
              <label htmlFor="email">Službeni e-poštni naslov</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                placeholder="ime@primer.si"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="password">Geslo</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Vnesi svoje geslo"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            <button className="submit-button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Prijavljanje ...' : 'Prijava'}
              {!isSubmitting && <span aria-hidden="true">→</span>}
            </button>
          </form>

          {notice && <p className="form-notice" role="status">{notice}</p>}
          <p className="form-legal">Dostop je namenjen zaposlenim v Solvexu.</p>
        </div>
      </section>
    </main>
  )
}

export default App
