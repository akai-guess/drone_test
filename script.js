// 設定區：僅保留一般換證測驗
const CONFIG = {
    file: 'renewal_gen.csv',
    count: 40,
    time: 3600 // 60分鐘
};

let quizData = []; 
let userAns = []; 
let curIdx = 0;
let timer;
let timeLeft = 0;

// 開始測驗
async function startQuiz() {
    try {
        const res = await fetch(CONFIG.file);
        if (!res.ok) throw new Error();
        const text = await res.text();
        const fullBank = parseCSV(text);

        if (fullBank.length < CONFIG.count) {
            alert(`題庫數量不足！目前只有 ${fullBank.length} 題，至少需要 ${CONFIG.count} 題。`);
            return;
        }

        // 隨機抽取不重複題目
        quizData = fullBank.sort(() => Math.random() - 0.5).slice(0, CONFIG.count);
        userAns = new Array(quizData.length).fill(null);
        timeLeft = CONFIG.time;
        curIdx = 0;

        document.getElementById('home-screen').classList.add('hidden');
        document.getElementById('quiz-screen').classList.remove('hidden');

        runTimer();
        render();
    } catch (e) {
        alert("讀取 renewal_gen.csv 失敗！請確保檔案存在且編碼為 UTF-8，並透過 Server 環境執行（如 GitHub Pages）。");
    }
}

function parseCSV(text) {
    const rows = text.split('\n').map(r => r.trim()).filter(r => r !== '');
    // 跳過標題列
    return rows.slice(1).map(row => {
        const cols = row.split('｜');
        return {
            q: cols[0],
            options: [cols[1], cols[2], cols[3], cols[4]],
            a: parseInt(cols[5])
        };
    });
}
function render() {
    const item = quizData[curIdx];
    document.getElementById('q-text').innerText = `${curIdx + 1}. ${item.q}`;
    document.getElementById('progress').innerText = `第 ${curIdx + 1} / ${quizData.length} 題`;

    const optBox = document.getElementById('options-list');
    optBox.innerHTML = '';
    item.options.forEach((text, i) => {
        const btn = document.createElement('button');
        btn.className = `option-btn ${userAns[curIdx] === i ? 'selected' : ''}`;
        btn.innerText = text;
        btn.onclick = () => { userAns[curIdx] = i; render(); };
        optBox.appendChild(btn);
    });

    renderGrid();

    const isLast = curIdx === quizData.length - 1;
    document.getElementById('next-btn').classList.toggle('hidden', isLast);
    document.getElementById('submit-btn').classList.toggle('hidden', !isLast);
}

function renderGrid() {
    const grid = document.getElementById('num-grid');
    grid.innerHTML = '';
    quizData.forEach((_, i) => {
        const d = document.createElement('div');
        d.className = `num-btn ${userAns[i] !== null ? 'done' : ''} ${curIdx === i ? 'active' : ''}`;
        d.innerText = i + 1;
        d.onclick = () => { curIdx = i; render(); };
        grid.appendChild(d);
    });
}

function moveQ(step) {
    const next = curIdx + step;
    if (next >= 0 && next < quizData.length) {
        curIdx = next;
        render();
    }
}

function runTimer() {
    timer = setInterval(() => {
        timeLeft--;
        const m = Math.floor(timeLeft / 60);
        const s = timeLeft % 60;
        document.getElementById('timer').innerText = `${m}:${s < 10 ? '0' : ''}${s}`;
        if (timeLeft <= 0) handleSubmit();
    }, 1000);
}

function handleSubmit() {
    const empty = userAns.filter(a => a === null).length;
    if (empty > 0 && timeLeft > 0) {
        if (!confirm(`還有 ${empty} 題未填，確定要交卷？`)) return;
    }
    clearInterval(timer);
    showResult();
}

function showResult() {
    let score = 0;
    let logHTML = '';
    quizData.forEach((item, i) => {
        if (userAns[i] === item.a) {
            score += (100 / quizData.length);
        } else {
            logHTML += `
                <div class="review-card">
                    <p><b>問：${item.q}</b></p>
                    <p class="wrong">您的答案：${userAns[i] !== null ? item.options[userAns[i]] : '未作答'}</p>
                    <p class="correct">正確答案：${item.options[item.a]}</p>
                </div>`;
        }
    });

    document.getElementById('quiz-screen').classList.add('hidden');
    document.getElementById('result-screen').classList.remove('hidden');
    const finalScore = Math.round(score);
    document.getElementById('final-score').innerText = finalScore;
    const pass = finalScore >= 80;
    document.getElementById('pass-tag').innerText = pass ? "及格 (恭喜通過)" : "不及格 (請再加油)";
    document.getElementById('pass-tag').style.color = pass ? "green" : "red";
    document.getElementById('error-log').innerHTML = logHTML || "完美！全對！";
}