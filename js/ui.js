/**
 * UI 交互模块
 * 处理所有用户界面交互
 */

const UI = {
    // 当前页面
    currentPage: 'dashboard',

    // 当前学习模式
    currentMode: 'flashcard',

    // 当前学习会话
    learningSession: {
        words: [],
        currentIndex: 0,
        mode: 'learn', // 'learn' | 'review' | 'wrongbook' | 'favorites'
        correctCount: 0,
        wrongCount: 0,
        startTime: null,
        sessionWords: [] // 记录本次练习过的单词及其结果
    },

    // 防止连点标志
    isProcessing: false,

    /**
     * 初始化UI
     */
    init() {
        this.bindNavigation();
        this.bindLearningModes();
        this.bindFlashcard();
        this.bindSpelling();
        this.bindListening();
        this.bindChoice();
        this.bindWordList();
        this.bindSettings();
        this.bindTheme();
        this.bindModal();
        this.bindEditModal();
        this.bindKeyboard();

        // 更新仪表盘
        this.updateDashboard();
        this.renderCalendar();
        this.renderAchievements();
    },

    // ========================================
    // 导航
    // ========================================

    bindNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                if (page === 'learn') {
                    this.startLearning('learn');
                } else if (page === 'review') {
                    this.navigateTo('review'); // 显示复习概览页，不直接开始
                } else if (page) {
                    this.navigateTo(page);
                }
            });
        });

        // ========================================
        // 学习总结页面
        // ========================================
        document.getElementById('summaryBackBtn')?.addEventListener('click', () => {
            this.navigateTo('dashboard');
        });

        document.getElementById('summaryReviewWrongBtn')?.addEventListener('click', () => {
            this.startLearning('wrongbook');
        });

        // ========================================
        // 首页仪表盘按钮
        // ========================================
        document.getElementById('startLearnBtn')?.addEventListener('click', () => {
            this.startLearning('learn');
        });

        document.getElementById('dashboardStartReviewBtn')?.addEventListener('click', () => {
            this.startLearning('review');
        });
    },

    navigateTo(page) {
        // 更新导航状态
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });

        // 切换页面
        document.querySelectorAll('.page').forEach(p => {
            p.classList.toggle('active', p.id === `page-${page}`);
        });

        this.currentPage = page;

        // 页面特定初始化
        switch (page) {
            case 'dashboard':
                this.updateDashboard();
                break;
            case 'wordlist':
                this.renderWordList();
                break;
            case 'wrongbook':
                this.renderWrongBook();
                break;
            case 'favorites':
                this.renderFavorites();
                break;
            case 'achievements':
                this.renderAchievements();
                break;
            case 'review':
                this.updateReviewPage();
                break;
        }
    },

    // ========================================
    // 仪表盘
    // ========================================

    updateDashboard() {
        // 检查每日重置
        Storage.checkDailyReset();

        const overview = SpacedRepetition.getProgressOverview();

        // 更新日期
        document.getElementById('todayDate').textContent = this.formatDate(new Date());

        // 更新今日进度
        document.getElementById('todayLearned').textContent = overview.todayLearned;

        // 显示剩余所有生词，不再显示固定目标20
        const totalNewWords = overview.newWords + overview.todayLearned;
        document.getElementById('dailyGoal').textContent = totalNewWords;

        // 更新进度环
        // 如果总生词很少，就按实际进度；否则还是可以用 dailyNewGoal 作为每日参考进度，或者直接按总进度
        // 这里为了不让进度条太难看，我们设定一个参考目标：如果生词很多，就按默认20个算进度条；如果很少，就按总数
        const visualGoal = Math.max(overview.dailyNewGoal, 1);
        const progress = Math.min(100, (overview.todayLearned / visualGoal) * 100);

        const circumference = 314; // 2 * PI * 50
        const offset = circumference - (progress / 100) * circumference;
        const progressRing = document.getElementById('progressRing');
        if (progressRing) {
            progressRing.style.strokeDashoffset = offset;
            progressRing.style.stroke = progress >= 100 ? 'var(--success)' : 'var(--primary)';
        }

        // 更新统计
        const totalWordsElement = document.getElementById('totalWords');
        if (totalWordsElement) totalWordsElement.textContent = overview.totalWords;

        const totalWordsCountElement = document.getElementById('totalWordsCount');
        if (totalWordsCountElement) totalWordsCountElement.textContent = overview.totalWords;

        document.getElementById('masteredWords').textContent = overview.masteredWords;
        document.getElementById('learningWords').textContent = overview.learningWords;
        document.getElementById('reviewDue').textContent = overview.reviewDue;

        // 更新正确率
        document.getElementById('accuracy').textContent = `${overview.accuracy}%`;
        document.getElementById('accuracyBar').style.width = `${overview.accuracy}%`;

        // 更新连续天数
        document.getElementById('streakCount').textContent = overview.streak;
    },

    formatDate(date) {
        const options = { month: 'long', day: 'numeric', weekday: 'long' };
        return date.toLocaleDateString('zh-CN', options);
    },

    renderCalendar() {
        const container = document.getElementById('calendar');
        if (!container) return;

        const calendar = Storage.getCalendar();
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        // 获取本月第一天和最后一天
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);

        // 星期标题
        const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
        let html = weekDays.map(d => `<div class="calendar-day" style="font-size:10px;background:transparent;">${d}</div>`).join('');

        // 填充开始空格
        for (let i = 0; i < firstDay.getDay(); i++) {
            html += '<div class="calendar-day" style="background:transparent;"></div>';
        }

        // 填充日期
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const studied = calendar[dateStr] > 0;
            const isToday = day === today.getDate();

            let classes = 'calendar-day';
            if (studied) classes += ' studied';
            if (isToday) classes += ' today';

            html += `<div class="${classes}">${day}</div>`;
        }

        container.innerHTML = html;
    },

    // ========================================
    // 学习模式
    // ========================================

    bindLearningModes() {
        const modeBtns = document.querySelectorAll('.mode-btn');

        modeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.dataset.mode;
                this.switchLearningMode(mode);
            });
        });
    },

    switchLearningMode(mode) {
        // 更新按钮状态
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });

        // 切换模式显示
        document.querySelectorAll('.learn-mode').forEach(m => {
            m.classList.toggle('active', m.id === `mode-${mode}`);
        });

        this.currentMode = mode;

        // 重新加载当前单词到新模式
        if (this.learningSession.words.length > 0) {
            this.displayCurrentWord();
        }
    },

    startLearning(sessionMode = 'learn') {
        let words = [];
        const settings = Storage.getSettings();
        const batchSize = settings.batchSize || 20;

        switch (sessionMode) {
            case 'learn':
                // 获取生词，按配置数量截取
                words = Vocabulary.getNewWords().slice(0, batchSize);
                break;
            case 'review':
                words = Vocabulary.getReviewWords();
                // 复习也可以限制数量，如果需要的话
                if (words.length > 50) words = words.slice(0, 50);
                break;
            case 'wrongbook':
                words = Vocabulary.getWrongBookWords();
                break;
            case 'favorites':
                words = Vocabulary.getFavoriteWords();
                break;
        }

        if (words.length === 0) {
            this.showToast(sessionMode === 'learn' ? '没有新单词了!' : '没有需要复习的单词!', 'warning');
            return;
        }

        // 初始化学习会话
        this.isProcessing = false;
        this.learningSession = {
            words: Vocabulary.shuffle(words),
            currentIndex: 0,
            mode: sessionMode,
            correctCount: 0,
            wrongCount: 0,
            startTime: Date.now(),
            sessionWords: []
        };

        // 切换到学习页面
        this.navigateTo('learn');
        this.displayCurrentWord();
    },

    displayCurrentWord() {
        const session = this.learningSession;

        // 安全检查：如果没有单词或已索引越界，则完成学习
        if (!session.words || session.words.length === 0 || session.currentIndex >= session.words.length) {
            this.finishLearning();
            return;
        }

        const word = session.words[session.currentIndex];

        // 根据当前模式显示
        switch (this.currentMode) {
            case 'flashcard':
                this.displayFlashcard(word);
                break;
            case 'spelling':
                this.displaySpelling(word);
                break;
            case 'listening':
                this.displayListening(word);
                break;
            case 'choice':
                this.displayChoice(word);
                break;
            case 'forms':
                this.displayForms(word);
                break;
        }

        // 更新进度
        document.getElementById('cardProgress').textContent =
            `${session.currentIndex + 1} / ${session.words.length}`;

        // 自动发音
        if (Storage.getSettings().autoSpeak) {
            Vocabulary.speak(word.word);
        }
    },

    // ========================================
    // 卡片模式
    // ========================================

    bindFlashcard() {
        const flashcard = document.getElementById('flashcard');
        const speakBtn = document.getElementById('speakBtn');
        const knowBtn = document.getElementById('knowBtn');
        const dontKnowBtn = document.getElementById('dontKnowBtn');

        flashcard?.addEventListener('click', () => {
            flashcard.classList.toggle('flipped');
        });

        speakBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            const word = document.getElementById('cardWord').textContent;
            Vocabulary.speak(word);
        });

        knowBtn?.addEventListener('click', () => this.handleAnswer(true));
        dontKnowBtn?.addEventListener('click', () => this.handleAnswer(false));
    },

    displayFlashcard(word) {
        const flashcard = document.getElementById('flashcard');
        flashcard.classList.remove('flipped');

        document.getElementById('cardWord').textContent = word.word;
        document.getElementById('cardPhonetic').textContent = word.phonetic || '';

        // 释义 (优先使用自定义释义)
        const translations = word.translations || [];
        const cardType = document.getElementById('cardType');
        const cardTranslation = document.getElementById('cardTranslation');

        if (word.translation) {
            cardType.style.display = 'none';
            cardTranslation.textContent = word.translation;
        } else {
            cardType.style.display = 'inline';
            cardType.textContent = translations[0]?.type || '';
            // 显示所有释义
            cardTranslation.textContent = translations.map(t => t.translation).join('；');
        }

        // 词组
        const phrasesEl = document.getElementById('cardPhrases');
        if (word.phrases && word.phrases.length > 0) {
            phrasesEl.innerHTML = word.phrases.slice(0, 3).map(p =>
                `<div><b>${p.phrase}</b> ${p.translation}</div>`
            ).join('');
            phrasesEl.style.display = 'block';
        } else {
            phrasesEl.innerHTML = '';
            phrasesEl.style.display = 'none';
        }

        // 词形变化
        const formsEl = document.getElementById('cardForms');
        if (word.forms && Object.keys(word.forms).length > 0) {
            const formLabels = {
                plural: '复数',
                past: '过去式',
                done: '过去分词',
                doing: '现在分词',
                third: '三单',
                adjective: '形容词',
                noun: '名词',
                verb: '动词',
                adverb: '副词',
                person: '人称',
                adj: '形容词',
                adv: '副词',
                n: '名词',
                v: '动词',
                vi: '不及物动词',
                vt: '及物动词'
            };

            const formsHtml = Object.entries(word.forms).map(([key, value]) => {
                const label = formLabels[key] || key;
                return `<div><span style="opacity:0.7">${label}:</span> ${value}</div>`;
            }).join('');

            formsEl.innerHTML = formsHtml;
            formsEl.style.display = 'block';
        } else {
            formsEl.innerHTML = '';
            formsEl.style.display = 'none';
        }

        // 例句
        const examplesEl = document.getElementById('cardExamples');
        if (word.examples && word.examples.length > 0) {
            examplesEl.innerHTML = word.examples.slice(0, 3).map(ex => {
                let en = ex;
                let cn = '';
                if (ex.includes('|')) {
                    const parts = ex.split('|');
                    en = parts[0].trim();
                    cn = parts[1] ? parts[1].trim() : '';
                }
                return `
                    <div class="example-item">
                        <div class="en">${en}</div>
                        ${cn ? `<div class="cn">${cn}</div>` : ''}
                    </div>
                `;
            }).join('');
            examplesEl.style.display = 'block';
        } else {
            examplesEl.innerHTML = '';
            examplesEl.style.display = 'none';
        }
    },






    handleAnswer(correct) {
        if (this.isProcessing) return;
        this.isProcessing = true;

        const session = this.learningSession;
        const word = session.words[session.currentIndex];

        if (session.mode === 'learn') {
            // 首次学习
            SpacedRepetition.markAsLearned(word.word, correct);
            if (correct) {
                session.correctCount++;
            } else {
                session.wrongCount++;
            }
        } else {
            // 复习
            if (correct) {
                SpacedRepetition.handleCorrect(word.word);
                session.correctCount++;
            } else {
                SpacedRepetition.handleWrong(word.word);
                session.wrongCount++;
            }
        }

        // 记录到本次会话
        session.sessionWords.push({
            word: word.word,
            correct: correct
        });

        // 检查成就
        const newAchievements = Achievement.checkAllAchievements();
        newAchievements.forEach(a => Achievement.showUnlockNotification(a));

        // 下一个单词
        session.currentIndex++;

        // 延迟重置处理标志，确保转场逻辑完成
        setTimeout(() => {
            this.isProcessing = false;
            this.displayCurrentWord();
        }, 100);
    },

    // ========================================
    // 拼写模式
    // ========================================

    bindSpelling() {
        const checkBtn = document.getElementById('checkSpellingBtn');
        const input = document.getElementById('spellingInput');
        const speakBtn = document.getElementById('spellingSpeak');

        checkBtn?.addEventListener('click', () => this.checkSpelling());
        input?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.checkSpelling();
        });
        speakBtn?.addEventListener('click', () => {
            const word = this.learningSession.words[this.learningSession.currentIndex];
            if (word) Vocabulary.speak(word.word);
        });
    },

    displaySpelling(word) {
        const translations = word.translations || [];
        const hintEl = document.getElementById('spellingHint');
        const inputEl = document.getElementById('spellingInput');
        const feedbackEl = document.getElementById('spellingFeedback');

        if (hintEl) {
            hintEl.textContent = translations.map(t => `(${t.type}) ${t.translation}`).join('；');
        }
        if (inputEl) {
            inputEl.value = '';
            inputEl.focus();
        }
        if (feedbackEl) {
            feedbackEl.innerHTML = '';
        }
        // 拼写模式不自动发音，用户点击🔊按钮才发音
    },

    checkSpelling() {
        if (this.isProcessing) return;

        const input = document.getElementById('spellingInput');
        const feedback = document.getElementById('spellingFeedback');
        const session = this.learningSession;

        if (!session.words || session.currentIndex >= session.words.length) {
            console.error('没有可用的单词');
            return;
        }

        const word = session.words[session.currentIndex];
        if (!word) {
            console.error('单词不存在');
            return;
        }

        const userAnswer = input.value.trim().toLowerCase();
        const correct = userAnswer === word.word.toLowerCase();

        if (correct) {
            feedback.innerHTML = '<span class="feedback-correct">✓ 正确!</span>';
            Vocabulary.speak(word.word); // 播放正确发音
            setTimeout(() => this.handleAnswer(true), 800);
        } else {
            feedback.innerHTML = `<span class="feedback-wrong">✗ 错误! 正确答案: ${word.word}</span>`;
            Vocabulary.speak(word.word); // 播放正确发音
            setTimeout(() => this.handleAnswer(false), 1500);
        }
    },

    // ========================================
    // 听力模式
    // ========================================

    bindListening() {
        const playBtn = document.getElementById('playAudioBtn');
        const checkBtn = document.getElementById('checkListeningBtn');
        const input = document.getElementById('listeningInput');

        playBtn?.addEventListener('click', () => {
            const word = this.learningSession.words[this.learningSession.currentIndex];
            if (word) Vocabulary.speak(word.word);
        });

        checkBtn?.addEventListener('click', () => this.checkListening());
        input?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.checkListening();
        });
    },

    displayListening(word) {
        const inputEl = document.getElementById('listeningInput');
        const feedbackEl = document.getElementById('listeningFeedback');

        if (inputEl) {
            inputEl.value = '';
            inputEl.focus();
        }
        if (feedbackEl) {
            feedbackEl.innerHTML = '';
        }

        // 听力模式自动播放发音
        if (word && word.word) {
            Vocabulary.speak(word.word);
        }
    },

    checkListening() {
        if (this.isProcessing) return;

        const input = document.getElementById('listeningInput');
        const feedback = document.getElementById('listeningFeedback');
        const session = this.learningSession;

        if (!session.words || session.currentIndex >= session.words.length) {
            console.error('没有可用的单词');
            return;
        }

        const word = session.words[session.currentIndex];
        if (!word) {
            console.error('单词不存在');
            return;
        }

        const userAnswer = input.value.trim().toLowerCase();
        const correct = userAnswer === word.word.toLowerCase();

        if (correct) {
            feedback.innerHTML = '<span class="feedback-correct">✓ 正确!</span>';
            setTimeout(() => this.handleAnswer(true), 800);
        } else {
            feedback.innerHTML = `<span class="feedback-wrong">✗ 错误! 正确答案: ${word.word}</span>`;
            Vocabulary.speak(word.word); // 播放正确发音
            setTimeout(() => this.handleAnswer(false), 1500);
        }
    },

    // ========================================
    // 选择题模式
    // ========================================

    bindChoice() {
        document.getElementById('choiceSpeak')?.addEventListener('click', () => {
            const word = this.learningSession.words[this.learningSession.currentIndex];
            if (word) Vocabulary.speak(word.word);
        });
    },

    displayChoice(word) {
        document.getElementById('choiceWord').textContent = word.word;
        document.getElementById('choicePhonetic').textContent = word.phonetic || '';
        document.getElementById('choiceFeedback').innerHTML = '';

        // 获取选项
        const options = Vocabulary.getRandomOptions(word.word, 4);
        const container = document.getElementById('choiceOptions');

        container.innerHTML = options.map((opt, i) => {
            const translations = opt.translations || [];
            const text = translations.map(t => t.translation).join('；');
            return `<button class="choice-option" data-word="${opt.word}">${text}</button>`;
        }).join('');

        // 绑定选项点击
        container.querySelectorAll('.choice-option').forEach(btn => {
            btn.addEventListener('click', () => this.handleChoiceSelect(btn));
        });
    },

    handleChoiceSelect(btn) {
        const word = this.learningSession.words[this.learningSession.currentIndex];
        const selectedWord = btn.dataset.word;
        const correct = selectedWord === word.word;

        // 显示结果
        document.querySelectorAll('.choice-option').forEach(opt => {
            if (opt.dataset.word === word.word) {
                opt.classList.add('correct');
            } else if (opt === btn && !correct) {
                opt.classList.add('wrong');
            }
            opt.style.pointerEvents = 'none';
        });

        const feedback = document.getElementById('choiceFeedback');
        if (correct) {
            feedback.innerHTML = '<span class="feedback-correct">✓ 正确!</span>';
        } else {
            feedback.innerHTML = '<span class="feedback-wrong">✗ 错误!</span>';
        }

        setTimeout(() => this.handleAnswer(correct), 1000);
    },

    // ========================================
    // 词形变化模式
    // ========================================

    displayForms(word) {
        document.getElementById('formsWord').textContent = word.word;
        document.getElementById('formsPhonetic').textContent = word.phonetic || '';

        const grid = document.getElementById('formsGrid');
        const forms = word.forms || {};

        const formLabels = {
            noun: '名词',
            verb: '动词',
            adjective: '形容词',
            adverb: '副词',
            past: '过去式',
            pastParticiple: '过去分词',
            present: '现在分词',
            plural: '复数',
            person: '人/者',
            comparative: '比较级',
            superlative: '最高级'
        };

        const entries = Object.entries(forms).filter(([k, v]) => v);

        if (entries.length === 0) {
            grid.innerHTML = '<div class="form-item"><span class="form-value">暂无词形变化数据</span></div>';
        } else {
            grid.innerHTML = entries.map(([key, value]) => `
                <div class="form-item">
                    <span class="form-label">${formLabels[key] || key}</span>
                    <span class="form-value">${value}</span>
                </div>
            `).join('');
        }

        // 词形变化模式直接通过，自动进入下一个
        setTimeout(() => {
            this.learningSession.currentIndex++;
            this.displayCurrentWord();
        }, 3000);
    },

    // ========================================
    // 完成学习
    // ========================================

    finishLearning() {
        const session = this.learningSession;

        // 渲染总结页面数据
        this.renderSummaryPage();

        // 切换到总结页面
        this.navigateTo('summary');

        // 重置会话状态
        this.learningSession = {
            words: [],
            currentIndex: 0,
            mode: session.mode,
            correctCount: 0,
            wrongCount: 0,
            startTime: null,
            sessionWords: []
        };
    },

    /**
     * 渲染学习总结页面
     */
    renderSummaryPage() {
        const session = this.learningSession;
        const total = session.words.length;
        const correct = session.correctCount;
        const wrong = session.wrongCount;
        const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

        // 计算时间
        const durationMs = Date.now() - (session.startTime || Date.now());
        const seconds = Math.floor((durationMs / 1000) % 60);
        const minutes = Math.floor(durationMs / (1000 * 60));
        const durationText = minutes > 0 ? `${minutes}分${seconds}秒` : `${seconds}秒`;

        // 填充基本信息
        const titleEl = document.getElementById('summaryTitle');
        const subtitleEl = document.getElementById('summarySubtitle');

        if (accuracy >= 100) {
            titleEl.textContent = '完胜！本轮全对 🌟';
            subtitleEl.textContent = '已经没有什么能难倒你了！';
        } else if (accuracy >= 80) {
            titleEl.textContent = '太棒了！表现优异 👍';
            subtitleEl.textContent = '继续保持，离目标越来越近了';
        } else {
            titleEl.textContent = '学习完成！继续加油 💪';
            subtitleEl.textContent = '温故而知新，多复习错题会更有收获';
        }

        document.getElementById('summaryTotal').textContent = total;
        document.getElementById('summaryCorrect').textContent = correct;
        document.getElementById('summaryAccuracy').textContent = accuracy + '%';
        document.getElementById('summaryDuration').textContent = durationText;

        // 渲染单词列表
        const listContainer = document.getElementById('summaryWordList');
        if (listContainer) {
            listContainer.innerHTML = session.sessionWords.map(sw => {
                return `
                    <div class="summary-word-item ${sw.correct ? 'correct' : 'wrong'}">
                        <span class="status-icon">${sw.correct ? '✓' : '✗'}</span>
                        <span class="word-text">${sw.word}</span>
                    </div>
                `;
            }).join('');
        }

        // 处理复习错词按钮显示/隐藏
        const reviewWrongBtn = document.getElementById('summaryReviewWrongBtn');
        if (reviewWrongBtn) {
            reviewWrongBtn.style.display = wrong > 0 ? 'inline-flex' : 'none';
        }
    },

    // ========================================
    // 单词列表
    // ========================================

    bindWordList() {
        const searchInput = document.getElementById('searchInput');
        const filterSelect = document.getElementById('filterSelect');
        const importBtn = document.getElementById('importBtn');
        const exportBtn = document.getElementById('exportBtn');
        const importFile = document.getElementById('importFile');

        searchInput?.addEventListener('input', () => this.renderWordList());
        filterSelect?.addEventListener('change', () => this.renderWordList());

        importBtn?.addEventListener('click', () => importFile.click());
        importFile?.addEventListener('change', (e) => this.handleImport(e));
        exportBtn?.addEventListener('click', () => this.handleExport());

        // 错题本练习
        document.getElementById('practiceWrongBtn')?.addEventListener('click', () => {
            this.startLearning('wrongbook');
        });

        // 收藏练习
        document.getElementById('practiceFavBtn')?.addEventListener('click', () => {
            this.startLearning('favorites');
        });
    },

    renderWordList() {
        const container = document.getElementById('wordListContainer');
        if (!container) return;

        const searchQuery = document.getElementById('searchInput').value;
        const filter = document.getElementById('filterSelect').value;

        let words;
        if (searchQuery) {
            words = Vocabulary.search(searchQuery);
        } else {
            words = Vocabulary.filter(filter);
        }

        if (words.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">🔍</span>
                    <p>没有找到匹配的单词</p>
                </div>
            `;
            return;
        }

        const progress = Storage.getProgress();

        container.innerHTML = words.slice(0, 100).map(word => {
            const p = progress[word.word] || {};
            const levelInfo = SpacedRepetition.getLevelInfo(p.level || 0);
            const isFavorite = Storage.getFavorites().includes(word.word);
            const translations = word.translations || [];

            return `
                <div class="word-list-item" data-word="${word.word}">
                    <div class="word-info">
                        <div class="word">${word.word}</div>
                        <div class="translation">${translations.map(t => t.translation).join('；')}</div>
                    </div>
                    <div class="word-status">
                        <span class="status-badge status-${levelInfo.status}">${levelInfo.label}</span>
                        <button class="favorite-btn ${isFavorite ? 'active' : ''}" data-word="${word.word}">
                            ${isFavorite ? '⭐' : '☆'}
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // 绑定收藏按钮
        container.querySelectorAll('.favorite-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const wordId = btn.dataset.word;
                const isFav = Storage.toggleFavorite(wordId);
                btn.classList.toggle('active', isFav);
                btn.textContent = isFav ? '⭐' : '☆';
            });
        });

        // 绑定单词点击（跳转到卡片）
        container.querySelectorAll('.word-list-item').forEach(item => {
            item.addEventListener('click', () => {
                const wordStr = item.dataset.word;
                const wordObj = Vocabulary.getWord(wordStr);
                if (wordObj) {
                    // 创建单词学习会话
                    this.learningSession = {
                        words: [wordObj],
                        currentIndex: 0,
                        mode: 'learn',
                        correctCount: 0,
                        wrongCount: 0
                    };
                    this.currentMode = 'flashcard';
                    this.navigateTo('learn');
                    this.displayCurrentWord();
                }
            });
        });
    },

    renderWrongBook() {
        const container = document.getElementById('wrongBookList');
        if (!container) return;

        const words = Vocabulary.getWrongBookWords();

        if (words.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">📝</span>
                    <p>还没有错题，继续保持！</p>
                </div>
            `;
            return;
        }

        this.renderWordItems(container, words);
    },

    renderFavorites() {
        const container = document.getElementById('favoritesList');
        if (!container) return;

        const words = Vocabulary.getFavoriteWords();

        if (words.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">⭐</span>
                    <p>还没有收藏的单词</p>
                </div>
            `;
            return;
        }

        this.renderWordItems(container, words);
    },

    renderWordItems(container, words) {
        container.innerHTML = words.map(word => {
            const translations = word.translations || [];
            return `
                <div class="word-list-item" data-word="${word.word}">
                    <div class="word-info">
                        <div class="word">${word.word}</div>
                        <div class="translation">${translations.map(t => t.translation).join('；')}</div>
                    </div>
                </div>
            `;
        }).join('');

        container.querySelectorAll('.word-list-item').forEach(item => {
            item.addEventListener('click', () => {
                Vocabulary.speak(item.dataset.word);
            });
        });
    },

    updateReviewPage() {
        const count = SpacedRepetition.getReviewCount();
        document.getElementById('reviewCount').textContent = count;

        // 更新统计卡片
        const overview = SpacedRepetition.getProgressOverview();
        const el = (id) => document.getElementById(id);
        if (el('statNew')) el('statNew').textContent = overview.newWords;
        if (el('statLearning')) el('statLearning').textContent = overview.learningWords;
        if (el('statMastered')) el('statMastered').textContent = overview.masteredWords;
        if (el('statAccuracy')) el('statAccuracy').textContent = overview.accuracy + '%';

        // 绑定开始复习按钮
        const startBtn = document.getElementById('reviewStartReviewBtn');
        if (startBtn) {
            startBtn.onclick = () => this.startLearning('review');
            startBtn.disabled = count === 0;
            startBtn.textContent = count > 0 ? `开始复习 (${count})` : '暂无复习';
        }

        // 渲染复习计划
        this.renderReviewSchedule();
    },

    renderReviewSchedule() {
        const container = document.getElementById('reviewSchedule');
        if (!container) return;

        const progress = Storage.getProgress();
        const today = Storage.getTodayString();

        // 收集所有有进度的单词，按复习日期分组
        const groups = {};  // { date: [{ word, level }] }
        let noReviewWords = [];

        for (const [wordId, p] of Object.entries(progress)) {
            if (!p || p.level === 0) continue;

            if (p.nextReview) {
                if (!groups[p.nextReview]) groups[p.nextReview] = [];
                groups[p.nextReview].push({ word: wordId, level: p.level });
            } else if (p.level > 0 && p.level < 5) {
                noReviewWords.push({ word: wordId, level: p.level });
            }
        }

        // 按日期排序
        const sortedDates = Object.keys(groups).sort();

        if (sortedDates.length === 0 && noReviewWords.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">📭</span>
                    <p>还没有学习记录，先去学习一些单词吧！</p>
                </div>
            `;
            return;
        }

        // 生成日期标签
        const formatDate = (dateStr) => {
            if (dateStr === today) return '📌 今天（需要复习）';
            const d = new Date(dateStr);
            const t = new Date(today);
            const diff = Math.round((d - t) / (1000 * 60 * 60 * 24));
            if (diff === 1) return '⏰ 明天';
            if (diff === -1) return '⚠️ 昨天（已逾期）';
            if (diff < -1) return `⚠️ ${dateStr}（已逾期 ${-diff} 天）`;
            return `📅 ${dateStr}（${diff} 天后）`;
        };

        let html = '';

        for (const date of sortedDates) {
            const words = groups[date];
            const isOverdue = date <= today;
            html += `
                <div class="schedule-group">
                    <div class="schedule-date">
                        <span>${formatDate(date)}</span>
                        <span class="count-badge">${words.length} 词</span>
                    </div>
                    <div class="schedule-words">
                        ${words.slice(0, 50).map(w =>
                `<span class="schedule-word" data-word="${w.word}" title="等级: ${w.level}">${w.word}</span>`
            ).join('')}
                        ${words.length > 50 ? `<span class="schedule-word" style="opacity:0.6">...还有 ${words.length - 50} 词</span>` : ''}
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;

        // 点击单词跳转到卡片
        container.querySelectorAll('.schedule-word[data-word]').forEach(el => {
            el.addEventListener('click', () => {
                const wordObj = Vocabulary.getWord(el.dataset.word);
                if (wordObj) {
                    this.learningSession = {
                        words: [wordObj],
                        currentIndex: 0,
                        mode: 'learn',
                        correctCount: 0,
                        wrongCount: 0
                    };
                    this.currentMode = 'flashcard';
                    this.navigateTo('learn');
                    this.displayCurrentWord();
                }
            });
        });
    },

    // ========================================
    // 成就
    // ========================================

    renderAchievements() {
        const container = document.getElementById('achievementsGrid');
        if (!container) return;

        const achievements = Achievement.getAllAchievements();

        container.innerHTML = achievements.map(a => {
            const unlockDate = a.unlockedAt ?
                new Date(a.unlockedAt).toLocaleDateString('zh-CN') : '';

            return `
                <div class="achievement-card ${a.unlocked ? 'unlocked' : 'locked'}">
                    <div class="achievement-icon">${a.icon}</div>
                    <div class="achievement-name">${a.name}</div>
                    <div class="achievement-desc">${a.description}</div>
                    ${a.unlocked ? `<div class="achievement-date">解锁于 ${unlockDate}</div>` : ''}
                </div>
            `;
        }).join('');
    },

    // ========================================
    // 设置
    // ========================================

    bindSettings() {
        const batchSize = document.getElementById('batchSize');
        const dailyNewGoal = document.getElementById('dailyNewGoal');
        const dailyReviewGoal = document.getElementById('dailyReviewGoal');
        const themeSelect = document.getElementById('themeSelect');
        const autoSpeak = document.getElementById('autoSpeak');
        const backupBtn = document.getElementById('backupDataBtn');
        const restoreBtn = document.getElementById('restoreDataBtn');
        const resetBtn = document.getElementById('resetDataBtn');

        // 加载当前设置
        const settings = Storage.getSettings();
        if (batchSize) batchSize.value = settings.batchSize || 20;
        if (dailyNewGoal) dailyNewGoal.value = settings.dailyNewGoal;
        if (dailyReviewGoal) dailyReviewGoal.value = settings.dailyReviewGoal;
        if (themeSelect) themeSelect.value = settings.theme;
        if (autoSpeak) autoSpeak.checked = settings.autoSpeak;

        // 绑定保存按钮
        const saveBtn = document.getElementById('saveSettingsBtn');
        saveBtn?.addEventListener('click', () => {
            const newSettings = {
                batchSize: batchSize ? parseInt(batchSize.value) : 20,
                dailyNewGoal: dailyNewGoal ? parseInt(dailyNewGoal.value) : 20,
                dailyReviewGoal: dailyReviewGoal ? parseInt(dailyReviewGoal.value) : 50,
                theme: themeSelect ? themeSelect.value : 'dark',
                autoSpeak: autoSpeak ? autoSpeak.checked : true
            };

            if (Storage.updateSettings(newSettings)) {
                this.showToast('设置已保存', 'success');
                // 如果主题改变，立即应用
                if (newSettings.theme !== settings.theme) {
                    this.applyTheme(newSettings.theme);
                }
            } else {
                this.showToast('保存失败', 'error');
            }
        });

        // 绑定变更事件（保留自动保存逻辑，或者仅用于实时反馈）

        dailyNewGoal?.addEventListener('change', () => {
            Storage.updateSettings({ dailyNewGoal: parseInt(dailyNewGoal.value) });
        });

        dailyReviewGoal?.addEventListener('change', () => {
            Storage.updateSettings({ dailyReviewGoal: parseInt(dailyReviewGoal.value) });
        });

        themeSelect?.addEventListener('change', () => {
            const theme = themeSelect.value;
            Storage.updateSettings({ theme });
            this.applyTheme(theme);
        });

        autoSpeak?.addEventListener('change', () => {
            Storage.updateSettings({ autoSpeak: autoSpeak.checked });
        });

        backupBtn?.addEventListener('click', () => this.backupData());
        restoreBtn?.addEventListener('click', () => this.restoreData());
        resetBtn?.addEventListener('click', () => this.resetData());
    },

    backupData() {
        const data = Storage.exportAll();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `背单词备份_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        this.showToast('数据已备份', 'success');
    },

    restoreData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    Storage.importAll(data);
                    this.showToast('数据已恢复', 'success');
                    setTimeout(() => location.reload(), 1000);
                } catch (e) {
                    this.showToast('备份文件无效', 'error');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    },

    resetData() {
        this.showModal('确认重置', `
            <p style="color: var(--danger);">⚠️ 这将清除所有学习数据，此操作不可恢复！</p>
        `, [
            { text: '取消', action: () => this.closeModal() },
            {
                text: '确认重置', primary: true, danger: true, action: () => {
                    Storage.clear();
                    this.showToast('数据已重置', 'success');
                    setTimeout(() => location.reload(), 1000);
                }
            }
        ]);
    },

    // ========================================
    // 主题
    // ========================================

    bindTheme() {
        const themeToggle = document.getElementById('themeToggle');

        themeToggle?.addEventListener('click', () => {
            const current = Storage.getSettings().theme;
            const newTheme = current === 'dark' ? 'light' : 'dark';
            Storage.updateSettings({ theme: newTheme });
            this.applyTheme(newTheme);

            // 更新设置页面的选择框
            const themeSelect = document.getElementById('themeSelect');
            if (themeSelect) themeSelect.value = newTheme;
        });

        // 应用保存的主题
        this.applyTheme(Storage.getSettings().theme);
    },

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);

        const themeIcon = document.querySelector('.theme-icon');
        if (themeIcon) {
            themeIcon.textContent = theme === 'dark' ? '🌙' : '☀️';
        }
    },

    // ========================================
    // 导入导出
    // ========================================

    handleImport(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target.result;
            let result;

            if (file.name.endsWith('.json')) {
                result = Vocabulary.importJSON(content);
            } else if (file.name.endsWith('.csv')) {
                result = Vocabulary.importCSV(content);
            } else {
                this.showToast('不支持的文件格式', 'error');
                return;
            }

            if (result.success) {
                this.showToast(`成功导入 ${result.count} 个单词`, 'success');
                this.renderWordList();
            } else {
                this.showToast(result.error, 'error');
            }
        };
        reader.readAsText(file);

        // 重置input
        e.target.value = '';
    },

    handleExport() {
        const json = Vocabulary.exportJSON();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `词库导出_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        this.showToast('词库已导出', 'success');
    },

    // ========================================
    // 键盘快捷键
    // ========================================

    bindKeyboard() {
        document.addEventListener('keydown', (e) => {
            // 仅在学习页面生效
            if (this.currentPage !== 'learn') return;

            // 输入框内不处理
            if (e.target.tagName === 'INPUT') return;

            switch (e.key) {
                case ' ':
                    e.preventDefault();
                    if (this.currentMode === 'flashcard') {
                        document.getElementById('flashcard')?.click();
                    }
                    break;
                case 'ArrowLeft':
                case '1':
                    document.getElementById('dontKnowBtn')?.click();
                    break;
                case 'ArrowRight':
                case '2':
                    document.getElementById('knowBtn')?.click();
                    break;
                case 's':
                    Vocabulary.speak(
                        this.learningSession.words[this.learningSession.currentIndex]?.word
                    );
                    break;
            }
        });
    },

    // ========================================
    // 模态框
    // ========================================

    bindModal() {
        document.getElementById('modalClose')?.addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'modal') {
                this.closeModal();
            }
        });
    },

    showModal(title, content, buttons = []) {
        const modal = document.getElementById('modal');
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalBody').innerHTML = content;

        const footer = document.getElementById('modalFooter');
        footer.innerHTML = buttons.map((btn, i) => `
            <button class="btn ${btn.primary ? (btn.danger ? 'btn-danger' : 'btn-primary') : 'btn-secondary'}" 
                    data-action="${i}">${btn.text}</button>
        `).join('');

        footer.querySelectorAll('button').forEach(el => {
            el.addEventListener('click', () => {
                const action = buttons[parseInt(el.dataset.action)]?.action;
                if (action) action();
            });
        });

        modal.classList.add('active');
    },

    closeModal() {
        document.getElementById('modal')?.classList.remove('active');
    },

    // ========================================
    // 编辑单词模态框
    // ========================================

    bindEditModal() {
        const modal = document.getElementById('editWordModal');
        const editBtn = document.getElementById('editWordBtn');
        const closeBtn = document.getElementById('editWordClose');
        const cancelBtn = document.getElementById('cancelEditBtn');
        const saveBtn = document.getElementById('saveEditBtn');

        // 打开编辑
        editBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.openEditModal();
        });

        // 关闭/取消
        const close = () => {
            modal.classList.remove('active');
        };
        closeBtn?.addEventListener('click', close);
        cancelBtn?.addEventListener('click', close);

        // 保存
        saveBtn?.addEventListener('click', () => {
            this.saveEdit();
        });
    },

    openEditModal() {
        const session = this.learningSession;
        if (!session || !session.words[session.currentIndex]) return;

        const word = session.words[session.currentIndex];
        this.editingWord = word;

        document.getElementById('editWordTitle').textContent = word.word;

        // 填充表单
        // 释义: 优先显示 translation 字段(用户编辑过的), 否则显示 translations 数组
        let translation = word.translation;
        if (!translation && word.translations && word.translations.length > 0) {
            translation = word.translations.map(t => t.translation).join('；');
        }
        document.getElementById('editTranslation').value = translation || '';

        // 例句: 数组转多行文本
        const examples = word.examples || [];
        document.getElementById('editExamples').value = examples.join('\n');

        // 笔记
        document.getElementById('editNotes').value = word.notes || '';

        document.getElementById('editWordModal').classList.add('active');
    },

    saveEdit() {
        if (!this.editingWord) return;

        const translation = document.getElementById('editTranslation').value.trim();
        const examplesStr = document.getElementById('editExamples').value.trim();
        const notes = document.getElementById('editNotes').value.trim();

        // 处理例句
        const examples = examplesStr ? examplesStr.split('\n').filter(line => line.trim()) : [];

        const data = {
            translation: translation, // 保存覆盖后的释义字符串
            examples: examples,
            notes: notes
        };

        if (Vocabulary.updateWord(this.editingWord.word, data)) {
            this.showToast('单词已更新', 'success');
            document.getElementById('editWordModal').classList.remove('active');

            // 刷新当前显示
            if (this.currentMode === 'flashcard') {
                this.displayFlashcard(this.editingWord);
                // 注意: this.editingWord 是引用，Vocabulary.updateWord 可能更新了 input word object in memory?
                // 是的, vocabulary.js 中 updateWord 更新了 this.words[index]。
                // 但是 this.learningSession.words 是 shallow copy 还是 ref?
                // init session: words = Vocabulary.shuffle(words). 
                // shuffle returns NEW array. Elements are REFERENCES to objects in Vocabulary.words?
                // Vocabulary.shuffle: return [...array].sort(...) -> shallow copy of array. Objects are shared.
                // So updating Vocabulary.words elements SHOULD update session.words elements.
                // But displayFlashcard uses existing logic.
                // I need to ensure displayFlashcard uses the NEW data.
                // displayFlashcard reads word.translations.
                // My update logic saves `translation` (string).
                // I need to update displayFlashcard to prefer `word.translation` (string) over `word.translations` (array).
            }
        } else {
            this.showToast('更新失败', 'error');
        }
    },

    // ========================================
    // Toast 提示
    // ========================================

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');

        const icons = {
            success: '✓',
            error: '✗',
            warning: '⚠',
            info: 'ℹ'
        };

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${icons[type]}</span>
            <span class="toast-message">${message}</span>
        `;

        container.appendChild(toast);

        // 3秒后移除
        setTimeout(() => {
            toast.style.animation = 'slideInRight 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};

// 导出模块
window.UI = UI;
