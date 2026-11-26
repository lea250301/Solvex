# CI/CD z GitHub Actions

## Workflow in preverjanja

`.github/workflows/ci-cd.yml` se samodejno sproži ob vsakem pull requestu v `main`
in pushu v `main`; dodatno je dovoljen ročni zagon. Razvoj poteka na ločenih vejah,
spremembe v `main` pa se združujejo prek pull requestov.

| Job | Vsebina | Rezultat |
| --- | --- | --- |
| `lint` | `npm ci` in ESLint za frontend in backend | Napaka linterja povzroči neuspeh joba. |
| `build` | TypeScript/Vite gradnja obeh delov | Artefakt `application-build` z že prevedeno aplikacijo. |
| `test` | 11 API testov s PostgreSQL 18 in 7 React testov | 18 testov, HTML/LCOV poročili v `coverage-reports`; neuspešen test ustavi cevovod. |
| `deploy` | Prenos artefakta iz `build`, objava in preverjanje javnega URL-ja | Samo push v `main`, `needs: [lint, build, test]`, okolje `production`. |

Vsak job za preverjanje uporablja `actions/setup-node` z npm cachingom in obema
lock datotekama. `npm ci` zagotovi ponovljivo namestitev. Artefakti so shranjeni
sedem dni z `actions/upload-artifact`; poročila se poskusijo shraniti tudi ob
neuspešnih testih. API testi uporabljajo začasno ločeno shemo. Vitest meri
pokritost `App.tsx`, c8 pa `app.ts`; zagonski `server.ts` ni v imenovalcu.

## Namestitev iz artefakta brez ponovne gradnje

Frontend se po novi izbiri objavi na **Vercel Hobby**, backend in baza pa ostaneta
na **Render Free**. Job `build` dodatno pripravi artefakt `vercel-frontend` v Build
Output API obliki. Job `deploy` ga po namestitvi backenda prenese in objavi z
`vercel deploy --prebuilt --prod`; tudi frontend se ob namestitvi ne gradi znova.
Podrobnosti prve, ločene objave so v `10-vercel-frontend.md`.

Job `build` pripravi `application-build.tar.gz`, ki vsebuje:

- `frontend/dist/` in `backend/dist/`,
- backend `package.json` in lock datoteko,
- skripte za zagon ter migracijo in `database/schema.sql`,
- `release.json` z SHA izvornega commita.

Job `deploy` uporabi `actions/download-artifact`, preveri SHA in kopira vsebino
artefakta na generirano vejo `deployment`. Na tej veji so samo datoteke za
izvajanje; njen commit ne sproži CI, ker workflow posluša push le v `main`.
Veja ni namenjena ročnemu razvoju izvorne kode.

Render je povezan z vejo `deployment`. Njegov `buildCommand` je izključno
`npm ci --prefix backend --omit=dev`: namesti izvajalne odvisnosti, ne prevaja
aplikacije in ne zažene `tsc` ali `vite build`. `start-production.mjs` prebere
izvorni SHA, izvede ponovljivo migracijo in zažene že prevedeni Express strežnik.
Render API prejme točen commit generirane veje. Cevovod preveri javni HTML in
`/api/health`, vključno z bazo in izvornim SHA.

Frontendov Vercel naslov posreduje `/api` na Render backend. Okoljska spremenljivka
`VITE_API_URL=/api` je nastavljena med gradnjo frontenda; privzeta vrednost je
enaka. Za ločeno gostovanje lahko vsebuje celotni URL backenda, npr.
`https://backend.example/api`. V trenutni postavitvi `BACKEND_ORIGIN` določi proxy
v pripravljenem Vercel paketu, zato brskalnik uporablja isti javni izvor in ni
potreben CORS. `BACKEND_ORIGIN` mora biti pred gradnjo nastavljen kot repository
variable na dejanski Render izvor brez `/api`.

## Izključno brezplačno gostovanje

Baza `solvex-db` je bila 16. 11. 2026 že ustvarjena in inicializirana na Render
Free. Velja do 16. 12. 2026; podrobnosti so v `11-stanje-namestitve.md`.
Pri naslednjih korakih uporabite obstoječo bazo in je ne ustvarjajte ponovno.

`render.yaml` definira samo **Free** Node.js web service in **Free** PostgreSQL
v Frankfurtu. Plačljivi paketi, diski, nadgradnje in samodejni prehodi na plačljivo
storitev niso nastavljeni. Če Free paket ni na voljo, se namestitev ustavi.
Render Free web service po neaktivnosti zaspi; prvi obisk ga ponovno zažene.
Free PostgreSQL poteče po 30 dneh. Za nadaljevanje šolske predstavitve je pred
potekom potreben izvoz podatkov in nova brezplačna postavitev; ta projekt ne
aktivira plačljive nadgradnje.

## GitHub nastavitve

GitHub Actions so omogočene. Ustvarjeno je okolje `production`, ki dovoli
namestitve samo z zaščitenih vej. Render API ključ sodi v **environment secret**
`RENDER_API_KEY`, ID storitve v spremenljivko `RENDER_SERVICE_ID`, javni URL pa
v environment variable `RENDER_APP_URL`.
Za Vercel so v istem okolju potrebni secret `VERCEL_TOKEN` ter spremenljivke
`VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `VERCEL_APP_URL`.
Podatke baze Render hrani kot okoljske spremenljivke storitve, ne v kodi ali
artefaktu. Workflow uporablja Render API ključ za namestitev točnega commita.

Veja `main` zahteva PR ter uspešne status checks `lint`, `build`, `test`.
Vklopljena sta zahteva po ažurni veji in uveljavljanje pravil tudi za administratorja;
force push in brisanje veje nista dovoljena. Pri enem avtorju ni zahtevana
odobritev drugega recenzenta. Pravila so preverjena prek GitHub API-ja.

Dokaz namerno padajočega PR-ja in popravka je v `09-preverjanje-ci-cd.md`.

## Aktivacija javne namestitve

1. Job `build` mora izdelati artefakt. Iz njega se ob prvi postavitvi inicializira
   veja `deployment`; kasneje jo vzdržuje samo job `deploy`.
2. V Render računu ustvarite Blueprint iz `render.yaml` te izvorne veje.
   Oba vira morata imeti paket **Free**. Web service bere vejo `deployment`.
3. V [production secrets](https://github.com/Sarschi03/Solvex/settings/environments)
   shranite `RENDER_API_KEY`; v istem okolju nastavite `RENDER_SERVICE_ID` in
   `RENDER_APP_URL`. Vercel nastavitve so v `10-vercel-frontend.md`.
4. PR po uspehu obveznih preverjanj združite v `main`. Push sproži vse faze,
   vključno z namestitvijo artefakta.
5. Preverite `deploy`, javni URL in `/api/health`; dejanski URL dodajte v README.

Samodejno Render nameščanje ob spremembi veje je izključeno. Začetno ustvarjanje
storitve lahko sproži prvo namestitev; nadaljnje namestitve sproži GitHub Actions.
Brez production secretov `deploy` jasno odpove. Baza in backend sta ustvarjena,
Vercel pa je povezan z API-jem; javna aplikacija je na
[solvex-henna.vercel.app](https://solvex-henna.vercel.app).

Demo seed se ob namestitvah ne izvaja. Ločeno so bili pripravljeni izmišljeni
šolski podatki za preverjanje prijave in poročil. V aplikaciji uporabljajte samo
izmišljene podatke; omejitve avtentikacije so opisane v `07-pregled-projekta.md`.

## Lokalno preverjanje

```powershell
npm run lint --prefix frontend
npm run lint --prefix backend
npm run build --prefix frontend
npm run build --prefix backend
npm run test:coverage --prefix backend
npm run test:coverage --prefix frontend
```

Backend uporablja TypeScript 6.0.3 zaradi združljivosti s `typescript-eslint`.

## Viri

- [GitHub: PostgreSQL service containers](https://docs.github.com/en/actions/tutorials/use-containerized-services/create-postgresql-service-containers)
- [GitHub: environments](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments)
- [Render: Free omejitve](https://render.com/docs/free)
- [Render: Blueprint](https://render.com/docs/blueprint-spec)
- [Render: deploy API](https://api-docs.render.com/reference/create-deploy)
