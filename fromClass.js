const express = require("express");
const path = require("path");
const app = express();
const axios = require("axios");
const secrets = require("./secrets.js")

let sessions = [];

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "/index.html"));
})

app.get("/githubRedirect", (req, res) => {
    //https://developer.github.com/apps/building-oauth-apps/authorizing-oauth-apps/
    res.redirect(`https://github.com/login/oauth/authorize?client_id=${secrets.client_id}&redirect_uri=http://localhost:3000/callback&state=qwertyui`)
})

app.get("/callback", (req, res)=>{
    console.log("Back from github.");

    let temp_token = res.query.code;

    axios.post("https://github.com/login/oauth/access_token",{
        client_id: secrets.client_id,
        client_secret: secrets.client_secret,
        state: "qwertyui",
        code: temp_token,
        redirect_uri: "http://localhost:3000/loggedin",

    })
});

app.use("/loggedin")



app.get("/private.html", (req, res) => {
    //We need a route guard....
    let token = req.query.session;
    if (sessions.find(i=>i.token==token)) {
        res.sendFile(path.join(__dirname, "/private.html"));
    }
    else{
        res.redirect("/unauthorized.html");
    }
})

app.get("/unauthorized.html", (req, res) => {
    res.sendFile(path.join(__dirname, "/unauthorized.html"));
})

app.get("/login", (req, res) => {

    if (req.query.username == "bobby" && req.query.password == "password123") {
        let sessionName = Math.random();
        sessions.push({
            token: sessionName,
            username: req.query.username
        });
        res.redirect(`/private.html?session=${sessionName}`);
    }
    else {
        res.redirect("/unauthorized.html");
    }
});

app.listen(3000, () => {
    console.log("listening on 3000");
})
