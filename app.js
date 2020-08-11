require('dotenv').config();
require('ejs');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const app = express();
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({
    extended: true
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
    if (req.body.email || req.body.password || req.body.zipCode) {
        res.render('register');
    } else {
        res.send("Enter a valid credential, one that is not empty")      
    }
});

app.get('/login', function (req, res) {
    if (req.body.email.length || req.body.password.length) {
        res.render('login')
    } else {
        res.send("Enter a valid credential, one that is not empty")
    };
});

app.get('/post', function (req, res) {
    res.render('post');
});

app.get('/feed', function (req, res) {
    res.render('feed');
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
                        same ? res.render('post') : res.send('Invalid email/password combo');
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