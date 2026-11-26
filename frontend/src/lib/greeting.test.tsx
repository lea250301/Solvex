import { describe, expect, it } from 'vitest'
import { greetingAt } from './greeting'

describe('Pozdrav glede na uro', () => {
  it.each([[5, 'Dobro jutro'], [11, 'Dobro jutro'], [12, 'Dober dan'], [17, 'Dober dan'], [18, 'Dober večer'], [23, 'Dober večer'], [0, 'Dober večer']])('ob %i uporabi %s', (hour, expected) => {
    expect(greetingAt(new Date(2026, 10, 23, Number(hour)))).toBe(expected)
  })
})
