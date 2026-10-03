/* Ducks to Bed — cha-cha train into the barn, shut the door, treat the wilds */
(function () {
  var KEY = "coc-play-ducks-to-bed-best";
  /* Stead Spin unlock: win the round once.
     Clear = all 17 domestics in, door shut, wild ducks treated. */
  var SPIN_AT = 1;
  var FACT = "The ducks live with the chickens, and they lay eggs on the ground instead of in the nesting boxes the way the chickens do.";
  var W = 340, H = 480;
  var TOTAL = 17;
  var MAX_ESCAPES = 5;
  var DOOR_X = 120, DOOR_W = 100, DOOR_Y = 58, DOOR_H = 70;
  var BARN_TOP = 28, BARN_H = 110;
  var SEG = 18;
  var PLAYER_R = 14;

  /* 2 white geese, 2 gray geese, 5 runners, 8 peking = 17 */
  var FLOCK_KINDS = [
    "white-goose", "white-goose",
    "gray-goose", "gray-goose",
    "runner", "runner", "runner", "runner", "runner",
    "peking", "peking", "peking", "peking",
    "peking", "peking", "peking", "peking"
  ];

  var WILD_DEFS = [
    { id: "elon", name: "Elon", color: "#2a2418", accent: "#c45c48" },
    { id: "halle", name: "Halle", color: "#3d3428", accent: "#e8d4b8" },
    { id: "emilio", name: "Emilio", color: "#1a2218", accent: "#f5f0e6" }
  ];

  var canvas = document.getElementById("canvas");
  var ctx = canvas.getContext("2d");
  var beddedEl = document.getElementById("bedded");
  var doorEl = document.getElementById("door");
  var escapesEl = document.getElementById("escapes");
  var bestEl = document.getElementById("best");
  var overlay = document.getElementById("overlay");
  var overlayTitle = document.getElementById("overlay-title");
  var overlayMsg = document.getElementById("overlay-msg");
  var startBtn = document.getElementById("start-btn");
  var hintEl = document.getElementById("hint");
  var btnLeft = document.getElementById("btn-left");
  var btnRight = document.getElementById("btn-right");
  var btnDoor = document.getElementById("btn-door");
  var btnTreat = document.getElementById("btn-treat");

  canvas.width = W;
  canvas.height = H;

  var bettyImg = null;
  (function loadBetty() {
    var img = new Image();
    img.onload = function () { bettyImg = img; };
    img.src = "assets/betty.png";
  })();

  var running = false;
  var state = null;
  var last = 0;
  var runBest = 0;
  var holdLeft = false;
  var holdRight = false;

  bestEl.textContent = String(CrittersPlay.getBest(KEY));
  if (CrittersPlay.noteSpin) CrittersPlay.noteSpin("ducks-to-bed", CrittersPlay.getBest(KEY), SPIN_AT);

  function pinFact() {
    var el = document.getElementById("learn-prompt");
    if (el) el.textContent = FACT;
  }
  pinFact();

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function resetState() {
    var kinds = shuffle(FLOCK_KINDS);
    var birds = [];
    var startX = W / 2;
    var startY = H - 90;
    for (var i = 0; i < TOTAL; i++) {
      birds.push({
        kind: kinds[i],
        x: startX,
        y: startY + (i + 1) * SEG,
        inBarn: false,
        spook: 0
      });
    }
    state = {
      px: startX,
      py: startY,
      trail: [],
      birds: birds,
      doorShut: false,
      escapes: 0,
      score: 0,
      level: 1,
      wilds: [],
      wildSpawned: false,
      treated: false,
      bettyX: startX - 40,
      bettyY: startY + 10,
      bettyScare: 0,
      msg: "Put away all the ducks",
      msgT: 2.2,
      phase: "herd",
      allInTimer: 0,
      over: false,
      won: false,
      keys: {},
      pointerX: null,
      march: 0
    };
    for (var t = 0; t < TOTAL * 3; t++) {
      state.trail.push({ x: startX, y: startY + t * (SEG / 3) });
    }
    hud();
    btnDoor.hidden = true;
    btnTreat.hidden = true;
  }

  function countIn() {
    var n = 0;
    for (var i = 0; i < state.birds.length; i++) if (state.birds[i].inBarn) n++;
    return n;
  }

  function hud() {
    if (!state) return;
    beddedEl.textContent = countIn() + "/" + TOTAL;
    doorEl.textContent = state.doorShut ? "Shut" : "Open";
    escapesEl.textContent = String(state.escapes);
  }

  function inDoorZone(x, y) {
    return x > DOOR_X + 8 && x < DOOR_X + DOOR_W - 8 && y > DOOR_Y && y < DOOR_Y + DOOR_H + 8;
  }

  function inBarnInterior(x, y) {
    return x > DOOR_X - 10 && x < DOOR_X + DOOR_W + 10 && y > BARN_TOP + 8 && y < DOOR_Y + DOOR_H - 4;
  }

  function toCanvas(e) {
    var r = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (W / r.width),
      y: (e.clientY - r.top) * (H / r.height)
    };
  }

  function spawnWilds() {
    if (state.wildSpawned) return;
    state.wildSpawned = true;
    state.level = Math.max(state.level, 2);
    state.wilds = WILD_DEFS.map(function (w, i) {
      return {
        id: w.id,
        name: w.name,
        color: w.color,
        accent: w.accent,
        x: 40 + i * 110,
        y: 200 + (i % 2) * 40,
        vx: (i % 2 ? 1 : -1) * (35 + i * 8),
        vy: 20,
        scared: 0,
        disruptCD: 0
      };
    });
    state.msg = "Wild ducks! Betty will scare them.";
    state.msgT = 2.4;
    state.level = 3;
  }

  function scareWilds(force) {
    if (!state.wilds.length) return;
    var any = false;
    for (var i = 0; i < state.wilds.length; i++) {
      var w = state.wilds[i];
      var d = Math.hypot(w.x - state.bettyX, w.y - state.bettyY);
      if (force || d < 95) {
        w.scared = 1.8;
        w.vx = (w.x < state.bettyX ? -1 : 1) * 120;
        w.vy = (w.y < state.bettyY ? -1 : 1) * 80;
        any = true;
      }
    }
    if (any) {
      state.bettyScare = 0.6;
      state.msg = "Betty scares them off!";
      state.msgT = 1.2;
    }
  }

  function endGame(won) {
    if (!state || state.over) return;
    state.over = true;
    state.won = won;
    running = false;
    var score = won ? 1 : 0;
    state.score = score;
    var result = CrittersPlay.applyResult({
      key: KEY,
      game: "ducks-to-bed",
      score: score,
      prior: runBest,
      spinAt: SPIN_AT
    });
    pinFact();
    bestEl.textContent = String(result.best);
    overlayTitle.textContent = won ? "Barn's quiet" : "They got away";
    if (won) {
      overlayMsg.textContent = "All 17 put away, door shut, wild ducks treated. Best clears: " + result.best + ".";
    } else {
      overlayMsg.textContent = "Too many escapes (" + state.escapes + "). Steer the train in, shut the door, then treat the wilds.";
    }
    startBtn.textContent = "Bed them again";
    overlay.classList.remove("hidden");
    btnDoor.hidden = true;
    btnTreat.hidden = true;
    if (hintEl) hintEl.textContent = "Drag or tap Left/Right · lead the train into the barn · shut the door";
  }

  function update(dt) {
    if (!running || !state || state.over) return;
    var s = state;
    s.march += dt;

    var speed = 110;
    var dx = 0, dy = 0;
    if (holdLeft || s.keys["arrowleft"] || s.keys["a"]) dx -= 1;
    if (holdRight || s.keys["arrowright"] || s.keys["d"]) dx += 1;
    if (s.keys["arrowup"] || s.keys["w"]) dy -= 1;
    if (s.keys["arrowdown"] || s.keys["s"]) dy += 1;
    if (s.pointerX !== null) {
      var tx = s.pointerX - s.px;
      if (Math.abs(tx) > 6) dx = tx > 0 ? 1 : -1;
      /* gentle upward bias when dragging near top half of yard */
    }
    /* Auto march toward barn so phone players can focus on steering */
    if (s.phase === "herd" || s.phase === "door") {
      dy -= 0.35;
    }
    if (dx !== 0 || dy !== 0) {
      var len = Math.hypot(dx, dy) || 1;
      s.px += (dx / len) * speed * dt;
      s.py += (dy / len) * speed * dt;
    }
    s.px = Math.max(24, Math.min(W - 24, s.px));
    var minY = s.doorShut ? DOOR_Y + DOOR_H + 20 : BARN_TOP + 40;
    s.py = Math.max(minY, Math.min(H - 40, s.py));

    /* Betty follows near the side of the train */
    s.bettyX += (s.px - 36 - s.bettyX) * Math.min(1, 4 * dt);
    s.bettyY += (s.py + 8 - s.bettyY) * Math.min(1, 4 * dt);
    if (s.bettyScare > 0) s.bettyScare -= dt;

    /* Trail for snake follow */
    s.trail.unshift({ x: s.px, y: s.py });
    var maxTrail = TOTAL * 4 + 8;
    if (s.trail.length > maxTrail) s.trail.length = maxTrail;

    var inCount = 0;
    for (var i = 0; i < s.birds.length; i++) {
      var b = s.birds[i];
      if (b.spook > 0) {
        b.spook -= dt;
        b.x += (Math.random() - 0.5) * 80 * dt;
        b.y += (Math.random() - 0.5) * 80 * dt;
      } else if (b.inBarn && s.doorShut) {
        /* stay packed — handled below */
      } else if (b.inBarn && !s.doorShut && s.phase === "door" && s.allInTimer > 2.2 && i < 3) {
        /* A few birds start drifting out if you dawdle on the door */
        b.x += (Math.sin(s.march * 1.5 + i) * 18) * dt;
        b.y += 22 * dt;
      } else if (!b.inBarn) {
        var idx = Math.min(s.trail.length - 1, (i + 1) * 3);
        var target = s.trail[idx] || { x: s.px, y: s.py + (i + 1) * SEG };
        b.x += (target.x - b.x) * Math.min(1, 6 * dt);
        b.y += (target.y - b.y) * Math.min(1, 6 * dt);
      } else {
        /* in barn, door open, waiting — mild bob inside */
        b.x += (DOOR_X + 20 + (i % 5) * 14 - b.x) * Math.min(1, 2 * dt);
        b.y += (DOOR_Y + 20 + Math.floor(i / 5) * 10 - b.y) * Math.min(1, 2 * dt);
      }

      if (!s.doorShut) {
        if (inBarnInterior(b.x, b.y) || inDoorZone(b.x, b.y)) {
          if (!b.inBarn) {
            b.inBarn = true;
            s.msg = "In the barn — keep going";
            s.msgT = 0.9;
          }
        } else if (b.inBarn && b.y > DOOR_Y + DOOR_H + 18) {
          b.inBarn = false;
          s.escapes += 1;
          s.msg = "Escaped! Shut the door once they're in.";
          s.msgT = 1.6;
          hud();
          if (s.escapes >= MAX_ESCAPES) {
            endGame(false);
            return;
          }
        }
      }
      if (b.inBarn) inCount++;
    }

    /* Pack birds deep in barn once door shut */
    if (s.doorShut) {
      for (var j = 0; j < s.birds.length; j++) {
        var bb = s.birds[j];
        if (!bb.inBarn) continue;
        var slotX = DOOR_X + 18 + (j % 5) * 16;
        var slotY = BARN_TOP + 28 + Math.floor(j / 5) * 14;
        bb.x += (slotX - bb.x) * Math.min(1, 3 * dt);
        bb.y += (slotY - bb.y) * Math.min(1, 3 * dt);
      }
    }

    if (inCount >= TOTAL && !s.doorShut) {
      if (s.phase !== "door") {
        s.phase = "door";
        s.allInTimer = 0;
        btnDoor.hidden = false;
        s.msg = "Everyone's in — shut the door!";
        s.msgT = 2.5;
        if (hintEl) hintEl.textContent = "Tap Shut door or tap the barn door";
      }
      s.allInTimer += dt;
    } else if (!s.doorShut && s.phase === "door" && inCount < TOTAL) {
      s.phase = "herd";
      s.allInTimer = 0;
      btnDoor.hidden = true;
      s.msg = "Some got out — herd them back in";
      s.msgT = 1.8;
    }

    /* Wild ducks from level 2 once half the flock is in (or after ~12s) */
    if (!s.wildSpawned && (inCount >= 8 || s.march > 12)) {
      spawnWilds();
    }

    /* Wild AI */
    for (var w = 0; w < s.wilds.length; w++) {
      var wild = s.wilds[w];
      if (wild.scared > 0) {
        wild.scared -= dt;
        wild.x += wild.vx * dt;
        wild.y += wild.vy * dt;
      } else {
        /* Drift toward chain head to disrupt */
        var ax = s.px - wild.x;
        var ay = s.py - wild.y;
        var al = Math.hypot(ax, ay) || 1;
        wild.vx += (ax / al) * 40 * dt;
        wild.vy += (ay / al) * 30 * dt;
        var spd = Math.hypot(wild.vx, wild.vy);
        if (spd > 70) { wild.vx *= 70 / spd; wild.vy *= 70 / spd; }
        wild.x += wild.vx * dt;
        wild.y += wild.vy * dt;
        if (wild.disruptCD > 0) wild.disruptCD -= dt;
        if (wild.disruptCD <= 0 && Math.hypot(wild.x - s.px, wild.y - s.py) < 28) {
          wild.disruptCD = 2.2;
          s.msg = wild.name + " breaks the train!";
          s.msgT = 1.2;
          for (var k = 0; k < s.birds.length; k++) {
            if (!s.birds[k].inBarn) s.birds[k].spook = 0.7 + Math.random() * 0.5;
          }
        }
      }
      wild.x = Math.max(16, Math.min(W - 16, wild.x));
      wild.y = Math.max(DOOR_Y + DOOR_H + 10, Math.min(H - 30, wild.y));
    }

    /* Betty auto-scares when wilds get close */
    if (s.wilds.length) scareWilds(false);

    if (s.phase === "treat") {
      btnTreat.hidden = false;
      btnDoor.hidden = true;
    }

    if (s.msgT > 0) s.msgT -= dt;
    hud();
  }

  function drawBird(e, kind, x, y, scale) {
    e.save();
    e.translate(x, y);
    e.scale(scale || 1, scale || 1);
    if (kind === "white-goose") {
      e.fillStyle = "#f5f5f0";
      e.beginPath(); e.ellipse(0, 2, 11, 7, 0, 0, Math.PI * 2); e.fill();
      e.fillStyle = "#f0f0ea";
      e.fillRect(-2, -10, 4, 10);
      e.beginPath(); e.arc(0, -12, 5, 0, Math.PI * 2); e.fill();
      e.fillStyle = "#e8a020";
      e.beginPath(); e.moveTo(4, -12); e.lineTo(11, -11); e.lineTo(4, -9); e.fill();
      e.fillStyle = "#222"; e.beginPath(); e.arc(2, -13, 1.2, 0, Math.PI * 2); e.fill();
    } else if (kind === "gray-goose") {
      e.fillStyle = "#7a7e82";
      e.beginPath(); e.ellipse(0, 2, 11, 7, 0, 0, Math.PI * 2); e.fill();
      e.fillStyle = "#6a6e72";
      e.fillRect(-2, -10, 4, 10);
      e.beginPath(); e.arc(0, -12, 5, 0, Math.PI * 2); e.fill();
      e.fillStyle = "#d4a010";
      e.beginPath(); e.moveTo(4, -12); e.lineTo(11, -11); e.lineTo(4, -9); e.fill();
      e.fillStyle = "#111"; e.beginPath(); e.arc(2, -13, 1.2, 0, Math.PI * 2); e.fill();
    } else if (kind === "runner") {
      /* Tall upright runner — chocolate/fawn mix look */
      e.fillStyle = "#c4a574";
      e.beginPath(); e.ellipse(0, 4, 6, 9, 0, 0, Math.PI * 2); e.fill();
      e.fillStyle = "#b8956a";
      e.fillRect(-1.5, -8, 3, 10);
      e.beginPath(); e.arc(0, -11, 4.2, 0, Math.PI * 2); e.fill();
      e.fillStyle = "#2a6b4a";
      e.beginPath(); e.ellipse(-1, 2, 3, 5, -0.2, 0, Math.PI * 2); e.fill();
      e.fillStyle = "#e8a020";
      e.beginPath(); e.moveTo(3, -11); e.lineTo(9, -10); e.lineTo(3, -9); e.fill();
      e.fillStyle = "#111"; e.beginPath(); e.arc(1.5, -12, 1, 0, Math.PI * 2); e.fill();
    } else {
      /* peking — plump white */
      e.fillStyle = "#fff8e7";
      e.beginPath(); e.ellipse(0, 3, 9, 7, 0, 0, Math.PI * 2); e.fill();
      e.beginPath(); e.arc(-2, -4, 5, 0, Math.PI * 2); e.fill();
      e.fillStyle = "#f0a020";
      e.beginPath(); e.moveTo(2, -4); e.lineTo(9, -3); e.lineTo(2, -1); e.fill();
      e.fillStyle = "#222"; e.beginPath(); e.arc(0, -5, 1.1, 0, Math.PI * 2); e.fill();
    }
    e.restore();
  }

  function drawWild(e, w) {
    e.save();
    e.translate(w.x, w.y);
    e.globalAlpha = w.scared > 0 ? 0.55 : 1;
    e.fillStyle = w.color;
    e.beginPath(); e.ellipse(0, 2, 10, 7, 0, 0, Math.PI * 2); e.fill();
    e.fillStyle = w.accent;
    e.beginPath(); e.arc(-3, -5, 5, 0, Math.PI * 2); e.fill();
    e.fillStyle = "#e8a020";
    e.beginPath(); e.moveTo(1, -5); e.lineTo(8, -4); e.lineTo(1, -2); e.fill();
    e.fillStyle = "#fde68a";
    e.font = "bold 8px sans-serif";
    e.textAlign = "center";
    e.fillText(w.name, 0, 16);
    e.restore();
  }

  function drawBetty(e, x, y, scare) {
    e.save();
    e.translate(x, y);
    if (scare > 0) e.rotate(Math.sin(scare * 30) * 0.08);
    if (bettyImg && bettyImg.complete) {
      e.drawImage(bettyImg, -18, -18, 36, 36);
    } else {
      e.fillStyle = "#f5f0e6";
      e.beginPath(); e.ellipse(0, 4, 14, 11, 0, 0, Math.PI * 2); e.fill();
      e.beginPath(); e.arc(0, -8, 8, 0, Math.PI * 2); e.fill();
      e.fillStyle = "#222";
      e.beginPath(); e.arc(-3, -9, 1.2, 0, Math.PI * 2); e.fill();
      e.beginPath(); e.arc(3, -9, 1.2, 0, Math.PI * 2); e.fill();
    }
    e.fillStyle = "#fde68a";
    e.font = "bold 8px sans-serif";
    e.textAlign = "center";
    e.fillText("Betty", 0, 22);
    if (scare > 0) {
      e.fillStyle = "rgba(253,230,138,0.85)";
      e.font = "bold 10px sans-serif";
      e.fillText("WOOF", 0, -22);
    }
    e.restore();
  }

  function drawFarmer(e, x, y) {
    e.save();
    e.translate(x, y);
    e.fillStyle = "#3d5a40";
    e.beginPath(); e.ellipse(0, 6, 9, 7, 0, 0, Math.PI * 2); e.fill();
    e.fillStyle = "#e8c48a";
    e.beginPath(); e.arc(0, -6, 6, 0, Math.PI * 2); e.fill();
    e.fillStyle = "#5a3a1a";
    e.fillRect(-7, -12, 14, 3);
    e.fillRect(-4, -14, 8, 3);
    e.fillStyle = "#fde68a";
    e.font = "bold 8px sans-serif";
    e.textAlign = "center";
    e.fillText("You", 0, 20);
    e.restore();
  }

  function draw(e) {
    if (!state) return;
    var s = state;
    /* Dusk sky */
    var g = e.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#2a3348");
    g.addColorStop(0.35, "#5a4a58");
    g.addColorStop(0.55, "#6b8f5a");
    g.addColorStop(1, "#3d6a3a");
    e.fillStyle = g;
    e.fillRect(0, 0, W, H);

    /* Barn */
    e.fillStyle = "#6b2a1e";
    e.fillRect(DOOR_X - 30, BARN_TOP, DOOR_W + 60, BARN_H);
    e.fillStyle = "#4a1e14";
    e.beginPath();
    e.moveTo(DOOR_X - 40, BARN_TOP);
    e.lineTo(DOOR_X + DOOR_W / 2, BARN_TOP - 28);
    e.lineTo(DOOR_X + DOOR_W + 40, BARN_TOP);
    e.closePath();
    e.fill();
    /* Door opening / shut */
    if (s.doorShut) {
      e.fillStyle = "#3a2210";
      e.fillRect(DOOR_X, DOOR_Y, DOOR_W, DOOR_H);
      e.strokeStyle = "#c9a227";
      e.lineWidth = 2;
      e.strokeRect(DOOR_X + 4, DOOR_Y + 4, DOOR_W - 8, DOOR_H - 8);
      e.fillStyle = "#c9a227";
      e.beginPath(); e.arc(DOOR_X + DOOR_W - 16, DOOR_Y + DOOR_H / 2, 4, 0, Math.PI * 2); e.fill();
    } else {
      e.fillStyle = "#1a120c";
      e.fillRect(DOOR_X, DOOR_Y, DOOR_W, DOOR_H);
      e.fillStyle = "rgba(253,230,138,0.15)";
      e.fillRect(DOOR_X + 10, DOOR_Y + 10, DOOR_W - 20, DOOR_H - 20);
    }
    e.fillStyle = "#e8d48b";
    e.font = "bold 10px sans-serif";
    e.textAlign = "center";
    e.fillText(s.doorShut ? "DOOR SHUT" : "BARN DOOR", DOOR_X + DOOR_W / 2, BARN_TOP - 6);

    /* Yard path */
    e.fillStyle = "rgba(90,70,40,0.25)";
    e.fillRect(DOOR_X + 10, DOOR_Y + DOOR_H, DOOR_W - 20, H - (DOOR_Y + DOOR_H) - 20);

    /* Birds in barn first (behind door feel) then outside */
    for (var i = s.birds.length - 1; i >= 0; i--) {
      var b = s.birds[i];
      if (b.inBarn && s.doorShut) drawBird(e, b.kind, b.x, b.y, 0.75);
    }
    for (var j = s.birds.length - 1; j >= 0; j--) {
      var bird = s.birds[j];
      if (!(bird.inBarn && s.doorShut)) drawBird(e, bird.kind, bird.x, bird.y, bird.spook > 0 ? 1.05 : 1);
    }

    for (var w = 0; w < s.wilds.length; w++) drawWild(e, s.wilds[w]);

    drawBetty(e, s.bettyX, s.bettyY, s.bettyScare);
    if (!(s.doorShut && countIn() >= TOTAL)) drawFarmer(e, s.px, s.py);

    /* HUD strip */
    e.fillStyle = "rgba(15,20,12,0.5)";
    e.fillRect(0, 0, W, 22);
    e.fillStyle = "#fde68a";
    e.font = "bold 11px sans-serif";
    e.textAlign = "left";
    e.fillText("Put away all the ducks", 8, 15);
    e.textAlign = "right";
    e.fillText(countIn() + "/" + TOTAL, W - 8, 15);

    if (s.msgT > 0) {
      e.fillStyle = "rgba(253,230,138," + Math.min(1, s.msgT) + ")";
      e.font = "bold 13px sans-serif";
      e.textAlign = "center";
      e.fillText(s.msg, W / 2, H - 18);
    }

    /* Legend */
    e.font = "9px sans-serif";
    e.textAlign = "left";
    e.fillStyle = "rgba(245,240,230,0.7)";
    e.fillText("White goose · Gray goose · Runner · Peking", 8, H - 4);
  }

  function loop(ts) {
    if (!last) last = ts;
    var dt = Math.min(0.05, (ts - last) / 1000);
    last = ts;
    update(dt);
    draw(ctx);
    requestAnimationFrame(loop);
  }

  function shutDoor() {
    if (!state || state.over || state.doorShut) return;
    if (countIn() < TOTAL) {
      state.msg = "Get all 17 inside first";
      state.msgT = 1.4;
      return;
    }
    state.doorShut = true;
    state.phase = state.wildSpawned ? "treat" : "treat";
    if (!state.wildSpawned) spawnWilds();
    btnDoor.hidden = true;
    btnTreat.hidden = false;
    state.msg = "Door shut! Give the wild ducks a treat.";
    state.msgT = 2.5;
    if (hintEl) hintEl.textContent = "Tap Give treat — Elon, Halle, and Emilio stay outside";
    hud();
  }

  function giveTreat() {
    if (!state || state.over || !state.doorShut || countIn() < TOTAL) return;
    if (!state.wildSpawned) spawnWilds();
    state.treated = true;
    state.msg = "Treats tossed — bedtime done!";
    state.msgT = 1.5;
    btnTreat.hidden = true;
    endGame(true);
  }

  function start() {
    runBest = CrittersPlay.getBest(KEY);
    if (CrittersPlay.clearWin) CrittersPlay.clearWin();
    pinFact();
    resetState();
    overlay.classList.add("hidden");
    running = true;
    last = 0;
    if (hintEl) hintEl.textContent = "Drag or use Left/Right — the flock follows you into the barn";
  }

  startBtn.addEventListener("click", start);
  btnDoor.addEventListener("click", function (e) { e.preventDefault(); shutDoor(); });
  btnTreat.addEventListener("click", function (e) { e.preventDefault(); giveTreat(); });

  function bindHold(btn, flag) {
    if (!btn) return;
    btn.addEventListener("pointerdown", function (e) {
      e.preventDefault();
      if (flag === "L") holdLeft = true; else holdRight = true;
      try { btn.setPointerCapture(e.pointerId); } catch (err) {}
    });
    btn.addEventListener("pointerup", function () {
      if (flag === "L") holdLeft = false; else holdRight = false;
    });
    btn.addEventListener("pointercancel", function () {
      if (flag === "L") holdLeft = false; else holdRight = false;
    });
  }
  bindHold(btnLeft, "L");
  bindHold(btnRight, "R");

  window.addEventListener("keydown", function (e) {
    var t = e.key.toLowerCase();
    if (["arrowleft", "arrowright", "arrowup", "arrowdown", "a", "d", "w", "s"].indexOf(t) >= 0) {
      e.preventDefault();
      if (state) state.keys[t] = true;
    }
    if (e.key === "Enter" || e.key === " ") {
      if (!running) { e.preventDefault(); start(); }
      else if (state && state.phase === "door" && !state.doorShut) { e.preventDefault(); shutDoor(); }
      else if (state && state.phase === "treat" && state.doorShut && !state.treated) { e.preventDefault(); giveTreat(); }
    }
  });
  window.addEventListener("keyup", function (e) {
    if (state) state.keys[e.key.toLowerCase()] = false;
  });

  canvas.addEventListener("pointerdown", function (e) {
    if (!running || !state) return;
    try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
    var p = toCanvas(e);
    state.pointerX = p.x;
    /* Tap door to shut when ready */
    if (!state.doorShut && countIn() >= TOTAL &&
        p.x > DOOR_X && p.x < DOOR_X + DOOR_W && p.y > DOOR_Y && p.y < DOOR_Y + DOOR_H) {
      shutDoor();
    }
    /* Tap Betty to force-scare */
    if (state.wilds.length && Math.hypot(p.x - state.bettyX, p.y - state.bettyY) < 28) {
      scareWilds(true);
    }
  });
  canvas.addEventListener("pointermove", function (e) {
    if (!running || !state) return;
    if (e.buttons || e.pressure > 0) state.pointerX = toCanvas(e).x;
  });
  canvas.addEventListener("pointerup", function () {
    if (state) state.pointerX = null;
  });
  canvas.addEventListener("pointercancel", function () {
    if (state) state.pointerX = null;
  });

  resetState();
  draw(ctx);
  requestAnimationFrame(loop);
})();
