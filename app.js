require('dotenv').config();
require('ejs');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const session = require('express-session');
const cookieParser = require('cookie-parser')
const _ = require('lodash');

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
    body: String,
    author: String,
    zipCode: Number,
    postLink: String
});
const Post = mongoose.model('post', postSchema);

app.get('/', function (req, res) {
    res.render('welcome');
});

app.get('/register', function (req, res) {
    res.render('register');
});

app.get('/login', function (req, res) {
    res.render('login')
});

app.get('/logout', function (req, res) {
    req.session.userName = null;
    req.session.zipCode = null;
    res.redirect('/');
});

app.get('/post', function (req, res) {
    if (req.session.userName && req.session.zipCode) {
        res.render('create');
    } else {
        res.redirect('/');
    }
});

app.get('/home/:postName', function(req, res) {
    Post.findOne({postLink: req.params.postName}, function(err, post) {
        if(!err && post) {
            res.render('post', {post: post})
        } else {
            res.redirect('/home');
        }
    })
});

app.get('/home', function (req, res) {
    if (req.session.userName && req.session.zipCode) {
        Post.find({
            zipCode: req.session.zipCode
        }, function (err, posts) {
            if (!err) {
                res.render('feed', {
                    posts: posts
                });
            } else {
                res.send('Internal Error: ' + err);
            }
        })
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
                zipCode: req.body.zipCode,
            }, function (createErr, doc) {
                if (!createErr) {
                    req.session.userName = req.body.email;
                    req.session.zipCode = req.body.zipCode;
                    res.redirect('/home');
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
                            req.session.zipCode = doc.zipCode;
                            res.redirect('/home');
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

app.post('/post', function (req, res) {
    let title = req.body.title;
    let body = req.body.body;
    if (title && body && req.session.userName && req.session.zipCode) {
        Post.create({
            title: title,
            body: body,
            author: req.session.userName,
            zipCode: req.session.zipCode,
            postLink: _.camelCase(title)
        }, function (createErr) {
            if (!createErr) {
                res.redirect('/home')
            } else {
                res.send("Internal error:" + createErr);
            }
        })
    }
})

app.listen(process.env.PORT || 7000, function () {
    console.log('app is running on 7000.');
});