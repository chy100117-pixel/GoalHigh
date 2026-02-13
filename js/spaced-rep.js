/**
 * 艾宾浩斯间隔重复算法模块
 * 根据记忆曲线安排复习计划
 */

const SpacedRepetition = {
    // 复习间隔（天数），对应不同熟练度等级
    INTERVALS: {
        1: 1,   // 等级1: 1天后复习
        2: 2,   // 等级2: 2天后复习
        3: 4,   // 等级3: 4天后复习
        4: 7,   // 等级4: 7天后复习
        5: 15   // 等级5: 已掌握，15天后可选复习
    },

    // 最大熟练度等级
    MAX_LEVEL: 5,

    /**
     * 计算下次复习日期
     * @param {number} level 当前熟练度等级
     * @returns {string} 下次复习日期 (YYYY-MM-DD)
     */
    calculateNextReview(level) {
        const days = this.INTERVALS[level] || 1;
        const date = new Date();
        date.setDate(date.getDate() + days);
        return date.toISOString().split('T')[0];
    },

    /**
     * 处理正确回答
     * @param {string} wordId 单词ID
     * @returns {Object} 更新后的进度
     */
    handleCorrect(wordId) {
        const progress = Storage.getWordProgress(wordId);

        // 升级
        progress.level = Math.min(progress.level + 1, this.MAX_LEVEL);
        progress.correctCount++;
        progress.lastStudied = new Date().toISOString();

        // 如果从错题本学会了，移除
        if (progress.level >= 3 && progress.isInWrongBook) {
            Storage.removeFromWrongBook(wordId);
            progress.isInWrongBook = false;
        }

        // 计算下次复习时间
        if (progress.level < this.MAX_LEVEL) {
            progress.nextReview = this.calculateNextReview(progress.level);
        } else {
            // 已掌握
            progress.nextReview = this.calculateNextReview(this.MAX_LEVEL);
        }

        // 保存进度
        Storage.updateProgress(wordId, progress);

        // 更新统计
        this.updateStats(true);

        return progress;
    },

    /**
     * 处理错误回答
     * @param {string} wordId 单词ID
     * @returns {Object} 更新后的进度
     */
    handleWrong(wordId) {
        const progress = Storage.getWordProgress(wordId);

        // 降级（但不低于1）
        progress.level = Math.max(progress.level - 1, 1);
        progress.wrongCount++;
        progress.lastStudied = new Date().toISOString();

        // 添加到错题本
        if (!progress.isInWrongBook) {
            Storage.addToWrongBook(wordId);
            progress.isInWrongBook = true;
        }

        // 明天再复习
        progress.nextReview = this.calculateNextReview(1);

        // 保存进度
        Storage.updateProgress(wordId, progress);

        // 更新统计
        this.updateStats(false);

        return progress;
    },

    /**
     * 标记单词为已学习（第一次学习）
     * @param {string} wordId 单词ID
     * @param {boolean} known 是否认识
     * @returns {Object} 进度数据
     */
    markAsLearned(wordId, known = true) {
        const progress = Storage.getWordProgress(wordId);

        if (progress.level === 0) {
            // 首次学习
            progress.level = known ? 2 : 1;
            progress.lastStudied = new Date().toISOString();
            progress.nextReview = this.calculateNextReview(progress.level);

            if (known) {
                progress.correctCount++;
            } else {
                progress.wrongCount++;
                Storage.addToWrongBook(wordId);
                progress.isInWrongBook = true;
            }

            Storage.updateProgress(wordId, progress);

            // 更新今日学习数
            const stats = Storage.getStats();
            stats.todayLearned = (stats.todayLearned || 0) + 1;
            stats.totalLearned = (stats.totalLearned || 0) + 1;
            Storage.updateStats(stats);
            Storage.recordStudyDay(1);

            // 检查成就
            Achievement.checkLearningAchievements();
        }

        return progress;
    },

    /**
     * 更新统计数据
     * @param {boolean} correct 是否正确
     */
    updateStats(correct) {
        const stats = Storage.getStats();

        if (correct) {
            stats.totalCorrect = (stats.totalCorrect || 0) + 1;
        } else {
            stats.totalWrong = (stats.totalWrong || 0) + 1;
        }

        stats.todayReviewed = (stats.todayReviewed || 0) + 1;

        Storage.updateStats(stats);
    },

    /**
     * 获取今日需要复习的单词数量
     * @returns {number} 待复习数量
     */
    getReviewCount() {
        return Vocabulary.getReviewWords().length;
    },

    /**
     * 获取学习进度概览
     * @returns {Object} 进度概览
     */
    getProgressOverview() {
        const stats = Vocabulary.getStatistics();
        const dailyStats = Storage.getStats();
        const settings = Storage.getSettings();

        return {
            totalWords: stats.total,
            newWords: stats.new,
            learningWords: stats.learning,
            masteredWords: stats.mastered,
            reviewDue: stats.reviewDue,
            todayLearned: dailyStats.todayLearned || 0,
            todayReviewed: dailyStats.todayReviewed || 0,
            dailyNewGoal: settings.dailyNewGoal,
            dailyReviewGoal: settings.dailyReviewGoal,
            streak: dailyStats.streak || 0,
            accuracy: this.calculateAccuracy()
        };
    },

    /**
     * 计算正确率
     * @returns {number} 正确率 (0-100)
     */
    calculateAccuracy() {
        const stats = Storage.getStats();
        const total = (stats.totalCorrect || 0) + (stats.totalWrong || 0);

        if (total === 0) return 0;

        return Math.round((stats.totalCorrect / total) * 100);
    },

    /**
     * 获取单词熟练度描述
     * @param {number} level 熟练度等级
     * @returns {Object} { status, label, color }
     */
    getLevelInfo(level) {
        if (level === 0) {
            return { status: 'new', label: '生词', color: 'var(--primary)' };
        } else if (level >= 5) {
            return { status: 'mastered', label: '已掌握', color: 'var(--success)' };
        } else {
            return { status: 'learning', label: '学习中', color: 'var(--warning)' };
        }
    },

    /**
     * 重置单词进度
     * @param {string} wordId 单词ID
     */
    resetWordProgress(wordId) {
        const defaultProgress = Storage.createDefaultProgress(wordId);
        Storage.updateProgress(wordId, defaultProgress);
        Storage.removeFromWrongBook(wordId);
    }
};

// 导出模块
window.SpacedRepetition = SpacedRepetition;
