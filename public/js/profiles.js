// ============================================
// ПРОФИЛИ ПОЛЬЗОВАТЕЛЕЙ
// ============================================

// Открытие профиля другого пользователя
async function openUserProfile(userId) {
    console.log('👤 Открытие профиля пользователя:', userId);
    
    if (userId === currentUser.id) {
        openProfile();
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/users/${userId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('vibechat_token')}`
            }
        });

        const data = await response.json();
        const user = data;

        if (response.ok) {
            showUserProfileModal(user);
        } else {
            showToast('Ошибка загрузки профиля', 'error');
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки профиля:', error);
        showToast('Ошибка загрузки профиля', 'error');
    }
}

function showUserProfileModal(user) {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'userProfileModal';
    
    modal.innerHTML = `
        <div class="modal-content modal-large">
            <button class="modal-close" onclick="closeUserProfile()">
                <i class="fas fa-times"></i>
            </button>
            
            <div class="profile-avatar-section">
                <div class="profile-avatar-large">
                    ${user.avatarUrl ? `<img src="${user.avatarUrl}">` : `<span>${user.name[0].toUpperCase()}</span>`}
                </div>
                <h2 style="font-size: 28px; font-weight: 700; margin-bottom: 8px;">${user.name}</h2>
                <p style="color: var(--text-secondary); font-size: 16px;">@${user.username}</p>
                ${user.verified ? '<span style="color: var(--info); font-size: 14px;"><i class="fas fa-check-circle"></i> Подтвержден</span>' : ''}
            </div>
            
            <div class="user-profile-info">
                ${user.bio ? `
                    <div class="user-info-item">
                        <i class="fas fa-info-circle"></i>
                        <div>
                            <div class="user-info-label">О себе</div>
                            <div class="user-info-value">${escapeHtml(user.bio)}</div>
                        </div>
                    </div>
                ` : ''}
                
                ${user.status ? `
                    <div class="user-info-item">
                        <i class="fas fa-comment"></i>
                        <div>
                            <div class="user-info-label">Статус</div>
                            <div class="user-info-value">${escapeHtml(user.status)}</div>
                        </div>
                    </div>
                ` : ''}
                
                ${user.phone ? `
                    <div class="user-info-item">
                        <i class="fas fa-phone"></i>
                        <div>
                            <div class="user-info-label">Телефон</div>
                            <div class="user-info-value">${user.phone}</div>
                        </div>
                    </div>
                ` : ''}
                
                ${user.city ? `
                    <div class="user-info-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <div>
                            <div class="user-info-label">Город</div>
                            <div class="user-info-value">${user.city}</div>
                        </div>
                    </div>
                ` : ''}
                
                <div class="user-info-item">
                    <i class="fas fa-clock"></i>
                    <div>
                        <div class="user-info-label">Последний визит</div>
                        <div class="user-info-value">${user.online ? 'в сети' : formatTime(user.lastSeen)}</div>
                    </div>
                </div>
            </div>
            
            <div style="display: flex; gap: 12px; margin-top: 32px;">
                <button class="btn btn-primary" onclick="createChatWithUser('${user.id}'); closeUserProfile();">
                    <span class="btn-text">Написать</span>
                    <span class="btn-icon"><i class="fas fa-comment"></i></span>
                </button>
                <button class="btn" onclick="blockUser('${user.id}')" style="background: rgba(239, 68, 68, 0.1); color: var(--danger);">
                    <span class="btn-text">Заблокировать</span>
                    <span class="btn-icon"><i class="fas fa-ban"></i></span>
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function closeUserProfile() {
    const modal = document.getElementById('userProfileModal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    }
}

function blockUser(userId) {
    if (confirm('Заблокировать этого пользователя?')) {
        showToast('🚫 Пользователь заблокирован', 'success');
        closeUserProfile();
    }
}

// Открытие своего профиля
function openProfile() {
    console.log('👤 Открытие профиля');
    document.getElementById('profileModal').classList.add('active');
    
    document.getElementById('profileName').value = currentUser.name || '';
    document.getElementById('profileUsername').value = '@' + (currentUser.username || '');
    document.getElementById('profileBio').value = currentUser.bio || '';
    document.getElementById('profileStatus').value = currentUser.status || '';
    document.getElementById('profilePhone').value = currentUser.phone || '';
    document.getElementById('profileBirthday').value = currentUser.birthday || '';
    document.getElementById('profileCity').value = currentUser.city || '';
    
    const avatarText = currentUser.name[0].toUpperCase();
    document.getElementById('profileAvatarText').textContent = avatarText;
    
    if (currentUser.avatarUrl) {
        document.getElementById('profileAvatarImg').src = currentUser.avatarUrl;
        document.getElementById('profileAvatarImg').style.display = 'block';
        document.getElementById('profileAvatarText').style.display = 'none';
    }
    
    document.getElementById('privacyOnlineStatus').checked = currentUser.settings?.showOnlineStatus !== false;
    document.getElementById('privacyLastSeen').checked = currentUser.settings?.showLastSeen !== false;
    document.getElementById('privacyProfilePhoto').checked = currentUser.settings?.showProfilePhoto !== false;
    document.getElementById('settingsNotifications').checked = currentUser.settings?.notifications !== false;
    document.getElementById('settingsSound').checked = currentUser.settings?.soundEnabled !== false;
}

function closeProfile() {
    document.getElementById('profileModal').classList.remove('active');
}

function switchProfileTab(tab) {
    document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.profile-tab-content').forEach(c => c.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(`profileTab${tab.charAt(0).toUpperCase() + tab.slice(1)}`).classList.add('active');
}

async function uploadAvatar(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        showToast('Пожалуйста, выберите изображение', 'error');
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        showToast('Размер файла не должен превышать 5 МБ', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const avatarUrl = e.target.result;
        
        document.getElementById('profileAvatarImg').src = avatarUrl;
        document.getElementById('profileAvatarImg').style.display = 'block';
        document.getElementById('profileAvatarText').style.display = 'none';
        
        currentUser.avatarUrl = avatarUrl;
        localStorage.setItem('vibechat_user', JSON.stringify(currentUser));
        
        document.getElementById('userAvatarImg').src = avatarUrl;
        document.getElementById('userAvatarImg').style.display = 'block';
        document.getElementById('userAvatarText').style.display = 'none';
        
        showToast('✅ Аватар обновлен!', 'success');
    };
    reader.readAsDataURL(file);
}

async function saveProfile() {
    const name = document.getElementById('profileName').value.trim();
    const bio = document.getElementById('profileBio').value.trim();
    const status = document.getElementById('profileStatus').value.trim();
    const phone = document.getElementById('profilePhone').value.trim();
    const birthday = document.getElementById('profileBirthday').value;
    const city = document.getElementById('profileCity').value.trim();
    
    if (!name) {
        showToast('Имя обязательно для заполнения', 'error');
        return;
    }
    
    currentUser.name = name;
    currentUser.bio = bio;
    currentUser.status = status;
    currentUser.phone = phone;
    currentUser.birthday = birthday;
    currentUser.city = city;
    
    localStorage.setItem('vibechat_user', JSON.stringify(currentUser));
    updateUserProfile();
    
    showToast('✅ Профиль сохранен!', 'success');
}

async function savePrivacy() {
    currentUser.settings = currentUser.settings || {};
    currentUser.settings.showOnlineStatus = document.getElementById('privacyOnlineStatus').checked;
    currentUser.settings.showLastSeen = document.getElementById('privacyLastSeen').checked;
    currentUser.settings.showProfilePhoto = document.getElementById('privacyProfilePhoto').checked;
    
    localStorage.setItem('vibechat_user', JSON.stringify(currentUser));
    
    showToast('✅ Настройки приватности сохранены!', 'success');
}

async function logout() {
    if (!confirm('Вы уверены, что хотите выйти?')) return;
    
    try {
        await fetch(`${API_URL}/auth/logout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.id })
        });
    } catch (error) {
        console.error('Ошибка выхода:', error);
    }
    
    localStorage.removeItem('vibechat_token');
    localStorage.removeItem('vibechat_user');
    location.reload();
}

console.log('✅ profiles.js загружен');