//Require the modules
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
const hb = require('express-handlebars');
const spicedPg = require('spiced-pg');
const cookieSession = require('cookie-session');
const session = require('express-session');
//const Store = require('connect-redis')(session);
const bcrypt = require('bcryptjs');
const csurf = require('csurf');
const router = require('./routers/router.js');

//Set up express app
const app = express();
//Set up the view engine
//Need the engine and the set for handlebars
app.engine('handlebars', hb({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');

app.use(cookieParser());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(csurf({
    cookie: true
}));
/*/Redis session
let sessionStore = {};
if (process.env.REDIS_URL) {
    sessionStorage = {
        url: process.env.REDIS_URL
    };
} else {
    sessionStore = {
        ttl: 3600,
        host: 'localhost',
        port: 6379
    };
}
app.use(session({
    store: new Store(sessionStore),
    resave: false,
    saveUnitialized: true,
    secret: 'my super fun secret'
}));
*/
/********************** SETTING SESSION **********************/
app.use(cookieSession({
    secret: 'hard to guess', //require('./secrets').sessSecret,
    maxAge: 1000 * 60 * 60 * 24 * 14
}));


//app.use(csurf());
//Serve the the files - set public folder
app.use(express.static(path.join(__dirname, 'public')));
app.use(router);


//Create express web server
app.listen(process.env.PORT || 8080, () => {
    console.log('Server started on port 8080');
});