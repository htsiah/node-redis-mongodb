const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const studentRouters = require('./routes/StudentRoute');
const teacherRouters = require('./routes/TeacherRoute');

const app = express();

app.use(express.json());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
  next();
});

app.use(express.static(path.join('public')));

app.use('/api/student', studentRouters);
app.use('/api/teacher', teacherRouters);

app.use((req, res, next) => {
  res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});

mongoose
  .connect(`mongodb://localhost:27017/node-redis`, {
    useFindAndModify: false,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Db connection established.');
    app.listen(80);
    console.log('Listening port 80.');
  })
  .catch((err) => {
    console.log(err);
  });
