# Skupni temelj: računi, vloge in pooblastila

Posodobitev: vloga se zdaj izbere samo ob registraciji. Enotni `/api/auth/login`
jo ugotovi iz računa ob prijavi z e-pošto ali dodeljenim uporabniškim imenom.
Migracija 005 in lokalni testni računi so opisani v README.

## Dogovorjeni obseg

Uporabnik je 26. 11. 2026 izrecno izbral **odprto registracijo vseh treh vrst računov**
za šolski projekt in **lokalno pripravo brez pusha**. Lastnik, serviser in vodja
imajo ločene registracije, prijave in delovne prostore. Vodja ni administrator.
Obstoječi veji `agents` in `frontend` sta združeni samo v lokalno razvojno izhodišče;
na GitHubu ob pregledu ni bilo novih PR-jev za ti veji. To ni potrditev oddaljene združitve.

## Matrika dostopa

| Dejanje | Lastnik | Serviser | Vodja |
| --- | --- | --- | --- |
| Registracija, prijava, obnova in odjava seje | Da | Da | Da |
| Lasten profil in trajna fotografija | Da | Da | Da |
| Elektrarne in zaključeni servisi v profilu | Samo lastni | Ne | Ne |
| Interni seznam servisov | Ne | Samo trenutno dodeljeni | Vsi |
| Branje internih poročil | Ne | Lastna za trenutno dodeljene servise | Vsa oddana, brez osnutkov |
| Ustvari/uredi/oddaj poročilo | Ne | Lastno, za trenutno dodeljen servis; oddano je zaklenjeno | Ne |
| Vsi zahtevki in obremenitev serviserjev | Ne | Ne | Branje |
| Upravljanje računov in vlog | Ne | Ne | Ne |

Vloge se pridobijo iz strežniške seje; ID-ji, URL in poslano polje `role` niso dokaz
pooblastila. API brez seje vrne 401, napačna vloga ali tuji ID serviserja 403.
Neobstoječ oziroma nedostopen posamezen zapis poročila vrne 404; zaklenjeno poročilo 409.
Zaščita velja za obe obstoječi montaži routerja (`/api` in koren).

## Povezava z uporabniškimi zgodbami

- US-01–04: ohranjena lastnikova navigacija in profil. Obrazci za zahtevke,
  namenski seznam zgodovine in priporočila še niso dokončani.
- US-05: obstoječa izdelava/urejanje/oddaja poročila zdaj preverja sejo, avtorja
  in trenutno dodelitev; vodja prejme oddana poročila. Strukturirani deli in stanje
  elektrarne po posegu še manjkajo.
- US-06: lasten seznam in primarni vrstni red po nujnosti; obstoječe pripenjanje ostaja.
  Datum dodelitve in rok še nista samostojni podatkovni polji, zato celotna zgodba ni zaključena.
- US-07: osnovni podatki iz dodeljenega servisa; zadnjih pet posegov in deli še sledijo.
- US-08–12: vzpostavljena prijava in pregled vodje (zahtevki, servisi, obremenitev,
  oddana poročila). Spreminjanje nujnosti, dodelitev, skupine, termini, obvestila
  in zaloga so naslednje funkcionalnosti. Koledar in zaloga sta označeni pripravljeni strani.
- US-13–15: administrator ni predmet te spremembe; njegova pooblastila niso dodeljena vodji.

## Merila in dokazila

| Merilo | Status | Dokaz |
| --- | --- | --- |
| Tri ločene registracije in pravilna polja | PASS | API in React testi registracij |
| Prijava vseh treh vlog, obnova in preklic seje | PASS | Integracijski testi s pravo PostgreSQL bazo, React testi |
| Serviser ne vidi ali ureja tujih servisov/poročil | PASS | Testi 401/403, tujih ID-jev in prerazporeditve |
| Vodja vidi podatke in samo oddana poročila | PASS | API testi ter React navigacija in podatki |
| Lastnik ne doseže internih podatkov | PASS | API testi in zaščita anonimne poti v Reactu |
| Migracija ohrani podatke in podpira ponovitev | PASS | Lokalni zagon 003, ponovni zagon brez sprememb; testi sveže sheme |
| Lint, testi in gradnja obeh delov | PASS | Ukazi iz AGENTS.md, rezultati v tasks.md |
| Lokalni brskalniški tok vseh treh vlog | PASS | Playwright MCP: registracija, prijava, profil, obnova vloge in odjava; pregled vodje na 1440 in 390 px |
| Oddaljeni PR in produkcijska namestitev te veje | NOT VERIFIED | Uporabnik bo vejo objavil sam; produkcija ni bila spremenjena |

Testi API uporabljajo začasno shemo in izmišljene podatke. Javna registracija
osebju je dogovorjena šolska politika. Enaka e-pošta lahko obstaja v različnih
tabelah računov; uporabnik pri prijavi izbere vrsto računa.
