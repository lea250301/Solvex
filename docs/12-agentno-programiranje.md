# Agentno programiranje v Solvexu

## Vsebina agentskega PR

Izbrano orodje je Codex CLI. Zagon: `codex` iz korena projekta, po pripravi
lokalnega okolja iz README. `AGENTS.md` vsebuje ukaze, strukturo, dokumentacijo,
konvencije, obvezni lint/test ter varovane datoteke; ostaja pod 150 vrsticami.

Ta veja vsebuje samo agentsko pripravo glede na `main`. Aplikacijska prenova,
osebni profil in njegove podatkovne spremembe so v ločenem PR `frontend`.
Specifikacija te funkcionalnosti je v `docs/specs/001-funkcionalnost/`.

## Pet lokalnih skillov

Vsak je v `.agents/skills/<name>/SKILL.md` z YAML poljema `name` in `description`.

| Skill | Kdaj ga uporabimo |
| --- | --- |
| `solvex-api-endpoint` | Express API, validacija, parametriziran SQL in integracijski testi. |
| `solvex-tests` | Testi API-ja s pravo začasno PostgreSQL shemo in React testi. |
| `solvex-frontend` | React/TypeScript zasloni, obrazci, navigacija in povezava z API-jem. |
| `solvex-user-story` | Izvedba dokumentirane zgodbe ali sprejemnega merila skozi celoten sklad. |
| `solvex-refactor` | Izboljšanje strukture kode brez namerne spremembe opaznega vedenja. |

Zadnji trije so uporabnikove priložene datoteke, nameščene brez spremembe vsebine;
preverjena sta bila enakost datotek in format z `quick_validate.py`.
Prva dva sta bila dejansko uporabljena pri razvoju osebnega profila: navodila za
API so določila preverjanje identitete iz seje in lastništva, testni skill pa
API scenarije ter React preverjanja fotografije, napak in obnove seje.
PR `frontend` to uporabo posebej opisuje. Novih treh skillov ne predstavljamo kot
uporabljenih za nazaj pri že izvedeni funkcionalnosti.

## MCP: Playwright

Codex bere `[mcp_servers.playwright]` v `.codex/config.toml` v zaupanem projektu.
`.mcp.json` je enak izvoz zagona za druge združljive odjemalce; Codex omejitve
`enabled_tools` se v drug odjemalec ne prenesejo samodejno.

Pripeta različica je `@playwright/mcp@0.0.86`, zagon prek STDIO/`npx`, nameščen
Chrome, brez vidnega okna in z izoliranim profilom. Konfiguracija ne vsebuje
tokenov ali gesel. Dovoljeni origini so lokalni Solvex na vratih 5173 in 3000;
allowlist ne predstavlja varnostne meje za preusmeritve. Izhodi so v ignorirani
`.playwright-mcp/`. Codex nima omogočenih orodij za poljubni JavaScript ali upload.

Agent je 23. 11. 2026 prek MCP SDK dejansko povezal konfigurirani strežnik,
uporabil `tools/list`, `browser_navigate`, `browser_fill_form`, `browser_click`,
`browser_wait_for`, `browser_snapshot` in `browser_network_requests`. Lokalna
demo prijava in seznam servisov sta vrnila HTTP 200. Testni brskalnik je zaprl.
Pri razvoju profila v ločenem PR je ločeni validacijski odjemalec dodatno izvedel
nalaganje datoteke in polno osvežitev; s tem ni razširil Codex allowlista.

`codex mcp get playwright --json` je bil preverjen z izoliranim testnim Codex
domom, ki zaupa projektu, brez spremembe globalnega zaupanja uporabnika. Nova
native Codex seja mora pregledati zaupanje, `/hooks` in `/mcp`; odprta seja T3
nove konfiguracije ne naloži samodejno.

## Senzorji in varnost

- `PreToolUse` dodatno zavrne nevarne ukaze in neposreden dostop do skrivnosti.
- `PostToolUse` po spremembah JS/TS požene ESLint za spremenjene datoteke; celotni
  lint in testi obeh delov pred predajo ostajajo obvezni.
- `.codex/rules/safety.rules` in profil v `.codex/config.toml` omejujeta ukaze in
  datoteke. Hooki zahtevajo uporabnikov pregled/zaupanje v native Codex seji.
- Omejitve branja `.env*` in ključev so bile na Windows preverjene z nenevarno
  testno datoteko, brez branja dejanskih skrivnosti. Zahtevan je elevated sandbox.
- Konfiguracija ne spremeni že odprte seje T3 s polnim dostopom. Podrobnosti in
  dejanski obseg varoval so zapisani v `AGENTS.md`; hook ni nadomestilo za sandbox.

## Preverjanje ob pripravi PR-jev

Za vejo `agents` so relevantni obstoječi testi `main` (7 frontend, 11 backend),
oba linta, pet validacij skillov in test varnostnih hookov. Za vejo `frontend`
se preverja 28 frontend in 20 backend testov ter lint/gradnja obeh delov.
Dejanski končni rezultati in navodila za push so zapisani v ločenih slovenskih
opisih PR, pripravljenih zunaj repozitorija. Push in odprtje PR-jev sta prepuščena uporabniku.

Preverjeno 26. 11. 2026 na veji `agents`: oba linta in obe gradnji uspešni,
7 frontend + 11 backend testov uspešnih, 23 testov hookov uspešnih in vseh pet
skillov veljavnih. `AGENTS.md` ima 137 vrstic. Agent je ponovno vzpostavil MCP
povezavo, pridobil seznam 25 orodij, odprl lokalni Solvex in prebral prijavni
obrazec z `browser_snapshot`; brskalnik je nato zaprl.

Celotnega navodila šolske točke 2.5 nismo prejeli. Specifikacija dokumentira dejansko
zahtevo za osebni profil; ne potrjuje izpolnitve dodatnih neznanih zahtev ali vseh MVP zgodb.

## Viri

- [Codex MCP](https://developers.openai.com/codex/mcp)
- [Playwright MCP](https://github.com/microsoft/playwright-mcp)
