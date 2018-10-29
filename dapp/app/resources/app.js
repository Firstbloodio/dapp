const express = require('express');
const createError = require('http-errors');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session');
const expressValidator = require('express-validator');
const router = express.Router();
const app = express();
const tables = require('./routes/tables');
const constant = require('./routes/constant.js');
const morgan = require('morgan');
require('dotenv').config()

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(expressValidator());
app.use(cookieParser());
app.use(session({secret: 'krunal', saveUninitialized: false, resave: false}));
app.use(express.static(path.join(__dirname, 'assets')));
var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', '*');
    res.header('Access-Control-Allow-Headers', '*');
    next();
}
app.use(allowCrossDomain);
app.disable('etag');

app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));

const configRouter = require('./routes/configuration');
const infuraRouter = require('./routes/infura');
const challengeRouter = require('./routes/challenge');
const metamaskRouter = require('./routes/metamask');
const cronRouter = require('./routes/cron');
const witnessRouter = require('./routes/witness');
const findmatchRouter = require('./routes/findmatch');

app.use('/', configRouter);
app.use('/infura', infuraRouter);
app.use('/challenge', challengeRouter);
app.use('/metamask', metamaskRouter);
app.use('/cron', cronRouter);
app.use('/witness', witnessRouter);
app.use('/findmatch', findmatchRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.send('error')
});

var listener = app.listen(constant.port, function() {
  console.log("server started at port ", listener.address().port);
});

module.exports = app;
