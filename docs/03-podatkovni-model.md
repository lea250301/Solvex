# Podatkovni model rešitve

## Vsaj 3 povezane entitete in njihova glavna polja
1. LASTNIK
- *id_lastnik*
- *ime*
- *priimek*
- *email*
- *naslov*

2. SONCNA_ELEKTRARNA
- *id_elektrarna*
- *id_lastnik*
- *lokacija*
- *proizvajalec*
- *moc*
- *leto_postavitve*

3. SERVIS
- *id_servis*
- *id_elektrarna*
- *id_serviser*
- *tip_servisa*
- *opis_napake*
- *status*
- *termin*
- *datum_zahteve

4. SERVISER
- *id_serviser*
- *ime*
- *priimek*
- *email*
- *telefon*

## Povezave med entitetami

- LASTNIK 1:N SONCNA_ELEKTRARNA

- SONCNA_ELEKTRARNA 1:N SERVIS

- SERVISER N:1 SERVIS

## Osnutek podatkovnega modela
```mermaid
erDiagram
LASTNIK {
    int id_lastnik PK
    string ime
    string priimek
    string email
    string naslov}

SONCNA_ELEKTRARNA {
    int id_elektrarna PK
    int id_lastnik FK
    string lokacija
    string proizvajalec
    float moc
    int leto_postavitve }

SERVIS {
    int id_servis PK
    int id_elektrarna FK
    int id_serviser FK
    string tip_servisa
    string opis_napake
    string status
    datetime termin
    datetime datum_zahteve }

SERVISER {
    int id_serviser PK
    string ime
    string priimek
    string email
    string telefon }

LASTNIK ||--o{ SONCNA_ELEKTRARNA : "ima"
SONCNA_ELEKTRARNA ||--o{ SERVIS : "ima"
SERVISER ||--o{ SERVIS : "izvaja"
```

