
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
    this.player_status = null;
}

// youtube player state constants
const UNSTARTED = "unstarted";
const ENDED = "ended";
const PLAYING ="playing";
const PAUSED = "paused";
const BUFFERING = "buffering";


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
    //var url = 'http://www.mystartupapp1993-env.elasticbeanstalk.com/?video=' + req.body.videoUrlId + '&lobby_id=' + lobby_id;
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

app.post('/api/get-participants', function(req, res) {
    var lobby_participants = [];
    console.log("inside get-participants");
    for (var lobby in participants) {
        var obj = participants[lobby];
        for (var participant in participants[lobby]) {
            if (obj[participant].lobby_id == req.body.lobby_id) {
                lobby_participants.push(obj[participant]);
            }
        }
    }

    // send them out
    for (var person in lobby_participants) {
        listener.sockets.connected[lobby_participants[person].socket_id].emit('participants', {'participants' : lobby_participants});
    }
    
});
function register_socket(participant_id, socket_id, lobby_id) {
    var p = new participant();
    p.participant_id = participant_id;
    p.socket_id = socket_id;
    p.lobby_id = lobby_id
    p.player_status = BUFFERING;
    if (participants[lobby_id] == null) {
        participants[lobby_id] = [];
        participants[lobby_id].push(p);
    }
    else {
        participants[lobby_id].push(p);
    }

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
    socket.emit('socket_id', {'socket_id': socket.id});

    socket.on('update_player_status', function(data){
        console.log('\n\n inside update player status');
        console.log('player status = ' + data.player_status);
        var socket_id = data.socket_id;
        var player_status = data.player_status;
        var lobby_id = data.lobby_id;
        var changed = false;

        for (var lobby in participants) {
            var obj = participants[lobby];
            for (var participant in participants[lobby]) {
                if (obj[participant].socket_id == socket_id && obj[participant].player_status != player_status) {
                    console.log('found this socket, updating status');
                    obj[participant].player_status = player_status;
                    changed = true;
                    break;
                }
            }
        }

        if (!changed) {
        // send out new participant data
            for (var lobby in participants) {
                var obj = participants[lobby];
                for (var participant in participants[lobby]) {
                    if (obj[participant].lobby_id == lobby_id) {
                        listener.sockets.connected[obj[participant].socket_id].emit('participant_status_update', {'participants': participants[lobby]});
                    }
                }
            }
        }
    });

    socket.on('play_video', function(data){
        var lobby_id = data.lobby_id;
        console.log("inside play-video");
        for (var lobby in participants) {
            var obj = participants[lobby];
            for (var participant in participants[lobby]) {
                if (obj[participant].lobby_id == lobby_id) {
                    obj[participant].player_status = PLAYING;
                    listener.sockets.connected[obj[participant].socket_id].emit('playVideo', {'message': 'IT FUCKING WORKS'});
                }
            }
        }

        // do this in separate loop so that pausing/playing happens as in-sync as possible.
        for (var lobby in participants) {
            var obj = participants[lobby];
            for (var participant in participants[lobby]) {
                if (obj[participant].lobby_id == lobby_id) {
                    console.log("found a participant in this lobby");
                    listener.sockets.connected[obj[participant].socket_id].emit('participant_status_update', {'participants': participants[lobby]});
                }
            }
        }
        console.log("end of play-video");

    });

    socket.on('pause_video', function(data){
        var lobby_id = data.lobby_id;
        console.log("inside pause-video");
        for (var lobby in participants) {
            var obj = participants[lobby];
            for (var participant in participants[lobby]) {
                if (obj[participant].lobby_id == lobby_id) {
                    obj[participant].player_status = PAUSED;
                    listener.sockets.connected[obj[participant].socket_id].emit('pauseVideo', {'message': 'IT FUCKING WORKS'});
                }
            }
        }


        // do this in separate loop so that pausing/playing happens as in-sync as possible.
        for (var lobby in participants) {
            var obj = participants[lobby];
            for (var participant in participants[lobby]) {
                if (obj[participant].lobby_id == lobby_id) {
                    console.log("found a participant in this lobby");
                    listener.sockets.connected[obj[participant].socket_id].emit('participant_status_update', {'participants': participants[lobby]});
                }
            }
        }
        console.log("end of pause-video");

    });

    socket.on('get_participant_id', function(data){
        var id = {'participant_id' : i};
        register_socket(i, data.socket_id, data.lobby_id);
        i += 1;
        socket.emit('get_participant_id', id);
    });

});
