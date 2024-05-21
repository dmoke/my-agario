let socket;
let myId;
const players = new Map();

function preload() {
  // Write code for preloading assets
}

function setup() {
  socket = io();

  socket.emit('imReady', { name: 'Devlogerio' });

  socket.on('yourId', data => {
    myId = data.id;
  });

  socket.on('newPlayer', data => {
    const player = new Player(data.id, data.name, data.x, data.y);
    players.set(data.id, player);
  });

  socket.on('initPack', data => {
    data.initPack.forEach(initData => {
      const player = new Player(initData.id, initData.name, initData.x, initData.y);
      players.set(initData.id, player);
    });
  });

  socket.on('updatePack', data => {
    data.updatePack.forEach(updateData => {
      const player = players.get(updateData.id);
      if (player) {
        player.update(updateData);
      }
    });
  });

  socket.on('someoneLeft', data => {
    players.delete(data.id);
  });

  createCanvas(windowWidth, windowHeight);
}

function draw() {
  background(51, 51, 255);
  sendInputData();

  const myPlayer = players.get(myId);
  if (myPlayer) {
    translate(width / 2 - myPlayer.location.x, height / 2 - myPlayer.location.y);
  }

  fill(51);
  rect(0, 0, 1000, 1000);

  players.forEach(player => player.draw());
}

class Player {
  constructor(id, name, x, y) {
    this.id = id;
    this.name = name;
    this.location = createVector(x, y);
    this.angle = 0;
  }

  update(data) {
    this.location.set(data.x, data.y);
    this.angle = data.angle;
  }

  draw() {
    push();
    translate(this.location.x, this.location.y);
    rotate(this.angle);
    fill(255, 0, 0);
    circle(0, 0, 100);
    pop();
  }
}

function sendInputData() {
  const angle = atan2(mouseY - windowHeight / 2, mouseX - windowWidth / 2);
  socket.emit('inputData', {
    mouseX,
    mouseY,
    angle,
    windowWidth,
    windowHeight,
  });
}
