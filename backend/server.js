const express = require('express');
const app = express();
const path = require('path');


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const index = require('./routes/index');
app.use('/', index);


const port = 3002;

app.listen(port, () => {
  console.log(` app listening at http://localhost:${port}`);
});
