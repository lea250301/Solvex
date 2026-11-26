# Naloge in preverjanje

- [x] Prebrane zgodbe in potrjeni javna registracija ter lokalna priprava.
- [x] Lokalno združeni veji agents in frontend v razvojno izhodišče.
- [x] Tri registracije in prijave z ločenimi polji in delovnimi prostori.
- [x] Seja, lastni profil in fotografija vodje.
- [x] Strežniška zaščita vseh servisnih in poročevalskih poti.
- [x] Dostop serviserja omejen na trenutno dodeljene servise in lastna poročila.
- [x] Pregled vodje: zahtevki, vsi servisi, obremenitve in oddana poročila.
- [x] Privzeto sortiranje delovnih nalog po nujnosti.
- [x] API testi s pravo začasno PostgreSQL shemo in React testi vseh treh vlog.
- [x] Lokalna migracija 003 in ponovitev brez ponovnega izvajanja.
- [x] Playwright MCP s pravo lokalno aplikacijo: vse tri registracije/prijave,
      lasten profil, obnova pravilne vloge tudi na tujem URL-ju in odjava;
      pregledani posnetki vodjeve strani pri 1440 × 1000 in 390 × 844.
- [x] README in specifikacija opišeta dejanski obseg ter nedokončane zgodbe.
- [ ] Uporabnik objavi vejo, odpre PR in pregleda oddaljene CI rezultate.

Preverjanje pred lokalno oddajo: `npm run lint`, `npm test` in `npm run build`
za frontend in backend po AGENTS.md. API: **31/31**, React: **35/35** testov.
Lint in produkcijska gradnja obeh delov sta uspešna. Testi API preverijo tudi
novo shemo; lokalni migrator je uporabil 003 in ob ponovitvi izpisal, da je shema aktualna.
