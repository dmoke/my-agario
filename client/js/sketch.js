var socket;
var myPlayer;
var myId;

// everything about the (loading) before the game starts
function preload() {
  // write code
}

// this is the firs thing that is called when the game is started, and it only happens once (Setup)
function setup() {
  players = [];
  myId = 0;

  socket = io();

  socket.emit("imReady", { name: "Devlogerio" });

  socket.on("yourId", function (data) {
    myId = data.id;
  });

  socket.on("newPlayer", function (data) {
    var player = new Player(data.id, data.name, data.x, data.y);
    players.push(player);
  });

  socket.on("initPack", function (data) {
    for (var i in data.initPack) {
      var player = new Player(
        data.initPack[i].id,
        data.initPack[i].name,
        data.initPack[i].x,
        data.initPack[i].y
      );
      players.push(player);
      console.log(myId);
    }
  });

  socket.on("updatePack", function (data) {
    for (var i in data.updatePack) {
      for (var j in players) {
        if (players[j].id === data.updatePack[i].id) {
          players[j].location.x = data.updatePack[i].x;
          players[j].location.y = data.updatePack[i].y;
          players[j].angle = data.updatePack[i].angle;
        }
      }
    }
  });

  socket.on("someoneLeft", function (data) {
    for (var i in players) {
      if (players[i].id === data.id) {
        players.splice(i, 1);
      }
    }
  });

  createCanvas(windowWidth, windowHeight);
}

// this is called alot of times per second (FPS, frame per second)
function draw() {
  background(51, 51, 255); // it gets a hex/rgb color
  sendInputData();

  // TODO optimize this section
  for (var i in players) {
    if (players[i].id === myId) {
      translate(
        width / 2 - players[i].location.x,
        height / 2 - players[i].location.y
      );
    }
  }

  fill(51);
  rect(0, 0, 600, 600);

  for (var i in players) {
    players[i].draw();
  }
}

// The player object constructor
var Player = function (id, name, x, y) {
  this.id = id;
  this.name = name;
  this.location = createVector(x, y);
  this.angle = 0;

  this.draw = function () {
    push();
    translate(this.location.x, this.location.y);
    rotate(this.angle);
    fill(255, 0, 0);
    beginShape();
    vertex(30 + 30, 0);
    vertex(30 + -70, 30);
    vertex(30 + -45, 0);
    vertex(30 + -70, -30);
    endShape(CLOSE);
    pop();

    // this.speedX = cos(angle) * 3; // cosine is never gonna get more than 1
    // this.speedY = sin(angle) * 3;

    // if(this.speedX > 3) {
    //     this.speedX = 3;
    // }

    // if(this.speedY > 3) {
    //     this.speedY = 3;
    // }

    // this.x += this.speedX;
    // this.y += this.speedY;
  };

  return this;
};

function sendInputData() {
  var angle = atan2(mouseY - windowHeight / 2, mouseX - windowWidth / 2);
  socket.emit("inputData", {
    mouseX,
    mouseY,
    angle,
    windowWidth,
    windowHeight,
  });
}
