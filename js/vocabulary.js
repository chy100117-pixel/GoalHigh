/**
 * 词汇管理模块
 * 处理词库数据、导入导出、发音等功能
 */

const Vocabulary = {
    // 当前词库
    words: [],

    // 单词索引（用于快速查找）
    wordIndex: {},

    /**
     * 初始化词库
     */
    async init() {
        // 加载本地存储的词库
        this.words = Storage.getVocabulary();

        // 如果词库为空，加载内置词库
        if (this.words.length === 0) {
            await this.loadBuiltInVocabulary();
        } else {
            // 尝试合并内置词库的新数据（如例句）
            this.mergeBuiltInData();
        }

        // 建立索引
        this.buildIndex();

        // 合并用户自定义数据
        this.mergeUserEdits();

        console.log(`词库加载完成，共 ${this.words.length} 个单词`);
    },

    /**
     * 建立单词索引
     */
    buildIndex() {
        this.wordIndex = {};
        this.words.forEach((word, index) => {
            this.wordIndex[word.word.toLowerCase()] = index;
        });
    },

    /**
     * 合并内置数据到本地存储
     * 解决本地缓存导致无法获取新例句的问题
     */
    mergeBuiltInData() {
        if (!window.BUILT_IN_VOCABULARY || window.BUILT_IN_VOCABULARY.length === 0) return;

        let hasUpdates = false;
        const localMap = new Map(this.words.map(w => [w.word.toLowerCase(), w]));

        for (const builtinWord of window.BUILT_IN_VOCABULARY) {
            const key = builtinWord.word.toLowerCase();
            const localWord = localMap.get(key);

            if (localWord) {
                // 如果本地单词缺失例句，而内置单词有，则更新
                if ((!localWord.examples || localWord.examples.length === 0) &&
                    (builtinWord.examples && builtinWord.examples.length > 0)) {
                    localWord.examples = builtinWord.examples;
                    hasUpdates = true;
                }
                // 如果本地单词缺失词形变化，而内置单词有，则更新
                if ((!localWord.forms || Object.keys(localWord.forms).length === 0) &&
                    (builtinWord.forms && Object.keys(builtinWord.forms).length > 0)) {
                    localWord.forms = builtinWord.forms;
                    hasUpdates = true;
                }
                // 如果本地单词缺失词组，而内置单词有，则更新
                if ((!localWord.phrases || localWord.phrases.length === 0) &&
                    (builtinWord.phrases && builtinWord.phrases.length > 0)) {
                    localWord.phrases = builtinWord.phrases;
                    hasUpdates = true;
                }
            }
        }

        if (hasUpdates) {
            console.log("Detect updated built-in data (examples), saving to storage...");
            Storage.saveVocabulary(this.words);
        }
    },

    /**
     * 加载内置词库
     */
    async loadBuiltInVocabulary() {
        // 优先使用 words.js 中的完整词库
        if (window.BUILT_IN_VOCABULARY && window.BUILT_IN_VOCABULARY.length > 0) {
            this.words = JSON.parse(JSON.stringify(window.BUILT_IN_VOCABULARY)); // Deep copy to avoid reference issues
        } else {
            // 回退到示例词库
            this.words = this.getExampleVocabulary();
        }
        Storage.saveVocabulary(this.words);
    },

    /**
     * 获取示例词汇（用于演示）
     */
    getExampleVocabulary() {
        return [
            {
                word: "ability",
                phonetic: "/əˈbɪlɪti/",
                translations: [{ type: "n.", translation: "能力，才能" }],
                phrases: [
                    { phrase: "ability to do", translation: "做某事的能力" },
                    { phrase: "have the ability", translation: "有能力" }
                ],
                forms: { noun: "ability", plural: "abilities", adjective: "able" }
            },
            {
                word: "accept",
                phonetic: "/əkˈsept/",
                translations: [{ type: "v.", translation: "接受，承认" }],
                phrases: [
                    { phrase: "accept an invitation", translation: "接受邀请" },
                    { phrase: "accept responsibility", translation: "承担责任" }
                ],
                forms: { verb: "accept", past: "accepted", noun: "acceptance", adjective: "acceptable" }
            },
            {
                word: "achieve",
                phonetic: "/əˈtʃiːv/",
                translations: [{ type: "v.", translation: "达到，取得，实现" }],
                phrases: [
                    { phrase: "achieve success", translation: "取得成功" },
                    { phrase: "achieve one's goal", translation: "实现目标" }
                ],
                forms: { verb: "achieve", past: "achieved", noun: "achievement" }
            },
            {
                word: "adventure",
                phonetic: "/ədˈventʃər/",
                translations: [
                    { type: "n.", translation: "冒险，奇遇" },
                    { type: "v.", translation: "冒险" }
                ],
                phrases: [
                    { phrase: "adventure story", translation: "冒险故事" },
                    { phrase: "have an adventure", translation: "经历冒险" }
                ],
                forms: { noun: "adventure", adjective: "adventurous", person: "adventurer" }
            },
            {
                word: "affect",
                phonetic: "/əˈfekt/",
                translations: [{ type: "v.", translation: "影响，感动" }],
                phrases: [
                    { phrase: "affect the result", translation: "影响结果" },
                    { phrase: "be affected by", translation: "被...影响" }
                ],
                forms: { verb: "affect", noun: "effect", adjective: "effective" }
            },
            {
                word: "agriculture",
                phonetic: "/ˈæɡrɪkʌltʃər/",
                translations: [{ type: "n.", translation: "农业，农学" }],
                phrases: [
                    { phrase: "modern agriculture", translation: "现代农业" }
                ],
                forms: { noun: "agriculture", adjective: "agricultural" }
            },
            {
                word: "announce",
                phonetic: "/əˈnaʊns/",
                translations: [{ type: "v.", translation: "宣布，通知" }],
                phrases: [
                    { phrase: "announce the result", translation: "宣布结果" },
                    { phrase: "announce to the public", translation: "向公众宣布" }
                ],
                forms: { verb: "announce", past: "announced", noun: "announcement", person: "announcer" }
            },
            {
                word: "anxious",
                phonetic: "/ˈæŋkʃəs/",
                translations: [{ type: "adj.", translation: "焦虑的，渴望的" }],
                phrases: [
                    { phrase: "be anxious about", translation: "为...焦虑" },
                    { phrase: "anxious to do", translation: "渴望做..." }
                ],
                forms: { adjective: "anxious", noun: "anxiety", adverb: "anxiously" }
            },
            {
                word: "appreciate",
                phonetic: "/əˈpriːʃieɪt/",
                translations: [{ type: "v.", translation: "欣赏，感激" }],
                phrases: [
                    { phrase: "appreciate your help", translation: "感谢你的帮助" },
                    { phrase: "appreciate art", translation: "欣赏艺术" }
                ],
                forms: { verb: "appreciate", noun: "appreciation", adjective: "appreciative" }
            },
            {
                word: "approach",
                phonetic: "/əˈprəʊtʃ/",
                translations: [
                    { type: "v.", translation: "接近，靠近" },
                    { type: "n.", translation: "方法，途径" }
                ],
                phrases: [
                    { phrase: "approach the problem", translation: "处理问题" },
                    { phrase: "a new approach", translation: "新方法" }
                ],
                forms: { verb: "approach", noun: "approach", adjective: "approachable" }
            },
            {
                word: "argument",
                phonetic: "/ˈɑːɡjumənt/",
                translations: [{ type: "n.", translation: "争论，论点" }],
                phrases: [
                    { phrase: "have an argument", translation: "发生争论" },
                    { phrase: "strong argument", translation: "有力的论点" }
                ],
                forms: { noun: "argument", verb: "argue", adjective: "argumentative" }
            },
            {
                word: "atmosphere",
                phonetic: "/ˈætməsfɪər/",
                translations: [{ type: "n.", translation: "大气，气氛" }],
                phrases: [
                    { phrase: "the earth's atmosphere", translation: "地球大气层" },
                    { phrase: "friendly atmosphere", translation: "友好的气氛" }
                ],
                forms: { noun: "atmosphere", adjective: "atmospheric" }
            },
            {
                word: "behave",
                phonetic: "/bɪˈheɪv/",
                translations: [{ type: "v.", translation: "表现，举止" }],
                phrases: [
                    { phrase: "behave well", translation: "表现良好" },
                    { phrase: "behave oneself", translation: "规矩点" }
                ],
                forms: { verb: "behave", noun: "behavior/behaviour" }
            },
            {
                word: "believe",
                phonetic: "/bɪˈliːv/",
                translations: [{ type: "v.", translation: "相信，认为" }],
                phrases: [
                    { phrase: "believe in", translation: "相信...存在" },
                    { phrase: "believe it or not", translation: "信不信由你" }
                ],
                forms: { verb: "believe", noun: "belief", adjective: "believable" }
            },
            {
                word: "benefit",
                phonetic: "/ˈbenɪfɪt/",
                translations: [
                    { type: "n.", translation: "好处，利益" },
                    { type: "v.", translation: "受益，有益于" }
                ],
                phrases: [
                    { phrase: "for the benefit of", translation: "为了...的利益" },
                    { phrase: "benefit from", translation: "从...中受益" }
                ],
                forms: { noun: "benefit", verb: "benefit", adjective: "beneficial" }
            },
            {
                word: "challenge",
                phonetic: "/ˈtʃælɪndʒ/",
                translations: [
                    { type: "n.", translation: "挑战" },
                    { type: "v.", translation: "向...挑战" }
                ],
                phrases: [
                    { phrase: "face a challenge", translation: "面对挑战" },
                    { phrase: "challenge oneself", translation: "挑战自己" }
                ],
                forms: { noun: "challenge", verb: "challenge", adjective: "challenging" }
            },
            {
                word: "character",
                phonetic: "/ˈkærəktər/",
                translations: [{ type: "n.", translation: "性格，角色，字符" }],
                phrases: [
                    { phrase: "main character", translation: "主角" },
                    { phrase: "character trait", translation: "性格特点" }
                ],
                forms: { noun: "character", adjective: "characteristic" }
            },
            {
                word: "communicate",
                phonetic: "/kəˈmjuːnɪkeɪt/",
                translations: [{ type: "v.", translation: "交流，传达" }],
                phrases: [
                    { phrase: "communicate with", translation: "与...交流" },
                    { phrase: "communicate ideas", translation: "传达想法" }
                ],
                forms: { verb: "communicate", noun: "communication", adjective: "communicative" }
            },
            {
                word: "community",
                phonetic: "/kəˈmjuːnɪti/",
                translations: [{ type: "n.", translation: "社区，团体" }],
                phrases: [
                    { phrase: "local community", translation: "当地社区" },
                    { phrase: "community service", translation: "社区服务" }
                ],
                forms: { noun: "community", plural: "communities" }
            },
            {
                word: "compete",
                phonetic: "/kəmˈpiːt/",
                translations: [{ type: "v.", translation: "竞争，比赛" }],
                phrases: [
                    { phrase: "compete with", translation: "与...竞争" },
                    { phrase: "compete for", translation: "争夺..." }
                ],
                forms: { verb: "compete", noun: "competition", adjective: "competitive", person: "competitor" }
            }
        ];
    },

    /**
     * 获取单词
     * @param {string} word 单词
     * @returns {Object|null} 单词数据
     */
    getWord(word) {
        const index = this.wordIndex[word.toLowerCase()];
        return index !== undefined ? this.words[index] : null;
    },

    /**
     * 根据索引获取单词
     * @param {number} index 索引
     * @returns {Object|null} 单词数据
     */
    getWordByIndex(index) {
        return this.words[index] || null;
    },

    /**
     * 获取所有单词
     * @returns {Array} 单词数组
     */
    getAllWords() {
        return this.words;
    },

    /**
     * 获取新词（未学习的）
     * @param {number} count 数量，不传则返回所有
     * @returns {Array} 新词数组
     */
    getNewWords(count = null) {
        const progress = Storage.getProgress();
        const newWords = this.words.filter(word => {
            const p = progress[word.word];
            return !p || p.level === 0;
        });

        // 如果指定了数量，则限制返回数量
        const shuffled = this.shuffle(newWords);
        return count ? shuffled.slice(0, count) : shuffled;
    },

    /**
     * 获取待复习的单词
     * @returns {Array} 待复习单词数组
     */
    getReviewWords() {
        const progress = Storage.getProgress();
        const today = Storage.getTodayString();

        return this.words.filter(word => {
            const p = progress[word.word];
            if (!p || p.level === 0) return false;
            if (p.level >= 5) return false; // 已掌握
            if (!p.nextReview) return true;
            return p.nextReview <= today;
        });
    },

    /**
     * 获取错题本单词
     * @returns {Array} 错题单词数组
     */
    getWrongBookWords() {
        const wrongBook = Storage.getWrongBook();
        return this.words.filter(word => wrongBook.includes(word.word));
    },

    /**
     * 获取收藏单词
     * @returns {Array} 收藏单词数组
     */
    getFavoriteWords() {
        const favorites = Storage.getFavorites();
        return this.words.filter(word => favorites.includes(word.word));
    },

    /**
     * 搜索单词
     * @param {string} query 搜索词
     * @returns {Array} 匹配的单词数组
     */
    search(query) {
        const q = query.toLowerCase().trim();
        if (!q) return [];

        return this.words.filter(word => {
            // 搜索单词
            if (word.word.toLowerCase().includes(q)) return true;
            // 搜索释义
            if (word.translations.some(t => t.translation.includes(q))) return true;
            return false;
        });
    },

    /**
     * 过滤单词
     * @param {string} filter 过滤条件: all, new, learning, mastered
     * @returns {Array} 过滤后的单词数组
     */
    filter(filter) {
        const progress = Storage.getProgress();

        switch (filter) {
            case 'new':
                return this.words.filter(word => {
                    const p = progress[word.word];
                    return !p || p.level === 0;
                });
            case 'learning':
                return this.words.filter(word => {
                    const p = progress[word.word];
                    return p && p.level > 0 && p.level < 5;
                });
            case 'mastered':
                return this.words.filter(word => {
                    const p = progress[word.word];
                    return p && p.level >= 5;
                });
            default:
                return this.words;
        }
    },

    /**
     * 获取随机选项（用于选择题）
     * @param {string} correctWord 正确单词
     * @param {number} count 选项数量
     * @returns {Array} 选项数组（包含正确答案）
     */
    getRandomOptions(correctWord, count = 4) {
        const correct = this.getWord(correctWord);
        if (!correct) return [];

        // 获取其他单词作为干扰项
        const others = this.words
            .filter(w => w.word !== correctWord)
            .sort(() => Math.random() - 0.5)
            .slice(0, count - 1);

        // 混合正确答案和干扰项
        const options = [correct, ...others];
        return this.shuffle(options);
    },

    /**
     * 打乱数组
     * @param {Array} array 原数组
     * @returns {Array} 打乱后的数组
     */
    shuffle(array) {
        const result = [...array];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    },

    /**
     * 发音
     * @param {string} text 要发音的文本
     * @param {string} lang 语言 (en-US, en-GB)
     */
    speak(text, lang = 'en-US') {
        if (!text || !('speechSynthesis' in window)) {
            return;
        }

        // 取消之前的发音
        speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = Storage.getSettings().speakRate || 1.0;
        utterance.volume = 1.0;
        utterance.pitch = 1.0;

        // 尝试获取英语语音
        const voices = speechSynthesis.getVoices();
        const englishVoice = voices.find(v => v.lang.startsWith('en'));
        if (englishVoice) {
            utterance.voice = englishVoice;
        }

        speechSynthesis.speak(utterance);
    },

    /**
     * 导入词库 (JSON格式)
     * @param {string} jsonString JSON字符串
     * @returns {Object} 导入结果 { success, count, error }
     */
    importJSON(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            const words = Array.isArray(data) ? data : [data];

            // 验证数据格式
            const validWords = words.filter(w => w.word && w.translations);

            if (validWords.length === 0) {
                return { success: false, error: '没有找到有效的单词数据' };
            }

            // 添加到词库
            Storage.addWords(validWords);
            this.words = Storage.getVocabulary();
            this.buildIndex();

            return { success: true, count: validWords.length };
        } catch (e) {
            return { success: false, error: '无效的JSON格式' };
        }
    },

    /**
     * 导入词库 (CSV格式)
     * CSV格式: word,translation,phonetic,type
     * @param {string} csvString CSV字符串
     * @returns {Object} 导入结果
     */
    importCSV(csvString) {
        try {
            const lines = csvString.trim().split('\n');
            const words = [];

            // 跳过标题行
            for (let i = 1; i < lines.length; i++) {
                const parts = lines[i].split(',').map(p => p.trim());
                if (parts.length >= 2) {
                    words.push({
                        word: parts[0],
                        translations: [{
                            type: parts[3] || 'n.',
                            translation: parts[1]
                        }],
                        phonetic: parts[2] || '',
                        phrases: [],
                        forms: {}
                    });
                }
            }

            if (words.length === 0) {
                return { success: false, error: '没有找到有效的单词数据' };
            }

            Storage.addWords(words);
            this.words = Storage.getVocabulary();
            this.buildIndex();

            return { success: true, count: words.length };
        } catch (e) {
            return { success: false, error: 'CSV解析失败' };
        }
    },

    /**
     * 导出词库为JSON
     * @returns {string} JSON字符串
     */
    exportJSON() {
        return JSON.stringify(this.words, null, 2);
    },

    /**
     * 获取统计信息
     * @returns {Object} 统计数据
     */
    getStatistics() {
        const progress = Storage.getProgress();
        let newCount = 0, learningCount = 0, masteredCount = 0;

        this.words.forEach(word => {
            const p = progress[word.word];
            if (!p || p.level === 0) {
                newCount++;
            } else if (p.level >= 5) {
                masteredCount++;
            } else {
                learningCount++;
            }
        });

        return {
            total: this.words.length,
            new: newCount,
            learning: learningCount,
            mastered: masteredCount,
            reviewDue: this.getReviewWords().length
        };
    },

    /**
     * 合并用户自定义数据
     */
    mergeUserEdits() {
        const edits = Storage.getUserEdits();
        if (!edits || Object.keys(edits).length === 0) return;

        Object.entries(edits).forEach(([wordStr, data]) => {
            const index = this.wordIndex[wordStr.toLowerCase()];
            if (index !== undefined) {
                // 合并到现有单词
                this.words[index] = { ...this.words[index], ...data };
            }
        });
    },

    /**
     * 更新单词数据
     * @param {string} wordStr 单词
     * @param {Object} data 要更新的数据
     */
    updateWord(wordStr, data) {
        const index = this.wordIndex[wordStr.toLowerCase()];
        if (index !== undefined) {
            // 更新内存
            this.words[index] = { ...this.words[index], ...data };

            // 保存用户编辑
            // 我们只保存差异数据? 这里的data是完整的覆盖还是增量？
            // 假设data包含我们要更新的字段 (translation, examples, notes)
            // 读取现有edits
            const currentEdits = Storage.getUserEdits()[wordStr] || {};
            const newEdits = { ...currentEdits, ...data };

            Storage.saveUserEdit(wordStr, newEdits);
            return true;
        }
        return false;
    }
};

// 导出模块
window.Vocabulary = Vocabulary;
