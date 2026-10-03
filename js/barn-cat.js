/* Barn Cat Defender — tuxedo cat vs mice & snakes in hay holes (Build-matched) */
(function () {
  var KEY = "coc-play-barn-cat-best";
  var W = 340, H = 420, COLS = 3, ROWS = 3;

  var canvas = document.getElementById("canvas");
  var ctx = canvas.getContext("2d");
  var scoreEl = document.getElementById("score");
  var livesEl = document.getElementById("lives");
  var bestEl = document.getElementById("best");
  var waveEl = document.getElementById("wave");
  var comboEl = document.getElementById("combo");
  var overlay = document.getElementById("overlay");
  var overlayTitle = document.getElementById("overlay-title");
  var overlayMsg = document.getElementById("overlay-msg");
  var startBtn = document.getElementById("start-btn");
  var hintEl = document.getElementById("hint");

  canvas.width = W;
  canvas.height = H;

  var running = false;
  var state = null;
  var last = 0;

  bestEl.textContent = CrittersPlay.getBest(KEY);
  var runBest = CrittersPlay.getBest(KEY);

  function makeHoles() {
    var holes = [];
    var startX = W / 2 - 56;
    for (var row = 0; row < ROWS; row++) {
      for (var col = 0; col < COLS; col++) {
        holes.push({
          x: startX + col * 56,
          y: 118 + row * 78,
          pest: null, rise: 0, rising: false, life: 0, hit: 0
        });
      }
    }
    return holes;
  }

  function drawBarnBg(e) {
    var t = e.createLinearGradient(0, 0, 0, H);
    t.addColorStop(0, "#3d2614");
    t.addColorStop(0.35, "#5a3820");
    t.addColorStop(1, "#2a1a10");
    e.fillStyle = t;
    e.fillRect(0, 0, W, H);
    e.strokeStyle = "rgba(20,10,4,0.28)";
    e.lineWidth = 2;
    for (var x = 0; x < W; x += 22) {
      e.beginPath();
      e.moveTo(x, 0);
      e.lineTo(x, H);
      e.stroke();
    }
    e.fillStyle = "#2a1810";
    e.fillRect(0, 0, W, 46);
    e.fillStyle = "#c9a227";
    e.fillRect(0, 46, W, 4);
    e.fillStyle = "#fde68a";
    e.globalAlpha = 0.25;
    e.fillRect(W / 2 - 28, 10, 56, 26);
    e.globalAlpha = 1;
    e.strokeStyle = "#f5f0e6";
    e.lineWidth = 2;
    e.strokeRect(W / 2 - 28, 10, 56, 26);
    e.beginPath();
    e.moveTo(W / 2, 10);
    e.lineTo(W / 2, 36);
    e.moveTo(W / 2 - 28, 23);
    e.lineTo(W / 2 + 28, 23);
    e.stroke();
    e.font = "bold 11px sans-serif";
    e.fillStyle = "#e8d48b";
    e.textAlign = "center";
    e.fillText("BARN CAT WATCH", W / 2, 62);
    e.fillStyle = "#6b4e22";
    e.fillRect(0, H - 36, W, 36);
    e.fillStyle = "rgba(201,162,39,0.25)";
    for (var i = 0; i < 28; i++) e.fillRect((i * 29) % W, H - 30 + (i % 3) * 6, 8, 3);
  }

  function drawCat(e, x, y, swat) {
    e.save();
    e.translate(x, y);
    if (swat > 0) e.rotate(-0.25 * swat);
    e.fillStyle = "#141414";
    e.beginPath();
    e.ellipse(0, 6, 16, 13, 0, 0, Math.PI * 2);
    e.fill();
    e.fillStyle = "#f5f2eb";
    e.beginPath();
    e.ellipse(2, 8, 7, 8, 0.1, 0, Math.PI * 2);
    e.fill();
    e.fillStyle = "#1a1a1a";
    e.beginPath();
    e.ellipse(10, -6, 11, 10, 0.15, 0, Math.PI * 2);
    e.fill();
    e.fillStyle = "#f7f4ee";
    e.beginPath();
    e.ellipse(14, -3, 6, 5, 0.2, 0, Math.PI * 2);
    e.fill();
    e.fillStyle = "#111";
    e.beginPath();
    e.moveTo(2, -12); e.lineTo(6, -22); e.lineTo(10, -10); e.fill();
    e.beginPath();
    e.moveTo(14, -14); e.lineTo(20, -22); e.lineTo(20, -8); e.fill();
    e.fillStyle = "#e8c4b0";
    e.beginPath();
    e.moveTo(5, -13); e.lineTo(7, -18); e.lineTo(9, -12); e.fill();
    e.fillStyle = "#f4d03f";
    e.beginPath(); e.ellipse(12, -8, 2.2, 2.6, 0, 0, Math.PI * 2); e.fill();
    e.beginPath(); e.ellipse(17, -8, 2.2, 2.6, 0, 0, Math.PI * 2); e.fill();
    e.fillStyle = "#111";
    e.beginPath(); e.arc(12.3, -8, 1, 0, Math.PI * 2); e.fill();
    e.beginPath(); e.arc(17.3, -8, 1, 0, Math.PI * 2); e.fill();
    e.fillStyle = "#c45c6a";
    e.beginPath(); e.ellipse(16, -3.5, 1.6, 1.1, 0, 0, Math.PI * 2); e.fill();
    e.fillStyle = "#f5f2eb";
    e.beginPath();
    e.ellipse(18 + swat * 10, 10 - swat * 8, 6, 5, -0.4, 0, Math.PI * 2);
    e.fill();
    e.fillStyle = "#111";
    e.beginPath();
    e.ellipse(-12, 8, 4, 6, 0.3, 0, Math.PI * 2);
    e.fill();
    e.restore();
  }

  function drawMouse(e, x, y, rise) {
    e.save();
    e.translate(x, y - rise * 22);
    e.globalAlpha = 0.35 + rise * 0.65;
    e.fillStyle = "#9a9a9a";
    e.beginPath(); e.ellipse(0, 0, 13, 9, 0, 0, Math.PI * 2); e.fill();
    e.fillStyle = "#c4a0a0";
    e.beginPath(); e.arc(-8, -8, 5, 0, Math.PI * 2); e.fill();
    e.beginPath(); e.arc(4, -9, 5, 0, Math.PI * 2); e.fill();
    e.fillStyle = "#7a7a7a";
    e.beginPath(); e.arc(-8, -8, 3, 0, Math.PI * 2); e.fill();
    e.beginPath(); e.arc(4, -9, 3, 0, Math.PI * 2); e.fill();
    e.fillStyle = "#111";
    e.beginPath(); e.arc(6, -2, 1.4, 0, Math.PI * 2); e.fill();
    e.fillStyle = "#c45c6a";
    e.beginPath(); e.arc(12, 0, 2, 0, Math.PI * 2); e.fill();
    e.strokeStyle = "#c45c6a";
    e.lineWidth = 2;
    e.beginPath(); e.moveTo(-12, 2); e.quadraticCurveTo(-20, 10, -16, 16); e.stroke();
    e.restore();
  }

  function drawSnake(e, x, y, rise) {
    e.save();
    e.translate(x, y - rise * 26);
    e.globalAlpha = 0.35 + rise * 0.65;
    e.strokeStyle = "#4a7c3a";
    e.lineWidth = 8;
    e.lineCap = "round";
    e.beginPath();
    e.moveTo(-10, 14);
    e.quadraticCurveTo(-6, 0, 2, -4);
    e.quadraticCurveTo(10, -8, 8, -16);
    e.stroke();
    e.strokeStyle = "#6b9a4a";
    e.lineWidth = 4;
    e.stroke();
    e.fillStyle = "#5a8c42";
    e.beginPath(); e.ellipse(8, -18, 8, 6, -0.4, 0, Math.PI * 2); e.fill();
    e.fillStyle = "#f4d03f";
    e.beginPath(); e.arc(6, -19, 1.6, 0, Math.PI * 2); e.fill();
    e.beginPath(); e.arc(11, -20, 1.6, 0, Math.PI * 2); e.fill();
    e.fillStyle = "#111";
    e.beginPath(); e.arc(6.3, -19, 0.7, 0, Math.PI * 2); e.fill();
    e.beginPath(); e.arc(11.3, -20, 0.7, 0, Math.PI * 2); e.fill();
    e.strokeStyle = "#c45c6a";
    e.lineWidth = 1.5;
    e.beginPath();
    e.moveTo(15, -18); e.lineTo(20, -16);
    e.moveTo(20, -16); e.lineTo(22, -18);
    e.moveTo(20, -16); e.lineTo(22, -14);
    e.stroke();
    e.restore();
  }

  function drawHole(e, x, y) {
    e.fillStyle = "#3d2a14";
    e.beginPath(); e.ellipse(x, y + 8, 28, 14, 0, 0, Math.PI * 2); e.fill();
    e.fillStyle = "#1a1008";
    e.beginPath(); e.ellipse(x, y + 8, 22, 10, 0, 0, Math.PI * 2); e.fill();
    e.strokeStyle = "#c9a227";
    e.lineWidth = 1.5;
    [[-24, 6], [22, 8], [-10, 16], [12, 16]].forEach(function (p) {
      e.beginPath();
      e.moveTo(x + p[0], y + p[1]);
      e.lineTo(x + p[0] + 3, y + p[1] - 6);
      e.stroke();
    });
  }

  function resetState() {
    state = {
      holes: makeHoles(),
      score: 0, lives: 5, combo: 0,
      spawnAcc: 0, spawnEvery: 1200,
      wave: 1, waveAcc: 0, over: false,
      swat: 0, catX: W / 2, catY: H - 58,
      pop: "", popT: 0
    };
    scoreEl.textContent = "0";
    livesEl.textContent = "5";
    if (waveEl) waveEl.textContent = "1";
    if (comboEl) comboEl.textContent = "0";
  }

  function endGame() {
    running = false;
    state.over = true;
    var result = CrittersPlay.applyResult({
      key: KEY,
      score: state.score,
      prior: runBest,
      finished: true
    });
    bestEl.textContent = String(result.best);
    overlayTitle.textContent = "Barn quiet";
    overlayMsg.textContent = "Score " + state.score + " · Best " + result.best + ". The tuxedo cat stretches and naps.";
    startBtn.textContent = "Hunt again";
    overlay.classList.remove("hidden");
    if (hintEl) hintEl.style.visibility = "hidden";
  }

  function swat(x, y) {
    if (!state || state.over || !running) return;
    state.swat = 1;
    state.catX = Math.max(40, Math.min(W - 40, x));
    var hit = false;
    for (var i = 0; i < state.holes.length; i++) {
      var o = state.holes[i];
      if (!o.pest || o.rise < 0.35) continue;
      if (Math.hypot(x - o.x, y - (o.y - o.rise * 20)) < 34) {
        var pts = (o.pest === "snake" ? 150 : 50) + state.combo * 10 + state.wave * 5;
        state.score += pts;
        state.combo += 1;
        state.pop = o.pest === "snake" ? ("+" + pts + " SNAKE") : ("+" + pts);
        state.popT = 0.7;
        o.hit = 1;
        o.pest = null;
        o.rise = 0;
        o.rising = false;
        hit = true;
        scoreEl.textContent = String(state.score);
        if (comboEl) comboEl.textContent = String(state.combo);
        CrittersPlay.setBest(KEY, state.score);
        bestEl.textContent = String(CrittersPlay.getBest(KEY));
        break;
      }
    }
    if (!hit) {
      state.combo = 0;
      if (comboEl) comboEl.textContent = "0";
    }
  }

  function update(dt) {
    var s = state;
    if (!running || !s || s.over) return;
    if (s.swat > 0) s.swat = Math.max(0, s.swat - dt * 4);
    if (s.popT > 0) s.popT -= dt;

    s.spawnAcc += dt * 1000;
    if (s.spawnAcc >= s.spawnEvery) {
      s.spawnAcc = 0;
      var free = s.holes.filter(function (h) { return !h.pest; });
      if (free.length) {
        var t = free[Math.floor(Math.random() * free.length)];
        t.pest = Math.random() < 0.22 ? "snake" : "mouse";
        t.rise = 0;
        t.rising = true;
        t.life = Math.max(0.75, 1.55 - s.wave * 0.05);
      }
    }
    s.waveAcc += dt;
    if (s.waveAcc > 22) {
      s.waveAcc = 0;
      s.wave += 1;
      s.spawnEvery = Math.max(520, s.spawnEvery - 45);
      if (waveEl) waveEl.textContent = String(s.wave);
    }

    for (var i = 0; i < s.holes.length; i++) {
      var t = s.holes[i];
      if (t.hit > 0) t.hit = Math.max(0, t.hit - dt * 4);
      if (!t.pest) continue;
      if (t.rising) {
        t.rise = Math.min(1, t.rise + dt * 3.2);
        if (t.rise >= 1) { t.rising = false; t.life -= dt; }
      } else {
        t.life -= dt;
        if (t.life <= 0) {
          t.rise = Math.max(0, t.rise - dt * 4);
          if (t.rise <= 0) {
            s.lives -= 1;
            s.combo = 0;
            livesEl.textContent = String(s.lives);
            if (comboEl) comboEl.textContent = "0";
            t.pest = null;
            if (s.lives <= 0) {
              CrittersPlay.setBest(KEY, s.score);
              endGame();
              return;
            }
          }
        }
      }
    }
  }

  function draw() {
    var s = state;
    if (!s) return;
    var e = ctx;
    drawBarnBg(e);
    for (var i = 0; i < s.holes.length; i++) drawHole(e, s.holes[i].x, s.holes[i].y);
    for (var j = 0; j < s.holes.length; j++) {
      var t = s.holes[j];
      if (!t.pest || t.rise <= 0) continue;
      if (t.pest === "snake") drawSnake(e, t.x, t.y, t.rise);
      else drawMouse(e, t.x, t.y, t.rise);
      if (t.hit > 0) {
        e.fillStyle = "rgba(201,162,39," + t.hit + ")";
        e.beginPath();
        e.arc(t.x, t.y - 10, 22 * t.hit, 0, Math.PI * 2);
        e.fill();
      }
    }
    drawCat(e, s.catX, s.catY, s.swat);
    if (s.popT > 0) {
      e.globalAlpha = Math.min(1, s.popT * 2);
      e.fillStyle = "#fde68a";
      e.font = "bold 16px sans-serif";
      e.textAlign = "center";
      e.fillText(s.pop, W / 2, 92);
      e.globalAlpha = 1;
    }
    e.fillStyle = "rgba(15,10,6,0.55)";
    e.fillRect(0, 0, W, 28);
    e.fillStyle = "#e8d48b";
    e.font = "bold 12px sans-serif";
    e.textAlign = "left";
    e.textBaseline = "alphabetic";
    e.fillText("Score " + s.score, 10, 18);
    e.textAlign = "center";
    e.fillText("Wave " + s.wave, W / 2, 18);
    e.textAlign = "right";
    e.fillText("❤ " + s.lives, W - 10, 18);
  }

  function loop(ts) {
    if (!last) last = ts;
    var dt = Math.min(0.05, (ts - last) / 1000);
    last = ts;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  function toCanvas(e) {
    var rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (W / rect.width),
      y: (e.clientY - rect.top) * (H / rect.height)
    };
  }

  function start() {
    runBest = CrittersPlay.getBest(KEY);
    if (CrittersPlay.clearWin) CrittersPlay.clearWin();
    resetState();
    overlay.classList.add("hidden");
    running = true;
    last = 0;
    if (hintEl) hintEl.style.visibility = "visible";
  }

  startBtn.addEventListener("click", start);
  window.addEventListener("keydown", function (e) {
    if ((e.key === "Enter" || e.key === " ") && !running) {
      e.preventDefault();
      start();
    }
  });
  canvas.addEventListener("pointerdown", function (e) {
    if (!running) return;
    canvas.setPointerCapture(e.pointerId);
    var p = toCanvas(e);
    swat(p.x, p.y);
  });

  resetState();
  draw();
  requestAnimationFrame(loop);
})();
