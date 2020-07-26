const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
require("dotenv").config();
const indexRouter = require("./routes/index");
const apiRouter = require("./routes/api");
const apiResponse = require("./helpers/apiResponse");
const cors = require("cors");
const throttle = require('express-throttle-bandwidth');
const WebSocket = require('ws');


// DB connection
const MONGODB_URL = process.env.MONGODB_URL;
const mongoose = require("mongoose");
mongoose.connect(MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
	//don't show the log when it is test
	if(process.env.NODE_ENV !== "test") {
		console.log("Connected to distant cluster");
		console.log("App is running ... \n");
		console.log("Press CTRL + C to stop the process. \n");
	}
})
	.catch(err => {
		console.error("App starting error:", err.message);
		process.exit(1);
	});
const db = mongoose.connection;

const app = express();

//don't show the log when it is test
if(process.env.NODE_ENV !== "test") {
	app.use(logger("dev"));
}

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use('/uploads', express.static(path.join(__dirname + '/uploads')));

//To allow cross-origin requests
app.use(cors());

// Throttling bandwidth
app.use(throttle(1024 * 128))

//Route Prefixes
app.use("/", indexRouter);
app.use("/api/", apiRouter);

// throw 404 if URL not found
app.all("*", function(req, res) {
	return apiResponse.notFoundResponse(res, "Page not found");
});

app.use((err, req, res) => {
	if(err.name === "UnauthorizedError"){
		return apiResponse.unauthorizedResponse(res, err.message);
	}
});

// WEBSOCKET SERVER

const wss = new WebSocket.Server({
	port: 12730,
	perMessageDeflate: {
		zlibDeflateOptions: {
			chunkSize: 1024,
			memLevel: 7,
			level: 3
		},
		zlibInflateOptions: {
			chunkSize: 10 * 1024
		},
		clientNoContextTakeover: true,
		serverNoContextTakeover: true,
		serverMaxWindowBits: 10,
		concurrencyLimit: 10,
		threshold: 1024
	}
});

console.log('Websocket server listen on: ' + 12730)

let latches = [];
let latchesID = [];

wss.on('connection', function connection(ws) {
	ws.on('message', function incoming(message) {
		console.log('received: %s', message);
		latchesID.push(message)
		// sendSomeData(message)
	});
	ws.send('Connected to JS server. Listening:')
	latches.push(ws)
});

function sendSomeData(UUID){
	for(latch in latchesID){
		if(latchesID[latch] === UUID){
			latches[latch].send(UUID + ' open door !')
		}
	}
}

wss.on('close', function deconnection(ws){
	ws.on('message', function incoming(message){
		console.log('received: %s', message);
	})
	ws.send('Bye!')
})

// /WEBSOCKET SERVER

module.exports = app;
