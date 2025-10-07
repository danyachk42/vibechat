// АВТОРИЗАЦИЯ

// Временное хранилище данных регистрации
let registrationData = {};

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

    // Сохраняем данные для последующего использования
    registrationData = { name, username, email, password };

    const loader = document.getElementById('regLoader');
    const btn = e.target.querySelector('.btn-primary');
    loader.classList.remove('hidden');
    btn.style.pointerEvents = 'none';

    try {
        console.log('📤 Отправка запроса на:', `${API_URL}/auth/send-code`);
        
        const response = await fetch(`${API_URL}/auth/send-code`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        console.log('📥 Ответ получен:', response.status);

        const data = await response.json();
        console.log('📦 Данные:', data);

        if (response.ok) {
            document.getElementById('verifyEmail').textContent = email;
            document.getElementById('registerModal').classList.remove('active');
            
            setTimeout(() => {
                document.getElementById('verifyModal').classList.add('active');
                document.getElementById('code1').focus();
            }, 300);
            
            showToast('✅ Код отправлен! Проверьте консоль сервера', 'success');
            
            if (data.devCode) {
                console.log('🔐 КОД:', data.devCode);
            }
        } else {
            showToast('❌ ' + (data.error || 'Ошибка регистрации'), 'error');
        }
    } catch (error) {
        console.error('❌ Ошибка соединения:', error);
        showToast('❌ Ошибка соединения с сервером. Проверьте что сервер запущен!', 'error');
    } finally {
        loader.classList.add('hidden');
        btn.style.pointerEvents = 'auto';
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        showToast('Заполните все поля', 'error');
        return;
    }

    const loader = document.getElementById('loginLoader');
    const btn = e.target.querySelector('.btn-primary');
    loader.classList.remove('hidden');
    btn.style.pointerEvents = 'none';

    try {
        console.log('📤 Отправка запроса на:', `${API_URL}/auth/login`);
        
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: email, password })
        });

        console.log('📥 Ответ получен:', response.status);

        const data = await response.json();
        console.log('📦 Данные:', data);

        if (response.ok) {
            localStorage.setItem('vibechat_token', data.token);
            localStorage.setItem('vibechat_user', JSON.stringify(data.user));
            currentUser = data.user;
            
            showToast('✅ Вход выполнен!', 'success');
            
            // Закрываем модальное окно
            document.getElementById('loginModal').classList.remove('active');
            
            setTimeout(() => showApp(), 1000);
        } else {
            showToast('❌ ' + (data.error || 'Ошибка входа'), 'error');
        }
    } catch (error) {
        console.error('❌ Ошибка соединения:', error);
        showToast('❌ Ошибка соединения с сервером. Проверьте что сервер запущен!', 'error');
    } finally {
        loader.classList.add('hidden');
        btn.style.pointerEvents = 'auto';
    }
}

async function verifyCode() {
    const code = Array.from(document.querySelectorAll('.code-input')).map(input => input.value).join('');

    if (code.length !== 6) {
        showToast('Введите полный код (6 цифр)', 'error');
        return;
    }

    const email = document.getElementById('verifyEmail').textContent;
    const loader = document.getElementById('verifyLoader');
    loader.classList.remove('hidden');

    try {
        console.log('📤 Проверка кода...');
        
        // Шаг 1: Проверка кода
        const verifyResponse = await fetch(`${API_URL}/auth/register/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, code })
        });

        const verifyData = await verifyResponse.json();
        console.log('📥 Результат проверки:', verifyData);

        if (!verifyResponse.ok) {
            showToast('❌ ' + (verifyData.error || 'Неверный код'), 'error');
            loader.classList.add('hidden');
            return;
        }

        console.log('✅ Код верный! Завершаем регистрацию...');

        // Шаг 2: Завершение регистрации
        const completeResponse = await fetch(`${API_URL}/auth/register/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: registrationData.email,
                name: registrationData.name,
                username: registrationData.username,
                password: registrationData.password
            })
        });

        const completeData = await completeResponse.json();
        console.log('📥 Результат регистрации:', completeData);

        if (completeResponse.ok) {
            localStorage.setItem('vibechat_token', completeData.token);
            localStorage.setItem('vibechat_user', JSON.stringify(completeData.user));
            currentUser = completeData.user;
            
            showToast('✅ Регистрация успешна!', 'success');
            
            // Закрываем модальное окно
            document.getElementById('verifyModal').classList.remove('active');
            
            // Очищаем временные данные
            registrationData = {};
            
            setTimeout(() => showApp(), 1000);
        } else {
            showToast('❌ ' + (completeData.error || 'Ошибка завершения регистрации'), 'error');
        }
    } catch (error) {
        console.error('❌ Ошибка соединения:', error);
        showToast('❌ Ошибка соединения с сервером', 'error');
    } finally {
        loader.classList.add('hidden');
    }
}

function showLogin() {
    document.getElementById('registerModal').classList.remove('active');
    document.getElementById('loginModal').classList.add('active');
}

function showRegister() {
    document.getElementById('loginModal').classList.remove('active');
    document.getElementById('registerModal').classList.add('active');
}

// Автоматический переход между полями кода
document.addEventListener('DOMContentLoaded', () => {
    const codeInputs = document.querySelectorAll('.code-input');
    
    codeInputs.forEach((input, index) => {
        // Автоматический переход к следующему полю
        input.addEventListener('input', (e) => {
            if (e.target.value.length === 1 && index < codeInputs.length - 1) {
                codeInputs[index + 1].focus();
            }
        });

        // Возврат к предыдущему полю при Backspace
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                codeInputs[index - 1].focus();
            }
        });

        // Разрешаем только цифры
        input.addEventListener('keypress', (e) => {
            if (!/[0-9]/.test(e.key)) {
                e.preventDefault();
            }
        });

        // Автоматическая отправка при заполнении последнего поля
        if (index === codeInputs.length - 1) {
            input.addEventListener('input', (e) => {
                if (e.target.value.length === 1) {
                    // Проверяем что все поля заполнены
                    const allFilled = Array.from(codeInputs).every(inp => inp.value.length === 1);
                    if (allFilled) {
                        setTimeout(() => verifyCode(), 300);
                    }
                }
            });
        }
    });
});

console.log('✅ auth.js загружен');
