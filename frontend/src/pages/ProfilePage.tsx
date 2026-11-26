import { useState } from 'react'
import type { Account } from '../types'
import { useProfile } from '../hooks/useProfile'
import { SolarHouse } from '../components/SolarHouse'
import avatar from '../assets/profile-avatar.svg'
import './ProfilePage.css'

export default function ProfilePage({ account, onAccountChange }: { account: Account | null; onAccountChange: (account: Account) => void }) {
  const { plants, services, loading, error, notice, saving, savePhoto } = useProfile(account, onAccountChange)
  const [plantId, setPlantId] = useState('')
  const plant = plants.find(item => item.id === plantId) ?? plants[0]
  const labels: Record<string, string> = { electrical: 'Elektro servis', cleaning: 'Čiščenje panelov', installer: 'Montaža' }
  return (
    <section className="dashboard-profile-page profile-page" aria-label="Profil">
      <h1>Moj profil</h1>
      <div className="profile-identity">
        <img className="profile-photo" src={account?.profile_image_data || avatar} alt="Profilna fotografija" width="100" height="100" />
        <div className="profile-identity-copy">
          <h2>{account ? `${account.first_name} ${account.last_name}` : 'Vaš profil'}</h2>
          {account ? <p>{account.email}</p> : <p><a href="#prijava">Prijavi se</a> za osebne podatke in shranjevanje fotografije.</p>}
          {account && <div className="profile-photo-actions">
            <label className={`profile-photo-picker${saving ? ' disabled' : ''}`}>
              {saving ? 'Shranjevanje ...' : 'Izberi fotografijo'}
              <input className="visually-hidden" type="file" aria-label="Izberi profilno fotografijo" accept="image/png,image/jpeg,image/webp" disabled={saving}
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  event.target.value = ''
                  if (file) void savePhoto(file)
                }} />
            </label>
            {account.profile_image_data && <button type="button" className="profile-remove-photo" disabled={saving} onClick={() => void savePhoto(null)}>Odstrani fotografijo</button>}
          </div>}
          {account && <p className="profile-photo-hint">PNG, JPEG ali WebP, do 5 MB. Fotografijo prilagodimo kvadratnemu izrezu.</p>}
        </div>
      </div>
      {notice && <p className="profile-status" role="status">{notice}</p>}
      {loading && <p className="profile-status" role="status">Nalaganje profila ...</p>}
      {error && <p className="profile-status profile-error" role="alert">{error}</p>}
      {account?.role === 'customer' && <>
        <section className="profile-house-card" aria-labelledby="house-title">
          <div className="profile-section-heading"><h2 id="house-title">Vaš dom, vaša energija</h2>
            {plants.length > 1 && <select aria-label="Izberi elektrarno" value={plant?.id ?? ''} onChange={(event) => setPlantId(event.target.value)}>{plants.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select>}
          </div>
          <div className="profile-house-content">
            <SolarHouse panelCount={plant?.panel_count ?? null} />
            <div className="profile-house-details">
              <h3>{plant?.name ?? 'Vaša sončna elektrarna'}</h3>
              <p>{plant ? `${plant.installation_address}, ${plant.postal_code} ${plant.city}` : account ? 'Ko bo elektrarna dodana v račun, bodo njeni podatki prikazani tukaj.' : 'Prijavite se za prikaz svoje elektrarne.'}</p>
              {plant && <dl><div><dt>Paneli</dt><dd>{plant.panel_count ?? 'Ni podatka'}</dd></div><div><dt>Moč elektrarne</dt><dd>{plant.installed_capacity_kw ? `${Number(plant.installed_capacity_kw).toLocaleString('sl-SI')} kW` : 'Ni podatka'}</dd></div></dl>}
              <small>Shematska ilustracija, ne dejanski načrt hiše.</small>
            </div>
          </div>
        </section>
        <section className="profile-service-history" aria-labelledby="profile-services-title">
          <h2 id="profile-services-title">Pretekli servisi</h2>
          {services.length ? <ul>{services.map(service => <li key={service.id}>
            <div><strong>{labels[service.service_type] ?? service.service_type}</strong><span>{service.solar_plant_name}</span></div>
            <time dateTime={service.completed_at ?? service.scheduled_at ?? undefined}>{service.completed_at || service.scheduled_at ? new Intl.DateTimeFormat('sl-SI', { dateStyle: 'medium' }).format(new Date(service.completed_at ?? service.scheduled_at!)) : 'Datum ni določen'}</time>
          </li>)}</ul> : <p>{account ? 'Še ni zabeleženih zaključenih servisov.' : 'Zgodovina vaših servisov bo vidna po prijavi.'}</p>}
        </section>
      </>}
    </section>
  )
}
