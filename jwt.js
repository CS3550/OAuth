const express = require('express')
const axios = require('axios');
const path = require('path');
const fs = require("fs");
const app = express()
const jwt = require("./jwt_service")
const flash = require("connect-flash");
var session = require('express-session');
var cookieParser = require('cookie-parser');




const secrets = require("./secrets.js")

//JWT from https://medium.com/@siddharthac6/json-web-token-jwt-the-right-way-of-implementing-with-node-js-65b8915d550e
//Key generator at https://www.csfieldguide.org.nz/en/interactives/rsa-key-generator/
//Using flash to send access token past a redirect: https://gist.github.com/raddeus/11061808
app.use(cookieParser(secrets.cookie_secret));
app.use(session({ cookie: { maxAge: 60000 }, resave: false, saveUninitialized: false, secret: secrets.cookie_secret }));
app.use(flash());



app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')))

app.get("/login", (req, res) => {
  res.redirect(`https://github.com/login/oauth/authorize?client_id=${secrets.client_id}&redirect_uri=http://localhost:3000/callback&state=${secrets.state}`)
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
      var i = 'CSCI 3550';          // Issuer 
      var s = response.data.login;                    // Subject 
      var a = 'http://localhost:3000'; // Audience
      // SIGNING OPTIONS
      var signOptions = {
        issuer: i,
        subject: s,
        audience: a,
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

  app.get("/private.html", (req, res) => {
    let bearer = req.flash('Bearer')[0];
    console.log(bearer)

    var i = 'CSCI 3550';          // Issuer 
    var a = 'http://localhost:3000'; // Audience

    var verifyOptions = {
      issuer: i,
      audience: a,
      expiresIn: "12h",
      algorithm: ["RS256"]
    };

    var legit = jwt.verify(bearer, verifyOptions);
    console.log("\nJWT verification result: " + JSON.stringify(legit));
    if (legit) {

      res.cookie('3550_Bearer', bearer, { maxAge: 900000 });

      res.sendFile(path.join(__dirname + "/private.html"));
    }
    else{
      res.redirect("/unauthorized.html")
    }
  });

  app.use("/unauthorized.html", (req, res)=>{
    res.sendFile(path.join(__dirname + "/unauthorized.html"));
  })




})

app.get("/logout", (req, res) => {
  console.log("Logout");
  res.sendFile(path.join(__dirname, 'index.html'))
})

app.listen(3000, () => console.log('Example app listening on port 3000!'))
