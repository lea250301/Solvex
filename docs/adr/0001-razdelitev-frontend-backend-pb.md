# Ločitev frontenda, backenda in podatkovne baze

## Kontekst in problem
Sistem Solvex je spletna aplikacija za prijavo napak na sončnih elektrarnah, naročanje rednih pregledov, dodeljevanje servisnih nalog in pregled zgodovine vzdrževanja. Ker sistem uporabljajo različne vrste uporabnikov, kot so lastniki sončnih elektrarn, serviserji, vodja servisa in administrator, je pomembno, da je njegova arhitektura pregledna in omogoča enostavno vzdrževanje ter nadaljnji razvoj.

Odločiti se je treba, ali bodo uporabniški vmesnik, poslovna logika in podatkovna baza združeni v eno celoto ali razdeljeni na ločene dele sistema.

## Možne opcije

* Enotna aplikacija, kjer so frontend, backend in podatkovna baza povezani
* Enotna aplikacija, kjer so frontend, backend in podatkovna baza ločeni

## Izbrana opcija

Izbrana odločitev: "Enotna aplikacija, kjer so frontend, backend in podatkovna baza ločeni", ker takšna arhitektura omogoča jasno ločitev odgovornosti posameznih delov sistema, lažje vzdrževanje in neodvisno spreminjanje posameznih komponent. Primerna je za obseg projekta Solvex, saj omogoča nadaljnji razvoj brez nepotrebne kompleksnosti.

### Posledice

* Good, because {positive consequence, e.g., improvement of one or more desired qualities, …}
* Bad, because {negative consequence, e.g., compromising one or more desired qualities, …}
