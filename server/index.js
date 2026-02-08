
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

// Try to initialize Firebase Admin SDK
let firestore = null;
try {
    const admin = require('firebase-admin');

    // Check if already initialized
    if (!admin.apps.length) {
        admin.initializeApp({
            projectId: 'pvr-browser'
        });
    }
    firestore = admin.firestore();
    console.log('Firebase Admin initialized successfully');
} catch (e) {
    console.log('Firebase Admin not available, will rely on client-side updates:', e.message);
}

// Helper function to update user status in Firestore
async function updateUserStatus(userId, status) {
    if (!firestore) return; // Skip if Firestore not available

    try {
        await firestore.collection('users').doc(userId).set({
            status: status
        }, { merge: true });
        console.log(`Updated ${userId} status to ${status}`);
    } catch (error) {
        console.error(`Failed to update status for ${userId}:`, error.message);
    }
}

const app = express();
app.use(cors());

app.get('/', (req, res) => {
    res.send('Server is running');
});

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Store connected users (userId -> socketId)
const connectedUsers = new Map();

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('login', async (userId) => {
        if (!userId) return;

        // Map this UID to the current socket ID
        connectedUsers.set(userId, socket.id);
        socket.userId = userId; // Store on socket for easy cleanup

        console.log(`User logged in: ${userId}`);
        console.log("Current connected users:", Array.from(connectedUsers.keys()));

        // Update Firestore status to online
        await updateUserStatus(userId, 'online');

        // Broadcast to all clients
        io.emit('user_online', userId);
    });

    // WebRTC Signaling Events
    socket.on("callUser", ({ userToCall, signalData, from, name, isVideo }) => {
        console.log(`Call attempt from ${from} to ${userToCall}`);
        const socketId = connectedUsers.get(userToCall);
        if (socketId) {
            console.log(`User ${userToCall} is online at socket ${socketId}. Forwarding call...`);
            io.to(socketId).emit("callUser", { signal: signalData, from, name, isVideo });
        } else {
            console.log(`User ${userToCall} is OFFLINE. Call failed.`);
        }
    });

    socket.on("answerCall", (data) => {
        const socketId = connectedUsers.get(data.to);
        if (socketId) {
            io.to(socketId).emit("callAccepted", data.signal);
        }
    });

    socket.on("iceCandidate", (data) => {
        const socketId = connectedUsers.get(data.to);
        if (socketId) {
            io.to(socketId).emit("iceCandidate", data.candidate);
        }
    });

    socket.on("endCall", ({ to }) => {
        const socketId = connectedUsers.get(to);
        if (socketId) {
            io.to(socketId).emit("callEnded");
        }
    });

    socket.on('message', (data) => {
        // data: { text, senderId, recipientId (optional), ... }
        console.log(`Message from ${data.senderId} to ${data.recipientId}: ${data.text}`);

        if (data.recipientId) {
            // Private Message: Find the socket ID for the recipient UID
            const recipientSocketId = connectedUsers.get(data.recipientId);
            if (recipientSocketId) {
                io.to(recipientSocketId).emit('receive_message', data);
            }

            // Send back to sender for confirmation
            socket.emit('receive_message', data);
        } else {
            // Broadcast (Public/Group)
            io.emit('receive_message', data);
        }
    });

    // Typing indicators
    socket.on('typing_start', ({ recipientId, userName }) => {
        console.log(`Typing START: ${socket.userId} -> ${recipientId} (${userName})`);
        const recipientSocketId = connectedUsers.get(recipientId);
        if (recipientSocketId) {
            io.to(recipientSocketId).emit('user_typing', { userId: socket.userId, userName });
            console.log(`-> Emitted user_typing to ${recipientSocketId}`);
        } else {
            console.log(`-> Recipient ${recipientId} NOT FOUND in connectedUsers`);
        }
    });

    socket.on('typing_stop', ({ recipientId }) => {
        console.log(`Typing STOP: ${socket.userId} -> ${recipientId}`);
        const recipientSocketId = connectedUsers.get(recipientId);
        if (recipientSocketId) {
            io.to(recipientSocketId).emit('user_stopped_typing', { userId: socket.userId });
        }
    });

    socket.on('disconnect', async () => {
        console.log(`User disconnected: ${socket.userId || socket.id}`);
        if (socket.userId) {
            connectedUsers.delete(socket.userId);

            // Update Firestore status to offline
            await updateUserStatus(socket.userId, 'offline');

            io.emit('user_offline', socket.userId);
        }
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`SERVER RUNNING ON PORT ${PORT}`);
});
