const express = require('express')
const fs = require('fs');
const { Server } = require("socket.io");
const https = require('https');

const app = express()
const port = process.env.PORT || 3000


const server = https.createServer(
  {
  key: fs.readFileSync('./key.pem'),
  cert: fs.readFileSync('./cert.pem')
  }
  ,app
)
  ,  io = new Server(server, {origins: '*:*'})

io.on("connection", (socket) => {

  console.log("socket.io is connected")
})
app.use(express.static('static'))

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`)
})