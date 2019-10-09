const express = require('express')
const axios = require('axios');
const path = require('path');
const app = express()

const secrets = require("./secrets.js")


app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')))

app.get("/login", (req, res) => {
 res.redirect(`https://github.com/login/oauth/authorize?client_id=${secrets.client_id}&redirect_uri=http://localhost:3000/callback&state=${secrets.state}`)
})

app.get("/callback", (req, res)=>{
  console.log(`got a callback with url params ${req.query.code} and ${req.query.state}`);
  axios.post("https://github.com/login/oauth/access_token",{
    client_id: secrets.client_id,
    client_secret: secrets.client_secret,
    redirect_uri: "http://localhost:3000/callback",
    state:secrets.state,
    code: req.query.code
  },{headers:{Accept:"application/json"}})
  .then(response=>{
    let o = response.data.access_token;
    console.log("Github said " + o);
    return axios.get("https://api.github.com/user?access_token=" + o)
  })
  .then(response=>{
    res.send(response.data);
  })
  .catch(error=>{
    console.log("There was an error " + error);
  })

  

})

app.get("/logout", (req, res) => {
  console.log("Logout");
  res.sendFile(path.join(__dirname, 'index.html'))
})

app.listen(3000, () => console.log('Example app listening on port 3000!'))
