// ============================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================

// Debounce для оптимизации поиска
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Форматирование времени
function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'только что';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} мин назад`;
    
    if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    }
    
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return 'вчера';
    
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} дн назад`;
    
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
}

// Экранирование HTML
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Показ уведомлений
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.innerHTML = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Форматирование размера файла
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Генерация уникального ID
function generateId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

// Показ модального окна
function showModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

// Скрытие модального окна
function hideModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Создание контекстного меню
function createContextMenu(x, y, items) {
    // Удаляем старое меню если есть
    const oldMenu = document.getElementById('contextMenu');
    if (oldMenu) oldMenu.remove();
    
    const menu = document.createElement('div');
    menu.id = 'contextMenu';
    menu.className = 'context-menu';
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    
    menu.innerHTML = items.map(item => {
        if (item.divider) {
            return '<div class="context-menu-divider"></div>';
        }
        return `
            <button class="context-menu-item ${item.danger ? 'danger' : ''}" onclick="${item.action}">
                <i class="fas ${item.icon}"></i>
                <span>${item.label}</span>
            </button>
        `;
    }).join('');
    
    document.body.appendChild(menu);
    
    // Анимация появления
    setTimeout(() => menu.classList.add('active'), 10);
    
    // Закрытие при клике вне меню
    setTimeout(() => {
        document.addEventListener('click', function closeMenu(e) {
            if (!menu.contains(e.target)) {
                menu.classList.remove('active');
                setTimeout(() => menu.remove(), 300);
                document.removeEventListener('click', closeMenu);
            }
        });
    }, 100);
}

console.log('✅ utils.js загружен');