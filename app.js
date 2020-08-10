const express = require('express');
const bodyParser = require('body-parser');
require('ejs');

const app = express();

app.listen(7000, function() {
    console.log('app is running on 7000.');
})