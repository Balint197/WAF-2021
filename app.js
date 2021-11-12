const express = require('express'),
    engine = require('ejs-mate'),
    bodyParser = require('body-parser'),
    { body, validationResult } = require('express-validator'),
    session = require('express-session'),
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    MySQLStore = require('express-mysql-session')(session),
    app = express(),
    ejs = require('ejs');

app.engine('ejs', engine);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs'); // so you can render('index')

// ez nem tudom mit csinal pontosan
app.use(bodyParser.urlencoded({ extended: true }));
//app.use(expressValidator());


//.env fájlból database adatok
require("dotenv").config()
const DB_HOST = process.env.DB_HOST
const DB_USER = process.env.DB_USER
const DB_PASSWORD = process.env.DB_PASSWORD
const DB_DATABASE = process.env.DB_DATABASE
const DB_PORT = process.env.DB_PORT

//sessionhoz database
var options = {
    host: DB_HOST,              //This is your localhost IP
    user: DB_USER,              // "webalk" user created in mySQL workbench
    password: DB_PASSWORD,      // password for the webalk user
    database: DB_DATABASE,      // Database name
    port: DB_PORT               // port name, "3306" by default
}

//session
var sessionStore = new MySQLStore(options);

// ezt a részt az isAuth. előtt kell
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    store: sessionStore,
    saveUninitialized: false,
    //cookie: { secure: true }
}))

app.use(passport.initialize());
app.use(passport.session());

//login-os session
passport.use(new LocalStrategy(
    function (username, password, done) {
        console.log(username);
        console.log(password);

        db.getConnection(async (err, connection) => {
            if (err) throw (err)
            const sqlSearch = "SELECT * FROM users WHERE username = ?"
            const search_query = mysql.format(sqlSearch, [username])
            await connection.query(search_query, async (err, result) => {
                connection.release()
                console.log("Connection release")
                if (err) throw (err)
                if (result.length == 0) {
                    console.log("--------> User does not exist")
                    //res.sendStatus(404)
                }
                else {
                    const hashedPassword = result[0].password
                    //get the hashedPassword from result
                    if (await bcrypt.compare(password, hashedPassword)) {
                        console.log("---------> Login Successful")
                        console.log(result[0].userID)
                        //res.send(`${username} is logged in!`)
                    }
                    else {
                        console.log("---------> Password Incorrect")
                        //res.send("Password incorrect!")
                    } //end of bcrypt.compare()
                }//end of User exists i.e. results.length==0
            }) //end of connection.query()
        }) //end of db.connection()
        return done(null, 'username');
    }
));
//

app.use(function (req, res, next) {
    res.locals.isAuthenticated = req.isAuthenticated();
    next();
})

// ha authenticated, akkor megtekinthető az oldal, ha nem akkor loginra irányít (jelenleg nem használt)
function authenticationMiddleware() {
    return (req, res, next) => {
        console.log(`req.session.passport.user: ${JSON.stringify(req.session.passport)}`);

        if (req.isAuthenticated()) return next();
        res.redirect('/login')
    }
}


const port = 3000;
app.listen(port, () => {
    console.log(`Serving on port ${port}`);
});

app.get('/', (req, res) => {
    console.log(req.user);
    console.log(req.isAuthenticated())
    res.render('home');
});

app.get('/register', (req, res) => {
    res.render('register', {
        errors: false
    });
});

app.get('/profile', authenticationMiddleware(), (req, res) => {
    res.render('profile');
});

app.get('/login', (req, res) => {
    res.render('login');
});

// login ha sikerül főold., ha nem: login
app.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login'
}));
//

app.get('/logout', (req, res) => {
    req.logout();
    req.session.destroy();
    res.redirect('/login');
});

// database felhasználók tárolására
const mysql = require("mysql")

const db = mysql.createPool({
    connectionLimit: 100,
    host: DB_HOST,              //This is your localhost IP
    user: DB_USER,              // "webalk" user created in mySQL workbench
    password: DB_PASSWORD,      // password for the webalk user
    database: DB_DATABASE,      // Database name
    port: DB_PORT               // port name, "3306" by default
})

db.getConnection((err, connection) => {
    if (err) throw (err)
    console.log("DB connected successful: " + connection.threadId)
})



// REGISTRATION (create new user)

const bcrypt = require("bcrypt")

app.use(express.json());

//CREATE USER
app.post(
    '/register',
    body('username', 'A felhasználónév mező nem lehet üres!').notEmpty(),
    body('username', 'A felhasználónév 5-20 karakter hosszú legyen!').isLength({ min: 5 },{ max: 20 }),
    body('email', 'Érvénytelen email cím!').isEmail(),
    body('password', 'Jelszó túl rövid!').isLength({ min: 8 }),
    body('password', 'Jelszó túl hosszú!').isLength({ max: 50 }),
    //body('password', 'A jelszónak tartalmaznia kell legalább egy számot, egy kis- és nagybetűt és egy speciális karaktert!').matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{8,}$/, "i"),
    body('password', 'A jelszónak tartalmaznia kell legalább egy számot és legalább egy kis- és nagybetűt!').matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/),
    body('passwordMatch').custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('A két jelszó nem egyezik!');
        }
        // Indicates the success of this synchronous custom validator
        return true;
      }),
    async (req, res) => {   //function(req,res){ //async (req,res) => {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log(errors)
            /*res.status(400).json({
                errors: errors.array()
            }); */
            res.render('register', {
                errors: errors
            });
        }
        else {
            const user = req.body.username;           //req.body.name;
            //const password = req.body.password;
            const hashedPassword = await bcrypt.hash(req.body.password, 10);
            const email = req.body.email;
            const lastname = req.body.lastname;
            const firstname = req.body.firstname;
            //console.log("post received: %s", hashedPassword)

            db.getConnection(async (err, connection) => {
                if (err) throw (err)
                const sqlSearch = "SELECT * FROM users WHERE username = ?"
                const search_query = mysql.format(sqlSearch, [user])
                const sqlInsert = "INSERT INTO users (username, password, lastname, firstname, email) VALUES (?,?,?,?,?)"
                const insert_query = mysql.format(sqlInsert, [user, hashedPassword, lastname, firstname, email])
                // ? will be replaced by values

                await connection.query(search_query, async (err, result) => {

                    if (err) throw (err)
                    console.log("------> Search Results")
                    console.log(result.length)

                    if (result.length != 0) {
                        connection.release()
                        console.log("------> User already exists")
                        res.sendStatus(409)
                    }

                    else {
                        await connection.query(insert_query, (err, result) => {
                            connection.release()

                            if (err) throw (err)
                            console.log("--------> Created new User")
                            console.log(result.insertId)
                            const user_id = result.insertId;
                            // sikeres regisztráció után belépés
                            req.login(user_id, function (err) {
                                res.redirect('/');
                            });
                            //res.sendStatus(201)
                            //res.redirect('/login');
                        })
                    }
                }) //end of connection.query()
            }) //end of db.getConnection()
            //return res.redirect('/login');
        }
    }) //end of app.post()

passport.serializeUser(function (user_id, done) {
    done(null, user_id);
});

passport.deserializeUser(function (user_id, done) {
    //User.findById(id, function (err, user) {
    done(null, user_id);
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