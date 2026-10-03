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
    ["coc-play-ducks-to-bed-best", 1],
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

  /* A saved unlock never opens the wheel. Only this page's run can. */
  function spinReady() {
    return false;
  }

  function hideSpin(spin) {
    if (!spin) return;
    spin.removeAttribute("href");
    spin.hidden = true;
    spin.style.display = "none";
  }

  function showSpin(spin) {
    if (!spin) return;
    spin.href = SPIN_URL;
    spin.hidden = false;
    spin.style.display = "";
  }

  /* Drop every giving-wheel link that is not the post-win control. */
  function stripEarlyLinks() {
    var links = document.querySelectorAll("a[href*='giving-wheel']");
    for (var i = 0; i < links.length; i++) {
      if (links[i].id === "win-spin") continue;
      links[i].removeAttribute("href");
      links[i].hidden = true;
      var parent = links[i].parentElement;
      if (parent && parent.id === "spin-gate-ready") parent.hidden = true;
    }
    hideSpin(document.getElementById("win-spin"));
    var prompt = document.getElementById("spin-prompt");
    if (prompt) {
      prompt.hidden = true;
      prompt.textContent = "";
    }
    var open = document.getElementById("spin-gate-ready");
    if (open) {
      open.hidden = true;
      open.textContent = "";
    }
  }

  function paintGates() {
    stripEarlyLinks();
  }

  function clearWin() {
    var line = document.getElementById("win-line");
    var spin = document.getElementById("win-spin");
    var sms = document.getElementById("sms-line");
    if (line) { line.hidden = true; line.textContent = ""; }
    hideSpin(spin);
    if (sms) sms.hidden = true;
    var learnEl = document.getElementById("learn-prompt");
    if (learnEl) learnEl.textContent = learnFact();
    paintGates();
  }

  /* Spin link shows only when THIS run meets the game's SPIN_AT.
     A saved best, or a finished game under the score, does not unlock it. */
  function applyResult(opts) {
    opts = opts || {};
    var score = opts.score || 0;
    var prior = typeof opts.prior === "number" ? opts.prior : getBest(opts.key);
    var best = opts.key ? setBest(opts.key, score) : Math.max(prior, score);
    var spinAt = typeof opts.spinAt === "number" ? opts.spinAt : null;
    var earned = spinAt !== null && score >= spinAt;
    if (earned) markUnlocked(opts.game || opts.key || "play");

    var line = document.getElementById("win-line");
    var spin = document.getElementById("win-spin");
    var sms = document.getElementById("sms-line");
    if (line) {
      line.hidden = spinAt === null;
      if (earned) line.textContent = "Score " + score + ". Stead Spin is open.";
      else if (spinAt !== null) line.textContent = "Score " + score + ". Need " + spinAt + " to spin.";
    }
    if (earned) showSpin(spin);
    else hideSpin(spin);
    if (sms) sms.hidden = !earned;
    var prompt = document.getElementById("spin-prompt");
    if (prompt) {
      prompt.hidden = true;
      prompt.textContent = "";
    }
    return { beat: score > prior && score > 0, earned: earned, best: best, spinAt: spinAt };
  }

  /* Saved best must not open a spin on a game that has not just been won. */
  function noteSpin(id, best, spinAt) {
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
