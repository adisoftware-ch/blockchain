import express = require('express');
import socketIo = require('socket.io');
import http = require('http');
import https = require('https');
import fs = require('fs');

import { environment } from '../environments/environment';
import * as routes from './routes/routes';

const app: express.Application = express();
app.use(routes.router);

// Start function
export const start = (port: number): Promise<void> => {
    let server: http.Server | https.Server;

    if (environment().secure) {
        server = https.createServer({
            key: fs.readFileSync(environment().secureconfig.key),
            cert: fs.readFileSync(environment().secureconfig.cert),
            passphrase: environment().secureconfig.passphrase
        }, app);
    } else {
        server = http.createServer(app);
    }

    let wallets = new Array<string>();

    const io = socketIo(server);

    io.on('connection', function(socket){
        // Let all sockets know how many are connected
        const number = Object.keys(io.sockets.connected).length;
        console.log(`dispatching server; current number of connections: ${number}`);
        io.sockets.emit('sockets:connected', number);

        io.sockets.emit('wallets', JSON.stringify(wallets));
    
        socket.on('disconnect', function() {
            const number = Object.keys(io.sockets.connected).length;
            console.log(`dispatching server; current number of connections: ${number}`);
            io.sockets.emit('sockets:connected', number);
            if (number == 0) {
                wallets = new Array<string>();
            }
        })

        socket.on('wallet', function(data: string) {
            if (data && data.trim().length > 0) {
                console.log(`new wallet ${data}`);
                wallets.push(data);
                io.sockets.emit('wallets', JSON.stringify(wallets));
            }
        })

        socket.on('request-chains', function() {
            console.log(`new consensus request`);
            io.sockets.emit('request-chain');
        })

        socket.on('chain', function(data: string) {
            console.log(`consensus request: forwarding chain ${data}`);
            io.sockets.emit('chain', data);
        })
    
        socket.on('trx', function(data: string) {
            console.log(`dispatching message ${data}`);
            io.sockets.emit('trx', data);
        })

        socket.on('response', function(data: string) {
            console.log(`dispatching message ${data}`);
            io.sockets.emit('response', data);
        })

        socket.on('commit', function(data: string) {
            console.log(`dispatching message ${data}`);
            io.sockets.emit('commit', data);
        })

    })

    return new Promise<void>((resolve, _REJECT) => {
        server.listen(port, resolve);
    });
};

process.setMaxListeners(environment().maxSocketListeners);

process.on('uncaughtException', function (err) {
    console.error('dispatcher, app.ts:','an uncaught exception happened!');
    console.error(err.stack);
});
