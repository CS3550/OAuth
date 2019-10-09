const express = require('express')
const path = require('path');
const app = express()

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')))

app.get("/login", (req, res) => {
  console.log(`tried to login with url params ${req.query.username} and ${req.query.password}`);

  if (req.query.username == "user" && req.query.password == "password") {
    res.sendFile(path.join(__dirname, 'private.html'));
  }
  else{
    res.sendFile(path.join(__dirname, 'unauthorized.html'));
  }
})

app.get("/logout", (req, res) => {
  console.log("Logout");
  res.sendFile(path.join(__dirname, 'index.html'))
})

app.listen(3000, () => console.log('Example app listening on port 3000!'))

