const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(express.json());
app.use(express.static('public'));

// JWT Secret
const JWT_SECRET = 'vibechat_secret_key_2025_ultra_secure';

// Создание папок для данных
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

// Файлы данных
const usersFile = path.join(dataDir, 'users.json');
const messagesFile = path.join(dataDir, 'messages.json');
const chatsFile = path.join(dataDir, 'chats.json');
const codesFile = path.join(dataDir, 'codes.json');

// Инициализация файлов с проверкой
function initFile(file, defaultData) {
    if (!fs.existsSync(file)) {
        fs.writeFileSync(file, JSON.stringify(defaultData, null, 2));
    } else {
        try {
            const content = fs.readFileSync(file, 'utf8');
            if (!content || content.trim() === '') {
                fs.writeFileSync(file, JSON.stringify(defaultData, null, 2));
            } else {
                JSON.parse(content);
            }
        } catch (e) {
            console.log(`⚠️  Файл ${file} поврежден, пересоздаем...`);
            fs.writeFileSync(file, JSON.stringify(defaultData, null, 2));
        }
    }
}

// Инициализация всех файлов
initFile(usersFile, []);
initFile(messagesFile, {});
initFile(chatsFile, []);
initFile(codesFile, {});

// Функции для работы с данными
function readData(file) {
    try {
        const content = fs.readFileSync(file, 'utf8');
        if (!content || content.trim() === '') {
            return file.includes('messages') ? {} : [];
        }
        return JSON.parse(content);
    } catch (error) {
        console.error(`❌ Ошибка чтения ${file}:`, error);
        return file.includes('messages') ? {} : [];
    }
}

function writeData(file, data) {
    try {
        fs.writeFileSync(file, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error(`❌ Ошибка записи ${file}:`, error);
    }
}

// Генерация кода верификации
function generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Валидация username (только английские буквы, цифры, подчеркивание, 5-20 символов)
function validateUsername(username) {
    const usernameRegex = /^[a-zA-Z0-9_]{5,20}$/;
    return usernameRegex.test(username);
}

// Валидация email
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Валидация пароля
function validatePassword(password) {
    return password.length >= 6 && password.length <= 50;
}

// Валидация имени
function validateName(name) {
    return name.length >= 2 && name.length <= 50;
}

// ============================================
// API ENDPOINTS
// ============================================

// 1. РЕГИСТРАЦИЯ - Отправка кода (В КОНСОЛЬ)
app.post('/api/auth/register/send-code', async (req, res) => {
    try {
        const { email, name, username, password } = req.body;

        console.log('\n📝 Попытка регистрации:', { email, name, username });

        // Валидация всех полей
        if (!email || !name || !username || !password) {
            return res.status(400).json({ error: 'Все поля обязательны для заполнения' });
        }

        // Валидация email
        if (!validateEmail(email)) {
            return res.status(400).json({ error: 'Неверный формат email адреса' });
        }

        // Валидация имени
        if (!validateName(name)) {
            return res.status(400).json({ error: 'Имя должно быть от 2 до 50 символов' });
        }

        // Валидация username
        if (!validateUsername(username)) {
            return res.status(400).json({ 
                error: 'Username должен быть на английском, от 5 до 20 символов (буквы, цифры, _)' 
            });
        }

        // Валидация пароля
        if (!validatePassword(password)) {
            return res.status(400).json({ error: 'Пароль должен быть от 6 до 50 символов' });
        }

        const users = readData(usersFile);

        // Проверка существования email
        if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
            return res.status(400).json({ error: 'Этот email уже зарегистрирован' });
        }

        // Проверка существования username
        if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
            return res.status(400).json({ error: 'Этот username уже занят' });
        }

        // Генерация кода
        const code = generateCode();
        const codes = readData(codesFile);
        codes[email] = {
            code,
            userData: { email, name, username, password },
            expires: Date.now() + 10 * 60 * 1000 // 10 минут
        };
        writeData(codesFile, codes);

        // ВЫВОД КОДА В КОНСОЛЬ
        console.log('\n╔═══════════════════════════════════════╗');
        console.log('║     📧 КОД ПОДТВЕРЖДЕНИЯ              ║');
        console.log('╠═══════════════════════════════════════╣');
        console.log(`║  Email: ${email.padEnd(28)} ║`);
        console.log(`║  Код:   ${code}                        ║`);
        console.log('║  Срок:  10 минут                      ║');
        console.log('╚═══════════════════════════════════════╝\n');

        res.json({ 
            success: true, 
            message: 'Код подтверждения отправлен (смотрите консоль)',
            devCode: code // Для удобства тестирования
        });

    } catch (error) {
        console.error('❌ Ошибка регистрации:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// 2. РЕГИСТРАЦИЯ - Подтверждение кода
app.post('/api/auth/register/verify', async (req, res) => {
    try {
        const { email, code } = req.body;

        console.log('\n🔐 Попытка верификации:', { email, code });

        if (!email || !code) {
            return res.status(400).json({ error: 'Email и код обязательны' });
        }

        const codes = readData(codesFile);
        const savedCode = codes[email];

        if (!savedCode) {
            return res.status(400).json({ error: 'Код не найден. Запросите новый код.' });
        }

        if (savedCode.expires < Date.now()) {
            delete codes[email];
            writeData(codesFile, codes);
            return res.status(400).json({ error: 'Код истек. Запросите новый код.' });
        }

        if (savedCode.code !== code.toString()) {
            return res.status(400).json({ error: 'Неверный код подтверждения' });
        }

        // Создание пользователя
        const users = readData(usersFile);
        const { email: userEmail, name, username, password } = savedCode.userData;

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            email: userEmail,
            name,
            username,
            password: hashedPassword,
            avatar: name[0].toUpperCase(),
            bio: '',
            status: 'Привет! Я использую VibeChat 👋',
            phone: '',
            birthday: '',
            gender: '',
            city: '',
            country: '',
            socialLinks: [],
            profilePhotos: [],
            coverPhoto: '',
            verified: false,
            businessAccount: false,
            qrCode: '',
            lastSeen: Date.now(),
            online: true,
            createdAt: Date.now(),
            settings: {
                notifications: true,
                soundEnabled: true,
                vibrationEnabled: true,
                showOnlineStatus: true,
                showLastSeen: true,
                showProfilePhoto: true,
                showEmail: false,
                showPhone: false
            }
        };

        users.push(newUser);
        writeData(usersFile, users);

        // Удаление кода
        delete codes[email];
        writeData(codesFile, codes);

        // Генерация JWT токена
        const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: '30d' });

        console.log('✅ Пользователь успешно зарегистрирован:', newUser.username);

        res.json({
            success: true,
            token,
            user: {
                id: newUser.id,
                email: newUser.email,
                name: newUser.name,
                username: newUser.username,
                avatar: newUser.avatar,
                bio: newUser.bio,
                status: newUser.status
            }
        });

    } catch (error) {
        console.error('❌ Ошибка верификации:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// 3. АВТОРИЗАЦИЯ
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('\n🔑 Попытка входа:', email);

        if (!email || !password) {
            return res.status(400).json({ error: 'Email и пароль обязательны' });
        }

        if (!validateEmail(email)) {
            return res.status(400).json({ error: 'Неверный формат email' });
        }

        const users = readData(usersFile);
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (!user) {
            return res.status(400).json({ error: 'Пользователь с таким email не найден' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ error: 'Неверный пароль' });
        }

        // Обновление статуса
        user.online = true;
        user.lastSeen = Date.now();
        writeData(usersFile, users);

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });

        console.log('✅ Успешный вход:', user.username);

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                username: user.username,
                avatar: user.avatar,
                bio: user.bio,
                status: user.status
            }
        });

    } catch (error) {
        console.error('❌ Ошибка авторизации:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// 4. ПОИСК ПОЛЬЗОВАТЕЛЕЙ (С ПРОВЕРКОЙ СУЩЕСТВОВАНИЯ)
app.get('/api/users/search', (req, res) => {
    try {
        const { query } = req.query;

        if (!query || query.trim().length < 2) {
            return res.json({ users: [] });
        }

        const users = readData(usersFile);
        const currentUserId = req.headers['user-id'];

        const results = users
            .filter(u => {
                if (u.id === currentUserId) return false;

                const searchQuery = query.toLowerCase();
                return (
                    u.email.toLowerCase().includes(searchQuery) ||
                    u.username.toLowerCase().includes(searchQuery) ||
                    u.name.toLowerCase().includes(searchQuery)
                );
            })
            .map(u => ({
                id: u.id,
                name: u.name,
                username: u.username,
                email: u.email,
                avatar: u.avatar,
                online: u.online,
                verified: u.verified
            }))
            .slice(0, 20);

        console.log(`🔍 Поиск "${query}": найдено ${results.length} пользователей`);

        res.json({ users: results });

    } catch (error) {
        console.error('❌ Ошибка поиска:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// 5. ПОЛУЧИТЬ ПРОФИЛЬ ПОЛЬЗОВАТЕЛЯ
app.get('/api/users/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const users = readData(usersFile);
        const user = users.find(u => u.id === userId);

        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        res.json({
            id: user.id,
            name: user.name,
            username: user.username,
            email: user.settings.showEmail ? user.email : null,
            phone: user.settings.showPhone ? user.phone : null,
            avatar: user.avatar,
            bio: user.bio,
            status: user.status,
            online: user.online,
            lastSeen: user.settings.showLastSeen ? user.lastSeen : null,
            verified: user.verified,
            businessAccount: user.businessAccount,
            city: user.city,
            country: user.country,
            socialLinks: user.socialLinks
        });

    } catch (error) {
        console.error('❌ Ошибка получения профиля:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// 6. СОЗДАТЬ ЧАТ (С ПРОВЕРКОЙ СУЩЕСТВОВАНИЯ ПОЛЬЗОВАТЕЛЯ)
app.post('/api/chats/create', (req, res) => {
    try {
        const { userId, contactId } = req.body;

        if (!userId || !contactId) {
            return res.status(400).json({ error: 'Не указаны ID пользователей' });
        }

        if (userId === contactId) {
            return res.status(400).json({ error: 'Нельзя создать чат с самим собой' });
        }

        const users = readData(usersFile);
        
        const user = users.find(u => u.id === userId);
        const contact = users.find(u => u.id === contactId);

        if (!user) {
            return res.status(404).json({ error: 'Ваш аккаунт не найден' });
        }

        if (!contact) {
            return res.status(404).json({ error: 'Пользователь не найден. Проверьте правильность данных.' });
        }

        const chats = readData(chatsFile);

        const existingChat = chats.find(c => 
            (c.user1 === userId && c.user2 === contactId) ||
            (c.user1 === contactId && c.user2 === userId)
        );

        if (existingChat) {
            console.log('💬 Чат уже существует:', existingChat.id);
            return res.json({ 
                chatId: existingChat.id, 
                chat: existingChat,
                message: 'Чат уже существует'
            });
        }

        const newChat = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            user1: userId,
            user2: contactId,
            createdAt: Date.now(),
            lastMessage: null,
            lastMessageTime: null,
            unreadCount: {
                [userId]: 0,
                [contactId]: 0
            }
        };

        chats.push(newChat);
        writeData(chatsFile, chats);

        console.log('✅ Создан новый чат:', newChat.id);

        res.json({ 
            chatId: newChat.id, 
            chat: newChat,
            message: 'Чат успешно создан'
        });

    } catch (error) {
        console.error('❌ Ошибка создания чата:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// 7. ПОЛУЧИТЬ ЧАТЫ ПОЛЬЗОВАТЕЛЯ
app.get('/api/chats/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const chats = readData(chatsFile);
        const users = readData(usersFile);

        const userChats = chats
            .filter(c => c.user1 === userId || c.user2 === userId)
            .map(chat => {
                const contactId = chat.user1 === userId ? chat.user2 : chat.user1;
                const contact = users.find(u => u.id === contactId);

                if (!contact) return null;

                return {
                    id: chat.id,
                    contact: {
                        id: contact.id,
                        name: contact.name,
                        username: contact.username,
                        avatar: contact.avatar,
                        online: contact.online,
                        lastSeen: contact.lastSeen
                    },
                    lastMessage: chat.lastMessage,
                    lastMessageTime: chat.lastMessageTime,
                    unreadCount: chat.unreadCount[userId] || 0
                };
            })
            .filter(c => c !== null)
            .sort((a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0));

        res.json({ chats: userChats });

    } catch (error) {
        console.error('❌ Ошибка получения чатов:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// 8. ПОЛУЧИТЬ СООБЩЕНИЯ ЧАТА
app.get('/api/messages/:chatId', (req, res) => {
    try {
        const { chatId } = req.params;
        const messages = readData(messagesFile);

        const chatMessages = messages[chatId] || [];

        res.json({ messages: chatMessages });

    } catch (error) {
        console.error('❌ Ошибка получения сообщений:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// 9. ОТПРАВИТЬ СООБЩЕНИЕ
app.post('/api/messages/send', (req, res) => {
    try {
        const { chatId, senderId, text } = req.body;

        if (!chatId || !senderId || !text || text.trim() === '') {
            return res.status(400).json({ error: 'Все поля обязательны' });
        }

        const messages = readData(messagesFile);
        if (!messages[chatId]) messages[chatId] = [];

        const newMessage = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            chatId,
            senderId,
            text: text.trim(),
            timestamp: Date.now(),
            status: 'sent',
            read: false,
            edited: false,
            deleted: false
        };

        messages[chatId].push(newMessage);
        writeData(messagesFile, messages);

        const chats = readData(chatsFile);
        const chat = chats.find(c => c.id === chatId);
        if (chat) {
            chat.lastMessage = text.trim();
            chat.lastMessageTime = Date.now();
            
            const receiverId = chat.user1 === senderId ? chat.user2 : chat.user1;
            chat.unreadCount[receiverId] = (chat.unreadCount[receiverId] || 0) + 1;
            
            writeData(chatsFile, chats);
        }

        io.to(chatId).emit('new_message', newMessage);

        console.log('💬 Сообщение отправлено:', newMessage.id);

        res.json({ success: true, message: newMessage });

    } catch (error) {
        console.error('❌ Ошибка отправки сообщения:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// 10. ВЫХОД ИЗ АККАУНТА
app.post('/api/auth/logout', (req, res) => {
    try {
        const { userId } = req.body;

        const users = readData(usersFile);
        const user = users.find(u => u.id === userId);

        if (user) {
            user.online = false;
            user.lastSeen = Date.now();
            writeData(usersFile, users);
            console.log('👋 Выход из аккаунта:', user.username);
        }

        res.json({ success: true, message: 'Выход выполнен' });

    } catch (error) {
        console.error('❌ Ошибка выхода:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// ============================================
// WEBSOCKET
// ============================================

io.on('connection', (socket) => {
    console.log('✅ Пользователь подключился:', socket.id);

    socket.on('join_chat', (chatId) => {
        socket.join(chatId);
        console.log(`📨 Пользователь присоединился к чату: ${chatId}`);
    });

    socket.on('typing', (data) => {
        socket.to(data.chatId).emit('user_typing', {
            userId: data.userId,
            username: data.username
        });
    });

    socket.on('stop_typing', (data) => {
        socket.to(data.chatId).emit('user_stop_typing', {
            userId: data.userId
        });
    });

    socket.on('disconnect', () => {
        console.log('❌ Пользователь отключился:', socket.id);
    });
});

// УДАЛЕНИЕ СООБЩЕНИЙ
app.post('/api/messages/delete', async (req, res) => {
    try {
        const { messageId, userId, deleteType } = req.body;
        const messages = readData(messagesFile);
        
        for (const chatId in messages) {
            const chatMessages = messages[chatId];
            const messageIndex = chatMessages.findIndex(m => m.id === messageId);
            
            if (messageIndex !== -1) {
                if (deleteType === 'forEveryone') {
                    chatMessages.splice(messageIndex, 1);
                } else {
                    chatMessages[messageIndex].deletedFor = chatMessages[messageIndex].deletedFor || [];
                    chatMessages[messageIndex].deletedFor.push(userId);
                }
                writeData(messagesFile, messages);
                return res.json({ success: true });
            }
        }
        
        res.status(404).json({ error: 'Сообщение не найдено' });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// РЕАКЦИИ НА СООБЩЕНИЯ
app.post('/api/messages/reaction', async (req, res) => {
    try {
        const { messageId, userId, emoji } = req.body;
        const messages = readData(messagesFile);
        
        for (const chatId in messages) {
            const message = messages[chatId].find(m => m.id === messageId);
            if (message) {
                message.reactions = message.reactions || {};
                message.reactions[emoji] = message.reactions[emoji] || [];
                
                const index = message.reactions[emoji].indexOf(userId);
                if (index > -1) {
                    message.reactions[emoji].splice(index, 1);
                    if (message.reactions[emoji].length === 0) {
                        delete message.reactions[emoji];
                    }
                } else {
                    message.reactions[emoji].push(userId);
                }
                
                writeData(messagesFile, messages);
                return res.json({ success: true, reactions: message.reactions });
            }
        }
        
        res.status(404).json({ error: 'Сообщение не найдено' });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// ПРОЧТЕНИЕ СООБЩЕНИЙ
app.post('/api/messages/read', async (req, res) => {
    try {
        const { chatId, userId } = req.body;
        const messages = readData(messagesFile);
        const chats = readData(chatsFile);
        
        if (messages[chatId]) {
            messages[chatId].forEach(msg => {
                if (msg.senderId !== userId) {
                    msg.status = 'read';
                    msg.read = true;
                }
            });
            writeData(messagesFile, messages);
        }
        
        const chat = chats.find(c => c.id === chatId);
        if (chat && chat.unreadCount) {
            chat.unreadCount[userId] = 0;
            writeData(chatsFile, chats);
        }
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Запуск сервера
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`
    ╔═══════════════════════════════════════╗
    ║                                       ║
    ║   🚀 VibeChat Server запущен!        ║
    ║                                       ║
    ║   🌐 http://localhost:${PORT}            ║
    ║                                       ║
    ║   📁 Данные: ./data/                  ║
    ║   📧 Email: Консоль (для тестирования)║
    ║   🔌 WebSocket: Активен               ║
    ║                                       ║
    ║   ⚠️  Коды верификации в консоли!    ║
    ║                                       ║
    ╚═══════════════════════════════════════╝
    `);
});