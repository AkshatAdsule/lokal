const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('ejs');

const app = express();
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({
    extended: true
}));

mongoose.connect('mongodb+srv://akshat:Zqz3AGKJw5iZAoft@lokal.etj61.gcp.mongodb.net/lokal?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const userSchema = mongoose.Schema({
    email: String,
    password: String,
    zipCode: Number
});

const User = mongoose.model('user', userSchema);

app.get('/', function (req, res) {
    res.render('welcome');
});

app.get('/register', function(req, res) {
    res.render('register');
});

app.get('/login', function(req, res) {
    res.render('login');
});

app.post('/register', function (req, res) {
    bcrypt.hash(req.body.password, 10, function(hashErr, hash) {
        if(!hashErr) {
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

app.post('/login', function(req, res){
    User.findOne({email: req.body.email}, function (findErr, doc) {
        if(!findErr) {
            if(doc) {
                bcrypt.compare(req.body.password, doc.password, function(compareErr, same) {
                    if(!compareErr) {
                        same ? res.send('Logging in') : res.send('Invalid email/password combo');
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