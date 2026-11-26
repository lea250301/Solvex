import { useState } from 'react'
import type { Account, CustomerPage } from '../../types'
import { DashboardHeader } from '../../components/DashboardHeader'
import { CustomerSidebar } from '../../components/CustomerSidebar'
import CustomerOverview from './CustomerOverview'
import PlantsPage from './PlantsPage'
import CurrentServicesPage from './CurrentServicesPage'
import ServiceHistoryPage from './ServiceHistoryPage'
import InformationPage from './InformationPage'
import RecommendationsPage from './RecommendationsPage'
import InspectionPage from './InspectionPage'
import FaultPage from './FaultPage'
import ProfilePage from '../ProfilePage'
import '../DashboardPage.css'
import './CustomerDashboard.css'

const blankPages = {
  plants: PlantsPage,
  'current-services': CurrentServicesPage,
  history: ServiceHistoryPage,
  information: InformationPage,
  recommendations: RecommendationsPage,
  inspection: InspectionPage,
  fault: FaultPage,
}

export default function CustomerDashboardPage({ route, account, onAccountChange, onLogout }: {
  route: string
  account: Account | null
  onAccountChange: (account: Account) => void
  onLogout: () => void
}) {
  const [search, setSearch] = useState('')
  const requested = route.split('/')[1] ?? 'overview'
  const page: CustomerPage = requested === 'profile' ? 'profile' : Object.hasOwn(blankPages, requested) ? requested as keyof typeof blankPages : 'overview'
  const Content = page === 'overview' || page === 'profile' ? null : blankPages[page]
  function navigate(next: CustomerPage) {
    window.location.hash = next === 'overview' ? 'lastnik' : `lastnik/${next}`
  }
  return (
    <main className="dashboard-page customer-dashboard">
      <CustomerSidebar page={page} onNavigate={navigate} onLogout={onLogout} />
      <DashboardHeader isProfile={page === 'profile'} onProfile={() => navigate('profile')}
        profileImage={account?.profile_image_data}
        searchValue={search} searchLabel="Išči po nadzorni plošči" onSearch={(value) => {
          setSearch(value)
          if (page !== 'overview') navigate('overview')
        }} />
      {page === 'profile' ? <ProfilePage account={account} onAccountChange={onAccountChange} /> : Content ? <Content /> : <CustomerOverview search={search} firstName={account?.first_name} />}
    </main>
  )
}
