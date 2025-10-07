const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Настройка Socket.io для Vercel (только polling)
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    },
    transports: ['polling', 'websocket'],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000
});

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, '../public')));

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'vibechat_secret_key_2025_ultra_secure';

// In-memory хранилище (временное решение)
// ⚠️ ВАЖНО: Данные будут теряться при каждом деплое!
// Для продакшена используйте MongoDB или другую БД
let users = [];
let messages = [];
let chats = [];
let codes = [];

// Функция генерации кода верификации
function generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Функция валидации username
function validateUsername(username) {
    const usernameRegex = /^[a-zA-Z0-9_]{5,20}$/;
    return usernameRegex.test(username);
}

// Функция валидации email
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// ============================================
// API ENDPOINTS
// ============================================

// 1. ОТПРАВКА КОДА ВЕРИФИКАЦИИ
app.post('/api/auth/send-code', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email || !validateEmail(email)) {
            return res.status(400).json({ error: 'Неверный формат email' });
        }

        // Проверка существующего пользователя
        const existingUser = users.find(u => u.email === email);
        if (existingUser) {
            return res.status(400).json({ error: 'Email уже зарегистрирован' });
        }

        // Генерация кода
        const code = generateCode();
        codes.push({
            email,
            code,
            expires: Date.now() + 10 * 60 * 1000 // 10 минут
        });

        console.log(`📧 Код для ${email}: ${code}`);

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
        const { email, code: userCode } = req.body;

        if (!email || !userCode) {
            return res.status(400).json({ error: 'Не указаны ID пользователей' });
        }

        // Поиск кода
        const codeEntry = codes.find(c => c.email === email);
        
        if (!codeEntry) {
            return res.status(400).json({ error: 'Код не найден' });
        }

        if (codeEntry.expires < Date.now()) {
            return res.status(400).json({ error: 'Код истек' });
        }

        if (codeEntry.code !== userCode) {
            return res.status(400).json({ error: 'Неверный код' });
        }

        res.json({ success: true, message: 'Код подтвержден' });

    } catch (error) {
        console.error('❌ Ошибка верификации:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// 3. РЕГИСТРАЦИЯ - Завершение
app.post('/api/auth/register/complete', async (req, res) => {
    try {
        const { email, name, username, password } = req.body;

        if (!email || !name || !username || !password) {
            return res.status(400).json({ error: 'Все поля обязательны' });
        }

        if (!validateUsername(username)) {
            return res.status(400).json({ error: 'Username должен содержать 5-20 символов (буквы, цифры, _)' });
        }

        // Проверка уникальности username
        const existingUsername = users.find(u => u.username === username);
        if (existingUsername) {
            return res.status(400).json({ error: 'Username уже занят' });
        }

        // Хеширование пароля
        const hashedPassword = await bcrypt.hash(password, 10);

        // Создание пользователя
        const newUser = {
            id: Date.now().toString(),
            email,
            name,
            username,
            password: hashedPassword,
            avatar: null,
            bio: '',
            phone: '',
            status: 'Привет! Я использую VibeChat 🚀',
            online: false,
            lastSeen: null,
            verified: false,
            businessAccount: false,
            city: '',
            country: '',
            socialLinks: []
        };

        users.push(newUser);

        // Генерация JWT токена
        const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: '30d' });

        res.json({
            success: true,
            message: 'Регистрация завершена',
            token,
            user: {
                id: newUser.id,
                email: newUser.email,
                name: newUser.name,
                username: newUser.username,
                avatar: newUser.avatar
            }
        });

    } catch (error) {
        console.error('❌ Ошибка завершения регистрации:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// 4. ВХОД
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Все поля обязательны' });
        }

        // Поиск пользователя
        const user = users.find(u => u.username === username || u.email === username);
        
        if (!user) {
            return res.status(400).json({ error: 'Неверный логин или пароль' });
        }

        // Проверка пароля
        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (!isPasswordValid) {
            return res.status(400).json({ error: 'Неверный логин или пароль' });
        }

        // Генерация JWT токена
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });

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
        console.error('❌ Ошибка входа:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// 5. ПОЛУЧЕНИЕ ПРОФИЛЯ
app.get('/api/auth/profile', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: 'Не авторизован' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = users.find(u => u.id === decoded.userId);

        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        res.json({
            id: user.id,
            email: user.email,
            name: user.name,
            username: user.username,
            avatar: user.avatar,
            bio: user.bio,
            phone: user.phone,
            status: user.status,
            online: user.online,
            lastSeen: user.lastSeen,
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
app.post('/api/chats/create', async (req, res) => {
    try {
        const { userId, contactId } = req.body;

        if (!userId || !contactId) {
            return res.status(400).json({ error: 'Не указаны ID пользователей' });
        }

        if (userId === contactId) {
            return res.status(400).json({ error: 'Нельзя создать чат с самим собой' });
        }

        // Проверка существования пользователей
        const user = users.find(u => u.id === userId);
        const contact = users.find(u => u.id === contactId);

        if (!user || !contact) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        // Проверка существующего чата
        const existingChat = chats.find(c => 
            (c.participants.includes(userId) && c.participants.includes(contactId)) &&
            c.type === 'private'
        );

        if (existingChat) {
            return res.json({ chatId: existingChat.id });
        }

        // Создание нового чата
        const newChat = {
            id: Date.now().toString(),
            type: 'private',
            participants: [userId, contactId],
            createdAt: Date.now(),
            lastMessage: null,
            unreadCount: {}
        };

        newChat.unreadCount[userId] = 0;
        newChat.unreadCount[contactId] = 0;

        chats.push(newChat);

        res.json({ chatId: newChat.id });

    } catch (error) {
        console.error('❌ Ошибка создания чата:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// 7. ПОЛУЧИТЬ ЧАТЫ ПОЛЬЗОВАТЕЛЯ
app.get('/api/chats/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const userChats = chats.filter(c => c.participants.includes(userId));

        res.json(userChats);

    } catch (error) {
        console.error('❌ Ошибка получения чатов:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// 8. ПОЛУЧИТЬ СООБЩЕНИЯ ЧАТА
app.get('/api/messages/:chatId', async (req, res) => {
    try {
        const { chatId } = req.params;

        const chatMessages = messages.filter(m => m.chatId === chatId);

        res.json(chatMessages);

    } catch (error) {
        console.error('❌ Ошибка получения сообщений:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// 9. ПРОЧИТАТЬ СООБЩЕНИЯ
app.post('/api/chats/:chatId/read', async (req, res) => {
    try {
        const { chatId } = req.params;
        const { userId } = req.body;

        const chat = chats.find(c => c.id === chatId);
        
        if (!chat) {
            return res.status(404).json({ error: 'Чат не найден' });
        }

        if (chat.unreadCount) {
            chat.unreadCount[userId] = 0;
        }

        res.json({ success: true });

    } catch (error) {
        console.error('❌ Ошибка прочтения сообщений:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// ============================================
// SOCKET.IO EVENTS
// ============================================

io.on('connection', (socket) => {
    console.log('🔌 Новое подключение:', socket.id);

    // Пользователь онлайн
    socket.on('user:online', (userId) => {
        const user = users.find(u => u.id === userId);
        if (user) {
            user.online = true;
            user.lastSeen = null;
            io.emit('user:status', { userId, online: true });
        }
    });

    // Отправка сообщения
    socket.on('message:send', (data) => {
        const newMessage = {
            id: Date.now().toString(),
            chatId: data.chatId,
            senderId: data.senderId,
            text: data.text,
            timestamp: Date.now(),
            read: false,
            type: data.type || 'text',
            mediaUrl: data.mediaUrl || null
        };

        messages.push(newMessage);

        // Обновление последнего сообщения в чате
        const chat = chats.find(c => c.id === data.chatId);
        if (chat) {
            chat.lastMessage = newMessage;
            
            // Увеличение счетчика непрочитанных для получателя
            chat.participants.forEach(participantId => {
                if (participantId !== data.senderId) {
                    chat.unreadCount[participantId] = (chat.unreadCount[participantId] || 0) + 1;
                }
            });
        }

        io.emit('message:new', newMessage);
    });

    // Отключение
    socket.on('disconnect', () => {
        console.log('❌ Отключение:', socket.id);
    });
});

// Экспорт для Vercel
module.exports = app;
module.exports.io = io;
module.exports.server = server;
