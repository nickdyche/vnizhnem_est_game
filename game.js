// ====================
// КОЗА В НИЖНЕМ - КЛАССИЧЕСКАЯ ФИЗИКА
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

// Красные пельмени
const BAD_PELMEN_IMG = new Image();
BAD_PELMEN_IMG.src = 'data:image/svg+xml;base64,' + btoa(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 60">
    <ellipse cx="50" cy="30" rx="45" ry="25" fill="#ff4444" stroke="#cc0000" stroke-width="3"/>
</svg>
`);

// Игровые переменные
let score = 0;
let highScore = parseInt(localStorage.getItem('goatHighScore')) || 0;
let gameOver = false;
let gameStarted = false;
let frames = 0;

// КОЗА (классическая физика)
const goat = {
    x: 150,
    y: canvas.height / 2,
    width: 50,
    height: 50,
    velocity: 0,
    gravity: 0.5,
    jumpStrength: -8, // Легкий прыжок
    rotation: 0,
    maxHeight: 100 // Красные пельмени будут на 80-120
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
    goodPoints: 10,
    badPoints: -20,
    goodSpawnChance: 0.7,
    badSpawnChance: 0.4
};

// Земля
const ground = {
    x: 0,
    y: canvas.height - 50,
    height: 50,
    speed: 3
};

// ====================
// ПРОСТОЕ УПРАВЛЕНИЕ
// ====================
function handleJump() {
    if (!gameStarted) {
        startGame();
        return;
    }
    
    if (!gameOver) {
        goat.velocity = goat.jumpStrength;
    } else {
        resetGame();
    }
}

// Тапы и клики
document.addEventListener('click', handleJump);
document.addEventListener('touchstart', function(e) {
    e.preventDefault();
    handleJump();
}, { passive: false });

// Клавиатура
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
    if (gameStarted) return;
    
    gameStarted = true;
    gameOver = false;
    score = 0;
    benches.length = 0;
    pelmeni.length = 0;
    goat.y = canvas.height / 2;
    goat.velocity = 0;
    
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('gameOverScreen').style.display = 'none';
    document.getElementById('score').textContent = '0';
    
    // Первые объекты
    addBench();
    if (Math.random() < 0.5) addPelmen();
}

function resetGame() {
    gameOver = false;
    gameStarted = false;
    score = 0;
    benches.length = 0;
    pelmeni.length = 0;
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
    // Золотой пельмень (середина)
    pelmeni.push({
        x: canvas.width + Math.random() * 100,
        y: Math.random() * 300 + 150, // 150-450
        width: PELMEN.width,
        height: PELMEN.height,
        isGood: true,
        collected: false,
        float: Math.random() * Math.PI * 2
    });
    
    // Красный пельмень (верх) - реже
    if (Math.random() < PELMEN.badSpawnChance) {
        pelmeni.push({
            x: canvas.width + Math.random() * 100 + 50,
            y: Math.random() * 70 + 80, // 80-150 (у потолка)
            width: PELMEN.width,
            height: PELMEN.height,
            isGood: false,
            collected: false,
            float: Math.random() * Math.PI * 2,
            blink: 0
        });
    }
}

function update() {
    if (!gameStarted || gameOver) return;
    
    frames++;
    
    // КЛАССИЧЕСКАЯ ФИЗИКА
    goat.velocity += goat.gravity;
    goat.y += goat.velocity;
    
    // Вращение
    goat.rotation = goat.velocity * 0.1;
    if (goat.rotation > 0.5) goat.rotation = 0.5;
    if (goat.rotation < -0.5) goat.rotation = -0.5;
    
    // Потолок (мягкий)
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
                if (Math.random() < 0.7) addPelmen();
            }
        }
        
        if (bench.x + bench.width < 0) benches.splice(i, 1);
        
        // Столкновение
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
        
        if (!pelmen.isGood) {
            pelmen.blink += 0.1;
        }
        
        // Коллизия
        if (!pelmen.collected &&
            goat.x + goat.width - 10 > pelmen.x &&
            goat.x + 10 < pelmen.x + pelmen.width &&
            goat.y + goat.height - 10 > pelmen.y &&
            goat.y + 10 < pelmen.y + pelmen.height) {
            
            pelmen.collected = true;
            
            if (pelmen.isGood) {
                score += PELMEN.goodPoints;
                pelmen.effect = '+10';
                pelmen.color = '#FFD700';
            } else {
                score += PELMEN.badPoints;
                if (score < 0) score = 0;
                pelmen.effect = '-20';
                pelmen.color = '#ff4444';
            }
            
            document.getElementById('score').textContent = score;
            
            setTimeout(() => {
                const idx = pelmeni.indexOf(pelmen);
                if (idx > -1) pelmeni.splice(idx, 1);
            }, 300);
        }
        
        if (pelmen.x + pelmen.width < -50) {
            pelmeni.splice(i, 1);
        }
    }
    
    // Падение на землю
    if (goat.y + goat.height > ground.y) {
        gameOver = true;
        endGame();
    }
    
    // Автодобавление
    if (frames % 120 === 0) addBench();
    if (frames % 90 === 0 && Math.random() < 0.6) addPelmen();
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
    
    // Зона опасности (верх)
    ctx.fillStyle = 'rgba(255, 50, 50, 0.1)';
    ctx.fillRect(0, 0, canvas.width, 150);
    
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
            
            if (pelmen.isGood) {
                // Золотой
                ctx.drawImage(PELMEN_IMG, -pelmen.width/2, -pelmen.height/2, pelmen.width, pelmen.height);
            } else {
                // Красный (мигает)
                if (Math.sin(pelmen.blink) > 0) {
                    ctx.globalAlpha = 0.7;
                }
                ctx.drawImage(BAD_PELMEN_IMG, -pelmen.width/2, -pelmen.height/2, pelmen.width, pelmen.height);
            }
            
            ctx.restore();
        } else if (pelmen.effect) {
            // Эффект сбора
            ctx.save();
            ctx.globalAlpha = 0.9;
            ctx.fillStyle = pelmen.color;
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(pelmen.effect, pelmen.x + pelmen.width/2, pelmen.y - 10);
            ctx.restore();
        }
    });
    
    // Земля
    ctx.drawImage(GROUND_IMG, ground.x, ground.y, canvas.width, ground.height);
    ctx.drawImage(GROUND_IMG, ground.x + canvas.width, ground.y, canvas.width, ground.height);
    
    // Коза
    ctx.save();
    ctx.translate(goat.x + goat.width/2, goat.y + goat.height/2);
    ctx.rotate(goat.rotation);
    ctx.drawImage(BIRD_IMG, -goat.width/2, -goat.height/2, goat.width, goat.height);
    ctx.restore();
}

// ====================
// ЗАПУСК
// ====================
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Инициализация
window.onload = function() {
    // Telegram
    if (window.Telegram && Telegram.WebApp) {
        const tg = Telegram.WebApp;
        tg.expand();
        tg.isVerticalSwipesEnabled = false;
    }
    
    // Запуск
    gameLoop();
    
    // Загрузка изображений
    const images = [BIRD_IMG, PIPE_IMG, BG_IMG, GROUND_IMG, PELMEN_IMG, BAD_PELMEN_IMG];
    images.forEach(img => {
        img.onload = () => console.log('Загружено:', img.src);
        img.onerror = (e) => console.error('Ошибка:', img.src, e);
    });
    
    // Рекорд
    document.getElementById('highScore').textContent = highScore;
};