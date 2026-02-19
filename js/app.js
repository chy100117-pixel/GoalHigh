/**
 * 背单词应用主入口
 * 初始化所有模块并启动应用
 */
const App = {
    /**
     * 初始化应用
     */
    async init() {
        console.log('🚀 背单词应用启动中...');

        try {
            // 1. 检查并重置每日数据
            Storage.checkDailyReset();

            // 2. 初始化词库
            await Vocabulary.init();

            // 3. 初始化UI
            UI.init();

            // 3b. 初始化番茄钟
            if (window.Pomodoro) window.Pomodoro.init();

            // 4. 检查成就
            const newAchievements = Achievement.checkAllAchievements();
            newAchievements.forEach(a => {
                setTimeout(() => Achievement.showUnlockNotification(a), 1000);
            });

            console.log('✅ 应用初始化完成');

        } catch (error) {
            console.error('❌ 应用初始化失败:', error);
            UI.showToast('应用加载失败，请刷新页面重试', 'error');
        }
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// 添加SVG渐变（用于进度环）
document.addEventListener('DOMContentLoaded', () => {
    const svg = document.querySelector('.progress-ring');
    if (svg) {
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        defs.innerHTML = `
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style="stop-color:var(--primary);stop-opacity:1" />
                <stop offset="100%" style="stop-color:var(--primary-light);stop-opacity:1" />
            </linearGradient>
        `;
        svg.insertBefore(defs, svg.firstChild);

        // 设置stroke为渐变
        const fill = document.getElementById('progressRing');
        if (fill) {
            fill.style.stroke = 'url(#progressGradient)';
        }
    }
});

// 导出
window.App = App;
