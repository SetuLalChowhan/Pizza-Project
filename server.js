const express = require("express");

const app = express();

const path = require("path");

const ejs = require("ejs");

const expressLayout = require("express-ejs-layouts");

const PORT = process.env.PORT || 3000;

const mongoose = require("mongoose");

const session = require("express-session");

const flash = require("express-flash");

const MongoStore = require("connect-mongo");

const passport = require("passport");

const Emitter = require('events');

//Database connection

const url = "mongodb://localhost:27017/pizza";

const connection = mongoose.connect(url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
connection
  .then(() => {
    console.log("Database connected....");
  })
  .catch((err) => {
    console.log("connection failed");
  });
//passport config

// const passportInit = require('./app/config/passport')
// passportInit(passport);

// app.use(passport.initialize());

// app.use(passport.session());


//EventEmitter

const eventEmitter = new Emitter();

app.set('eventEmitter',eventEmitter)


//session congif

app.use(
  session({
    secret: "thisismysecret",
    resave: false,
    store: MongoStore.create({
      mongoUrl: url,
    }),
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 },
  })
);

const passportInit = require("./app/config/passport");
const res = require("express/lib/response");
const { join } = require("path");
passportInit(passport);
app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

app.use(flash());

//asset

app.use(express.static("public"));
app.use(express.json());

app.use(express.urlencoded({ extended: false }));
//global middleware
app.use((req, res, next) => {
  res.locals.session = req.session;
  res.locals.user = req.user;
  next();
});
//set Template engine

app.use(expressLayout);

app.set("views", path.join(__dirname, "/resources/views"));
app.set("view engine", "ejs");

require("./routes/web")(app);

const server = app.listen(PORT, () => {
  console.log(`server listening on ${PORT} port`); 
});

// Socket

const io = require('socket.io')(server)
io.on('connection', (socket) => {
      // Join
      // socket.on('join', (orderId) => {
      //   socket.join(orderId)
      // })
      
      socket.on('join',(orderId)=>{
       
         socket.join(orderId);
      })
})

eventEmitter.on('orderUpdated', (data) => {
  io.to(`order_${data.id}`).emit('orderUpdated', data)
})

eventEmitter.on('orderPlaced', (data) => {
  io.to('adminRoom').emit('orderPlaced', data)
})






