const express = require('express');
const open = require('open');

const port = 8000;

var app = express();
app.get('/', function(req, res) {
  res.sendFile('webpages/index.html', { root: __dirname });
});

app.listen(port);

open(`http://localhost:${port}`);