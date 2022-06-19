const { Server } = require('socket.io');
const { commandline } = require('../pip');

const room = 'std-room';
class SocketService {
    socketMap = new Map();
    connection(httpServer) {
        const io = new Server(httpServer, {
            // options
            cors: {
                origin: '*',
                methods: ['GET', 'POST', 'HEAD', 'PUT', 'PATCH', 'DELETE'],
                allowedHeaders: ['Access-Control-Allow-Origin'],
            },
        });
        io.on('connection', (socket) => {
            if (!this.socketMap.has(socket.id)) {
                this.socketMap.set(socket.id, socket);
            }
            socket.join(room);
            console.log('socket', socket.id);

            /**
             * std-room:cypress
             */
            socket.on('std-room:cypress', (_data) => {});

            /**
             * std-room:command
             */
            socket.on('std-room:command', (command) => {
                if (!command || !command.length) {
                    return;
                }
                commandline(
                    command,
                    [],
                    (data) => {
                        socket.emit('std-room:stdout', data);
                    },
                    () => {
                        socket.emit('std-room:stdout:close');
                    },
                );
            });
        });
    }

    sendBySocket(socket, out) {
        socket.emit('std-room:stdout', out);
    }

    sendAllClient(out) {
        this.socketMap.forEach((socket) => {
            console.log('send', socket.id);
            socket.to(room).emit('std-room:stdout', out);
        });
    }
}

const socket = new SocketService();
module.exports = socket;
