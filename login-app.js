'use strict';
const express = require('express');
const session = require('express-session')
const app = express();
const fs = require("fs");
const { JSDOM } = require('jsdom');

// static path mappings
app.use('/js', express.static('assets/js'));
app.use('/css', express.static('assets/css'));
app.use('/html', express.static('assets/html'));
app.use('/images', express.static('assets/images'));


app.use(session(
  {
      secret:'KFBR392',
      name:'Asn3SessionID',
      resave: false,
      saveUninitialized: true }));



app.get('/', function (req, res) {
    let doc = fs.readFileSync('./assets/html/index.html', "utf8");

    let dom = new JSDOM(doc);
    let $ = require("jquery")(dom.window);

    initDB();

    res.set('Server', 'Wazubi Engine');
    res.set('X-Powered-By', 'Wazubi');
    res.send(dom.serialize());

});


// async together with await
async function initDB() {

    const mysql = require('mysql2/promise');
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      multipleStatements: true
    });

    const createDBAndTables = `CREATE DATABASE IF NOT EXISTS Asn3;
        use Asn3;
        CREATE TABLE IF NOT EXISTS user (
        ID int NOT NULL AUTO_INCREMENT,
        email varchar(30),
        password varchar(30),
        PRIMARY KEY (ID));`;

    await connection.query(createDBAndTables);
    let results = await connection.query("SELECT COUNT(*) FROM user");
    let count = results[0][0]['COUNT(*)'];

    if(count < 2) {
        results = await connection.query("INSERT INTO user (email, password) values ('arron_ferguson@bcit.ca', 'admin')");
        results = await connection.query("INSERT INTO user (email, password) values ('test@bcit.ca', 'test')");
        console.log("Added user record.");
    }
    connection.end();
}

app.get('/main', function(req, res) {

    // check for a session first!
    if(req.session.loggedIn) {

        // DIY templating with DOM, this is only the husk of the page
        let templateFile = fs.readFileSync('./assets/html/main-page.html', "utf8");
        let templateDOM = new JSDOM(templateFile);
        let $template = require("jquery")(templateDOM.window);

        // put the name in
        $template("#email").html(req.session.email);

         // insert the left column from a different file (or could be a DB or ad network, etc.)
         let top = fs.readFileSync('./assets/templates/questionshipTemplate.html', "utf8");
         let topDOM = new JSDOM(top);
         let $top = require("jquery")(topDOM.window);
         // Replace!
         $template("#top_placeholder").replaceWith($top("#top_column"));

         // insert the left column from a different file (or could be a DB or ad network, etc.)
         let bottom = fs.readFileSync('./assets/templates/aboutUsTemplate.html', "utf8");
         let bottomDOM = new JSDOM(bottom);
         let $bottom = require("jquery")(bottomDOM.window);
         // Replace!
         $template("#bottom_placeholder").replaceWith($bottom("#bottom_column"));


        // // insert the left column from a different file (or could be a DB or ad network, etc.)
        // let right = fs.readFileSync('./assets/templates/right_content.html', "utf8");
        // let rightDOM = new JSDOM(right);
        // let $right = require("jquery")(rightDOM.window);
        // // Replace!
        // $template("#right_placeholder").replaceWith($right("#right_column"));

        res.set('Server', 'Wazubi Engine');
        res.set('X-Powered-By', 'Wazubi');
        res.send(templateDOM.serialize());

    } else {
        // not logged in - no session!
        res.redirect('/');
    }


});

app.use(express.json());
app.use(express.urlencoded({ extended: true }))

app.post('/authenticate', function(req, res) {
    res.setHeader('Content-Type', 'application/json');

    let results = authenticate(req.body.email, req.body.password,
        function(rows) {
            //console.log(rows.password);
            if(rows == null) {
                // not found
                res.send({ status: "fail", msg: "User account not found." });
            } else {
                // authenticate the user, create a session
                req.session.loggedIn = true;
                req.session.email = rows.email;
                req.session.save(function(err) {
                    // session saved
                })
                res.send({ status: "success", msg: "Logged in." });
            }
    });

});


function authenticate(email, pwd, callback) {

    const mysql = require('mysql2');
    const connection = mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'Asn3'
    });

    connection.query(
      "SELECT * FROM user WHERE email = ? AND password = ?", [email, pwd],
      function (error, results) {
        if (error) {
            throw error;
        }

        if(results.length > 0) {
            // email and password found
            return callback(results[0]);
        } else {
            // user not found
            return callback(null);
        }

    });

}


app.get('/logout', function(req,res){
    req.session.destroy(function(error){
        if(error) {
            console.log(error);
        }
    });
    res.redirect("/main");

})


// RUN SERVER
let port = 8000;
app.listen(port, function () {
    console.log('Listening on port ' + port);
})
