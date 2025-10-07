// ГРУППЫ И КАНАЛЫ
let currentGroupMembers = [];

function openCreateGroup() {
    document.getElementById('createMenu').classList.remove('active');
    document.getElementById('createGroupModal').classList.add('active');
}

function closeCreateGroup() {
    document.getElementById('createGroupModal').classList.remove('active');
}

async function createGroup() {
    const name = document.getElementById('groupName').value.trim();
    const description = document.getElementById('groupDescription').value.trim();
    const type = document.getElementById('groupType').value;
    
    if (!name) {
        showToast('Введите название группы', 'error');
        return;
    }
    
    const newGroup = {
        id: 'group_' + generateId(),
        type: 'group',
        name: name,
        description: description,
        groupType: type,
        membersCount: 1,
        members: [currentUser.id],
        admins: [currentUser.id],
        creator: currentUser.id,
        lastMessage: 'Группа создана',
        lastMessageTime: Date.now(),
        unreadCount: 0
    };
    
    chats.unshift(newGroup);
    renderChats(chats);
    closeCreateGroup();
    showToast(`✅ Группа "${name}" создана!`, 'success');
    
    document.getElementById('groupName').value = '';
    document.getElementById('groupDescription').value = '';
}

function openCreateChannel() {
    document.getElementById('createMenu').classList.remove('active');
    document.getElementById('createChannelModal').classList.add('active');
}

function closeCreateChannel() {
    document.getElementById('createChannelModal').classList.remove('active');
}

async function createChannel() {
    const name = document.getElementById('channelName').value.trim();
    const description = document.getElementById('channelDescription').value.trim();
    const type = document.getElementById('channelType').value;
    
    if (!name) {
        showToast('Введите название канала', 'error');
        return;
    }
    
    const newChannel = {
        id: 'channel_' + generateId(),
        type: 'channel',
        name: name,
        description: description,
        channelType: type,
        subscribersCount: 1,
        subscribers: [currentUser.id],
        owner: currentUser.id,
        lastMessage: 'Канал создан',
        lastMessageTime: Date.now(),
        unreadCount: 0
    };
    
    chats.unshift(newChannel);
    renderChats(chats);
    closeCreateChannel();
    showToast(`✅ Канал "${name}" создан!`, 'success');
    
    document.getElementById('channelName').value = '';
    document.getElementById('channelDescription').value = '';
}

console.log('✅ groups.js загружен');