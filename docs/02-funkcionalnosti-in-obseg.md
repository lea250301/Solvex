# Funkcionalnosti in obseg

## Uporabniške vloge
### Lastniki sončnih elektrarn
- poda zahtevo za pregled ali napako
- ima vpogled v zgodovino opravljenih servisov svojih elektrarn
- dobi priporočila za prihodnje preglede

Ne more pa videti zapisnika pregleda, podatke o drugih sončnih elektrarn drugih uporabnikov

### Serviserji
- prejemajo delovne naloge
- vpisujejo preglede ali napake in njihove rešitve
- pripravi poročilo
- zabeleži opravljeno delo 

Nima vpogleda v delovni nalog drugih serviserjev, ne more upravljati uporabnike ali dodeljevati naloge drugim serviserjem

### Vodja servisa
- ima vpogled v vse servise
- dodeljuje naloge serviserjem in jih razporeja
- ima vpogled v zalogo rezervnih delov
- določa nujnost zahtev

Ne more odstranjevati ali dodajati lastnike sončnih elektrarn

### Administrator
- upravlja račune uporabnikov
- določa vloge uporbniških računov
- upravlja s podatki zaloge delov
- dodeljevanje dostopov

Ne more izvajati servisnih postopkov

## Predvidene funkcionalnosti
1. *MVP* **Prijava napake/okvare na sončni elektrarni** - lastnik izpolni obrazec s prijavo napake, kjer opiše svoj problem
2. *MVP* **Zahteva za redni pregled** - lastnik pošlje zahtevo za redni pregled svoje sončne elektrarne
3. **Pregled preteklih storitev** - lastnik lahko vidi katere stortive so bile opravljene, kdaj ipd.
4. **Priporočila za prihodnje preglede** - sistem lahko glede na pretkle preglede priporoča lastniku kateri preglede se priporočajo v prihodnosti
5. *MVP* **Izdelava servisnega poročila** - serviser po koncu opravljenega dela napiše poročilo
6. *MVP* **Pregled dodeljenih servisov** - serviser lahko vidi vse servise, ki so mu bili dodeljeni
7. **Pregled podatkov o sončni elektrarni** - serviser lahko pred izvedbo dela pregleda osnovne podatke o elektrarni, kot so proizvajalec, moč, leto namestitve in uporabljena oprema
8. **Pregled in določanje nujnosti zahtevka** - vodja servisa pregleda vse oddane zahteve in na podlagi resnosti težave določi nujnost
9. *MVP* **Dodeljevanje delovnih nalog** - vodja servisa smiselno razdeli delovni nalog med serviserje glede na količino zahtev, nujnost, razpoložljivost
10. *MVP* **Spremljanje zaloge uporabljenih delov** - serviser zapiše v poročilo katere dele je uporabil, sistem zazna spremembo v zalogi in pošlje do vodje servisa
11. **Ustvarjanje skupin** - vodja servisa določi kateri serviserji izvajajo redne preglede?
12. *MVP* **Izbira termina** - vodja servisa izbere termin za pregled sončne elektrarne
13. **Dodajanje novih funkcionalnosti** - administrator lahko doda funkcionalnosti v sistem glede na primernost
14. **Obdeluje in analizira podatke** - administrator na podlagi pridobljenih podatkov in servisne zgodovine pripravi analize pogostosti popravil/napak glede na starost, moč, proizvajalca ipd. 
15. **Upravljanje uporabniških računov** – administrator določa pravice oziroma vloge uporabnikov in njihove račune

## Kasnejše nadgradnje
- **Mobilna aplikacija za serviserje** - serviser bo do svojih nalog dostopal preko mobilne aplikacije in ne le spleta
- **Samodejno obveščanje** - serviserji bi o novem terminu bili obveščeni v trenutku ko jim je bil dodeljen na svoj službeni email
- **Naprednejša analiza okvar** - sistem bi z pogostostjo napak glede na starost ali proizvajalca lahko lastnikom priporočal popravila 
- **Ocena popravil** - lastniki bi po opravljeni stortvi lahko podali oceno storitve in serviserja
- **Izdajanje e-računa** - lastniki bodo lahko izbrali opcijo, da račun prejmejo na svoj enaslov ali shranijo v sistem

## Out of scope
- sistem ne bo omogočal prodaje panelov ali neposrednega nakupa rezervnih delov lastnikom sončnih elektrarn
- sistem ne bo omogočal upravljanje elektrarn
- sistem ne bo omogočal oddaljenega popravljanja elektrarne - samo evidentiranje

