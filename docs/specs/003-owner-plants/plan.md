# Načrt

1. Primerjaj US-01/02, podatkovni model, shemo in obstoječo sejo lastnika.
2. V odvisni lokalni veji `feat/owner-plants` dodaj manjkajočega proizvajalca in leto
   z migracijo, ki ohrani obstoječe podatke.
3. Implementiraj GET/POST/GET podrobnosti/PATCH v ločenem modulu API-ja.
   Lastništvo preveri v SQL in seji, omeji polja ter validiraj medsebojna pravila.
4. Pri delnih spremembah uporabi transakcijo in zaklep vrstice za ohranitev sočasnih popravkov.
5. Dodaj integracijske teste z dvema lastnikoma, serviserjem in vodjo v začasni shemi.
6. Poženi lint, teste ter gradnji obeh delov in lokalno migracijo tudi ob ponovitvi.
7. Dokumentiraj API za kasnejšo povezavo UI-ja. Pripravi lokalni commit brez objave.
