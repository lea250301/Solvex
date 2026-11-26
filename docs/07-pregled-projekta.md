# Pregled prevzetega projekta Solvex

Datum pregleda: 15. 11. 2026. Izvor: [lea250301/Solvex](https://github.com/lea250301/Solvex),
prevzeti commit `b6e7815`. Fork: [Sarschi03/Solvex](https://github.com/Sarschi03/Solvex).

## Implementirane funkcionalnosti MVP

Deluje prijava zaposlenega z e-pošto in geslom (Argon2). Serviserjev vmesnik prikazuje
servise, njihove podrobnosti, lokacijo, stranko, termin, status in nujnost. Omogoča
iskanje, razvrščanje in pripenjanje servisov, ki se shrani v lokalno shrambo brskalnika.
API vsebuje tudi seznam servisov za posameznega zaposlenega.

Najbolj izdelan del MVP so servisna poročila: ustvarjanje za dodeljen servis,
pregled, iskanje in razvrščanje, urejanje osnutka ter oddaja. Po oddaji API prepreči
nadaljnje urejanje in ponovno oddajo; za isti servis prepreči podvojena poročila.
Ob shranjevanju vmesnik prikaže sporočilo o uspehu oziroma napaki.

Delno je izvedena registracija lastnika: obstaja strežniška pot z validacijo in
zgoščevanjem gesla, vendar trenutni React vmesnik vsebuje le prijavo zaposlenih.
Predvideni MVP za prijavo okvar, naročanje pregledov, dodeljevanje nalog,
upravljanje terminov in samodejno zmanjševanje zaloge še ni izveden v celoti.

## Presoja petih uporabniških zgodb

Izbranih je prvih pet zgodb iz `05-uporabniske-zgodbe.md`. Ocena upošteva merila
sprejemljivosti in dejansko kodo, ne le načrtovanega podatkovnega modela.

| Zgodba | Ocena | Dokaz in manjkajoči deli |
| --- | --- | --- |
| US-01: Prijava napake/okvare | Ni izpolnjena | `POST /customers/register` registrira lastnika in shema vsebuje `solar_plants` ter `service_requests`, vendar ni lastnikove prijave, obrazca/API-ja za dodajanje elektrarne in oddajo okvare ali posredovanja vodji. Sama tabela ne pomeni delujoče funkcije. |
| US-02: Zahteva za redni pregled | Ni izpolnjena | Shema dovoljuje `request_type = 'regular_inspection'`, vendar ni obrazca in poti za ustvarjanje zahteve, izbire dodatnih storitev ali potrditve oddaje lastniku. |
| US-03: Pregled preteklih storitev | Ni izpolnjena | `GET /services` prikazuje servise zaposlenim, ne zgodovine prijavljenega lastnika. Ni lastnikovega pogleda po elektrarni, razlage opravljenega dela in zamenjanih delov ali pripadajočega nadzora dostopa. |
| US-04: Priporočila za prihodnje preglede | Ni izpolnjena | Polje `recommendations` v poročilu je ročni prosti tekst. Ni avtomatskega izračuna iz zgodovine rednih pregledov, opozorila mesec pred letnim rokom ali možnosti izklopa. |
| US-05: Izdelava servisnega poročila | Delno izpolnjena | V `frontend/src/App.tsx` obstaja obrazec, API pa ustvari poročilo samo za servis, dodeljen podanemu zaposlenemu. Podprti so povzetek, ugotovitve, priporočila, datum, urejanje do oddaje in potrditev shranitve. Manjkajo strukturiran vnos porabljenih delov, izrecno stanje elektrarne po pregledu ter delovni tok prejema pri vodji. Identiteta zaposlenega na API-ju ni potrjena s sejo. |

Implementacija zato še ne zadošča vsem merilom teh petih zgodb in celotnemu
načrtovanemu MVP. US-05 je uporabna osnova za nadaljnji razvoj.

## Dokumentacija, arhitektura in koda

Pregledani so bili dokumenti `01`–`06`, vseh pet sprejetih ADR, SQL-shema,
Express API ter React vmesnik. Izbira React/Vite/TypeScript, Express/Node.js in
PostgreSQL ustreza ADR. V praksi sta vmesnik in API pretežno v eni večji datoteki
na posameznem delu; ločitev komponent in poti bi olajšala vzdrževanje.

Dokumentacija predvideva štiri vloge, seje in preverjanje pravic, koda ob prevzemu
pa preveri geslo samo ob prijavi in ne izda seje ali žetona. Druge poti ne preverjajo
prijavljenega uporabnika: sprememba ID-ja v URL-ju omogoča zahteve v imenu drugega
zaposlenega. Dashboard kliče splošni `GET /services`, zato tudi zahteva, da serviser
vidi le svoje naloge (US-06), ni v celoti zagotovljena. To je omejitev prevzete kode,
ki je dodajanje CI/CD samo po sebi ne odpravi. Za javno uporabo so potrebni
avtentikacijska seja in strežniško preverjanje lastništva ter vlog.

V izvorni shemi je tabela `services` referencirala še neustvarjeno tabelo
`service_requests`. Ob prevzemu ni bilo testov, CI/CD in backend lint ukaza;
README tudi ni vseboval inicializacije sheme. V forku je vrstni red tabel popravljen,
dodan je ponovljiv migracijski ukaz ter primeri okolijskih nastavitev.

## Lokalni zagon in preverjanje

Na Windows je bil uporabljen Node.js 24.14.0, npm 11.13.0 in PostgreSQL 18 v Dockerju.
Baza je na lokalnih vratih 55432, da se izognemo konfliktu z obstoječo storitvijo
na 5432. Postopek zagona je v korenskem README.

Izvedena je bila inicializacija prazne baze; ponovitev migracije ni spreminjala
sheme. Lokalni demo račun omogoča preverjanje prijave in dveh dodeljenih servisov.
Preverjena sta razvojni zagon in produkcijsko streženje aplikacije z istim API
prefiksom `/api`. Preverjanje HTTP vključuje prijavo, branje servisov in zapis
poročila v pravo bazo; avtomatizirani testi pokrivajo tudi urejanje in zaklepanje.

Uspešno preverjanje: lint in produkcijska gradnja obeh delov, 11 integracijskih
testov API-ja ter 7 testov React vmesnika. Testi API-ja uporabljajo ločeno začasno
shemo in jo po izvedbi odstranijo. Uspešni testi potrjujejo pokrite scenarije,
ne pomenijo pa izpolnitve manjkajočih uporabniških zgodb ali popolne varnosti.

Za CI/CD in pogoje aktivacije dejanske namestitve glej `08-ci-cd.md`.
