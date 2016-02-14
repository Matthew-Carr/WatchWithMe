
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
var lobby = [];

var ready = [];

var participant_map = {};

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
    var data = {'url' : url};
    res.send(data);
});


app.post('/api/get-participant-id', function(req, res, next) {
/*    for (var lobby_id in lobby) {
        if (!lobby.hasOwnProperty(lobby_id)) {continue;}
        var user = lobby[lobby_id];
        console.log(user + ' has participant id of ' + i);
        i = i + 1;
    }
*/
    var data = {'participant_id' : i};
    /*if (!lobby[req.body.lobby_id]) {
        lobby[req.body.lobby_id] = [i];
    }
    else {
        lobby[req.body.lobby_id].push(i);
    }*/
    lobby.push(i);
    i += 1;
    res.send(data);
});

app.post('/api/reset-ready-states', function(req, res, next) {
    ready = [];
    lobby = [];
});

app.post('/api/ready-up', function(req, res) {
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
});

var server = app.listen(8081, function() {
    var host = server.address().address;
    var port = server.address().port;

    console.log('The thunderdome awaits...\n');
});

var io = require('socket.io');

var listener = io.listen(server);
var clients = [];
listener.sockets.on('connection', function(socket){
    console.log("a user has connected");
    clients.push(socket.id);
    socket.emit('message', {'message': 'IT FUCKING WORKS'});
});

listener.sockets.on('client_is_ready', function(socket){
    console.log("starting the video");
    socket.emit('playVideo', {'message': 'IT FUCKING WORKS'});
});

