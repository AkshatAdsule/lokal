require('dotenv').config();
require('ejs');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const session = require('express-session');
const cookieParser = require('cookie-parser')

const app = express();
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(cookieParser())
app.use(session({
    secret: process.env.COOKIE_SECRET,
    resave: false,
    saveUninitialized: false
}));

mongoose.connect(process.env.ATLAS_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const userSchema = mongoose.Schema({
    email: String,
    password: String,
    zipCode: Number
});
const User = mongoose.model('user', userSchema);

const postSchema = mongoose.Schema({
    title: String,
    content: String,
    author: String
});
const Post = mongoose.model('post', postSchema);

app.get('/', function (req, res) {
    res.render('welcome');
});

app.get('/register', function (req, res) {
    res.render('register');
});

app.get('/login', function (req, res) {
    res.render('login');
});

app.get('/logout', function (req, res) {
    req.session.userName = null;
    res.redirect('/');
});

app.get('/post', function (req, res) {
    res.render('post');
});

app.get('/feed', function (req, res) {
    if (req.session.userName) {
        res.send('Logged in as ' + req.session.userName);
    } else {
        res.redirect('/');
    }
});

app.post('/register', function (req, res) {
    bcrypt.hash(req.body.password, 10, function (hashErr, hash) {
        if (!hashErr) {
            User.create({
                email: req.body.email,
                password: hash,
                zipCode: req.body.zipCode
            }, function (createErr) {
                if (!createErr) {
                    res.redirect('/');
                } else {
                    res.send("Error: " + createErr);
                }
            });
        } else {
            res.send("Error: " + hashErr);
        }
    })

});

app.post('/login', function (req, res) {
    User.findOne({
        email: req.body.email
    }, function (findErr, doc) {
        if (!findErr) {
            if (doc) {
                bcrypt.compare(req.body.password, doc.password, function (compareErr, same) {
                    if (!compareErr) {
                        if (same) {
                            req.session.userName = doc.email;
                            res.redirect('/feed');
                        } else {
                            res.send('Invalid email/password combo');
                        }
                    } else {
                        res.send('Internal error: ' + compareErr);
                    }
                })
            } else {
                res.send('Invalid email');
            }
        } else {
            res.send('Internal error: ' + findErr)
        }
    });
});

app.listen(7000, function () {
    console.log('app is running on 7000.');
});