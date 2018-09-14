/*
* Primary file for the api 
*
*/

// dependencies

const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./config');
const fs = require('fs');

// Instantiate the http server
const httpServer = http.createServer((req,res) => {
	unifiedServer(req,res);
});

// Start the HTTP server
httpServer.listen(config.httpPort, () => {
	console.log(`the server is now listening on port ${config.httpPort}`);
});

// Instantiate the https server
const httpsServerOptions = {
	'key' : fs.readFileSync('./https/key.pem'),
	'cert': fs.readFileSync('./https/cert.pem')
};

const httpsServer = https.createServer(httpsServerOptions, (req,res) => {
	unifiedServer(req,res);
});

// Start the HTTPS server
httpsServer.listen(config.httpsPort, () => {
	console.log(`the server is now listening on port ${config.httpsPort}`);
});

//All the server logic for both the https and https server
const unifiedServer = (req,res) => {

	// Get the url an pase it
	const parsedUrl = url.parse(req.url,true);

	//Get the path of url 
	const path = parsedUrl.pathname;
	const trimmedPath = path.replace(/^\/+|\/+$/g,'');

	// Get the query string as an object 
	const queryStringObject = parsedUrl.query;

	//Get the http method
	const method = req.method.toLowerCase();

	//Get the headers as an object 
	const headers = req.headers;

	// Get the payload, if any 
	const decoder = new StringDecoder('utf-8');
	let buffer = '';
	req.on('data', (data) =>{
		buffer += decoder.write(data);
	});
	req.on('end', () => {
		buffer += decoder.end();

		// choose the handler this req choose to go to if one is not find use the not found handler
		const chooseHandler = typeof(router[trimmedPath]) !== 'undefined'? router[trimmedPath]:handlers.notFound;

		//construct the data object to send to the handler
		const data = {
			'trimmedPath' : trimmedPath,
			'queryStringObject': queryStringObject,
			'method':method,
			'headers':headers,
			'payload':buffer
		};

		// route the req to the handler specify in the router
		chooseHandler(data, (statusCode, payload) => {
			// Use the status code called back by the handler or default to 200
			statusCode = typeof(statusCode) == 'number' ? statusCode : 200;
			// use the payload called back by the handler or default to an empty object
			payload = typeof(payload) == 'object'? payload: {};

			// Convert the payload to a string 
			const payloadString = JSON.stringify(payload);

			// Return the response
			res.setHeader('Content-Type', 'application/json');
			res.writeHead(statusCode);
			res.end(payloadString);
			// Log the request path
			console.log(`Returning this response: `, statusCode, payloadString);
			
		});
	});
};

// Define the handlers
const handlers = {};
//call the ping handler 
handlers.ping = (data,callback) => {
	callback(200);
}

// call the hello handler 
handlers.hello = (data, callback) => {
	// callback a http status code, and a payload object
	callback(200,{'hello':'Hello world hope you are all nice ✅'});
};
// not found handler
handlers.notFound = (data, callback) => {
	callback(404);
};

// define a request router

const router = {
	'ping' : handlers.ping,
	'hello':handlers.hello
}