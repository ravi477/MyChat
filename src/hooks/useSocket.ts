
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export const useSocket = () => {
    // Initialize socket once
    const [socket] = useState(() => io(SERVER_URL, { autoConnect: false }));
    const [isConnected, setIsConnected] = useState(false);
    const [receivedMessage, setReceivedMessage] = useState<any>(null);

    useEffect(() => {
        // Ensure socket is connected (handling Strict Mode double-mount)
        if (!socket.connected) {
            socket.connect();
        }

        socket.on('connect', () => {
            console.log('Connected to server');
            setIsConnected(true);
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from server');
            setIsConnected(false);
        });

        socket.on('receive_message', (data) => {
            setReceivedMessage(data);
        });

        return () => {
            socket.off('connect');
            socket.off('disconnect');
            socket.disconnect();
        };
    }, [socket]);

    const login = (userId: string) => {
        if (socket.connected) {
            socket.emit('login', userId);
        } else {
            socket.connect();
            socket.once('connect', () => socket.emit('login', userId));
        }
    };

    const sendMessage = (data: any) => {
        socket.emit('message', data);
    };

    return { socket, isConnected, login, sendMessage, receivedMessage };
};
