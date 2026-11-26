# Osebni profil in profilna fotografija

## Zahteva

Uporabnik je zahteval osebni pozdrav glede na del dneva, lastno fotografijo,
shranjeno v podatkovni bazi, in profil z imenom, shematsko hišo s paneli ter
preteklimi servisi. Specifikacija opisuje to konkretno zahtevo; izvedba je v PR
z veje `frontend`, agentska orodja pa v PR z veje `agents`.

## Merila sprejemljivosti

1. Prijava loči lastnika in zaposlenega; identiteto novih profilnih poti potrdi strežnik.
2. Pozdrav uporabi lokalni čas in ime prijavljenega računa, brez izmišljenega imena v predogledu.
3. Uporabnik izbere raster fotografijo, jo zamenja ali odstrani; slika ostane v PostgreSQL po osvežitvi.
4. Neprijavljena zahteva ne more brati ali spreminjati profila; ID v zahtevi ne izbere drugega uporabnika.
5. Profil prikaže ime, fotografijo, lastnikove elektrarne in le zaključene servise njegovih elektrarn.
6. Hiša je označena kot shematska ilustracija, ne kot geometrijski načrt nepremičnine.
7. Prazna, nalagalna in neuspešna stanja ter neveljavne/prevelike slike imajo razumljivo sporočilo.
8. Migracija je ponovljiva in ohrani obstoječe podatke; produkcijska baza ni del lokalnega testiranja.
9. Lint, testi in gradnja obeh delov so uspešni; slika je preverjena tudi v brskalniku po ponovnem nalaganju.

## Meje obsega

Zahteva dopolnjuje profil iz `docs/06-wireframes.md` in del zgodovine iz US-03.
Ne pomeni dokončanja vseh meril US-01–US-05. Ostale podedovane API-poti niso
samodejno zaščitene s tem posegom. Priporočila in ostale prazne strani ostanejo ločeno delo.
