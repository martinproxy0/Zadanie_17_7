
const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const config = require('./config');

const app = express();
const fs = require('fs');
let googleProfile = {};
let stringifyFile;

app.use(bodyParser.json());
app.use(passport.initialize());
app.use(passport.session());

// Pug views
app.set('view engine', 'pug');
app.set('views','./views');

// Passport setup
passport.serializeUser(function(user, done) {
    done(null, user);
});
passport.deserializeUser(function(obj, done) {
    done(null, obj);
});

passport.use(new GoogleStrategy({
        clientID: config.GOOGLE_CLIENT_ID,
        clientSecret:config.GOOGLE_CLIENT_SECRET,
        callbackURL: config.CALLBACK_URL
    },
    function(accessToken, refreshToken, profile, cb) {
        googleProfile = {
            id: profile.id,
            displayName: profile.displayName
        };
        addNewUser(googleProfile);
        cb(null, profile);
    }
));

// App
app.get('/', function(req, res) {
    res.render('home',{ user: req.user });
});

app.get('/logged', function(req, res){
    res.render('logged', { user: googleProfile });
});

//Passport routes
app.get('/auth/google',
passport.authenticate('google', {
    scope : ['profile', 'email']
    })
);
app.get('/auth/google/callback',
    passport.authenticate('google', {
        successRedirect : '/logged',
        failureRedirect: '/'
    })
);

app.get('/getUserList', function(req, res) {   
    fs.readFile('./users.json', 'utf8',function (err, data) {
        if (err) throw err;
        stringifyFile = data;
        res.render('usersList', {stringifyFile});
    });
});

function addNewUser(newUser) {
    fs.readFile('./users.json', 'utf8',function (err, data) {
        if (err) throw err;        
        let obj = [];
        let id = new Date().getTime().toString(); 
        let counter = 1;
        let item = '';
        obj = JSON.parse(data);
        for (let x in obj.users) {
            counter += 1;
        };
        item = 'user_' + counter;
        obj.users[item] = {
            "rec_id": id,        
            "profile_id": newUser.id,
            "displayName": newUser.displayName
        };
        stringifyFile = JSON.stringify(obj); 
        fs.writeFile('./users.json', stringifyFile, function(err) {
            if (err) throw err;
        });
    });
};

var server = app.listen(3000, 'localhost', function() {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Przykładowa aplikacja nasłuchuje na http://' + host + ':' + port);
});

app.use(function (req, res, next) {
    res.status(404).send('Wybacz, nie mogliśmy odnaleźć tego, czego żądasz!')
});