/**
 * 番茄钟计时器
 */
class Pomodoro {
    constructor() {
        this.timeLeft = 25 * 60;
        this.timer = null;
        this.isRunning = false;
        this.mode = 'work'; // 'work' | 'shortBreak'
        this.modes = {
            work: 25 * 60,
            shortBreak: 5 * 60
        };

        this.dom = {
            display: null,
            startBtn: null,
            resetBtn: null,
            modeLabel: null
        };
    }

    init() {
        this.dom.display = document.getElementById('pomoTimer');
        this.dom.startBtn = document.getElementById('pomoStart');
        this.dom.resetBtn = document.getElementById('pomoReset');
        this.dom.modeLabel = document.getElementById('pomoMode');

        this.updateDisplay();

        this.dom.startBtn?.addEventListener('click', () => this.toggle());
        this.dom.resetBtn?.addEventListener('click', () => this.reset());
        document.getElementById('pomoModeToggle')?.addEventListener('click', () => this.switchMode());

        // 请求通知权限
        if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
            Notification.requestPermission();
        }
    }

    toggle() {
        if (this.isRunning) {
            this.pause();
        } else {
            this.start();
        }
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.dom.startBtn.textContent = '⏸️'; // 暂停图标

        this.timer = setInterval(() => {
            if (this.timeLeft > 0) {
                this.timeLeft--;
                this.updateDisplay();
            } else {
                this.complete();
            }
        }, 1000);
    }

    pause() {
        this.isRunning = false;
        clearInterval(this.timer);
        this.dom.startBtn.textContent = '▶️'; // 开始图标
    }

    reset() {
        this.pause();
        this.timeLeft = this.modes[this.mode];
        this.updateDisplay();
    }

    switchMode() {
        this.pause();
        this.mode = this.mode === 'work' ? 'shortBreak' : 'work';
        this.timeLeft = this.modes[this.mode];
        if (this.dom.modeLabel) {
            this.dom.modeLabel.textContent = this.mode === 'work' ? '专注' : '休息';
        }
        this.updateDisplay();
    }

    complete() {
        this.pause();
        this.playBeep();

        const title = this.mode === 'work' ? '专注结束！' : '休息结束！';
        const body = this.mode === 'work' ? '休息一下吧。' : '继续加油！';

        if (Notification.permission === 'granted') {
            new Notification(title, { body: body });
        }

        // 简单的alert作为备用
        setTimeout(() => alert(`${title}\n${body}`), 100);
    }

    updateDisplay() {
        const m = Math.floor(this.timeLeft / 60).toString().padStart(2, '0');
        const s = (this.timeLeft % 60).toString().padStart(2, '0');
        if (this.dom.display) {
            this.dom.display.textContent = `${m}:${s}`;
        }
        // 更新网页标题
        document.title = `${m}:${s} - 背单词`;
    }

    playBeep() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;

            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5);

            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

            osc.start();
            osc.stop(ctx.currentTime + 0.5);
        } catch (e) {
            console.error('Audio play failed', e);
        }
    }
}

// 导出
window.Pomodoro = new Pomodoro();
