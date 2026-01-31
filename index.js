
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

// Store connected users (socket.id -> status)
// In a real app, mapping would be userId -> socketId
const connectedUsers = new Map(); // socketId -> { userId, username }

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('login', (username) => {
        // Simple login: userId = socket.id (for now, or generate UUID)
        // In real app, userId persists. Here, session = connection.
        const userId = socket.id;
        const user = { userId, username, socketId: socket.id };

        connectedUsers.set(socket.id, user);
        console.log(`User logged in: ${username} (${userId})`);

        // Broadcast updated user list to ALL clients
        const userList = Array.from(connectedUsers.values());
        io.emit('user_list', userList);

        // Acknowledge login to sender
        socket.emit('login_success', user);
    });

    socket.on('message', (data) => {
        // data: { text, senderId, recipientId (optional), conversationId, ... }
        console.log(`Message from ${data.senderId}: ${data.text}`);

        if (data.recipientId) {
            // Private Message
            io.to(data.recipientId).emit('receive_message', data);

            // Also send back to sender so they confirm receipt
            socket.emit('receive_message', data);
        } else {
            // Broadcast (Public/Group)
            io.emit('receive_message', data);
        }
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        if (connectedUsers.has(socket.id)) {
            connectedUsers.delete(socket.id);
            // Broadcast updated list
            io.emit('user_list', Array.from(connectedUsers.values()));
        }
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`SERVER RUNNING ON PORT ${PORT}`);
});
