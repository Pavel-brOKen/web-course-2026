// ==========================================
// 1. МОДУЛЬ ВЫЧИСЛЕНИЙ (MODEL)
// ==========================================
const GameModel = {
  GRID_SIZE: 20,
  TILE_SIZE: 20,
  QUOTES: [
    'ЗДАРОВА, ЧУМБА! ЧИП ВЗЛОМАН',
    'ВСТАВАЙ, САМУРАЙ... ЖГИ ЛЁД!',
    'ПРЕДЕЛ НЕ ПРЕДЕЛ, ДЭВИД!',
    'САНДЕВИСТАН НА ПОЛНУЮ!',
    'ПРИВЕТ ОТ ДЖОННИ СИЛЬВЕРХЕНДА',
    'ГОРИ, АРАСАКА! +10 ЭДДИ',
    'ЧИСТАЯ РАБОТА, НЕТРАННЕР!',
    'ВЫСШАЯ ЛИГА НАЙТ-СИТИ!'
  ],
  HEADER_CHATTER: [
    'ЗДАРОВА, ЧУМБА // КАНАЛ ОТКРЫТ',
    'ВСТАВАЙ, САМУРАЙ // РЕЖИМ РЕЗНИ',
    'САНДЕВИСТАН // ПОЛНЫЙ ФОРСАЖ',
    'ОСТОРОЖНЕЕ С ХРОМОМ, ЧУМБА',
    'ВЫСШАЯ ЛИГА // ПОСМЕРТИЕ'
  ],

  state: {
    snake: [],
    afterimages: [],
    direction: { x: 1, y: 0 },
    nextDirection: { x: 1, y: 0 },
    apple: { x: 15, y: 10 },
    score: 0,
    isStarted: false,
    isGameOver: false,
    currentChatter: 'ЗДАРОВА, ЧУМБА // КАНАЛ ОТКРЫТ',
    activeBanner: null,
    constrictEffects: [],
    skullEffects: [],
    sparks: []
  },

  initState() {
    this.state.snake = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
      { x: 7, y: 10 }
    ];
    this.state.afterimages = [];
    this.state.direction = { x: 1, y: 0 };
    this.state.nextDirection = { x: 1, y: 0 };
    this.state.score = 0;
    this.state.isGameOver = false;
    this.state.currentChatter = this.HEADER_CHATTER.slice(0, 1).pop();
    this.state.activeBanner = null;
    this.state.constrictEffects = [];
    this.state.skullEffects = [];
    this.state.sparks = [];
    this.spawnApple();
  },

  spawnApple() {
    let valid = false;
    while (!valid) {
      const rx = Math.floor(Math.random() * this.GRID_SIZE);
      const ry = Math.floor(Math.random() * this.GRID_SIZE);
      const occupied = this.state.snake.some(seg => seg.x === rx && seg.y === ry);
      if (!occupied) {
        this.state.apple = { x: rx, y: ry };
        valid = true;
      }
    }
  },

  setDirection(newDir) {
    if (!this.state.isStarted || this.state.isGameOver) return;
    const isOpposite =
      newDir.x === -this.state.direction.x && newDir.y === -this.state.direction.y;
    if (!isOpposite) {
      if (newDir.x !== this.state.nextDirection.x || newDir.y !== this.state.nextDirection.y) {
        const head = this.state.snake.slice(0, 1).pop();
        if (head) {
          this.addSparks(
            head.x * this.TILE_SIZE + this.TILE_SIZE / 2,
            head.y * this.TILE_SIZE + this.TILE_SIZE / 2,
            7
          );
        }
      }
      this.state.nextDirection = newDir;
    }
  },

  checkCollision(head) {
    const hitWall =
      head.x < 0 || head.x >= this.GRID_SIZE || head.y < 0 || head.y >= this.GRID_SIZE;
    const hitSelf = this.state.snake.some(
      seg => seg.x === head.x && seg.y === head.y
    );
    return hitWall || hitSelf;
  },

  addSparks(x, y, count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.2 + Math.random() * 2.1;
      this.state.sparks.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0
      });
    }
  },

  triggerQuoteBanner(text) {
    this.state.activeBanner = {
      text,
      timer: 210,
      maxTimer: 210,
      flash: 1.0
    };
  },

  addConstrictEffect(gridX, gridY) {
    const cx = gridX * this.TILE_SIZE + this.TILE_SIZE / 2;
    const cy = gridY * this.TILE_SIZE + this.TILE_SIZE / 2;
    const shards = [];

    for (let i = 0; i < 10; i++) {
      const angle = (Math.PI * 2 * i) / 10;
      shards.push({
        vx: Math.cos(angle) * (2.2 + Math.random()),
        vy: Math.sin(angle) * (2.2 + Math.random()),
        x: 0,
        y: 0
      });
    }

    const randomQuote = this.QUOTES[Math.floor(Math.random() * this.QUOTES.length)];
    const randomHeader = this.HEADER_CHATTER[Math.floor(Math.random() * this.HEADER_CHATTER.length)];
    this.state.currentChatter = randomHeader;

    this.triggerQuoteBanner(randomQuote);

    this.state.constrictEffects.push({
      x: cx,
      y: cy,
      progress: 0,
      skullSpawned: false,
      shards
    });
  },

  addMaelstromSkullEffect(x, y) {
    this.state.skullEffects.push({
      x,
      y,
      alpha: 1.0,
      scale: 0.85,
      time: 0
    });
  },

  updateEffects() {
    if (this.state.activeBanner) {
      this.state.activeBanner.timer -= 1;
      this.state.activeBanner.flash = Math.max(0, this.state.activeBanner.flash - 0.08);
      if (this.state.activeBanner.timer <= 0) {
        this.state.activeBanner = null;
      }
    }

    for (let i = this.state.afterimages.length - 1; i >= 0; i--) {
      const ghost = this.state.afterimages[i];
      ghost.alpha -= 0.06;
      if (ghost.alpha <= 0) {
        this.state.afterimages.splice(i, 1);
      }
    }

    // Искры теперь живут дольше (~40 кадров вместо 20) и плавно замедляются
    for (let i = this.state.sparks.length - 1; i >= 0; i--) {
      const sp = this.state.sparks[i];
      sp.x += sp.vx;
      sp.y += sp.vy;
      sp.vx *= 0.96;
      sp.vy *= 0.96;
      sp.life -= 0.025;
      if (sp.life <= 0) {
        this.state.sparks.splice(i, 1);
      }
    }

    for (let i = this.state.constrictEffects.length - 1; i >= 0; i--) {
      const fx = this.state.constrictEffects[i];
      fx.progress += 0.04;

      if (fx.progress >= 0.6 && !fx.skullSpawned) {
        fx.skullSpawned = true;
        this.addSparks(fx.x, fx.y, 16);
        this.addMaelstromSkullEffect(fx.x, fx.y - 6);
      }

      if (fx.progress >= 0.6) {
        fx.shards.forEach(s => {
          s.x += s.vx;
          s.y += s.vy;
        });
      }

      if (fx.progress >= 1.0) {
        this.state.constrictEffects.splice(i, 1);
      }
    }

    // Увеличено время отображения хромированного черепка (~110 кадров)
    for (let i = this.state.skullEffects.length - 1; i >= 0; i--) {
      const skull = this.state.skullEffects[i];
      skull.y -= 0.32;
      skull.alpha -= 0.009;
      skull.scale += 0.0035;
      skull.time += 1;

      if (skull.alpha <= 0) {
        this.state.skullEffects.splice(i, 1);
      }
    }
  },

  moveSnake() {
    if (!this.state.isStarted || this.state.isGameOver) return;

    this.state.afterimages.push({
      points: this.state.snake.map(s => ({ x: s.x, y: s.y })),
      alpha: 0.42
    });
    if (this.state.afterimages.length > 4) {
      this.state.afterimages.shift();
    }

    this.state.direction = this.state.nextDirection;

    const currentHead = this.state.snake.slice(0, 1).pop();
    const newHead = {
      x: currentHead.x + this.state.direction.x,
      y: currentHead.y + this.state.direction.y
    };

    if (this.checkCollision(newHead)) {
      this.state.isGameOver = true;
      return;
    }

    this.state.snake.unshift(newHead);

    if (newHead.x === this.state.apple.x && newHead.y === this.state.apple.y) {
      this.state.score += 10;
      this.addConstrictEffect(newHead.x, newHead.y);
      this.spawnApple();
    } else {
      this.state.snake.pop();
    }
  }
};

// ==========================================
// 2. МОДУЛЬ ВЫВОДА (VIEW)
// ==========================================
const GameView = {
  drawBrutalBackground(ctx, canvas) {
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#222634');
    bgGrad.addColorStop(0.55, '#191c26');
    bgGrad.addColorStop(1, '#2b1620');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(13, 15, 22, 0.55)';
    const buildings = [
      { x: 8, w: 48, h: 165 },
      { x: 64, w: 32, h: 115 },
      { x: 108, w: 56, h: 205 },
      { x: 172, w: 62, h: 255 },
      { x: 244, w: 44, h: 175 },
      { x: 298, w: 52, h: 135 },
      { x: 356, w: 38, h: 190 }
    ];
    buildings.forEach(b => {
      ctx.fillRect(b.x, canvas.height - b.h, b.w, b.h);
    });

    ctx.fillStyle = 'rgba(255, 0, 60, 0.35)';
    ctx.fillRect(182, canvas.height - 230, 4, 45);
    ctx.fillRect(120, canvas.height - 180, 18, 3);
    ctx.fillRect(255, canvas.height - 150, 3, 30);

    ctx.strokeStyle = 'rgba(252, 238, 9, 0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= GameModel.GRID_SIZE; i++) {
      const pos = i * GameModel.TILE_SIZE;
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, canvas.height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(canvas.width, pos);
      ctx.stroke();
    }
  },

  drawNeuroChip(ctx, cx, cy, scale, time) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);

    const pulse = 0.65 + Math.sin(time / 180) * 0.35;

    ctx.fillStyle = '#11131a';
    ctx.strokeStyle = '#7d889c';
    ctx.lineWidth = 1.2;

    ctx.beginPath();
    ctx.moveTo(-6, -8);
    ctx.lineTo(2.5, -8);
    ctx.lineTo(6, -4.5);
    ctx.lineTo(6, 7.5);
    ctx.lineTo(-6, 7.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#282d3d';
    ctx.lineWidth = 1;
    ctx.strokeRect(-4, -5.5, 8, 9);

    ctx.fillStyle = '#c9a227';
    ctx.fillRect(-4.5, 5, 1.5, 2.5);
    ctx.fillRect(-2, 5, 1.5, 2.5);
    ctx.fillRect(0.5, 5, 1.5, 2.5);
    ctx.fillRect(3, 5, 1.5, 2.5);

    ctx.fillStyle = '#525b70';
    ctx.fillRect(-4, -6.8, 4.5, 0.8);

    ctx.fillStyle = 'rgba(255, 0, 43, ' + pulse + ')';
    ctx.shadowColor = '#ff002b';
    ctx.shadowBlur = 7;
    ctx.fillRect(-1.8, -2.5, 3.6, 3.6);

    ctx.restore();
  },

  drawMinimalTail(ctx, tail, beforeTail) {
    const tailAngle = Math.atan2(beforeTail.y - tail.y, beforeTail.x - tail.x);

    ctx.save();
    ctx.translate(tail.x, tail.y);
    ctx.rotate(tailAngle);

    ctx.fillStyle = '#11131a';
    ctx.strokeStyle = '#6c7589';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-6, -3);
    ctx.lineTo(-3, -4.5);
    ctx.lineTo(4, -3.5);
    ctx.lineTo(6, -1.5);
    ctx.lineTo(6, 1.5);
    ctx.lineTo(4, 3.5);
    ctx.lineTo(-3, 4.5);
    ctx.lineTo(-6, 3);
ctx.closePath();
ctx.fill();
ctx.stroke();
ctx.strokeStyle = '#2d3343';
ctx.lineWidth = 1;
ctx.beginPath();
ctx.moveTo(-3, 0);
ctx.lineTo(3, 0);
ctx.stroke();
ctx.fillStyle = '#ff003c';
ctx.fillRect(-4.5, -1, 1.5, 2);
ctx.restore();
},
drawMinimalHead(ctx, head, direction) {
const headAngle = Math.atan2(direction.y, direction.x);
ctx.save();
ctx.translate(head.x, head.y);
ctx.rotate(headAngle);
ctx.fillStyle = '#0e1016';
ctx.strokeStyle = '#9aa5b8';
ctx.lineWidth = 1.2;
ctx.beginPath();
ctx.moveTo(9, 0);
ctx.lineTo(-4, -3.2);
ctx.lineTo(-2.5, 0);
ctx.lineTo(-4, 3.2);
ctx.closePath();
ctx.fill();
ctx.stroke();
ctx.strokeStyle = '#ff6a00';
ctx.lineWidth = 1;
ctx.beginPath();
ctx.moveTo(-1, 0);
ctx.lineTo(7, 0);
ctx.stroke();
ctx.fillStyle = '#ffffff';
ctx.shadowColor = '#ff3b00';
ctx.shadowBlur = 6;
ctx.beginPath();
ctx.arc(8.5, 0, 1.4, 0, Math.PI * 2);
ctx.fill();
ctx.restore();
},
drawMonowireSnake(ctx, snake, afterimages, direction, time) {
if (!snake.length) return;
const size = GameModel.TILE_SIZE;
const half = size / 2;
afterimages.forEach((ghost, gIdx) => {
if (ghost.points.length < 2) return;
ctx.save();
ctx.beginPath();
ghost.points.forEach((pt, idx) => {
const px = pt.x * size + half;
const py = pt.y * size + half;
if (idx === 0) ctx.moveTo(px, py);
else ctx.lineTo(px, py);
});
ctx.strokeStyle = gIdx % 2 === 0
? 'rgba(0, 240, 255, ' + (ghost.alpha * 0.4) + ')'
: 'rgba(255, 0, 60, ' + (ghost.alpha * 0.4) + ')';
ctx.lineWidth = 2;
ctx.stroke();
ctx.restore();
});
const points = snake.map((seg, idx) => {
const baseX = seg.x * size + half;
const baseY = seg.y * size + half;
if (idx === 0 || idx === snake.length - 1) {
return { x: baseX, y: baseY };
}
const gentleWave = Math.sin(time / 140 + idx * 0.9) * 0.45;
return {
x: baseX + gentleWave * direction.y,
y: baseY + gentleWave * direction.x
};
});
ctx.save();
ctx.lineCap = 'round';
ctx.lineJoin = 'round';
const buildPath = () => {
ctx.beginPath();
points.forEach((pt, idx) => {
if (idx === 0) ctx.moveTo(pt.x, pt.y);
else ctx.lineTo(pt.x, pt.y);
});
};
buildPath();
ctx.strokeStyle = 'rgba(255, 0, 60, 0.5)';
ctx.shadowColor = '#ff003c';
ctx.shadowBlur = 12;
ctx.lineWidth = 6.5;
ctx.stroke();
buildPath();
ctx.strokeStyle = '#ff6a00';
ctx.shadowColor = '#ff6a00';
ctx.shadowBlur = 5;
ctx.lineWidth = 3;
ctx.stroke();
buildPath();
ctx.strokeStyle = '#ffffff';
ctx.shadowColor = '#ffffff';
ctx.shadowBlur = 3;
ctx.lineWidth = 1.4;
ctx.stroke();
ctx.restore();
if (points.length > 1) {
const tail = points[points.length - 1];
const beforeTail = points[points.length - 2];
this.drawMinimalTail(ctx, tail, beforeTail);
}
const head = points.slice(0, 1).pop();
this.drawMinimalHead(ctx, head, direction);
},
drawSparks(ctx, sparks) {
sparks.forEach(sp => {
ctx.save();
const alpha = Math.max(0, sp.life);
ctx.fillStyle = 'rgba(255, 220, 90, ' + alpha + ')';
ctx.shadowColor = '#ff6a00';
ctx.shadowBlur = 5;
ctx.fillRect(sp.x - 1.5, sp.y - 1.5, 3, 3);
ctx.restore();
});
},
drawConstrictEffects(ctx, effects, time) {
effects.forEach(fx => {
ctx.save();
ctx.translate(fx.x, fx.y);
if (fx.progress < 0.6) {
const squeezeRatio = fx.progress / 0.6;
const chipScale = Math.max(0.05, 1 - squeezeRatio * 0.92);
const shakeX = Math.sin(time / 12) * 3 * squeezeRatio;
const shakeY = Math.cos(time / 12) * 3 * squeezeRatio;
this.drawNeuroChip(ctx, shakeX, shakeY, chipScale, time);
const coilRadius = 15 * (1 - squeezeRatio * 0.85);
ctx.rotate(squeezeRatio * Math.PI * 3.5);
ctx.shadowColor = '#ff003c';
ctx.shadowBlur = 12;
for (let loop = 0; loop < 2; loop++) {
ctx.rotate(Math.PI / 3);
ctx.beginPath();
ctx.ellipse(0, 0, coilRadius, coilRadius * 0.65, 0, 0, Math.PI * 2);
ctx.strokeStyle = '#ff003c';
ctx.lineWidth = 4;
ctx.stroke();
ctx.strokeStyle = '#ffffff';
ctx.lineWidth = 1.5;
ctx.stroke();
}
} else {
const burstRatio = (fx.progress - 0.6) / 0.4;
const alpha = Math.max(0, 1 - burstRatio);
ctx.strokeStyle = 'rgba(255, 0, 60, ' + alpha + ')';
ctx.lineWidth = 3 * (1 - burstRatio);
ctx.beginPath();
ctx.arc(0, 0, 6 + burstRatio * 24, 0, Math.PI * 2);
ctx.stroke();
fx.shards.forEach((s, idx) => {
ctx.fillStyle = idx % 2 === 0
? 'rgba(201, 162, 39, ' + alpha + ')'
: 'rgba(125, 136, 156, ' + alpha + ')';
ctx.fillRect(s.x - 1.5, s.y - 1.5, 3, 3);
});
}
ctx.restore();
});
},
// Хромированный портретный кибер-череп «Мальстрём» с металлическими бликами
drawMaelstromSkullEffect(ctx, effects) {
effects.forEach(fx => {
ctx.save();
ctx.translate(fx.x, fx.y);
ctx.scale(fx.scale, fx.scale);
ctx.globalAlpha = Math.max(0, fx.alpha);
const glitchOffset = fx.time < 8 ? Math.sin(fx.time * 3) * 2 : 0;
ctx.translate(glitchOffset, 0);
// 1. Тёмная виньетка за портретом
const aura = ctx.createRadialGradient(0, 0, 4, 0, 0, 28);
aura.addColorStop(0, 'rgba(10, 11, 16, 0.88)');
aura.addColorStop(1, 'rgba(10, 11, 16, 0)');
ctx.fillStyle = aura;
ctx.beginPath();
ctx.arc(0, 0, 28, 0, Math.PI * 2);
ctx.fill();
// 2. Хромированный градиент полированной стали для черепной коробки и лица
const chromeGrad = ctx.createLinearGradient(-13, -18, 13, 18);
chromeGrad.addColorStop(0, '#eef3f9');   // Яркий стальной блик сверху слева
chromeGrad.addColorStop(0.28, '#9aa6b8'); // Светлый хром
chromeGrad.addColorStop(0.55, '#464f61'); // Тёмный металл в тени
chromeGrad.addColorStop(0.8, '#8793a6');  // Отражённый рефлекс на скуле
chromeGrad.addColorStop(1, '#1c202b');    // Глубокая тень подбородка
ctx.fillStyle = chromeGrad;
ctx.strokeStyle = '#d0d8e6';
ctx.lineWidth = 1.1;
ctx.beginPath();
ctx.arc(0, -8, 13, Math.PI, 0);
ctx.lineTo(13, 1);
ctx.lineTo(10, 9);
ctx.lineTo(5, 18);
ctx.lineTo(-5, 18);
ctx.lineTo(-10, 9);
ctx.lineTo(-13, 1);
ctx.closePath();
ctx.fill();
ctx.stroke();
// 3. Зеркальные хромированные блики на скулах и висках
ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
ctx.beginPath();
ctx.moveTo(-11, 1);
ctx.lineTo(-8, 1);
ctx.lineTo(-7, 7);
ctx.lineTo(-9.5, 7);
ctx.closePath();
ctx.fill();
ctx.beginPath();
ctx.moveTo(11, 1);
ctx.lineTo(8.5, 1);
ctx.lineTo(7.5, 6);
ctx.lineTo(9.5, 6);
ctx.closePath();
ctx.fill();
// 4. Чёткие стыки металлических бронепластин (швы имплантов)
ctx.strokeStyle = '#151821';
ctx.lineWidth = 1.2;
ctx.beginPath();
ctx.moveTo(-12, -4);
ctx.lineTo(-9, -4);
ctx.lineTo(-9, 6);
ctx.lineTo(-6, 11);
ctx.moveTo(12, -4);
ctx.lineTo(9, -4);
ctx.lineTo(9, 6);
ctx.lineTo(6, 11);
// Линия разделения верхней и нижней челюсти
ctx.moveTo(-8, 8.5);
ctx.lineTo(-4, 10);
ctx.lineTo(4, 10);
ctx.lineTo(8, 8.5);
ctx.stroke();
// 5. Полированные заклёпки и скобы на челюсти и висках
ctx.fillStyle = '#ffffff';
ctx.fillRect(-12.5, -3, 2.5, 4);
ctx.fillRect(10, -3, 2.5, 4);
ctx.fillRect(-4.5, 13.5, 2, 3.5);
ctx.fillRect(-1, 14, 2, 3.5);
ctx.fillRect(2.5, 13.5, 2, 3.5);
// 6. Механическая полость носа и металлический оскал
ctx.fillStyle = '#0d0f14';
ctx.beginPath();
ctx.moveTo(0, -1);
ctx.lineTo(-2.5, 5);
ctx.lineTo(2.5, 5);
ctx.closePath();
ctx.fill();
// Хромированные зубы-пластины
ctx.fillStyle = '#cfd8e6';
ctx.fillRect(-4.5, 9.5, 9, 2.2);
ctx.strokeStyle = '#0d0f14';
ctx.lineWidth = 0.9;
ctx.beginPath();
ctx.moveTo(-1.5, 9.5);
ctx.lineTo(-1.5, 11.7);
ctx.moveTo(1.5, 9.5);
ctx.lineTo(1.5, 11.7);
ctx.stroke();
// 7. Лицевой визор-блок из тёмного титана и полированного хрома
const visorGrad = ctx.createLinearGradient(-11, -16, 11, -5);
visorGrad.addColorStop(0, '#5a6578');
visorGrad.addColorStop(0.5, '#1d222c');
visorGrad.addColorStop(1, '#4b5566');
ctx.fillStyle = visorGrad;
ctx.strokeStyle = '#e2e8f2';
ctx.lineWidth = 1;
ctx.beginPath();
ctx.moveTo(-11, -11);
ctx.lineTo(-5, -16);
ctx.lineTo(5, -16);
ctx.lineTo(11, -11);
ctx.lineTo(9, -5);
ctx.lineTo(-9, -5);
ctx.closePath();
ctx.fill();
ctx.stroke();
// 8. Семь светящихся красных оптических линз
const drawRedLens = (lx, ly, r) => {
ctx.save();
ctx.fillStyle = '#ff002b';
ctx.shadowColor = '#ff002b';
ctx.shadowBlur = 10;
ctx.beginPath();
ctx.arc(lx, ly, r, 0, Math.PI * 2);
ctx.fill();
ctx.shadowBlur = 0;
ctx.fillStyle = '#ffb3b3';
ctx.beginPath();
ctx.arc(lx, ly, r * 0.45, 0, Math.PI * 2);
ctx.fill();
ctx.restore();
};
drawRedLens(0, -10.5, 3.4);
drawRedLens(-6.2, -11.8, 1.8);
drawRedLens(-7.5, -8.2, 1.7);
drawRedLens(6.2, -11.8, 1.8);
drawRedLens(7.5, -8.2, 1.7);
ctx.fillStyle = '#090a0d';
ctx.beginPath();
ctx.arc(-5.5, -1.5, 3.3, 0, Math.PI * 2);
ctx.arc(5.5, -1.5, 3.3, 0, Math.PI * 2);
ctx.fill();
drawRedLens(-5.5, -1.5, 2.2);
drawRedLens(5.5, -1.5, 2.2);
ctx.restore();
});
},
drawQuoteBanner(ctx, canvas, banner) {
if (!banner) return;
const alpha = banner.timer < 30 ? banner.timer / 30 : 1.0;
ctx.save();
ctx.globalAlpha = Math.max(0, alpha);
const boxW = 340;
const boxH = 30;
const x = (canvas.width - boxW) / 2;
const y = 12;
ctx.fillStyle = banner.flash > 0.2 ? '#ff003c' : 'rgba(18, 20, 30, 0.9)';
ctx.strokeStyle = '#fcee09';
ctx.lineWidth = 1.5;
ctx.fillRect(x, y, boxW, boxH);
ctx.strokeRect(x, y, boxW, boxH);
ctx.fillStyle = '#00f0ff';
ctx.fillRect(x, y, 5, boxH);
ctx.font = 'bold 12px Courier New, monospace';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillStyle = banner.flash > 0.2 ? '#ffffff' : '#fcee09';
ctx.fillText('// ' + banner.text, canvas.width / 2 + 2, y + boxH / 2);
const progressW = (boxW - 5) * (banner.timer / banner.maxTimer);
ctx.fillStyle = '#ff003c';
ctx.fillRect(x + 5, y + boxH - 2, progressW, 2);
ctx.restore();
},
draw(state, time = 0) {
const canvas = document.getElementById('gameCanvas');
if (!canvas) return;
const ctx = canvas.getContext('2d');
ctx.clearRect(0, 0, canvas.width, canvas.height);
this.drawBrutalBackground(ctx, canvas);
const cx = state.apple.x * GameModel.TILE_SIZE + GameModel.TILE_SIZE / 2;
const cy = state.apple.y * GameModel.TILE_SIZE + GameModel.TILE_SIZE / 2;
this.drawNeuroChip(ctx, cx, cy, 1, time);
this.drawMonowireSnake(ctx, state.snake, state.afterimages, state.direction, time);
this.drawSparks(ctx, state.sparks);
this.drawConstrictEffects(ctx, state.constrictEffects, time);
this.drawMaelstromSkullEffect(ctx, state.skullEffects);
this.drawQuoteBanner(ctx, canvas, state.activeBanner);
const scoreEl = document.getElementById('score');
const finalScoreEl = document.getElementById('finalScore');
const chatterEl = document.getElementById('radioChatter');
const startOverlay = document.getElementById('startOverlay');
const gameOverOverlay = document.getElementById('gameOverOverlay');
if (scoreEl) scoreEl.textContent = state.score;
if (finalScoreEl) finalScoreEl.textContent = state.score;
if (chatterEl) chatterEl.textContent = state.currentChatter;
if (startOverlay) {
startOverlay.style.display = state.isStarted ? 'none' : 'flex';
}
if (gameOverOverlay) {
gameOverOverlay.style.display = state.isGameOver ? 'flex' : 'none';
}
}
};
// ==========================================
// 3. МОДУЛЬ КОНТРОЛЛЕРА (CONTROLLER)
// ==========================================
const GameController = {
BASE_INTERVAL: 105,
lastMoveTime: 0,
animationFrameId: null,
handleKeyDown(event) {
if (
(event.key === 'Enter' || event.key === ' ') &&
(!GameModel.state.isStarted || GameModel.state.isGameOver)
) {
event.preventDefault();
GameController.startRun();
return;
}
const keyMap = {
ArrowUp: { x: 0, y: -1 },
ArrowDown: { x: 0, y: 1 },
ArrowLeft: { x: -1, y: 0 },
ArrowRight: { x: 1, y: 0 }
};
if (keyMap[event.key]) {
event.preventDefault();
GameModel.setDirection(keyMap[event.key]);
}
},
update(currentTime) {
const speedBonus = Math.min(40, Math.floor(GameModel.state.score / 20) * 4);
const currentInterval = GameController.BASE_INTERVAL - speedBonus;
const deltaTime = currentTime - GameController.lastMoveTime;
if (deltaTime >= currentInterval) {
GameModel.moveSnake();
GameController.lastMoveTime = currentTime;
}
GameModel.updateEffects();
},
gameLoop(currentTime) {
GameController.update(currentTime);
GameView.draw(GameModel.state, currentTime);
if (!GameModel.state.isGameOver) {
GameController.animationFrameId = requestAnimationFrame(GameController.gameLoop);
}
},
startRun() {
if (GameController.animationFrameId) {
cancelAnimationFrame(GameController.animationFrameId);
}
GameModel.initState();
GameModel.state.isStarted = true;
GameModel.triggerQuoteBanner('ВСТАВАЙ, САМУРАЙ... ПОГНАЛИ!');
GameController.lastMoveTime = performance.now();
GameView.draw(GameModel.state, GameController.lastMoveTime);
GameController.animationFrameId = requestAnimationFrame(GameController.gameLoop);
},
init() {
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
document.addEventListener('keydown', GameController.handleKeyDown);
if (startBtn) startBtn.onclick = GameController.startRun;
if (restartBtn) restartBtn.onclick = GameController.startRun;
GameModel.initState();
GameView.draw(GameModel.state, 0);
}
};
window.addEventListener('load', GameController.init);