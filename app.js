var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var expressHbs = require('express-handlebars');
var handlebars = require('handlebars');
var flash = require('connect-flash');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);

const dotenv = require('dotenv').config();

var app = express();
var socket_io    = require( "socket.io" );
var io           = socket_io();
app.io           = io;

var index = require('./routes/index');
var users = require('./routes/users')(io);
var groups = require('./routes/groups');
//DB start
mongoose.connect('localhost:27017/modlitwapomaga');
var db = mongoose.connection;

//on DB error
db.on('error',console.error.bind(console,'connection error:'));

//use sessions for tracking logins
app.use(session({
    secret: 'modlitwa',
    resave: true,
    saveUninitialized: false,
    store : new MongoStore({
        mongooseConnection : db
    }),
    cookie: { maxAge: 60000*5 }
}));

//flash messaging
app.use(flash());

// view engine setup
app.engine('.hbs',expressHbs({
  defaultLayout:'layout', 
  extname:'.hbs',
  helpers: {
    if_eq: function (a, b, opts) { 
        if(a === b) // Or === depending on your needs
          return opts.fn(this);
        else
          return opts.inverse(this); 
      },
    sel: function(a,b) {
      if(a===b) return "selected";
    },
    json: function(context) {
      return JSON.stringify(context); 
    },
    ISODate: function(inputDate) {
      //date convertion
      var date = new Date(inputDate);

      var day = date.getDate();
      var month = date.getMonth() + 1;
      var year = date.getFullYear();
      var hour = date.getHours();
      var minute = date.getMinutes();
      var second = "00";

      if (month < 10) month = "0" + month;
      if (day < 10) day = "0" + day;
      if (hour <10) hour = "0" +hour;
      if (minute <10) minute = "0" +minute;

      var today = year + "-" + month + "-" + day + "T" + hour + ":" + minute + ":" + second;
    
      return today; 
    }, 
  }
}));




//app.set('views', path.join(__dirname, 'views'));
app.set('view engine', '.hbs');


// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);
app.use('/groups', groups);

//socket.io connection
io.sockets.on('connection', (socket) => {
    console.log('Socket.IO Connected');
    socket.on('disconnect', () => {
        console.log('Socket.IO Disconnected');
    });
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
