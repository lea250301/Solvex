# Izbira podatkovne baze PostgreSQL

## Kontekst in problem

Sistem Solvex potrebuje podatkovno bazo za shranjevanje podatkov o uporabnikih, sončnih elektrarnah, servisnih zahtevkih, servisnih nalogah in zgodovini 
vzdrževanja. Ker so podatki med seboj povezani, je treba izbrati podatkovno bazo, ki omogoča učinkovito organizacijo podatkov, vzdrževanje povezav med 
entitetami in izvajanje poizvedb.

## Možne opcije

* PostgreSQL, relacijska podatkovna baza.
* MySQL, relacijska podatkovna baza.
* MongoDB, nerelacijska dokumentna podatkovna baza.

## Izbrana opcija

Izbrana odločitev: "PostgreSQL", ker omogoča relacijsko organizacijo podatkov s tabelami, primarnimi in tujimi ključi ter SQL-poizvedbami. Primeren je za sistem 
Solvex, saj vključuje več med seboj povezanih entitet, pri katerih je pomembno ohranjanje celovitosti podatkov in pravilnih povezav med njimi.

### Posledice

* Slabo, ker je treba ustrezno načrtovati strukturo tabel, povezave med njimi in omejitve podatkov.
* Dobro, ker primarni in tuji ključi omogočajo vzpostavljanje povezav med podatki ter zagotavljanje njihove celovitosti.
* Dobro, ker PostgreSQL podpira transakcije, ki pomagajo zagotoviti, da se povezane spremembe podatkov izvedejo pravilno.
