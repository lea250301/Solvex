import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

const employee = { id: '1', first_name: 'Test', last_name: 'Serviser', email: 'test@example.com', service_type: 'electrical' }

async function login() {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText('Službeni e-poštni naslov'), employee.email)
  await user.type(screen.getByLabelText('Geslo'), 'TestPassword123!')
  await user.click(screen.getByRole('button', { name: 'Prijava' }))
  return user
}

beforeEach(() => localStorage.clear())
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
    expect(fetchMock).toHaveBeenCalledWith('/api/employees/login', expect.objectContaining({ method: 'POST', body: JSON.stringify({ email: employee.email, password: 'TestPassword123!' }) }))
    expect(fetchMock).toHaveBeenCalledWith('/api/services', expect.anything())
  })

  it('ne sprejme uspešnega odgovora brez zaposlenega', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({})))
    render(<App />)
    await login()
    expect((await screen.findByRole('status')).textContent).toContain('Prijava ni uspela')
  })

  it('ne pošlje obrazca brez obveznega gesla', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    render(<App />)
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Službeni e-poštni naslov'), employee.email)
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
