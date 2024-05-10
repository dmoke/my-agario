var socket;

//before game starts
function preload(){

}
//game starts (once)
function setup(){   
    socket = io();
    socket.emit('message', 'HI');
}


//loop
function draw(){
    
}