const { join } = require("path");
const { createServer } = require("http");
const express = require("express");
const socketIO = require("socket.io");

var client_path = join(__dirname, "../client");
var port = process.env.port || 3333;
var app = express();
var server = createServer(app);
var io = socketIO(server);
app.use(express(client_path));

server.listen(port, function () {
  console.log('Server started on http://localhost:' + port);
});

io.on('connection', function(socket) {
  console.log('New connection: ' + socket.id);
  socket.on('message', function(data) {
    console.log(data);
  });
});
