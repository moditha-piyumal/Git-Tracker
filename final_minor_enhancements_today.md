# ⚙️ Git-Tracker v2 — Final Minor Enhancements (Today’s Plan)

> Goal: Apply a small, high‑impact polish set and publish the repo today. We’ll proceed step‑by‑step but quickly.

---

## A) Dashboard & UI Enhancements

1. **Chart legend toggles**  
   - Allow hiding/showing specific datasets (Lines Added, Lines Removed, Total Edits).  
   - *Done when:* User can click legend items to toggle lines.

2. **Tooltips on buttons**  
   - Hover hints for **Run Tracker Now** and **View Full History** buttons.  
   - *Done when:* Titles/tooltip text appear on hover.

3. **Display last run duration + status**  
   - Show directly under the status banner (e.g., “Last: 1.2s • success”).  
   - *Done when:* Values update after manual run and on load.

4. **Developer Signature Banner (fixed footer)**  
   - Text: _“This software was made by **Moditha Piyumal**, also known as **Elpitiya Sworn Translator**, a Freelance Developer!”_  
   - CSS: `position: fixed; bottom: 0; left: 0; width: 100%;` (dark theme friendly).  
   - *Done when:* Persistent on all dashboard views without overlapping charts.

---

## B) Functionality & Reliability

5. **Renderer‑side error logging**  
   - Log UI/IPC errors to `tracker/data/ui-errors.log`.  
   - *Done when:* Failures append a readable line with timestamp + context.

---

## C) Documentation / Testing / Presentation

6. **README.md**  
   - Screenshots, setup steps, Task Scheduler guide, demo DB note.  
   - *Done when:* README is usable for first‑time users.

7. **/docs/screenshots/**  
   - Capture 5–6 images (dashboard overview + each chart + history view).  
   - *Done when:* Folder exists and README references them.

8. **Demo seed script (npm)**  
   - Add to `package.json`: `"seed-demo": "node seed_demo_history.js --days 365"`.  
   - *Done when:* Running `npm run seed-demo` creates a demo DB.

9. **Badges system (achievements) — placeholder UI**  
   - Add a badge strip **below the history chart** in `historyWindow.html`.  
   - Show placeholder badges (e.g., 🔥 Streak 7, 30; 🧱 10k edits). Real rules later.  
   - *Done when:* UI renders static example badges from a small JSON/config.

10. **Version & license badges**  
   - Display in dashboard header + in README (shields).  
   - *Done when:* Shows `v2.0.0` (from `package.json`) and license badge.

11. **Basic Jest tests**  
   - Cover: DB insert/SELECT round‑trip, streak calculator, moving average calc.  
   - *Done when:* `npm test` runs and passes locally.

---

## Quick Order of Execution

1) UI: items 1–4 → 2) Logging: item 5 → 3) Docs/Screens: items 6–7 → 4) Seed script: item 8 → 5) Badges placeholder: item 9 → 6) Version badges: item 10 → 7) Tests: item 11.

---

## Checkboxes (tick as we go)

- [ ] 1 Legend toggles
- [ ] 2 Button tooltips
- [ ] 3 Last run duration/status block
- [ ] 4 Signature banner (fixed)
- [ ] 5 Renderer error logging
- [ ] 6 README
- [ ] 7 Screenshots folder
- [ ] 8 Demo seed script
- [ ] 9 Badges placeholder below history chart
- [ ] 10 Version/license badges
- [ ] 11 Basic Jest tests

---

**Author:** Moditha Piyumal (Elpitiya Sworn Translator)  
**Date:** October 27, 2025  
**Version Target:** v2.0.0 (GitHub initial release)

