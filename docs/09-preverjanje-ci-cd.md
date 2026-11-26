# Dokaz preverjanj in zaščite veje

Repozitorij: [Sarschi03/Solvex](https://github.com/Sarschi03/Solvex).
Pull request: [#1](https://github.com/Sarschi03/Solvex/pull/1).

## Nastavljene zahteve

GitHub Actions so omogočene. Zaščita veje `main` zahteva pull request, ažurno
vejo in uspešne statuse `lint`, `build`, `test`; uveljavljena je tudi za
administratorja. Force push in brisanje veje sta izključena. Okolje `production`
dovoljuje namestitve samo iz zaščitenih vej.

## Preizkus namerne napake

Na commitu `f6c92322cc9d23627b754a8a21db0e1039bbbf5d` je bila začasno dodana
datoteka `frontend/src/ci-failure-demo.ts` z izrecnim tipom `any`.
TypeScript jo je prevedel, ESLint pravilo `@typescript-eslint/no-explicit-any`
pa je zavrnilo job `lint`.

[Neuspešna izvedba #43732707599](https://github.com/Sarschi03/Solvex/actions/runs/43732707599):

- `lint`: **failure**; [neuspešen job](https://github.com/Sarschi03/Solvex/actions/runs/43732707599/job/132868485452).
- `build`: **success**.
- `test`: **success**, shranjen artefakt `coverage-reports`.
- `deploy`: **skipped**, ker gre za PR.

GitHub API je ob neuspešnem lintu vrnil `mergeable_state: blocked` za PR #1.
Potrjena sta bila zahtevana statusa `lint`, `build`, `test` in `enforce_admins: true`.
To dokazuje, da veja brez konfliktov (`mergeable: true`) zaradi neuspešne
obvezne preverbe ni dovoljena za združitev. Dejanski poskus združitve ni bil potreben.

V naslednjem commitu je demonstracijska datoteka odstranjena. Dokaz napake ostaja
v zgodovini commita in izvedbe; ni namenjen združitvi v končno stanje `main`.
[Uspešna izvedba popravka #43733177043](https://github.com/Sarschi03/Solvex/actions/runs/43733177043)
za commit `ce8717cd5c3224fadfe9a2cdfd0fc1d3f86c8e77` je zaključila `lint`,
`build` in `test` z rezultatom **success**. `deploy` je pravilno preskočen za PR.
GitHub je po popravku vrnil `mergeable_state: clean`. S tem sta dokumentirana
dejanski padec z blokado in uspešen popravek istega PR-ja.

## Lokalno preverjeno

- 11 integracijskih testov API-ja s PostgreSQL in 7 testov React prijave.
- ESLint in produkcijska gradnja frontenda ter backenda.
- HTML/LCOV poročili: `backend/coverage` in `frontend/coverage`.
- Začetna migracija baze in njena ponovitev brez podvajanja sheme.

Dejanski javni URL in uspešna namestitev bosta zabeležena šele po vzpostavitvi
brezplačnega Render računa in preverjanju objavljene aplikacije.
