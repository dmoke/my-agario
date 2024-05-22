let socket;
let myId;
const players = new Map();
const skinsPath = 'assets/skins';
let skin; 
const START_MASS = 100;
function preload() {
}

function setup() {
  socket = io();

  socket.emit('imReady', { name: 'test' });

  socket.on('yourId', data => {
    myId = data.id;
  });

  socket.on('newPlayer', data => {
    const player = new Player(data.id, data.name, data.x, data.y, data.skinId, START_MASS);
    players.set(data.id, player);
  });

  socket.on('initPack', data => {
    data.initPack.forEach(initData => {
      const player = new Player(initData.id, initData.name, initData.x, initData.y, initData.skinId, START_MASS);
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
  constructor(id, name, x, y, skinId, mass) {
    this.id = id;
    this.name = name;
    this.location = createVector(x, y);
    this.angle = 0;
    this.skinId = skinId;
    this.mass = mass;
    this.skin = loadImage(`${skinsPath}/${this.skinId}.png`);
  }

  update(data) {
    this.location.set(data.x, data.y);
    this.angle = data.angle;
  }

  draw() {
    push();
    translate(this.location.x, this.location.y);

    if (this.skin) {
      // Draw the image within a circle without rotation
      imageMode(CENTER);
      this.drawCircularImage(this.skin, 100);
    } else {
      // If skin is not loaded, fill a circle instead
      fill(255);
      ellipse(0, 0, 100, 100);
    }

    // Draw the rotating border or indicator
    rotate(this.angle);
    noFill();
    stroke(255, 0, 0);
    strokeWeight(2);
    circle(0, 0, 100);

    pop();
    translate(this.location.x, this.location.y); // Adjust position above the circle
    textAlign(CENTER, CENTER);
    textSize(30);
    fill(255);
    stroke(0);
    strokeWeight(1);
    text(this.name, 0, 0);
    textSize(20);
    text(this.mass, 0, +20);
    push();

  }

  drawCircularImage(img, diameter) {
    const radius = diameter / 2;
    const x = -radius;
    const y = -radius;

    // Create a mask using p5.js graphics
    const mask = createGraphics(diameter, diameter);
    mask.ellipse(radius, radius, diameter, diameter);

    // Resize the image to fit the diameter
    const resizedImg = createImage(diameter, diameter);
    resizedImg.copy(img, 0, 0, img.width, img.height, 0, 0, diameter, diameter);
    resizedImg.mask(mask);

    // Draw the masked, resized image
    image(resizedImg, 0, 0);

    this.skinLoaded = true; // Set skinLoaded to true once the skin is drawn
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
