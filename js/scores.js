/* Shared high-score helpers (localStorage) + learn/spin prompts */
(function (global) {
  var SPIN_URL = "https://Code4CrittersonCallApps.github.io/critters-on-call/giving-wheel/";
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

  function clearWin() {
    var line = document.getElementById("win-line");
    var spin = document.getElementById("win-spin");
    var sms = document.getElementById("sms-line");
    if (line) { line.hidden = true; line.textContent = ""; }
    if (spin) spin.hidden = true;
    if (sms) sms.hidden = true;
    var learnEl = document.getElementById("learn-prompt");
    if (learnEl) learnEl.textContent = learnFact();
  }

  /* Win = beat the saved high score, or finish the round with a score. */
  function applyResult(opts) {
    opts = opts || {};
    var score = opts.score || 0;
    var prior = typeof opts.prior === "number" ? opts.prior : getBest(opts.key);
    var beat = score > prior && score > 0;
    var finished = !!opts.finished && score > 0;
    var win = beat || finished;
    var best = opts.key ? setBest(opts.key, score) : Math.max(prior, score);
    var line = document.getElementById("win-line");
    var spin = document.getElementById("win-spin");
    var sms = document.getElementById("sms-line");
    if (line) {
      line.hidden = !win;
      line.textContent = beat ? "New high score." : "You finished.";
    }
    if (spin) spin.hidden = !win;
    if (sms) sms.hidden = !win;
    return { beat: beat, win: win, best: best };
  }

  var CP = global.CrittersPlay || (global.CrittersPlay = {});
  CP.getBest = getBest;
  CP.setBest = setBest;
  CP.SPIN_URL = SPIN_URL;
  CP.learnFact = learnFact;
  CP.clearWin = clearWin;
  CP.applyResult = applyResult;

  var learnEl = document.getElementById("learn-prompt");
  if (learnEl) learnEl.textContent = learnFact();
})(window);
