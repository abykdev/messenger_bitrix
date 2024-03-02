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
http.createServer(app).listen(3001);
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
    console.log(request.headers);
    response.writeHead(200, headers);
    let data = `event: ping\ndata: ok\n\n`;

    const userId = (request.query.id).trim();
    const strUserHost = request.headers.origin;
    /*let arHostUsers=users.filter((user)=>{
        return user.HOST==strUserHost
    });*/

    console.log(request.query);
    if(typeof userId !="undefined" && userId){
        /*let arHostUsersIds=[];
        arHostUsers.forEach((user)=>{
            arHostUsersIds.push(user.ID)
        });
        if(arHostUsersIds.length>0){
            data=`event: ping\ndata: ${JSON.stringify(arHostUsersIds)}\n\n`;
        }*/
        let arHostUsersIds=[];
        users.forEach((user)=>{
            arHostUsersIds.push(user.ID)
        });
        if(users.length>0){
            data=`event: ping\ndata: ${JSON.stringify(arHostUsersIds)}\n\n`;
        }
        response.write(data);
        const newUser = {
            ID: userId,
            HOST: strUserHost,
            response
        };
        let isInArray=false;
        /*arHostUsers.forEach((user)=>{
            if(user.ID==newUser.ID){
                isInArray=true;
            }
        });*/
        users.forEach((user)=>{
            if(user.ID==userId){
                isInArray=true;
            }
        });
        if(!isInArray){
            console.log("push user with ID=",newUser.ID);
            users.push(newUser);
            //console.log("users after push:",users);
        }
        sendOnlineStatus(userId,"online",strUserHost);
        //console.log(users);

    } else {
        data = `event: ping\ndata: error\n\n`;
        response.write(data);
    }
    request.on('close', () => {
        console.log(`${userId} Connection closed`);
        sendOnlineStatus(userId,"offline",strUserHost);
    });
}

async function sendMessageAlert(newAlert) {
    let result="error";
    users.forEach(
        (user) => {
            if(user.ID==newAlert.UF_TO){
                user.response.write(`event: message\ndata: ${JSON.stringify(newAlert)}\n\n`)
                console.log("sendMessageAlert to ",user.ID);
                console.log("message: ",newAlert);
                result="ok";
            }
        }
    )
}
async function sendOnlineStatus(intClientId,status,strUserHost){
    let result="error";
    console.log("count users=",users.length);
    const promises = users.map((user)=>{
        console.log("userID",user.ID);
        if(true||user.HOST==strUserHost){
            if(user.ID!=intClientId){
                user.response.write(`event: online\ndata: ${JSON.stringify({ID:intClientId,STATUS:status})}\n\n`);
                console.log("send online event to ",user.ID);
                console.log("data: ",{ID:intClientId,STATUS:status});
                result="ok";
            }
        }
    });
    // ждем когда всё промисы будут выполнены
    await Promise.all(promises);
    console.log("hope all write processes ended");
    if(status=="offline"){
        console.log("remove user with id=",intClientId);
        console.log("old length=",users.length);
        users = users.filter(userDelete => userDelete.ID != intClientId);
        console.log("remove user, new length=",users.length);
    }
}

function addAlert(request, response, next) {
    console.log(request.body);
    const newAlert = request.body;
    const arHostUsers=users.filter((user)=>{
        return user.HOST==request.headers.host
    });
    response.status(200).send("Ok!");
    return sendMessageAlert(newAlert);
}

app.get('/status', (request, response) => {console.log(users)});
app.get('/events', eventsHandler);
app.post('/alert', addAlert);