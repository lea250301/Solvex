import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import type { Account } from '../types'
import ProfilePage from './ProfilePage'
import App from '../App'
import { prepareProfileImage } from '../lib/profileImage'

vi.mock('../lib/profileImage', () => ({ prepareProfileImage: vi.fn() }))
const owner: Account = { id: '9', role: 'customer', first_name: 'Ana', last_name: 'Novak', email: 'ana@example.com', profile_image_data: null }
const image = 'data:image/jpeg;base64,/9j/AA=='
const plant = { id: '4', name: 'Sončni dom', installation_address: 'Sončna 1', postal_code: '2000', city: 'Maribor', installed_capacity_kw: '5.50', panel_count: 12 }
const service = { id: '8', service_type: 'cleaning', solar_plant_name: 'Sončni dom', completed_at: '2026-10-01T12:00:00Z', scheduled_at: null }

function ProfileFixture() {
  const [account, setAccount] = useState<Account>(owner)
  return <ProfilePage account={account} onAccountChange={setAccount} />
}

beforeEach(() => {
  localStorage.clear()
  window.history.replaceState(null, '', window.location.pathname)
  vi.mocked(prepareProfileImage).mockReset()
})
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

describe('Osebni profil', () => {
  it('prikaže ime, elektrarno, shemo panelov in zaključene servise', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ account: owner, plants: [plant], services: [service] })))
    render(<ProfileFixture />)
    expect(screen.getByRole('heading', { name: 'Ana Novak' })).toBeTruthy()
    expect(await screen.findByRole('heading', { name: 'Sončni dom' })).toBeTruthy()
    expect(screen.getByRole('img', { name: 'Shematski prikaz hiše s sončnimi paneli' })).toBeTruthy()
    expect(screen.getByText('12')).toBeTruthy()
    expect(screen.getByText('Čiščenje panelov')).toBeTruthy()
  })

  it('shrani izbrano fotografijo prek API-ja in osveži sliko', async () => {
    vi.mocked(prepareProfileImage).mockResolvedValue(image)
    const fetchMock = vi.fn().mockImplementation((url: string) => Promise.resolve(Response.json(
      url.endsWith('/photo') ? { account: { ...owner, profile_image_data: image } } : { account: owner, plants: [], services: [] },
    )))
    vi.stubGlobal('fetch', fetchMock)
    render(<ProfileFixture />)
    await userEvent.setup().upload(screen.getByLabelText('Izberi profilno fotografijo'), new File(['photo'], 'profile.jpg', { type: 'image/jpeg' }))
    expect((await screen.findByText('Fotografija je shranjena.')).textContent).toBeTruthy()
    expect(fetchMock).toHaveBeenCalledWith('/api/account/photo', expect.objectContaining({ method: 'PUT', body: JSON.stringify({ image }) }))
    expect(screen.getByRole('img', { name: 'Profilna fotografija' }).getAttribute('src')).toBe(image)
  })

  it('ob zavrnjeni fotografiji ohrani prejšnjo sliko in omogoči ponovni poskus', async () => {
    vi.mocked(prepareProfileImage).mockRejectedValue(new Error('Fotografija naj bo manjša od 5 MB.'))
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ account: owner, plants: [], services: [] }))
    vi.stubGlobal('fetch', fetchMock)
    render(<ProfileFixture />)
    await userEvent.setup().upload(screen.getByLabelText('Izberi profilno fotografijo'), new File(['invalid'], 'large.jpg', { type: 'image/jpeg' }))
    expect(await screen.findByText('Fotografija naj bo manjša od 5 MB.')).toBeTruthy()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(screen.getByLabelText('Izberi profilno fotografijo')).toHaveProperty('disabled', false)
  })

  it('prijavi lastnika, pozdravi z imenom in odpre njegov profil', async () => {
    vi.spyOn(Date.prototype, 'getHours').mockReturnValue(8)
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => Promise.resolve(Response.json(
      url.endsWith('/login') ? { account: owner } : { account: owner, plants: [plant], services: [service] },
    ))))
    render(<App />)
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('E-pošta ali uporabniško ime'), owner.email)
    await user.type(screen.getByLabelText('Geslo'), 'TestPassword123!')
    await user.click(screen.getByRole('button', { name: 'Prijava' }))
    expect(await screen.findByRole('heading', { name: /Dobro jutro, Ana/ })).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Odpri profil' }))
    expect(await screen.findByRole('heading', { name: 'Ana Novak' })).toBeTruthy()
    expect(await screen.findByText('Čiščenje panelov')).toBeTruthy()
  })

  it('po ponovnem nalaganju obnovi račun in fotografijo iz seje', async () => {
    localStorage.setItem('solvex:session', 'true')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ account: { ...owner, profile_image_data: image } })))
    render(<App />)
    expect(await screen.findByRole('heading', { name: /Ana/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Odpri profil' }).querySelector('img')?.getAttribute('src')).toBe(image)
    expect(localStorage.getItem('solvex:session')).toBe('true')
  })
})
