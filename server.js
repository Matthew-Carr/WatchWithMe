
var express = require('express');
var bodyParser = require('body-parser');
var routes = require('./routes');
var path = require('path');
console.log("Testing node");

var app = express();

app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));


var lobby_id = 1;
var i = 1;
var lobbies = [];

var ready = [];
var clients = {};
var participants = [];

var participant = function() {
    this.socket_id = null;
    this.participant_id = null;
    this.ready = false;
    this.lobby_id = null;
}

//app.use(express.static('../frontend/pages'));
app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());


app.get('/', function(req, res) {
    return res.sendfile('index.html', {root: "./public/templates"});
});


app.post('/api/get-lobby-url', function(req, res, next) {
    //var url = 'www.mystartupapp1993-env.elasticbeanstalk.com/?video=' + req.body.videoUrlId + '&lobby_id=' + lobby_id;
    var url = 'localhost:8081/?video=' + req.body.videoUrlId + '&lobby_id=' + lobby_id;
    //lobby.push(lobby_id);
    lobby_id += 1;
    var data = url;
    res.send(data);
});


app.post('/api/get-participant-id', function(req, res, next) {
    var data = {'participant_id' : i};
    register_socket(i, req.body.socket_id, req.body.lobby_id);
    i += 1;
    res.send(data);
});

/*app.post('/api/reset-ready-states', function(req, res, next) {
    ready = [];
    lobby = [];
});*/

/*app.post('/api/ready-up', function(req, res) {
    console.log("length is " + clients.length);
    var ready_to_start = false;
    console.log(req.body.participant_id + " is ready to start");
    if (!(req.body.participant_id in ready)) {
        ready.push(req.body.participant_id);
    }
    //if (ready.length == lobby[req.body.lobby_id].length) {
    if (ready.length == lobby.length) {
        console.log("This is when we should start the video ");
        for (client in clients) {
            listener.sockets.connected[clients[client]].emit('playVideo', {'message': 'IT FUCKING WORKS'});
        }
    }
});*/

app.post('/api/start-video', function(req, res) {
    console.log("inside start-video");
    for (var lobby in participants) {
        console.log(" lobby " + participants[lobby]);
        var obj = participants[lobby];
        for (var participant in participants[lobby]) {
            console.log("comparing " + obj[participant].lobby_id + " to " + req.body.lobby_id);
            if (obj[participant].lobby_id == req.body.lobby_id) {
                console.log("found a participant, playing video");
                listener.sockets.connected[obj[participant].socket_id].emit('playVideo', {'message': 'IT FUCKING WORKS'});
            }
        }
    }
});

app.post('/api/pause-video', function(req, res) {
    console.log("inside pause-video");
    for (var lobby in participants) {
        console.log(" lobby " + participants[lobby]);
        var obj = participants[lobby];
        for (var participant in participants[lobby]) {
            console.log("comparing " + obj[participant].lobby_id + " to " + req.body.lobby_id);
            if (obj[participant].lobby_id == req.body.lobby_id) {
                console.log("found a participant, pause video");
                listener.sockets.connected[obj[participant].socket_id].emit('pauseVideo', {'message': 'IT FUCKING WORKS'});
            }
        }
    }
});

function register_socket(participant_id, socket_id, lobby_id) {
    var p = new participant();
    p.participant_id = participant_id;
    p.socket_id = socket_id;
    p.lobby_id = lobby_id
    if (participants[lobby_id] == null) {
        participants[lobby_id] = [];
        participants[lobby_id].push(p);
    }
    else {
        participants[lobby_id].push(p);
    }

    console.log(participants[lobby_id]);

    //clients[participant_id] = socket_id;
    console.log("socket was registered, length is " + Object.keys(participants).length + " lobby id is " + lobby_id);
}

var server = app.listen(8081, function() {
    var host = server.address().address;
    var port = server.address().port;

    console.log('The thunderdome awaits...\n');
});

var io = require('socket.io');

var listener = io.listen(server);

listener.sockets.on('connection', function(socket){
    console.log("a user has connected");
    //clients.push(socket.id);
    socket.emit('socket_id', {'socket_id': socket.id});
});

listener.sockets.on('client_is_ready', function(socket){
    console.log("starting the video");
    socket.emit('playVideo', {'message': 'IT FUCKING WORKS'});
});

