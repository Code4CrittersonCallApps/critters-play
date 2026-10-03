/* Ducks to Bed — coax the train in, then toss treats outside */
(function () {
  var KEY = "coc-play-ducks-to-bed-best";
  /* Stead Spin unlock: 13 in one bedtime.
     1 point for each of 10 birds bedded, plus 1 per treat that lands.
     13 means the barn is full and Elon, Emilio, and Halle Berry each got a treat. */
  var SPIN_AT = 13;
  var FACT = "The ducks live with the chickens, and they lay eggs on the ground instead of in the nesting boxes the way the chickens do.";
  var TREAT_BUDGET = 8;

  var FLOCK = [
    { id: "run1", kind: "runner", name: "Runner duck", need: 1 },
    { id: "run2", kind: "runner", name: "Runner duck", need: 1 },
    { id: "pek1", kind: "pekin", name: "Pekin duck", need: 2 },
    { id: "run3", kind: "runner", name: "Runner duck", need: 1 },
    { id: "gan1", kind: "gander", name: "White gander", need: 2 },
    { id: "pek2", kind: "pekin", name: "Pekin duck", need: 2 },
    { id: "asia", kind: "asian", name: "Gray goose", need: 3 },
    { id: "run4", kind: "runner", name: "Runner duck", need: 1 },
    { id: "gan2", kind: "gander", name: "White gander", need: 2 },
    { id: "pek3", kind: "pekin", name: "Pekin duck", need: 2 }
  ];

  var SLEEPER_DEFS = [
    { id: "elon", name: "Elon", breed: "Muscovy duck", sprite: "muscovy", x: 0.22, dir: 1, speed: 0.16 },
    { id: "emilio", name: "Emilio", breed: "Canada goose", sprite: "canada", x: 0.52, dir: -1, speed: 0.11 },
    { id: "halle", name: "Halle Berry", breed: "Smaller female Muscovy", sprite: "muscovy small", x: 0.8, dir: 1, speed: 0.2 }
  ];

  var scoreEl = document.getElementById("score");
  var beddedEl = document.getElementById("bedded");
  var treatsEl = document.getElementById("treats");
  var bestEl = document.getElementById("best");
  var playEl = document.getElementById("play");
  var barnEl = document.getElementById("barn");
  var doorLabel = document.getElementById("door-label");
  var doorMark = document.getElementById("door-mark");
  var insideEl = document.getElementById("inside");
  var trainEl = document.getElementById("train");
  var lockBtn = document.getElementById("lock-btn");
  var yardEl = document.getElementById("yard");
  var settledBtn = document.getElementById("settled-btn");
  var overlay = document.getElementById("overlay");
  var overlayTitle = document.getElementById("overlay-title");
  var overlayMsg = document.getElementById("overlay-msg");
  var startBtn = document.getElementById("start-btn");
  var hintEl = document.getElementById("hint");
  var stageEl = document.getElementById("stage");

  var phase = "ready";
  var flock = [];
  var sleepers = [];
  var score = 0;
  var bedded = 0;
  var treatsLanded = 0;
  var treatsLeft = TREAT_BUDGET;
  var throwing = false;
  var raf = 0;
  var runBest = 0;

  bestEl.textContent = String(CrittersPlay.getBest(KEY));
  if (CrittersPlay.noteSpin) CrittersPlay.noteSpin("fowl-to-bed", CrittersPlay.getBest(KEY), SPIN_AT);

  function pinFact() {
    var el = document.getElementById("learn-prompt");
    if (el) el.textContent = FACT;
  }
  pinFact();

  function spriteHTML(kind) {
    return '<span class="dtb-sprite ' + kind + '" aria-hidden="true">' +
      '<span class="neck"></span><span class="body"></span><span class="head"></span>' +
      '<span class="chin"></span><span class="knob"></span><span class="bill"></span></span>';
  }

  function hud() {
    scoreEl.textContent = String(score);
    beddedEl.textContent = bedded + "/" + FLOCK.length;
    if (phase === "treats") treatsEl.textContent = String(treatsLanded);
    else treatsEl.textContent = "0";
  }

  function renderTrain() {
    trainEl.innerHTML = "";
    var waiting = flock.filter(function (b) { return !b.bedded; });
    waiting.forEach(function (b, i) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "dtb-bird" + (i === 0 ? " front" : "");
      var left = b.need - b.got;
      btn.innerHTML = spriteHTML(b.kind) +
        '<span><span class="dtb-bird-name">' + b.name + '</span>' +
        '<span class="dtb-bird-meta">' + (i === 0 ? "At the door · " : "In the train · ") +
        (left === 1 ? "one coax" : left + " coaxes") + "</span></span>";
      btn.addEventListener("click", function () { coax(b.id, btn); });
      trainEl.appendChild(btn);
    });
    insideEl.innerHTML = "";
    flock.forEach(function (b) {
      if (!b.bedded) return;
      var chip = document.createElement("span");
      chip.className = "dtb-token";
      chip.textContent = b.name;
      insideEl.appendChild(chip);
    });
    var allIn = waiting.length === 0;
    lockBtn.hidden = !(phase === "coax" && allIn);
    trainEl.hidden = phase !== "coax";
  }

  function coax(id, btn) {
    if (phase !== "coax") return;
    var b = null;
    for (var i = 0; i < flock.length; i++) if (flock[i].id === id) b = flock[i];
    if (!b || b.bedded) return;
    b.got += 1;
    if (btn) {
      btn.classList.add("hop");
      setTimeout(function () { btn.classList.remove("hop"); }, 140);
    }
    if (b.got >= b.need) {
      b.bedded = true;
      bedded += 1;
      score += 1;
      CrittersPlay.setBest(KEY, score);
      bestEl.textContent = String(CrittersPlay.getBest(KEY));
    }
    hud();
    renderTrain();
    if (hintEl) {
      hintEl.textContent = bedded === FLOCK.length
        ? "Everyone who belongs inside is in. Lock the barn."
        : "Tap a bird to coax it toward the barn";
    }
  }

  function renderSleepers() {
    yardEl.innerHTML = "";
    sleepers.forEach(function (s) {
      var el = document.createElement("div");
      el.className = "dtb-sleeper";
      el.innerHTML = spriteHTML(s.sprite) +
        '<div class="dtb-sleeper-name">' + s.name + "</div>" +
        '<div class="dtb-sleeper-breed">' + s.breed + "</div>" +
        '<div class="dtb-kernels"></div>';
      s.el = el;
      s.kernelEl = el.querySelector(".dtb-kernels");
      yardEl.appendChild(el);
      placeSleeper(s);
    });
  }

  function placeSleeper(s) {
    if (!s.el) return;
    s.el.style.left = (s.x * 100) + "%";
    s.kernelEl.textContent = s.treats > 0 ? ("🌽".repeat(Math.min(s.treats, 4))) : "";
  }

  function tick() {
    if (phase !== "treats") return;
    var w = yardEl.clientWidth || 300;
    sleepers.forEach(function (s) {
      var step = s.speed * (1 / 60);
      s.x += s.dir * step;
      var pad = 36 / w;
      if (s.x < pad) { s.x = pad; s.dir = 1; }
      if (s.x > 1 - pad) { s.x = 1 - pad; s.dir = -1; }
      placeSleeper(s);
    });
    raf = requestAnimationFrame(tick);
  }

  function allFed() {
    return sleepers.every(function (s) { return s.treats > 0; });
  }

  function throwTreat(clientX) {
    if (phase !== "treats" || throwing || treatsLeft <= 0) return;
    var rect = yardEl.getBoundingClientRect();
    var x = clientX - rect.left;
    x = Math.max(10, Math.min(rect.width - 10, x));
    throwing = true;
    treatsLeft -= 1;
    var el = document.createElement("span");
    el.className = "dtb-treat";
    el.style.left = x + "px";
    yardEl.appendChild(el);
    requestAnimationFrame(function () { el.classList.add("fall"); });
    setTimeout(function () {
      if (phase !== "treats") {
        el.remove();
        throwing = false;
        return;
      }
      var hit = null;
      var best = 52;
      sleepers.forEach(function (s) {
        if (!s.el) return;
        var b = s.el.getBoundingClientRect();
        var cx = b.left + b.width / 2 - rect.left;
        var d = Math.abs(cx - x);
        if (d < best) { best = d; hit = s; }
      });
      if (hit) {
        hit.treats += 1;
        treatsLanded += 1;
        score += 1;
        CrittersPlay.setBest(KEY, score);
        bestEl.textContent = String(CrittersPlay.getBest(KEY));
        var pop = document.createElement("span");
        pop.className = "dtb-pop";
        pop.style.left = x + "px";
        pop.textContent = hit.name.split(" ")[0] + " nom";
        yardEl.appendChild(pop);
        setTimeout(function () { pop.remove(); }, 700);
      }
      el.remove();
      throwing = false;
      hud();
      sleepers.forEach(placeSleeper);
      settledBtn.hidden = !allFed();
      if (hintEl) {
        hintEl.textContent = treatsLeft === 0
          ? "That's the last treat."
          : "Tap the yard where a bird is standing. " + treatsLeft + " treats left.";
      }
      if (treatsLeft === 0 && !throwing) finish(allFed());
    }, 480);
  }

  function finish(done) {
    if (phase === "done") return;
    phase = "done";
    cancelAnimationFrame(raf);
    var result = CrittersPlay.applyResult({
      key: KEY,
      game: "fowl-to-bed",
      score: score,
      prior: runBest,
      spinAt: SPIN_AT
    });
    pinFact();
    bestEl.textContent = String(result.best);
    overlayTitle.textContent = done ? "Barn's quiet" : "Almost tucked in";
    overlayMsg.textContent = "Score " + score + " · " + bedded + " put to bed · " + treatsLanded + " treats landed. Best " + result.best + ".";
    startBtn.textContent = "Bed them again";
    playEl.classList.add("hidden");
    stageEl.hidden = false;
    overlay.classList.remove("hidden");
    if (hintEl) hintEl.textContent = "Tap a bird to coax it toward the barn";
  }

  function reset() {
    flock = FLOCK.map(function (b) {
      return { id: b.id, kind: b.kind, name: b.name, need: b.need, got: 0, bedded: false };
    });
    sleepers = SLEEPER_DEFS.map(function (s) {
      return {
        id: s.id, name: s.name, breed: s.breed, sprite: s.sprite,
        x: s.x, dir: s.dir, speed: s.speed, treats: 0, el: null, kernelEl: null
      };
    });
    score = 0;
    bedded = 0;
    treatsLanded = 0;
    treatsLeft = TREAT_BUDGET;
    throwing = false;
    phase = "coax";
    barnEl.classList.remove("locked");
    doorLabel.textContent = "Barn door open";
    doorMark.textContent = "Open";
    yardEl.hidden = true;
    settledBtn.hidden = true;
    lockBtn.hidden = true;
    trainEl.hidden = false;
    hud();
    renderTrain();
  }

  function start() {
    runBest = CrittersPlay.getBest(KEY);
    if (CrittersPlay.clearWin) CrittersPlay.clearWin();
    pinFact();
    cancelAnimationFrame(raf);
    reset();
    playEl.classList.remove("hidden");
    stageEl.hidden = true;
    if (hintEl) hintEl.textContent = "Tap a bird to coax it toward the barn";
  }

  lockBtn.addEventListener("click", function () {
    if (phase !== "coax" || bedded !== FLOCK.length) return;
    phase = "treats";
    barnEl.classList.add("locked");
    doorLabel.textContent = "Barn locked";
    doorMark.textContent = "Locked";
    lockBtn.hidden = true;
    trainEl.hidden = true;
    yardEl.hidden = false;
    renderSleepers();
    hud();
    if (hintEl) hintEl.textContent = "Tap where Elon, Emilio, or Halle Berry is standing.";
    raf = requestAnimationFrame(tick);
  });

  yardEl.addEventListener("pointerdown", function (e) {
    if (phase !== "treats") return;
    e.preventDefault();
    throwTreat(e.clientX);
  });

  settledBtn.addEventListener("click", function () {
    if (phase === "treats" && allFed()) finish(true);
  });

  startBtn.addEventListener("click", start);
})();
