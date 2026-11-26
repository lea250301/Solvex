# Načrt izvedbe osebnega profila

1. Preveri dokumentacijo, model, prijavo, API in teste; uporabi projektna skilla
   `solvex-api-endpoint` in `solvex-tests`.
2. Dodaj neobvezni fotografiji računov ter tabelo sej. Žeton v bazi hrani kot hash;
   uporablja naj se HttpOnly piškotek, obstoječa migracija pa ostane ponovljiva.
3. Dodaj prijavo lastnika, obnovo/preklic seje ter profilni API. Lastništvo izpelji
   iz seje, SQL vrednosti parametriziraj, vsebino/velikost slike validiraj.
4. V React/TypeScript loči pripravo fotografije, podatkovni hook, profilni prikaz
   in hišno ilustracijo. Posodobi avatar in pozdrav ter ohrani obstoječo prijavo zaposlenega.
5. Preveri API s pravo začasno PostgreSQL shemo, UI s Testing Library in časovni
   pozdrav z določenimi urami. Preveri resničen izbor slike ter polno osvežitev prek MCP.
6. Zabeleži rezultate v dokumentaciji in slovenskem opisu PR `frontend`.

## Organizacija PR-jev

- `agents` → `main`: navodila, pet skillov, MCP, hooki, varnostne omejitve in specifikacija.
- `frontend` → `main`: aplikacijska koda, profilni API, migracija, model in testi.

Veji sta vsebinsko ločeni glede na `main`. Ker je bila starejša UI sprememba že
pushana na `agents`, jo lokalni popravljalni commit odstrani iz končne razlike tega PR;
objavljena zgodovina se ne prepisuje. Varnostni posnetek ostaja na lokalni veji
`backup/pr-split-2026-11-26`. Push in odprtje PR-jev izvede uporabnik.
