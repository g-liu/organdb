const express = require('express');
const open = require('open');

const port = 8000;

var app = express();
// app.get('/', function(req, res) {
//   res.sendFile('index.html', { root: __dirname + '/webpages' });
// });

// app.listen(port);

// open(`http://localhost:${port}`);

app.use(express.static('webpages'));

app.listen(port);

open(`http://localhost:${port}`);