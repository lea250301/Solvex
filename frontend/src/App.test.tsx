import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

const employee = { id: '1', first_name: 'Test', last_name: 'Serviser', email: 'test@example.com', service_type: 'electrical' }

async function login() {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText('E-pošta ali uporabniško ime'), employee.email)
  await user.type(screen.getByLabelText('Geslo'), 'TestPassword123!')
  await user.click(screen.getByRole('button', { name: 'Prijava' }))
  return user
}

beforeEach(() => {
  localStorage.clear()
  window.history.replaceState(null, '', window.location.pathname)
})
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

describe('Prijava zaposlenega', () => {
  it('prikaže prijavni obrazec brez klicev API-ja', () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Prijava v račun' })).toBeTruthy()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('prikaže zavrnjene prijavne podatke in ostane na prijavi', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ message: 'Napačno geslo.' }, { status: 401 })))
    render(<App />)
    await login()
    expect(await screen.findByRole('status')).toHaveProperty('textContent', 'Napačno geslo.')
    expect(screen.getByRole('button', { name: 'Prijava' })).toBeTruthy()
  })

  it('ob nedosegljivem strežniku omogoči ponovni poskus', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Network error')))
    render(<App />)
    await login()
    expect((await screen.findByRole('status')).textContent).toContain('Backend trenutno ni dosegljiv')
    expect(screen.getByRole('button', { name: 'Prijava' })).toHaveProperty('disabled', false)
  })

  it('po uspešni prijavi naloži dashboard in servise', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(Response.json({ employee }))
      .mockResolvedValueOnce(Response.json({ services: [] }))
    vi.stubGlobal('fetch', fetchMock)
    render(<App />)
    await login()
    expect(await screen.findByRole('heading', { name: 'Živjo, Test!' })).toBeTruthy()
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/login', expect.objectContaining({ method: 'POST', body: JSON.stringify({ identifier: employee.email, password: 'TestPassword123!' }) }))
    expect(fetchMock).toHaveBeenCalledWith('/api/employees/1/services', expect.anything())
  })

  it('ne sprejme uspešnega odgovora brez zaposlenega', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({})))
    render(<App />)
    await login()
    expect((await screen.findByRole('status')).textContent).toContain('Prijava ni uspela')
  })

  it('odpre prazen profil samo prek avatarja ter prazen koledar prek navigacije', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => Promise.resolve(
      Response.json(url.endsWith('/login') ? { employee } : { services: [] }),
    )))
    render(<App />)
    const user = await login()
    await user.click(await screen.findByRole('button', { name: 'Odpri profil' }))
    expect(screen.getByRole('heading', { name: 'Moj profil' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Odpri profil' }).getAttribute('aria-current')).toBe('page')
    expect(screen.queryByRole('button', { name: 'Profil' })).toBeNull()
    expect(screen.queryByRole('heading', { name: 'Živjo, Test!' })).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Servisi' }))
    expect(await screen.findByRole('heading', { name: 'Živjo, Test!' })).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Koledar' }))
    expect(screen.getByRole('region', { name: 'Koledar' }).childElementCount).toBe(0)
    const logout = screen.getByRole('button', { name: 'Odjava' })
    expect(logout.textContent?.trim()).toBe('')
    await user.click(logout)
    expect(await screen.findByRole('heading', { name: 'Prijava v račun' })).toBeTruthy()
  })

  it('iskanje v zgornji vrstici filtrira dejanski seznam servisov', async () => {
    const baseService = {
      service_type: 'electrical', urgency: 'standardno', status: 'planned', scheduled_at: null,
      completed_at: null, notes: null, installation_address: 'Test 1', postal_code: '2000', city: 'Maribor',
      customer_first_name: 'Test', customer_last_name: 'Lastnik', employee_first_name: 'Test', employee_last_name: 'Serviser',
    }
    const services = [{ ...baseService, id: '1', solar_plant_name: 'Sončni dom' }, { ...baseService, id: '2', solar_plant_name: 'Gorska hiša' }]
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => Promise.resolve(
      Response.json(url.endsWith('/login') ? { employee } : { services }),
    )))
    render(<App />)
    const user = await login()
    expect(await screen.findByRole('heading', { name: 'Gorska hiša' })).toBeTruthy()
    await user.type(screen.getByRole('searchbox', { name: 'Išči servise' }), 'Sončni')
    expect(screen.getByRole('heading', { name: 'Sončni dom' })).toBeTruthy()
    expect(screen.queryByRole('heading', { name: 'Gorska hiša' })).toBeNull()
  })

  it('ob odjavi počisti prijavo in omogoči ponovno prijavo', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(Response.json({ employee }))
      .mockResolvedValueOnce(Response.json({ services: [] }))
      .mockResolvedValueOnce(Response.json({ employee }))
      .mockResolvedValueOnce(Response.json({ services: [] })))
    render(<App />)
    const user = await login()
    await user.click(await screen.findByRole('button', { name: 'Odjava' }))
    expect(screen.getByLabelText('E-pošta ali uporabniško ime')).toHaveProperty('value', '')
    expect(screen.getByLabelText('Geslo')).toHaveProperty('value', '')
    await login()
    expect(await screen.findByRole('heading', { name: 'Živjo, Test!' })).toBeTruthy()
  })

  it('po ponovni prijavi obnovi pripete servise iz lokalne shrambe', async () => {
    const services = [{
      id: '10', service_type: 'electrical', urgency: 'standardno', status: 'planned',
      scheduled_at: null, completed_at: null, notes: null, solar_plant_name: 'Testna elektrarna',
      installation_address: 'Test 1', postal_code: '2000', city: 'Maribor',
      customer_first_name: 'Test', customer_last_name: 'Lastnik',
      employee_first_name: 'Test', employee_last_name: 'Serviser',
    }]
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => Promise.resolve(
      Response.json(url.endsWith('/login') ? { employee } : { services }),
    )))
    render(<App />)
    const user = await login()
    await user.click(await screen.findByRole('button', { name: 'Pripni servis: Testna elektrarna' }))
    expect(JSON.parse(localStorage.getItem('solvex:pinned-services:1') ?? '[]')).toEqual(['10'])
    await user.click(screen.getByRole('button', { name: 'Odjava' }))
    await login()
    expect(await screen.findByRole('button', { name: 'Odstrani pripenjanje: Testna elektrarna' })).toHaveProperty('ariaPressed', 'true')
  })

  it('ne pošlje obrazca brez obveznega gesla', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    render(<App />)
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('E-pošta ali uporabniško ime'), employee.email)
    await user.click(screen.getByRole('button', { name: 'Prijava' }))
    expect(fetchMock).not.toHaveBeenCalled()
    expect((screen.getByLabelText('Geslo') as HTMLInputElement).validity.valueMissing).toBe(true)
  })

  it('ob neveljavnem JSON odgovoru pokaže prijazno napako', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html>Proxy error</html>', { status: 502 })))
    render(<App />)
    await login()
    expect((await screen.findByRole('status')).textContent).toBe('Prijava ni uspela.')
    expect(screen.getByRole('button', { name: 'Prijava' })).toHaveProperty('disabled', false)
  })
})

describe('Registracija lastnika', () => {
  async function fillRegistration() {
    const user = userEvent.setup()
    for (const [label, value] of [
      ['Ime', 'Ana'], ['Priimek', 'Novak'], ['E-poštni naslov', 'ana@test.si'],
      ['Geslo (vsaj 8 znakov)', 'Password123!'], ['Naslov', 'Test 1'],
      ['Poštna številka', '2000'], ['Kraj', 'Maribor'],
    ]) {
      await user.type(screen.getByLabelText(label), value)
    }
    await user.click(screen.getByRole('button', { name: 'Ustvari račun' }))
  }

  it('povezava odpre registracijo in omogoči vrnitev na prijavo', async () => {
    render(<App />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('link', { name: 'Registracija' }))
    expect(await screen.findByRole('heading', { name: 'Registracija' })).toBeTruthy()
    await user.click(screen.getByRole('link', { name: 'Prijava' }))
    expect(await screen.findByRole('heading', { name: 'Prijava v račun' })).toBeTruthy()
  })

  it('pošlje registracijo lastnika in ga ne prijavi kot zaposlenega', async () => {
    window.history.replaceState(null, '', '#registracija')
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ customer: { id: '5' } }, { status: 201 }))
    vi.stubGlobal('fetch', fetchMock)
    render(<App />)
    await fillRegistration()
    expect(fetchMock).toHaveBeenCalledWith('/api/customers/register', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ firstName: 'Ana', lastName: 'Novak', email: 'ana@test.si', password: 'Password123!', address: 'Test 1', postalCode: '2000', city: 'Maribor' }),
    }))
    expect((await screen.findByRole('status')).textContent).toContain('Račun je ustvarjen')
    expect(screen.queryByRole('button', { name: 'Odjava' })).toBeNull()
  })

  it('prikaže napako API-ja in omogoči ponovni poskus registracije', async () => {
    window.history.replaceState(null, '', '#registracija')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ message: 'E-poštni naslov je že registriran.' }, { status: 409 })))
    render(<App />)
    await fillRegistration()
    expect((await screen.findByRole('status')).textContent).toBe('E-poštni naslov je že registriran.')
    expect(screen.getByRole('button', { name: 'Ustvari račun' })).toHaveProperty('disabled', false)
  })
})

describe('Nadzorna plošča prijavljenega lastnika', () => {
  const account = { id: '7', first_name: 'Ana', last_name: 'Novak', email: 'ana@test.si', role: 'customer', profile_image_data: null }
  function restoreOwner() {
    localStorage.setItem('solvex:session', 'true')
    const fetchMock = vi.fn().mockImplementation((url: string) => Promise.resolve(Response.json(url.endsWith('/account/profile') ? { account, plants: [], services: [] } : { account })))
    vi.stubGlobal('fetch', fetchMock)
    return fetchMock
  }
  it('odpre dokumentirane prazne strani in lasten profil po obnovi seje', async () => {
    window.history.replaceState(null, '', '#lastnik')
    const fetchMock = restoreOwner()
    render(<App />)
    const user = userEvent.setup()
    expect(await screen.findByRole('heading', { name: /Kakšna je pa tvoja energija danes/ })).toBeTruthy()
    for (const name of ['Moje elektrarne', 'Trenutni servisi', 'Pretekli servisi', 'Koristne informacije']) {
      await user.click(screen.getByRole('button', { name }))
      expect((await screen.findByRole('region', { name })).childElementCount).toBe(0)
    }
    expect(screen.queryByRole('button', { name: 'Profil' })).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Odpri profil' }))
    expect(await screen.findByRole('heading', { name: 'Moj profil' })).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Odjava' }))
    expect(await screen.findByRole('heading', { name: 'Prijava v račun' })).toBeTruthy()
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/me', expect.anything())
  })

  it('povezave in priporočila vodijo na prazne strani, iskanje pa filtrira vsebino', async () => {
    window.history.replaceState(null, '', '#lastnik')
    restoreOwner()
    render(<App />)
    const user = userEvent.setup()
    await screen.findByRole('heading', { name: /Kakšna je pa tvoja energija danes/ })
    await user.click(screen.getByRole('link', { name: /Naroči pregled/ }))
    expect((await screen.findByRole('region', { name: 'Naroči pregled' })).childElementCount).toBe(0)
    await user.click(screen.getByRole('button', { name: 'Domov' }))
    await user.click(await screen.findByRole('link', { name: /Prijavi okvaro/ }))
    expect((await screen.findByRole('region', { name: 'Prijavi okvaro' })).childElementCount).toBe(0)
    await user.click(screen.getByRole('button', { name: 'Domov' }))
    await user.click(await screen.findByRole('link', { name: /Redni pregledi, manj skrbi/ }))
    expect((await screen.findByRole('region', { name: 'Priporočila' })).childElementCount).toBe(0)
    await user.click(screen.getByRole('button', { name: 'Domov' }))
    await screen.findByRole('heading', { name: /Kakšna je pa tvoja energija danes/ })
    await user.type(screen.getByRole('searchbox', { name: 'Išči po nadzorni plošči' }), 'panele')
    expect(screen.getByRole('link', { name: /Več sonca, več energije/ })).toBeTruthy()
    expect(screen.queryByRole('link', { name: /Redni pregledi, manj skrbi/ })).toBeNull()
  })
})
