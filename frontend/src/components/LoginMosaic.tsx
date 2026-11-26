import type { CSSProperties } from 'react'
import solarPhoto from '../assets/solar-technician.jpg'

export function LoginMosaic() {
  const rowOffsets = [
    '0px',
    'calc(0.55 * var(--row-unit) + var(--mosaic-gap))',
    'calc(1.55 * var(--row-unit) + 2 * var(--mosaic-gap))',
    'calc(2.55 * var(--row-unit) + 3 * var(--mosaic-gap))',
  ]
  return (
    <section className="login-mosaic" aria-label="Serviserka ob sončnih panelih"
      style={{ '--solar-photo': `url("${solarPhoto}")` } as CSSProperties}>
      {Array.from({ length: 16 }, (_, index) => {
        const card = index === 9 ? 'green' : index === 10 ? 'black' : index === 11 ? 'white' : null
        return card ? (
          <div key={index} className={`mosaic-card mosaic-card-${card}`} aria-hidden="true" />
        ) : (
          <div key={index} className={`mosaic-photo${[0, 7, 14].includes(index) ? ' mosaic-photo-blurred' : ''}`} aria-hidden="true"
            style={{
              '--tile-x': `calc(${[0, 0.45, 1.45, 2.45][index % 4]} * var(--column-unit) + ${index % 4} * var(--mosaic-gap))`,
              '--tile-y': rowOffsets[Math.floor(index / 4)],
            } as CSSProperties} />
        )
      })}
    </section>
  )
}
