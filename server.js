'use strict';
const express = require('express');
const session = require('express-session')
const app = express();
const server = require('http').Server(app);
const fs = require("fs");
const {
    JSDOM
} = require('jsdom');
//For logging
const morgan = require('morgan');
const path = require('path');
const rfs = require('rotating-file-stream');
//For Chatting

const io = require('socket.io')(server);
const mysql = require('mysql2/promise');

// static path mappings
app.use('/scripts', express.static('assets/scripts'));
app.use('/css', express.static('assets/css'));
app.use('/html', express.static('assets/html'));
app.use('/img', express.static('assets/img'));


app.use(session({
    secret: 'KFBR392',
    name: 'Asn4SessionID',
    resave: false,
    saveUninitialized: true
}));


const accessLogStream = rfs.createStream('access.log', {
    interval: '1d', // rotate daily
    path: path.join(__dirname, 'logs')
});

app.use(morgan(':referrer :url :user-agent', {
    stream: accessLogStream
}));


app.get('/', function (req, res) {
    let doc = fs.readFileSync('./assets/html/login.html', "utf8");

    let dom = new JSDOM(doc);
    let $ = require("jquery")(dom.window);

    initDB();

    res.set('Server', 'Wazubi Engine');
    res.set('X-Powered-By', 'Wazubi');
    res.send(dom.serialize());

});


//async together with await
async function initDB() {

    //const mysql = require('mysql2/promise');
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        multipleStatements: true
    });

    const createDBAndTables = `CREATE DATABASE IF NOT EXISTS Asn4;
        use Asn4;
        CREATE TABLE IF NOT EXISTS user (
        ID int NOT NULL AUTO_INCREMENT,
        email varchar(30),
        password varchar(30),
        PRIMARY KEY (ID));
        CREATE TABLE IF NOT EXISTS messages (
        messID int NOT NULL AUTO_INCREMENT,
        sender varchar(30),
        mess varchar(500),
        PRIMARY KEY (messID)
        );
        `;

    await connection.query(createDBAndTables);
    let results = await connection.query("SELECT COUNT(*) FROM user");
    let count = results[0][0]['COUNT(*)'];

    if (count < 2) {
        results = await connection.query(
            `INSERT INTO user (email, password) values ('arron_ferguson@bcit.ca', 'admin'); 
            INSERT INTO user (email, password) values ('test@bcit.ca', 'test');`);
    }
    connection.end();
}

app.get('/main', function (req, res) {

    // check for a session first!
    if (req.session.loggedIn) {


        // DIY templating with DOM, this is only the husk of the page
        let templateFile = fs.readFileSync('./assets/html/index.html', "utf8");
        let templateDOM = new JSDOM(templateFile);
        let $template = require("jquery")(templateDOM.window);

        // put the name in
        $template("#email").html(req.session.email);
        $template("#name").html(req.session.email);

        res.set('Server', 'Wazubi Engine');
        res.set('X-Powered-By', 'Wazubi');
        res.send(templateDOM.serialize());

    } else {
        // not logged in - no session!
        res.redirect('/');
    }


});

app.use(express.json());
app.use(express.urlencoded({
    extended: true
}))

let userName;

app.post('/authenticate', function (req, res) {
    res.setHeader('Content-Type', 'application/json');

    let results = authenticate(req.body.email, req.body.password,
        function (rows) {
            userName = req.body.email;
            //console.log(rows.password);
            if (rows == null) {
                // not found
                res.send({
                    status: "fail",
                    msg: "User account not found."
                });
            } else {
                // authenticate the user, create a session
                req.session.loggedIn = true;
                req.session.email = rows.email;
                req.session.save(function (err) {
                    // session saved
                })
                res.send({
                    status: "success",
                    msg: "Logged in."
                });
            }
        });

});


function authenticate(email, pwd, callback) {

    const mysql = require('mysql2');
    const connection = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'Asn4'
    });

    connection.query(
        "SELECT * FROM user WHERE email = ? AND password = ?", [email, pwd],
        function (error, results) {
            if (error) {
                throw error;
            }

            if (results.length > 0) {
                // email and password found
                return callback(results[0]);
            } else {
                // user not found
                return callback(null);
            }

        });

}


app.get('/logout', function (req, res) {
    req.session.destroy(function (error) {
        if (error) {
            console.log(error);
        }
    });
    res.redirect("/main");

})

app.get('/get-messages', function(req, res) {
    let results = getOldMessages(function(results) {
        res.send({status: "success", rows: results});
    })
        

    //res.send({status: "success", rows: results[0]});
});

async function getOldMessages(callback) {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'Asn4'
    });

    let results = await connection.query('SELECT * FROM messages');
    connection.end();
    //console.log(results[0]);
    return callback(results[0]);
}

// adapted from: socket.io-example, which was adapted from https://stackabuse.com/node-js-websocket-examples-with-socket-io/


var userCount = 0;

io.on('connect', function(socket) {
    userCount++;
    //let str = "anonymous";
    let str = userName;
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
        addMessageToDB(data.name, data.message);
        if(socket.userName == "anonymous") {


            io.emit("chatting", {user: data.name, text: data.message,
                event: socket.userName + " is now known as " + data.name});
            socket.userName = data.name;

        } else {

            io.emit("chatting", {user: socket.userName, text: data.message});

        }


    });

});

async function addMessageToDB(name, message) {

    //const mysql = require('mysql2/promise');
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'Asn4'
    });

    await connection.query(
        'INSERT INTO messages (sender, mess) values (?, ?);',
        [name, message],
        function (error, results, fields) {
            if (error) {
                throw error;
            }
        });

    connection.end();
}


// RUN SERVER
let port = 8000;
server.listen(port, function () {
    console.log('Listening on port ' + port);
})