const express = require('express');
const bodyParser = require('body-parser');
require('ejs');

const app = express();
app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/', function(req, res) {
    res.render('welcome');
});

app.listen(7000, function() {
    console.log('app is running on 7000.');
});