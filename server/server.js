const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const bodyParser = require('body-parser');

let app = express();
var options = {
  inflate: true,
  limit: '100kb',
  type: 'application/octet-stream',
};
app.use(bodyParser.raw(options));

try {
  fs.mkdirSync(path.join(__dirname, 'data'));
} catch (err) {
  if (err.code !== 'EEXIST') {
    console.error(err);
  }
}

app.use(cors());

app.get('/lists', (req, res) => {
  const dataDirectory = path.join(__dirname, 'data');
  return fs.readdir(dataDirectory, (err, dirs) => {
    if (err) {
      console.error(err);
      res.status(404).send('No lists');
    } else {
      res.send(dirs);
    }
  });
});

app.get('/:id', (req, res) => {
  let id = req.params.id;
  let filename = path.join(__dirname, 'data', id);
  fs.stat(filename, (err, stats) => {
    if (err) {
      console.error(err);
      res.status(404).send('Not found');
    } else {
      res.sendFile(filename);
    }
  });
});

app.post('/:id', (req, res) => {
  let id = req.params.id;
  fs.writeFileSync(path.join(__dirname, 'data', id), req.body);
  res.status(200).send('ok');
});

const port = 5000;

app.listen(port, () => {
  console.log('listening on http://localhost:' + port);
});
