import './App.css'
import { useHashRoute } from './hooks/useHashRoute'
import { useAuth } from './hooks/useAuth'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import CustomerDashboardPage from './pages/customer/CustomerDashboardPage'
import ManagerDashboardPage from './pages/ManagerDashboardPage'

export default function App() {
  const auth = useAuth()
  const route = useHashRoute()
  if (auth.account?.role === 'manager') return <ManagerDashboardPage account={auth.account} onAccountChange={auth.setAccount} onLogout={auth.logout} />
  if (auth.account?.role === 'customer') {
    return <CustomerDashboardPage route={route} account={auth.account?.role === 'customer' ? auth.account : null} onAccountChange={auth.setAccount} onLogout={async () => {
      if (await auth.logout()) window.location.hash = 'prijava'
    }} />
  }
  if (!auth.account && (route === '#registracija' || route.startsWith('#registracija/'))) {
    const role = route === '#registracija/serviser' ? 'employee' : route === '#registracija/vodja' ? 'manager' : 'customer'
    return <RegisterPage key={role} role={role} />
  }
  return auth.employee
    ? <DashboardPage employee={auth.employee} account={auth.account} onAccountChange={auth.setAccount} onLogout={auth.logout} />
    : <LoginPage auth={auth} />
}
