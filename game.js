// ====================
// КОЗА В НИЖНЕМ - БОЛЬШЕ ПТИЦ!
// ====================

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Изображения
const BIRD_IMG = new Image();
BIRD_IMG.src = 'bird.png';

const PIPE_IMG = new Image();
PIPE_IMG.src = 'pipe.png';

const BG_IMG = new Image();
BG_IMG.src = 'background.png';

const GROUND_IMG = new Image();
GROUND_IMG.src = 'ground.png';

// Пельмени
const PELMEN_IMG = new Image();
PELMEN_IMG.src = 'data:image/svg+xml;base64,' + btoa(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 60">
    <ellipse cx="50" cy="30" rx="45" ry="25" fill="#FFD700" stroke="#b8860b" stroke-width="3"/>
</svg>
`);

// Вражеские птицы
const ENEMY_BIRD_IMG = new Image();
ENEMY_BIRD_IMG.src = 'data:image/svg+xml;base64,' + btoa(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="35" fill="#333333"/>
    <circle cx="70" cy="40" r="15" fill="#222222"/>
    <circle cx="75" cy="38" r="4" fill="#ffffff"/>
    <polygon points="85,40 95,35 95,45" fill="#ff9900"/>
</svg>
`);

// Игровые переменные
let score = 0;
let highScore = parseInt(localStorage.getItem('goatHighScore')) || 0;
let gameOver = false;
let gameStarted = false;
let frames = 0;

// Коза
const goat = {
    x: 150,
    y: canvas.height / 2,
    width: 50,
    height: 50,
    velocity: 0,
    gravity: 0.5,
    jumpStrength: -8,
    rotation: 0
};

// Лавочки
const benches = [];
const BENCH = {
    width: 100,
    height: 60,
    gap: 200,
    speed: 3,
    minY: 400,
    maxY: 500
};

// Пельмени
const pelmeni = [];
const PELMEN = {
    width: 35,
    height: 20,
    points: 10,
    spawnChance: 0.6
};

// Птицы враги - БОЛЬШЕ ПТИЦ! (увеличили spawnChance с 0.3 до 0.45)
const enemyBirds = [];
const ENEMY_BIRD = {
    width: 60,
    height: 40,
    points: -20,
    spawnChance: 0.45, // БЫЛО 0.3, СТАЛО 0.45 (+50%!)
    speed: 3
};

// Земля
const ground = {
    x: 0,
    y: canvas.height - 50,
    height: 50,
    speed: 3
};

// ====================
// УПРАВЛЕНИЕ (с защитой от кликов по ссылкам)
// ====================
function handleJump() {
    if (!gameStarted) {
        startGame();
    } else if (!gameOver) {
        goat.velocity = goat.jumpStrength;
    } else {
        resetGame();
    }
}

// Умный обработчик кликов - игнорирует клики по Telegram-ссылкам
function handleGameClick(e) {
    // Проверяем, не кликнули ли по Telegram-ссылке
    if (e.target.closest('.telegram-button') || 
        e.target.closest('.telegram-fixed-link') ||
        e.target.closest('.footer-link')) {
        return; // Не обрабатываем игрой - пусть ссылка работает
    }
    
    handleJump();
}

// Обработчики событий
document.addEventListener('click', handleGameClick);

document.addEventListener('touchstart', function(e) {
    // Проверяем, не тапнули ли по Telegram-ссылке
    if (e.target.closest('.telegram-button') || 
        e.target.closest('.telegram-fixed-link') ||
        e.target.closest('.footer-link')) {
        return; // Не обрабатываем игрой
    }
    
    e.preventDefault();
    handleJump();
}, { passive: false });

document.addEventListener('keydown', function(e) {
    if (e.code === 'Space') {
        e.preventDefault();
        handleJump();
    }
});

// Кнопки
document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('restartBtn').addEventListener('click', resetGame);

// ====================
// ИГРОВАЯ ЛОГИКА
// ====================
function startGame() {
    gameStarted = true;
    gameOver = false;
    score = 0;
    benches.length = 0;
    pelmeni.length = 0;
    enemyBirds.length = 0;
    goat.y = canvas.height / 2;
    goat.velocity = 0;
    frames = 0;
    
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('gameOverScreen').style.display = 'none';
    document.getElementById('score').textContent = '0';
    
    addBench();
}

function resetGame() {
    gameOver = false;
    gameStarted = false;
    score = 0;
    benches.length = 0;
    pelmeni.length = 0;
    enemyBirds.length = 0;
    goat.y = canvas.height / 2;
    goat.velocity = 0;
    
    document.getElementById('gameOverScreen').style.display = 'none';
    document.getElementById('startScreen').style.display = 'flex';
    document.getElementById('score').textContent = '0';
}

function addBench() {
    benches.push({
        x: canvas.width,
        y: Math.random() * (BENCH.maxY - BENCH.minY) + BENCH.minY,
        width: BENCH.width,
        height: BENCH.height,
        passed: false
    });
}

function addPelmen() {
    pelmeni.push({
        x: canvas.width + Math.random() * 100,
        y: Math.random() * 300 + 150,
        width: PELMEN.width,
        height: PELMEN.height,
        collected: false,
        float: Math.random() * Math.PI * 2,
        type: 'good'
    });
}

function addEnemyBird() {
    enemyBirds.push({
        x: canvas.width + 50,
        y: Math.random() * 300 + 100,
        width: ENEMY_BIRD.width,
        height: ENEMY_BIRD.height,
        hit: false,
        float: Math.random() * Math.PI * 2,
        type: 'bad',
        speed: ENEMY_BIRD.speed + Math.random() * 1,
        wave: Math.random() * Math.PI * 2 // Для волнового движения
    });
}

function update() {
    if (!gameStarted || gameOver) return;
    
    frames++;
    
    // Физика козы
    goat.velocity += goat.gravity;
    goat.y += goat.velocity;
    
    goat.rotation = goat.velocity * 0.1;
    if (goat.rotation > 0.5) goat.rotation = 0.5;
    if (goat.rotation < -0.5) goat.rotation = -0.5;
    
    // Потолок
    if (goat.y < 20) {
        goat.y = 20;
        goat.velocity = 0;
    }
    
    // Земля
    ground.x -= ground.speed;
    if (ground.x <= -canvas.width) ground.x = 0;
    
    // Лавочки
    for (let i = benches.length - 1; i >= 0; i--) {
        const bench = benches[i];
        bench.x -= BENCH.speed;
        
        if (!bench.passed && bench.x + bench.width < goat.x) {
            bench.passed = true;
            score += 5;
            document.getElementById('score').textContent = score;
            
            if (benches.length < 3) {
                addBench();
            }
        }
        
        if (bench.x + bench.width < 0) benches.splice(i, 1);
        
        // Столкновение с лавочкой
        if (goat.x + goat.width > bench.x &&
            goat.x < bench.x + bench.width &&
            goat.y + goat.height > bench.y &&
            goat.y < bench.y + bench.height) {
            gameOver = true;
            endGame();
        }
    }
    
    // Пельмени
    for (let i = pelmeni.length - 1; i >= 0; i--) {
        const pelmen = pelmeni[i];
        pelmen.x -= BENCH.speed;
        pelmen.float += 0.05;
        
        if (!pelmen.collected &&
            goat.x + goat.width - 10 > pelmen.x &&
            goat.x + 10 < pelmen.x + pelmen.width &&
            goat.y + goat.height - 10 > pelmen.y &&
            goat.y + 10 < pelmen.y + pelmen.height) {
            
            pelmen.collected = true;
            score += PELMEN.points;
            pelmen.effect = '+' + PELMEN.points;
            pelmen.effectTime = frames;
            
            document.getElementById('score').textContent = score;
        }
        
        if (pelmen.x + pelmen.width < -50) {
            pelmeni.splice(i, 1);
        }
    }
    
    // Птицы - БОЛЬШЕ И СЛОЖНЕЕ!
    for (let i = enemyBirds.length - 1; i >= 0; i--) {
        const bird = enemyBirds[i];
        bird.x -= bird.speed;
        bird.float += 0.1;
        bird.wave += 0.05;
        
        // Птицы летят волнами (синусоида)
        bird.y += Math.sin(bird.wave) * 2;
        
        if (!bird.hit &&
            goat.x + goat.width - 15 > bird.x &&
            goat.x + 15 < bird.x + bird.width &&
            goat.y + goat.height - 15 > bird.y &&
            goat.y + 15 < bird.y + bird.height) {
            
            bird.hit = true;
            score += ENEMY_BIRD.points;
            if (score < 0) score = 0;
            bird.effect = ENEMY_BIRD.points;
            bird.effectTime = frames;
            
            document.getElementById('score').textContent = score;
            
            // Отталкивание козы при столкновении
            goat.velocity = -6;
        }
        
        if (bird.x + bird.width < -100) {
            enemyBirds.splice(i, 1);
        }
    }
    
    // Падение на землю
    if (goat.y + goat.height > ground.y) {
        gameOver = true;
        endGame();
    }
    
    // Добавление объектов - БОЛЬШЕ ПТИЦ!
    if (frames % 120 === 0) {
        addBench();
        if (Math.random() < PELMEN.spawnChance) addPelmen();
        // Увеличили шанс появления птиц!
        if (Math.random() < ENEMY_BIRD.spawnChance) addEnemyBird();
    }
    
    // Дополнительный шанс появления птиц (для еще большего количества)
    if (frames % 80 === 0 && Math.random() < 0.25) {
        addEnemyBird();
    }
}

function endGame() {
    gameOver = true;
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('goatHighScore', highScore);
    }
    
    document.getElementById('finalScore').textContent = score;
    document.getElementById('highScore').textContent = highScore;
    document.getElementById('gameOverScreen').style.display = 'flex';
}

// ====================
// ОТРИСОВКА
// ====================
function draw() {
    // Фон
    ctx.drawImage(BG_IMG, 0, 0, canvas.width, canvas.height);
    
    // Лавочки
    benches.forEach(bench => {
        ctx.drawImage(PIPE_IMG, bench.x, bench.y, bench.width, bench.height);
    });
    
    // Пельмени
    pelmeni.forEach(pelmen => {
        if (!pelmen.collected) {
            ctx.save();
            ctx.translate(pelmen.x + pelmen.width/2, pelmen.y + pelmen.height/2);
            ctx.rotate(pelmen.float);
            ctx.drawImage(PELMEN_IMG, -pelmen.width/2, -pelmen.height/2, pelmen.width, pelmen.height);
            ctx.restore();
        } else if (pelmen.effect) {
            // Эффект сбора
            const age = frames - pelmen.effectTime;
            if (age < 30) {
                ctx.save();
                ctx.globalAlpha = 1 - age / 30;
                ctx.fillStyle = '#FFD700';
                ctx.font = 'bold 20px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(pelmen.effect, pelmen.x + pelmen.width/2, pelmen.y - age);
                ctx.restore();
            }
        }
    });
    
    // Птицы враги
    enemyBirds.forEach(bird => {
        ctx.save();
        ctx.translate(bird.x + bird.width/2, bird.y + bird.height/2);
        
        // Мигание для опасности
        if (Math.sin(bird.float * 3) > 0) {
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 10;
        }
        
        // Анимация полета (легкое масштабирование)
        const scaleY = 0.9 + Math.abs(Math.sin(bird.float