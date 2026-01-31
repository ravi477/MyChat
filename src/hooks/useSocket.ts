
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import type { Message } from '../data/mockData';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export const useSocket = () => {
    // Initialize socket once
    const [socket] = useState(() => io(SERVER_URL));
    const [isConnected, setIsConnected] = useState(false);

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

        return () => {
            socket.off('connect');
            socket.off('disconnect');
            socket.disconnect();
        };
    }, [socket]);

    const sendMessage = (data: Message) => {
        socket.emit('message', data);
    };

    return { socket, isConnected, sendMessage };
};
