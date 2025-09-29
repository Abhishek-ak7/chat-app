class ChatApp {
    constructor() {
        this.socket = null;
        this.username = '';
        this.messagesContainer = document.getElementById('messagesContainer');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.usernameModal = document.getElementById('usernameModal');
        this.usernameInput = document.getElementById('usernameInput');
        this.joinChatBtn = document.getElementById('joinChatBtn');
        this.loading = document.getElementById('loading');
        
        this.init();
    }

    init() {
        // Show username modal first
        this.showUsernameModal();
        
        // Event listeners
        this.joinChatBtn.addEventListener('click', () => this.joinChat());
        this.usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.joinChat();
        });
        
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
        
        // Auto-resize input and enable/disable send button
        this.messageInput.addEventListener('input', () => {
            this.sendBtn.disabled = !this.messageInput.value.trim();
        });
    }

    showUsernameModal() {
        this.usernameModal.style.display = 'flex';
        this.usernameInput.focus();
    }

    hideUsernameModal() {
        this.usernameModal.style.display = 'none';
    }

    showLoading() {
        this.loading.style.display = 'flex';
    }

    hideLoading() {
        this.loading.style.display = 'none';
    }

    async joinChat() {
        const username = this.usernameInput.value.trim();
        if (!username) {
            alert('Please enter your name');
            return;
        }

        this.username = username;
        this.hideUsernameModal();
        this.showLoading();

        try {
            await this.connectToServer();
            await this.loadChatHistory();
            this.hideLoading();
        } catch (error) {
            console.error('Failed to join chat:', error);
            alert('Failed to connect to chat. Please try again.');
            this.showUsernameModal();
            this.hideLoading();
        }
    }

    connectToServer() {
        return new Promise((resolve, reject) => {
            this.socket = io('http://localhost:3000');

            this.socket.on('connect', () => {
                console.log('Connected to server');
                
                // Join the chat
                this.socket.emit('join', {
                    username: this.username,
                    avatar: this.generateAvatar()
                });
                
                resolve();
            });

            this.socket.on('connect_error', (error) => {
                reject(error);
            });

            // Listen for new messages
            this.socket.on('newMessage', (message) => {
                this.displayMessage(message);
            });

            // Listen for system messages
            this.socket.on('userJoined', (data) => {
                this.displaySystemMessage(data.message);
            });

            this.socket.on('userLeft', (data) => {
                this.displaySystemMessage(data.message);
            });

            // Update online users count
            this.socket.on('activeUsers', (users) => {
                this.updateOnlineCount(users.length);
            });
        });
    }

    async loadChatHistory() {
        try {
            const response = await fetch('http://localhost:3000/api/messages');
            const messages = await response.json();
            
            // Clear existing messages except date separator
            const dateSeperator = this.messagesContainer.querySelector('.date-separator');
            this.messagesContainer.innerHTML = '';
            if (dateSeperator) {
                this.messagesContainer.appendChild(dateSeperator);
            }
            
            // Display historical messages
            messages.forEach(message => {
                this.displayMessage({
                    ...message,
                    timestamp: new Date(message.timestamp)
                }, false); // false = don't scroll to bottom for historical messages
            });
            
            // Scroll to bottom after loading all messages
            this.scrollToBottom();
            
        } catch (error) {
            console.error('Failed to load chat history:', error);
        }
    }

    sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message || !this.socket) return;

        this.socket.emit('sendMessage', { message });
        this.messageInput.value = '';
        this.sendBtn.disabled = true;
    }

    displayMessage(message, shouldScroll = true) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.sender === this.username ? 'own' : ''}`;
        
        const isOwnMessage = message.sender === this.username;
        const time = this.formatTime(message.timestamp);
        
        messageDiv.innerHTML = `
            ${!isOwnMessage ? `
                <div class="message-avatar">
                    <img src="${message.avatar || this.generateAvatar(message.sender)}" 
                         alt="${message.sender}" 
                         onerror="this.src='${this.generateAvatar(message.sender)}'">
                </div>
            ` : ''}
            <div class="message-bubble">
                ${!isOwnMessage ? `<div class="message-sender">${message.sender}</div>` : ''}
                <div class="message-content">
                    ${this.escapeHtml(message.message)}
                    <div class="message-time">${time}</div>
                </div>
            </div>
            ${isOwnMessage ? `
                <div class="message-avatar">
                    <img src="${message.avatar || this.generateAvatar(message.sender)}" 
                         alt="${message.sender}"
                         onerror="this.src='${this.generateAvatar(message.sender)}'">
                </div>
            ` : ''}
        `;
        
        this.messagesContainer.appendChild(messageDiv);
        
        if (shouldScroll) {
            this.scrollToBottom();
        }
    }

    displaySystemMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'system-message';
        messageDiv.textContent = message;
        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    scrollToBottom() {
        setTimeout(() => {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }, 100);
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
    }

    generateAvatar(username = this.username) {
        // Generate a consistent color based on username
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
            '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43'
        ];
        
        const hash = username.split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
        }, 0);
        
        const color = colors[Math.abs(hash) % colors.length];
        const initial = username.charAt(0).toUpperCase();
        
        return `data:image/svg+xml,${encodeURIComponent(`
            <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="20" r="20" fill="${color}"/>
                <text x="20" y="28" font-family="Arial" font-size="16" font-weight="bold" 
                      text-anchor="middle" fill="white">${initial}</text>
            </svg>
        `)}`;
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, (m) => map[m]);
    }

    updateOnlineCount(count) {
        const onlineCountElement = document.querySelector('.online-count');
        if (onlineCountElement) {
            onlineCountElement.textContent = `${count} members online`;
        }
    }
}

// Initialize the chat app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ChatApp();
});