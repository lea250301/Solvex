---
name: solvex-tests
description: Napiši ali dopolni avtomatizirane teste Solvex funkcionalnosti z Node test runnerjem in PostgreSQL za API ter Vitest in React Testing Library za uporabniški vmesnik.
---

# Solvex testi

Preberi `AGENTS.md`, merila ustrezne uporabniške zgodbe in obstoječa testa
`backend/test/api.test.ts` ter `frontend/src/App.test.tsx`. Testiraj opazno vedenje
in poslovna pravila, ne notranje razporeditve kode.

## API in baza

- Uporabi `node:test`, `node:assert/strict` in HTTP `fetch` do Express aplikacije,
  zagnane na prostih vratih. Testi tečejo s `tsx --test`.
- Uporabi pravo lokalno/CI PostgreSQL bazo in obstoječo unikatno začasno shemo;
  pripravi izmišljene fixture podatke. Po izvedbi zapri strežnik/povezave in odstrani
  samo testno shemo. Ne izvajaj testov na produkcijski bazi.
- Preveri HTTP status, vsebino odgovora in pri zapisih dejansko stanje baze.
  Za zavrnjen vnos preveri tudi, da neželen zapis ni nastal.
- Novi samostojni scenariji naj pripravijo svoje podatke; ne dodajaj nepotrebnih
  odvisnosti od vrstnega reda obstoječih testov poročila.

## React vmesnik

- Uporabi Vitest v `jsdom`, React Testing Library in `userEvent.setup()`.
  Elemente poišči po vlogi ali labeli, počakaj s `findByRole` na asinhrono stanje.
- `fetch` zamenjaj z `vi.stubGlobal`; mock odgovori naj imajo enako obliko kot API.
  Preveri uspeh, napako API-ja, omrežno napako in prazno stanje, kadar so relevantni.
- Ohrani `localStorage.clear()`, `cleanup()` in `vi.unstubAllGlobals()`, da se
  prijava in pripeti servisi ne prenašajo med testi.
- Ti testi ne dokazujejo povezave pravega brskalnika z API-jem; za ročno preverjanje
  lokalne poti uporabi konfigurirani Playwright MCP brez zapisov v produkcijo.

## Preverjanje in poročanje

Poženi lint in teste obeh delov z ukazi iz `AGENTS.md`. Pri spremembi funkcionalnosti
zgradi oba dela. Za pokritost uporabi oba ukaza `test:coverage`; frontend uporablja
V8, backend `c8`. Ne zahtevaj 100 % pokritosti kot nadomestila za smiselne scenarije.
V PR navedi dodane scenarije, dejanske rezultate in kako si uporabil ta skill.
