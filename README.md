[![CI/CD](https://github.com/Sarschi03/Solvex/actions/workflows/ci-cd.yml/badge.svg?branch=main)](https://github.com/Sarschi03/Solvex/actions/workflows/ci-cd.yml)

## Solvex - opis projekta
Solvex je spletna rešitev za lastnike sončnih elektrarn, ki želijo prijaviti napako ali naročiti redni pregled svoje elektrarne. Serviserji preko sistema prejemajo delovne naloge, beležijo ugotovljene napake, opravljeno delo in pripravljajo poročila o servisih. Vodja servisa uporablja rešitev za razporejanje servisov, dodeljevanje nalog in spremljanje zaloge rezervnih delov. Sistem lastnikom omogoča tudi pregled zgodovine servisov in pridobivanje priporočil za prihodnje preglede.

## Uporabljene tehnologije
- Frontend: React, Typescript, CSS
- Backend: Node.js in Express.js
- Podatkovna baza: PostgreSQL
- Avtentikacija: prijava uporabnikov z uporabo e-poštnega naslova in gesla

## Povezava do dokumentacije
https://github.com/lea250301/Solvex 

## Prevzem projekta in CI/CD

Fork: [Sarschi03/Solvex](https://github.com/Sarschi03/Solvex).
Pregled MVP in petih uporabniških zgodb: [docs/07-pregled-projekta.md](docs/07-pregled-projekta.md).
GitHub Actions in navodila za aktivacijo Render namestitve: [docs/08-ci-cd.md](docs/08-ci-cd.md).


### Faze cevovoda

- `lint`: ESLint preveri frontend in backend; napake ustavijo cevovod.
- `build`: TypeScript/Vite zgradita oba dela; `application-build` vsebuje prevedeno aplikacijo in podatke za zagon. Odvisnosti se predpomnijo z npm cache.
- `test`: 11 API testov s PostgreSQL in 7 testov React vmesnika; HTML in LCOV poročili sta v artefaktu `coverage-reports`.
- `deploy`: samo po pushu v `main` in uspehu `lint`, `build`, `test`; prenese artefakte in objavi že prevedeni backend na Render ter frontend na Vercel. Render namesti samo izvajalne odvisnosti, Vercel uporabi `--prebuilt`; aplikaciji se ne gradita ponovno.

**Javna aplikacija: [solvex-henna.vercel.app](https://solvex-henna.vercel.app)**

Backend: [solvex-api-sarschi03.onrender.com](https://solvex-api-sarschi03.onrender.com).
[Preverjanje API-ja in baze](https://solvex-henna.vercel.app/api/health).
PostgreSQL baza `solvex-db` je na Render Free in ima inicializirano shemo.
[Stanje namestitve](docs/11-stanje-namestitve.md).

Za šolski preizkus javne aplikacije: `demo@solvex.local` / `SolvexDemo123!`.
Račun vsebuje izključno izmišljene demonstracijske podatke.

Za oddajo na Moodle je pripravljena [oddaja.txt](oddaja.txt) z obema povezavama.

Frontend bo objavljen na **Vercel Hobby**, backend na **Render Free**, baza pa bo **Free PostgreSQL**. Brezplačna Render baza poteče po 30 dneh; samodejna plačljiva nadgradnja ni nastavljena. Nastavitve so v [docs/08-ci-cd.md](docs/08-ci-cd.md), prva objava frontenda pa v [docs/10-vercel-frontend.md](docs/10-vercel-frontend.md).

## Zagon

Potrebujete Node.js 24, npm in zagnan Docker Desktop. Iz korenske mape:

```powershell
Copy-Item .env.example .env
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
docker compose up -d --wait db
cd backend
npm ci
npm run db:migrate
npm run db:seed:demo
npm run dev
```

V drugem terminalu:

```powershell
cd frontend
npm ci
npm run dev
```

Odprite http://localhost:5173. Lokalna demo prijava je `demo@solvex.local` /
`SolvexDemo123!`; seed je namenjen samo lokalni bazi in vsebuje izmišljene podatke.
Baza je dostopna na `localhost:55432`, backend na `http://localhost:3000`,
preverjanje povezave pa na `http://localhost:3000/api/health`.
Datotek `.env` ne dodajajte v Git. Obstoječih `.env` ne prepisujte, temveč
v njih prilagodite nastavitve po primerih.

Za lokalno preverjanje produkcijskega načina najprej zgradite oba dela:

```powershell
npm ci --prefix frontend
npm run build --prefix frontend
npm ci --prefix backend
npm run build --prefix backend
cd backend
$env:SERVE_FRONTEND = 'true'
npm start
```

Celotna aplikacija je nato dostopna na `http://localhost:3000`. Če na teh vratih
že teče razvojni backend, ga pred produkcijskim zagonom ustavite.

## Agentno programiranje

Uporabljamo **Codex CLI**. Po namestitvi CLI-ja in prijavi ga zaženemo iz korena
projekta (Node.js 24 in npm morata biti na `PATH`):

```powershell
cd C:\Sara\Feri\RIRS\Solvex
codex
```

Ob prvem zagonu preglejte projektne nastavitve in potrdite zaupanje projektu.
Hooka preglejte v `/hooks`, povezavo z MCP pa v `/mcp`. Če konfiguracijo dodate
med odprto sejo, ponovno zaženite Codex. Pred zagonom aplikacije pripravite lokalno
bazo po razdelku »Zagon«. Za delo v varnem profilu podajte povezovalne spremenljivke
`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` v okolje pred zagonom
Codexa; agentu ne odpirajte dostopa do `.env`.

### Datoteke za agenta

- [AGENTS.md](AGENTS.md): ukazi, struktura, dokumentacija, konvencije in zaščiteni deli.
- [.codex/config.toml](.codex/config.toml): varnostni profil in dejanska Codex MCP konfiguracija.
- [.codex/hooks.json](.codex/hooks.json), `.codex/hooks/` in `.codex/rules/safety.rules`:
  varovalke pred nevarnimi ukazi ter ESLint po spremembi izvorne kode.
- [.mcp.json](.mcp.json): enaka definicija zagona Playwright strežnika za odjemalce,
  ki berejo ta format; Codex uporablja `.codex/config.toml`. Codex omejitev orodij
  se pri uvozu JSON v drugo orodje ne prenese samodejno.
- [.agents/skills/solvex-api-endpoint/SKILL.md](.agents/skills/solvex-api-endpoint/SKILL.md):
  postopek dodajanja ali spreminjanja Express API-ja.
- [.agents/skills/solvex-tests/SKILL.md](.agents/skills/solvex-tests/SKILL.md):
  API testi s PostgreSQL in testi React vmesnika.
- [.agents/skills/solvex-frontend/SKILL.md](.agents/skills/solvex-frontend/SKILL.md):
  spremembe React/TypeScript vmesnika in povezava z API-jem.
- [.agents/skills/solvex-user-story/SKILL.md](.agents/skills/solvex-user-story/SKILL.md):
  izvedba dokumentirane uporabniške zgodbe skozi celoten sklad.
- [.agents/skills/solvex-refactor/SKILL.md](.agents/skills/solvex-refactor/SKILL.md):
  preureditev kode z ohranitvijo opaznega vedenja.
- `docs/05-uporabniske-zgodbe.md`, `docs/adr/` in `docs/07-pregled-projekta.md`:
  zahteve, arhitekturne odločitve in dejansko stanje aplikacije.
- `docs/specs/001-funkcionalnost/`: specifikacija, načrt in opravila za osebni profil;
  aplikacijska izvedba je pripravljena v ločenem PR z veje `frontend`.
- [docs/12-agentno-programiranje.md](docs/12-agentno-programiranje.md):
  preverjanje MCP in predlog naslednje funkcionalnosti.

### Playwright MCP in skilli

Ta PR vsebuje agentsko pripravo in ohranja aplikacijsko kodo veje `main`.
Ločeni PR `frontend` vsebuje prenovo vmesnika, razdelitev na strani, komponente
in hooke ter osebne profile. Rezultati preverjanj so zato v dokumentu 12 ločeni
po obeh vejah.

Playwright MCP `@playwright/mcp@0.0.86` omogoča preverjanje lokalnega React vmesnika
in njegove povezave z Express API-jem. Potrebuje nameščen Google Chrome; ob prvem
zagonu `npx` prenese pripeto različico paketa. Ne potrebuje tokena ali gesla za MCP.
Zažene se brez vidnega okna, z ločenim začasnim profilom in dovoljenimi lokalnimi
origini. Seje osebnega brskalnika se ne uporabljajo. Seznam originov je omejitev
zahtev, ne varnostna izolacija pred preusmeritvami. Izhodi `.playwright-mcp/` niso v Gitu.

Po zagonu aplikacije lahko agentu naročite: »S Playwright MCP preveri lokalno
prijavo in nalaganje servisov.« Uspešen dejanski preizkus je opisan v dokumentu 12.
Za skille uporabite `$solvex-api-endpoint`, `$solvex-tests`, `$solvex-frontend`,
`$solvex-user-story` ali `$solvex-refactor` v navodilu agentu;
Codex ju lahko glede na opis izbere tudi sam. Pred predajo spremembe vedno izvede
lint in teste obeh delov po `AGENTS.md`.
