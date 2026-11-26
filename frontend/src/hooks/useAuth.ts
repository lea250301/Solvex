import { useCallback, useEffect, useRef, useState, type SubmitEvent } from 'react'
import { apiBase } from '../lib/api'
import type { Account, Employee } from '../types'

export function useAuth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [account, setAccount] = useState<Account | null>(null)
  const authenticatedOnServer = useRef(false)
  const restoreController = useRef<AbortController | null>(null)
  const [notice, setNotice] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const employee = account?.role === 'employee' ? account : null

  useEffect(() => {
    let restore = false
    try { restore = localStorage.getItem('solvex:session') === 'true' } catch { /* Storage is optional. */ }
    if (!restore) return
    const controller = new AbortController()
    restoreController.current = controller
    void fetch(`${apiBase}/auth/me`, { signal: controller.signal, credentials: 'same-origin' })
      .then(async (response) => {
        const result = await response.json() as { account?: Account }
        if (controller.signal.aborted) return
        if (response.ok && result.account) {
          authenticatedOnServer.current = true
          setAccount(result.account)
        } else {
          try { localStorage.removeItem('solvex:session') } catch { /* Storage is optional. */ }
        }
      }).catch(() => { /* A failed restore leaves the login available. */ })
    return () => controller.abort()
  }, [])

  async function login(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    restoreController.current?.abort()
    setNotice('')
    setIsSubmitting(true)
    try {
      const response = await fetch(`${apiBase}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: email, password }),
      })
      const result = (await response.json().catch(() => ({}))) as {
        message?: string
        employee?: Employee
        account?: Account
      }
      if (!response.ok) {
        setNotice(result.message ?? 'Prijava ni uspela.')
        return
      }
      if (!result.account && !result.employee) {
        setNotice('Prijava ni uspela. Poskusi znova.')
        return
      }
      if (result.account) {
        setAccount(result.account)
        authenticatedOnServer.current = true
        try { localStorage.setItem('solvex:session', 'true') } catch { /* No token is stored in localStorage. */ }
      } else if (result.employee) {
        setAccount({ ...result.employee, role: 'employee', profile_image_data: null })
      }
      setPassword('')
    } catch {
      setNotice('Backend trenutno ni dosegljiv. Poskusi znova.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function logout() {
    restoreController.current?.abort()
    if (authenticatedOnServer.current) {
      try {
        const response = await fetch(`${apiBase}/auth/logout`, { method: 'POST' })
        if (!response.ok) throw new Error('Logout failed')
      } catch {
        setNotice('Odjava ni uspela. Poskusi znova.')
        return false
      }
    }
    authenticatedOnServer.current = false
    try { localStorage.removeItem('solvex:session') } catch { /* Storage is optional. */ }
    setAccount(null)
    setEmail('')
    setPassword('')
    setNotice('')
    return true
  }

  const updateAccount = useCallback((next: Account) => {
    setAccount(current => current?.id === next.id && current.role === next.role ? next : current)
  }, [])

  return { email, setEmail, password, setPassword, employee, account, setAccount: updateAccount, notice, isSubmitting, login, logout }
}

export type AuthState = ReturnType<typeof useAuth>
