import { useState, type SubmitEvent } from 'react'
import { apiBase } from '../lib/api'
import type { AccountRole } from '../types'

export function useRegistration(role: AccountRole = 'customer') {
  const [notice, setNotice] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [registered, setRegistered] = useState(false)

  async function register(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const body = Object.fromEntries(new FormData(form))
    setNotice('')
    setIsSubmitting(true)
    try {
      const endpoint = { customer: 'customers', employee: 'employees', manager: 'managers' }[role]
      const response = await fetch(`${apiBase}/${endpoint}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const result = (await response.json().catch(() => ({}))) as { message?: string; customer?: { id: string }; account?: { id: string } }
      if (!response.ok || !(result.account?.id || result.customer?.id)) {
        setNotice(result.message ?? 'Registracija ni uspela. Poskusi znova.')
        return
      }
      form.reset()
      setRegistered(true)
      const label = { customer: 'Lastnik', employee: 'Zaposleni', manager: 'Vodja servisa' }[role]
      setNotice(`Račun je ustvarjen (${label}). Prijavi se z e-pošto in geslom.`)
    } catch {
      setNotice('Backend trenutno ni dosegljiv. Poskusi znova.')
    } finally {
      setIsSubmitting(false)
    }
  }
  return { notice, isSubmitting, registered, register }
}
