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

//akshat key: Zqz3AGKJw5iZAoft

mongoose.connect('mongodb+srv://akshat:Zqz3AGKJw5iZAoft@lokal.etj61.gcp.mongodb.net/lokal?retryWrites=true&w=majority');

const userSchema = mongoose.Schema({
    name: String,
    password: String,
    zipCode: Number
});

const User = new mongoose.model('user', userSchema);

app.get('/', function (req, res) {
    res.render('welcome');
});

app.post('register', function(req, res) {});

app.listen(7000, function () {
    console.log('app is running on 7000.');
});