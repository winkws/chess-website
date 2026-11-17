const express = require('express');
const path = require('path');
const app = express();
const cors = require('cors');
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

const dbService = require('./dbService');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended : false }));
app.use(express.static('client/public'));

class Room{
  constructor(id,FEN,player1,player2,IDs){
    this.id = id,
    this.FEN = FEN,
    this.moveHistory = [],
    this.player1 = player1,
    this.player2 = player2,
    this.turn = "white",
    this.IDs = IDs
  }
}

class Client{
  constructor(sessionid,username){
    this.sessionid = sessionid,
    this.username = username
  }
}

let clients = [];
const ongoingGames = [];

//is triggered when a client connects
io.on('connection', (socket) => {
  //gets the username of the client and puts the client to the list of clients
  const username = socket.handshake.headers.cookie.split("Username=")[1].split(";")[0];
  clients.push(new Client(socket.id, username));

  //is triggered when a client wants to send a request to another client
  socket.on('sendRequest', (request) => {
    //gets the client that will receive the request
    const receiver = clients.find(({username}) => username == request.receiver);

    //makes sure the client isnt offline and sends the request
    if(receiver != undefined){
      io.to(receiver.sessionid).emit('request', request)
    }
  });

  //is triggered when a client accepts a request
  socket.on('createRoom',(request) => {
    //gets both of the players in the game
    const player1 = clients.find(({username}) => username == request.player1);
    const player2 = clients.find(({username}) => username == request.player2);

    //generates a room id that isnt being used yet
    var validID = false;
    var roomID = Math.floor(Math.random() * 99999) + 1;
    while(!validID){
      if((ongoingGames.find(({id}) => id == roomID)) == undefined){
        validID = true;
      }      
      else{
        roomID = Math.floor(Math.random() * 99999) + 1;
      }
    }

    //creates a new room
    ongoingGames.push(new Room(roomID,"rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR",player1,player2,range(1,32)));
    const room = ongoingGames.find(({id}) => id == roomID);

    //makes sure both of the players are online and puts them in a room
    if(player1 != undefined && player2 != undefined){
      io.to(player1.sessionid).emit('joinRoom', room);
      io.to(player2.sessionid).emit('joinRoom', room);
    }
  });

  //is triggered when a move has been made in a game
  socket.on('move', data => {
    //finds the room where the move has been made
    const room = ongoingGames.find(({id}) => id == data.ID);

    //gets the move and stores it
    room.moveHistory.push(data.move); 

    //updates the IDs
    room.IDs = data.IDs;

    //updates the information on whos turn it is
    room.turn = room.turn == "white" ? room.turn = "black" : room.turn = "white";

    //gets the FEN of the room and sends it to the other player/spectators
    room.FEN = data.FEN;
    socket.to(data.ID).emit('move',{FEN:data.FEN,IDs:data.IDs});
  });

  //is triggered when a player joins a game
  socket.on('joinGame', Username => {
    //gets the client that joined the game and the room want to join
    const user = clients.find(({username}) => username == Username);
    const roomid = socket.handshake.headers.referer.split("/room/")[1];
    const room = ongoingGames.find(({id}) => id == roomid);

    //sends the necessary info to the client and adds them to the room
    io.to(user.sessionid).emit('getInfo',room);
    socket.join(room.id);
  });
  
  //sends the user the move history if they request it
  socket.on('requestMoveHistory', Username => {
    const user = clients.find(({username}) => username == Username);
    const roomid = socket.handshake.headers.referer.split("/room/")[1];
    const room = ongoingGames.find(({id}) => id == roomid);
    io.to(user.sessionid).emit('receiveMoveHistory',room.moveHistory);
  });

  //is triggered when a client disconnects
  socket.on('disconnect', reason => {
    //removes disconnected client from clients list
    clients = clients.filter(client => client.sessionid != socket.id);
  });
});

app.post('/getAllUsers', (request, response) => {
  const db = dbService.getDbServiceInstance();
  const result = db.getAllUsers();

  result
  .then(data => response.send(data))
  .catch(err => console.log(err));
});

app.post('/registerUser', (request, response) => {
  const username = request.body.username; 
  const email = request.body.email; 
  const password = request.body.password;
  
  const db = dbService.getDbServiceInstance();
  const result = db.registerUser(username,email,password)
  
  result
  .then(data => response.send(data))
  .catch(err => console.log(err));
});

app.post('/login', (request, response) => {
  const email = request.body.email;
  const password = request.body.password;
  
  const db = dbService.getDbServiceInstance();
  const result = db.verifyLogin(email,password);

  result
  .then(data => response.send(data))
  .catch(err => console.log(err));
});

app.post('/getUsername', (request, response) => {
  const email = request.body.email;
  const password = request.body.password;
  
  const db = dbService.getDbServiceInstance();
  const result = db.getUsername(email,password)
  
  result
  .then(data => response.send(data))
  .catch(err => console.log(err));
});

app.get('/profile/:username', (request, response) => {
  response.sendFile(path.join(__dirname ,'..' ,'client', 'public', 'profile', 'index.html'));
  response.cookie('viewingProfile', request.params.username)
});

app.get('/room/:roomid', (request, response) => {
  response.sendFile(path.join(__dirname ,'..' ,'client', 'public', 'room', 'index.html'));
});

var port = process.env.PORT || 3000;

server.listen(port, () => {
  console.log('App listening on port ' + port);
});

function range(start, end, step, offset) {
  var len = (Math.abs(end - start) + ((offset || 0) * 2)) / (step || 1) + 1;
  var direction = start < end ? 1 : -1;
  var startingPoint = start - (direction * (offset || 0));
  var stepSize = direction * (step || 1);

  return Array(len).fill(0).map(function(_, index) {
    return startingPoint + (stepSize * index);
  });
}