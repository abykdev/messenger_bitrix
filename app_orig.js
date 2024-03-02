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

https.createServer(options, app).listen(3000, () => {
    console.log(`Alert Events service listening at http://localhost:${PORT}`)
});

app.use(express.urlencoded({extended: true}));
app.use(express.json()); // for parsing application/json


app.get('/status', (request, response) => response.json({clients: clients.length}));

const PORT = 3000;
let clients = [];

function eventsHandler(request, response, next) {
    const headers = {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
    };
    response.writeHead(200, headers);
    let data = `event: ping\ndata: ok\n\n`;
    const clientId = request.query.id;
    console.log(request.query);
    if(request.query.id){
        const newClient = {
            id: clientId,
            response
        };
        clients.push(newClient);
        //console.log(clients);
        response.write(data);
    } else {
        data = `event: ping\ndata: error\n\n`;
        response.write(data);
    }



    request.on('close', () => {
        console.log(`${clientId} Connection closed`);
        clients = clients.filter(client => client.id !== clientId);
    });
}
app.get('/events', eventsHandler);

async function sendEventsToClient(newAlert) {
    let result="error";
    clients.forEach(
        (client) => {
            if(client.id==newAlert.UF_TO){
                client.response.write(`event: message\ndata: ${JSON.stringify(newAlert)}\n\n`)
                result="ok";
            }
        }
    )
}

 function addAlert(request, response, next) {
     console.log(request.body);
    const newAlert = request.body;
     response.status(200).send("Ok!");
    //alerts.push(newAlert);
    //respsonse.json(newAlert);
    return sendEventsToClient(newAlert);
}

app.post('/alert', addAlert);