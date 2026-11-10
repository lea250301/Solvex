import { useState, type SubmitEvent } from 'react'
import './App.css'

type Employee = {
  first_name: string
  last_name: string
  email: string
  service_type: string
}

function App() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [notice, setNotice] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

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
  }

  if (employee) {
    return (
      <main className="dashboard-page">
        <header className="dashboard-header">
          <a className="brand" href="#" aria-label="Solvex">
            <span className="brand-mark" aria-hidden="true">S</span>
            <span>solvex</span>
          </a>
          <button className="text-button" type="button" onClick={handleLogout}>
            Odjava
          </button>
        </header>
        <section className="dashboard-content">
          <h1>Živjo, {employee.first_name}!</h1>
          <div className="dashboard-placeholder">
            <span className="placeholder-icon" aria-hidden="true">✦</span>
            <h2>Tvoj dashboard je pripravljen</h2>
            <p>
              Tukaj bodo zbrane servisne zahteve, delovni nalogi in ostala
              orodja za ekipo Solvex.
            </p>
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
