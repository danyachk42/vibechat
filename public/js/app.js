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
    checkAuth();
    initializeEmojiPicker();
});

// Проверка авторизации
async function checkAuth() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        showAuthScreen();
        return;
    }

    try {
        const response = await fetch(`${API_URL}/auth/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            currentUser = await response.json();
            initializeApp();
        } else {
            localStorage.removeItem('token');
            showAuthScreen();
        }
    } catch (error) {
        console.error('❌ Ошибка проверки авторизации:', error);
        showAuthScreen();
    }
}

// Показать экран авторизации
function showAuthScreen() {
    document.getElementById('authScreen').style.display = 'flex';
    document.getElementById('appScreen').style.display = 'none';
}

// Инициализация приложения
function initializeApp() {
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('appScreen').style.display = 'flex';
    
    // Инициализация Socket.io
    socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 10
    });

    socket.on('connect', () => {
        console.log('✅ Socket подключен');
        socket.emit('user:online', currentUser.id);
    });

    socket.on('message:new', (message) => {
        handleNewMessage(message);
    });

    socket.on('user:status', (data) => {
        updateUserStatus(data);
    });

    // Загрузка чатов
    loadChats();
    
    // Обновление профиля
    updateProfileUI();
}

// Обновление UI профиля
function updateProfileUI() {
    document.getElementById('currentUserName').textContent = currentUser.name;
    document.getElementById('currentUserUsername').textContent = `@${currentUser.username}`;
    
    if (currentUser.avatar) {
        document.getElementById('currentUserAvatar').src = currentUser.avatar;
    }
}

// Загрузка чатов
async function loadChats() {
    try {
        const response = await fetch(`${API_URL}/chats/${currentUser.id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            chats = await response.json();
            renderChats();
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки чатов:', error);
    }
}

// Рендер чатов
function renderChats() {
    const chatsList = document.getElementById('chatsList');
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
    
    // Здесь добавьте HTML для отображения чата
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
    currentChat = chats.find(c => c.id === chatId);
    
    if (!currentChat) return;

    // Загрузка сообщений
    try {
        const response = await fetch(`${API_URL}/messages/${chatId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
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
    const text = input.value.trim();

    if (!text || !currentChat) return;

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
        document.getElementById('messagesContainer').appendChild(messageElement);
        document.getElementById('messagesContainer').scrollTop = document.getElementById('messagesContainer').scrollHeight;
    }

    // Обновление списка чатов
    loadChats();
}

// Обновление статуса пользователя
function updateUserStatus(data) {
    // Обновите UI статуса пользователя
    console.log('Статус пользователя обновлен:', data);
}

// Выход
function logout() {
    localStorage.removeItem('token');
    currentUser = null;
    if (socket) {
        socket.disconnect();
    }
    showAuthScreen();
}

// Инициализация emoji picker
function initializeEmojiPicker() {
    // Добавьте логику для emoji picker
}

// Toast уведомления
function showToast(message, type = 'info') {
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
2. public/js/auth.js (ЗАМЕНИТЕ ПОЛНОСТЬЮ)
// АВТОРИЗАЦИЯ

async function handleRegister(e) {
    e.preventDefault();

    const name = document.getElementById('regName').value.trim();
    const username = document.getElementById('regUsername').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;

    if (!name || name.length < 2) {
        showToast('Имя должно быть минимум 2 символа', 'error');
        return;
    }

    if (!username || username.length < 5) {
        showToast('Username должен быть минимум 5 символов', 'error');
        return;
    }

    if (!email || !email.includes('@')) {
        showToast('Введите корректный email', 'error');
        return;
    }

    if (!password || password.length < 6) {
        showToast('Пароль должен быть минимум 6 символов', 'error');
        return;
    }

    const loader = document.querySelector('#registerModal .loader');
    const btn = document.querySelector('#registerModal button[type="submit"]');
    
    loader.classList.remove('hidden');
    btn.style.pointerEvents = 'none';

    try {
        // Шаг 1: Отправка кода
        const response = await fetch(`${API_URL}/auth/send-code`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, username, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            document.getElementById('verifyEmail').textContent = email;
            document.getElementById('registerModal').classList.remove('active');
            
            setTimeout(() => {
                document.getElementById('verifyModal').classList.add('active');
                document.getElementById('code1').focus();
            }, 300);

            showToast('✅ Код отправлен! Проверьте консоль сервера', 'success');
            
            if (data.devCode) {
                console.log('🔑 КОД:', data.devCode);
            }
        } else {
            showToast('❌ ' + (data.error || 'Ошибка регистрации'), 'error');
        }
    } catch (error) {
        console.error('❌ Ошибка соединения:', error);
        showToast('❌ Ошибка соединения с сервером. Проверьте, что сервер запущен!', 'error');
    } finally {
        loader.classList.add('hidden');
        btn.style.pointerEvents = 'auto';
    }
}

// Проверка кода
async function handleVerifyCode(e) {
    e.preventDefault();

    const code1 = document.getElementById('code1').value;
    const code2 = document.getElementById('code2').value;
    const code3 = document.getElementById('code3').value;
    const code4 = document.getElementById('code4').value;
    const code5 = document.getElementById('code5').value;
    const code6 = document.getElementById('code6').value;

    const code = code1 + code2 + code3 + code4 + code5 + code6;

    if (code.length !== 6) {
        showToast('Введите полный код', 'error');
        return;
    }

    const email = document.getElementById('verifyEmail').textContent;
    const loader = document.querySelector('#verifyModal .loader');
    const btn = document.querySelector('#verifyModal button[type="submit"]');
    
    loader.classList.remove('hidden');
    btn.style.pointerEvents = 'none';

    try {
        const response = await fetch(`${API_URL}/auth/register/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, code })
        });

        const data = await response.json();

        if (response.ok) {
            // Завершение регистрации
            const name = document.getElementById('regName').value.trim();
            const username = document.getElementById('regUsername').value.trim();
            const password = document.getElementById('regPassword').value;

            const completeResponse = await fetch(`${API_URL}/auth/register/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, name, username, password })
            });

            const completeData = await completeResponse.json();

            if (completeResponse.ok) {
                localStorage.setItem('token', completeData.token);
                currentUser = completeData.user;
                
                document.getElementById('verifyModal').classList.remove('active');
                showToast('✅ Регистрация завершена!', 'success');
                
                setTimeout(() => {
                    initializeApp();
                }, 500);
            } else {
                showToast('❌ ' + (completeData.error || 'Ошибка завершения регистрации'), 'error');
            }
        } else {
            showToast('❌ ' + (data.error || 'Неверный код'), 'error');
        }
    } catch (error) {
        console.error('❌ Ошибка:', error);
        showToast('❌ Ошибка соединения с сервером', 'error');
    } finally {
        loader.classList.add('hidden');
        btn.style.pointerEvents = 'auto';
    }
}

// Вход
async function handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!username || !password) {
        showToast('Заполните все поля', 'error');
        return;
    }

    const loader = document.querySelector('#loginModal .loader');
    const btn = document.querySelector('#loginModal button[type="submit"]');
    
    loader.classList.remove('hidden');
    btn.style.pointerEvents = 'none';

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            currentUser = data.user;
            
            document.getElementById('loginModal').classList.remove('active');
            showToast('✅ Вход выполнен!', 'success');
            
            setTimeout(() => {
                initializeApp();
            }, 500);
        } else {
            showToast('❌ ' + (data.error || 'Ошибка входа'), 'error');
        }
    } catch (error) {
        console.error('❌ Ошибка:', error);
        showToast('❌ Ошибка соединения с сервером. Проверьте, что сервер запущен!', 'error');
    } finally {
        loader.classList.add('hidden');
        btn.style.pointerEvents = 'auto';
    }
}

// Автоматический переход между полями кода
function setupCodeInputs() {
    const inputs = document.querySelectorAll('.code-input');
    
    inputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            if (e.target.value.length === 1 && index < inputs.length - 1) {
                inputs[index + 1].focus();
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                inputs[index - 1].focus();
            }
        });
    });
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    setupCodeInputs();
});
