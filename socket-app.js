const express = require('express');
const app = express();
const server = require('http').Server(app);

// a 'good-to-know':
// https://stackoverflow.com/questions/25532692/how-to-share-sessions-with-socket-io-1-x-and-express-4-x
const io = require('socket.io')(server);
const fs = require("fs");
const { JSDOM } = require('jsdom');

app.use('/img', express.static('assets/imgs'));


app.get('/', function (req, res) {
    let doc = fs.readFileSync('./assets/html/index.html', "utf8");

    // let's make a minor change to the page before sending it off ...
    let dom = new JSDOM(doc);
    let $ = require("jquery")(dom.window);


//    let dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
//    let d = new Date().toLocaleDateString("en-US", dateOptions);
//    $("#footer").append('<div id="left"></div>');
//    $("#footer").append("<p id='right'>Copyright ©2021, (YOUR NAME HERE), Inc. Updated: " + d + "</p>");


    res.set('Server', 'Wazubi Engine');
    res.set('X-Powered-By', 'Wazubi');
    res.send(dom.serialize());

});

// adapted from: https://stackabuse.com/node-js-websocket-examples-with-socket-io/


var userCount = 0;

io.on('connect', function(socket) {
    userCount++;
    let str = "anonymous";
    socket.userName = str;
    io.emit('user_joined', { user: socket.userName, numOfUsers: userCount });
    console.log('Connected users:', userCount);

    socket.on('disconnect', function(data) {
        userCount--;
        io.emit('user_left', { user: socket.userName, numOfUsers: userCount });

        console.log('Connected users:', userCount);
    });

    socket.on('chatting', function(data) {

        console.log('User', data.name, 'Message', data.message);

        // if you don't want to send to the sender
        //socket.broadcast.emit({user: data.name, text: data.message});

        if(socket.userName == "anonymous") {


            io.emit("chatting", {user: data.name, text: data.message,
                event: socket.userName + " is now known as " + data.name});
            socket.userName = data.name;

        } else {

            io.emit("chatting", {user: socket.userName, text: data.message});

        }


    });

});



// RUN SERVER
let port = 8000;
server.listen(port, function () {
    console.log('Listening on port ' + port + '!');
});
