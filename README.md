# WAF-2021
Webes alkalmazások fejlesztése 2021 projektfeladat

Design a WEB-based application for resource management, where resources can be booked like meeting rooms, laboratories, cars, etc. for a certain period of time. The system should incorporate a graphical user interface, where the users can make new bookings and modify their existing ones. Design and implement the related database. 

Create test cases for validation. Make it documented. Use unified modeling language (UML) tools to present the structure of your software.

____________________________________________________

Telepítés: (windows-on git bash-el: https://git-scm.com/downloads)

`git clone https://github.com/Balint197/WAF-2021`

`cd WAF-2021`

`npm install` 

DB: mySQL Workbench -> Server -> Data import -> nyisd meg az `sql` mappában levő dolgokat

Futtatás (nem tudom java-val ez hogy fog menni, de ha ugyanígy és csak a scripteket változtatjuk):

`node app.js`

Ajánlom ezt használni sima node parancs helyett: https://www.npmjs.com/package/nodemon -> `nodemon app.js` miután telepítetted a gépedre

És innen az oldal elérhető a `http://localhost:3000/` címen böngészővel.

Belépés ha nem akarsz új felhasználót (lehet jobb így, mert talán könnyebb a teszttáblával, de nyilván lehet saját): user: balint pw: JZjTJGC4KGDUEes


____________________________________________________

TODO:

* ~~adatbázis~~
* ~~törlés~~
* rossz jelszó login error (és belép)
* ~~regisztráció után egyből foglalás esetén error, de ha ki-belépünk akkor jó (nem fut le az autentikáció, így nincs meg a userid) -> jelenlegi megoldás: redirect to /logout, szóval be kell lépni (csúnya?)~~
* ~~modal confirmation ... text kitöltés~~
* dőlt betűs rész (tesztek, UML, dok)
* ~~login után rá kell frissíteni a `/` oldalra, mert anélkül úgy látszódik a tábla, mintha kilépve lennénk~~

HA UNATKOZUNK/ÖTLETEK:

* flash ha lefoglalta az időpontot, és a db-ben is ok
* (más által) foglalt cella alsó részén felhasználó kiírása, hogy cserélgetni lehessen
* frontend szépítgetés
* további ötletek ha marad idő...

____________________________________________________

Jegyzet:

* nodejs
* Bootstrap + EJS templating frontend
* mySQL
* express server
* passport + brcrypt 
* regisztrációs paraméterek kezelése
