const express = require('express')
const axios = require('axios');
const path = require('path');
const app = express()
const jwt = require("./jwt_service")
const flash = require("connect-flash");
const session = require('express-session');
const cookieParser = require('cookie-parser');
const sqlite3 = require('sqlite3')

const secrets = require("./secrets.js")

//JWT from https://medium.com/@siddharthac6/json-web-token-jwt-the-right-way-of-implementing-with-node-js-65b8915d550e
//Key generator at https://www.csfieldguide.org.nz/en/interactives/rsa-key-generator/
//Using flash to send access token past a redirect: https://gist.github.com/raddeus/11061808
app.use(cookieParser(secrets.cookie_secret));
app.use(session({ cookie: { maxAge: 60000 }, resave: false, saveUninitialized: false, secret: secrets.cookie_secret }));
app.use(flash());

app.use(express.static(path.join(__dirname, "public")));

app.get("/login", (req, res) => {
  res.redirect(`https://github.com/login/oauth/authorize?client_id=${secrets.client_id}&redirect_uri=http://localhost:3000/callback&state=${secrets.state}`)
})

app.get("/logout", (req, res) => {
  console.log("Logout");
  res.redirect('index.html');
})

app.get("/callback", (req, res) => {
  console.log(`got a callback with url params ${req.query.code} and ${req.query.state}`);
  let access_token;
  axios.post("https://github.com/login/oauth/access_token", {
    client_id: secrets.client_id,
    client_secret: secrets.client_secret,
    redirect_uri: "http://localhost:3000/callback",
    state: secrets.state,
    code: req.query.code
  }, { headers: { Accept: "application/json" } })
    .then(response => {
      access_token = response.data.access_token;
      console.log("Github said " + access_token);
      return axios.get("https://api.github.com/user?access_token=" + access_token)
    })
    .then(response => {
      // SIGNING OPTIONS
      var signOptions = {
        issuer: 'CSCI 3550',
        subject: response.data.login,
        audience: 'http://localhost:3000',
        expiresIn: "12h",
        algorithm: "RS256"
      };

      let token = jwt.sign({ access_token }, signOptions);
      console.log(token);
      req.flash("Bearer", token);
      res.redirect("/private.html");
    })
    .catch(error => {
      console.log("There was an error " + error);
    })
})

app.use((req, res, next) => {
  //let bearer = req.flash('Bearer')[0];
  let bearer;
  console.log('Cookies: ', req.cookies)
 
  // Cookies that have been signed
  console.log('Signed Cookies: ', req.signedCookies)
  let flash = req.flash("Bearer");
  if(flash && flash.length > 0){
    bearer = flash[0];
  }
  else{
    bearer = req.cookies["3550_Bearer"];
    console.log("Couldn't find Bearer in flash")
  }

  console.log(bearer)

  var verifyOptions = {
    issuer: 'CSCI 3550',
    audience: 'http://localhost:3000',
    expiresIn: "12h",
    algorithm: ["RS256"]
  };

  var legit = jwt.verify(bearer, verifyOptions);
  console.log("\nJWT verification result: " + JSON.stringify(legit));
  if (legit) {
    res.cookie('3550_Bearer', bearer, { maxAge: 900000 });
    next(); //Move to the next route
  }
  else {
    res.redirect("/unauthorized.html")
  }
})

//If we get here, the user is authenticated.
app.use(express.static(path.join(__dirname, "private")));

app.use("/query", (req, res)=>{
  db.each("SELECT COUNT(logins) as count FROM LOGINS", (err, row) => {
    if (err) {
      return console.error(err.message);
    }
    console.log(row.count );
    res.send("" + row.count);
    db.run("INSERT into LOGINS(logins) VALUES(?)", "0", (err)=>{
      if(err){
        return console.error("Error creating a new row:" + err);
      }
      console.log("Added a new row");
    })
  });
})

let db = new sqlite3.Database('./db/sqlite.db', (err) => {
  if (err) return console.error("Error connecting to database: " + err.message + ". Terminating");
  console.log('Connected to the database.');
  app.listen(3000, () => console.log('Example app listening on port 3000!'))
});
