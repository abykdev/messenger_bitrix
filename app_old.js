const express = require('express');
const cors = require('cors');
var https = require('https');
var http = require('http');
var fs = require('fs');

var options = {
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem')
};
const app = express();
app.use(cors());
http.createServer(app).listen(80);
// Create an HTTPS service identical to the HTTP service.
const PORT = 3000;
https.createServer(options, app).listen(PORT, () => {
    console.log(`Alert Events service listening at http://localhost:${PORT}`)
});

app.use(express.urlencoded({extended: true}));
app.use(express.json()); // for parsing application/json

let users = [];

function eventsHandler(request, response, next) {
    const headers = {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
    };
    response.writeHead(200, headers);
    let data = `event: ping\ndata: ok\n\n`;
    const userId = request.query.id;
    const clientId = request.query.client_id;
    const arUsersOnline=users.filter((user)=>{
        return user.CLIENT_ID==clientId
    });

    console.log(request.query);
    if(userId){
        let arUsersOnlineIds=[];
        arUsersOnline.forEach((user)=>{
            arUsersOnlineIds.push(user.ID)
        });
        data=`event: ping\ndata: ${JSON.stringify(arUsersOnlineIds)}\n\n`;
        response.write(data);
        const newUser = {
            ID: userId,
            CLIENT_ID: clientId,
            response
        };
        let isInArray=false;
        users.forEach((user)=>{
            if(user.ID==newUser.ID){
                isInArray=true;
            }
        });
        if(!isInArray){
            users.push(newUser);
        }
        sendOnlineStatus(userId,"online");
        //console.log(users);

    } else {
        data = `event: ping\ndata: error\n\n`;
        response.write(data);
    }

    request.on('close', () => {
        console.log(`${userId} Connection closed`);
        users = users.filter(user => user.ID !== userId);
        sendOnlineStatus(userId,"offline");
    });
}

async function sendMessageAlert(newAlert) {
    let result="error";
    users.forEach(
        (user) => {
            if(user.ID==newAlert.UF_TO){
                user.response.write(`event: message\ndata: ${JSON.stringify(newAlert)}\n\n`)
                result="ok";
            }
        }
    )
}
async function sendOnlineStatus(intClientId,status){
    let result="error";
    users.forEach(
        (user) => {
            user.response.write(`event: online\ndata: ${JSON.stringify({ID:intClientId,STATUS:status})}\n\n`);
            console.log("send online event to ",user.ID);
            console.log("status ",status);
            result="ok";
        }
    )
}

function addAlert(request, response, next) {
    console.log(request.body);
    const newAlert = request.body;
    response.status(200).send("Ok!");
    return sendMessageAlert(newAlert);
}

app.get('/status', (request, response) => response.json({users: users.length}));
app.get('/events', eventsHandler);
app.post('/alert', addAlert);