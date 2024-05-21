//server.js
const path = require('path');
const fs = require('fs');
const http = require('http');
const favicon = require('serve-favicon');
const express = require('express');
const socketIO = require('socket.io');
const Victor = require('victor');

const publicPath = path.join(__dirname, '../client');
const assetsPath = path.join(__dirname, '../assets');
const skinsPath = path.join(__dirname, '../assets/skins');

const port = process.env.PORT || 3333;
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static(publicPath)); // Serve client-side files
app.use('/assets', express.static(assetsPath)); 
app.use(favicon(path.join(__dirname, '../favicon.ico')));

let players = new Map();
const FPS = 166;

server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);
  let player = null;

  socket.on('imReady', (data) => {
    player = new Player(socket.id, data.name, Math.random() * 500, Math.random() * 500);
    players.set(socket.id, player);

    socket.emit('yourId', { id: player.id });
    socket.broadcast.emit('newPlayer', player.getInitPack());

    socket.emit('initPack', { initPack: getAllPlayersInitPack() });
  });

  socket.on('inputData', (data) => {
    if (player) {
      player.updateInput(data);
    }
  });

  socket.on('disconnect', () => {
    io.emit('someoneLeft', { id: socket.id });
    players.delete(socket.id);
    console.log(`Player disconnected: ${socket.id}`);
  });
});

class Player {
  constructor(id, name, x, y) {
    this.id = id;
    this.name = name;
    this.location = new Victor(x, y);
    this.force = new Victor(0, 0);
    this.acceleration = new Victor(0, 0);
    this.speed = new Victor(0, 0);
    this.mouseMaxForce = 0.3;
    this.maxAcceleration = 2;
    this.maxSpeed = 2;
    this.mass = 2;
    this.mouseX = 0;
    this.mouseY = 0;
    this.angle = 0;
    this.windowWidth = 0;
    this.windowHeight = 0;
    this.skinId = Math.floor(Math.random() * fs.readdirSync(skinsPath).length) + 1;
  }

  updateInput(data) {
    this.mouseX = data.mouseX;
    this.mouseY = data.mouseY;
    this.angle = data.angle;
    this.windowWidth = data.windowWidth;
    this.windowHeight = data.windowHeight;
  }

  update() {
    this.addForce(this.getForceTowardMouse());
    this.accelerate();
    this.speedUp();
    this.move();
    this.resetAcceleration();
  }

  getForceTowardMouse() {
    const force = new Victor(this.mouseX - this.windowWidth / 2, this.mouseY - this.windowHeight / 2);
    return limitVector(force, this.mouseMaxForce);
  }

  addForce(force) {
    this.force = force.divideScalar(this.mass);
  }

  accelerate() {
    this.acceleration.add(this.force);
    this.acceleration = limitVector(this.acceleration, this.maxAcceleration);
  }

  speedUp() {
    this.speed.add(this.acceleration);
    this.speed = limitVector(this.speed, this.maxSpeed);
  }

  move() {
    this.location.add(this.speed);
  }

  resetAcceleration() {
    this.acceleration.zero();
  }

  getInitPack() {
    return {
      id: this.id,
      name: this.name,
      x: this.location.x,
      y: this.location.y,
      skinId: this.skinId,
    };
  }

  getUpdatePack() {
    return {
      id: this.id,
      x: this.location.x,
      y: this.location.y,
      angle: this.angle,
    };
  }
}

function limitVector(v, max) {
  if (v.lengthSq() > max * max) {
    v.normalize().multiplyScalar(max);
  }
  return v;
}

function getAllPlayersInitPack() {
  return Array.from(players.values()).map(player => player.getInitPack());
}

setInterval(() => {
  const updatePack = Array.from(players.values()).map(player => {
    player.update();
    return player.getUpdatePack();
  });
  io.emit('updatePack', { updatePack });
}, 1000 / FPS);
