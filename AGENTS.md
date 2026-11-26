# Navodila za Codex – Solvex

## Okolje in ukazi

Uporabi Node.js 24, npm in Docker Desktop. Ukaze izvajaj iz korena repozitorija.
V PowerShell po potrebi namesto `npm` uporabi `npm.cmd`.
Lokalne `.env` nastavitve in predpogoji so opisani v `README.md`; obstoječih ne prepisuj.

Namestitev odvisnosti:
```sh
npm ci --prefix frontend
npm ci --prefix backend
```

Zagon lokalne baze in priprava nove lokalne sheme:
```sh
docker compose up -d --wait db
npm run db:migrate --prefix backend
```

Frontend in backend zaženi v ločenih terminalih:
```sh
npm run dev --prefix frontend
npm run dev --prefix backend
```
Frontend: `http://localhost:5173`; API: `http://localhost:3000/api/health`.
Lokalna PostgreSQL baza uporablja vrata `55432`. Za lokalne demo podatke:
`npm run db:seed:demo --prefix backend`. Migracij in demo seeda ne izvajaj na produkciji.

Preverjanje kakovosti, testi in gradnja:
```sh
npm run lint --prefix frontend
npm run lint --prefix backend
npm test --prefix frontend
npm test --prefix backend
npm run build --prefix frontend
npm run build --prefix backend
```
Backend testi potrebujejo dosegljivo PostgreSQL bazo in povezovalne spremenljivke.
Pri varnem profilu mora uporabnik pred zagonom Codexa zagotoviti `DB_HOST`, `DB_PORT`,
`DB_NAME`, `DB_USER`, `DB_PASSWORD` v okolju; agent ne bere `.env` ali izpisuje teh vrednosti.
Uporabijo začasno shemo, ki jo po testiranju odstranijo.
Za poročili o pokritosti uporabi `npm run test:coverage --prefix frontend`
in `npm run test:coverage --prefix backend`.

## Struktura projekta

- `frontend/src/`: React/TypeScript vmesnik in CSS; testi `*.test.tsx` ob kodi.
- `frontend/public/`: javne statične datoteke; `frontend/scripts/`: priprava Vercel paketa.
- `backend/src/app.ts`: Express API in povezava z bazo; `server.ts`: zagon strežnika.
- `backend/test/`: integracijski API testi `*.test.ts`; `backend/scripts/`: migracija in zagon.
- `database/`: SQL shema in podatkovni primeri; `compose.yaml`: lokalna PostgreSQL storitev.
- `docs/`: projektna dokumentacija; `docs/adr/`: arhitekturne odločitve.
- `docs/wireframes/`: gradivo vmesnika; `docs/specs/001-funkcionalnost/`: `spec.md`, `plan.md`, `tasks.md`.
- `.agents/skills/`: lokalni skilli za Codex, vsak v svoji mapi s `SKILL.md`.
- `solvex-frontend`: UI; `solvex-user-story`: uporabniške zgodbe; `solvex-refactor`: refaktoriranje.
- `solvex-api-endpoint`: Express API; `solvex-tests`: testi React/API; skill preberi pred uporabo.
- `solvex-api-endpoint`: Express API; `solvex-tests`: API/React testi v `.agents/skills/`.
- Playwright MCP je v `.codex/config.toml`; `.mcp.json` je združljiv izvoz zagona.
- `.github/workflows/ci-cd.yml`: CI/CD; `render.yaml` in `vercel.json`: namestitev.
- `dist/`, `coverage/`, `node_modules/` in `.vercel/`: generirani izhodi; ne urejaj jih ročno.

## Kdaj prebrati dokumentacijo

- Pred začetkom preberi `README.md` in `docs/07-pregled-projekta.md` za dejansko stanje in omejitve.
- Pred spremembo funkcionalnosti preberi `docs/02-funkcionalnosti-in-obseg.md`
  ter ustrezne zgodbe in merila sprejemljivosti v `docs/05-uporabniske-zgodbe.md`.
- Pred spremembo podatkovnega modela ali arhitekture preberi `docs/03-podatkovni-model.md`,
  `docs/04-arhitektura-in-tehnoloski-sklad.md` in povezane dokumente v `docs/adr/`.
- Pred spremembo UI preberi `docs/06-wireframes.md` in ustrezno gradivo v `docs/wireframes/`.
- Pri nalogi s specifikacijo najprej preberi njen `spec.md`, `plan.md` in `tasks.md` v `docs/specs/`.
  Praznih predlog ne obravnavaj kot potrjenih zahtev.
- Pred delom na namestitvi preberi `docs/08-ci-cd.md`, `docs/10-vercel-frontend.md`
  in `docs/11-stanje-namestitve.md`; relevantni skill preberi pred njegovo uporabo.

## Konvencije

- Uporabljaj TypeScript in obstoječa ESLint pravila; ne uvajaj `any` ali izklopov pravil brez razloga.
- Ohrani slog urejane datoteke: zamik dveh presledkov; frontend praviloma enojni narekovaji
  brez podpičij, backend TypeScript dvojni narekovaji s podpičji.
- Komponente in tipi: `PascalCase`; funkcije in spremenljivke: `camelCase`;
  SQL tabele, stolpci in obstoječa API podatkovna polja: `snake_case`.
- React komponente naj bodo v `.tsx`, druga logika v `.ts`; testne datoteke poimenuj `*.test.ts(x)`.
- Dokumentacijo in besedila vmesnika piši slovensko; programske identifikatorje skladno z obstoječo kodo.
- Uporabljaj parametrizirane SQL poizvedbe in obstoječe oblike API odgovorov ter HTTP statusov.
- Spremembe naj bodo omejene na nalogo; ne preoblikuj nepovezane kode in ne dodajaj odvisnosti brez potrebe.
- Razvijaj na ločeni veji; v `main` združuj prek pull requesta z uspešnimi obveznimi preverjanji.

## Preverjanje pred oddajo spremembe

- Pred oddajo vsake spremembe poženi **lint in teste za frontend in backend** z zgornjimi ukazi.
- Če spremeniš aplikacijsko kodo, odvisnosti ali nastavitve gradnje, zgradi tudi oba dela.
- Smiselno preveri spremenjeno vedenje in po potrebi dopolni teste.
- Odpravi povzročene napake. Če ukaza ni mogoče izvesti, navedi ukaz in konkretno oviro;
  ne trdi, da so preverjanja uspešna, če niso bila izvedena.
- Pred zaključkom preveri diff in poročaj, kaj se je spremenilo ter katera preverjanja so uspela.

## Zaščiteni deli – potrebna je izrecna potrditev uporabnika

Brez izrecnega naročila ali potrditve za konkreten poseg ne spreminjaj:

- `database/schema.sql`, podatkovnih migracij in `backend/scripts/migrate.mjs`;
- `.github/workflows/`, zaščit vej in GitHub okolij oziroma deployment secrets;
- `.env` datotek, `.env.example` predlog in povezovalnih podatkov;
- `compose.yaml`, `render.yaml`, obeh `vercel.json` ter konfiguracij na Renderju/Vercelu;
- `.mcp.json` in povezav ali dovoljenj MCP strežnikov.

Najprej opiši potreben poseg in njegov vpliv. Potrditev za eno datoteko ni dovoljenje za druge posege.
Ne briši ali ponastavljaj podatkovnih baz, ne izvajaj produkcijskih migracij in ne spreminjaj
produkcijskih podatkov brez izrecne potrditve. Ne zapisuj tokenov, gesel ali zasebnih podatkov
v kodo, dokumentacijo, loge ali Git; skrivnosti podajaj prek odobrenega varnega vnosa oziroma secrets.

## Senzorji in varnost Codexa

- `.codex/config.toml` izbere profil `solvex` in potrjevanje `on-request`.
  Profil omeji pisanje na workspace/temp; zavrne branje in pisanje `.env*`, zasebnih ključev,
  `~/.ssh`, `~/.aws`, `~/.gnupg` in Codex/T3 prijavnih skrivnosti. Blokada zajame tudi `.env.example`.
- `.codex/rules/safety.rules` blokira brisanje, hard reset in git clean; objava zahteva pregled.
- `.codex/hooks.json`: `PreToolUse` dodatno zavrne force push (tudi s stikali za imenom veje),
  ukaze za brisanje, prikrito evalvacijo in neposredne poskuse dostopa do skrivnosti.
- `PostToolUse` po urejanju z `apply_patch` oziroma lupino požene ESLint samo za spremenjene
  JS/TS datoteke frontenda/backenda. Napake vrne agentu; ne izvaja samodejnih popravkov.
  Hash predpomnilnik v sistemski temp mapi prepreči ponavljajoče preverjanje iste vsebine.
- Preverjanje hookov: `node --test .codex/hooks/hooks.test.cjs`. Celotni lint in testi ostanejo obvezni.
- Ob novem zagonu Codexa iz korena zaupaj projektu in preglej/potrdi oba hooka prek `/hooks`.
  Ne uporabljaj zastavic za obhod hook trust, sandboxa ali odobritev.
- Profil ni aktiven ob `--sandbox`/`sandbox_mode` preglasitvi. T3 lahko vsili lastne pravice;
  ta konfiguracija ne spremeni že odprte seje s polnim dostopom. Preveri aktivni profil pred delom.
- Hooki so dodatna varovalka, ne popolna izolacija; OS sandbox je meja dostopa do datotek.
  MCP uporabljaj za lokalni Solvex; ločen profil nima osebnih piškotkov. Origin allowlist
  ni varnostna meja za preusmeritve. Brez potrditve ne odpiraj produkcijskih zapisovalnih poti.
  Globi za skrivnosti se na Windows posnamejo ob zagonu procesa; po nastanku novih skrivnosti
  ne uporabljaj starega procesa. Varnostne konfiguracije in skripte spreminjaj le po potrditvi uporabnika.
- Windows uporablja `elevated` backend; zahteva široko branje sistema, iz katerega profil izloči
  navedene skrivnosti. Brez tega backenda blokade branja niso zagotovljene; ne preklapljaj na `unelevated`.
- Preizkus OS blokade: uporabnik pripravi nenevarno `.codex/.env.canary`, nato zažene
  `codex sandbox -P solvex -- node .codex/hooks/sandbox-probe.cjs` in odstrani le to testno datoteko.
