-- Create database
CREATE DATABASE IF NOT EXISTS chat_app;
USE chat_app;

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    avatar VARCHAR(255) DEFAULT 'https://via.placeholder.com/40',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create users table (optional for future use)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    avatar VARCHAR(255) DEFAULT 'https://via.placeholder.com/40',
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample messages
INSERT INTO messages (sender, message, avatar) VALUES 
('Anonymous', 'Someone order Bornvita!!', 'https://via.placeholder.com/40'),
('Anonymous', 'hahahahah!!', 'https://via.placeholder.com/40'),
('Anonymous', 'I\'m Excited For this Event! Ho-Ho', 'https://via.placeholder.com/40'),
('Anonymous', 'Hi Guysss 😊', 'https://via.placeholder.com/40'),
('Anonymous', 'Hello!', 'https://via.placeholder.com/40'),
('Anonymous', 'Yessss!!!!!!', 'https://via.placeholder.com/40'),
('Kirtidan Gadhvi', 'We have Surprise For you!!', 'https://via.placeholder.com/40'),
('Abhay Shukla', 'We have Surprise For you!!', 'https://via.placeholder.com/40');