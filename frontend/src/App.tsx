import { useEffect, useState, type SubmitEvent } from 'react'
import './App.css'

type Employee = {
  id: string
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

type ServiceReport = {
  id: string
  id_service: string
  service_type: string
  solar_plant_name: string
  work_summary: string
  findings: string | null
  recommendations: string | null
  reported_at: string
  submitted_at: string | null
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

function toDateTimeLocal(value: string) {
  const date = new Date(value)
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 16)
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
  const [expandedServiceIds, setExpandedServiceIds] = useState<Set<string>>(() => new Set())
  const [assignedServices, setAssignedServices] = useState<Service[]>([])
  const [assignedServicesState, setAssignedServicesState] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle')
  const [assignedServicesError, setAssignedServicesError] = useState('')
  const [reports, setReports] = useState<ServiceReport[]>([])
  const [reportsState, setReportsState] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle')
  const [reportsError, setReportsError] = useState('')
  const [isCreatingReport, setIsCreatingReport] = useState(false)
  const [editingReport, setEditingReport] = useState<ServiceReport | null>(null)
  const [reportFormNotice, setReportFormNotice] = useState('')
  const [isSubmittingReport, setIsSubmittingReport] = useState(false)
  const [reportActionNotice, setReportActionNotice] = useState('')
  const [submittingReportId, setSubmittingReportId] = useState<string | null>(null)

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

  useEffect(() => {
    if (!employee || dashboardPage !== 'reports') {
      return
    }

    const controller = new AbortController()
    const employeePath = `/api/employees/${encodeURIComponent(employee.id)}`

    async function loadAssignedServices() {
      setAssignedServicesState('loading')
      setAssignedServicesError('')

      try {
        const response = await fetch(`${employeePath}/services`, {
          signal: controller.signal,
        })
        const result = (await response.json().catch(() => ({}))) as {
          message?: string
          services?: Service[]
        }

        if (!response.ok) {
          throw new Error(result.message ?? 'Seznama dodeljenih servisov ni bilo mogoče naložiti.')
        }

        if (!Array.isArray(result.services)) {
          throw new Error('Backend je vrnil neveljaven seznam servisov.')
        }

        setAssignedServices(result.services)
        setAssignedServicesState('loaded')
      } catch (error) {
        if (controller.signal.aborted) {
          return
        }

        console.error('Assigned service list request failed:', error)
        setAssignedServicesError(
          error instanceof Error
            ? error.message
            : 'Seznama dodeljenih servisov ni bilo mogoče naložiti.',
        )
        setAssignedServicesState('error')
      }
    }

    async function loadReports() {
      setReportsState('loading')
      setReportsError('')

      try {
        const response = await fetch(`${employeePath}/service-reports`, {
          signal: controller.signal,
        })
        const result = (await response.json().catch(() => ({}))) as {
          message?: string
          reports?: ServiceReport[]
        }

        if (!response.ok) {
          throw new Error(result.message ?? 'Seznama servisnih poročil ni bilo mogoče naložiti.')
        }

        if (!Array.isArray(result.reports)) {
          throw new Error('Backend je vrnil neveljaven seznam servisnih poročil.')
        }

        setReports(result.reports)
        setReportsState('loaded')
      } catch (error) {
        if (controller.signal.aborted) {
          return
        }

        console.error('Service report list request failed:', error)
        setReportsError(
          error instanceof Error
            ? error.message
            : 'Seznama servisnih poročil ni bilo mogoče naložiti.',
        )
        setReportsState('error')
      }
    }

    void loadAssignedServices()
    void loadReports()

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
    setIsCreatingReport(false)
    setEditingReport(null)
    setReportFormNotice('')
    setServices([])
    setServicesState('idle')
    setServicesError('')
    setExpandedServiceIds(new Set())
    setAssignedServices([])
    setAssignedServicesState('idle')
    setAssignedServicesError('')
    setReports([])
    setReportsState('idle')
    setReportsError('')
  }

  async function handleReportSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setReportFormNotice('')

    if (!employee) {
      setReportFormNotice('Za shranjevanje poročila se najprej prijavi.')
      return
    }

    setIsSubmittingReport(true)
    const form = event.currentTarget
    const formData = new FormData(form)
    const reportedAt = String(formData.get('reported_at') ?? '')

    try {
      const reportPath =
        `/api/employees/${encodeURIComponent(employee.id)}/service-reports`
      const response = await fetch(
        editingReport
          ? `${reportPath}/${encodeURIComponent(editingReport.id)}`
          : reportPath,
        {
          method: editingReport ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...(!editingReport && { id_service: formData.get('id_service') }),
            work_summary: formData.get('work_summary'),
            findings: formData.get('findings'),
            recommendations: formData.get('recommendations'),
            reported_at: reportedAt ? new Date(reportedAt).toISOString() : null,
          }),
        },
      )
      const result = (await response.json().catch(() => ({}))) as {
        message?: string
        report?: ServiceReport
      }

      if (!response.ok) {
        throw new Error(result.message ?? 'Servisnega poročila ni bilo mogoče shraniti.')
      }

      if (!result.report) {
        throw new Error('Backend ni vrnil shranjenega servisnega poročila.')
      }

      const savedReport = result.report
      setReports((currentReports) =>
        editingReport
          ? currentReports
              .map((report) => (report.id === savedReport.id ? savedReport : report))
              .sort((left, right) =>
                new Date(right.reported_at).getTime() - new Date(left.reported_at).getTime(),
              )
          : [savedReport, ...currentReports],
      )
      setReportsState('loaded')
      setIsCreatingReport(false)
      setEditingReport(null)
      setReportFormNotice('')
      form.reset()
    } catch (error) {
      console.error('Service report submission failed:', error)
      setReportFormNotice(
        error instanceof Error
          ? error.message
          : 'Servisnega poročila ni bilo mogoče shraniti.',
      )
    } finally {
      setIsSubmittingReport(false)
    }
  }

  async function handleReportSubmission(report: ServiceReport) {
    if (!employee) {
      setReportActionNotice('Za oddajo poročila se najprej prijavi.')
      return
    }

    setReportActionNotice('')
    setSubmittingReportId(report.id)

    try {
      const response = await fetch(
        `/api/employees/${encodeURIComponent(employee.id)}/service-reports/${encodeURIComponent(report.id)}/submit`,
        { method: 'POST' },
      )
      const result = (await response.json().catch(() => ({}))) as {
        message?: string
        report?: ServiceReport
      }

      if (!response.ok) {
        throw new Error(result.message ?? 'Poročila ni bilo mogoče oddati.')
      }

      if (!result.report) {
        throw new Error('Backend ni vrnil oddanega poročila.')
      }

      const submittedReport = result.report
      setReports((currentReports) =>
        currentReports.map((item) =>
          item.id === submittedReport.id ? submittedReport : item,
        ),
      )

      if (editingReport?.id === submittedReport.id) {
        setEditingReport(null)
        setIsCreatingReport(false)
        setReportFormNotice('')
      }
    } catch (error) {
      console.error('Service report submission failed:', error)
      setReportActionNotice(
        error instanceof Error ? error.message : 'Poročila ni bilo mogoče oddati.',
      )
    } finally {
      setSubmittingReportId(null)
    }
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
          {dashboardPage === 'services' ? (
            <h1>Živjo, {employee.first_name}!</h1>
          ) : (
            <div className="reports-page-heading">
              <h1>Servisna poročila</h1>
              <button
                className="create-report-button"
                type="button"
                onClick={() => {
                  setEditingReport(null)
                  setIsCreatingReport(true)
                  setReportFormNotice('')
                }}
              >
                Ustvari poročilo
              </button>
            </div>
          )}
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
                          <button
                            className="service-details-button"
                            type="button"
                            aria-expanded={expandedServiceIds.has(service.id)}
                            aria-controls={`service-details-${service.id}`}
                            onClick={() => {
                              setExpandedServiceIds((currentIds) => {
                                const nextIds = new Set(currentIds)

                                if (nextIds.has(service.id)) {
                                  nextIds.delete(service.id)
                                } else {
                                  nextIds.add(service.id)
                                }

                                return nextIds
                              })
                            }}
                          >
                            {expandedServiceIds.has(service.id) ? 'Skrij podrobnosti' : 'Podrobnosti'}
                          </button>
                        </div>
                        {expandedServiceIds.has(service.id) && (
                        <dl className="service-details" id={`service-details-${service.id}`}>
                          <div>
                            <dt>Stanje</dt>
                            <dd>{serviceStatusLabels[service.status] ?? service.status}</dd>
                          </div>
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
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <>
                <div className="services-heading">
                  <div>
                    <h2>Ustvarjena poročila</h2>
                    <p>Pregled servisnih poročil.</p>
                  </div>
                  {reportsState === 'loaded' && (
                    <span className="service-count">
                      {reports.length} {reports.length === 1 ? 'poročilo' : 'poročil'}
                    </span>
                  )}
                </div>

                {reportsState === 'loading' && (
                  <p className="services-message" role="status">Nalaganje poročil ...</p>
                )}
                {reportsState === 'error' && (
                  <p className="services-message services-error" role="alert">
                    {reportsError}
                  </p>
                )}
                {reportsState === 'loaded' && reports.length === 0 && (
                  <p className="services-message report-empty-state">
                    Trenutno še ni ustvarjenih servisnih poročil.
                  </p>
                )}
                {reportsState === 'loaded' && reports.length > 0 && (
                  <ul className="report-list">
                    {reports.map((report) => (
                      <li className="report-card" key={report.id}>
                        <div className="service-card-heading">
                          <div>
                            <span className="service-type">
                              {serviceTypeLabels[report.service_type] ?? report.service_type}
                            </span>
                            <h3>{report.solar_plant_name}</h3>
                          </div>
                          <span className="service-count">{formatDate(report.reported_at)}</span>
                        </div>
                        <div className="report-card-actions">
                          {report.submitted_at ? (
                            <span className="report-submitted-label">
                              Oddano {formatDate(report.submitted_at)}
                            </span>
                          ) : (
                            <>
                              <button
                                className="report-edit-button"
                                type="button"
                                onClick={() => {
                                  setEditingReport(report)
                                  setIsCreatingReport(true)
                                  setReportFormNotice('')
                                }}
                              >
                                Uredi
                              </button>
                              <button
                                className="report-submit-button"
                                type="button"
                                disabled={submittingReportId === report.id}
                                onClick={() => void handleReportSubmission(report)}
                              >
                                {submittingReportId === report.id
                                  ? 'Oddajanje ...'
                                  : 'Oddaj poročilo'}
                              </button>
                            </>
                          )}
                        </div>
                        <dl className="service-details">
                          <div className="report-detail-wide">
                            <dt>Povzetek dela</dt>
                            <dd>{report.work_summary}</dd>
                          </div>
                          {report.findings && (
                            <div className="report-detail-wide">
                              <dt>Ugotovitve</dt>
                              <dd>{report.findings}</dd>
                            </div>
                          )}
                          {report.recommendations && (
                            <div className="report-detail-wide">
                              <dt>Priporočila</dt>
                              <dd>{report.recommendations}</dd>
                            </div>
                          )}
                        </dl>
                      </li>
                    ))}
                  </ul>
                )}
                {reportActionNotice && (
                  <p className="services-message services-error" role="alert">
                    {reportActionNotice}
                  </p>
                )}

                {isCreatingReport && (
                  <form
                    className="report-form"
                    key={editingReport?.id ?? 'new'}
                    onSubmit={handleReportSubmit}
                  >
                    <h3>{editingReport ? 'Uredi servisno poročilo' : 'Novo servisno poročilo'}</h3>
                    <div className="report-form-fields">
                      <div className="field">
                        <label htmlFor="report-service-id">Servis</label>
                        <select
                          id="report-service-id"
                          name="id_service"
                          defaultValue={editingReport?.id_service ?? ''}
                          required
                          disabled={
                            editingReport !== null ||
                            assignedServicesState !== 'loaded' ||
                            assignedServices.length === 0
                          }
                        >
                          <option value="" disabled>
                            {assignedServicesState === 'loading'
                              ? 'Nalaganje servisov ...'
                              : assignedServicesState === 'error'
                                ? 'Servisov ni bilo mogoče naložiti'
                                : assignedServices.length === 0
                                  ? 'Ni dodeljenih servisov'
                                  : 'Izberi servis'}
                          </option>
                          {assignedServices.map((service) => (
                            <option key={service.id} value={service.id}>
                              {service.solar_plant_name} —{' '}
                              {serviceTypeLabels[service.service_type] ?? service.service_type}
                              {' · '}
                              {serviceStatusLabels[service.status] ?? service.status}
                            </option>
                          ))}
                        </select>
                        {assignedServicesState === 'error' && (
                          <span className="field-hint field-error">{assignedServicesError}</span>
                        )}
                        {assignedServicesState === 'loaded' && assignedServices.length === 0 && (
                          <span className="field-hint">
                            Poročilo lahko ustvariš, ko ti bo dodeljen servis.
                          </span>
                        )}
                      </div>
                      <div className="field report-form-wide">
                        <label htmlFor="report-work-summary">Povzetek dela</label>
                        <textarea
                          id="report-work-summary"
                          name="work_summary"
                          rows={4}
                          defaultValue={editingReport?.work_summary ?? ''}
                          required
                        />
                      </div>
                      <div className="field report-form-wide">
                        <label htmlFor="report-findings">Ugotovitve</label>
                        <textarea
                          id="report-findings"
                          name="findings"
                          rows={3}
                          defaultValue={editingReport?.findings ?? ''}
                        />
                      </div>
                      <div className="field report-form-wide">
                        <label htmlFor="report-recommendations">Priporočila</label>
                        <textarea
                          id="report-recommendations"
                          name="recommendations"
                          rows={3}
                          defaultValue={editingReport?.recommendations ?? ''}
                        />
                      </div>
                      <div className="field report-form-wide">
                        <label htmlFor="report-reported-at">Datum in čas poročila</label>
                        <input
                          id="report-reported-at"
                          name="reported_at"
                          type="datetime-local"
                          defaultValue={
                            editingReport ? toDateTimeLocal(editingReport.reported_at) : ''
                          }
                        />
                        <span className="field-hint">
                          Če polje pustite prazno, se datum določi samodejno.
                        </span>
                      </div>
                    </div>
                    {reportFormNotice && (
                      <p className="form-notice" role="status">{reportFormNotice}</p>
                    )}
                    <div className="report-form-actions">
                      <button
                        className="report-cancel-button"
                        type="button"
                        disabled={isSubmittingReport}
                        onClick={() => {
                          setIsCreatingReport(false)
                          setEditingReport(null)
                          setReportFormNotice('')
                        }}
                      >
                        Prekliči
                      </button>
                      <button
                        className="create-report-button"
                        type="submit"
                        disabled={
                          isSubmittingReport ||
                          (!editingReport && assignedServices.length === 0)
                        }
                      >
                        {isSubmittingReport
                          ? 'Shranjevanje ...'
                          : editingReport
                            ? 'Shrani spremembe'
                            : 'Shrani poročilo'}
                      </button>
                    </div>
                  </form>
                )}

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
