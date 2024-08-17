const express = require('express')
const fs = require('fs');
const { Server } = require("socket.io");
const https = require('https');

const app = express()
const port = process.env.PORT || 8000
const http = require('http').Server(app) 
const io = require('socket.io')(http) 


// const server = https.createServer(
//   {
//   key: fs.readFileSync('./key.pem'),
//   cert: fs.readFileSync('./cert.pem')
//   }
//   ,app
// )
//   ,  io = new Server(server, {
//     cors: {
//       origin: ["https://piehost.com",
//         "https://mariachichingon.com"
//       ]
//     }
//   })

io.on("connection", (socket) => {

  console.log("socket.io is connected")
  socket.on('message', (msg) => { 
    console.log("REceived Meesage")
    io.emit('message', msg) 
  }) 

})
// server.listen(8000)


app.use(express.static('static'))
http.listen(port)
// app.listen([port])
