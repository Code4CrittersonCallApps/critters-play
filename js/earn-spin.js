/* Shared Wheel earn-spin + play caps + aptitude awards
   (same-origin localStorage with critters-on-call on github.io) */
(function (global) {
  var CP = global.CrittersPlay || (global.CrittersPlay = {});
  var EARN_KEY = "coc_earned_wheel_spins_v1";
  var CAPS_KEY = "coc_play_caps_v1";
  var AWARDS_KEY = "coc_aptitude_awards_v1";
  var SMS_NUMBER = "9142631311";
  var VALID = { gus: true, betty: true, elon: true, sophie: true };

  /* Caps (Phase 1, client-side localStorage):
     - PLAYS: max 3 starts per character id per device per calendar day
       (sophie | gus | betty | elon)
     - SPINS: 1 claim per earn token (gus|betty|elon), AND max 1 earned
       spin claim per device per calendar day
  */
  var PLAYS_PER_CHAR_PER_DAY = 3;
  var SPIN_CLAIMS_PER_DAY = 1;

  CP.WHEEL_URL = "https://Code4CrittersonCallApps.github.io/critters-on-call/giving-wheel/";
  /* Stead Spin (legacy path). Legacy wheel.html still exists; Evade Elon & Play earn → Stead Spin. */
  CP.FARM_SPIN_URL = CP.WHEEL_URL;
  CP.SERVICES_URL = "https://www.sheehanhomestead.com/services";
  CP.BOOKING_HELP_URL = "https://www.sheehanhomestead.com/booking-help";
  CP.HOME_URL = "https://www.sheehanhomestead.com";
  CP.SMS_NUMBER = SMS_NUMBER;
  CP.EARN_KEY = EARN_KEY;
  CP.CAPS_KEY = CAPS_KEY;
  /* Game wins → text HIGH SCORE (screenshot/score). Deal path stays CODE/GOAT elsewhere. */
  CP.GAME_SMS_KEYWORD = "HIGH SCORE";
  /* Kept for any leftover deal/prize references — do not use for game unlock CTAs */
  CP.PRIZE_SMS_KEYWORD = "GOAT";
  CP.PLAYS_PER_CHAR_PER_DAY = PLAYS_PER_CHAR_PER_DAY;
  CP.SPIN_CLAIMS_PER_DAY = SPIN_CLAIMS_PER_DAY;

  /* Phase 1 soft digital prizes — honest, no fake $; win CTA → real website */
  CP.APTITUDES = {
    sophie: {
      id: "sophie",
      title: "",
      blurb: "Balanced watch — the farmer's dog.",
      prize: "",
      tip: ""
    },
    gus: {
      id: "gus",
      title: "",
      blurb: "Fast on his feet after dark.",
      prize: "",
      tip: ""
    },
    betty: {
      id: "betty",
      title: "",
      blurb: "Bigger bark, wider reach.",
      prize: "",
      tip: ""
    },
    elon: {
      id: "elon",
      title: "",
      blurb: "Fed the crew. Dodged the Muscovy.",
      prize: "",
      tip: ""
    }
  };

  function todayKey() {
    var d = new Date();
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
  }

  function readCaps() {
    try {
      var raw = localStorage.getItem(CAPS_KEY);
      var obj = raw ? JSON.parse(raw) : null;
      if (!obj || typeof obj !== "object") obj = {};
      if (obj.date !== todayKey()) {
        obj = { date: todayKey(), plays: {}, spinClaims: 0 };
        writeCaps(obj);
      }
      if (!obj.plays || typeof obj.plays !== "object") obj.plays = {};
      if (typeof obj.spinClaims !== "number") obj.spinClaims = 0;
      return obj;
    } catch (e) {
      return { date: todayKey(), plays: {}, spinClaims: 0 };
    }
  }

  function writeCaps(obj) {
    try {
      localStorage.setItem(CAPS_KEY, JSON.stringify(obj));
    } catch (e) {}
  }

  function readEarns() {
    try {
      var raw = localStorage.getItem(EARN_KEY);
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function writeEarns(arr) {
    try {
      localStorage.setItem(EARN_KEY, JSON.stringify(arr));
    } catch (e) {}
  }

  function readAwards() {
    try {
      var raw = localStorage.getItem(AWARDS_KEY);
      var obj = raw ? JSON.parse(raw) : {};
      return obj && typeof obj === "object" ? obj : {};
    } catch (e) {
      return {};
    }
  }

  function writeAwards(obj) {
    try {
      localStorage.setItem(AWARDS_KEY, JSON.stringify(obj));
    } catch (e) {}
  }

  /** sms:9142631311?&body=HIGH%20SCORE (iOS/Android-friendly) */
  CP.smsHref = function (keyword) {
    return "sms:" + SMS_NUMBER + "?&body=" + encodeURIComponent(String(keyword || CP.GAME_SMS_KEYWORD));
  };

  CP.gameSmsHref = function (score, aptitudeId) {
    var parts = [CP.GAME_SMS_KEYWORD, "screenshot"];
    if (aptitudeId && CP.APTITUDES[aptitudeId]) {
      parts.push(CP.APTITUDES[aptitudeId].title);
    }
    if (typeof score === "number" && score > 0) {
      parts.push("score " + score);
    }
    return CP.smsHref(parts.join(" · "));
  };

  CP.wheelEarnUrl = function (dogId, opts) {
    var dog = String(dogId || "").toLowerCase();
    var url = CP.WHEEL_URL + "?earn=" + encodeURIComponent(dog);
    if (opts && opts.demo) url += "&demo=1";
    return url;
  };

  CP.readWheelEarns = readEarns;

  CP.earnDisplayName = function (id) {
    var k = String(id || "").toLowerCase();
    if (k === "gus") return "Gus";
    if (k === "betty") return "Betty";
    if (k === "sophie") return "Sophie";
    if (k === "elon") return "Evade Elon";
    return "Play";
  };

  CP.getAptitude = function (id) {
    return CP.APTITUDES[String(id || "").toLowerCase()] || null;
  };

  /** Persist aptitude award once per character on this device */
  CP.grantAptitudeAward = function (id) {
    var k = String(id || "").toLowerCase();
    if (!CP.APTITUDES[k]) return null;
    var awards = readAwards();
    if (!awards[k]) {
      awards[k] = { at: new Date().toISOString(), title: CP.APTITUDES[k].title };
      writeAwards(awards);
    }
    return CP.APTITUDES[k];
  };

  CP.hasAptitudeAward = function (id) {
    var awards = readAwards();
    return !!awards[String(id || "").toLowerCase()];
  };

  CP.playsRemainingToday = function (charId) {
    var id = String(charId || "").toLowerCase();
    var caps = readCaps();
    var used = caps.plays[id] || 0;
    return Math.max(0, PLAYS_PER_CHAR_PER_DAY - used);
  };

  CP.canStartPlay = function (charId) {
    return CP.playsRemainingToday(charId) > 0;
  };

  /** Count a game start against the daily character cap. Returns false if blocked. */
  CP.consumePlay = function (charId) {
    var id = String(charId || "").toLowerCase();
    var caps = readCaps();
    var used = caps.plays[id] || 0;
    if (used >= PLAYS_PER_CHAR_PER_DAY) return false;
    caps.plays[id] = used + 1;
    writeCaps(caps);
    return true;
  };

  CP.spinClaimsRemainingToday = function () {
    var caps = readCaps();
    return Math.max(0, SPIN_CLAIMS_PER_DAY - (caps.spinClaims || 0));
  };

  CP.canClaimSpinToday = function () {
    return CP.spinClaimsRemainingToday() > 0;
  };

  /** Record that an earned spin was claimed today (call from wheel finish). */
  CP.recordSpinClaimToday = function () {
    var caps = readCaps();
    caps.spinClaims = (caps.spinClaims || 0) + 1;
    writeCaps(caps);
  };

  /**
   * Append an earn record if not already granted for that id.
   * opts.fresh → reopen claimed earn (quiet QA ?demo=1 only).
   * Spin earn tokens: gus | betty | elon (not sophie).
   */
  CP.grantWheelSpin = function (dogId, opts) {
    var dog = String(dogId || "").toLowerCase();
    if (!VALID[dog] || dog === "sophie") return null;
    var earns = readEarns();
    for (var i = 0; i < earns.length; i++) {
      if (earns[i] && earns[i].dog === dog) {
        if (opts && opts.fresh && earns[i].claimed) {
          earns[i].claimed = false;
          earns[i].at = new Date().toISOString();
          writeEarns(earns);
        }
        return earns[i];
      }
    }
    var rec = {
      id: dog + "-" + Date.now(),
      dog: dog,
      at: new Date().toISOString(),
      claimed: false
    };
    earns.push(rec);
    writeEarns(earns);
    return rec;
  };

  CP.getEarnForDog = function (dogId) {
    var dog = String(dogId || "").toLowerCase();
    var earns = readEarns();
    for (var i = 0; i < earns.length; i++) {
      if (earns[i] && earns[i].dog === dog) return earns[i];
    }
    return null;
  };

  CP.hasUnclaimedEarn = function (dogId) {
    var rec = CP.getEarnForDog(dogId);
    return !!(rec && !rec.claimed);
  };

  CP.getUnclaimedEarns = function () {
    return readEarns().filter(function (e) { return e && !e.claimed; });
  };

  /** Unclaimed earn that can still be claimed under today's daily spin cap */
  CP.getClaimableEarnsToday = function () {
    if (!CP.canClaimSpinToday()) return [];
    return CP.getUnclaimedEarns();
  };
})(window);
