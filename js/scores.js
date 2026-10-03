/* Shared high-score helpers (localStorage) + score gate for Stead Spin.
   No named prizes. Weekly email claim and a bigger wheel are not part of this file. */
(function (global) {
  var SPIN_URL = "https://Code4CrittersonCallApps.github.io/critters-on-call/giving-wheel/";
  var SPIN_FLAG = "coc-play-spin-ok-v1";
  /* Hub mirror of each game's SPIN_AT. The number that gates a run lives in that game's JS. */
  var SPIN_RULES = [
    ["coc-play-pyrenees-guard-best", 400],
    ["coc-play-evade-elon-best", 600],
    ["coc-play-barn-cat-best", 300],
    ["coc-play-ducks-to-bed-best", 13],
    ["coc-play-critter-match-best", 1000]
  ];

  /* Species and farm facts only — no prices, no named prizes. */
  var FACTS = [
    "Goats have rectangular pupils and can see almost all the way around.",
    "Muscovy ducks hiss more than they quack.",
    "Chickens dream — they have REM sleep, just like us.",
    "Pigs are quick learners and can come when called.",
    "A rabbit can see nearly all around without turning its head.",
    "Rhode Island Red hens are hardy birds that lay brown eggs.",
    "Great Pyrenees were bred to watch flocks through the night.",
    "Barn cats keep mice and snakes out of the hay.",
    "Toulouse geese are big gray geese with a loud honk.",
    "Nigerian Dwarf goats are small and love to climb."
  ];

  function getBest(key) {
    try {
      var v = parseInt(localStorage.getItem(key), 10);
      return isNaN(v) ? 0 : v;
    } catch (e) {
      return 0;
    }
  }
  function setBest(key, score) {
    var best = getBest(key);
    if (score > best) {
      try {
        localStorage.setItem(key, String(score));
      } catch (e) {}
      return score;
    }
    return best;
  }
  function learnFact() {
    return FACTS[Math.floor(Math.random() * FACTS.length)];
  }

  function readUnlocked() {
    try {
      var obj = JSON.parse(localStorage.getItem(SPIN_FLAG) || "{}");
      return obj && typeof obj === "object" ? obj : {};
    } catch (e) {
      return {};
    }
  }

  function markUnlocked(id) {
    if (!id) return;
    var obj = readUnlocked();
    if (!obj[id]) {
      obj[id] = Date.now();
      try {
        localStorage.setItem(SPIN_FLAG, JSON.stringify(obj));
      } catch (e) {}
    }
  }

  function spinReady() {
    if (Object.keys(readUnlocked()).length > 0) return true;
    for (var i = 0; i < SPIN_RULES.length; i++) {
      if (getBest(SPIN_RULES[i][0]) >= SPIN_RULES[i][1]) {
        markUnlocked(SPIN_RULES[i][0]);
        return true;
      }
    }
    return false;
  }

  function paintGates() {
    var ready = spinReady();
    var locked = document.getElementById("spin-gate-locked");
    var open = document.getElementById("spin-gate-ready");
    if (locked) locked.hidden = ready;
    if (open) open.hidden = !ready;

    document.querySelectorAll("a.spin-gate").forEach(function (a) {
      if (ready) {
        if (!a.getAttribute("href")) a.setAttribute("href", SPIN_URL);
        a.textContent = a.getAttribute("data-label") || "Spin Stead Spin";
        a.style.pointerEvents = "";
        a.style.textDecoration = "";
        a.removeAttribute("aria-disabled");
      } else {
        a.removeAttribute("href");
        a.textContent = "Need a higher score to spin.";
        a.style.pointerEvents = "none";
        a.style.textDecoration = "none";
        a.setAttribute("aria-disabled", "true");
      }
    });
  }

  function clearWin() {
    var line = document.getElementById("win-line");
    var spin = document.getElementById("win-spin");
    var sms = document.getElementById("sms-line");
    if (line) { line.hidden = true; line.textContent = ""; }
    if (spin) spin.hidden = true;
    if (sms) sms.hidden = true;
    var learnEl = document.getElementById("learn-prompt");
    if (learnEl) learnEl.textContent = learnFact();
    paintGates();
  }

  /* Spin link shows only when this score meets the game's SPIN_AT. */
  function applyResult(opts) {
    opts = opts || {};
    var score = opts.score || 0;
    var prior = typeof opts.prior === "number" ? opts.prior : getBest(opts.key);
    var best = opts.key ? setBest(opts.key, score) : Math.max(prior, score);
    var spinAt = typeof opts.spinAt === "number" ? opts.spinAt : null;
    var earned = spinAt !== null && score >= spinAt;
    if (earned) markUnlocked(opts.game || opts.key || "play");
    else if (spinAt !== null && best >= spinAt) markUnlocked(opts.game || opts.key || "play");

    var line = document.getElementById("win-line");
    var spin = document.getElementById("win-spin");
    var sms = document.getElementById("sms-line");
    if (line) {
      line.hidden = spinAt === null;
      if (earned) line.textContent = "Score " + score + ". Stead Spin is open.";
      else if (spinAt !== null) line.textContent = "Score " + score + ". Need " + spinAt + " to spin.";
    }
    if (spin) spin.hidden = !earned;
    if (sms) sms.hidden = !earned;
    paintGates();
    return { beat: score > prior && score > 0, earned: earned, best: best, spinAt: spinAt };
  }

  /* Games call this with their own SPIN_AT so a saved best can open the hub link. */
  function noteSpin(id, best, spinAt) {
    var target = document.getElementById("spin-target");
    if (target && typeof spinAt === "number") {
      target.textContent = "Stead Spin opens at " + spinAt + ".";
    }
    if (typeof spinAt === "number" && best >= spinAt) markUnlocked(id || "play");
    paintGates();
  }

  var CP = global.CrittersPlay || (global.CrittersPlay = {});
  CP.getBest = getBest;
  CP.setBest = setBest;
  CP.SPIN_URL = SPIN_URL;
  CP.learnFact = learnFact;
  CP.clearWin = clearWin;
  CP.applyResult = applyResult;
  CP.noteSpin = noteSpin;
  CP.spinReady = spinReady;
  CP.paintGates = paintGates;

  var learnEl = document.getElementById("learn-prompt");
  if (learnEl) learnEl.textContent = learnFact();
  paintGates();
})(window);
