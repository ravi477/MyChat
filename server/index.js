
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');


const app = express();
app.use(cors());

app.get('/', (req, res) => {
    res.send('Server is running');
});

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173", "http://localhost:5176", process.env.FRONTEND_URL].filter(Boolean),
        methods: ["GET", "POST"]
    }
});

// Store connected users (userId -> socketId)
const connectedUsers = new Map();

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('login', (userId) => {
        if (!userId) return;

        // Map this UID to the current socket ID
        connectedUsers.set(userId, socket.id);
        socket.userId = userId; // Store on socket for easy cleanup

        console.log(`User logged in: ${userId}`);

        // Broadcast a simple "user status changed" event if needed
        // For now, our side bar will be mostly Firestore-driven
        io.emit('user_online', userId);
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

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.userId || socket.id}`);
        if (socket.userId) {
            connectedUsers.delete(socket.userId);
            io.emit('user_offline', socket.userId);
        }
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`SERVER RUNNING ON PORT ${PORT}`);
});
