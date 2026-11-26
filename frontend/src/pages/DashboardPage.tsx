import { Fragment, useEffect, useState, type SubmitEvent } from 'react'
import type { Account, Employee, Service, ServiceReport, DashboardPage as DashboardView, ServiceSortOrder, ReportSortOrder } from '../types'
import { apiBase } from '../lib/api'
import { useServicePins } from '../hooks/useServicePins'
import { DashboardHeader } from '../components/DashboardHeader'
import { DashboardSidebar } from '../components/DashboardSidebar'
import ProfilePage from './ProfilePage'
import CalendarPage from './CalendarPage'
import './DashboardPage.css'

type DashboardPageProps = { employee: Employee; account: Account | null; onAccountChange: (account: Account) => void; onLogout: () => void }

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

const serviceUrgencyLabels: Record<Service['urgency'], string> = {
  nujno: 'Nujno',
  resno: 'Resno',
  standardno: 'Standardno',
}

const serviceUrgencyRank: Record<Service['urgency'], number> = {
  nujno: 0,
  resno: 1,
  standardno: 2,
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

function DashboardPage({ employee, account, onAccountChange, onLogout }: DashboardPageProps) {
  const { pinnedServiceIds, servicePinNotice, toggleServicePin } = useServicePins(employee.id)
  const [dashboardPage, setDashboardPage] = useState<DashboardView>('services')
  const [services, setServices] = useState<Service[]>([])
  const [servicesState, setServicesState] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle')
  const [servicesError, setServicesError] = useState('')
  const [serviceSearch, setServiceSearch] = useState('')
  const [serviceSortOrder, setServiceSortOrder] = useState<ServiceSortOrder>('urgent-first')
  const [reportSearch, setReportSearch] = useState('')
  const [reportSortOrder, setReportSortOrder] = useState<ReportSortOrder>('newest')
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [assignedServices, setAssignedServices] = useState<Service[]>([])
  const [assignedServicesState, setAssignedServicesState] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle')
  const [assignedServicesError, setAssignedServicesError] = useState('')
  const [reports, setReports] = useState<ServiceReport[]>([])
  const [reportsState, setReportsState] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle')
  const [reportsError, setReportsError] = useState('')
  const [selectedReport, setSelectedReport] = useState<ServiceReport | null>(null)
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
        const response = await fetch(`${apiBase}/employees/${encodeURIComponent(employee.id)}/services`, {
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
    const employeePath = `${apiBase}/employees/${encodeURIComponent(employee.id)}`

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

  useEffect(() => {
    if (!selectedService && !selectedReport && !isCreatingReport) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleModalKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setSelectedService(null)
        setSelectedReport(null)
        setIsCreatingReport(false)
        setEditingReport(null)
        setReportFormNotice('')
      }
    }

    document.addEventListener('keydown', handleModalKeyDown)
    return () => {
      document.removeEventListener('keydown', handleModalKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [selectedService, selectedReport, isCreatingReport])

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
        `${apiBase}/employees/${encodeURIComponent(employee.id)}/service-reports`
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
        `${apiBase}/employees/${encodeURIComponent(employee.id)}/service-reports/${encodeURIComponent(report.id)}/submit`,
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

  const normalizedServiceSearch = serviceSearch.trim().toLocaleLowerCase('sl-SI')
  const matchingServices = services.filter((service) => {
    if (!normalizedServiceSearch) {
      return true
    }

    return [
      service.id,
      service.solar_plant_name,
      serviceTypeLabels[service.service_type] ?? service.service_type,
      serviceUrgencyLabels[service.urgency],
      serviceStatusLabels[service.status] ?? service.status,
      service.installation_address,
      service.postal_code,
      service.city,
      service.customer_first_name,
      service.customer_last_name,
      service.employee_first_name,
      service.employee_last_name,
      service.notes,
    ]
      .filter(Boolean)
      .join(' ')
      .toLocaleLowerCase('sl-SI')
      .includes(normalizedServiceSearch)
  })
  const sortedMatchingServices = [...matchingServices].sort((first, second) => {
    if (serviceSortOrder === 'urgent-first' || serviceSortOrder === 'standard-first') {
      const urgencyOrder = serviceUrgencyRank[first.urgency] - serviceUrgencyRank[second.urgency]
      return serviceSortOrder === 'urgent-first' ? urgencyOrder : -urgencyOrder
    }

    const idOrder =
      first.id.length === second.id.length
        ? first.id.localeCompare(second.id)
        : first.id.length - second.id.length

    return serviceSortOrder === 'newest' ? -idOrder : idOrder
  })
  const visiblePinnedServices = sortedMatchingServices.filter((service) =>
    pinnedServiceIds.has(service.id),
  )
  const visibleUnpinnedServices = sortedMatchingServices.filter(
    (service) => !pinnedServiceIds.has(service.id),
  )
  const orderedServices = [...visiblePinnedServices, ...visibleUnpinnedServices]
  const normalizedReportSearch = reportSearch.trim().toLocaleLowerCase('sl-SI')
  const matchingReports = reports.filter((report) =>
    [
      report.solar_plant_name,
      serviceTypeLabels[report.service_type] ?? report.service_type,
      report.work_summary,
      report.findings,
      report.recommendations,
      formatDate(report.reported_at),
      report.employee_first_name,
      report.employee_last_name,
    ]
      .filter(Boolean)
      .join(' ')
      .toLocaleLowerCase('sl-SI')
      .includes(normalizedReportSearch),
  )
  const sortedMatchingReports = [...matchingReports].sort((first, second) => {
    const dateOrder =
      new Date(first.reported_at).getTime() - new Date(second.reported_at).getTime()
    return reportSortOrder === 'newest' ? -dateOrder : dateOrder
  })

  return (
      <main className="dashboard-page">
        <DashboardSidebar dashboardPage={dashboardPage} onNavigate={setDashboardPage} onLogout={onLogout} />
        <DashboardHeader isProfile={dashboardPage === 'profile'} onProfile={() => setDashboardPage('profile')}
          profileImage={account?.profile_image_data}
          searchValue={dashboardPage === 'reports' ? reportSearch : serviceSearch}
          searchLabel={dashboardPage === 'reports' ? 'Išči poročila' : 'Išči servise'}
          onSearch={(value) => {
            if (dashboardPage === 'reports') setReportSearch(value)
            else {
              setServiceSearch(value)
              setDashboardPage('services')
            }
          }} />
        {dashboardPage === 'profile' ? <ProfilePage account={account} onAccountChange={onAccountChange} /> : dashboardPage === 'calendar' ? <CalendarPage /> : (
        <section
          className={`dashboard-content${dashboardPage === 'services' ? ' services-dashboard-content' : ''}`}
        >
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
                  setSelectedService(null)
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
                <div className="service-toolbar">

                  <label className="service-sort-field">
                    <span>Razvrsti:</span>
                    <select
                      value={serviceSortOrder}
                      onChange={(event) => {
                        const value = event.target.value
                        if (
                          value === 'oldest' ||
                          value === 'urgent-first' ||
                          value === 'standard-first'
                        ) {
                          setServiceSortOrder(value)
                        } else {
                          setServiceSortOrder('newest')
                        }
                      }}
                    >
                      <option value="newest">Najnovejši</option>
                      <option value="oldest">Najstarejši</option>
                      <option value="urgent-first">Nujno najprej</option>
                      <option value="standard-first">Standardno najprej</option>
                    </select>
                  </label>
                </div>
                <div className="services-heading">
                  <div>
                    <h2>Vsi servisi</h2>
                    <p>Pregled servisov in njihovih terminov.</p>
                  </div>
                  {servicesState === 'loaded' && (
                    <span className="service-count">
                      {matchingServices.length} {matchingServices.length === 1 ? 'servis' : 'servisov'}
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
                {servicePinNotice && (
                  <p className="services-message services-error" role="status">
                    {servicePinNotice}
                  </p>
                )}
                {servicesState === 'loaded' && services.length === 0 && (
                  <p className="services-message">V bazi še ni ustvarjenih servisov.</p>
                )}
                {servicesState === 'loaded' && services.length > 0 && (
                  matchingServices.length > 0 ? (
                  <ul className="service-list">
                    {orderedServices.map((service, index) => (
                      <Fragment key={service.id}>
                        {index === visiblePinnedServices.length &&
                          visiblePinnedServices.length > 0 &&
                          visibleUnpinnedServices.length > 0 && (
                            <li className="service-list-divider" role="separator">
                              <span>Ostali servisi</span>
                            </li>
                          )}
                        <li className={`service-card${pinnedServiceIds.has(service.id) ? ' pinned' : ''}`}>
                        <div className="service-card-heading">
                          <div>
                            <span className="service-type">
                              {serviceTypeLabels[service.service_type] ?? service.service_type}
                            </span>
                            <h3>{service.solar_plant_name}</h3>
                          </div>
                          <div className="service-card-actions">
                            <button
                              className={`service-pin-button${pinnedServiceIds.has(service.id) ? ' pinned' : ''}`}
                              type="button"
                              aria-pressed={pinnedServiceIds.has(service.id)}
                              aria-label={`${pinnedServiceIds.has(service.id) ? 'Odstrani pripenjanje' : 'Pripni servis'}: ${service.solar_plant_name}`}
                              title={pinnedServiceIds.has(service.id) ? 'Odpni servis' : 'Pripni servis'}
                              onClick={() => toggleServicePin(service.id)}
                            >
                              <svg
                                aria-hidden="true"
                                className="pin-icon"
                                viewBox="0 0 24 24"
                              >
                                <path d="m16 3 5 5-4 1-3 3v4l-2 2-2-2v-4L7 9 3 8l5-5h8Z" />
                                <path d="M12 18v4" />
                              </svg>
                            </button>
                            <button
                              className="service-details-button"
                              type="button"
                              onClick={() => setSelectedService(service)}
                            >
                              Podrobnosti
                            </button>
                          </div>
                        </div>
                        </li>
                      </Fragment>
                    ))}
                  </ul>
                  ) : (
                    <p className="services-message">Za iskanje »{serviceSearch}« ni servisov.</p>
                  )
                )}
              </>
            ) : (
              <>
                <div className="service-toolbar">

                  <label className="service-sort-field">
                    <span>Razvrsti:</span>
                    <select
                      value={reportSortOrder}
                      onChange={(event) => {
                        const value = event.target.value
                        setReportSortOrder(value === 'oldest' ? 'oldest' : 'newest')
                      }}
                    >
                      <option value="newest">Najnovejši</option>
                      <option value="oldest">Najstarejši</option>
                    </select>
                  </label>
                </div>
                <div className="services-heading">
                  <div>
                    <h2>Ustvarjena poročila</h2>
                    <p>Pregled servisnih poročil.</p>
                  </div>
                  {reportsState === 'loaded' && (
                    <span className="service-count">
                      {matchingReports.length} {matchingReports.length === 1 ? 'poročilo' : 'poročil'}
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
                {reportsState === 'loaded' && reports.length === 0 && !normalizedReportSearch && (
                  <p className="services-message report-empty-state">
                    Trenutno še ni ustvarjenih servisnih poročil.
                  </p>
                )}
                {reportsState === 'loaded' &&
                  reports.length > 0 &&
                  matchingReports.length === 0 && (
                    <p className="services-message report-empty-state">
                      Za iskanje »{reportSearch}« ni poročil.
                    </p>
                  )}
                {reportsState === 'loaded' && reports.length > 0 && (
                  matchingReports.length > 0 ? (
                  <ul className="report-list">
                    {sortedMatchingReports.map((report) => (
                      <li className="report-card" key={report.id}>
                        <button
                          className="report-card-open"
                          type="button"
                          onClick={() => setSelectedReport(report)}
                        >
                          <h3>{report.solar_plant_name}</h3>
                          <span className="visually-hidden">Odpri podrobnosti poročila</span>
                        </button>
                        {!report.submitted_at && (
                          <div className="report-card-actions">
                            <>
                              <button
                                className="report-edit-button"
                                type="button"
                                onClick={() => {
                                  setEditingReport(report)
                                  setSelectedReport(null)
                                  setSelectedService(null)
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
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : null)}
                {reportActionNotice && (
                  <p className="services-message services-error" role="alert">
                    {reportActionNotice}
                  </p>
                )}

              </>
            )}
          </div>
          {selectedService && (
            <div
              className="modal-backdrop"
              onClick={(event) => {
                if (event.target === event.currentTarget) {
                  setSelectedService(null)
                }
              }}
            >
              <section
                className="modal-panel"
                role="dialog"
                aria-modal="true"
                aria-labelledby="service-modal-title"
                tabIndex={-1}
              >
                <div className="modal-heading">
                  <div>
                    <span className="service-type">
                      {serviceTypeLabels[selectedService.service_type] ?? selectedService.service_type}
                    </span>
                    <h2 id="service-modal-title">{selectedService.solar_plant_name}</h2>
                  </div>
                  <button
                    className="modal-close-button"
                    type="button"
                    aria-label="Zapri podrobnosti servisa"
                    onClick={() => setSelectedService(null)}
                  >
                    ×
                  </button>
                </div>
                <dl className="service-details modal-service-details">
                  <div>
                    <dt>Stopnja nujnosti</dt>
                    <dd>
                      <span className={`service-urgency urgency-${selectedService.urgency}`}>
                        {serviceUrgencyLabels[selectedService.urgency]}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt>Stanje</dt>
                    <dd>{serviceStatusLabels[selectedService.status] ?? selectedService.status}</dd>
                  </div>
                  <div>
                    <dt>Stranka</dt>
                    <dd>
                      {selectedService.customer_first_name} {selectedService.customer_last_name}
                    </dd>
                  </div>
                  <div>
                    <dt>Lokacija</dt>
                    <dd>
                      {selectedService.installation_address}, {selectedService.postal_code}{' '}
                      {selectedService.city}
                    </dd>
                  </div>
                  <div>
                    <dt>Termin</dt>
                    <dd>{formatDate(selectedService.scheduled_at)}</dd>
                  </div>
                  <div>
                    <dt>Zaposleni</dt>
                    <dd>
                      {selectedService.employee_first_name
                        ? `${selectedService.employee_first_name} ${selectedService.employee_last_name}`
                        : 'Ni dodeljen'}
                    </dd>
                  </div>
                  {selectedService.completed_at && (
                    <div>
                      <dt>Zaključen</dt>
                      <dd>{formatDate(selectedService.completed_at)}</dd>
                    </div>
                  )}
                  {selectedService.notes && (
                    <div className="report-detail-wide">
                      <dt>Opombe</dt>
                      <dd>{selectedService.notes}</dd>
                    </div>
                  )}
                </dl>
              </section>
            </div>
          )}
          {selectedReport && (
            <div
              className="modal-backdrop"
              onClick={(event) => {
                if (event.target === event.currentTarget) {
                  setSelectedReport(null)
                }
              }}
            >
              <section
                className="modal-panel"
                role="dialog"
                aria-modal="true"
                aria-labelledby="report-details-title"
                tabIndex={-1}
              >
                <div className="modal-heading">
                  <div>
                    <span className="service-type">
                      {serviceTypeLabels[selectedReport.service_type] ?? selectedReport.service_type}
                    </span>
                    <h2 id="report-details-title">{selectedReport.solar_plant_name}</h2>
                  </div>
                  <button
                    className="modal-close-button"
                    type="button"
                    aria-label="Zapri podrobnosti poročila"
                    onClick={() => setSelectedReport(null)}
                  >
                    ×
                  </button>
                </div>
                <dl className="service-details modal-service-details">
                  <div>
                    <dt>Ustvaril</dt>
                    <dd>
                      {selectedReport.employee_first_name} {selectedReport.employee_last_name}
                    </dd>
                  </div>
                  <div>
                    <dt>Datum poročila</dt>
                    <dd>{formatDate(selectedReport.reported_at)}</dd>
                  </div>
                  {selectedReport.submitted_at && (
                    <div>
                      <dt>Oddano</dt>
                      <dd>{formatDate(selectedReport.submitted_at)}</dd>
                    </div>
                  )}
                  <div className="report-detail-wide">
                    <dt>Povzetek dela</dt>
                    <dd>{selectedReport.work_summary}</dd>
                  </div>
                  {selectedReport.findings && (
                    <div className="report-detail-wide">
                      <dt>Ugotovitve</dt>
                      <dd>{selectedReport.findings}</dd>
                    </div>
                  )}
                  {selectedReport.recommendations && (
                    <div className="report-detail-wide">
                      <dt>Priporočila</dt>
                      <dd>{selectedReport.recommendations}</dd>
                    </div>
                  )}
                </dl>
              </section>
            </div>
          )}
          {isCreatingReport && (
            <div
              className="modal-backdrop"
              onClick={(event) => {
                if (event.target === event.currentTarget && !isSubmittingReport) {
                  setIsCreatingReport(false)
                  setEditingReport(null)
                  setReportFormNotice('')
                }
              }}
            >
              <section
                className="modal-panel report-modal-panel"
                role="dialog"
                aria-modal="true"
                aria-labelledby="report-modal-title"
                tabIndex={-1}
              >
                <div className="modal-heading">
                  <h2 id="report-modal-title">
                    {editingReport ? 'Uredi servisno poročilo' : 'Novo servisno poročilo'}
                  </h2>
                  <button
                    className="modal-close-button"
                    type="button"
                    aria-label="Zapri obrazec poročila"
                    disabled={isSubmittingReport}
                    onClick={() => {
                      setIsCreatingReport(false)
                      setEditingReport(null)
                      setReportFormNotice('')
                    }}
                  >
                    ×
                  </button>
                </div>
                <form
                  className="report-form"
                  key={editingReport?.id ?? 'new'}
                  onSubmit={handleReportSubmit}
                >
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
              </section>
            </div>
          )}
        </section>
        )}
      </main>
    )
}

export default DashboardPage
