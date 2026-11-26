# Načrt izvedbe

1. Preveri zgodbe US-05–12 in razliko med vodjo ter administratorjem iz US-15.
   Uporabi skille `solvex-user-story`, `solvex-frontend`, `solvex-api-endpoint` in `solvex-tests`.
2. V ločeno vejo združi obstoječo agentsko pripravo in vmesnik; ne spreminjaj oddaljenega main.
3. Dodaj migracijo 003 za manager_id v sejah in profilno sliko vodje. Popravi
   izvajalnik, da ločeno beleži vsako migracijo tudi pri nadgradnji obstoječe baze.
4. Dodaj javni registraciji serviserja/vodje in prijavo vodje. Ponovno uporabi
   Argon2, HttpOnly sejo s hashom v bazi, profil in fotografije.
5. Uveljavi dovoljenja na vseh servisnih/poročevalskih API-jih ter preveri trenutno
   dodelitev tudi pri urejanju in oddaji. Dodaj bralne API-je pregleda vodje.
6. Dodaj tri obrazce in delovne prostore glede na strežniško vlogo. Odstrani
   anonimni dostop do oblikovne predloge nadzorne plošče.
7. Testiraj vloge, tuje ID-je, osnutke/oddajo in prerazporeditev, napake ter obnovo seje.
   Izvedi lint, teste in gradnjo obeh delov. Preveri migracijo tudi ob ponovitvi.
8. Pripravi lokalni commit in slovenski opis PR; uporabnik izvede push in odpre PR.

Migracija je potrebna za zahtevani dostop vodje; ne briše računov ali poslovnih
podatkov. Produkcijske migracije niso del lokalne priprave.
