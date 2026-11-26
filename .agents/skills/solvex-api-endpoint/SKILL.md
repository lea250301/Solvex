---
name: solvex-api-endpoint
description: Dodaj ali spremeni Express/TypeScript API končno točko v Solvexu, kadar funkcionalnost potrebuje validacijo zahtev, PostgreSQL poizvedbe in integracijske teste.
---

# Solvex API končna točka

Preberi korenski `AGENTS.md`, ustrezno zgodbo v `docs/05-uporabniske-zgodbe.md`
in dejansko stanje v `docs/07-pregled-projekta.md`. Pri arhitekturnem posegu preveri
`docs/adr/0004-izbira-backend-tehnologij.md` in podatkovni model.

- API je v `backend/src/app.ts`; `server.ts` naj ostane zagonska datoteka.
  Router je že priklopljen pod `/api`, zato v novih poteh tega prefiksa ne ponavljaj.
- Pred poizvedbo validiraj parametre, obvezna polja, datume in dovoljene vrednosti.
  Sledi obstoječim odgovorom: zbirke v imenovanem polju, napake v `{ message }`,
  slovenska sporočila ter statusi 400/404/409 za ustrezne uporabniške napake.
- Uporabi skupni `pool` in parametrizirane vrednosti `$1`, `$2`; ne sestavljaj SQL
  iz uporabniškega vnosa. Za dinamično sortiranje uporabi preslikavo dovoljenih polj.
- ID zaposlenega v URL-ju ni dokaz prijave. Uporabi `requireSession` iz
  `backend/src/profiles.ts`, dovoljene vloge in pri serviserjevih poteh ujemanje
  ID-ja s sejo. V poizvedbi preveri trenutno dodelitev servisa in lastništvo poročila.
  Vodji dovoli le predvideni vpogled; lastnik nima dostopa do internih poročil.
- Pri poročilih ohrani pravilo: oddanega poročila ni mogoče urejati ali znova oddati.
  Ne vračaj `password_hash` ali povezovalnih podatkov.
- V `backend/test/api.test.ts` dodaj scenarije za uspeh, neveljaven vnos,
  neobstoječ vir in relevantna poslovna pravila. Uporabi začasno testno shemo.
- Spremembe SQL sheme ali migracij niso samodejno del dodajanja končne točke;
  upoštevaj zaščitena področja v `AGENTS.md`.

Pred predajo izvedi lint in teste obeh delov ter gradnjo obeh delov po `AGENTS.md`.
V opisu PR navedi pogodbo API-ja, rezultate preverjanj in konkretno uporabo tega skilla.
