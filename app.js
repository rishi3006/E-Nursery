const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
var sessions = require("express-session");
const session = require("express-session");
require("dotenv").config();
function handleError(err) {
  console.log(err);
}
mongoose.connect(process.env.MONGO_URL);
var conn = mongoose.connection;
conn.on("connected", function () {
  console.log("database is connected successfully");
});
conn.on("disconnected", function () {
  console.log("database is disconnected successfully");
});
conn.on("error", console.error.bind(console, "connection error:"));

var plantSchema = new mongoose.Schema({
  id: String,
  name: String,
  image: String,
  description: String,
  price: Number,
  inCart: Boolean,
  qty: Number,
});

const Plants = conn.model("plants", plantSchema);

var adminSchema = new mongoose.Schema({
  id: String,
  email: String,
  password: String,
});

var Admins = conn.model("Admins", adminSchema);

var userSchema = new mongoose.Schema({
  id: String,
  email: String,
  status: Boolean,
});

var User = conn.model("User", userSchema);

let arr = [];
Plants.find({}).exec((err, data) => {
  if (err) throw err;
  // console.log(data);
  arr = [...data];
  // res.render("index", { plants: arr, cart: cart });
});
// console.log(arr);

let admin = {};

Admins.find({}).exec((err, data) => {
  if (err) throw err;
  // console.log(data);

  admin = data;
  // console.log(admin);
});

let cart = [];
let total = 0;
const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(sessions({ secret: "hhhh", saveUninitialized: true, resave: true }));
app.use(express.static("public"));

app.get("/", function (req, res) {
  var session = req.session;
    res.render("index", { plants: arr, cart: cart });
});

app.get("/admin", function (req, res) {
  // console.log("in admin");
  res.render("sign-in", { boolean: true });
});

app.get("/cart", function (req, res) {
  res.render("cart", { plants: cart, total: total });
});
app.get("/team", function (req, res) {
  res.render("team", { cart });
});

app.get("/user-details", function (req, res) {
  res.render("user-details");
});
app.get("/order-placed", function (req, res) {
  res.render("order-placed");
});
app.get("/add-plant", function (req, res) {
  res.render("add-plant");
});

app.get("/viewPlant/:plantName", function (req, res) {
  // console.log(req.params.plantName);
  let index = arr.findIndex((item) => item.name == req.params.plantName);
  const plant = arr[index];
  // console.log(plant);
  res.render("card", { plant });
});

app.post("/", function (req, res) {
  const itemTofind = req.body.item;
  // console.log(itemTofind);
  let element = {};
  for (let i = 0; i < arr.length; i++) {
    if (arr[i].name === itemTofind) {
      //console.log("founded");
      element = arr[i];
      if (req.body.orderedQuantity != 0) {
        arr[i].inCart = true;
      } else {
        arr[i].inCart = false;
      }
      arr[i].qty = req.body.orderedQuantity;
      break;
    }
  }
  // console.log(arr);

  cart = arr.filter((el) => el.inCart);
  total = 0;
  cart.forEach((c) => {
    total += c.qty * c.price;
  });
  res.redirect("/");
});

app.post("/sign-in", function (req, res) {
  // console.log(req.body.password);
    //console.log(admin[0].email);
    //console.log(admin[0].password);
  if (
    admin[0].email === req.body.email &&
    admin[0].password === req.body.password
  ) {
    // console.log("success");
    res.render("admin-home", { plants: arr, cart: cart });
  } else {
    res.render("sign-in", { boolean: false });
  }
});

app.post("/add-plant", function (req, res) {
  // console.log(req.body.plantUrl);
  const plantToAdd = new Plants({
    // id: String,
    name: req.body.plantName,
    image: req.body.plantUrl,
    decription: req.body.plantDecription,
    price: req.body.plantPrice,
    inCart: false,
    qty: 0,
  });

  plantToAdd.save(function (err) {
    if (err) console.log(err);
    else {
      Plants.find({}).exec((err, data) => {
        if (err) throw err;
        // console.log(data);
        arr = [...data];
        res.render("admin-home", { plants: arr, cart: cart });
      });
    }
  });
});

app.post("/remove-plant", function (req, res) {
  // console.log(req.body.removePlantId);
  const removePlantId = req.body.removePlantId;
  Plants.findByIdAndDelete(removePlantId, function (err) {
    if (err) console.log(err);
    else {
      Plants.find({}).exec((err, data) => {
        if (err) throw err;
        // console.log(data);
        arr = [...data];
        res.render("admin-home", { plants: arr, cart: cart });
      });
    }
  });
});

// function mailsent(email, otp) {
//   var transporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//       user: "nursery.minor.project@gmail.com",
//       pass: "minorproject",
//     },
//   });
//   var mailOptions = {
//     from: "nursery.minor.project@gmail.com",
//     to: email,
//     subject: "Sending Email using Node.js",
//     html: `<h1>Welcome</h1><h2>OTP ${otp}</h2><h3>Thanks & Regards ,<br> E Nursery</h3>`,
//   };
//   transporter.sendMail(mailOptions, function (error, info) {
//     if (error) {
//       console.log(error);
//     } else {
//       console.log("Email sent: " + info.response);
//     }
//   });
// }

// app.get("/otplogin", (req, res) => {
//   res.render("otplogin");
// });
// app.post("/enterotp", (req, res) => {
//   var session = req.session;
//   session.otp = Math.floor(100000 + Math.random() * 900000);
//   mailsent(req.body.email, session.otp);
//   session.email = req.body.email;
//   session.loginStatus = false;
//   User.create({ email: req.body.email, status: session.loginStatus }, (err) => {
//     if (err) return handleError(err);
//   });

//   res.render("enterotp", { message: false });
// });
// app.post("/verifyotp", (req, res) => {
//   var session = req.session;
//   console.log(session, req.body);
//   if (session.otp.toString() === req.body.otp) {
//     session.loginStatus = true;
//     var update = { $push: { status: true } };
//     User.findOneAndUpdate({ email: session.email }, update, (err) => {
//       if (err) return handleError(err);
//     });
//     session.otp = "";
//     res.redirect("/");
//   } else {
//     session = req.session;
//     session.otp = Math.floor(100000 + Math.random() * 900000);
//     mailsent(session.email, session.otp);
//     session.loginStatus = false;
//     res.render("enterotp", {
//       message: "this otp is wrong, new otp is sent to your mail",
//     });
//   }
// });
app.get("/logout", (req, res) => {
  var session = req.session;
  var update = { $push: { status: false } };
  User.findOneAndUpdate({ email: session.email }, update, (err) => {
    if (err) return handleError(err);
  });
  session.loginStatus = false;
  session.email = "";
  res.redirect("/");
});

app.listen(3000, function () {
  console.log("server is running on port 3000");
});
