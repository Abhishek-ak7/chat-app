const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});


app.use(cors());
app.use(express.json());
app.use(express.static('../frontend'));


const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'chat_app'
});


db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
    return;
  }
  console.log('Connected to MySQL database');
});


let activeUsers = new Map();


io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);


  socket.on('join', (userData) => {
    activeUsers.set(socket.id, {
      username: userData.username,
      avatar: userData.avatar || 'https://via.placeholder.com/40'
    });
    
 
    socket.broadcast.emit('userJoined', {
      username: userData.username,
      message: `${userData.username} joined the chat`
    });
    
   
    socket.emit('activeUsers', Array.from(activeUsers.values()));
  });


  socket.on('sendMessage', (messageData) => {
    const user = activeUsers.get(socket.id);
    if (!user) return;

    const message = {
      id: Date.now(),
      sender: user.username,
      message: messageData.message,
      timestamp: new Date(),
      avatar: user.avatar
    };


    const query = 'INSERT INTO messages (sender, message, timestamp, avatar) VALUES (?, ?, ?, ?)';
    db.query(query, [message.sender, message.message, message.timestamp, message.avatar], (err, result) => {
      if (err) {
        console.error('Error saving message:', err);
        return;
      }
      
      message.id = result.insertId;
      
     
      io.emit('newMessage', message);
    });
  });

  
  socket.on('disconnect', () => {
    const user = activeUsers.get(socket.id);
    if (user) {
      activeUsers.delete(socket.id);
      socket.broadcast.emit('userLeft', {
        username: user.username,
        message: `${user.username} left the chat`
      });
    }
    console.log('Client disconnected:', socket.id);
  });
});




app.get('/api/messages', (req, res) => {
  const query = 'SELECT * FROM messages ORDER BY timestamp ASC LIMIT 100';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching messages:', err);
      res.status(500).json({ error: 'Failed to fetch messages' });
      return;
    }
    res.json(results);
  });
});


app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});