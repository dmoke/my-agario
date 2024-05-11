var path = require("path");
var http = require("http");
const favicon = require('serve-favicon');
var express = require("express");
var socketIO = require("socket.io");
var Victor = require("victor");

var publicPath = path.join(__dirname, "../client");
var port = process.env.PORT || 3333;
var app = express();
var server = http.createServer(app);
var io = socketIO(server);
app.use(express.static(publicPath));
app.use(favicon(path.join(__dirname, '../favicon.ico')));
var players = [];

server.listen(port, function () {
  console.log("Server successfully runned on port http://localhost:" + port); // this will log something to the therminal
});

io.on("connection", function (socket) {
  console.log("someone conencted, Id: " + socket.id);
  var player = {};

  socket.on("imReady", (data) => {
    player = new Player(
      socket.id,
      data.name,
      Math.random() * 500,
      Math.random() * 500
    );
    players.push(player);

    socket.emit("yourId", { id: player.id });
    socket.broadcast.emit("newPlayer", player.getInitPack());

    socket.emit("initPack", { initPack: getAllPlayersInitPack() });
  });

  socket.on("inputData", (data) => {
    player.mouseX = data.mouseX;
    player.mouseY = data.mouseY;
    player.angle = data.angle;
    player.windowWidth = data.windowWidth;
    player.windowHeight = data.windowHeight;
  });

  socket.on("disconnect", () => {
    io.emit("someoneLeft", { id: socket.id });

    players = players.filter((element) => element.id !== socket.id);
  });
});

// The player object constructor
class Player {
  constructor(id, name, x, y) {
    this.id = id;
    this.name = name;
    this.location = new Victor(x, y);
    this.force = new Victor(0, 0);
    this.acceleration = new Victor(0, 0);
    this.speed = new Victor(0, 0);
    this.mouseMaxForce = 0.3;
    this.maxAcceleration = 3;
    this.maxSpeed = 3;
    this.mass = 1;
    this.mouseX = 0;
    this.mouseY = 0;
    this.angle = 0;
    this.windowWidth = 0;
    this.windowHeight = 0;

    this.update = function () {
      this.addForce(this.getForceTwardMouseLocation());
      this.accelerate();
      this.speedUp();
      this.move();
      this.zeroOutAcceleration();
    };

    this.getForceTwardMouseLocation = function () {
      var force = new Victor(
        this.mouseX - this.windowWidth / 2,
        this.mouseY - this.windowHeight / 2
      );
      force = limitVector(force, this.mouseMaxForce);
      return force;
    };

    // amountOfForce is a vector
    this.addForce = function (amountOfForce) {
      var force = amountOfForce;
      this.force = force.divide(new Victor(this.mass, this.mass));
    };

    this.accelerate = function () {
      this.acceleration.add(this.force);
      this.acceleration = limitVector(this.acceleration, this.maxAcceleration);
    };

    this.speedUp = function () {
      this.speed.add(this.acceleration);
      this.speed = limitVector(this.speed, this.maxSpeed);
    };

    this.move = function () {
      this.location.add(this.speed);
    };

    this.zeroOutAcceleration = function () {
      this.acceleration = new Victor(0, 0);
    };

    this.getInitPack = function () {
      return {
        id: this.id,
        name: this.name,
        x: this.location.x,
        y: this.location.y,
      };
    };

    this.getUpdatePack = function () {
      return {
        id: this.id,
        x: this.location.x,
        y: this.location.y,
        angle: this.angle,
      };
    };

    return this;
  }
}

function limitVector(v, max) {
  var vec = v.clone();

  var mSq = vec.lengthSq();
  if (mSq > max * max) {
    vec = vec
      .divide(new Victor(Math.sqrt(mSq), Math.sqrt(mSq)))
      .multiply(new Victor(max, max));
  }

  return vec;
}

function getAllPlayersInitPack() {
  var initPack = [];
  for (var i in players) {
    initPack.push(players[i].getInitPack());
  }
  return initPack;
}

setInterval(() => {
  var updatePack = [];

  for (var i in players) {
    players[i].update();
    updatePack.push(players[i].getUpdatePack());
  }

  io.emit("updatePack", { updatePack });
}, 1000 / 60);
