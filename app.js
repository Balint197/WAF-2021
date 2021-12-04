// DEPENDENCIES
const express = require('express'),
    engine = require('ejs-mate'),
    bodyParser = require('body-parser'),
    { body, validationResult } = require('express-validator'),
    session = require('express-session'),
    passport = require('passport'),
    bcrypt = require("bcrypt"),
    LocalStrategy = require('passport-local').Strategy,
    MySQLStore = require('express-mysql-session')(session),
    app = express(),
    mysql = require("mysql"),
    flash = require('connect-flash'),
    ejs = require('ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(flash());

// EJS TEMPLATING ENGINE INIT
app.engine('ejs', engine);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs'); // so you can render('index')

//.env fájlból database adatok
require("dotenv").config()
const DB_HOST = process.env.DB_HOST
const DB_USER = process.env.DB_USER
const DB_PASSWORD = process.env.DB_PASSWORD
const DB_DATABASE = process.env.DB_DATABASE
const DB_PORT = process.env.DB_PORT

//sessionhoz database
var options = {
    host: DB_HOST, //This is your localhost IP
    user: DB_USER, // "webalk" user created in mySQL workbench
    password: DB_PASSWORD, // password for the webalk user
    database: DB_DATABASE, // Database name
    port: DB_PORT // port name, "3306" by default
}

//session
var sessionStore = new MySQLStore(options);

// ezt a részt a passport.session előtt kell
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    store: sessionStore,
    saveUninitialized: false,
    //cookie: { secure: true }
}))

// PASSPORT BEÁLLÍTÁSA
app.use(passport.initialize());
app.use(passport.session());

//login-os session
var loggedInUserid = null

passport.use(new LocalStrategy(
    function(username, password, done) {
        console.log("login: " + username);
        console.log("password: " + password);

        db.getConnection(async(err, connection) => {
                if (err) throw (err)
                const sqlSearch = "SELECT * FROM users WHERE username = ?"
                const search_query = mysql.format(sqlSearch, [username])
                await connection.query(search_query, async(err, result) => {
                        connection.release()
                            //console.log("Connection release")
                        if (err) throw (err)
                        if (result.length == 0) {
                            console.log("--------> User does not exist")
                            return done(null, false);
                            //res.sendStatus(404)
                        } else {
                            const hashedPassword = result[0].password
                                //get the hashedPassword from result
                            loggedInUserid = result[0].userid //username
                            console.log("userid: " + loggedInUserid)
                            console.log("username: " + username)
                            if (await bcrypt.compare(password, hashedPassword)) {
                                console.log("---------> Login Successful")
                                return done(null, loggedInUserid);
                                //res.send(`${username} is logged in!`)
                            } else {
                                console.log("---------> Password Incorrect")
                                    //res.redirect('/login')
                                return done(null, false);
                                //res.send("Password incorrect!")
                            } //end of bcrypt.compare()
                        } //end of User exists i.e. results.length==0
                    }) //end of connection.query()
            }) //end of db.connection()
    }
));

app.use(function(req, res, next) {
    res.locals.isAuthenticated = req.isAuthenticated();
    next();
})

// ha authenticated, akkor megtekinthető az oldal, ha nem akkor loginra irányít
function authenticationMiddleware() {
    return (req, res, next) => {
        console.log(`req.session.passport.user: ${JSON.stringify(req.session.passport)}`);

        if (req.isAuthenticated()) return next();
        res.redirect('/login')
    }
}

// SZERVER BEÁLLÍTÁS
const port = 3000;
app.listen(port, () => {
    console.log(`Serving on port ${port}`);
});

// GET ÉS POST REQUESTEK
app.get('/', (req, res) => {
    console.log("req.user: " + req.user);
    console.log("aut: " + req.isAuthenticated())
    db.getConnection(async(err, connection) => { // csatéakozás a db-hez
        if (err) throw (err)
        if (req.isAuthenticated()) { // felhasználó  belépve
            console.log("authenticated: " + req.user)
        } else {
            loggedInUserid = null
        }
        const sqlSearch = "SELECT * FROM userdb.timetable  ORDER BY idtimetable" // SQL query string
        await connection.query(sqlSearch, async(err, result) => { // SQL string parancs futtatása a db-ben
            connection.release() // db kapcsolat bontása
            const timetabledata = result // lekérdezés eredménye tárolva
            console.log("loggedInUserid: " + loggedInUserid)
            res.render('home', { timetabledata: timetabledata, loggedInUserid: loggedInUserid }); // átirányítás, a lekérdezett adatok és userid továbbításával
        })
    })

});
app.post("/foglalas", (req, res) => {
        console.log("foglaloember: " + loggedInUserid);
        const foglaloID = req.body.foglaloID;
        console.log("foglalniakar: " + foglaloID);
        db.getConnection(async(err, connection) => {
                if (err) throw (err)
                const sqlSearch = "UPDATE userdb.timetable SET userid = ? WHERE (idtimetable = ?);" // foglalás UPDATE
                const search_query = mysql.format(sqlSearch, [loggedInUserid, foglaloID])
                console.log("--------> Foglalás készül")
                console.log("loggedInUserid: " + loggedInUserid)
                console.log("foglaloID: " + foglaloID)

                await connection.query(search_query, async(err, result) => {
                        if (err) throw (err)
                        console.log("------> Foglalás kész")
                        connection.release()
                        res.redirect('/')
                    }) //end of connection.query()
            }) //end of db.getConnection()
    }) //end of app.post()


app.post("/torles", (req, res) => {
        console.log("torloember: " + loggedInUserid);
        const torloID = req.body.torloID;
        console.log("torolniakar: " + torloID);
        db.getConnection(async(err, connection) => {
                if (err) throw (err)
                const sqlSearch = "UPDATE userdb.timetable SET userid = NULL WHERE (idtimetable = ?);" // UPDATE, mert NULL-ra állítjuk a tulajdonost, de nem töröljük az időpontot
                const search_query = mysql.format(sqlSearch, [torloID])
                console.log("--------> Törlés készül")
                console.log("loggedInUserid: " + loggedInUserid)
                console.log("foglaloID: " + torloID)

                await connection.query(search_query, async(err, result) => {
                        if (err) throw (err)
                        console.log("------> Törlés kész")
                        connection.release()
                        res.redirect('/')
                    }) //end of connection.query()
            }) //end of db.getConnection()
    }) //end of app.post()


app.get('/register', (req, res) => {
    res.render('register', {
        errors: false,
        errorUser: req.flash('errorUser')
    });
});

app.get('/profile', authenticationMiddleware(), (req, res) => {
    // res.render('profile');
    // ide kell az adatbázis lekérdezés
    db.getConnection(async(err, connection) => {
            if (err) throw (err)
            const sqlSearch = "SELECT * FROM userdb.users WHERE userid = ?;" // UserID alapján lekérünk mindent
            const search_query = mysql.format(sqlSearch, [req.user])
            console.log("--------> Bejelentkezett user adatainak olvasása")
            console.log("loggedInUserid: " + req.user)

            await connection.query(search_query, async(err, result) => {
                    if (err) throw (err)
                    var username = result[0].username
                    var firstname = result[0].firstname
                    var lastname = result[0].lastname
                    var fullname = result[0].lastname + " " + result[0].firstname
                    var email = result[0].email
                    console.log("------> Kiolvasás kész")
                    console.log("fullname: " + fullname)
                    connection.release()
                    res.render('profile', {
                        username: username,
                        firstname: firstname,
                        lastname: lastname,
                        fullname: fullname,
                        email: email,
                        modDone: req.flash('modDone')
                    });
                }) //end of connection.query()
        }) //end of db.getConnection()
});

app.post('/modifyreq', (req, res) => {
    res.redirect('/profilemodifier');
});

app.get('/profilemodifier', (req, res) => {
    db.getConnection(async(err, connection) => {
            if (err) throw (err)
            const sqlSearch = "SELECT * FROM userdb.users WHERE userid = ?;" // UserID alapján lekérünk mindent
            const search_query = mysql.format(sqlSearch, [req.user])
            console.log("--------> Bejelentkezett user adatainak olvasása")
            console.log("loggedInUserid: " + req.user)

            await connection.query(search_query, async(err, result) => {
                    if (err) throw (err)
                    var username = result[0].username
                    var firstname = result[0].firstname
                    var lastname = result[0].lastname
                    var fullname = result[0].lastname + " " + result[0].firstname
                    var email = result[0].email
                    console.log("------> Kiolvasás kész")
                    console.log("fullname: " + fullname)
                    connection.release()
                    res.render('profilemodifier', {
                        username: username,
                        firstname: firstname,
                        lastname: lastname,
                        fullname: fullname,
                        email: email,
                        errMessage: null,
                        errors: null
                    });
                }) //end of connection.query()
        }) //end of db.getConnection()
});

app.post('/modify',
        body('modEmail', 'Érvénytelen email cím!').isEmail(),
        body('modPassword', 'Jelszó túl rövid!').isLength({ min: 8 }),
        body('modPassword', 'Jelszó túl hosszú!').isLength({ max: 50 }),
        body('modPassword', 'A jelszónak tartalmaznia kell legalább egy számot és legalább egy kis- és nagybetűt!').matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/),
        body('passwordAgain').custom((value, { req }) => {
            if (value !== req.body.modPassword) {
                throw new Error('A két jelszó nem egyezik!');
            }
            // Indicates the success of this synchronous custom validator
            return true;
        }),
        async(req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                console.log(errors)
                db.getConnection(async(err, connection) => {
                        if (err) throw (err)
                        const sqlSearch = "SELECT * FROM userdb.users WHERE userid = ?;" // UserID alapján lekérünk mindent
                        const search_query = mysql.format(sqlSearch, [req.user])
                        console.log("--------> Bejelentkezett user adatainak olvasása")
                        console.log("loggedInUserid: " + req.user)

                        await connection.query(search_query, async(err, result) => {
                                if (err) throw (err)
                                var username = result[0].username
                                var firstname = result[0].firstname
                                var lastname = result[0].lastname
                                var fullname = result[0].lastname + " " + result[0].firstname
                                var email = result[0].email
                                console.log("------> Kiolvasás kész")
                                console.log("fullname: " + fullname)
                                connection.release()
                                res.render('profilemodifier', {
                                    username: username,
                                    firstname: firstname,
                                    lastname: lastname,
                                    fullname: fullname,
                                    email: email,
                                    errors: errors,
                                    errMessage: null
                                });
                            }) //end of connection.query()
                    }) //end of db.getConnection()
            } else {
                const user = req.body.modUser;
                const password = req.body.oldPassword;
                const newhashedPassword = await bcrypt.hash(req.body.modPassword, 10);
                const email = req.body.modEmail;
                const lastname = req.body.modLastName;
                const firstname = req.body.modFirstName;
                console.log("post received: %s", user)

                db.getConnection(async(err, connection) => {
                        if (err) throw (err)
                        const sqlSearch = "SELECT * FROM users WHERE username = ?"
                        const search_query = mysql.format(sqlSearch, [user])

                        await connection.query(search_query, async(err, result) => {
                                //connection.release()

                                if (err) throw (err)
                                const hashedPassword = result[0].password
                                    //get the hashedPassword from result
                                if (await bcrypt.compare(password, hashedPassword)) {
                                    console.log("---------> Good password")
                                    const sqlUpdate = "UPDATE users SET email=?, password=?, lastname=?, firstname=? WHERE userid = ?;"
                                    const update_query = mysql.format(sqlUpdate, [email, newhashedPassword, lastname, firstname, req.user])
                                    await connection.query(update_query, async(err, result) => {
                                        if (err) throw (err)
                                        console.log("------> Data Updated")
                                        req.flash('modDone', 'Sikeres módosítás!')
                                        res.redirect('/profile');
                                    })
                                } else {
                                    console.log("---------> Password Incorrect")
                                    db.getConnection(async(err, connection) => {
                                            if (err) throw (err)
                                            const sqlSearch = "SELECT * FROM userdb.users WHERE userid = ?;" // UserID alapján lekérünk mindent
                                            const search_query = mysql.format(sqlSearch, [req.user])
                                            console.log("--------> Bejelentkezett user adatainak olvasása")
                                            console.log("loggedInUserid: " + req.user)

                                            await connection.query(search_query, async(err, result) => {
                                                    if (err) throw (err)
                                                    var username = result[0].username
                                                    var firstname = result[0].firstname
                                                    var lastname = result[0].lastname
                                                    var fullname = result[0].lastname + " " + result[0].firstname
                                                    var email = result[0].email
                                                    console.log("------> Kiolvasás kész")
                                                    console.log("fullname: " + fullname)
                                                    connection.release()
                                                    res.render('profilemodifier', {
                                                        username: username,
                                                        firstname: firstname,
                                                        lastname: lastname,
                                                        fullname: fullname,
                                                        email: email,
                                                        errMessage: "Hibás jelszó!",
                                                        errors: null
                                                    });
                                                }) //end of connection.query()
                                        }) //end of db.getConnection()
                                } //end of bcrypt.compare()
                            }) //end of connection.query()
                    }) //end of db.getConnection()
            }
        }) //end of app.post()



app.get('/login', (req, res) => {
    //const failureFlash = req.flash('message')
    res.render('login', {
        failureFlash: req.flash('error')
    }, console.log(req.flash('error')));
});


//login ha sikerül főold., ha nem: login
app.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: 'Hibás felhasználónév vagy jelszó!'
}, ));


app.get('/logout', (req, res) => {
    req.logout();
    req.session.destroy();
    res.redirect('/');
});

// database felhasználók tárolására
const db = mysql.createPool({
    connectionLimit: 100,
    host: DB_HOST, //This is your localhost IP
    user: DB_USER, // "webalk" user created in mySQL workbench
    password: DB_PASSWORD, // password for the webalk user
    database: DB_DATABASE, // Database name
    port: DB_PORT // port name, "3306" by default
})

db.getConnection((err, connection) => {
    if (err) throw (err)
    console.log("DB connected successful: " + connection.threadId)
        // @ ide kéne a db teszt?
})



// REGISTRATION (create new user)
app.use(express.json());

//CREATE USER
app.post(
        '/register',
        body('username', 'A felhasználónév mező nem lehet üres!').notEmpty(),
        body('username', 'A felhasználónév 5-20 karakter hosszú legyen!').isLength({ min: 5 }, { max: 20 }),
        body('email', 'Érvénytelen email cím!').isEmail(),
        body('password', 'Jelszó túl rövid!').isLength({ min: 8 }),
        body('password', 'Jelszó túl hosszú!').isLength({ max: 50 }),
        body('password', 'A jelszónak tartalmaznia kell legalább egy számot és legalább egy kis- és nagybetűt!').matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/),
        body('passwordMatch').custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('A két jelszó nem egyezik!');
            }
            // Indicates the success of this synchronous custom validator
            return true;
        }),
        async(req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                console.log(errors)
                res.render('register', {
                    errors: errors,
                    errorUser: req.flash('errorUser')
                });
            } else {
                const user = req.body.username; //req.body.name;
                //const password = req.body.password;
                const hashedPassword = await bcrypt.hash(req.body.password, 10);
                const email = req.body.email;
                const lastname = req.body.lastname;
                const firstname = req.body.firstname;
                //console.log("post received: %s", hashedPassword)

                db.getConnection(async(err, connection) => {
                        if (err) throw (err)
                        const sqlSearch = "SELECT * FROM users WHERE username = ?"
                        const search_query = mysql.format(sqlSearch, [user])
                        const sqlInsert = "INSERT INTO users (username, password, lastname, firstname, email) VALUES (?,?,?,?,?)"
                        const insert_query = mysql.format(sqlInsert, [user, hashedPassword, lastname, firstname, email])
                            // ? will be replaced by values

                        await connection.query(search_query, async(err, result) => {

                                if (err) throw (err)
                                console.log("------> Search Results")
                                console.log(result.length)
                                console.log(result)

                                if (result.length != 0) {
                                    connection.release()
                                    console.log("------> User already exists")
                                        //res.sendStatus(409)
                                    req.flash('errorUser', 'Felhasználó már létezik!') // nem működik
                                    res.redirect('/register');
                                } else {
                                    await connection.query(insert_query, (err, result) => {
                                        connection.release()

                                        if (err) throw (err)
                                        console.log("--------> Created new User")
                                        console.log(result.insertId)
                                        const user_id = result.insertId;
                                        // sikeres regisztráció után belépés
                                        req.login(user_id, function(err) {
                                            res.redirect('/logout');
                                        });
                                    })
                                }
                            }) //end of connection.query()
                    }) //end of db.getConnection()
                    //return res.redirect('/login');
            }
        }) //end of app.post()

passport.serializeUser(function(loggedInUserid, done) {
    done(null, loggedInUserid);
});

passport.deserializeUser(function(loggedInUserid, done) {
    //User.findById(id, function (err, user) {
    done(null, loggedInUserid);
    //});
});

//LOGIN (AUTHENTICATE USER)  előző megoldás

/*
app.post("/login", (req, res) => {
    const user = req.body.username;
    const password = req.body.password;
    db.getConnection(async (err, connection) => {
        if (err) throw (err)
        const sqlSearch = "SELECT * FROM users WHERE username = ?"
        const search_query = mysql.format(sqlSearch, [user])
        await connection.query(search_query, async (err, result) => {
            connection.release()

            if (err) throw (err)
            if (result.length == 0) {
                console.log("--------> User does not exist")
                res.sendStatus(404)
            }
            else {
                const hashedPassword = result[0].password
                //get the hashedPassword from result
                if (await bcrypt.compare(password, hashedPassword)) {
                    console.log("---------> Login Successful")
                    res.send(`${user} is logged in!`)
                }
                else {
                    console.log("---------> Password Incorrect")
                    res.send("Password incorrect!")
                } //end of bcrypt.compare()
            }//end of User exists i.e. results.length==0
        }) //end of connection.query()
    }) //end of db.connection()
}) //end of app.post()
*/