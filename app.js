const express = require('express');
const cors = require('cors');
var https = require('https');
var http = require('http');
var fs = require('fs');
const {User,Users}=require('./modules/users.js');

var options = {
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem')
};
const app = express();
app.use(cors());
http.createServer(app).listen(3001);
// Create an HTTPS service identical to the HTTP service.
const PORT = 3000;
https.createServer(options, app).listen(PORT, () => {
    console.log(`Alert Events service listening at http://localhost:${PORT}`)
});

app.use(express.urlencoded({extended: true}));
app.use(express.json()); // for parsing application/json

let obUsers=new Users();
///////////////////////////////////////////
function subscribe(req,res,next){
    const headers = {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
    };
    console.log("online users:",obUsers.toArray());
    console.log("subscribe user",req.query.ID);
    console.log("subscribe header",req.headers);
    res.writeHead(200, headers);
    let obUser= new User({
        ID:(req.query.ID).trim(),
        HOST:req.headers.origin,
        res
    });
    let obHostUsers=obUsers.getByHost(obUser.HOST);
    obUser.sendEvent("ping",{USERS:obHostUsers.toArray()});
    console.log("will send online status to:",obHostUsers.toArray());
    obHostUsers.sendEvent("online",{ID:obUser.ID,STATUS:"online"});
    if(!obUsers.isAdded(obUser)){
        obUsers.add(obUser);
    }
    req.on('close', () => {
        obHostUsers.sendEvent("online",{ID:obUser.ID,STATUS:"offline"});
        obUsers.deleteUser(obUser)
    });
}
function message(req,res,next){
    console.log("message alert! body:",req.body);
    console.log("message headers:",req.headers);
    let obUserTo=obUsers.getUser({
        ID:req.body.UF_TO,
        HOST:req.body.HTTP_ORIGIN
    });
    console.log("obUserTo:",obUserTo);
    if(obUserTo){
        obUserTo.sendEvent("message",req.body);
        obUserTo.sendEvent("online",{ID:obUserTo.ID,STATUS:"online"});
    } else {
        console.log("failed attempt to send message, user not found:",req.body);
    }
    res.status(200).send("Ok!");
}

app.get('/status', (request, response) => {console.log(obUsers)});
//app.get('/events', eventsHandler);
//app.post('/alert', addAlert);
///
app.get('/subscribe', subscribe);
app.post('/message', message);
