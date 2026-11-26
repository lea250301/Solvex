import avatar from '../assets/profile-avatar.svg'

type DashboardHeaderProps = {
  isProfile: boolean
  onProfile: () => void
  searchValue: string
  onSearch: (value: string) => void
  searchLabel: string
  profileImage?: string | null
}

export function DashboardHeader({ isProfile, onProfile, searchValue, onSearch, searchLabel, profileImage }: DashboardHeaderProps) {
  return (
    <header className="dashboard-topbar">
      <label className="dashboard-global-search">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4" /></svg>
        <input type="search" aria-label={searchLabel} placeholder="Išči ..." value={searchValue}
          onChange={(event) => onSearch(event.target.value)} />
      </label>
      <button className="profile-avatar-button" type="button" aria-label="Odpri profil"
        aria-current={isProfile ? 'page' : undefined}
        title="Profil" onClick={onProfile}>
        <img src={profileImage || avatar} alt="" width="42" height="42" />
      </button>
    </header>
  )
}
