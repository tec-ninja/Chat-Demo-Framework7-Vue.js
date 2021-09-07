var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var moment = require('moment');
var favicon = require('serve-favicon');

app.set('port', (process.env.PORT || 3000));
app.use(favicon(__dirname + '/public/icons/favicon.png'));
app.use('/npm', express.static('node_modules'));
app.use(express.static('build'));

app.get('/', function(request, response) {
    response.sendFile(__dirname + '/build/index.html');
});

server.listen(app.get('port'), function() {
  console.log('Node app is running on port ', app.get('port'));
});

var messages = [];
var users = [];

io.on('connection', function(socket) {

    //users.push(socket.id);

    socket.emit('init-chat', messages);
    socket.emit('update-users', users);

    socket.on('send-msg', function(data) {
        var newMessages = data.map(item => {
            item.timestamp = moment().format('dddd, MMMM D, HH:mm');
            return item;
        });
        console.log('data', data);
        messages.push(...newMessages);
        socket.broadcast.emit('read-msg', newMessages);
    });

    socket.on('add-user', function(user){
        users.push({ id: socket.id, name: user });
        socket.emit('update-users', users);
    });

    socket.on('disconnect', function() {
        users = users.filter(function(user){
            return user.id != socket.id;
        });
        socket.emit('update-users', users);
    });
});