## Solvex - opis projekta
Solvex je spletna rešitev za lastnike sončnih elektrarn, ki želijo prijaviti napako ali naročiti redni pregled svoje elektrarne. Serviserji preko sistema prejemajo delovne naloge, beležijo ugotovljene napake, opravljeno delo in pripravljajo poročila o servisih. Vodja servisa uporablja rešitev za razporejanje servisov, dodeljevanje nalog in spremljanje zaloge rezervnih delov. Sistem lastnikom omogoča tudi pregled zgodovine servisov in pridobivanje priporočil za prihodnje preglede.

## Uporabljene tehnologije
- Frontend: React, Typescript, CSS
- Backend: Node.js in Express.js
- Podatkovna baza: PostgreSQL
- Avtentikacija: prijava uporabnikov z uporabo e-poštnega naslova in gesla

## Povezava do dokumentacije
https://github.com/lea250301/Solvex 

## Zagon

Predpogoji: Docker Desktop, Node.js in npm.  

Pred zagonom ustvarite `.env` v korenski mapi in `backend/.env` z lokalnimi povezovalnimi podatki. Te datoteke ne dodajajte v Git.  

Zaženite bazo iz korenske mape projekta v terminalu:  

*docker compose up -d db*

Backend zaženite v ločenem terminalu z:  
    cd backend  
    npm ci  
    npm run dev  

Frontend zaženite v ločenem terminalu z:  
    cd frontend  
    npm ci  
    npm run dev   

Frontend je dostopen na http://localhost:5173, backend na http://localhost:3000.