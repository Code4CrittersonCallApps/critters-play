/* Calm Audio: a gentle, generated ambient loop (Web Audio, no files, no licensing).
   Soft sine pads drift through four slow chords, with an occasional pentatonic chime.
   Starts only after a tap (browser rule). Usage: CalmAudio.start(), .stop(), .toggle(), .isOn() */
(function (global) {
  var ctx = null, master = null, timer = null, on = false, step = 0;
  /* Cmaj7 · Am7 · Fmaj7 · G6, low and soft */
  var CHORDS = [
    [130.81, 164.81, 196.0, 246.94],
    [110.0, 130.81, 164.81, 196.0],
    [87.31, 130.81, 174.61, 220.0],
    [98.0, 146.83, 196.0, 164.81]
  ];
  var CHIMES = [523.25, 587.33, 659.25, 783.99, 880.0];
  var CHORD_SEC = 6;

  function ensure() {
    if (ctx) return true;
    var AC = global.AudioContext || global.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0;
    var lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 1400;
    master.connect(lp);
    lp.connect(ctx.destination);
    return true;
  }

  function tone(freq, t0, dur, peak, type) {
    var o = ctx.createOscillator();
    var g = ctx.createGain();
    o.type = type || "sine";
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + Math.min(2, dur * 0.35));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    g.connect(master);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  }

  function playChord() {
    if (!on || !ctx) return;
    var t = ctx.currentTime + 0.05;
    var chord = CHORDS[step % CHORDS.length];
    chord.forEach(function (f) { tone(f, t, CHORD_SEC + 1.5, 0.05); });
    if (Math.random() < 0.7) {
      var c = CHIMES[Math.floor(Math.random() * CHIMES.length)];
      tone(c, t + 1 + Math.random() * 3, 3.5, 0.025, "triangle");
    }
    step += 1;
  }

  function start() {
    if (on) return true;
    if (!ensure()) return false;
    if (ctx.state === "suspended" && ctx.resume) ctx.resume();
    on = true;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
    master.gain.linearRampToValueAtTime(0.9, ctx.currentTime + 2);
    playChord();
    timer = setInterval(playChord, CHORD_SEC * 1000);
    return true;
  }

  function stop() {
    if (!on) return;
    on = false;
    clearInterval(timer);
    timer = null;
    if (ctx) {
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
      master.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.2);
    }
  }

  global.CalmAudio = {
    start: start,
    stop: stop,
    toggle: function () { if (on) { stop(); } else { start(); } return on; },
    isOn: function () { return on; }
  };
})(window);
