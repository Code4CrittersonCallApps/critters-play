/* Critter Match — tap critter, then matching name & fact (Build-matched) */
(function () {
  var KEY = "coc-play-critter-match-best";
  var ROSTER = [
    { id: "sophie", emoji: "🐕", name: "Sophie", breed: "Great Pyrenees", description: "Livestock guardian dog. White fluffy protector — the real farmer's dog & brand face.", image: "assets/sophie.png" },
    { id: "gus", emoji: "🐕", name: "Gus", breed: "Pyrenees mix", description: "Black-and-tan guardian. Night scout — faster on his feet than he looks.", image: "assets/gus.png" },
    { id: "betty", emoji: "🐕", name: "Betty", breed: "Great Pyrenees", description: "Classic cream Pyrenees. Barn queen with a bark that fills the pasture.", image: "assets/betty.png" },
    { id: "tuxedo-cat", emoji: "🐈‍⬛", name: "Barn cat", breed: "Tuxedo", description: "Black-and-white tuxedo barn cat. Mouser by night, celebrity by day." },
    { id: "pekin", emoji: "🦆", name: "Pekin duck", breed: "Pekin", description: "Classic white farm duck. Soft quack, waddle walk, loves a splash." },
    { id: "toulouse", emoji: "🪿", name: "Toulouse goose", breed: "Toulouse", description: "Big gray French goose. Heavyweight of the pond — honks with authority." },
    { id: "rir", emoji: "🐔", name: "Laying hen", breed: "Rhode Island Red", description: "Rhode Island Red — America's classic brown-egg layer. Steady & hardy." },
    { id: "dwarf-goat", emoji: "🐐", name: "Dwarf goat", breed: "Nigerian Dwarf", description: "Nigerian Dwarf goat — small size, big personality. Yoga mat climber." },
    { id: "kneepads", emoji: "🐐", name: "Kneepads", breed: "Nigerian Dwarf", description: "Named dwarf goat. Climbs anything — mats, laps, hearts." },
    { id: "sassy", emoji: "🐐", name: "Sassy", breed: "Nigerian Dwarf", description: "Named dwarf goat with attitude. Lives up to the name." },
    { id: "mrna", emoji: "🐐", name: "mRNA", breed: "Nigerian Dwarf", description: "Named dwarf goat with a science name. Smart & memorable." },
    { id: "piggy", emoji: "🐷", name: "Piggy", breed: "Mini pig", description: "Smart little pig. Rooting nose, big brain, bigger fan club." },
    { id: "jelly-roll", emoji: "🐰", name: "Jelly Roll", breed: "Lionhead bunny", description: "Lionhead bunny — fluffy mane, soft hops, cuddle superstar." },
    { id: "bunny", emoji: "🐇", name: "Bunny", breed: "Farm rabbit", description: "Gentle farm bunny. Quiet, sweet, perfect for little hands." },
    { id: "spicy", emoji: "🐓", name: "Spicy", breed: "Serama rooster", description: "Tiny Serama rooster. Small body, full of spice." },
    { id: "elon", emoji: "🦆", name: "Elon Muscovy", breed: "Muscovy duck", description: "Muscovy duck. Waddles like he owns the pasture." }
  ];

  var scoreEl = document.getElementById("score");
  var streakEl = document.getElementById("streak");
  var missEl = document.getElementById("miss");
  var bestEl = document.getElementById("best");
  var overlay = document.getElementById("overlay");
  var overlayTitle = document.getElementById("overlay-title");
  var overlayMsg = document.getElementById("overlay-msg");
  var startBtn = document.getElementById("start-btn");
  var playArea = document.getElementById("play-area");
  var crittersEl = document.getElementById("critters");
  var factsEl = document.getElementById("facts");
  var doneEl = document.getElementById("done");
  var hintEl = document.getElementById("hint");

  var phase = "ready";
  var round = [];
  var selected = null;
  var matched = {};
  var wrongId = null;
  var score = 0;
  var streak = 0;
  var misses = 0;

  bestEl.textContent = CrittersPlay.getBest(KEY);
  var runBest = CrittersPlay.getBest(KEY);

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function avatarHTML(c, size) {
    var cls = size === "lg" ? "cm-avatar lg" : "cm-avatar";
    if (c.image) {
      return '<img class="' + cls + '" src="' + c.image + '" alt="' + c.name + '" width="56" height="56" />';
    }
    return '<span class="' + cls + ' emoji" aria-hidden="true">' + c.emoji + "</span>";
  }

  function render() {
    if (phase === "ready" || phase === "done") {
      playArea.classList.add("hidden");
      if (doneEl) doneEl.classList.add("hidden");
      return;
    }
    playArea.classList.remove("hidden");
    if (doneEl) doneEl.classList.add("hidden");

    crittersEl.innerHTML = "";
    round.forEach(function (c) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cm-critter" + (matched[c.id] ? " done" : "") + (selected === c.id ? " selected" : "");
      btn.disabled = !!matched[c.id];
      btn.innerHTML = avatarHTML(c) + '<span class="cm-critter-name">' + c.name + "</span>";
      btn.addEventListener("click", function () {
        if (phase !== "playing" || matched[c.id]) return;
        selected = c.id;
        wrongId = null;
        render();
      });
      crittersEl.appendChild(btn);
    });

    var facts = shuffle(round);
    factsEl.innerHTML = "";
    facts.forEach(function (c) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cm-fact" + (matched[c.id] ? " done" : "") + (wrongId === c.id ? " wrong" : "");
      btn.disabled = !!matched[c.id];
      btn.innerHTML =
        '<span class="cm-fact-name">' + c.name + "</span>" +
        '<span class="cm-fact-breed">' + c.breed + "</span>" +
        '<span class="cm-fact-desc">' + c.description + "</span>";
      btn.addEventListener("click", function () {
        if (phase !== "playing" || !selected || matched[c.id]) return;
        if (selected === c.id) {
          matched[c.id] = true;
          streak += 1;
          var pts = 100 + (streak - 1) * 25;
          score += pts;
          scoreEl.textContent = String(score);
          streakEl.textContent = String(streak);
          CrittersPlay.setBest(KEY, score);
          bestEl.textContent = String(CrittersPlay.getBest(KEY));
          selected = null;
          wrongId = null;
          var allDone = round.every(function (r) { return matched[r.id]; });
          if (allDone) {
            phase = "done";
            var result = CrittersPlay.applyResult({
              key: KEY,
              score: score,
              prior: runBest,
              finished: true
            });
            bestEl.textContent = String(result.best);
            overlayTitle.textContent = "You know the crew!";
            overlayMsg.textContent = "Score " + score + " · Best " + result.best + ".";
            startBtn.textContent = "Match again";
            overlay.classList.remove("hidden");
            playArea.classList.add("hidden");
            if (hintEl) hintEl.style.visibility = "hidden";
          } else {
            render();
          }
        } else {
          wrongId = c.id;
          streak = 0;
          misses += 1;
          streakEl.textContent = "0";
          missEl.textContent = String(misses);
          render();
          setTimeout(function () {
            wrongId = null;
            render();
          }, 450);
        }
      });
      factsEl.appendChild(btn);
    });
  }

  function start() {
    runBest = CrittersPlay.getBest(KEY);
    if (CrittersPlay.clearWin) CrittersPlay.clearWin();
    var shuffled = shuffle(ROSTER);
    var sophie = shuffled.find(function (c) { return c.id === "sophie"; });
    var rest = shuffled.filter(function (c) { return c.id !== "sophie"; });
    round = shuffle(sophie ? [sophie].concat(rest.slice(0, 7)) : rest.slice(0, 8));
    selected = null;
    matched = {};
    wrongId = null;
    score = 0;
    streak = 0;
    misses = 0;
    scoreEl.textContent = "0";
    streakEl.textContent = "0";
    missEl.textContent = "0";
    phase = "playing";
    overlay.classList.add("hidden");
    if (hintEl) hintEl.style.visibility = "visible";
    render();
  }

  startBtn.addEventListener("click", start);
  window.addEventListener("keydown", function (e) {
    if ((e.key === "Enter" || e.key === " ") && phase !== "playing") {
      e.preventDefault();
      start();
    }
  });

  // ready overlay stays visible until start
  playArea.classList.add("hidden");
})();
