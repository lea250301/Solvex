# Uporabniške zgodbe

**US - 01:** *Prijava napake/okvare na sončni elektrarni*
> Kot lastnik sončne elektrarne želim oddati prijavo okvare z opisom težave, da jo podjetje lahko preveri in organizira servis. 

**Acceptance criteria:**

1. Lastnik (kot registriran uporabnik) lahko doda svojo sončno elektrarno v sistem.
2. V obrazcu izbere sončno elektrarno in poda vrsto okvare, opis in izpolni ostala obvezna polja.
3. Ob oddaji se obrazec shrani in se posreduje do vodje servisa, lastniku pa izpiše uspešnost oddaje.
---
**US - 02:** *Zahteva za redni pregled*
> Kot lastnik sončne elektrarne želim oddati prijavo za redni pregled svoje elektrarne, da zagotovim redno vzdrževanje in pravočasno odkritje morebitnih napak. 

**Acceptance criteria:**

1. Lastnik (kot registriran uporabnik) lahko doda svojo sončno elektrarno v sistem.
2. V obrazcu izbere sončno elektrarno in izbere redni pregled ter navede katere ostale servise želi (čiščenje panelov, pregled baterije ipd.).
3. Ob oddaji se obrazec shrani in se posreduje do vodje servisa, lastniku pa izpiše uspešnost oddaje.
---
**US - 03:** *Pregled preteklih storitev*
> Kot lastnik sončne elektrarne želim imeti pregled nad prejšnjimi storitvami podjetja, da lahko vidim kdaj so bili opravljeni servisi, kaj se je servisiralo in kako se je težava odpravila.

**Acceptance criteria:**

1. Lastnik (kot registriran uporabnik) lahko vidi pretekle servise na svojih vnešenih/registriranih sončnih elektrarnah.
2. S klikom na posamezn oelektrarno ima vpogled v opravljene servise, vrste servisa, kaj je bila napaka in kako se je odpravila, kdaj so paneli bili očiščeni, menjave delov ipd.
3. Seznam serivsov je evidentiran glede na datum od najnovejšega do najstarejšega.
4. V kolikor naprava ni imela servisov, je seznam prazen oziroma je primerno izpisano.
---
**US - 04:** *Priporočila za prihodnje preglede*
> Kot lastnik sončne elektrarne želim imeti možnost izbire priporočil za prihodnje servise glede na zgodovino, da lahko pravočasno načrtujem naslednji servis in zmanjšam možnosti za pojav okvar.

**Acceptance criteria:**

1. Sistem pripravi priporočila prihodnjih pregledov lastniku sončnih elektrarn glede na zgodovino njihovih servisov (vrsta servisa, datum). 
2. Priporočilo se prikaže takrat, ko se približuje določen datum (redni pregled se opravlja vsaj enkrat na leto, zato sistem en mesec pred potekom enega leta od evidentiranega rednega servisa pošlje uporabniku priporočilo o oddaji zahteve za redni servis).
3. Priporočila se ustvarjajo le na podlagi zgodovine rednih pregledov.
4. Sistem priporočila prikaže kot predlog za vzdrževanje, ne kot nujno opravilo, zato lahko lastnik to možnost tudi izklopi.
5. Če ni evidentirane zgodovine pregledov, sistem ne predlaga priporočil.
---
**US - 05:** *Izdelava servisnega poročila*
> Kot serviser (zaposlen) želim izdelati servisno poročilo, da se dokumentira kaj vse je bilo pregledano, popravljeno, odpravljeno in kdaj ter kakšno je stanje sončne elektrarne po pregledu.

**Acceptance criteria:**

1. Serviser lahko za dodeljen servis pregleda podatke o sončni elektrarni, ki so posredovani in po pregledu/servisu ustvari servisno poročilo
2. Poročilo je narejeno v obliki obrazca, kjer v posamezna polja vpisuje ali izbira podatke, opiše potek dela, ali je uporabil kakšen rezervni del, ali je prišlo do napake in zakaj, kakšno je stanje po pregledu in kdaj je bil opravljen.
3. Serviser lahko poročilo ureja, dokler ga ne posreduje vodji servisa.
4. Ko serviser poročilo shrani mu sistem izpiše uspešnost shranjevanja.
---
**US - 06:** *Pregled dodeljenih servisov*
> Kot serviser želim imeti pregled nad vsemi dodeljenimi servisi, da lahko spremljam svoje delovne naloge in načrtujem opravljanje pregledov.

**Acceptance criteria:**

1. Serviser na svojem dashboardu vidi vse servise, ki jih mora opraviti
2. Servisi so primarno prikazani od najnujnejšega do najmanj.
3. Servis ima prikaz kdaj je bil dodeljen in do kdaj mora biti opravljen, lokacijo, podatke o sončni elektrarni in njenem lastniku ter vrsto servisa in nujnost.
4. Ko serviser potrdi izbiro servisa, se mu prikaže v novi vrstici oziroma na vrhu kot 'pinned'
5. Serviser lahko vidi le servise, ki so mu bili dodeljeni, ne more videti servisov drugih serviserjev. 
---
**US - 07:** *Pregled podatkov o sončni elektrarni*
>  Kot serviser želim imeti pregled podatkov o sončni elektrarni, za katero mi je bil dodeljen delovni nalog/servis, da se ahko ustrezno prirpavim na delo in lažje prepoznam morebitne vzroke težav.

**Acceptance criteria:**

1. Ko serviser izbere oziroma potrdi izbiro servisa, se mu izpišejo podrobnejši podatki o sončni elektrarni in morebitnih okvarah
2. Serviser lahko vidi krajše opise nazadnje opravljenih (krajše število pregledov) servisov izbrane sončne elektrarne, vzroke za napake in kako so bili rešeni (uspešno ali neuspešno)
3. Serviser lahko vidi ali so kateri deli na elektrarni bili zamenjani ali ne, starost določenih delov, proizvajalca ipd.
4. Serviser lahko samo preglejuje podatke, ne more jih spreminjati ali urejati.
---
**US - 08:** *Pregled in določanje nujnosti zahtevka*
> Kot vodja servisa želim imeti pregled nad vsemi zahtevki in glede na resnost težave zahtevka določiti nujnost in dati prednost tem zahtevkom. 

**Acceptance criteria:**

1. Vodja servisa vidi vse zahtevke in tip servisa (okvara ali redni pregled).
2. Zahtevki, ki so tipa okvare, se prikazujejo ločeno od rednih, zato da ima vodja lažji pregled pri določanju nujnosti okvare.
3. Vodja servisa vidi kdaj je bilo zahtevek ustvarjen, kakšna je napaka (v primeru da je okvara) in osnovne podatke o sončni elektrarni ter lastniku.
4. Določi lahko nizko, srednjo ali visoko nujnost, ki jo sistem shrani in ustrezno prikaže serviserju, kateremu je servis dodeljen.
---
**US - 09:** *Dodeljevanje delovnih nalog*
>  Kot vodja servisa želim dodeljevati delovne naloge oziroma servise svojim zaposlenim glede na vrsto servisa, razpoložljivost zaposlenih in nujnosti zahtev, da zagotovim enakomerno razporeditev dela in pravočasnost opravljenih del.

**Acceptance criteria:**

1. Vodja servisa ob kliku na zahtevek dobi možnost, komu dodeli servis (lahk oveč serviserjem v kolikor je potrebno).
2. Sistem vodji prikaže seznam zaposlenih in njihovo specializacijo, termin opravljanja (do kdaj mora biti narejeno), nujnost in prikaz že dodeljenih servisov določenem serviserju (ob imenu zapisano kot št.).
3. Ko vodja shrani izbiro, se zahtevek pošlje serviserju, vodja pa spremlja vse servise, ki so že dodeljeni ali še čakajo na dodeljenost.
4. Vodja servisa lahko ureja delovne naloge, s tem da doda serviserje v kolikor je to potrebno in vidi ali je servis opravljen (oddan s poročilom) ali še v teku.
5. Vodja servisa lahko tudi odstrani delovne naloge in ima pregled nad opravljenimi nalogami ter nalogami, ki jih je potrebno ponovno opravit (nedokončane v smislu, da je bila poleg zahtevanega pregleda okvare ugotovljena nova).
---
**US - 10:** *Spremljanje zaloge uporabljenih delov*
> Kot vodja servisa želim imeti pregled na zalogo rezervih delov, da jih v primeru nizke zaloge pravočasno naročim.

**Acceptance criteria:**

1. Vodja servisa ob prejetju poročil vidi kateri rezervni deli so bili uporabljeni in zanj spremlja zalogo.
2. Sistem avtomatsko zmajša zalogo, s tem ko je servisno poročilo posredovano vodji servisa in obvesti vodjo o porabi rezernevga dela ali delov.
3. Sistem ima nastavljeno mejo, ko je na zalogi še določena količina delov in s tem obvesti vodjo, da priporoča naročanje.
4. Vodja servisa ima dostop do vpogleda v zalogo rezervnih delov, kjer je ob vsakem zapisana količina, ki je na voljo oziroma ali je potrebno dodatno naročanje.
---
**US - 11:** *Ustvarjanje skupin*
>  Kot vodja servisa želim ustvariti skupine serviserjev, kadar je potrebno več serviserjev za nek pregled, s tem bi učinkoviteje razporedil delo.

**Acceptance criteria:**

1. Vodja servisa lahko ustvari skupino s tem ko doda več serviserjev na zahtevek.
2. Vodja servisa lahko skupino ureja in doda več serviserjev, jih odstrani ali zamenja.
3. V kolikor je ustvarjena skupina, vodja servisa določi vodjo skupino (en izmed serviserjev), ki napiše in odda poročilo v imenu vseh članov.
4. Vodja servisa lahko vsakemu serviserju glede na njegovo sposobnost, določi tudi vlogo (za čiščenje, poprava elektrotehničnih komponent, poprava mehanskih komponent ipd.)
---
**US - 12:** *Izbira termina*
>  Kot vodja servisa želim določiti termin opravljanja določenega zahtevka in imeti pregled nad že dodeljenimi zahtevki določenega termina, saj bi s tem lahko lažje upravljal s prostimi serviserji in zasedenostjo termina

**Acceptance criteria:**

1. Vodja servisa lahko določi uro in datum opravljanja
2. Sistem mu prikaže razpoložljive serviserje za izbran termin in ali je takrat že drug servis zasedel prostor.
3. Ko vodja servisa določi termin in potrdi izbiro, dobi serviser obvestilo za nov servis, prav tako pa se lastniku prikaže termin, kdaj bo serviser prišel opraviti servis.
4. Vodja servisa lahko spremeni termin in v tem primeru obvesti tako lastnika kot serviserja/-e.
---
**US - 13:** *Dodajanje novih funkcionalnosti*
>  Kot administrator želim dodati nove funkcionalnost na zahtevo vodje servisa ali v splošne kot nadgradnja sistema, saj bi s tem izboljšal upravljanje sistema in servisni proces.

**Acceptance criteria:**

1. Administrator lahko doda novo funkcijo na zahtevo vodje servisa.
2. Administrator osnovnih funkcij ne more spreminjati oziroma brisati.
3. Administrator lahko omogoči ali onemogoči določene funkcionalnosti.
4. V kolikor gre za implementacijo novih funkcionalnosti, administrator v testnem okolju testira njihovo uporabo in jo ob potrditvi s strani vodje servisa tudi objavi.
---
**US - 14:** *Obdelovanje in analiziranje podatkov*
>  Kot administrator želim analizirati podatke o servisih in zgodovino napak glede na starost, moč in proizvajalca sončnih elektrarn, da lahko prepoznam pogoste vzorce okvar in podjetju pomagam izboljšati načrtovanje vzdrževanja.

**Acceptance criteria**

1. Administrator lahko dostopa do podatkov o opravljenih servisih in evidentiranih napakah v sistemu, v kolikor vodja servisa poda zahtevo.
2. Sistem omogoča prikaz števila evidentiranih napak in popravil glede na proizvajalca, moč ali leto namestitve sončne elektrarne.
3. Administrator lahko izbere časovno obdobje, za katero želi pregledati servisne podatke in sistem prikaže graf ali razpredelnico.
4. Analiza podatkov se pošlje vodji servisa v vpogled.
---
**US - 15:** *Upravljanje uporabniških računov*
>  Kot administrator želim upravljati uporabniške račune ter določati njihove vloge in dostope do funkcionalnosti, saj želim zagotoviti ustrezen dostop glede na vlogo uporabnika in njegove odgovoronosti.

**Acceptance criteria:**

1. Administrator lahko pregleda registrirane uporabnike, njihove vloge in po potrebi to tudi spremeni.
2. Sistem uporabnikom omogoča dostop do funkcij, ki so dovoljene glede na njihovo vlogo.
3. Administrator lahko uporabniški račun aktivira ali deaktivira.
---