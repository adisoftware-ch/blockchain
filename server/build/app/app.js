"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var socketIo = require("socket.io");
var http = require("http");
var https = require("https");
var fs = require("fs");
var environment_1 = require("../environments/environment");
var routes = __importStar(require("./routes/routes"));
var app = express();
app.use(routes.router);
// Start function
exports.start = function (port) {
    var server;
    if (environment_1.environment().secure) {
        server = https.createServer({
            key: fs.readFileSync(environment_1.environment().secureconfig.key),
            cert: fs.readFileSync(environment_1.environment().secureconfig.cert),
            passphrase: environment_1.environment().secureconfig.passphrase
        }, app);
    }
    else {
        server = http.createServer(app);
    }
    var io = socketIo(server);
    io.on('connection', function (socket) {
        // Let all sockets know how many are connected
        var number = Object.keys(io.sockets.connected).length;
        console.log("dispatching server; current number of connections: " + number);
        io.sockets.emit('sockets:connected', number);
        socket.on('disconnect', function () {
            var number = Object.keys(io.sockets.connected).length;
            console.log("dispatching server; current number of connections: " + number);
            io.sockets.emit('sockets:connected', number);
        });
        /**
         * A new wallet is requested.
         */
        socket.on('wallet', function (data) {
            console.log("new wallet to be registered");
            io.sockets.emit('wallet', data);
        });
        socket.on('request-chains', function () {
            console.log("new consensus request");
            io.sockets.emit('request-chain');
        });
        socket.on('chain', function (data) {
            console.log("consensus request: forwarding chain " + data);
            io.sockets.emit('chain', data);
        });
        socket.on('trx', function (data) {
            console.log("dispatching message " + data);
            io.sockets.emit('trx', data);
        });
        socket.on('response', function (data) {
            console.log("dispatching message " + data);
            io.sockets.emit('response', data);
        });
        socket.on('commit', function (data) {
            console.log("dispatching message " + data);
            io.sockets.emit('commit', data);
        });
    });
    return new Promise(function (resolve, _REJECT) {
        server.listen(port, resolve);
    });
};
process.setMaxListeners(environment_1.environment().maxSocketListeners);
process.on('uncaughtException', function (err) {
    console.error('dispatcher, app.ts:', 'an uncaught exception happened!');
    console.error(err.stack);
});
