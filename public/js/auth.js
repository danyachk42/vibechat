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

    const loader = document.getElementById('regLoader');
    const btn = e.target.querySelector('.btn-primary');
    loader.classList.remove('hidden');
    btn.style.pointerEvents = 'none';

    try {
        const response = await fetch(`${API_URL}/auth/register/send-code`, {
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
                console.log('🔐 КОД:', data.devCode);
            }
        } else {
            showToast('❌ ' + (data.error || 'Ошибка регистрации'), 'error');
        }
    } catch (error) {
        showToast('❌ Ошибка соединения с сервером', 'error');
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
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('vibechat_token', data.token);
            localStorage.setItem('vibechat_user', JSON.stringify(data.user));
            currentUser = data.user;
            
            showToast('✅ Вход выполнен!', 'success');
            setTimeout(() => showApp(), 1000);
        } else {
            showToast('❌ ' + (data.error || 'Ошибка входа'), 'error');
        }
    } catch (error) {
        showToast('❌ Ошибка соединения с сервером', 'error');
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
        const response = await fetch(`${API_URL}/auth/register/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, code })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('vibechat_token', data.token);
            localStorage.setItem('vibechat_user', JSON.stringify(data.user));
            currentUser = data.user;
            
            showToast('✅ Регистрация успешна!', 'success');
            setTimeout(() => showApp(), 1000);
        } else {
            showToast('❌ ' + (data.error || 'Неверный код'), 'error');
        }
    } catch (error) {
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

console.log('✅ auth.js загружен');