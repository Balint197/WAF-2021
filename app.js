const express = require('express'),
    engine = require('ejs-mate'),
    app = express(),
    ejs = require('ejs');

app.engine('ejs', engine);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs'); // so you can render('index')


const port = 3000;
app.listen(port, () => {
    console.log(`Serving on port ${port}`);
});

app.get('/', (req, res) => {
    res.render('home');
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.get('/login', (req, res) => {
    res.render('login');
});