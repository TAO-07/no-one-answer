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
});

// 返回按钮
backBtn.addEventListener('click', () => {
    saveScreen.classList.remove('active');
    callScreen.classList.add('active');
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
