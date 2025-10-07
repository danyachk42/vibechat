// ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
const API_URL = 'http://localhost:3000/api';
let socket;
let currentUser = null;
let currentChat = null;
let chats = [];
let typingTimeout;

const emojis = {
    all: ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','🤩','😘','😗','☺️','😚','😙','🥲','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','😏','😒','🙄','😬','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🤧','🥵','🥶','🥴','😵','🤯','🤠','🥳','🥸','😎','🤓','🧐','😕','😟','🙁','☹️','😮','😯','😲','😳','🥺','😦','😧','😨','😰','😥','😢','😭','😱','😖','😣','😞','😓','😩','😫','🥱','😤','😡','😠','🤬','😈','👿','💀','☠️','💩','🤡','👹','👺','👻','👽','👾','🤖','❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','👍','👎','👊','✊','🤛','🤜','🤞','✌️','🤟','🤘','👌','🤌','🤏','👈','👉','👆','👇','☝️','✋','🤚','🖐️','🖖','👋','🤙','💪'],
    smileys: ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','🤩','😘','😗','☺️','😚','😙','🥲','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','😏','😒','🙄','😬','🤥'],
    animals: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐽','🐸','🐵','🙈','🙉','🙊','🐒','🐔','🐧','🐦','🐤','🐣','🐥','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🐛','🦋','🐌','🐞','🐜'],
    food: ['🍇','🍈','🍉','🍊','🍋','🍌','🍍','🥭','🍎','🍏','🍐','🍑','🍒','🍓','🥝','🍅','🥥','🥑','🍆','🥔','🥕','🌽','🌶️','🥒','🥬','🥦','🧄','🧅','🍄','🥜','🌰','🍞','🥐','🥖','🥨','🥯','🥞','🧇','🧀','🍖','🍗','🥩','🥓','🍔','🍟','🍕'],
    activities: ['⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏','🎱','🪀','🏓','🏸','🏒','🏑','🥍','🏏','🥅','⛳','🪁','🏹','🎣','🤿','🥊','🥋','🎽','🛹','🛷','⛸️','🥌','🎿','⛷️','🏂','🪂'],
    travel: ['🚗','🚕','🚙','🚌','🚎','🏎️','🚓','🚑','🚒','🚐','🚚','🚛','🚜','🦯','🦽','🦼','🛴','🚲','🛵','🏍️','🛺','🚨','🚔','🚍','🚘','🚖','🚡','🚠','🚟','🚃','🚋','🚞','🚝','🚄','🚅','🚈','🚂','🚆','🚇','🚊','🚉','✈️'],
    objects: ['⌚','📱','📲','💻','⌨️','🖥️','🖨️','🖱️','🖲️','🕹️','🗜️','💾','💿','📀','📼','📷','📸','📹','🎥','📽️','🎞️','📞','☎️','📟','📠','📺','📻','🎙️','🎚️','🎛️','🧭','⏱️','⏲️','⏰','🕰️','⌛','⏳','📡','🔋','🔌','💡','🔦'],
    symbols: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','☮️','✝️','☪️','🕉️','☸️','✡️','🔯','🕎','☯️','☦️','🛐','⛎','♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓']
};

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 VibeChat загружается...');
    checkAuth();
    initEventListeners();
    initEmojiPicker();
});

function checkAuth() {
    const token = localStorage.getItem('vibechat_token');
    const user = localStorage.getItem('vibechat_user');
    
    if (token && user) {
        try {
            currentUser = JSON.parse(user);
            showApp();
        } catch (error) {
            localStorage.clear();
        }
    }
}

function initEventListeners() {
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    const codeInputs = document.querySelectorAll('.code-input');
    codeInputs.forEach((input, index) => {
        input.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '');
            if (this.value.length === 1 && index < codeInputs.length - 1) {
                codeInputs[index + 1].focus();
            }
        });
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Backspace' && this.value === '' && index > 0) {
                codeInputs[index - 1].focus();
            }
        });
    });
    
    document.getElementById('contactSearch').addEventListener('input', debounce(searchContacts, 500));
    document.getElementById('chatSearchInput').addEventListener('input', function() {
        filterChats(this.value.toLowerCase());
    });
    
    const messageInput = document.getElementById('messageInput');
    messageInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 120) + 'px';
        
        const sendBtn = document.getElementById('sendBtn');
        const voiceBtn = document.getElementById('voiceBtn');
        if (this.value.trim()) {
            sendBtn.style.display = 'flex';
            voiceBtn.style.display = 'none';
        } else {
            sendBtn.style.display = 'none';
            voiceBtn.style.display = 'flex';
        }
        
        if (currentChat && socket) {
            socket.emit('typing', {
                chatId: currentChat.id,
                userId: currentUser.id,
                username: currentUser.name
            });
            clearTimeout(typingTimeout);
            typingTimeout = setTimeout(() => {
                socket.emit('stop_typing', { chatId: currentChat.id, userId: currentUser.id });
            }, 1000);
        }
    });
    
    messageInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!isMessageSending) sendMessage();
        }
    });
    
    document.getElementById('emojiSearch').addEventListener('input', function() {
        filterEmojisBySearch(this.value.toLowerCase());
    });
}

function showApp() {
    document.getElementById('registerModal').classList.remove('active');
    document.getElementById('verifyModal').classList.remove('active');
    document.getElementById('loginModal').classList.remove('active');
    document.getElementById('app').classList.remove('hidden');

    socket = io('http://localhost:3000');
    socket.on('connect', () => console.log('✅ WebSocket подключен'));
    socket.on('new_message', (message) => {
        if (currentChat && message.chatId === currentChat.id) {
            addMessageToUI(message);
        }
        updateChatPreview(message);
    });
    socket.on('user_typing', (data) => {
        if (currentChat && data.userId !== currentUser.id) {
            showTypingIndicator(data.username);
        }
    });
    socket.on('user_stop_typing', (data) => {
        if (currentChat && data.userId !== currentUser.id) {
            hideTypingIndicator();
        }
    });
    socket.on('message_deleted', (data) => {
        const messageEl = document.querySelector(`[data-message-id="${data.messageId}"]`);
        if (messageEl) {
            messageEl.style.animation = 'messageSlideOut 0.3s ease';
            setTimeout(() => messageEl.remove(), 300);
        }
    });

    updateUserProfile();
    loadChats();
}

function updateUserProfile() {
    document.getElementById('userName').textContent = currentUser.name;
    document.getElementById('userStatus').textContent = currentUser.status || 'Привет! Я использую VibeChat 👋';
    document.getElementById('userAvatarText').textContent = currentUser.name[0].toUpperCase();
    
    if (currentUser.avatarUrl) {
        document.getElementById('userAvatarImg').src = currentUser.avatarUrl;
        document.getElementById('userAvatarImg').style.display = 'block';
        document.getElementById('userAvatarText').style.display = 'none';
    }
}

async function loadChats() {
    try {
        const response = await fetch(`${API_URL}/chats/${currentUser.id}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('vibechat_token')}` }
        });
        const data = await response.json();
        chats = data.chats || [];
        renderChats(chats);
    } catch (error) {
        showToast('Ошибка загрузки чатов', 'error');
    }
}

function renderChats(chatsToRender) {
    const chatsList = document.getElementById('chatsList');
    
    if (chatsToRender.length === 0) {
        chatsList.innerHTML = `
            <div style="padding: 40px 24px; text-align: center; color: var(--text-secondary);">
                <i class="fas fa-inbox" style="font-size: 48px; opacity: 0.3; margin-bottom: 16px;"></i>
                <p style="font-size: 16px; font-weight: 600;">Нет чатов</p>
                <p style="font-size: 13px; margin-top: 8px;">Нажмите + чтобы начать общение</p>
            </div>
        `;
        return;
    }

    chatsList.innerHTML = chatsToRender.map(chat => {
        const isGroup = chat.type === 'group';
        const isChannel = chat.type === 'channel';
        const avatarClass = isGroup ? 'group' : (isChannel ? 'channel' : '');
        const badgeIcon = isGroup ? '<i class="fas fa-users chat-badge-icon"></i>' : (isChannel ? '<i class="fas fa-bullhorn chat-badge-icon"></i>' : '');
        
        return `
            <div class="chat-item ${currentChat && currentChat.id === chat.id ? 'active' : ''}" 
                 onclick="openChat('${chat.id}')"
                 oncontextmenu="showChatContextMenu(event, '${chat.id}')">
                <div class="chat-avatar ${avatarClass} ${chat.contact?.online ? 'online' : ''}">
                    ${chat.contact?.avatar || chat.name?.[0]?.toUpperCase() || 'G'}
                </div>
                <div class="chat-info">
                    <div class="chat-header">
                        <div class="chat-name">
                            ${badgeIcon}
                            ${chat.contact?.name || chat.name || 'Группа'}
                        </div>
                        <div class="chat-time">${chat.lastMessageTime ? formatTime(chat.lastMessageTime) : ''}</div>
                    </div>
                    <div class="chat-preview">${chat.lastMessage || 'Нет сообщений'}</div>
                </div>
                ${chat.unreadCount > 0 ? `<div class="chat-badge">${chat.unreadCount}</div>` : ''}
            </div>
        `;
    }).join('');
}

function showChatContextMenu(event, chatId) {
    event.preventDefault();
    event.stopPropagation();
    
    const items = [
        { icon: 'fa-thumbtack', label: 'Закрепить', action: `pinChat('${chatId}')` },
        { icon: 'fa-archive', label: 'Архивировать', action: `archiveChat('${chatId}')` },
        { icon: 'fa-bell-slash', label: 'Отключить уведомления', action: `muteChat('${chatId}')` },
        { divider: true },
        { icon: 'fa-trash', label: 'Удалить чат', action: `deleteChat('${chatId}')`, danger: true }
    ];
    
    createContextMenu(event.pageX, event.pageY, items);
}

function pinChat(chatId) {
    showToast('📌 Чат закреплен', 'success');
}

function archiveChat(chatId) {
    showToast('📦 Чат архивирован', 'success');
}

function muteChat(chatId) {
    showToast('🔕 Уведомления отключены', 'success');
}

function deleteChat(chatId) {
    if (confirm('Удалить этот чат?')) {
        chats = chats.filter(c => c.id !== chatId);
        renderChats(chats);
        showToast('✅ Чат удален', 'success');
    }
}

async function openChat(chatId) {
    const chat = chats.find(c => c.id === chatId);
    if (!chat) return;

    currentChat = chat;

    document.getElementById('emptyState').classList.add('hidden');
    document.getElementById('activeChat').classList.remove('hidden');

    const chatName = chat.contact?.name || chat.name || 'Группа';
    document.getElementById('activeChatName').textContent = chatName;
    
    // Клик по имени чата открывает профиль
    document.getElementById('activeChatName').style.cursor = 'pointer';
    document.getElementById('activeChatName').onclick = () => {
        if (chat.contact?.id) {
            openUserProfile(chat.contact.id);
        }
    };
    
    const avatarText = chat.contact?.avatar || chat.name?.[0]?.toUpperCase() || 'G';
    document.getElementById('activeChatAvatarText').textContent = avatarText;
    
    if (chat.contact?.avatarUrl) {
        document.getElementById('activeChatAvatarImg').src = chat.contact.avatarUrl;
        document.getElementById('activeChatAvatarImg').style.display = 'block';
        document.getElementById('activeChatAvatarText').style.display = 'none';
    }
    
    const statusEl = document.getElementById('activeChatStatus');
    if (chat.type === 'group') {
        statusEl.textContent = `${chat.membersCount || 0} участников`;
        statusEl.classList.remove('online');
    } else if (chat.type === 'channel') {
        statusEl.textContent = `${chat.subscribersCount || 0} подписчиков`;
        statusEl.classList.remove('online');
    } else if (chat.contact?.online) {
        statusEl.textContent = 'в сети';
        statusEl.classList.add('online');
    } else {
        statusEl.textContent = chat.contact?.lastSeen ? `был(а) ${formatTime(chat.contact.lastSeen)}` : 'был(а) недавно';
        statusEl.classList.remove('online');
    }

    if (socket) socket.emit('join_chat', chatId);
    await loadMessages(chatId);
    renderChats(chats);
}

function toggleCreateMenu() {
    document.getElementById('createMenu').classList.toggle('active');
}

function openAddContact() {
    document.getElementById('createMenu').classList.remove('active');
    document.getElementById('addContactModal').classList.add('active');
    document.getElementById('contactSearch').value = '';
    document.getElementById('searchResults').innerHTML = '';
}

function closeAddContact() {
    document.getElementById('addContactModal').classList.remove('active');
}

async function searchContacts() {
    const query = document.getElementById('contactSearch').value.trim();
    const resultsDiv = document.getElementById('searchResults');

    if (query.length < 2) {
        resultsDiv.innerHTML = '';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/users/search?query=${encodeURIComponent(query)}`, {
            headers: {
                'user-id': currentUser.id,
                'Authorization': `Bearer ${localStorage.getItem('vibechat_token')}`
            }
        });

        const data = await response.json();
        const users = data.users || [];

        if (users.length === 0) {
            resultsDiv.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">Пользователи не найдены</p>';
            return;
        }

        resultsDiv.innerHTML = users.map(user => `
            <div class="chat-item" onclick="createChatWithUser('${user.id}')">
                <div class="chat-avatar ${user.online ? 'online' : ''}">
                    ${user.avatar || user.name[0].toUpperCase()}
                </div>
                <div class="chat-info">
                    <div class="chat-name">${user.name}</div>
                    <div class="chat-preview">@${user.username}</div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        showToast('Ошибка поиска пользователей', 'error');
    }
}

async function createChatWithUser(contactId) {
    try {
        const response = await fetch(`${API_URL}/chats/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('vibechat_token')}`
            },
            body: JSON.stringify({ userId: currentUser.id, contactId: contactId })
        });

        const data = await response.json();

        if (response.ok) {
            closeAddContact();
            showToast('✅ Чат создан!', 'success');
            await loadChats();
            openChat(data.chatId);
        } else {
            showToast(data.error || 'Ошибка создания чата', 'error');
        }
    } catch (error) {
        showToast('Ошибка создания чата', 'error');
    }
}

function filterChats(query) {
    if (!query) {
        renderChats(chats);
        return;
    }

    const filtered = chats.filter(chat => {
        const name = chat.contact?.name || chat.name || '';
        const username = chat.contact?.username || '';
        const lastMessage = chat.lastMessage || '';
        
        return name.toLowerCase().includes(query) ||
               username.toLowerCase().includes(query) ||
               lastMessage.toLowerCase().includes(query);
    });

    renderChats(filtered);
}

function showTypingIndicator(username) {
    const indicator = document.getElementById('typingIndicator');
    document.getElementById('typingUsername').textContent = `${username} печатает...`;
    indicator.classList.add('active');
}

function hideTypingIndicator() {
    document.getElementById('typingIndicator').classList.remove('active');
}

function updateChatPreview(message) {
    const chat = chats.find(c => c.id === message.chatId);
    if (chat) {
        chat.lastMessage = message.text || 'Медиа';
        chat.lastMessageTime = message.timestamp;
        if (message.senderId !== currentUser.id) {
            chat.unreadCount = (chat.unreadCount || 0) + 1;
        }
        renderChats(chats);
    }
}

function initEmojiPicker() {
    const emojiGrid = document.getElementById('emojiGrid');
    emojiGrid.innerHTML = emojis.all.map(emoji => 
        `<div class="emoji-item" onclick="insertEmoji('${emoji}')">${emoji}</div>`
    ).join('');
}

function toggleEmojiPicker() {
    document.getElementById('emojiPicker').classList.toggle('active');
}

function filterEmojis(category) {
    document.querySelectorAll('.emoji-category').forEach(cat => cat.classList.remove('active'));
    event.target.classList.add('active');
    
    const emojiGrid = document.getElementById('emojiGrid');
    const emojisToShow = emojis[category] || emojis.all;
    emojiGrid.innerHTML = emojisToShow.map(emoji => 
        `<div class="emoji-item" onclick="insertEmoji('${emoji}')">${emoji}</div>`
    ).join('');
}

function filterEmojisBySearch(query) {
    if (!query) {
        initEmojiPicker();
        return;
    }
    
    const emojiGrid = document.getElementById('emojiGrid');
    const filtered = emojis.all.filter(emoji => emoji.includes(query));
    emojiGrid.innerHTML = filtered.map(emoji => 
        `<div class="emoji-item" onclick="insertEmoji('${emoji}')">${emoji}</div>`
    ).join('');
}

function insertEmoji(emoji) {
    const input = document.getElementById('messageInput');
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const text = input.value;
    input.value = text.substring(0, start) + emoji + text.substring(end);
    input.selectionStart = input.selectionEnd = start + emoji.length;
    input.focus();
    input.dispatchEvent(new Event('input'));
}

function startVoiceCall() {
    showToast('📞 Голосовые звонки (в разработке)', 'success');
}

function startVideoCall() {
    showToast('📹 Видео звонки (в разработке)', 'success');
}

function openChatInfo() {
    showToast('ℹ️ Информация о чате (в разработке)', 'success');
}

console.log('✅ app.js загружен');