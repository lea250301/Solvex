export function SolarHouse({ panelCount }: { panelCount: number | null }) {
  const visiblePanels = panelCount ? Math.min(panelCount, 24) : 12
  const rows = Math.ceil(visiblePanels / 6)
  const scaleY = Math.min(0.65, 68 / (rows * 30))
  return (
    <svg className="solar-house" viewBox="0 0 600 350" role="img" aria-label="Shematski prikaz hiše s sončnimi paneli">
      <circle cx="310" cy="175" r="145" fill="#eef5e3" />
      <g fill="none" stroke="#6e7d60" strokeWidth="1.4" strokeLinejoin="round">
        <path d="M65 293h475M145 167v126h312V167" />
        <path d="m109 167 94-106h196l94 106Z" fill="#f7f9f2" />
        <path d="m109 167 94-106h196l94 106M399 61v106M203 61v106" opacity="0.35" />
        <path d="M365 61V32h31v29" fill="#f7f9f2" />
        <path d="M280 293v-77h46v77M319 251h1" fill="#f6f8f0" />
        <path d="M175 205h60v49h-60ZM205 205v49M175 229h60M365 205h60v49h-60ZM395 205v49M365 229h60" />
        <path d="M155 293v12h292v-12M87 293v-49m0 16-13-13m13 26 14-16M517 293v-66m0 20-12-14m12 30 15-18" />
      </g>
      <g transform={`translate(215 80) skewX(-22) scale(1 ${scaleY})`} fill="#263b39" stroke="#9eafb0" strokeWidth="1">
        {Array.from({ length: visiblePanels }, (_, index) => (
          <g key={index} transform={`translate(${(index % 6) * 29} ${Math.floor(index / 6) * 30})`}>
            <rect width="26" height="27" rx="1" /><path d="M13 0v27M0 9h26M0 18h26" opacity="0.5" />
          </g>
        ))}
      </g>
    </svg>
  )
}
