import solarPhoto from '../../assets/solar-technician.jpg'
import { DashboardIcon } from '../../components/DashboardIcon'
import { greetingAt } from '../../lib/greeting'

const quickLinks = [
  { title: 'Moje elektrarne', description: 'Vse o vaših sončnih elektrarnah.', route: 'plants', color: 'white' },
  { title: 'Naroči pregled', description: 'Naredite prostor za brezskrbne dni.', route: 'inspection', color: 'green' },
  { title: 'Prijavi okvaro', description: 'Sporočite nam, kaj potrebuje pozornost.', route: 'fault', color: 'black' },
]
const recommendations = [
  { title: 'Redni pregledi, manj skrbi', category: 'Vzdrževanje', text: 'Redno vzdrževanje za brezskrbno delovanje vaše elektrarne.', position: 'center 30%' },
  { title: 'Več sonca, več energije', category: 'Skrb za panele', text: 'Nasveti za čiščenje in skrb za sončne panele na enem mestu.', position: 'right center' },
  { title: 'Dobro poznajte svojo elektrarno', category: 'Koristno', text: 'Podatki, zgodovina in informacije za lažje načrtovanje.', position: 'left center' },
]

export default function CustomerOverview({ search, firstName }: { search: string; firstName?: string }) {
  const query = search.trim().toLocaleLowerCase('sl-SI')
  const links = quickLinks.filter((item) => `${item.title} ${item.description}`.toLocaleLowerCase('sl-SI').includes(query))
  const cards = recommendations.filter((item) => `${item.title} ${item.category} ${item.text}`.toLocaleLowerCase('sl-SI').includes(query))
  return (
    <section className="customer-overview" aria-label="Nadzorna plošča lastnika">
      <div className="customer-welcome"><h1>{greetingAt()}{firstName ? `, ${firstName}` : ''}.<br /><span>Kakšna je pa tvoja energija danes?</span></h1></div>
      <div className="customer-overview-top">
        <a className="customer-hero" href="#lastnik/plants" aria-label="Razišči svoje elektrarne">
          <img src={solarPhoto} alt="Serviserka ob sončnih panelih" />
          <div className="customer-hero-caption">
            <h2>Vaša elektrarna.<br />Naša skupna prihodnost.</h2>
            <span className="customer-hero-footer">Pregled, skrb in podpora za vašo sončno energijo.<DashboardIcon name="arrow" /></span>
          </div>
        </a>
        <section className="customer-quick-links" aria-labelledby="quick-links-title">
          <h2 id="quick-links-title">Kako vam lahko pomagamo?</h2>
          <div className="customer-quick-list">
            {links.map((item) => (
              <a className={`customer-quick-link customer-quick-link-${item.color}`} href={`#lastnik/${item.route}`} key={item.route}>
                <span className="customer-quick-watermark" aria-hidden="true"><DashboardIcon name={item.route === 'plants' ? 'plants' : item.route === 'inspection' ? 'services' : 'information'} /></span>
                <span className="customer-quick-icon"><DashboardIcon name="arrow" /></span>
                <span><strong>{item.title}</strong><small>{item.description}</small></span>
              </a>
            ))}
            {links.length === 0 && <p className="customer-empty">Ni ustreznih povezav.</p>}
          </div>
        </section>
      </div>
      <section className="customer-recommendations" aria-labelledby="recommendations-title">
        <div className="customer-section-heading"><div><h2 id="recommendations-title">Za prihodnje sončne dni</h2><p>Ideje za vzdrževanje in koristne informacije.</p></div></div>
        <div className="customer-recommendation-grid">
          {cards.map((item) => (
            <a href="#lastnik/recommendations" className="customer-recommendation" key={item.title}>
              <div className="customer-recommendation-image"><img src={solarPhoto} alt="" style={{ objectPosition: item.position }} /></div>
              <div className="customer-recommendation-copy"><h3>{item.title}</h3><p>{item.text}</p><span className="customer-card-footer">Razišči več<DashboardIcon name="arrow" /></span></div>
            </a>
          ))}
        </div>
        {cards.length === 0 && <p className="customer-empty">Za iskanje »{search}« ni priporočil.</p>}
      </section>
    </section>
  )
}
