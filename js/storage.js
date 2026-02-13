/**
 * 本地存储管理模块
 * 使用 LocalStorage 存储所有数据
 */

const Storage = {
    // 存储键名
    KEYS: {
        VOCABULARY: 'vocabulary_words',      // 词库数据
        PROGRESS: 'vocabulary_progress',     // 学习进度
        SETTINGS: 'vocabulary_settings',     // 用户设置
        STATS: 'vocabulary_stats',           // 统计数据
        ACHIEVEMENTS: 'vocabulary_achievements', // 成就
        CALENDAR: 'vocabulary_calendar',     // 学习日历
        WRONG_BOOK: 'vocabulary_wrongbook',  // 错题本
        FAVORITES: 'vocabulary_favorites',   // 收藏夹
        USER_EDITS: 'vocabulary_user_edits'  // 用户自定义编辑
    },

    /**
     * 保存数据
     * @param {string} key 存储键名
     * @param {any} data 要存储的数据
     */
    save(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('保存数据失败:', e);
            return false;
        }
    },

    /**
     * 读取数据
     * @param {string} key 存储键名
     * @param {any} defaultValue 默认值
     * @returns {any} 存储的数据或默认值
     */
    load(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            console.error('读取数据失败:', e);
            return defaultValue;
        }
    },

    /**
     * 删除数据
     * @param {string} key 存储键名
     */
    remove(key) {
        localStorage.removeItem(key);
    },

    /**
     * 清除所有数据
     */
    clear() {
        Object.values(this.KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
    },

    // ========================================
    // 词库相关
    // ========================================

    /**
     * 获取词库
     * @returns {Array} 词库数组
     */
    getVocabulary() {
        return this.load(this.KEYS.VOCABULARY, []);
    },

    /**
     * 保存词库
     * @param {Array} words 词库数组
     */
    saveVocabulary(words) {
        this.save(this.KEYS.VOCABULARY, words);
    },

    /**
     * 添加单词到词库
     * @param {Object|Array} words 单词或单词数组
     */
    addWords(words) {
        const vocabulary = this.getVocabulary();
        const newWords = Array.isArray(words) ? words : [words];

        newWords.forEach(word => {
            // 检查是否已存在
            const existIndex = vocabulary.findIndex(w => w.word.toLowerCase() === word.word.toLowerCase());
            if (existIndex === -1) {
                vocabulary.push(word);
            } else {
                // 更新已存在的单词
                vocabulary[existIndex] = { ...vocabulary[existIndex], ...word };
            }
        });

        this.saveVocabulary(vocabulary);
    },

    // ========================================
    // 学习进度相关
    // ========================================

    /**
     * 获取所有学习进度
     * @returns {Object} 进度对象 { wordId: progressData }
     */
    getProgress() {
        return this.load(this.KEYS.PROGRESS, {});
    },

    /**
     * 获取单个单词的进度
     * @param {string} wordId 单词ID
     * @returns {Object} 进度数据
     */
    getWordProgress(wordId) {
        const progress = this.getProgress();
        return progress[wordId] || this.createDefaultProgress(wordId);
    },

    /**
     * 创建默认进度
     * @param {string} wordId 单词ID
     * @returns {Object} 默认进度
     */
    createDefaultProgress(wordId) {
        return {
            wordId: wordId,
            level: 0,           // 熟练度 0-5
            nextReview: null,   // 下次复习时间
            wrongCount: 0,      // 错误次数
            correctCount: 0,    // 正确次数
            lastStudied: null,  // 最后学习时间
            isFavorite: false,  // 是否收藏
            isInWrongBook: false // 是否在错题本
        };
    },

    /**
     * 更新单词进度
     * @param {string} wordId 单词ID
     * @param {Object} data 更新的数据
     */
    updateProgress(wordId, data) {
        const progress = this.getProgress();
        const current = progress[wordId] || this.createDefaultProgress(wordId);
        progress[wordId] = { ...current, ...data, wordId };
        this.save(this.KEYS.PROGRESS, progress);
    },

    /**
     * 批量更新进度
     * @param {Object} progressData 进度数据对象
     */
    batchUpdateProgress(progressData) {
        const progress = this.getProgress();
        Object.assign(progress, progressData);
        this.save(this.KEYS.PROGRESS, progress);
    },

    // ========================================
    // 设置相关
    // ========================================

    /**
     * 获取设置
     * @returns {Object} 设置对象
     */
    getSettings() {
        return this.load(this.KEYS.SETTINGS, {
            dailyNewGoal: 20,       // 每日新词目标
            dailyReviewGoal: 50,    // 每日复习目标
            theme: 'dark',          // 主题
            learnMode: 'flashcard', // 默认学习模式：flashcard, spelling, listening, choice, forms
            speakRate: 1.0,         // 发音语速
            autoPlay: true,         // 自动发音
            batchSize: 20           // 每组学习单词数量
        });
    },

    /**
     * 更新设置
     * @param {Object} settings 设置数据
     */
    updateSettings(settings) {
        const current = this.getSettings();
        return this.save(this.KEYS.SETTINGS, { ...current, ...settings });
    },

    // ========================================
    // 统计相关
    // ========================================

    /**
     * 获取统计数据
     * @returns {Object} 统计对象
     */
    getStats() {
        return this.load(this.KEYS.STATS, {
            totalLearned: 0,        // 总学习单词数
            todayLearned: 0,        // 今日学习数
            todayReviewed: 0,       // 今日复习数
            streak: 0,              // 连续天数
            lastStudyDate: null,    // 最后学习日期
            totalCorrect: 0,        // 总正确次数
            totalWrong: 0           // 总错误次数
        });
    },

    /**
     * 更新统计
     * @param {Object} stats 统计数据
     */
    updateStats(stats) {
        const current = this.getStats();
        this.save(this.KEYS.STATS, { ...current, ...stats });
    },

    /**
     * 获取今日日期字符串
     * @returns {string} YYYY-MM-DD 格式
     */
    getTodayString() {
        return new Date().toISOString().split('T')[0];
    },

    /**
     * 检查并更新每日数据
     */
    checkDailyReset() {
        const stats = this.getStats();
        const today = this.getTodayString();

        if (stats.lastStudyDate !== today) {
            // 新的一天，重置今日数据
            const yesterday = stats.lastStudyDate;

            // 检查连续天数
            if (yesterday) {
                const yesterdayDate = new Date(yesterday);
                const todayDate = new Date(today);
                const diffDays = Math.floor((todayDate - yesterdayDate) / (1000 * 60 * 60 * 24));

                if (diffDays === 1) {
                    // 连续学习
                    stats.streak = (stats.streak || 0) + 1;
                } else if (diffDays > 1) {
                    // 中断了
                    stats.streak = 0;
                }
            }

            stats.todayLearned = 0;
            stats.todayReviewed = 0;
            stats.lastStudyDate = today;
            this.updateStats(stats);
        }

        return stats;
    },

    // ========================================
    // 学习日历相关
    // ========================================

    /**
     * 获取学习日历
     * @returns {Object} 日历数据 { date: wordCount }
     */
    getCalendar() {
        return this.load(this.KEYS.CALENDAR, {});
    },

    /**
     * 记录今日学习
     * @param {number} count 学习数量
     */
    recordStudyDay(count = 1) {
        const calendar = this.getCalendar();
        const today = this.getTodayString();
        calendar[today] = (calendar[today] || 0) + count;
        this.save(this.KEYS.CALENDAR, calendar);
    },

    // ========================================
    // 错题本相关
    // ========================================

    /**
     * 获取错题本
     * @returns {Array} 错题单词ID列表
     */
    getWrongBook() {
        return this.load(this.KEYS.WRONG_BOOK, []);
    },

    /**
     * 添加到错题本
     * @param {string} wordId 单词ID
     */
    addToWrongBook(wordId) {
        const wrongBook = this.getWrongBook();
        if (!wrongBook.includes(wordId)) {
            wrongBook.push(wordId);
            this.save(this.KEYS.WRONG_BOOK, wrongBook);
        }
        // 同时更新进度
        this.updateProgress(wordId, { isInWrongBook: true });
    },

    /**
     * 从错题本移除
     * @param {string} wordId 单词ID
     */
    removeFromWrongBook(wordId) {
        const wrongBook = this.getWrongBook();
        const index = wrongBook.indexOf(wordId);
        if (index > -1) {
            wrongBook.splice(index, 1);
            this.save(this.KEYS.WRONG_BOOK, wrongBook);
        }
        this.updateProgress(wordId, { isInWrongBook: false });
    },

    // ========================================
    // 收藏夹相关
    // ========================================

    /**
     * 获取收藏夹
     * @returns {Array} 收藏单词ID列表
     */
    getFavorites() {
        return this.load(this.KEYS.FAVORITES, []);
    },

    /**
     * 切换收藏状态
     * @param {string} wordId 单词ID
     * @returns {boolean} 收藏状态
     */
    toggleFavorite(wordId) {
        const favorites = this.getFavorites();
        const index = favorites.indexOf(wordId);
        let isFavorite;

        if (index > -1) {
            favorites.splice(index, 1);
            isFavorite = false;
        } else {
            favorites.push(wordId);
            isFavorite = true;
        }

        this.save(this.KEYS.FAVORITES, favorites);
        this.updateProgress(wordId, { isFavorite });
        return isFavorite;
    },

    // ========================================
    // 成就相关
    // ========================================

    /**
     * 获取成就
     * @returns {Object} 成就数据
     */
    getAchievements() {
        return this.load(this.KEYS.ACHIEVEMENTS, {});
    },

    /**
     * 解锁成就
     * @param {string} achievementId 成就ID
     */
    unlockAchievement(achievementId) {
        const achievements = this.getAchievements();
        if (!achievements[achievementId]) {
            achievements[achievementId] = {
                unlockedAt: new Date().toISOString()
            };
            this.save(this.KEYS.ACHIEVEMENTS, achievements);
            return true; // 新解锁
        }
        return false;
    },

    // ========================================
    // 数据导入导出
    // ========================================

    /**
     * 导出所有数据
     * @returns {Object} 所有数据对象
     */
    exportAll() {
        const data = {};
        Object.entries(this.KEYS).forEach(([name, key]) => {
            data[name] = this.load(key, null);
        });
        data.exportDate = new Date().toISOString();
        return data;
    },

    /**
     * 导入所有数据
     * @param {Object} data 数据对象
     */
    importAll(data) {
        Object.entries(this.KEYS).forEach(([name, key]) => {
            if (data[name] !== undefined) {
                this.save(key, data[name]);
            }
        });
    },

    // ========================================
    // 用户自定义数据
    // ========================================

    /**
     * 获取所有用户编辑
     */
    getUserEdits() {
        return this.load(this.KEYS.USER_EDITS, {});
    },

    /**
     * 保存用户编辑
     * @param {string} word 单词
     * @param {Object} data 编辑的数据
     */
    saveUserEdit(word, data) {
        const edits = this.getUserEdits();
        edits[word] = data;
        return this.save(this.KEYS.USER_EDITS, edits);
    }
};

// 导出模块
window.Storage = Storage;
