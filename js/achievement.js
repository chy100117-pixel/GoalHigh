/**
 * 成就系统模块
 * 管理各种学习成就和徽章
 */

const Achievement = {
    // 成就定义
    ACHIEVEMENTS: {
        // 学习里程碑
        first_word: {
            id: 'first_word',
            name: '初学者',
            description: '学习第一个单词',
            icon: '🌱',
            condition: (stats) => stats.totalLearned >= 1
        },
        words_50: {
            id: 'words_50',
            name: '入门学徒',
            description: '学习50个单词',
            icon: '📖',
            condition: (stats) => stats.totalLearned >= 50
        },
        words_100: {
            id: 'words_100',
            name: '词汇新手',
            description: '学习100个单词',
            icon: '📚',
            condition: (stats) => stats.totalLearned >= 100
        },
        words_500: {
            id: 'words_500',
            name: '词汇达人',
            description: '学习500个单词',
            icon: '🎓',
            condition: (stats) => stats.totalLearned >= 500
        },
        words_1000: {
            id: 'words_1000',
            name: '词汇专家',
            description: '学习1000个单词',
            icon: '🏅',
            condition: (stats) => stats.totalLearned >= 1000
        },
        words_2000: {
            id: 'words_2000',
            name: '词汇大师',
            description: '学习2000个单词',
            icon: '👑',
            condition: (stats) => stats.totalLearned >= 2000
        },
        words_3500: {
            id: 'words_3500',
            name: '词汇王者',
            description: '学习全部3500词',
            icon: '🏆',
            condition: (stats) => stats.totalLearned >= 3500
        },

        // 连续打卡
        streak_3: {
            id: 'streak_3',
            name: '小试牛刀',
            description: '连续学习3天',
            icon: '🔥',
            condition: (stats) => stats.streak >= 3
        },
        streak_7: {
            id: 'streak_7',
            name: '坚持一周',
            description: '连续学习7天',
            icon: '💪',
            condition: (stats) => stats.streak >= 7
        },
        streak_30: {
            id: 'streak_30',
            name: '月度之星',
            description: '连续学习30天',
            icon: '⭐',
            condition: (stats) => stats.streak >= 30
        },
        streak_100: {
            id: 'streak_100',
            name: '百日传奇',
            description: '连续学习100天',
            icon: '🌟',
            condition: (stats) => stats.streak >= 100
        },
        streak_365: {
            id: 'streak_365',
            name: '年度霸主',
            description: '连续学习365天',
            icon: '💎',
            condition: (stats) => stats.streak >= 365
        },

        // 正确率
        accuracy_80: {
            id: 'accuracy_80',
            name: '稳定发挥',
            description: '正确率达到80%',
            icon: '🎯',
            condition: (stats, extra) => extra.accuracy >= 80 && extra.totalAnswers >= 50
        },
        accuracy_90: {
            id: 'accuracy_90',
            name: '精准记忆',
            description: '正确率达到90%',
            icon: '🎪',
            condition: (stats, extra) => extra.accuracy >= 90 && extra.totalAnswers >= 100
        },
        accuracy_95: {
            id: 'accuracy_95',
            name: '过目不忘',
            description: '正确率达到95%',
            icon: '🧠',
            condition: (stats, extra) => extra.accuracy >= 95 && extra.totalAnswers >= 200
        },

        // 掌握里程碑
        mastered_50: {
            id: 'mastered_50',
            name: '初见成效',
            description: '掌握50个单词',
            icon: '✅',
            condition: (stats, extra) => extra.mastered >= 50
        },
        mastered_200: {
            id: 'mastered_200',
            name: '小有所成',
            description: '掌握200个单词',
            icon: '🌈',
            condition: (stats, extra) => extra.mastered >= 200
        },
        mastered_500: {
            id: 'mastered_500',
            name: '融会贯通',
            description: '掌握500个单词',
            icon: '🚀',
            condition: (stats, extra) => extra.mastered >= 500
        },
        mastered_1000: {
            id: 'mastered_1000',
            name: '炉火纯青',
            description: '掌握1000个单词',
            icon: '🎖️',
            condition: (stats, extra) => extra.mastered >= 1000
        },

        // 特殊成就
        daily_goal: {
            id: 'daily_goal',
            name: '日计划完成',
            description: '完成每日学习目标',
            icon: '📅',
            condition: (stats, extra) => extra.todayLearned >= extra.dailyGoal
        },
        night_owl: {
            id: 'night_owl',
            name: '夜猫子',
            description: '在凌晨学习',
            icon: '🦉',
            condition: () => {
                const hour = new Date().getHours();
                return hour >= 0 && hour < 5;
            }
        },
        early_bird: {
            id: 'early_bird',
            name: '早起的鸟儿',
            description: '在清晨6点前学习',
            icon: '🐦',
            condition: () => {
                const hour = new Date().getHours();
                return hour >= 5 && hour < 6;
            }
        }
    },

    /**
     * 获取所有成就状态
     * @returns {Array} 成就数组，包含解锁状态
     */
    getAllAchievements() {
        const unlocked = Storage.getAchievements();

        return Object.values(this.ACHIEVEMENTS).map(achievement => ({
            ...achievement,
            unlocked: !!unlocked[achievement.id],
            unlockedAt: unlocked[achievement.id]?.unlockedAt || null
        }));
    },

    /**
     * 获取已解锁成就数量
     * @returns {Object} { unlocked, total }
     */
    getAchievementCount() {
        const unlocked = Storage.getAchievements();
        const total = Object.keys(this.ACHIEVEMENTS).length;
        const unlockedCount = Object.keys(unlocked).length;

        return { unlocked: unlockedCount, total };
    },

    /**
     * 检查学习相关成就
     * @returns {Array} 新解锁的成就
     */
    checkLearningAchievements() {
        const stats = Storage.getStats();
        const vocabStats = Vocabulary.getStatistics();
        const settings = Storage.getSettings();

        const extra = {
            accuracy: SpacedRepetition.calculateAccuracy(),
            totalAnswers: (stats.totalCorrect || 0) + (stats.totalWrong || 0),
            mastered: vocabStats.mastered,
            todayLearned: stats.todayLearned || 0,
            dailyGoal: settings.dailyNewGoal
        };

        const newlyUnlocked = [];

        Object.values(this.ACHIEVEMENTS).forEach(achievement => {
            try {
                if (achievement.condition(stats, extra)) {
                    const isNew = Storage.unlockAchievement(achievement.id);
                    if (isNew) {
                        newlyUnlocked.push(achievement);
                    }
                }
            } catch (e) {
                // 条件检查失败，跳过
            }
        });

        return newlyUnlocked;
    },

    /**
     * 检查所有成就（包括特殊成就）
     * @returns {Array} 新解锁的成就
     */
    checkAllAchievements() {
        return this.checkLearningAchievements();
    },

    /**
     * 显示成就解锁通知
     * @param {Object} achievement 成就对象
     */
    showUnlockNotification(achievement) {
        if (window.UI && UI.showToast) {
            UI.showToast(`🎉 解锁成就：${achievement.icon} ${achievement.name}`, 'success');
        }
    },

    /**
     * 获取下一个可达成的成就
     * @returns {Object|null} 下一个成就或null
     */
    getNextAchievement() {
        const unlocked = Storage.getAchievements();
        const stats = Storage.getStats();

        // 按优先级排序的成就
        const priorityOrder = [
            'first_word', 'words_50', 'words_100',
            'streak_3', 'streak_7',
            'mastered_50',
            'accuracy_80'
        ];

        for (const id of priorityOrder) {
            if (!unlocked[id] && this.ACHIEVEMENTS[id]) {
                return this.ACHIEVEMENTS[id];
            }
        }

        return null;
    },

    /**
     * 获取成就进度
     * @param {string} achievementId 成就ID
     * @returns {Object|null} { current, target, percent }
     */
    getAchievementProgress(achievementId) {
        const stats = Storage.getStats();
        const vocabStats = Vocabulary.getStatistics();

        const progressMap = {
            first_word: { current: stats.totalLearned || 0, target: 1 },
            words_50: { current: stats.totalLearned || 0, target: 50 },
            words_100: { current: stats.totalLearned || 0, target: 100 },
            words_500: { current: stats.totalLearned || 0, target: 500 },
            words_1000: { current: stats.totalLearned || 0, target: 1000 },
            words_2000: { current: stats.totalLearned || 0, target: 2000 },
            words_3500: { current: stats.totalLearned || 0, target: 3500 },
            streak_3: { current: stats.streak || 0, target: 3 },
            streak_7: { current: stats.streak || 0, target: 7 },
            streak_30: { current: stats.streak || 0, target: 30 },
            streak_100: { current: stats.streak || 0, target: 100 },
            streak_365: { current: stats.streak || 0, target: 365 },
            mastered_50: { current: vocabStats.mastered, target: 50 },
            mastered_200: { current: vocabStats.mastered, target: 200 },
            mastered_500: { current: vocabStats.mastered, target: 500 },
            mastered_1000: { current: vocabStats.mastered, target: 1000 }
        };

        const progress = progressMap[achievementId];
        if (!progress) return null;

        progress.percent = Math.min(100, Math.round((progress.current / progress.target) * 100));
        return progress;
    }
};

// 导出模块
window.Achievement = Achievement;
