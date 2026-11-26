# Moje elektrarne – funkcionalni API

## Obseg

Prijavljeni lastnik lahko svoje elektrarne našteje, doda, prebere in delno posodobi.
To izvede podatkovni predpogoj prvega merila US-01 in US-02. Oddaja okvare oziroma
zahteve za redni pregled ni del te spremembe. Uporabniški vmesnik ostaja nespremenjen.
Izvedba uporablja skilla `solvex-api-endpoint` in `solvex-tests`.

## API

Vse poti zahtevajo HttpOnly sejo **lastnika**. Drugi vrsti računov vrneta 403,
neprijavljeni uporabnik 401. Lastnik se določi iz seje; polja za prenos lastništva
ali druga neznana polja niso dovoljena. Query parametri ne spreminjajo obsega dostopa.

| Metoda in pot | Odgovor |
| --- | --- |
| `GET /api/plants` | 200 `{ plants: [...] }`; prazen seznam je `[]`; razvrščeno po imenu in ID-ju |
| `POST /api/plants` | 201 `{ plant: {...} }` s shranjenimi podatki |
| `GET /api/plants/:plantId` | 200 `{ plant: {...} }` |
| `PATCH /api/plants/:plantId` | 200 `{ plant: {...} }`; spreminjajo se samo poslana polja |

Tuj in neobstoječ ID vrneta enak odgovor 404. Neveljaven ID ali podatki vrnejo
400 `{ message }`. Podvojeno ime pri istem lastniku vrne 409; drug lastnik lahko
uporabi enako ime. Imena se primerjajo po obstoječi enoličnosti PostgreSQL (upošteva
velike/male črke). Brisanje elektrarn in prenos lastništva nista vključena.

### Polja

| Polje | Pravilo |
| --- | --- |
| `name` | Obvezno; obrezano neprazno besedilo, največ 100 znakov |
| `installation_address` | Obvezno; obrezano neprazno besedilo, največ 1000 znakov |
| `postal_code` | Obvezno; besedilo s števkami, največ 20 znakov; ohrani začetne ničle |
| `city` | Obvezno; obrezano neprazno besedilo, največ 100 znakov |
| `manufacturer` | Neobvezno; obrezano besedilo do 100 znakov; prazno besedilo postane null |
| `installed_capacity_kw` | Neobvezno; pozitivna številka ali decimalni niz, do 99999999.99, največ dve decimalki |
| `panel_count` | Neobvezno; celo JSON število od 1 do 2147483647 |
| `has_battery` | JSON boolean; privzeto false |
| `battery_capacity_kwh` | Enaka številčna pravila kot moč; le ob `has_battery: true`; kapaciteta je lahko neznana (null) |
| `installed_on` | Neobvezno; dejansko veljaven datum YYYY-MM-DD, s preverjanjem prestopnih let |
| `installation_year` | Neobvezno; celo JSON število 1–9999; ob datumu se mora leto ujemati |

Tehnična polja so neobvezna, saj dokumentacija ne določa obveznosti vseh teh
podatkov in obstoječe elektrarne pogosto vsebujejo samo lokacijo ter ime.
Neobvezna polja se počistijo z `null`; obveznih ni mogoče počistiti. Če je datum
podan brez leta, se leto izpelje iz datuma. Samo leto ne ustvari izmišljenega datuma.
Pri spremembi datuma na drugo leto hkrati pošlji ujemajoče leto ali `installation_year: null`.
Pri odstranitvi baterije hkrati pošlji `battery_capacity_kwh: null`, če je bila prej znana.
Izpuščena polja pri PATCH ohranijo vrednost. Prazna posodobitev je zavrnjena.

Številke NUMERIC se v odgovoru vrnejo kot decimalni nizi (obstoječa pg konvencija),
ID kot niz, datum kot YYYY-MM-DD, števec panelov/leto kot številka in neznane vrednosti kot null.

Primer telesa POST:

```json
{
  "name": "Domača elektrarna",
  "installation_address": "Sončna ulica 1",
  "postal_code": "2000",
  "city": "Maribor",
  "manufacturer": "Proizvajalec panelov",
  "installed_capacity_kw": "12.50",
  "panel_count": 30,
  "has_battery": true,
  "battery_capacity_kwh": "8.25",
  "installation_year": 2024
}
```

## Baza in ohranitev podatkov

Migracija `004-owner-plants` doda nullable stolpca `manufacturer` in `installation_year`.
Za stare zapise z datumom izpelje leto; nobenega datuma si ne izmisli. Doda pogoj
skladnosti leta z datumom. Povezave na zahtevke in servise se pri urejanju ohranijo.
PATCH zaklene lastnikov zapis v transakciji, zato sočasni spremembi različnih polj
ne izgubita druga druge. Enoličnost imena znotraj lastnika preveri tudi baza.

Lokalno: `npm run db:migrate --prefix backend`. Produkcija ni bila spremenjena.
Za odjemalca uporabi obstoječi `/api` proxy, da se pošlje prijavni piškotek.

## Merila in dokazila

| Merilo | Status | Dokaz |
| --- | --- | --- |
| Seznam, dodajanje, ogled in urejanje lastne elektrarne | PASS | HTTP integracijski testi, preverjeno stanje v PostgreSQL |
| Validacija dokumentiranih in obstoječih polj | PASS | Prazna/predolga polja, števila/tipi/meje, baterija, datum in leto |
| Strežniško lastništvo in zavrnitev drugih vlog | PASS | 401/403, tuji ID 404, poskus prenosa lastništva, query parameter |
| Delni popravki, sočasnost in ohranitev povezav | PASS | PATCH, dve sočasni zahtevi, povezava obstoječega servisa |
| Migracija in ponovitev na lokalni bazi | PASS | 004 uporabljena; ponovitev brez ponovnega izvajanja |
| Lint, testi in gradnja obeh delov | PASS | Backend 43/43 in frontend 35/35; obe gradnji in lint uspešni |
| Uporabniški obrazci »Moje elektrarne« | NOT VERIFIED | Po naročilu niso del te izvedbe |
| Celotni US-01 in US-02 | NOT VERIFIED | Oddaja zahtevkov ter UI sledita pozneje |
