# Critters on Call — Play

Sheehan Homestead · Callahan, FL

Wholesome farm games. Learn a short fact, beat a game's score, then spin.

Games: **Pyrenees Guard** · **Evade Elon** · **Barncat Defender** · **Fowl to Bed** · **Critter Match**

## Live
https://Code4CrittersonCallApps.github.io/critters-play/

## Open locally
```bash
python3 -m http.server 8771
```

## Win
Stead Spin opens only on that game, after that run meets its score. A saved best does not open it, and the hub has no wheel link. The number is `SPIN_AT` in that game's JS:

- Pyrenees Guard: 400
- Evade Elon: 600
- Barncat Defender: 300
- Fowl to Bed: 13
- Critter Match: 1000

Below the threshold the spin link stays hidden, or the page says a higher score is needed. No named prizes.

Stead Spin: https://Code4CrittersonCallApps.github.io/critters-on-call/giving-wheel/

A weekly email claim and a bigger wheel are not built yet.
