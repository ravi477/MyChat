
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || `http://${window.location.hostname}:3001`;

// Singleton socket instance
const socketInstance = io(SERVER_URL, { autoConnect: false });

export const useSocket = () => {
    const [isConnected, setIsConnected] = useState(socketInstance.connected);
    const [receivedMessage, setReceivedMessage] = useState<any>(null);
    const [userTyping, setUserTyping] = useState<{ userId: string; userName: string } | null>(null);

    useEffect(() => {
        // Ensure socket is connected
        if (!socketInstance.connected) {
            socketInstance.connect();
        }

        const onConnect = () => {
            console.log('Connected to server');
            setIsConnected(true);
        };

        const onDisconnect = () => {
            console.log('Disconnected from server');
            setIsConnected(false);
        };

        const onMessage = (data: any) => {
            setReceivedMessage(data);
        };

        const onUserTyping = (data: { userId: string; userName: string }) => {
            setUserTyping(data);
        };

        const onUserStoppedTyping = () => {
            setUserTyping(null);
        };

        socketInstance.on('connect', onConnect);
        socketInstance.on('disconnect', onDisconnect);
        socketInstance.on('receive_message', onMessage);
        socketInstance.on('user_typing', onUserTyping);
        socketInstance.on('user_stopped_typing', onUserStoppedTyping);

        return () => {
            socketInstance.off('connect', onConnect);
            socketInstance.off('disconnect', onDisconnect);
            socketInstance.off('receive_message', onMessage);
            socketInstance.off('user_typing', onUserTyping);
            socketInstance.off('user_stopped_typing', onUserStoppedTyping);
            // Do NOT disconnect here, as other components might be using it
        };
    }, []);

    const login = (userId: string) => {
        if (socketInstance.connected) {
            socketInstance.emit('login', userId);
        } else {
            socketInstance.connect();
            socketInstance.once('connect', () => socketInstance.emit('login', userId));
        }
    };

    const logout = () => {
        socketInstance.disconnect();
    };

    const sendMessage = (data: any) => {
        socketInstance.emit('message', data);
    };

    const emitTyping = (recipientId: string, userName: string, isTyping: boolean) => {
        if (isTyping) {
            socketInstance.emit('typing_start', { recipientId, userName });
        } else {
            socketInstance.emit('typing_stop', { recipientId });
        }
    };

    // Return the singleton instance
    return { socket: socketInstance, isConnected, login, logout, sendMessage, receivedMessage, emitTyping, userTyping };
};
