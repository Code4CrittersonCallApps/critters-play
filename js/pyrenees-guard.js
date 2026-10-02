/* Pyrenees Guard — Sophie/Gus/Betty defend the red barn (Build-matched) */
(function () {
  var KEY = "coc-play-pyrenees-guard-best";
  var UNLOCK_KEY = "coc-play-pyrenees-unlocked";
  var SELECT_KEY = "coc-play-pyrenees-selected";
  var W = 340, H = 440;

  var PREDS = {
    fox: { emoji: "🦊", label: "Fox", speed: 42, hp: 1, pts: 100 },
    raccoon: { emoji: "🦝", label: "Raccoon", speed: 34, hp: 1, pts: 80 },
    hawk: { emoji: "🦅", label: "Hawk", speed: 58, hp: 1, pts: 140 },
    coyote: { emoji: "🐺", label: "Coyote", speed: 48, hp: 2, pts: 200 }
  };
  var PRED_KEYS = ["fox", "raccoon", "hawk", "coyote"];
  var HERD = [
    { emoji: "🐐", label: "Kneepads", ox: -32, oy: -12 },
    { emoji: "🐐", label: "Sassy", ox: 0, oy: -16 },
    { emoji: "🐐", label: "mRNA", ox: 32, oy: -10 },
    { emoji: "🐰", label: "Jelly", ox: -28, oy: 14 },
    { emoji: "🐓", label: "Spicy", ox: 4, oy: 18 },
    { emoji: "🦆", label: "Elon", ox: 32, oy: 12 },
    { emoji: "🐑", label: "Lamb", ox: -8, oy: 4 },
    { emoji: "🐔", label: "Hen", ox: 18, oy: 0 }
  ];
  var GUARDS = [
    { id: "sophie", name: "Sophie", role: "Lead guardian", img: "assets/sophie.png", unlockAt: 0, speed: 160, bark: 84, blurb: "The real farmer's dog. Balanced watch." },
    { id: "gus", name: "Gus", role: "Night scout", img: "assets/gus.png", unlockAt: 250, speed: 190, bark: 76, blurb: "Black-and-tan pyr mix. Faster on his feet." },
    { id: "betty", name: "Betty", role: "Barn queen", img: "assets/betty.png", unlockAt: 500, speed: 145, bark: 100, blurb: "Classic cream Pyrenees. Bigger bark, wider reach." }
  ];

  var canvas = document.getElementById("canvas");
  var ctx = canvas.getContext("2d");
  var scoreEl = document.getElementById("score");
  var livesEl = document.getElementById("lives");
  var bestEl = document.getElementById("best");
  var waveEl = document.getElementById("wave");
  var msgEl = document.getElementById("msg");
  var overlay = document.getElementById("overlay");
  var overlayTitle = document.getElementById("overlay-title");
  var overlayMsg = document.getElementById("overlay-msg");
  var startBtn = document.getElementById("start-btn");
  var pickerEl = document.getElementById("picker");
  var blurbEl = document.getElementById("blurb");
  var controlsEl = document.getElementById("controls");
  var hintEl = document.getElementById("hint");

  canvas.width = W;
  canvas.height = H;

  var dogImg = null;
  var running = false;
  var state = null;
  var last = 0;
  var selectedId = "sophie";
  var unlocked = ["sophie"];

  try {
    var u = JSON.parse(localStorage.getItem(UNLOCK_KEY) || "[]");
    if (Array.isArray(u) && u.length) unlocked = u;
    if (unlocked.indexOf("sophie") < 0) unlocked.push("sophie");
  } catch (e) {}
  try {
    var sel = localStorage.getItem(SELECT_KEY);
    if (sel && GUARDS.some(function (g) { return g.id === sel; })) selectedId = sel;
  } catch (e) {}

  bestEl.textContent = CrittersPlay.getBest(KEY);

  function currentGuard() {
    return GUARDS.find(function (g) { return g.id === selectedId; }) || GUARDS[0];
  }

  function isUnlocked(g) {
    var best = CrittersPlay.getBest(KEY);
    return g.unlockAt === 0 || unlocked.indexOf(g.id) >= 0 || best >= g.unlockAt;
  }

  var earnModal = document.getElementById("earn-modal");
  var earnTitle = document.getElementById("earn-title");
  var earnBody = document.getElementById("earn-body");
  var earnSms = document.getElementById("earn-sms");
  var earnWheel = document.getElementById("earn-wheel");
  var earnKeep = document.getElementById("earn-keep");
  var claimChip = document.getElementById("claim-chip");
  var earnAptitude = document.getElementById("earn-aptitude");
  var earnPrize = document.getElementById("earn-prize");
  var earnServices = document.getElementById("earn-services");
  var capNote = document.getElementById("cap-note");
  var toastTimer = null;
  var pausedForEarn = false;
  var pendingEarnDog = null;
  var sophieAwardShown = false;

  function flashUnlockToast(name, title) {
    var msg = name + " unlocked!";
    if (title) msg += " · " + title;
    msg += " Text HIGH SCORE to claim.";
    setMsg(msg);
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      if (running && state && !state.over) setMsg(currentGuard().name + " is on watch");
    }, 3200);
  }

  function updateCapNote() {
    if (!capNote || !window.CrittersPlay || !CrittersPlay.playsRemainingToday) return;
    var g = currentGuard();
    var left = CrittersPlay.playsRemainingToday(g.id);
    capNote.textContent = g.name + ": " + left + " play" + (left === 1 ? "" : "s") + " left today (max " + CrittersPlay.PLAYS_PER_CHAR_PER_DAY + "/day)";
  }

  function showWinModal(opts) {
    if (!earnModal || !window.CrittersPlay) return;
    opts = opts || {};
    var dog = String(opts.dogId || "").toLowerCase();
    var apt = CrittersPlay.getAptitude ? CrittersPlay.getAptitude(dog) : null;
    if (apt && CrittersPlay.grantAptitudeAward) CrittersPlay.grantAptitudeAward(dog);
    var name = CrittersPlay.earnDisplayName ? CrittersPlay.earnDisplayName(dog) : dog;
    var title = apt ? apt.title : "";
    var prize = apt && apt.prize ? apt.prize : "";
    var tip = apt && apt.tip ? apt.tip : "Entertaining farm games — learn a little. Parents: see Services.";
    var score = typeof opts.score === "number" ? opts.score : (state ? state.score : 0);
    pendingEarnDog = dog;

    if (earnAptitude) {
      if (title) {
        earnAptitude.hidden = false;
        earnAptitude.textContent = "🏅 " + title;
      } else {
        earnAptitude.hidden = true;
        earnAptitude.textContent = "";
      }
    }
    if (earnTitle) {
      earnTitle.textContent = title ? ("Awarded: " + title) : "Nice run!";
    }
    if (earnPrize) {
      if (prize) {
        earnPrize.hidden = false;
        earnPrize.textContent = "🎁 " + prize;
      } else {
        earnPrize.hidden = true;
        earnPrize.textContent = "";
      }
    }
    if (earnBody) {
      var body = name + (title ? (" — " + title + ".") : ".");
      if (opts.unlocked) body += " Character unlocked.";
      body += " " + tip;
      if (opts.spinReady) body += " Optional: free Stead Spin (1 claim/day, honor-system).";
      else if (opts.spinDeferred) body += " Spin claim used today — try again tomorrow.";
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
      earnSms.textContent = "Text HIGH SCORE to 914-263-1311";
      earnSms.href = CrittersPlay.gameSmsHref
        ? CrittersPlay.gameSmsHref(score, dog)
        : CrittersPlay.smsHref(CrittersPlay.GAME_SMS_KEYWORD || "HIGH SCORE");
    }
    if (earnWheel) {
      if (opts.spinReady && (dog === "gus" || dog === "betty")) {
        earnWheel.hidden = false;
        earnWheel.textContent = "🎡 Claim free Stead Spin";
        earnWheel.href = CrittersPlay.wheelEarnUrl(dog);
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

  function showEarnModal(dogId) {
    var dog = String(dogId || "").toLowerCase();
    if (dog !== "gus" && dog !== "betty" && dog !== "sophie") return;
    var spinReady = false;
    var spinDeferred = false;
    if ((dog === "gus" || dog === "betty") && window.CrittersPlay) {
      var unclaimed = CrittersPlay.hasUnclaimedEarn && CrittersPlay.hasUnclaimedEarn(dog);
      var canDay = !CrittersPlay.canClaimSpinToday || CrittersPlay.canClaimSpinToday();
      spinReady = !!(unclaimed && canDay);
      spinDeferred = !!(unclaimed && !canDay);
    }
    showWinModal({
      dogId: dog,
      unlocked: dog === "gus" || dog === "betty",
      spinReady: spinReady,
      spinDeferred: spinDeferred,
      score: state ? state.score : 0
    });
  }

  function hideEarnModal() {
    if (!earnModal) return;
    earnModal.classList.add("hidden");
    earnModal.setAttribute("aria-hidden", "true");
    var resume = pausedForEarn && state && !state.over;
    pausedForEarn = false;
    pendingEarnDog = null;
    if (resume) {
      running = true;
      last = 0;
      setMsg(currentGuard().name + " is back on watch");
    }
    updateClaimChip();
    updateCapNote();
  }

  function updateClaimChip() {
    if (!claimChip || !window.CrittersPlay) return;
    var unclaimed = CrittersPlay.getClaimableEarnsToday
      ? CrittersPlay.getClaimableEarnsToday()
      : (CrittersPlay.getUnclaimedEarns ? CrittersPlay.getUnclaimedEarns() : []);
    unclaimed = unclaimed.filter(function (e) { return e && (e.dog === "gus" || e.dog === "betty"); });
    if (!unclaimed.length) {
      claimChip.classList.add("hidden");
      claimChip.innerHTML = "";
      return;
    }
    claimChip.classList.remove("hidden");
    claimChip.innerHTML = "";
    unclaimed.forEach(function (rec) {
      var dog = rec.dog;
      var name = dog === "gus" ? "Gus" : "Betty";
      var a = document.createElement("a");
      a.className = "claim-chip-link";
      a.href = CrittersPlay.wheelEarnUrl(dog);
      a.textContent = "Stead Spin ready · " + name;
      claimChip.appendChild(a);
    });
  }

  function unlockIfNeeded(score) {
    var newly = [];
    GUARDS.forEach(function (g) {
      if (score >= g.unlockAt && unlocked.indexOf(g.id) < 0) {
        unlocked.push(g.id);
        newly.push(g.id);
        try { localStorage.setItem(UNLOCK_KEY, JSON.stringify(unlocked)); } catch (e) {}
      }
    });
    newly.forEach(function (id) {
      if (id === "gus" || id === "betty") {
        if (window.CrittersPlay && CrittersPlay.grantWheelSpin) {
          CrittersPlay.grantWheelSpin(id);
        }
        if (window.CrittersPlay && CrittersPlay.grantAptitudeAward) {
          CrittersPlay.grantAptitudeAward(id);
        }
        var apt = window.CrittersPlay && CrittersPlay.getAptitude ? CrittersPlay.getAptitude(id) : null;
        var name = id === "gus" ? "Gus" : "Betty";
        flashUnlockToast(name, apt ? apt.title : "");
        showEarnModal(id);
      }
    });
    renderPicker();
    updateClaimChip();
  }

  function loadDog() {
    var g = currentGuard();
    var img = new Image();
    img.onload = function () { dogImg = img; };
    img.onerror = function () {
      var fb = new Image();
      fb.onload = function () { dogImg = fb; };
      fb.src = "assets/pyrenees-logo.png";
    };
    img.src = g.img;
  }

  function renderPicker() {
    if (!pickerEl) return;
    pickerEl.innerHTML = "";
    GUARDS.forEach(function (g) {
      var open = isUnlocked(g);
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "guard-card" + (selectedId === g.id ? " selected" : "") + (open ? "" : " locked");
      btn.disabled = !open;
      btn.innerHTML =
        '<div class="guard-thumb-wrap">' +
        '<img src="' + g.img + '" alt="' + g.name + '" class="guard-thumb' + (open ? "" : " gray") + '" width="56" height="56" />' +
        (open ? "" : '<span class="guard-lock">🔒</span>') +
        "</div>" +
        '<p class="guard-name">' + g.name + "</p>" +
        '<p class="guard-role">' + (open ? g.role : g.unlockAt + " pts") + "</p>" +
        (open && window.CrittersPlay && CrittersPlay.hasAptitudeAward && CrittersPlay.hasAptitudeAward(g.id)
          ? '<p class="guard-aptitude">🏅 ' + (CrittersPlay.getAptitude(g.id).title) + "</p>" : "") +
        (open && window.CrittersPlay && CrittersPlay.hasUnclaimedEarn && CrittersPlay.hasUnclaimedEarn(g.id)
          && (!CrittersPlay.canClaimSpinToday || CrittersPlay.canClaimSpinToday())
          ? '<p class="guard-earn-chip">Spin ready</p>' : "");
      btn.addEventListener("click", function () {
        if (!open) return;
        selectedId = g.id;
        try { localStorage.setItem(SELECT_KEY, selectedId); } catch (e) {}
        loadDog();
        renderPicker();
        if (blurbEl) blurbEl.textContent = "Playing as " + g.name + " — " + g.blurb;
        startBtn.textContent = running ? startBtn.textContent : "Start watch — " + g.name;
        updateCapNote();
      });
      pickerEl.appendChild(btn);
    });
    var g = currentGuard();
    if (blurbEl) blurbEl.textContent = "Playing as " + g.name + " — " + g.blurb;
    if (!running) startBtn.textContent = "Start watch — " + g.name;
  }

  function drawOak(e, t, n) {
    e.save();
    e.fillStyle = "#4a3420";
    e.beginPath();
    e.moveTo(t - 10, n + 20);
    e.quadraticCurveTo(t - 4, n - 20, t - 6, n - 55);
    e.lineTo(t + 8, n - 55);
    e.quadraticCurveTo(t + 6, n - 10, t + 12, n + 20);
    e.closePath();
    e.fill();
    e.strokeStyle = "#3d2a18";
    e.lineWidth = 6;
    e.lineCap = "round";
    e.beginPath();
    e.moveTo(t, n - 30);
    e.quadraticCurveTo(t + 35, n - 50, t + 48, n - 42);
    e.stroke();
    e.beginPath();
    e.moveTo(t - 2, n - 40);
    e.quadraticCurveTo(t - 40, n - 55, t - 55, n - 38);
    e.stroke();
    [
      { ox: 0, oy: -70, rx: 58, ry: 36, c: "#1e4a28" },
      { ox: -30, oy: -58, rx: 40, ry: 28, c: "#265c32" },
      { ox: 32, oy: -60, rx: 42, ry: 30, c: "#2a6638" },
      { ox: -10, oy: -82, rx: 36, ry: 24, c: "#347a42" },
      { ox: 18, oy: -78, rx: 34, ry: 22, c: "#2f7040" },
      { ox: 0, oy: -55, rx: 50, ry: 26, c: "#1a3f24" }
    ].forEach(function (r) {
      e.beginPath();
      e.ellipse(t + r.ox, n + r.oy, r.rx, r.ry, 0, 0, Math.PI * 2);
      e.fillStyle = r.c;
      e.fill();
    });
    e.restore();
  }

  function drawBarn(e, t, n, r, i) {
    e.save();
    var a = t - r / 2, o = n - i / 2;
    e.fillStyle = "rgba(0,0,0,0.25)";
    e.beginPath();
    e.ellipse(t + 8, n + i / 2 + 4, r * 0.55, 10, 0, 0, Math.PI * 2);
    e.fill();
    e.fillStyle = "#b91c1c";
    e.fillRect(a, o + i * 0.28, r, i * 0.72);
    e.fillStyle = "#f5f0e6";
    e.fillRect(a, o + i * 0.28, 5, i * 0.72);
    e.fillRect(a + r - 5, o + i * 0.28, 5, i * 0.72);
    e.fillStyle = "#a01818";
    e.beginPath();
    e.moveTo(a - 6, o + i * 0.32);
    e.lineTo(t, o);
    e.lineTo(a + r + 6, o + i * 0.32);
    e.closePath();
    e.fill();
    e.strokeStyle = "#3d2a18";
    e.lineWidth = 5;
    e.beginPath();
    e.moveTo(a - 10, o + i * 0.32);
    e.lineTo(t, o - 4);
    e.lineTo(a + r + 10, o + i * 0.32);
    e.stroke();
    e.fillStyle = "#2a1810";
    e.fillRect(t - 10, o + i * 0.34, 20, 22);
    e.strokeStyle = "#f5f0e6";
    e.lineWidth = 2;
    e.strokeRect(t - 10, o + i * 0.34, 20, 22);
    var s = r * 0.42, c = i * 0.42, l = o + i - c - 4;
    e.fillStyle = "#7f1d1d";
    e.fillRect(t - s / 2, l, s, c);
    e.strokeStyle = "#f5f0e6";
    e.lineWidth = 2.5;
    e.strokeRect(t - s / 2, l, s, c);
    e.beginPath();
    e.moveTo(t, l);
    e.lineTo(t, l + c);
    e.stroke();
    e.fillStyle = "#fde68a";
    e.fillRect(a + 12, o + i * 0.42, 16, 14);
    e.fillRect(a + r - 28, o + i * 0.42, 16, 14);
    e.strokeStyle = "#c9a227";
    e.lineWidth = 2;
    e.beginPath();
    e.moveTo(t, o - 4);
    e.lineTo(t, o - 18);
    e.stroke();
    e.fillStyle = "#c9a227";
    e.beginPath();
    e.moveTo(t, o - 18);
    e.lineTo(t + 12, o - 14);
    e.lineTo(t, o - 10);
    e.closePath();
    e.fill();
    e.restore();
  }

  function setMsg(m) {
    if (msgEl) msgEl.textContent = m || "";
  }

  function spawnPred() {
    var kind = PRED_KEYS[Math.floor(Math.random() * PRED_KEYS.length)];
    var n = PREDS[kind];
    var r, i;
    if (kind === "hawk") {
      r = 40 + Math.random() * (W - 80);
      i = -20;
    } else if (Math.random() < 0.5) {
      r = -20;
      i = 50 + H * 0.4 * Math.random();
    } else {
      r = 360;
      i = 50 + H * 0.4 * Math.random();
    }
    state.preds.push({
      id: state.idSeq++,
      kind: kind,
      x: r, y: i,
      speed: n.speed * (1 + (state.wave - 1) * 0.08),
      hp: n.hp,
      scared: false,
      scareT: 0
    });
  }

  function bark() {
    if (!state || state.over || !running) return;
    var g = currentGuard();
    state.barkPulse = 0.4;
    var n = g.bark, hit = 0;
    for (var i = 0; i < state.preds.length; i++) {
      var p = state.preds[i];
      if (p.scared) continue;
      if (Math.hypot(p.x - state.dogX, p.y - state.dogY) < n) {
        p.hp -= 1;
        if (p.hp <= 0) {
          p.scared = true;
          p.scareT = 0.9;
          state.score += PREDS[p.kind].pts + state.wave * 10;
          hit++;
        }
      }
    }
    if (hit) {
      scoreEl.textContent = String(state.score);
      CrittersPlay.setBest(KEY, state.score);
      bestEl.textContent = String(CrittersPlay.getBest(KEY));
      unlockIfNeeded(state.score);
      setMsg(hit > 1 ? "Pack scattered!" : "Chased off!");
    } else {
      setMsg("Woof! (get closer)");
    }
  }

  function resetState() {
    var g = currentGuard();
    state = {
      dogX: W / 2, dogY: H * 0.55, face: 1,
      preds: [], score: 0, wave: 1, lives: 5,
      spawnAcc: 0, spawnEvery: 2800, waveAcc: 0,
      over: false, barkPulse: 0, keys: {}, pointer: null, idSeq: 1
    };
    scoreEl.textContent = "0";
    livesEl.textContent = "5";
    if (waveEl) waveEl.textContent = "1";
    setMsg(g.name + " is on watch — protect the herd!");
  }

  function endGame() {
    running = false;
    state.over = true;
    state.pointer = null;
    var best = CrittersPlay.setBest(KEY, state.score);
    bestEl.textContent = String(best);
    unlockIfNeeded(state.score);
    var g = currentGuard();
    var apt = window.CrittersPlay && CrittersPlay.getAptitude ? CrittersPlay.getAptitude(g.id) : null;
    if (g.id === "sophie" && window.CrittersPlay && CrittersPlay.grantAptitudeAward) {
      CrittersPlay.grantAptitudeAward("sophie");
    }
    overlayTitle.textContent = "Shift over";
    var awardLine = apt ? (" · 🏅 " + apt.title) : "";
    overlayMsg.textContent = "Score " + state.score + " · Best " + best + awardLine + ". See our services · or text HIGH SCORE — or try again.";
    startBtn.textContent = "Guard again as " + g.name;
    overlay.classList.remove("hidden");
    if (pickerEl) pickerEl.style.display = "";
    if (blurbEl) blurbEl.style.display = "";
    if (controlsEl) controlsEl.style.display = "none";
    if (hintEl) hintEl.style.visibility = "hidden";
    renderPicker();
    updateCapNote();
    /* Sophie win path: aptitude + HIGH SCORE (no spin token) — once per session */
    if (g.id === "sophie" && !sophieAwardShown && state.score > 0) {
      sophieAwardShown = true;
      setTimeout(function () { showEarnModal("sophie"); }, 350);
    }
  }

  function toCanvas(e) {
    var rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (W / rect.width),
      y: (e.clientY - rect.top) * (H / rect.height)
    };
  }

  function update(dt) {
    var o = state;
    if (!running || !o || o.over) return;
    var g = currentGuard();
    var n = 0, r = 0;
    var keys = o.keys;
    if (keys.arrowleft || keys.a) n -= 1;
    if (keys.arrowright || keys.d) n += 1;
    if (keys.arrowup || keys.w) r -= 1;
    if (keys.arrowdown || keys.s) r += 1;
    if (o.pointer) {
      var dx = o.pointer.x - o.dogX, dy = o.pointer.y - o.dogY;
      var d = Math.hypot(dx, dy);
      if (d > 8) { n = dx / d; r = dy / d; }
    }
    if (n || r) {
      var len = Math.hypot(n, r) || 1;
      o.dogX = Math.max(32, Math.min(W - 32, o.dogX + (n / len) * g.speed * dt));
      o.dogY = Math.max(52, Math.min(H - 110, o.dogY + (r / len) * g.speed * dt));
      if (n > 0.1) o.face = 1;
      if (n < -0.1) o.face = -1;
    }

    var barnX = W * 0.58, barnY = H - 95;
    o.spawnAcc += dt * 1000;
    if (o.spawnAcc >= o.spawnEvery) {
      o.spawnAcc = 0;
      spawnPred();
    }
    o.waveAcc += dt;
    if (o.waveAcc > 24) {
      o.waveAcc = 0;
      o.wave += 1;
      o.spawnEvery = Math.max(1200, o.spawnEvery - 120);
      if (waveEl) waveEl.textContent = String(o.wave);
      setMsg("Wave " + o.wave);
    }
    if (o.barkPulse > 0) o.barkPulse -= dt;

    for (var i = 0; i < o.preds.length; i++) {
      var t = o.preds[i];
      if (t.scared) {
        t.scareT -= dt;
        var ang = Math.atan2(t.y - o.dogY, t.x - o.dogX);
        t.x += Math.cos(ang) * 140 * dt;
        t.y += Math.sin(ang) * 140 * dt;
        continue;
      }
      var nx = barnX - t.x, ny = barnY - t.y;
      var dist = Math.hypot(nx, ny) || 1;
      t.x += (nx / dist) * t.speed * dt;
      t.y += (ny / dist) * t.speed * dt;
      if (Math.hypot(t.x - o.dogX, t.y - o.dogY) < 42) {
        t.hp -= dt * 1.6;
        if (t.hp <= 0) {
          t.scared = true;
          t.scareT = 0.8;
          o.score += PREDS[t.kind].pts;
          scoreEl.textContent = String(o.score);
          CrittersPlay.setBest(KEY, o.score);
          bestEl.textContent = String(CrittersPlay.getBest(KEY));
          unlockIfNeeded(o.score);
        }
      }
      if (dist < 55) {
        o.lives -= 1;
        livesEl.textContent = String(o.lives);
        t.scared = true;
        t.scareT = 0.5;
        setMsg(PREDS[t.kind].label + " reached the barn!");
        if (o.lives <= 0) {
          CrittersPlay.setBest(KEY, o.score);
          endGame();
          return;
        }
      }
    }
    o.preds = o.preds.filter(function (e) {
      return !(e.scared && e.scareT <= 0) && e.x > -60 && e.x < 400 && e.y > -60 && e.y < 500;
    });
  }

  function draw() {
    var o = state;
    if (!o) return;
    var e = ctx;
    var n = e.createLinearGradient(0, 0, 0, H);
    n.addColorStop(0, "#1a2740");
    n.addColorStop(0.35, "#2a3d28");
    n.addColorStop(0.7, "#2f4a30");
    n.addColorStop(1, "#1a2e1a");
    e.fillStyle = n;
    e.fillRect(0, 0, W, H);
    e.fillStyle = "rgba(255,255,255,0.14)";
    for (var i = 0; i < 20; i++) e.fillRect((i * 47) % W, (i * 29) % 90, 2, 2);
    e.fillStyle = "#243d24";
    e.fillRect(0, H * 0.55, W, H * 0.45);
    e.fillStyle = "rgba(74,124,89,0.2)";
    for (var j = 0; j < 40; j++) {
      e.fillRect((j * 37) % W, H * 0.58 + ((j * 17) % (H * 0.35)), 3, 6);
    }
    drawOak(e, 72, H - 95);
    var bx = W * 0.58, by = H - 95;
    drawBarn(e, bx, by, 128, 100);
    e.font = "bold 9px sans-serif";
    e.fillStyle = "#fde68a";
    e.textAlign = "center";
    e.textBaseline = "bottom";
    e.fillText("★ BARN SAFE ZONE ★", bx, by - 50 - 8);
    e.textBaseline = "middle";
    for (var h = 0; h < HERD.length; h++) {
      var an = HERD[h];
      e.font = "18px serif";
      e.fillText(an.emoji, bx + an.ox * 0.85, by + an.oy * 0.7 + 28);
      e.font = "bold 7px sans-serif";
      e.fillStyle = "#fde68a";
      e.fillText(an.label, bx + an.ox * 0.85, by + an.oy * 0.7 + 40);
    }

    var g = currentGuard();
    if (o.barkPulse > 0) {
      e.beginPath();
      e.arc(o.dogX, o.dogY, g.bark * (1 - o.barkPulse * 0.25), 0, Math.PI * 2);
      e.strokeStyle = "rgba(201,162,39," + o.barkPulse + ")";
      e.lineWidth = 3;
      e.stroke();
    }

    for (var p = 0; p < o.preds.length; p++) {
      var pr = o.preds[p];
      e.globalAlpha = pr.scared ? 0.4 : 1;
      e.font = "26px serif";
      e.textAlign = "center";
      e.textBaseline = "middle";
      e.fillText(PREDS[pr.kind].emoji, pr.x, pr.y);
      e.globalAlpha = 1;
    }

    e.save();
    e.translate(o.dogX, o.dogY);
    if (o.face < 0) e.scale(-1, 1);
    e.beginPath();
    e.ellipse(0, 32, 72 * 0.38, 7, 0, 0, Math.PI * 2);
    e.fillStyle = "rgba(0,0,0,0.3)";
    e.fill();
    if (dogImg && dogImg.complete) {
      e.beginPath();
      e.arc(0, 0, 36, 0, Math.PI * 2);
      e.closePath();
      e.clip();
      e.drawImage(dogImg, -36, -36, 72, 72);
    } else {
      e.beginPath();
      e.arc(0, 0, 34, 0, Math.PI * 2);
      e.fillStyle = "#f5f2eb";
      e.fill();
      e.strokeStyle = "#c9a227";
      e.lineWidth = 2;
      e.stroke();
    }
    e.restore();

    e.beginPath();
    e.arc(o.dogX, o.dogY, 38, 0, Math.PI * 2);
    e.strokeStyle = "rgba(201,162,39,0.65)";
    e.lineWidth = 2.5;
    e.stroke();
    if (o.barkPulse > 0.15) {
      e.fillStyle = "rgba(201,162,39," + o.barkPulse + ")";
      e.font = "bold 11px sans-serif";
      e.textAlign = "center";
      e.fillText("woof!", o.dogX, o.dogY - 44);
    }

    e.fillStyle = "rgba(15,14,12,0.55)";
    e.fillRect(0, 0, W, 28);
    e.fillStyle = "#e8d48b";
    e.font = "bold 12px sans-serif";
    e.textAlign = "left";
    e.textBaseline = "alphabetic";
    e.fillText("Score " + o.score, 10, 18);
    e.textAlign = "center";
    e.fillText("Wave " + o.wave, W / 2, 18);
    e.textAlign = "right";
    e.fillText("❤ " + o.lives, W - 10, 18);
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
    var g = currentGuard();
    if (window.CrittersPlay && CrittersPlay.canStartPlay && !CrittersPlay.canStartPlay(g.id)) {
      setMsg(g.name + " is resting — " + CrittersPlay.PLAYS_PER_CHAR_PER_DAY + " plays/day used. Try another dog or come back tomorrow.");
      updateCapNote();
      return;
    }
    if (window.CrittersPlay && CrittersPlay.consumePlay && !CrittersPlay.consumePlay(g.id)) {
      setMsg(g.name + " is resting — daily play cap reached.");
      updateCapNote();
      return;
    }
    resetState();
    overlay.classList.add("hidden");
    running = true;
    last = 0;
    if (pickerEl) pickerEl.style.display = "none";
    if (blurbEl) blurbEl.style.display = "none";
    if (controlsEl) controlsEl.style.display = "grid";
    if (hintEl) {
      hintEl.style.visibility = "visible";
      hintEl.textContent = "Drag " + g.name + " · WASD · Space / Bark";
    }
    updateCapNote();
  }

  startBtn.addEventListener("click", start);

  var barkBtn = document.getElementById("bark-btn");
  if (barkBtn) barkBtn.addEventListener("click", bark);
  ["nudge-l", "nudge-r", "nudge-u", "nudge-d", "nudge-c"].forEach(function (id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("click", function () {
      if (!state || !running) return;
      if (id === "nudge-l") { state.dogX = Math.max(32, state.dogX - 28); state.face = -1; }
      if (id === "nudge-r") { state.dogX = Math.min(W - 32, state.dogX + 28); state.face = 1; }
      if (id === "nudge-u") state.dogY = Math.max(52, state.dogY - 28);
      if (id === "nudge-d") state.dogY = Math.min(H - 90, state.dogY + 28);
      if (id === "nudge-c") { state.dogX = W / 2; state.dogY = H * 0.5; }
    });
  });

  window.addEventListener("keydown", function (e) {
    var t = e.key.toLowerCase();
    if (["arrowleft", "arrowright", "arrowup", "arrowdown", " ", "w", "a", "s", "d", "b"].indexOf(t) >= 0 || e.key === " ") {
      e.preventDefault();
    }
    if (state) state.keys[t === " " ? " " : t] = true;
    if (e.key === " " || t === "b") bark();
    if ((e.key === "Enter") && !running) start();
  });
  window.addEventListener("keyup", function (e) {
    var t = e.key.toLowerCase();
    if (state) state.keys[t === " " ? " " : t] = false;
  });

  canvas.addEventListener("pointerdown", function (e) {
    if (!running || !state) return;
    canvas.setPointerCapture(e.pointerId);
    state.pointer = toCanvas(e);
    var p = toCanvas(e);
    if (Math.hypot(p.x - state.dogX, p.y - state.dogY) < 58) bark();
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

  /* Quiet QA hook: ?demoUnlock=gus|betty — not linked in UI */
  try {
    var demo = new URLSearchParams(location.search).get("demoUnlock");
    if (demo) {
      demo = String(demo).toLowerCase();
      if ((demo === "gus" || demo === "betty") && unlocked.indexOf(demo) < 0) {
        unlocked.push(demo);
        try { localStorage.setItem(UNLOCK_KEY, JSON.stringify(unlocked)); } catch (e2) {}
      }
      if (demo === "gus" || demo === "betty") {
        if (window.CrittersPlay && CrittersPlay.grantWheelSpin) CrittersPlay.grantWheelSpin(demo, { fresh: true });
        setTimeout(function () { showEarnModal(demo); }, 200);
      }
    }
  } catch (eDemo) {}

  loadDog();
  renderPicker();
  updateClaimChip();
  updateCapNote();
  resetState();
  if (controlsEl) controlsEl.style.display = "none";
  draw();
  requestAnimationFrame(loop);
})();
