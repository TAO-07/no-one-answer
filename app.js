// 检查是否已解锁过音频
let isAudioUnlocked = false;

// DOM元素
const unlockOverlay = document.getElementById('unlock-overlay');
const callScreen = document.getElementById('call-screen');
const ringtone = document.getElementById('ringtone');
const acceptBtn = document.getElementById('accept-btn');
const declineBtn = document.getElementById('decline-btn');
const endedMessage = document.getElementById('ended-message');
const homeBtn = document.getElementById('home-btn');
const saveBtn = document.getElementById('save-btn');
const saveScreen = document.getElementById('save-screen');
const backBtn = document.getElementById('back-btn');
const saveSubmitBtn = document.getElementById('save-submit-btn');
const timeInput = document.getElementById('time-input');
const locationInput = document.getElementById('location-input');
const plateInput = document.getElementById('plate-input');
const colorInput = document.getElementById('color-input');
const recordsList = document.getElementById('records-list');
const clearAllBtn = document.getElementById('clear-all-btn');

// iOS音频解锁
unlockOverlay.addEventListener('click', async () => {
    if (!isAudioUnlocked) {
        try {
            // 尝试播放音频以解锁iOS音频限制
            await ringtone.play();
            ringtone.pause();
            isAudioUnlocked = true;

            // 隐藏解锁层，显示来电界面
            unlockOverlay.style.display = 'none';
            callScreen.classList.add('active');

            // 开始播放铃声
            ringtone.currentTime = 0;
            await ringtone.play();
        } catch (error) {
            console.log('音频解锁失败:', error);
            // 即使失败也继续显示来电界面
            unlockOverlay.style.display = 'none';
            callScreen.classList.add('active');
        }
    }
});

// 触摸开始时的解锁处理（备用方案）
unlockOverlay.addEventListener('touchstart', async (e) => {
    if (!isAudioUnlocked) {
        e.preventDefault();
        // 触发click事件
        unlockOverlay.click();
    }
});

// 接听按钮
acceptBtn.addEventListener('click', () => {
    // 停止铃声
    ringtone.pause();
    ringtone.currentTime = 0;

    // 跳转到通话页面
    window.location.href = 'call.html';
});

// 首页按钮
homeBtn.addEventListener('click', () => {
    window.location.href = 'home.html';
});

// 保存记录按钮
saveBtn.addEventListener('click', () => {
    callScreen.classList.remove('active');
    saveScreen.classList.add('active');
    renderRecords();
});

// 返回按钮
backBtn.addEventListener('click', () => {
    saveScreen.classList.remove('active');
    callScreen.classList.add('active');
});

// 保存记录逻辑
saveSubmitBtn.addEventListener('click', () => {
    const time = timeInput.value.trim();
    const location = locationInput.value.trim();
    const plate = plateInput.value.trim();
    const color = colorInput.value;

    // 基本校验：至少填写一项
    if (!time && !location && !plate) {
        showToast('请填写至少一项');
        return;
    }

    // 构建记录对象
    const record = {
        id: Date.now().toString(),
        time: time,
        location: location,
        plate: plate,
        color: color,
        createdAt: Date.now()
    };

    // 读取现有记录
    const existingRecords = JSON.parse(localStorage.getItem('pickup_records') || '[]');

    // 追加新记录
    existingRecords.push(record);

    // 保存回 localStorage
    localStorage.setItem('pickup_records', JSON.stringify(existingRecords));

    // 清空表单
    timeInput.value = '';
    locationInput.value = '';
    plateInput.value = '';
    colorInput.value = '';

    // 显示成功提示
    showToast('已保存');

    // 刷新列表
    renderRecords();
});

// 显示轻提示
function showToast(message) {
    // 移除已存在的 toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    // 创建新 toast
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    // 2秒后自动消失
    setTimeout(() => {
        toast.remove();
    }, 2000);
}

// 渲染记录列表
function renderRecords() {
    const records = JSON.parse(localStorage.getItem('pickup_records') || '[]');

    // 按创建时间倒序排序
    records.sort((a, b) => b.createdAt - a.createdAt);

    if (records.length === 0) {
        recordsList.innerHTML = '<div class="no-records">暂无记录</div>';
        return;
    }

    recordsList.innerHTML = records.map(record => `
        <div class="record-item">
            <div class="record-info">
                <div class="record-field">
                    <span class="record-field-label">时间:</span>
                    <span class="record-field-value">${record.time || '-'}</span>
                </div>
                <div class="record-field">
                    <span class="record-field-label">地点:</span>
                    <span class="record-field-value">${record.location || '-'}</span>
                </div>
                <div class="record-field">
                    <span class="record-field-label">车牌:</span>
                    <span class="record-field-value">${record.plate || '-'}</span>
                </div>
                <div class="record-field">
                    <span class="record-field-label">颜色:</span>
                    <span class="record-field-value">${record.color || '-'}</span>
                </div>
            </div>
            <button class="delete-btn" data-id="${record.id}">删除</button>
        </div>
    `).join('');

    // 绑定删除事件
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            deleteRecord(id);
        });
    });
}

// 删除单条记录
function deleteRecord(id) {
    const records = JSON.parse(localStorage.getItem('pickup_records') || '[]');
    const filteredRecords = records.filter(record => record.id !== id);
    localStorage.setItem('pickup_records', JSON.stringify(filteredRecords));
    renderRecords();
    showToast('已删除');
}

// 清空全部记录
clearAllBtn.addEventListener('click', () => {
    if (confirm('确定要清空所有记录吗？此操作不可恢复。')) {
        localStorage.removeItem('pickup_records');
        renderRecords();
        showToast('已清空');
    }
});

// 挂断按钮
declineBtn.addEventListener('click', () => {
    // 停止铃声
    ringtone.pause();
    ringtone.currentTime = 0;

    // 隐藏来电信息，显示挂断提示
    document.querySelector('.call-header').style.display = 'none';
    document.querySelector('.call-actions').style.display = 'none';
    endedMessage.classList.add('active');
});

// 防止双击缩放
document.addEventListener('dblclick', (e) => {
    e.preventDefault();
});

// 防止长按选择
document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

// 注册Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(registration => {
                console.log('Service Worker注册成功:', registration.scope);
            })
            .catch(error => {
                console.log('Service Worker注册失败:', error);
            });
    });
}
