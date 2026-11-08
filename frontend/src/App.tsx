import { useState, type ChangeEvent, type FormEvent } from 'react'
import './App.css'

type RegistrationFormData = {
  firstName: string
  lastName: string
  email: string
  password: string
  phone: string
  address: string
  postalCode: string
  city: string
}

const emptyForm: RegistrationFormData = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  phone: '',
  address: '',
  postalCode: '',
  city: '',
}

function App() {
  const [formData, setFormData] = useState<RegistrationFormData>(emptyForm)
  const [notice, setNotice] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleChange(
  event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
  const { name } = event.target
  event.currentTarget.setCustomValidity('')

  const value =
    name === 'postalCode'
      ? event.currentTarget.value.replace(/\D/g, '')
      : event.currentTarget.value

  setFormData((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice('')
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/customers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const result = (await response.json().catch(() => ({}))) as {
        message?: string
      }

      if (!response.ok) {
        setNotice(result.message ?? 'Registracija ni uspela.')
        return
      }

      setNotice(result.message ?? 'Registracija je uspela.')
      setFormData(emptyForm)
    } catch {
      setNotice('Backend trenutno ni dosegljiv. Poskusi znova.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="registration-page">
      <section className="registration-card">
        <h1>USTVARI RAČUN</h1>
        <p>Registracija v sistem Solvex</p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="firstName">
            Ime: <span className="required">*</span>
          </label>
          <input
            id="firstName"
            name="firstName"
            maxLength={100}
            value={formData.firstName}
            onChange={handleChange}
            required
          />

          <label htmlFor="lastName">
            Priimek: <span className="required">*</span>
          </label>
          <input
            id="lastName"
            name="lastName"
            maxLength={100}
            value={formData.lastName}
            onChange={handleChange}
            required
          />

          <label htmlFor="email">
            E-pošta: <span className="required">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            maxLength={254}
            value={formData.email}
            onChange={handleChange}
            required
          />

          <label htmlFor="password">
            Geslo: <span className="required">*</span>
          </label>
          <input
            id="password"
            name="password"
            type="password"
            minLength={8}
            value={formData.password}
            onChange={handleChange}
            onInvalid={(event) => {
              event.currentTarget.setCustomValidity(
              event.currentTarget.value.length === 0
                ? 'Geslo je obvezno.'
                : 'Geslo mora vsebovati vsaj 8 znakov.',
              )
            }}
            required
          />

          <label htmlFor="phone">Telefon:</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            maxLength={30}
            value={formData.phone}
            onChange={handleChange}
          />

          <label htmlFor="address">
            Ulica in hišna številka: <span className="required">*</span>
          </label>
          <input
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
          />

          <label htmlFor="postalCode">
            Poštna številka: <span className="required">*</span>
          </label>
          <input
            id="postalCode"
            name="postalCode"
            type="text"
            inputMode="numeric"
            pattern="[0-9]+"
            maxLength={20}
            value={formData.postalCode}
            onChange={handleChange}
            required
          />

          <label htmlFor="city">
            Kraj: <span className="required">*</span>
          </label>
          <input
            id="city"
            name="city"
            maxLength={100}
            value={formData.city}
            onChange={handleChange}
            required
          />

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'REGISTRACIJA ...' : 'USTVARI RAČUN'}
          </button>
        </form>

        {notice && <p role="status">{notice}</p>}
      </section>
    </main>
  )
}

export default App