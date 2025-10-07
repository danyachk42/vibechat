// ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
// Автоматическое определение API URL
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api' 
    : `${window.location.origin}/api`;

const SOCKET_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:3000'
    : window.location.origin;

console.log('🌐 API URL:', API_URL);
console.log('🔌 Socket URL:', SOCKET_URL);

let socket;
let currentUser = null;
let currentChat = null;
let chats = [];
let typingTimeout;

const emojis = {
    all: ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','🤩','😘','😗','☺️','😚','😙','🥲','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','😏','😒','🙄','😬','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🤧','🥵','🥶','🥴','😵','🤯','🤠','🥳','🥸','😎','🤓','🧐','😕','😟','🙁','☹️','😮','😯','😲','😳','🥺','😦','😧','😨','😰','😥','😢','😭','😱','😖','😣','😞','😓','😩','😫','🥱','😤','😡','😠','🤬','😈','👿','💀','☠️','💩','🤡','👹','👺','👻','👽','👾','🤖','😺','😸','😹','😻','😼','😽','🙀','😿','😾'],
    smileys: ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','🤩','😘','😗','☺️','😚','😙','🥲','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔'],
    animals: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐽','🐸','🐵','🙈','🙉','🙊','🐒','🐔','🐧','🐦','🐤','🐣','🐥','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🐛','🦋','🐌','🐞','🐜','🦟','🦗','🕷️','🕸️','🦂','🐢','🐍','🦎','🦖','🦕','🐙','🦑','🦐','🦞','🦀','🐡','🐠','🐟','🐬','🐳','🐋','🦈','🐊','🐅','🐆','🦓','🦍','🦧','🐘','🦛','🦏','🐪','🐫','🦒','🦘','🐃','🐂','🐄','🐎','🐖','🐏','🐑','🦙','🐐','🦌','🐕','🐩','🦮','🐕‍🦺','🐈','🐓','🦃','🦚','🦜','🦢','🦩','🕊️','🐇','🦝','🦨','🦡','🦦','🦥','🐁','🐀','🐿️','🦔'],
    food: ['🍇','🍈','🍉','🍊','🍋','🍌','🍍','🥭','🍎','🍏','🍐','🍑','🍒','🍓','🥝','🍅','🥥','🥑','🍆','🥔','🥕','🌽','🌶️','🥒','🥬','🥦','🧄','🧅','🍄','🥜','🌰','🍞','🥐','🥖','🥨','🥯','🥞','🧇','🧀','🍖','🍗','🥩','🥓','🍔','🍟','🍕','🌭','🥪','🌮','🌯','🥙','🧆','🥚','🍳','🥘','🍲','🥣','🥗','🍿','🧈','🧂','🥫','🍱','🍘','🍙','🍚','🍛','🍜','🍝','🍠','🍢','🍣','🍤','🍥','🥮','🍡','🥟','🥠','🥡','🦀','🦞','🦐','🦑','🦪','🍦','🍧','🍨','🍩','🍪','🎂','🍰','🧁','🥧','🍫','🍬','🍭','🍮','🍯','🍼','🥛','☕','🍵','🍶','🍾','🍷','🍸','🍹','🍺','🍻','🥂','🥃','🥤','🧃','🧉','🧊'],
    activities: ['⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏','🎱','🪀','🏓','🏸','🏒','🏑','🥍','🏏','🥅','⛳','🪁','🏹','🎣','🤿','🥊','🥋','🎽','🛹','🛷','⛸️','🥌','🎿','⛷️','🏂','🪂','🏋️','🤼','🤸','🤺','🤾','🏌️','🏇','🧘','🏄','🏊','🤽','🚣','🧗','🚵','🚴','🏆','🥇','🥈','🥉','🏅','🎖️','🏵️','🎗️','🎫','🎟️','🎪','🤹','🎭','🩰','🎨','🎬','🎤','🎧','🎼','🎹','🥁','🎷','🎺','🎸','🪕','🎻','🎲','♟️','🎯','🎳','🎮','🎰','🧩'],
    travel: ['🚗','🚕','🚙','🚌','🚎','🏎️','🚓','🚑','🚒','🚐','🚚','🚛','🚜','🦯','🦽','🦼','🛴','🚲','🛵','🏍️','🛺','🚨','🚔','🚍','🚘','🚖','🚡','🚠','🚟','🚃','🚋','🚞','🚝','🚄','🚅','🚈','🚂','🚆','🚇','🚊','🚉','✈️','🛫','🛬','🛩️','💺','🛰️','🚀','🛸','🚁','🛶','⛵','🚤','🛥️','🛳️','⛴️','🚢','⚓','⛽','🚧','🚦','🚥','🚏','🗺️','🗿','🗽','🗼','🏰','🏯','🏟️','🎡','🎢','🎠','⛲','⛱️','🏖️','🏝️','🏜️','🌋','⛰️','🏔️','🗻','🏕️','⛺','🏠','🏡','🏘️','🏚️','🏗️','🏭','🏢','🏬','🏣','🏤','🏥','🏦','🏨','🏪','🏫','🏩','💒','🏛️','⛪','🕌','🕍','🛕','🕋','⛩️','🛤️','🛣️','🗾','🎑','🏞️','🌅','🌄','🌠','🎇','🎆','🌇','🌆','🏙️','🌃','🌌','🌉','🌁'],
    objects: ['⌚','📱','📲','💻','⌨️','🖥️','🖨️','🖱️','🖲️','🕹️','🗜️','💽','💾','💿','📀','📼','📷','📸','📹','🎥','📽️','🎞️','📞','☎️','📟','📠','📺','📻','🎙️','🎚️','🎛️','🧭','⏱️','⏲️','⏰','🕰️','⌛','⏳','📡','🔋','🔌','💡','🔦','🕯️','🪔','🧯','🛢️','💸','💵','💴','💶','💷','💰','💳','💎','⚖️','🧰','🔧','🔨','⚒️','🛠️','⛏️','🔩','⚙️','🧱','⛓️','🧲','🔫','💣','🧨','🪓','🔪','🗡️','⚔️','🛡️','🚬','⚰️','⚱️','🏺','🔮','📿','🧿','💈','⚗️','🔭','🔬','🕳️','🩹','🩺','💊','💉','🩸','🧬','🦠','🧫','🧪','🌡️','🧹','🧺','🧻','🚽','🚰','🚿','🛁','🛀','🧼','🪒','🧽','🧴','🛎️','🔑','🗝️','🚪','🪑','🛋️','🛏️','🛌','🧸','🖼️','🛍️','🛒','🎁','🎈','🎏','🎀','🎊','🎉','🎎','🏮','🎐','🧧','✉️','📩','📨','📧','💌','📥','📤','📦','🏷️','📪','📫','📬','📭','📮','📯','📜','📃','📄','📑','🧾','📊','📈','📉','🗒️','🗓️','📆','📅','🗑️','📇','🗃️','🗳️','🗄️','📋','📁','📂','🗂️','🗞️','📰','📓','📔','📒','📕','📗','📘','📙','📚','📖','🔖','🧷','🔗','📎','🖇️','📐','📏','🧮','📌','📍','✂️','🖊️','🖋️','✒️','🖌️','🖍️','📝','✏️','🔍','🔎','🔏','🔐','🔒','🔓'],
    symbols: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','☮️','✝️','☪️','🕉️','☸️','✡️','🔯','🕎','☯️','☦️','🛐','⛎','♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓','🆔','⚛️','🉑','☢️','☣️','📴','📳','🈶','🈚','🈸','🈺','🈷️','✴️','🆚','💮','🉐','㊙️','㊗️','🈴','🈵','🈹','🈲','🅰️','🅱️','🆎','🆑','🅾️','🆘','❌','⭕','🛑','⛔','📛','🚫','💯','💢','♨️','🚷','🚯','🚳','🚱','🔞','📵','🚭','❗','❕','❓','❔','‼️','⁉️','🔅','🔆','〽️','⚠️','🚸','🔱','⚜️','🔰','♻️','✅','🈯','💹','❇️','✳️','❎','🌐','💠','Ⓜ️','🌀','💤','🏧','🚾','♿','🅿️','🈳','🈂️','🛂','🛃','🛄','🛅','🚹','🚺','🚼','🚻','🚮','🎦','📶','🈁','🔣','ℹ️','🔤','🔡','🔠','🆖','🆗','🆙','🆒','🆕','🆓','0️⃣','1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟','🔢','#️⃣','*️⃣','⏏️','▶️','⏸️','⏯️','⏹️','⏺️','⏭️','⏮️','⏩','⏪','⏫','⏬','◀️','🔼','🔽','➡️','⬅️','⬆️','⬇️','↗️','↘️','↙️','↖️','↕️','↔️','↪️','↩️','⤴️','⤵️','🔀','🔁','🔂','🔄','🔃','🎵','🎶','➕','➖','➗','✖️','♾️','💲','💱','™️','©️','®️','〰️','➰','➿','🔚','🔙','🔛','🔝','🔜','✔️','☑️','🔘','🔴','🟠','🟡','🟢','🔵','🟣','⚫','⚪','🟤','🔺','🔻','🔸','🔹','🔶','🔷','🔳','🔲','▪️','▫️','◾','◽','◼️','◻️','🟥','🟧','🟨','🟩','🟦','🟪','⬛','⬜','🟫','🔈','🔇','🔉','🔊','🔔','🔕','📣','📢','👁️‍🗨️','💬','💭','🗯️','♠️','♣️','♥️','♦️','🃏','🎴','🀄','🕐','🕑','🕒','🕓','🕔','🕕','🕖','🕗','🕘','🕙','🕚','🕛','🕜','🕝','🕞','🕟','🕠','🕡','🕢','🕣','🕤','🕥','🕦','🕧']
};

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Приложение загружено');
    checkAuth();
    initializeEmojiPicker();
});

// Проверка авторизации
async function checkAuth() {
    console.log('🔍 Проверка авторизации...');
    
    // ИСПРАВЛЕНО: используем vibechat_token
    const token = localStorage.getItem('vibechat_token');
    const userStr = localStorage.getItem('vibechat_user');
    
    console.log('📦 Токен:', token ? 'Найден' : 'Не найден');
    console.log('👤 Пользователь:', userStr ? 'Найден' : 'Не найден');
    
    if (!token || !userStr) {
        console.log('❌ Нет токена или пользователя - показываем экран авторизации');
        showAuthScreen();
        return;
    }

    try {
        currentUser = JSON.parse(userStr);
        console.log('✅ Пользователь загружен из localStorage:', currentUser);
        
        // Проверяем токен на сервере
        const response = await fetch(`${API_URL}/auth/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const serverUser = await response.json();
            currentUser = serverUser;
            console.log('✅ Токен валиден, пользователь подтвержден');
            showApp();
        } else {
            console.log('❌ Токен невалиден');
            localStorage.removeItem('vibechat_token');
            localStorage.removeItem('vibechat_user');
            showAuthScreen();
        }
    } catch (error) {
        console.error('❌ Ошибка проверки авторизации:', error);
        showAuthScreen();
    }
}

// Показать экран авторизации
function showAuthScreen() {
    console.log('📱 Показываем экран авторизации');
    document.getElementById('authScreen').style.display = 'flex';
    document.getElementById('appScreen').style.display = 'none';
}

// Показать приложение
function showApp() {
    console.log('📱 Показываем приложение');
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('appScreen').style.display = 'flex';
    
    // Инициализация Socket.io
    initializeSocket();
    
    // Загрузка чатов
    loadChats();
    
    // Обновление профиля
    updateProfileUI();
}

// Инициализация Socket.io
function initializeSocket() {
    console.log('🔌 Инициализация Socket.io...');
    
    socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 10
    });

    socket.on('connect', () => {
        console.log('✅ Socket подключен');
        if (currentUser) {
            socket.emit('user:online', currentUser.id);
        }
    });

    socket.on('disconnect', () => {
        console.log('❌ Socket отключен');
    });

    socket.on('message:new', (message) => {
        console.log('📨 Новое сообщение:', message);
        handleNewMessage(message);
    });

    socket.on('user:status', (data) => {
        console.log('👤 Статус пользователя:', data);
        updateUserStatus(data);
    });
}

// Обновление UI профиля
function updateProfileUI() {
    if (!currentUser) return;
    
    console.log('🎨 Обновление UI профиля');
    
    const nameEl = document.getElementById('currentUserName');
    const usernameEl = document.getElementById('currentUserUsername');
    const avatarEl = document.getElementById('currentUserAvatar');
    
    if (nameEl) nameEl.textContent = currentUser.name;
    if (usernameEl) usernameEl.textContent = `@${currentUser.username}`;
    
    if (avatarEl && currentUser.avatar) {
        avatarEl.src = currentUser.avatar;
    }
}

// Загрузка чатов
async function loadChats() {
    if (!currentUser) return;
    
    console.log('📥 Загрузка чатов...');
    
    try {
        const response = await fetch(`${API_URL}/chats/${currentUser.id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('vibechat_token')}`
            }
        });

        if (response.ok) {
            chats = await response.json();
            console.log('✅ Чаты загружены:', chats.length);
            renderChats();
        } else {
            console.log('❌ Ошибка загрузки чатов:', response.status);
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки чатов:', error);
    }
}

// Рендер чатов
function renderChats() {
    const chatsList = document.getElementById('chatsList');
    if (!chatsList) return;
    
    chatsList.innerHTML = '';

    if (chats.length === 0) {
        chatsList.innerHTML = '<div class="empty-state">Нет чатов</div>';
        return;
    }

    chats.forEach(chat => {
        const chatElement = createChatElement(chat);
        chatsList.appendChild(chatElement);
    });
}

// Создание элемента чата
function createChatElement(chat) {
    const div = document.createElement('div');
    div.className = 'chat-item';
    div.onclick = () => openChat(chat.id);
    
    div.innerHTML = `
        <div class="chat-avatar"></div>
        <div class="chat-info">
            <div class="chat-name">Чат ${chat.id}</div>
            <div class="chat-last-message">${chat.lastMessage?.text || 'Нет сообщений'}</div>
        </div>
    `;
    
    return div;
}

// Открыть чат
async function openChat(chatId) {
    console.log('💬 Открытие чата:', chatId);
    
    currentChat = chats.find(c => c.id === chatId);
    
    if (!currentChat) return;

    try {
        const response = await fetch(`${API_URL}/messages/${chatId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('vibechat_token')}`
            }
        });

        if (response.ok) {
            const messages = await response.json();
            renderMessages(messages);
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки сообщений:', error);
    }
}

// Рендер сообщений
function renderMessages(messages) {
    const messagesContainer = document.getElementById('messagesContainer');
    if (!messagesContainer) return;
    
    messagesContainer.innerHTML = '';

    messages.forEach(message => {
        const messageElement = createMessageElement(message);
        messagesContainer.appendChild(messageElement);
    });

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Создание элемента сообщения
function createMessageElement(message) {
    const div = document.createElement('div');
    div.className = `message ${message.senderId === currentUser.id ? 'sent' : 'received'}`;
    
    div.innerHTML = `
        <div class="message-content">${message.text}</div>
        <div class="message-time">${new Date(message.timestamp).toLocaleTimeString()}</div>
    `;
    
    return div;
}

// Отправка сообщения
function sendMessage() {
    const input = document.getElementById('messageInput');
    if (!input) return;
    
    const text = input.value.trim();

    if (!text || !currentChat || !socket) return;

    console.log('📤 Отправка сообщения:', text);

    socket.emit('message:send', {
        chatId: currentChat.id,
        senderId: currentUser.id,
        text: text,
        type: 'text'
    });

    input.value = '';
}

// Обработка нового сообщения
function handleNewMessage(message) {
    if (currentChat && message.chatId === currentChat.id) {
        const messageElement = createMessageElement(message);
        const container = document.getElementById('messagesContainer');
        if (container) {
            container.appendChild(messageElement);
            container.scrollTop = container.scrollHeight;
        }
    }

    // Обновление списка чатов
    loadChats();
}

// Обновление статуса пользователя
function updateUserStatus(data) {
    console.log('👤 Статус пользователя обновлен:', data);
}

// Выход
function logout() {
    console.log('🚪 Выход из системы');
    
    localStorage.removeItem('vibechat_token');
    localStorage.removeItem('vibechat_user');
    currentUser = null;
    
    if (socket) {
        socket.disconnect();
    }
    
    showAuthScreen();
}

// Инициализация emoji picker
function initializeEmojiPicker() {
    console.log('😊 Инициализация emoji picker');
}

// Toast уведомления
function showToast(message, type = 'info') {
    console.log(`📢 Toast [${type}]:`, message);
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

console.log('✅ app.js загружен');
