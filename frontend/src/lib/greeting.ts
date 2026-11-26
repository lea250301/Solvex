export function greetingAt(date = new Date()) {
  const hour = date.getHours()
  if (hour >= 5 && hour < 12) return 'Dobro jutro'
  if (hour >= 12 && hour < 18) return 'Dober dan'
  return 'Dober večer'
}
