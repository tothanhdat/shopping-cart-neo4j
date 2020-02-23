let express = require('express');
let app = express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

app.use(bodyParser.urlencoded());
app.use(bodyParser.json());
app.use(express.static('./public'));
app.set('view engine', 'ejs');
app.set('views', './views');
app.use(cookieParser());

const PRODUCT_ROUTER  = require('./routes/product');
const CATEGORY_ROUTER = require('./routes/category');
const CUSTOMER_ROUTER = require('./routes/customer');
const ORDER_ROUTER    = require('./routes/order');
const ADMIN_ROUTER    = require('./routes/admin');
//model
const PRODUCT_MODEL = require('./models/product');
// Setup server port
var port = process.env.PORT || 3000;
//connect to neo4j db
const neo4j = require('neo4j-driver');
var uri = 'https://hobby-aaoahnggdnbngbkenbccnmdl.dbs.graphenedb.com:24780/db/data/';
//const driver = neo4j.driver(uri, neo4j.auth.basic('neo4j', 'b.NEiI7q3qlyim.QGCH21YwvGOxbGQT'));
const driver = neo4j.driver('bolt://localhost', neo4j.auth.basic('Dat', '123456'));
var session = driver.session();
const expressSession       = require('express-session');
app.use(expressSession({
  secret: 'shopCaffe',
  saveUninitialized: true,
  resave: true,
  cookie: {
      maxAge: 10 * 60 * 1000
  }
}))

//connect 
  app.listen(port, function () {
    console.log('working in ' + port);
  })

app.use('/products', PRODUCT_ROUTER);
app.use('/categorys', CATEGORY_ROUTER);
app.use('/customers', CUSTOMER_ROUTER);
app.use('/orders', ORDER_ROUTER);
app.use('/admins', ADMIN_ROUTER);

//=========================API ADMIN=======================================
app.get('/', function (req, res) {
    return res.redirect('/customers')
});

app.get('/login', function (req, res) {
    return res.render('pages/login')
 });

app.get('/limit', async (req, res)=> {
    let listProduct = await PRODUCT_MODEL.findLimitSkip(10, 0);
    return res.json(listProduct)
});
 
app.get('/admin', function (req, res) {
    res.render('dashboard/pages/login');
});

