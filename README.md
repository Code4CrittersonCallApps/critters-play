# Critters on Call — Play

Sheehan Homestead · Callahan, FL

Entertaining wholesome farm games parents can hand kids — learn a little, favor to parents. Prototype #1 of a Quantic-style learn-as-you-go tech story.

Games: **Evade Elon** · **Barn Cat Defender** · **Pyrenees Guard** · **Critter Match**

## Live
https://Code4CrittersonCallApps.github.io/critters-play/

Real website (consumer win CTA): https://www.sheehanhomestead.com/services

## Open locally
```bash
python3 -m http.server 8771
```

## Real play → website + text Michael
1. Open **Pyrenees Guard** as **Sophie** (Lead Guardian), or **Evade Elon**
2. Unlock aptitude awards + named soft prizes:
   - Sophie → **Lead Guardian** · prize **Farm Favor unlocked**
   - Gus → **Night Scout** (score **250**) · prize **Mobile party scout badge**
   - Betty → **Barn Queen** (score **500**) · prize **Barn Queen visit pass**
   - Evade Elon → **Grain Guard** (score **300**) · prize **Grain Guard STEM spark**
3. Win screen CTA order:
   1. **See our services** → https://www.sheehanhomestead.com/services
   2. **Text HIGH SCORE** to **914-263-1311** (screenshot / score)
4. Optional Stead Spin: organic unlock still grants an earn (`?earn=gus|betty|elon`). Soft digital prizes, 1 claim/day, honor-system.

Deal path stays **CODE / GOAT** — do **not** use those for game wins.

### Caps (localStorage, per device)
| Cap | Value | Key |
|-----|-------|-----|
| Plays per character per day | **3** (sophie / gus / betty / elon) | `coc_play_caps_v1` |
| Earned spin claims per day | **1** | `coc_play_caps_v1` |
| Claim per earn token | **1** (gus / betty / elon) | `coc_earned_wheel_spins_v1` |

Quiet QA only (not linked in UI): `pyrenees-guard.html?demoUnlock=gus` · `wheel.html?earn=gus&demo=1`
