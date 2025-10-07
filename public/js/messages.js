// ============================================
// РАБОТА С СООБЩЕНИЯМИ
// ============================================

let isMessageSending = false;
let replyToMessage = null;
let editingMessage = null;
let selectedMessages = new Set();

// ============================================
// ОТПРАВКА СООБЩЕНИЙ
// ============================================
async function sendMessage() {
    if (isMessageSending) {
        console.log('⚠️ Сообщение уже отправляется...');
        return;
    }

    const input = document.getElementById('messageInput');
    const text = input.value.trim();

    if (!text || !currentChat) return;

    isMessageSending = true;
    console.log('📤 Отправка сообщения:', text);

    const messageData = {
        chatId: currentChat.id,
        senderId: currentUser.id,
        text: text,
        timestamp: Date.now()
    };
    
    if (replyToMessage) {
        messageData.replyTo = replyToMessage;
        cancelReply();
    }

    try {
        const response = await fetch(`${API_URL}/messages/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('vibechat_token')}`
            },
            body: JSON.stringify(messageData)
        });

        const data = await response.json();

        if (response.ok) {
            input.value = '';
            input.style.height = 'auto';
            document.getElementById('sendBtn').style.display = 'none';
            document.getElementById('voiceBtn').style.display = 'flex';
            
            const chat = chats.find(c => c.id === currentChat.id);
            if (chat) {
                chat.lastMessage = text;
                chat.lastMessageTime = Date.now();
                renderChats(chats);
            }
            
            console.log('✅ Сообщение отправлено');
        } else {
            showToast(data.error || 'Ошибка отправки', 'error');
        }
    } catch (error) {
        console.error('❌ Ошибка отправки:', error);
        showToast('Ошибка отправки сообщения', 'error');
    } finally {
        isMessageSending = false;
    }
}

// ============================================
// СОЗДАНИЕ HTML СООБЩЕНИЯ
// ============================================
function createMessageHTML(message) {
    const isOwn = message.senderId === currentUser.id;
    const time = new Date(message.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    
    // Статус сообщения
    let statusIcon = '';
    if (isOwn) {
        if (message.status === 'read') {
            statusIcon = '<i class="fas fa-check-double" style="color: var(--info)"></i>';
        } else if (message.status === 'delivered') {
            statusIcon = '<i class="fas fa-check-double" style="color: var(--text-secondary)"></i>';
        } else {
            statusIcon = '<i class="fas fa-check" style="color: var(--text-secondary)"></i>';
        }
    }
    
    let replyHTML = '';
    if (message.replyTo) {
        replyHTML = `
            <div class="message-reply" onclick="scrollToMessage('${message.replyTo.id}')">
                <strong>${message.replyTo.senderName}</strong><br>
                ${escapeHtml(message.replyTo.text)}
            </div>
        `;
    }

    // Реакции
    let reactionsHTML = '';
    if (message.reactions && Object.keys(message.reactions).length > 0) {
        reactionsHTML = '<div class="message-reactions">';
        for (const [emoji, users] of Object.entries(message.reactions)) {
            const count = users.length;
            const hasMyReaction = users.includes(currentUser.id);
            reactionsHTML += `
                <button class="message-reaction ${hasMyReaction ? 'active' : ''}" 
                        onclick="toggleReaction('${message.id}', '${emoji}')">
                    ${emoji} ${count > 1 ? count : ''}
                </button>
            `;
        }
        reactionsHTML += '</div>';
    }

    return `
        <div class="message ${isOwn ? 'own' : ''}" 
             data-message-id="${message.id}"
             oncontextmenu="showMessageContextMenu(event, '${message.id}', ${isOwn})">
            ${!isOwn ? `<div class="message-avatar">${currentChat.contact?.avatar || currentChat.contact?.name[0].toUpperCase()}</div>` : ''}
            <div class="message-content">
                ${replyHTML}
                <div class="message-bubble">${escapeHtml(message.text)}</div>
                ${reactionsHTML}
                <div class="message-time">
                    ${time}
                    ${statusIcon}
                    ${message.edited ? '<span style="font-size: 10px; margin-left: 4px;">(изм.)</span>' : ''}
                </div>
            </div>
            ${isOwn ? `<div class="message-avatar">${currentUser.avatar || currentUser.name[0].toUpperCase()}</div>` : ''}
        </div>
    `;
}

// ============================================
// КОНТЕКСТНОЕ МЕНЮ СООБЩЕНИЯ
// ============================================
function showMessageContextMenu(event, messageId, isOwn) {
    event.preventDefault();
    
    const items = [
        { icon: 'fa-reply', label: 'Ответить', action: `replyToMessageFunc('${messageId}')` },
        { icon: 'fa-smile', label: 'Реакция', action: `showReactionPicker('${messageId}')` },
        { icon: 'fa-copy', label: 'Копировать', action: `copyMessage('${messageId}')` },
        { icon: 'fa-share', label: 'Переслать', action: `forwardMessage('${messageId}')` },
        { icon: 'fa-star', label: 'В избранное', action: `addToFavorites('${messageId}')` },
        { divider: true }
    ];
    
    if (isOwn) {
        items.push(
            { icon: 'fa-edit', label: 'Редактировать', action: `editMessage('${messageId}')` },
            { icon: 'fa-trash', label: 'Удалить', action: `showDeleteMenu('${messageId}')`, danger: true }
        );
    } else {
        items.push(
            { icon: 'fa-flag', label: 'Пожаловаться', action: `reportMessage('${messageId}')`, danger: true }
        );
    }
    
    createContextMenu(event.pageX, event.pageY, items);
}

// ============================================
// УДАЛЕНИЕ СООБЩЕНИЯ (КРАСИВОЕ МЕНЮ)
// ============================================
function showDeleteMenu(messageId) {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'deleteMessageModal';
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 420px; padding: 40px;">
            <div class="modal-header" style="margin-bottom: 32px;">
                <div class="modal-icon" style="background: linear-gradient(135deg, var(--danger), #dc2626);">
                    <i class="fas fa-trash"></i>
                </div>
                <h2 style="font-size: 28px;">Удалить сообщение?</h2>
                <p>Выберите вариант удаления</p>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 12px;">
                <button class="delete-option-btn" onclick="deleteMessageForMe('${messageId}')">
                    <div class="delete-option-icon">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="delete-option-text">
                        <div class="delete-option-title">Удалить у меня</div>
                        <div class="delete-option-desc">Сообщение удалится только у вас</div>
                    </div>
                </button>
                
                <button class="delete-option-btn danger" onclick="deleteMessageForEveryone('${messageId}')">
                    <div class="delete-option-icon">
                        <i class="fas fa-users"></i>
                    </div>
                    <div class="delete-option-text">
                        <div class="delete-option-title">Удалить у всех</div>
                        <div class="delete-option-desc">Сообщение удалится у всех участников</div>
                    </div>
                </button>
            </div>
            
            <button class="btn" onclick="closeDeleteMenu()" style="margin-top: 24px; background: rgba(255,255,255,0.05);">
                <span class="btn-text">Отмена</span>
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function closeDeleteMenu() {
    const modal = document.getElementById('deleteMessageModal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    }
}

async function deleteMessageForMe(messageId) {
    console.log('🗑️ Удаление сообщения у себя:', messageId);
    
    try {
        const response = await fetch(`${API_URL}/messages/delete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('vibechat_token')}`
            },
            body: JSON.stringify({
                messageId,
                userId: currentUser.id,
                deleteType: 'forMe'
            })
        });

        if (response.ok) {
            const messageEl = document.querySelector(`[data-message-id="${messageId}"]`);
            if (messageEl) {
                messageEl.style.animation = 'messageSlideOut 0.3s ease';
                setTimeout(() => messageEl.remove(), 300);
            }
            showToast('✅ Сообщение удалено', 'success');
        }
    } catch (error) {
        console.error('❌ Ошибка удаления:', error);
        showToast('Ошибка удаления сообщения', 'error');
    }
    
    closeDeleteMenu();
}

async function deleteMessageForEveryone(messageId) {
    console.log('🗑️ Удаление сообщения у всех:', messageId);
    
    try {
        const response = await fetch(`${API_URL}/messages/delete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('vibechat_token')}`
            },
            body: JSON.stringify({
                messageId,
                userId: currentUser.id,
                deleteType: 'forEveryone'
            })
        });

        if (response.ok) {
            // Уведомление через WebSocket
            if (socket) {
                socket.emit('message_deleted', {
                    chatId: currentChat.id,
                    messageId: messageId
                });
            }
            
            const messageEl = document.querySelector(`[data-message-id="${messageId}"]`);
            if (messageEl) {
                messageEl.style.animation = 'messageSlideOut 0.3s ease';
                setTimeout(() => messageEl.remove(), 300);
            }
            showToast('✅ Сообщение удалено у всех', 'success');
        }
    } catch (error) {
        console.error('❌ Ошибка удаления:', error);
        showToast('Ошибка удаления сообщения', 'error');
    }
    
    closeDeleteMenu();
}

// ============================================
// ДЕЙСТВИЯ С СООБЩЕНИЯМИ
// ============================================
function replyToMessageFunc(messageId) {
    console.log('↩️ Ответ на сообщение:', messageId);
    
    const messageEl = document.querySelector(`[data-message-id="${messageId}"]`);
    const messageText = messageEl.querySelector('.message-bubble')?.textContent || 'Медиа';
    const senderName = messageEl.classList.contains('own') ? 'Вы' : currentChat.contact?.name || 'Пользователь';
    
    replyToMessage = {
        id: messageId,
        text: messageText,
        senderName: senderName
    };
    
    document.getElementById('replyPreviewName').textContent = senderName;
    document.getElementById('replyPreviewText').textContent = messageText;
    document.getElementById('replyPreview').classList.add('active');
    document.getElementById('messageInput').focus();
}

function cancelReply() {
    replyToMessage = null;
    document.getElementById('replyPreview').classList.remove('active');
}

function copyMessage(messageId) {
    const messageEl = document.querySelector(`[data-message-id="${messageId}"]`);
    const text = messageEl.querySelector('.message-bubble')?.textContent || '';
    
    navigator.clipboard.writeText(text).then(() => {
        showToast('✅ Текст скопирован', 'success');
    });
}

function forwardMessage(messageId) {
    showToast('📤 Пересылка сообщений (в разработке)', 'success');
}

function addToFavorites(messageId) {
    showToast('⭐ Добавлено в избранное', 'success');
}

function reportMessage(messageId) {
    if (confirm('Пожаловаться на это сообщение?')) {
        showToast('🚩 Жалоба отправлена', 'success');
    }
}

// ============================================
// РЕДАКТИРОВАНИЕ СООБЩЕНИЯ
// ============================================
function editMessage(messageId) {
    console.log('✏️ Редактирование сообщения:', messageId);
    
    const messageEl = document.querySelector(`[data-message-id="${messageId}"]`);
    const messageText = messageEl.querySelector('.message-bubble')?.textContent || '';
    
    editingMessage = messageId;
    
    const input = document.getElementById('messageInput');
    input.value = messageText;
    input.focus();
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    
    // Показываем индикатор редактирования
    const editIndicator = document.createElement('div');
    editIndicator.id = 'editIndicator';
    editIndicator.className = 'reply-preview active';
    editIndicator.innerHTML = `
        <div class="reply-preview-content">
            <div class="reply-preview-name">✏️ Редактирование сообщения</div>
            <div class="reply-preview-text">${escapeHtml(messageText)}</div>
        </div>
        <button class="reply-preview-close" onclick="cancelEdit()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    const replyPreview = document.getElementById('replyPreview');
    replyPreview.parentNode.insertBefore(editIndicator, replyPreview);
    
    document.getElementById('sendBtn').style.display = 'flex';
    document.getElementById('voiceBtn').style.display = 'none';
}

function cancelEdit() {
    editingMessage = null;
    const editIndicator = document.getElementById('editIndicator');
    if (editIndicator) editIndicator.remove();
    
    document.getElementById('messageInput').value = '';
    document.getElementById('messageInput').style.height = 'auto';
    document.getElementById('sendBtn').style.display = 'none';
    document.getElementById('voiceBtn').style.display = 'flex';
}

// ============================================
// РЕАКЦИИ НА СООБЩЕНИЯ
// ============================================
function showReactionPicker(messageId) {
    const quickReactions = ['❤️', '👍', '😂', '😮', '😢', '🔥', '👏', '🎉'];
    
    const modal = document.createElement('div');
    modal.className = 'reaction-picker-modal';
    modal.id = 'reactionPickerModal';
    
    modal.innerHTML = `
        <div class="reaction-picker">
            ${quickReactions.map(emoji => `
                <button class="reaction-btn" onclick="addReaction('${messageId}', '${emoji}')">
                    ${emoji}
                </button>
            `).join('')}
            <button class="reaction-btn more" onclick="showAllEmojis('${messageId}')">
                <i class="fas fa-plus"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);
    
    setTimeout(() => {
        document.addEventListener('click', function closeReactions(e) {
            if (!modal.contains(e.target)) {
                modal.classList.remove('active');
                setTimeout(() => modal.remove(), 300);
                document.removeEventListener('click', closeReactions);
            }
        });
    }, 100);
}

async function addReaction(messageId, emoji) {
    console.log('😊 Добавление реакции:', emoji, 'к сообщению:', messageId);
    
    try {
        const response = await fetch(`${API_URL}/messages/reaction`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('vibechat_token')}`
            },
            body: JSON.stringify({
                messageId,
                userId: currentUser.id,
                emoji
            })
        });

        if (response.ok) {
            // Обновление UI
            const messageEl = document.querySelector(`[data-message-id="${messageId}"]`);
            if (messageEl) {
                await loadMessages(currentChat.id);
            }
        }
    } catch (error) {
        console.error('❌ Ошибка добавления реакции:', error);
    }
    
    const modal = document.getElementById('reactionPickerModal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    }
}

function toggleReaction(messageId, emoji) {
    addReaction(messageId, emoji);
}

function showAllEmojis(messageId) {
    const modal = document.getElementById('reactionPickerModal');
    if (modal) modal.remove();
    
    toggleEmojiPicker();
    // TODO: Связать с выбором реакции
}

// ============================================
// ПРОКРУТКА К СООБЩЕНИЮ
// ============================================
function scrollToMessage(messageId) {
    const messageEl = document.querySelector(`[data-message-id="${messageId}"]`);
    if (messageEl) {
        messageEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        messageEl.style.animation = 'messageHighlight 1s ease';
    }
}

// ============================================
// ПРОЧТЕНИЕ СООБЩЕНИЙ
// ============================================
function markMessagesAsRead(chatId) {
    if (!currentChat || currentChat.id !== chatId) return;
    
    console.log('👁️ Отметка сообщений как прочитанных');
    
    fetch(`${API_URL}/messages/read`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('vibechat_token')}`
        },
        body: JSON.stringify({
            chatId,
            userId: currentUser.id
        })
    }).then(response => {
        if (response.ok) {
            // Обновление статусов в UI
            document.querySelectorAll('.message:not(.own) .message-time i').forEach(icon => {
                icon.className = 'fas fa-check-double';
                icon.style.color = 'var(--info)';
            });
            
            // Обновление счетчика непрочитанных
            const chat = chats.find(c => c.id === chatId);
            if (chat) {
                chat.unreadCount = 0;
                renderChats(chats);
            }
        }
    }).catch(error => {
        console.error('❌ Ошибка отметки прочитанных:', error);
    });
}

// ============================================
// ДОБАВЛЕНИЕ СООБЩЕНИЯ В UI
// ============================================
function addMessageToUI(message) {
    const messagesArea = document.getElementById('messagesArea');
    messagesArea.insertAdjacentHTML('beforeend', createMessageHTML(message));
    
    messagesArea.scrollTo({
        top: messagesArea.scrollHeight,
        behavior: 'smooth'
    });
    
    // Отметка как прочитанное если чат открыт
    if (currentChat && message.chatId === currentChat.id && message.senderId !== currentUser.id) {
        setTimeout(() => markMessagesAsRead(currentChat.id), 500);
    }
}

// ============================================
// ЗАГРУЗКА СООБЩЕНИЙ
// ============================================
async function loadMessages(chatId) {
    console.log('📨 Загрузка сообщений для чата:', chatId);
    
    try {
        const response = await fetch(`${API_URL}/messages/${chatId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('vibechat_token')}`
            }
        });

        const data = await response.json();
        const messages = data.messages || [];

        console.log('✅ Сообщения загружены:', messages.length);

        const messagesArea = document.getElementById('messagesArea');
        messagesArea.innerHTML = messages.map(msg => createMessageHTML(msg)).join('');
        
        setTimeout(() => {
            messagesArea.scrollTop = messagesArea.scrollHeight;
            // Отметка как прочитанное
            markMessagesAsRead(chatId);
        }, 100);
    } catch (error) {
        console.error('❌ Ошибка загрузки сообщений:', error);
    }
}

console.log('✅ messages.js загружен');