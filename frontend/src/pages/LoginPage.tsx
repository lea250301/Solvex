import type { AuthState } from '../hooks/useAuth'
import { LoginForm } from '../components/LoginForm'
import { LoginMosaic } from '../components/LoginMosaic'
import './LoginPage.css'

export default function LoginPage({ auth }: { auth: AuthState }) {
  return (
    <main className="login-page">
      <section className="login-panel" aria-labelledby="login-title">
        <div className="login-panel-content">
          <h1 id="login-title">Prijava v račun</h1>
          <p className="login-intro">Dobrodošli nazaj.<br />Vpišite se za pregled svojih servisov.</p>
          <LoginForm auth={auth} />
          <p className="login-note">Še nimaš računa? <a href="#registracija">Registracija</a></p>
        </div>
        <span className="login-panel-caption">Skrb za energijo na enem mestu.</span>
      </section>
      <LoginMosaic />
    </main>
  )
}
