import { io } from 'socket.io-client';
import { STDOUT_CLOSE, STDOUT } from '../const';

class Client {
    socket = null;
    allOutList = [];
    listenerList = [];
    /**
     * @param {(key, data) => {}} callback
     */
    addMessageListener(callback) {
        this.listenerList.push(callback);
    }

    postMessageForListeners(key, data) {
        this.listenerList.forEach((callback) => {
            callback && callback(key, data);
        });
    }

    sendCommand(command) {
        // console.log(this.socket, command);
        if (!this.socket) {
            return;
        }
        this.socket.emit('std-room:command', command.trim());
    }

    connection() {
        console.log('####### connect begin');
        const socket = io('http://localhost:3000');
        this.socket = socket;
        socket.on('connect', () => {
            console.log('connected', socket.connected, socket.id); // true
        });
        socket.on(STDOUT, (data) => {
            this.allOutList.push(data);
            this.postMessageForListeners(STDOUT, data);
        });
        socket.on(STDOUT_CLOSE, () => {
            this.postMessageForListeners(STDOUT_CLOSE);
        });
        socket.connect();
    }
}

const client = new Client();

export default client;
