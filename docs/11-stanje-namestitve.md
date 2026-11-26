# Stanje namestitve

## PostgreSQL na Renderju

Ustvarjeno in preverjeno 16. 11. 2026:

- Ime: `solvex-db`.
- Paket: **Free**, brez visoke razpoložljivosti in samodejnega povečevanja diska.
- Regija: Frankfurt.
- PostgreSQL: 18.
- Iztek brezplačne baze: **16. 12. 2026**.
- [Render Dashboard](https://dashboard.render.com/d/dpg-dbtd076k1f9s73c733r0-a).

Inicializirana je shema iz `database/schema.sql`, zabeležena kot
`001-initial-schema` v `solvex_migrations`. Preverjene so tabele `customers`,
`employees`, `managers`, `solar_plants`, `service_requests`, `services`,
`service_reports` in `solvex_migrations`.

Inicializacija je uporabila TLS s preverjanjem certifikata. Začasni zunanji dostop
je po inicializaciji odstranjen (`ipAllowList: []`); baza je namenjena interni
povezavi Render backenda. Povezovalni podatki in API ključ niso zapisani v Git.
Lokalni ali osebni podatki niso bili preneseni v oblak. Dodani so izključno
izmišljeni demonstracijski račun, elektrarna, dva servisa in testno poročilo.

## Backend na Render Free

Storitev `solvex-api-sarschi03` deluje na paketu **Free** v Frankfurtu:

- [Backend](https://solvex-api-sarschi03.onrender.com).
- [Render Dashboard](https://dashboard.render.com/web/srv-dbtd44hsrm7s73augpkg).
- Baza je povezana prek internega Render naslova; geslo je v okolju storitve.
- Veja `deployment` vsebuje artefakt uspešnega GitHub joba `build`.
- Render izvaja samo `npm ci --omit=dev` in zagonski skript, brez novega prevajanja.
- Lastne samodejne namestitve so izključene; nadaljnje objave sproži GitHub API korak.

## Frontend in javno preverjanje

[Javna aplikacija na Vercel Hobby](https://solvex-henna.vercel.app).

API proxy uporablja `BACKEND_ORIGIN=https://solvex-api-sarschi03.onrender.com`.
Javni `/api/health` potrjuje povezavo z bazo in vrne SHA izvorne različice.
Preverjeni so prijava demo serviserja, dodeljeni servisi, ustvarjanje in urejanje
poročila, oddaja ter zavrnitev urejanja zaklenjenega poročila (HTTP 409).

Demo prijava: `demo@solvex.local` / `SolvexDemo123!`. To je javni šolski račun z
izmišljenimi podatki; omejitve dostopa prevzete aplikacije so opisane v pregledu.

## GitHub Actions in oddaja

Okolje `production` vsebuje secrets `RENDER_API_KEY` in `VERCEL_TOKEN` ter
spremenljivke za oba projekta in javna URL-ja. `BACKEND_ORIGIN` je tudi repository
variable, ki jo uporablja job `build`. Vrednosti skrivnosti niso v Gitu.

Datoteka `oddaja.txt` vsebuje povezavi do repozitorija in javne aplikacije ter
je pripravljena za nalaganje na Moodle. Nalaganje na Moodle ni bilo izvedeno.
