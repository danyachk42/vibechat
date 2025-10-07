// ============================================
// РАБОТА С МЕДИА ФАЙЛАМИ
// ============================================

let mediaRecorder = null;
let audioChunks = [];
let recordingStartTime = null;
let recordingInterval = null;

// ============================================
// ЗАГРУЗКА ФАЙЛОВ
// ============================================
async function handleFileUpload(event) {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;
    
    console.log('📎 Загрузка файлов:', files.length);
    
    // Показываем превью перед отправкой
    showMediaPreview(files);
    
    event.target.value = '';
}

function showMediaPreview(files) {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'mediaPreviewModal';
    
    const filesHTML = files.map((file, index) => {
        const fileType = getFileType(file);
        const fileIcon = getFileIcon(file);
        
        let preview = '';
        if (fileType === 'image') {
            const url = URL.createObjectURL(file);
            preview = `<img src="${url}" style="max-width: 100%; max-height: 300px; border-radius: 12px;">`;
        } else if (fileType === 'video') {
            const url = URL.createObjectURL(file);
            preview = `<video src="${url}" controls style="max-width: 100%; max-height: 300px; border-radius: 12px;"></video>`;
        } else if (fileType === 'audio') {
            const url = URL.createObjectURL(file);
            preview = `
                <div class="audio-preview">
                    <i class="fas fa-music" style="font-size: 48px; color: var(--primary);"></i>
                    <audio src="${url}" controls style="width: 100%; margin-top: 16px;"></audio>
                </div>
            `;
        } else {
            preview = `
                <div class="file-preview-icon">
                    <i class="fas ${fileIcon}" style="font-size: 64px; color: var(--primary);"></i>
                </div>
            `;
        }
        
        return `
            <div class="media-preview-item" data-file-index="${index}">
                ${preview}
                <div class="media-preview-info">
                    <div class="media-preview-name">${file.name}</div>
                    <div class="media-preview-size">${formatFileSize(file.size)}</div>
                </div>
                <button class="media-preview-remove" onclick="removeFileFromPreview(${index})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    }).join('');
    
    modal.innerHTML = `
        <div class="modal-content modal-large">
            <button class="modal-close" onclick="closeMediaPreview()">
                <i class="fas fa-times"></i>
            </button>
            
            <div class="modal-header">
                <div class="modal-icon">
                    <i class="fas fa-paperclip"></i>
                </div>
                <h2>Отправить файлы</h2>
                <p>Выбрано файлов: ${files.length}</p>
            </div>
            
            <div class="media-preview-grid">
                ${filesHTML}
            </div>
            
            <div class="form-group">
                <label><i class="fas fa-comment"></i> Подпись (необязательно)</label>
                <textarea class="form-control" id="mediaCaption" placeholder="Добавьте подпись к файлам..." rows="2"></textarea>
            </div>
            
            <div style="display: flex; gap: 12px;">
                <button class="btn" onclick="closeMediaPreview()" style="background: rgba(255,255,255,0.05);">
                    <span class="btn-text">Отмена</span>
                </button>
                <button class="btn btn-primary" onclick="sendMediaFiles()">
                    <span class="btn-text">Отправить</span>
                    <span class="btn-icon"><i class="fas fa-paper-plane"></i></span>
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Сохраняем файлы для отправки
    window.pendingMediaFiles = files;
}

function closeMediaPreview() {
    const modal = document.getElementById('mediaPreviewModal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    }
    window.pendingMediaFiles = null;
}

function removeFileFromPreview(index) {
    const filesArray = Array.from(window.pendingMediaFiles);
    filesArray.splice(index, 1);
    window.pendingMediaFiles = filesArray;
    
    if (filesArray.length === 0) {
        closeMediaPreview();
    } else {
        showMediaPreview(filesArray);
    }
}

async function sendMediaFiles() {
    if (!window.pendingMediaFiles || window.pendingMediaFiles.length === 0) return;
    
    const caption = document.getElementById('mediaCaption')?.value.trim() || '';
    const files = window.pendingMediaFiles;
    
    console.log('📤 Отправка файлов:', files.length);
    
    closeMediaPreview();
    
    for (const file of files) {
        await uploadFile(file, caption);
    }
}

async function uploadFile(file, caption = '') {
    if (!currentChat) return;
    
    console.log('📤 Отправка файла:', file.name);
    
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
        showToast('Файл слишком большой (макс. 50 МБ)', 'error');
        return;
    }
    
    const fileType = getFileType(file);
    const reader = new FileReader();
    
    reader.onload = async function(e) {
        const fileData = e.target.result;
        
        try {
            const response = await fetch(`${API_URL}/messages/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('vibechat_token')}`
                },
                body: JSON.stringify({
                    chatId: currentChat.id,
                    senderId: currentUser.id,
                    type: fileType,
                    fileName: file.name,
                    fileSize: file.size,
                    fileData: fileData,
                    text: caption,
                    timestamp: Date.now()
                })
            });

            const data = await response.json();

            if (response.ok) {
                console.log('✅ Файл отправлен:', file.name);
                showToast(`✅ ${getFileTypeLabel(fileType)} отправлен!`, 'success');
            } else {
                showToast(data.error || 'Ошибка отправки файла', 'error');
            }
        } catch (error) {
            console.error('❌ Ошибка отправки файла:', error);
            showToast('Ошибка отправки файла', 'error');
        }
    };
    
    reader.readAsDataURL(file);
}

function getFileType(file) {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    return 'file';
}

function getFileIcon(file) {
    if (file.type.startsWith('image/')) return 'fa-image';
    if (file.type.startsWith('video/')) return 'fa-video';
    if (file.type.startsWith('audio/')) return 'fa-music';
    if (file.type === 'application/pdf') return 'fa-file-pdf';
    if (file.type.includes('word')) return 'fa-file-word';
    if (file.type.includes('excel') || file.type.includes('spreadsheet')) return 'fa-file-excel';
    if (file.type.includes('zip') || file.type.includes('rar')) return 'fa-file-archive';
    return 'fa-file';
}

function getFileTypeLabel(type) {
    const labels = {
        'image': 'Изображение',
        'video': 'Видео',
        'audio': 'Аудио',
        'file': 'Файл'
    };
    return labels[type] || 'Файл';
}

// ============================================
// ГОЛОСОВЫЕ СООБЩЕНИЯ
// ============================================
async function startVoiceRecording() {
    console.log('🎤 Начало записи голосового сообщения');
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        
        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };
        
        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            await sendVoiceMessage(audioBlob);
            stream.getTracks().forEach(track => track.stop());
        };
        
        mediaRecorder.start();
        recordingStartTime = Date.now();
        
        document.getElementById('messageInputWrapper').style.display = 'none';
        document.getElementById('voiceRecording').classList.add('active');
        
        recordingInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            document.getElementById('voiceRecordingTime').textContent = 
                `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
        
    } catch (error) {
        console.error('❌ Ошибка записи:', error);
        showToast('Не удалось получить доступ к микрофону', 'error');
    }
}

function cancelVoiceRecording() {
    console.log('❌ Отмена записи');
    
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }
    clearInterval(recordingInterval);
    document.getElementById('messageInputWrapper').style.display = 'flex';
    document.getElementById('voiceRecording').classList.remove('active');
    audioChunks = [];
}

function sendVoiceMessageBtn() {
    console.log('📤 Отправка голосового сообщения');
    
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }
    clearInterval(recordingInterval);
    document.getElementById('messageInputWrapper').style.display = 'flex';
    document.getElementById('voiceRecording').classList.remove('active');
}

async function sendVoiceMessage(audioBlob) {
    if (!currentChat) return;
    
    console.log('📤 Отправка голосового сообщения, размер:', formatFileSize(audioBlob.size));
    
    const reader = new FileReader();
    reader.onload = async function(e) {
        const audioData = e.target.result;
        
        try {
            const response = await fetch(`${API_URL}/messages/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('vibechat_token')}`
                },
                body: JSON.stringify({
                    chatId: currentChat.id,
                    senderId: currentUser.id,
                    type: 'voice',
                    fileData: audioData,
                    fileSize: audioBlob.size,
                    timestamp: Date.now()
                })
            });

            if (response.ok) {
                console.log('✅ Голосовое сообщение отправлено');
                showToast('🎤 Голосовое сообщение отправлено!', 'success');
            } else {
                showToast('Ошибка отправки голосового сообщения', 'error');
            }
        } catch (error) {
            console.error('❌ Ошибка отправки:', error);
            showToast('Ошибка отправки голосового сообщения', 'error');
        }
    };
    
    reader.readAsDataURL(audioBlob);
}

console.log('✅ media.js загружен');