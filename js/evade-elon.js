/* Evade Elon — feed the crew, dodge Elon Muscovy (Build-matched) */
(function () {
  var KEY = "coc-play-evade-elon-best";
  var W = 340, H = 440;
  var CREW = [
    { id: "kneepads", emoji: "🐐", name: "Kneepads", x: 58, y: 118 },
    { id: "sassy", emoji: "🐐", name: "Sassy", x: 282, y: 128 },
    { id: "mrna", emoji: "🐐", name: "mRNA", x: 70, y: 300 },
    { id: "jelly", emoji: "🐰", name: "Jelly", x: 270, y: 290 },
    { id: "piggy", emoji: "🐷", name: "Piggy", x: 170, y: 96 },
    { id: "hen", emoji: "🐔", name: "RIR hen", x: 54, y: 210 },
    { id: "pekin", emoji: "🦆", name: "Pekin", x: 286, y: 210 },
    { id: "spicy", emoji: "🐓", name: "Spicy", x: 170, y: 348 }
  ];

  /* Light animal-fact interrupt prompts (soft pause via HUD msg). */
  var ANIMAL_FACTS = [
    "Goats have rectangular pupils — almost 320° vision.",
    "Muscovy ducks hiss more than they quack.",
    "Rabbits can see nearly all around them without turning.",
    "Chickens dream — REM sleep, just like us.",
    "Pigs can learn names and come when called.",
    "A goat’s accent? Herd mates teach local “bleats.”"
  ];
  /* FOLLOW-UP (not blocking): lake / juke fence collision polish — park for later. */

  var canvas = document.getElementById("canvas");
  var ctx = canvas.getContext("2d");
  var scoreEl = document.getElementById("score");
  var livesEl = document.getElementById("lives");
  var bestEl = document.getElementById("best");
  var waveEl = document.getElementById("wave");
  var fedEl = document.getElementById("fed");
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

  var EARN_SCORE = 300;
  var EARN_ID = "elon";
  var earnModal = document.getElementById("earn-modal");
  var earnTitle = document.getElementById("earn-title");
  var earnBody = document.getElementById("earn-body");
  var earnWheel = document.getElementById("earn-wheel");
  var earnSms = document.getElementById("earn-sms");
  var earnKeep = document.getElementById("earn-keep");
  var earnAptitude = document.getElementById("earn-aptitude");
  var earnPrize = document.getElementById("earn-prize");
  var earnServices = document.getElementById("earn-services");
  var claimChip = document.getElementById("claim-chip");
  var capNote = document.getElementById("cap-note");
  var earnShownThisRun = false;
  var pausedForEarn = false;

  function updateCapNote() {
    if (!capNote || !window.CrittersPlay || !CrittersPlay.playsRemainingToday) return;
    var left = CrittersPlay.playsRemainingToday(EARN_ID);
    capNote.textContent = "Evade Elon: " + left + " play" + (left === 1 ? "" : "s") + " left today (max " + CrittersPlay.PLAYS_PER_CHAR_PER_DAY + "/day)";
  }

  function updateClaimChip() {
    if (!claimChip || !window.CrittersPlay) return;
    var unclaimed = CrittersPlay.getClaimableEarnsToday
      ? CrittersPlay.getClaimableEarnsToday()
      : (CrittersPlay.getUnclaimedEarns ? CrittersPlay.getUnclaimedEarns() : []);
    var mine = unclaimed.filter(function (e) { return e && e.dog === EARN_ID; });
    if (!mine.length) {
      claimChip.classList.add("hidden");
      claimChip.innerHTML = "";
      return;
    }
    claimChip.classList.remove("hidden");
    claimChip.innerHTML = "";
    var a = document.createElement("a");
    a.className = "claim-chip-link";
    a.href = CrittersPlay.wheelEarnUrl(EARN_ID);
    a.textContent = "Stead Spin ready · Evade Elon";
    claimChip.appendChild(a);
  }

  function showEarnModal() {
    if (!earnModal || !window.CrittersPlay) return;
    var apt = CrittersPlay.getAptitude ? CrittersPlay.getAptitude(EARN_ID) : null;
    if (CrittersPlay.grantAptitudeAward) CrittersPlay.grantAptitudeAward(EARN_ID);
    var score = state ? state.score : EARN_SCORE;
    var unclaimed = CrittersPlay.hasUnclaimedEarn && CrittersPlay.hasUnclaimedEarn(EARN_ID);
    var canDay = !CrittersPlay.canClaimSpinToday || CrittersPlay.canClaimSpinToday();
    var spinReady = !!(unclaimed && canDay);
    var prize = apt && apt.prize ? apt.prize : "Grain Guard STEM spark";
    var tip = apt && apt.tip ? apt.tip : "Learning & STEM-on-farm flavor — explore on Services.";

    if (earnAptitude) {
      earnAptitude.hidden = false;
      earnAptitude.textContent = "🏅 " + (apt ? apt.title : "Grain Guard");
    }
    if (earnTitle) earnTitle.textContent = "Awarded: " + (apt ? apt.title : "Grain Guard");
    if (earnPrize) {
      earnPrize.hidden = false;
      earnPrize.textContent = "🎁 " + prize;
    }
    if (earnBody) {
      var body = "Hit " + EARN_SCORE + " on Evade Elon. " + tip;
      if (spinReady) body += " Optional: Stead Spin (honor-system). Text HIGH SCORE + a screenshot.";
      else if (unclaimed && !canDay) body += " Spin claim used today — try again tomorrow.";
      earnBody.textContent = body;
    }
    if (earnServices) {
      earnServices.hidden = false;
      earnServices.textContent = "See our services";
      earnServices.href = CrittersPlay.SERVICES_URL || "https://www.sheehanhomestead.com/services";
      earnServices.target = "_blank";
      earnServices.rel = "noopener";
    }
    if (earnSms) {
      earnSms.textContent = "Text HIGH SCORE + screenshot to 914-263-1311";
      earnSms.href = CrittersPlay.gameSmsHref
        ? CrittersPlay.gameSmsHref(score, EARN_ID)
        : CrittersPlay.smsHref(CrittersPlay.GAME_SMS_KEYWORD || "HIGH SCORE");
    }
    if (earnWheel) {
      if (spinReady) {
        earnWheel.hidden = false;
        earnWheel.textContent = "🎡 Claim Stead Spin";
        earnWheel.href = CrittersPlay.wheelEarnUrl(EARN_ID);
      } else {
        earnWheel.hidden = true;
      }
    }
    if (running && state && !state.over) {
      pausedForEarn = true;
      running = false;
    } else {
      pausedForEarn = false;
    }
    earnModal.classList.remove("hidden");
    earnModal.setAttribute("aria-hidden", "false");
  }

  function hideEarnModal() {
    if (!earnModal) return;
    earnModal.classList.add("hidden");
    earnModal.setAttribute("aria-hidden", "true");
    var resume = pausedForEarn && state && !state.over;
    pausedForEarn = false;
    if (resume) {
      running = true;
      last = 0;
    }
    updateClaimChip();
    updateCapNote();
  }

  function maybeGrantEarn(score) {
    if (!window.CrittersPlay || !CrittersPlay.grantWheelSpin) return;
    if (score < EARN_SCORE) return;
    if (CrittersPlay.hasUnclaimedEarn && CrittersPlay.hasUnclaimedEarn(EARN_ID)) {
      if (!earnShownThisRun) {
        earnShownThisRun = true;
        showEarnModal();
      }
      updateClaimChip();
      return;
    }
    var existing = CrittersPlay.getEarnForDog ? CrittersPlay.getEarnForDog(EARN_ID) : null;
    if (existing && existing.claimed) {
      /* already claimed this earn token — still show aptitude + HIGH SCORE once per run */
      if (!earnShownThisRun && CrittersPlay.hasAptitudeAward && !CrittersPlay.hasAptitudeAward(EARN_ID)) {
        earnShownThisRun = true;
        if (CrittersPlay.grantAptitudeAward) CrittersPlay.grantAptitudeAward(EARN_ID);
        showEarnModal();
      }
      updateClaimChip();
      return;
    }
    CrittersPlay.grantWheelSpin(EARN_ID);
    if (CrittersPlay.grantAptitudeAward) CrittersPlay.grantAptitudeAward(EARN_ID);
    if (!earnShownThisRun) {
      earnShownThisRun = true;
      showEarnModal();
    }
    updateClaimChip();
  }

  function freshCrew() {
    return CREW.map(function (c) {
      return { id: c.id, emoji: c.emoji, name: c.name, x: c.x, y: c.y, fed: false, bob: Math.random() * 6 };
    });
  }

  function resetState() {
    state = {
      px: W / 2, py: H - 70,
      elonX: W / 2, elonY: H / 2, elonA: 0,
      grain: 3, crew: freshCrew(),
      score: 0, lives: 5, steal: 0,
      pointer: null, keys: {},
      over: false, invuln: 0, wave: 1,
      msg: "Feed the crew — dodge Elon!", msgT: 1.6
    };
    scoreEl.textContent = "0";
    livesEl.textContent = "5";
    if (waveEl) waveEl.textContent = "1";
    if (fedEl) fedEl.textContent = "0/" + CREW.length;
  }

  function drawPasture(e) {
    var t = e.createLinearGradient(0, 0, 0, H);
    t.addColorStop(0, "#6ec4ea");
    t.addColorStop(0.28, "#9fd4a8");
    t.addColorStop(1, "#3d7a3a");
    e.fillStyle = t;
    e.fillRect(0, 0, W, H);
    e.fillStyle = "#3a8bb0";
    e.beginPath();
    e.ellipse(W / 2, 228, 52, 28, 0, 0, Math.PI * 2);
    e.fill();
    e.fillStyle = "rgba(255,255,255,0.25)";
    e.beginPath();
    e.ellipse(W / 2 - 10, H / 2, 18, 8, -0.3, 0, Math.PI * 2);
    e.fill();
    e.strokeStyle = "rgba(20,70,20,0.28)";
    e.lineWidth = 1.5;
    for (var i = 0; i < 40; i++) {
      var n = (i * 47) % W, r = 80 + ((i * 31) % (H - 100));
      e.beginPath();
      e.moveTo(n, r);
      e.lineTo(n + 2, r - 7);
      e.stroke();
    }
    e.fillStyle = "rgba(15,20,12,0.45)";
    e.fillRect(0, 0, W, 28);
    e.fillStyle = "#f5e6b8";
    e.font = "bold 11px sans-serif";
    e.textAlign = "center";
    e.fillText("DON'T LET ELON TAKE THE GRAIN", W / 2, 18);
  }

  /* Canvas Muscovy — dark body, white wing patch, red caruncles, yellow bill */
  function drawElon(e, x, y, a, steal) {
    e.save();
    e.translate(x, y);
    e.rotate(a);
    var s = 1 + steal * 0.15;
    e.scale(s, s);
    e.fillStyle = "#2a2a32";
    e.beginPath();
    e.ellipse(0, 4, 18, 14, 0, 0, Math.PI * 2);
    e.fill();
    e.fillStyle = "#ecece8";
    e.beginPath();
    e.ellipse(2, 2, 10, 8, 0.1, 0, Math.PI * 2);
    e.fill();
    e.fillStyle = "#1c1c22";
    e.beginPath();
    e.ellipse(-12, 6, 8, 5, -0.4, 0, Math.PI * 2);
    e.fill();
    e.beginPath();
    e.ellipse(12, 6, 8, 5, 0.4, 0, Math.PI * 2);
    e.fill();
    e.fillStyle = "#2e2e36";
    e.beginPath();
    e.arc(14, -8, 9, 0, Math.PI * 2);
    e.fill();
    e.fillStyle = "#c0392b";
    e.beginPath();
    e.ellipse(16, -12, 5, 4, 0.2, 0, Math.PI * 2);
    e.fill();
    e.beginPath();
    e.ellipse(20, -6, 4, 3, 0.4, 0, Math.PI * 2);
    e.fill();
    e.fillStyle = "#e8d48b";
    e.beginPath();
    e.moveTo(22, -8);
    e.lineTo(32, -6);
    e.lineTo(22, -3);
    e.closePath();
    e.fill();
    e.fillStyle = "#f4d03f";
    e.beginPath();
    e.arc(16, -9, 2.2, 0, Math.PI * 2);
    e.fill();
    e.fillStyle = "#111";
    e.beginPath();
    e.arc(16.5, -9, 1, 0, Math.PI * 2);
    e.fill();
    e.restore();
  }

  function drawFarmer(e, x, y, grain) {
    e.save();
    e.translate(x, y);
    e.fillStyle = "rgba(0,0,0,0.25)";
    e.beginPath();
    e.ellipse(0, 16, 12, 5, 0, 0, Math.PI * 2);
    e.fill();
    e.fillStyle = "#c9a227";
    e.fillRect(-8, 0, 16, 14);
    e.fillStyle = "#f0d0b0";
    e.beginPath();
    e.arc(0, -6, 8, 0, Math.PI * 2);
    e.fill();
    e.fillStyle = "#3d2a14";
    e.beginPath();
    e.arc(0, -9, 8, Math.PI, 0);
    e.fill();
    e.fillStyle = "#8a6a32";
    e.fillRect(8, 2, 12, 10);
    e.strokeStyle = "#c9a227";
    e.lineWidth = 2;
    e.strokeRect(8, 2, 12, 10);
    e.fillStyle = "#e8d48b";
    e.fillRect(9, 3, 10, Math.max(1, (grain / 3) * 8));
    e.restore();
  }

  function tryFeed() {
    var t = state;
    if (!t || t.over || !running) return;
    if (t.grain <= 0) {
      t.msg = "Empty bucket — grab grain at the barn!";
      t.msgT = 1.2;
      return;
    }
    for (var i = 0; i < t.crew.length; i++) {
      var n = t.crew[i];
      if (!n.fed && Math.hypot(t.px - n.x, t.py - n.y) < 36) {
        n.fed = true;
        t.grain -= 1;
        t.score += 100 + t.wave * 20;
        scoreEl.textContent = String(t.score);
        var fedCount = t.crew.filter(function (c) { return c.fed; }).length;
        if (fedEl) fedEl.textContent = fedCount + "/" + CREW.length;
        CrittersPlay.setBest(KEY, t.score);
        bestEl.textContent = String(CrittersPlay.getBest(KEY));
        maybeGrantEarn(t.score);
        if (Math.random() < 0.28) {
          t.msg = "✨ " + ANIMAL_FACTS[Math.floor(Math.random() * ANIMAL_FACTS.length)];
          t.msgT = 2.2;
        } else {
          t.msg = "Fed " + n.name + "!";
          t.msgT = 1;
        }
        if (t.crew.every(function (c) { return c.fed; })) {
          t.wave += 1;
          if (waveEl) waveEl.textContent = String(t.wave);
          t.crew = freshCrew();
          t.grain = 3;
          t.score += 250;
          scoreEl.textContent = String(t.score);
          if (fedEl) fedEl.textContent = "0/" + CREW.length;
          CrittersPlay.setBest(KEY, t.score);
          bestEl.textContent = String(CrittersPlay.getBest(KEY));
          maybeGrantEarn(t.score);
          t.msg = "Wave " + t.wave + " — Elon is hungrier!";
          t.msgT = 1.6;
        }
        return;
      }
    }
  }

  function toCanvas(e) {
    var rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (W / rect.width),
      y: (e.clientY - rect.top) * (H / rect.height)
    };
  }

  function endGame() {
    running = false;
    state.over = true;
    state.pointer = null;
    var best = CrittersPlay.setBest(KEY, state.score);
    bestEl.textContent = String(best);
    overlayTitle.textContent = "Elon ate the shift";
    overlayMsg.textContent = "Score " + state.score + " · Best " + best + ". See our services · or text HIGH SCORE + screenshot — or refill and try again.";
    startBtn.textContent = "Dodge again";
    overlay.classList.remove("hidden");
    if (hintEl) hintEl.style.visibility = "hidden";
    updateCapNote();
  }

  function update(dt) {
    var s = state;
    if (!running || !s || s.over) return;
    if (s.invuln > 0) s.invuln -= dt;
    if (s.steal > 0) s.steal = Math.max(0, s.steal - dt * 2);
    if (s.msgT > 0) s.msgT -= dt;

    var tx = 0, ty = 0;
    var k = s.keys;
    if (k.arrowleft || k.a) tx -= 1;
    if (k.arrowright || k.d) tx += 1;
    if (k.arrowup || k.w) ty -= 1;
    if (k.arrowdown || k.s) ty += 1;
    if (s.pointer) {
      var dx = s.pointer.x - s.px, dy = s.pointer.y - s.py;
      var dist = Math.hypot(dx, dy);
      if (dist > 6) { tx = dx / dist; ty = dy / dist; }
    }
    if (tx || ty) {
      var len = Math.hypot(tx, ty) || 1;
      s.px = Math.max(22, Math.min(W - 22, s.px + (tx / len) * 150 * dt));
      s.py = Math.max(50, Math.min(H - 28, s.py + (ty / len) * 150 * dt));
    }

    if (Math.hypot(s.px - W / 2, s.py - 64) < 32 && s.grain < 3) {
      s.grain = 3;
      s.msg = "Bucket refilled";
      s.msgT = 0.8;
    }

    var cx = s.px - s.elonX, cy = s.py - s.elonY;
    var fl = Math.hypot(cx, cy) || 1;
    var spd = 55 + s.wave * 12;
    s.elonX += (cx / fl) * spd * dt;
    s.elonY += (cy / fl) * spd * dt;
    s.elonA = Math.atan2(cy, cx);

    if (s.invuln <= 0 && Math.hypot(s.px - s.elonX, s.py - s.elonY) < 32) {
      s.steal = 1;
      s.invuln = 1.8;
      if (s.grain > 0) {
        s.grain -= 1;
        s.msg = "Elon stole the grain!";
        s.msgT = 1.2;
      } else {
        s.lives -= 1;
        livesEl.textContent = String(s.lives);
        s.msg = "Elon got you!";
        s.msgT = 1.2;
        if (s.lives <= 0) endGame();
      }
    }
    for (var i = 0; i < s.crew.length; i++) s.crew[i].bob += dt * 2;
  }

  function draw() {
    var s = state;
    if (!s) return;
    var e = ctx;
    drawPasture(e);
    e.fillStyle = "#6b4226";
    e.fillRect(W / 2 - 28, 48, 56, 18);
    e.fillStyle = "#e8d48b";
    e.fillRect(W / 2 - 24, 50, 48, 10);
    e.fillStyle = "#fde68a";
    e.font = "bold 9px sans-serif";
    e.textAlign = "center";
    e.fillText("GRAIN", W / 2, 46);

    for (var i = 0; i < s.crew.length; i++) {
      var t = s.crew[i];
      var n = t.y + Math.sin(t.bob) * 2;
      e.globalAlpha = t.fed ? 0.4 : 1;
      e.font = "26px serif";
      e.textAlign = "center";
      e.textBaseline = "middle";
      e.fillText(t.emoji, t.x, n);
      e.font = "bold 8px sans-serif";
      e.fillStyle = t.fed ? "#86efac" : "#fde68a";
      e.fillText(t.fed ? "fed ✓" : t.name, t.x, n + 18);
      if (!t.fed) {
        e.strokeStyle = "rgba(201,162,39,0.45)";
        e.lineWidth = 1.5;
        e.beginPath();
        e.arc(t.x, n, 22, 0, Math.PI * 2);
        e.stroke();
      }
      e.globalAlpha = 1;
    }

    drawElon(e, s.elonX, s.elonY, s.elonA, s.steal);
    if (s.invuln > 0 && Math.floor(s.invuln * 10) % 2 === 0) e.globalAlpha = 0.45;
    drawFarmer(e, s.px, s.py, s.grain);
    e.globalAlpha = 1;

    if (s.msgT > 0) {
      e.fillStyle = "rgba(253,230,138," + Math.min(1, s.msgT) + ")";
      e.font = "bold 13px sans-serif";
      e.textAlign = "center";
      e.fillText(s.msg, W / 2, H - 16);
    }
    e.fillStyle = "#e8d48b";
    e.font = "bold 11px sans-serif";
    e.textAlign = "left";
    e.textBaseline = "alphabetic";
    e.fillText("Grain " + s.grain + "/3", 8, H - 8);
    e.textAlign = "right";
    e.fillText("❤ " + s.lives, W - 8, H - 8);
  }

  function loop(ts) {
    if (!last) last = ts;
    var dt = Math.min(0.05, (ts - last) / 1000);
    last = ts;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  function start() {
    if (window.CrittersPlay && CrittersPlay.canStartPlay && !CrittersPlay.canStartPlay(EARN_ID)) {
      if (overlayMsg) overlayMsg.textContent = "Daily play cap reached for Evade Elon (" + CrittersPlay.PLAYS_PER_CHAR_PER_DAY + "/day). Come back tomorrow.";
      updateCapNote();
      return;
    }
    if (window.CrittersPlay && CrittersPlay.consumePlay && !CrittersPlay.consumePlay(EARN_ID)) {
      updateCapNote();
      return;
    }
    resetState();
    earnShownThisRun = false;
    overlay.classList.add("hidden");
    running = true;
    last = 0;
    if (hintEl) hintEl.style.visibility = "visible";
    updateCapNote();
  }

  startBtn.addEventListener("click", start);

  window.addEventListener("keydown", function (e) {
    var t = e.key.toLowerCase();
    if (["arrowleft", "arrowright", "arrowup", "arrowdown", "w", "a", "s", "d"].indexOf(t) >= 0) {
      e.preventDefault();
      if (state) state.keys[t] = true;
    }
    if ((e.key === "Enter" || e.key === " ") && !running) {
      e.preventDefault();
      start();
    }
  });
  window.addEventListener("keyup", function (e) {
    if (state) state.keys[e.key.toLowerCase()] = false;
  });

  canvas.addEventListener("pointerdown", function (e) {
    if (!running) return;
    canvas.setPointerCapture(e.pointerId);
    state.pointer = toCanvas(e);
    tryFeed();
  });
  canvas.addEventListener("pointermove", function (e) {
    if (!running || !state) return;
    if (e.buttons || e.pressure > 0) state.pointer = toCanvas(e);
  });
  canvas.addEventListener("pointerup", function () { if (state) state.pointer = null; });
  canvas.addEventListener("pointercancel", function () { if (state) state.pointer = null; });

  if (earnKeep) earnKeep.addEventListener("click", hideEarnModal);
  if (earnModal) {
    earnModal.addEventListener("click", function (e) {
      if (e.target === earnModal) hideEarnModal();
    });
  }

  resetState();
  updateClaimChip();
  updateCapNote();
  draw();
  requestAnimationFrame(loop);
})();
