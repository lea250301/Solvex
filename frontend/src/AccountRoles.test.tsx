import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

const manager = { id: '3', first_name: 'Maja', last_name: 'Vodja', email: 'maja@test.si', role: 'manager', profile_image_data: null }
beforeEach(() => {
  localStorage.clear()
  window.history.replaceState(null, '', window.location.pathname)
})
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

describe('Registracije in ločeni delovni prostori', () => {
  for (const [username, role, navigation] of [
    ['lastnik', 'customer', 'Navigacija lastnika'],
    ['zaposlen', 'employee', 'Navigacija zaposlenega'],
    ['vodja', 'manager', 'Navigacija vodje servisa'],
  ]) it(`uporabniško ime ${username} samodejno odpre pravi delovni prostor`, async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => Promise.resolve(Response.json(
      url.endsWith('/auth/login') ? { account: { id: '10', first_name: username, last_name: 'Test', email: `${username}@solvex.local`, profile_image_data: null, role, service_type: 'electrical' } }
        : { services: [], overview: { active_services: 0, pending_requests: 0, employees: 0, submitted_reports: 0 } },
    )))
    vi.stubGlobal('fetch', fetchMock)
    render(<App />)
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('E-pošta ali uporabniško ime'), username)
    await user.type(screen.getByLabelText('Geslo'), 'geslo123')
    await user.click(screen.getByRole('button', { name: 'Prijava' }))
    expect(await screen.findByRole('navigation', { name: navigation })).toBeTruthy()
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/login', expect.objectContaining({ body: JSON.stringify({ identifier: username, password: 'geslo123' }) }))
  })

  it('anonimna pot lastnika ne odpre zasebnega delovnega prostora', () => {
    window.history.replaceState(null, '', '#lastnik/profile')
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Prijava v račun' })).toBeTruthy()
    expect(screen.queryByRole('navigation', { name: 'Navigacija lastnika' })).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: 'Lastnik' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Zaposleni' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Vodja servisa' })).toBeNull()
  })

  for (const [route, endpoint, label] of [
    ['serviser', 'employees', 'Zaposleni'], ['vodja', 'managers', 'Vodja servisa'],
  ]) it(`registracija ${route} uporablja ustrezna polja in API`, async () => {
    window.history.replaceState(null, '', `#registracija/${route}`)
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ account: { id: '8' } }, { status: 201 }))
    vi.stubGlobal('fetch', fetchMock)
    render(<App />)
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Ime'), 'Ana')
    await user.type(screen.getByLabelText('Priimek'), 'Novak')
    await user.type(screen.getByLabelText('E-poštni naslov'), 'ana@test.si')
    await user.type(screen.getByLabelText('Geslo (vsaj 8 znakov)'), 'Password123!')
    await user.type(screen.getByLabelText('Telefon'), '040123456')
    expect(screen.queryByLabelText('Naslov')).toBeNull()
    if (route === 'serviser') await user.selectOptions(screen.getByLabelText('Področje dela'), 'cleaning')
    else expect(screen.queryByLabelText('Področje dela')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Ustvari račun' }))
    expect((await screen.findByRole('status')).textContent).toContain(label)
    const call = fetchMock.mock.calls[0]
    expect(call[0]).toBe(`/api/${endpoint}/register`)
    expect(JSON.parse(call[1].body)).toMatchObject({ phone: '040123456', ...(route === 'serviser' ? { serviceType: 'cleaning' } : {}) })
    expect(screen.queryByRole('button', { name: 'Odjava' })).toBeNull()
  })

  it('menjava vrste registracije počisti prejšnji obrazec in prikaže prava polja', async () => {
    window.history.replaceState(null, '', '#registracija')
    render(<App />)
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Ime'), 'Prejšnji')
    await user.click(screen.getByRole('link', { name: 'Serviser' }))
    expect(await screen.findByLabelText('Področje dela')).toBeTruthy()
    expect(screen.getByLabelText('Ime')).toHaveProperty('value', '')
    expect(screen.queryByLabelText('Naslov')).toBeNull()
  })

  it('prijava vodje odpre lasten pregled in ne serviserjevega obrazca za poročila', async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => Promise.resolve(Response.json(
      url.endsWith('/login') ? { account: manager } : { overview: { active_services: 4, pending_requests: 2, employees: 3, submitted_reports: 1 } },
    )))
    vi.stubGlobal('fetch', fetchMock)
    render(<App />)
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('E-pošta ali uporabniško ime'), manager.email)
    await user.type(screen.getByLabelText('Geslo'), 'Password123!')
    await user.click(screen.getByRole('button', { name: 'Prijava' }))
    expect(await screen.findByRole('navigation', { name: 'Navigacija vodje servisa' })).toBeTruthy()
    expect(await screen.findByText('Aktivni servisi')).toBeTruthy()
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/login', expect.objectContaining({ method: 'POST' }))
    expect(fetchMock).toHaveBeenCalledWith('/api/managers/overview', expect.anything())
    expect(screen.queryByRole('button', { name: 'Novo poročilo' })).toBeNull()
  })

  it('obnovi vlogo iz seje tudi na URL-ju druge vloge, omogoči napako in ponovni poskus', async () => {
    localStorage.setItem('solvex:session', 'true')
    window.history.replaceState(null, '', '#lastnik')
    let attempts = 0
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.endsWith('/auth/me')) return Promise.resolve(Response.json({ account: manager }))
      if (url.endsWith('/auth/logout')) return Promise.resolve(Response.json({ message: 'Odjava' }))
      if (url.endsWith('/account/profile')) return Promise.resolve(Response.json({ account: manager, plants: [], services: [] }))
      attempts++
      return Promise.resolve(attempts === 1 ? Response.json({ message: 'Začasna napaka.' }, { status: 503 }) : Response.json({ overview: { active_services: 0, pending_requests: 0, employees: 0, submitted_reports: 0 } }))
    })
    vi.stubGlobal('fetch', fetchMock)
    render(<App />)
    const user = userEvent.setup()
    expect((await screen.findByRole('alert')).textContent).toContain('Začasna napaka.')
    await user.click(screen.getByRole('button', { name: 'Poskusi znova' }))
    expect(await screen.findByText('Aktivni servisi')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Odpri profil' }))
    expect(await screen.findByRole('heading', { name: 'Moj profil' })).toBeTruthy()
    expect(screen.queryByText('Moja elektrarna')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Odjava' }))
    expect(await screen.findByRole('heading', { name: 'Prijava v račun' })).toBeTruthy()
    expect(localStorage.getItem('solvex:session')).toBeNull()
  })

  it('vodja pregleda zahtevke, obremenitev in oddana poročila brez urejanja', async () => {
    localStorage.setItem('solvex:session', 'true')
    const fetchMock = vi.fn().mockImplementation((url: string) => Promise.resolve(Response.json(
      url.endsWith('/auth/me') ? { account: manager }
        : url.endsWith('/managers/requests') ? { requests: [{ id: '1', solar_plant_name: 'Sončni dom', request_type: 'fault_report', status: 'submitted', description: 'Napaka razsmernika', customer_first_name: 'Ana', customer_last_name: 'Lastnik' }] }
          : url.endsWith('/managers/employees') ? { employees: [{ id: '2', first_name: 'Tim', last_name: 'Serviser', email: 'tim@test.si', service_type: 'electrical', active_services: 2 }] }
            : url.endsWith('/managers/service-reports') ? { reports: [{ id: '3', solar_plant_name: 'Sončni dom', employee_first_name: 'Tim', employee_last_name: 'Serviser', service_type: 'electrical', work_summary: 'Pregled razsmernika', findings: 'Brez napak', recommendations: null }] }
              : { services: [] },
    )))
    vi.stubGlobal('fetch', fetchMock)
    render(<App />)
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Zahtevki' }))
    expect(await screen.findByText('Napaka razsmernika')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Serviserji' }))
    expect(await screen.findByText('Aktivni servisi: 2')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Oddana poročila' }))
    expect(await screen.findByText('Pregled razsmernika')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Uredi|Oddaj/ })).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Servisi' }))
    expect(await screen.findByText('Za zdaj ni podatkov.')).toBeTruthy()
    expect(fetchMock.mock.calls.every(([, options]) => !options?.method || options.method === 'GET')).toBe(true)
  })
})
