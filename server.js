var express = require('express');
var app = express();
var http = require('http');

var server = http.createServer(app).listen(process.env.PORT || 8888, process.env.IP || "0.0.0.0");

var io = require('socket.io').listen(server);
app.get('/', function (req, res) {
    res.render(__dirname + '/static/index.jade', {
        'GA_CODE': process.env.GA_CODE|| 'UA-2568035-32' // google analytics
    });
});

app.use(express.static(__dirname + '/static'));

app.use(function (req, res, next){
   res.locals.scripts = ['/js/poker.js'];
   next();
});

var rooms = [];
// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};

function findRoom(data){
    var found = false
    rooms.forEach(function(room){
        if(room.name == data.room){
            found = room;
        }
    });
    
    return found;
}
function removeRoom(room){
    rooms.forEach(function(item, i){
        if(item.name == room.name){
            rooms.remove(i);
            return true;
        }
    });
    
}

function createRoom(data){
    var room = {
        name: data.room,
        pass: data.pass,
        cards: {},
        sockets: []
    };

    room.emit = function(name, dados){
        room.sockets.forEach(function(socket){
            socket.emit(name, dados);
        });
    }
    room.remove = function(socket){
        for(var i=0; i<room.sockets.length; i++){
            if(room.sockets[i].user == socket.user){
                room.sockets.remove(i);
                
                if(!room.sockets.length){
                    removeRoom(room);
                }
                return true;
            }
        }
    }
    
    rooms.push(room);
    
    return room;
}

io.sockets.on('connection', function (socket) {
    
    socket.on('room', function(data){
        socket.user = data.user;
        var room = findRoom(data);
        
        if(!room){
            room = createRoom(data);
            room.sockets.push(socket);
            socket.room = room;
            
            socket.emit('welcome', {size: room.sockets.length});
            
        } else if(room.pass != data.pass){
            socket.emit('wrong');
            return false;
            
        } else {
            room.sockets.push(socket);
            socket.room = room;
            room.emit('user-in', {size: room.sockets.length, last: socket.user});
            
        }
        
    }).on('card', function(data){
        console.log('Carta '+data.value+' de '+socket.user)
        var room = socket.room;
        
        room.cards[ socket.user ] = data.value;
        
        var allPlayers = true;
        room.sockets.forEach(function(socket) {
            if(!(socket.user in room.cards)){
                allPlayers = false;
                return false;
            }
        });
        
        if(allPlayers){
            room.emit('finish', room.cards);
        }
    }).on('remove-card', function(){
        delete socket.room.cards[ socket.user ];
        console.log(['Carta removida', socket.room.cards]);
        
    }).on('disconnect', function(){
        try{
            var user = socket.user;
            var room = socket.room;
            delete room.cards[user];
            
            room.remove(socket);
            room.emit('user-out', {size: room.sockets.length, last: user});
            
        }catch(e){
            console.log('Falha ao remover usuário desconectado');
            console.error(e);
        }
        
    });
    
});