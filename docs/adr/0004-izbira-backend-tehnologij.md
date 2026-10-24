# Izbira backend tehnologij

## Kontekst in problem
Sistem Solvex potrebuje backend, ki bo skrbel za poslovno logiko aplikacije, obdelavo zahtevkov uporabnikov, upravljanje servisnih nalog in komunikacijo s 
podatkovno bazo. Odločiti se je treba, katere tehnologije uporabiti za razvoj backenda, da bo ta enostaven za vzdrževanje in bo omogočal postopno dodajanje 
funkcionalnosti.

## Možne opcije

* Node.js in Express.js.
* Python in Flask.
* Python in Django.
* Java in Spring Boot.

## Izbrana opcija
Izbrana odločitev: "Node.js in Express.js", ker Node.js omogoča izvajanje JavaScripta na strežniški strani, Express.js pa poenostavi izdelavo spletnega strežnika 
in API-ja. Izbira je primerna za sistem Solvex, saj omogoča preprosto implementacijo potrebnih funkcionalnosti in povezovanje s podatkovno bazo 
PostgreSQL brez nepotrebne kompleksnosti.

### Posledice

* Slabo, ker je treba pravilno načrtovati strukturo backenda in poskrbeti za varnost, preverjanje podatkov ter obravnavo napak.
* Dobro, ker Express.js omogoča enostavno definiranje API-poti za komunikacijo s frontendom.
* Dobro, ker Node.js omogoča uporabo JavaScripta oziroma TypeScripta na strežniški strani, kar olajša povezovanje s frontendom, ki uporablja React in TypeScript.
