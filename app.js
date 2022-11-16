require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');

const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBSession = require('connect-mongodb-session')(session);


const app = express();
const port = 3000 || process.env.PORT;


//EXPORT MODELS
const User = require("./models/userModel");
const Product = require("./models/productModel");
const Cart = require("./models/cartModel");
const Inventory = require("./models/inventoryModel");
const Wishlist = require("./models/wishlistModel");
const Order = require("./models/orderModel");

//MongoDB
const mongoUri = "mongodb://localhost:27017/dapperdropsDB";

main().catch(err => console.log(err));

async function main(){
    await mongoose.connect(mongoUri).then(function(res){
        console.log("Connected to MongoDB.")
    });
}

const store = new MongoDBSession({
    uri: mongoUri,
    collection: 'dd-sessions'
});

//FOR IMAGE DISPLAY

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
    extended:false
}));
app.use(bodyParser.json());
app.use(express.static("public"));

//Session
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    store: store
}));

//EXPORT ROUTES
const productRoute = require("./routes/Products");
app.use("/products", productRoute);

const accountRoute = require("./routes/Account");
app.use("/account", accountRoute);

const cartRoute = require("./routes/Cart");
app.use("/cart", cartRoute);

//ADMIN

const adminDashbordRoute = require("./routes/admin/Dashboard");
app.use("/admin/dashboard/", adminDashbordRoute);

const adminProductRoute = require("./routes/admin/Products");
app.use("/admin/products/", adminProductRoute);

const adminAccountRoute = require("./routes/admin/Account");
app.use("/admin/accounts/", adminAccountRoute);

const adminOrderRoute = require("./routes/admin/Order");
app.use("/admin/orders/", adminOrderRoute);

const adminInventoryRoute = require("./routes/admin/Inventory");
app.use("/admin/inventory/", adminInventoryRoute);

const adminReportRoute = require("./routes/admin/Reports");
app.use("/admin/reports/", adminReportRoute);

const adminFeedbackRoute = require("./routes/admin/Feedback");
app.use("/admin/feedback/", adminFeedbackRoute);

//INDEX
app.get("/", async function(req, res){
    const newArrivals = await Product.aggregate([]).sort({ dateCreated: -1}).limit(3);
    res.render('index', { newArrivals: newArrivals });
});

app.get("/about", function(req, res){
    res.render('about');
});

app.listen(port, function(){
    console.log("Server started on port " + port);
});