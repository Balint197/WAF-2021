# WAF-2021
Webes alkalmazások fejlesztése 2021 projektfeladat

Design a WEB-based application for resource management, where resources can be booked like meeting rooms, laboratories, cars, etc. for a certain period of time. The system should incorporate a graphical user interface, where the users can make new bookings and modify their existing ones. Design and implement the related database. 

Create test cases for validation. Make it documented. Use unified modeling language (UML) tools to present the structure of your software.

____________________________________________________

Telepítés: (windows-on git bash-el: https://git-scm.com/downloads)

`git clone https://github.com/Balint197/WAF-2021`

`cd WAF-2021`

`npm install` 

DB: mySQL Workbench -> Server -> Data import -> az `sql` mappában levő fileok megnyitása

Futtatás:

`node app.js`

És ezután az oldal elérhető a `http://localhost:3000/` címen böngészővel.

____________________________________________________

TODO:

* dőlt betűs rész (tesztek, UML, dok)
* már létező felhasználó újra regisztráció esetén ~~conflict hiba~~ redirect ok, de nem megy a flash (app.js 464)
* kijelentkezve a gombok ne látszódjanak / redirect belépéshez
* ~~megint rossz a tábla ha foglalunk~~
* ~~adatbázis~~
* ~~törlés~~
* ~~rossz jelszó login error (és belép)~~
* ~~esetleg azt még kiírhatná az oldalra hogy rossz jelszó vagy felhasználónév, próbálkozz újra (flash-el)~~
* ~~regisztráció után egyből foglalás esetén error, de ha ki-belépünk akkor jó (nem fut le az autentikáció, így nincs meg a userid) -> jelenlegi megoldás: redirect to /logout, szóval be kell lépni (csúnya?)~~
* ~~modal confirmation ... text kitöltés~~
* ~~login után rá kell frissíteni a `/` oldalra, mert anélkül úgy látszódik a tábla, mintha kilépve lennénk~~

HA UNATKOZUNK/ÖTLETEK:

* regisztrációnál pattern (05 előadás, 31. oldal) (könnyű, csak most másik gépről vagyok...)
* profil oldalra áttenni/oda is berakni a lefoglalt időpontokat, ha nem akkor törölni
* flash ha lefoglalta az időpontot, és a db-ben is ok
* (más által) foglalt cella alsó részén felhasználó kiírása, hogy cserélgetni lehessen
* frontend szépítgetés
* további ötletek ha marad idő...
