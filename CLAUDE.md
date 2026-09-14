# Mock Notifier ("Veloxa") — Build Brief & Decision Record

**Companion to:** `RiderMate-Project-Handoff.md`
**Save this as:** `CLAUDE.md` in the root of a **separate repo** (`ridermate-mock-notifier/`), not inside the RiderMate repo.
**Read fully before writing code.** Sections 1–4 are settled decisions, not open questions.

---

## 1. The Decision

**Build a small, purpose-made mock notifier app. Do not fork a Rapido/Swiggy clone repo.**

This confirms and extends the recommendation in Section 6 of the handoff. The guide's underlying instinct is correct — you *do* need a controllable order source, and you *do* need it to look like a real platform. The disagreement is only about where that comes from.

### Why the fork fails on the one thing that matters

`NotificationListenerService` can only see notifications that were posted to the OS through `NotificationManager.notify()`. It cannot see an in-app screen, a React Native modal, a Flutter bottom sheet, or a socket event.

Almost every "Rapido clone" / "Uber clone" repo on GitHub renders the incoming-order card **as an in-app screen driven by a socket event**, because that's what a tutorial app needs. There is no `NotificationManager.notify()` call anywhere in the pipeline. So after cloning it, you would still have to go into unfamiliar code and add the notification call yourself — which is the *entire* thing you actually needed, and is about 30 lines.

You would be paying the full cost of the fork to get none of the benefit.

### The other four costs of forking

| Cost | Detail |
|---|---|
| **Setup burden** | Typical clone repos are 2–4 moving parts: customer app + driver app + Node/Express backend + MongoDB/Firebase, plus Google Maps API key with billing enabled, plus a payment sandbox. On an i5-1235U with integrated graphics, running a Metro/Expo bundler + a backend + Gradle simultaneously is a bad afternoon. |
| **Bit-rot** | These repos are usually 2–3 years stale. Gradle/AGP/JDK/RN version mismatches are the single most common way student projects lose a week. You would be debugging someone else's dependency tree for zero academic credit. |
| **Trademark & credibility** | Submitting a fork of a repo that ships real Rapido branding is a live trademark issue *and* invites the exact viva question you don't want: "so how much of this did you build?" |
| **Wrong optimisation** | The panel is watching **RiderMate**. The mock is a stage prop. Spending a week on the prop and three days on the actual contribution is backwards. |

### "But I want it to look like the real delivery app"

You get this **more** reliably by building it, not less.

You already have the real Rapido order-card screenshot (handoff §2). Rebuilding that one card in React + CSS is a few hours of work and will look *closer to real Rapido* than a random clone repo does — because clone repos look like clone repos, and you'd be restyling it anyway.

Visual fidelity is a CSS problem, not an architecture problem. Don't buy a whole backend to solve a CSS problem.

### To be explicit about "can I run it flawlessly on my laptop?"

**No — and you don't want to.** The demo does not run on the laptop.

- `NotificationListenerService`, the accelerometer for crash detection, and SMS dispatch for SOS are all **on-device OS capabilities**. There is nothing to run on a laptop.
- Don't use the emulator either: it can't produce a real accelerometer spike, can't send a real SMS, and is the heaviest possible load on your machine.

The real setup is: **two APKs sideloaded onto one physical Android phone.** The laptop is a build machine and (optionally) a remote trigger. That configuration *is* flawless and repeatable, which is exactly what your guide wanted.

---

## 2. The Upgrade That Makes This Defensible: Replay Mode

This is the most important addition to the plan, and it converts the mock from a weakness into a strength.

**Don't invent notification formats. Replay real ones.**

1. Capture real order notifications on your phone (target 20–30, per handoff §10.2). Record the *exact* `android.title` and `android.text` strings.
2. Store them in the mock as a JSON pack: `capture-pack.json`.
3. The mock's "Replay" mode fires those captured strings **verbatim** through `NotificationManager`.

What this buys you:

> **Viva answer:** "The notification text you just saw is verbatim from a real Rapido order captured on 14 March. Only the *delivery* is simulated — the *content* is real field data. We validated the parser against 27 real captures at 84% field-extraction accuracy, and the live demo replays those same captures so the pipeline can be shown on demand rather than depending on an order arriving during the presentation."

That is a genuinely strong, honest answer. It is much better than either "we made up a format" or "we forked a clone." It also means the mock and the real-capture task stop competing for your time — the capture task *feeds* the mock.

Do not drop the real-capture task in favour of the mock. Replay mode is the reason they belong together.

---

## 3. Hard Constraints (MUST / MUST NOT)

**MUST**
- Post notifications through the real Android `NotificationManager`, on a channel with `IMPORTANCE_HIGH`.
- Be a **separate APK with its own package ID**, installed alongside RiderMate. Never bundled into RiderMate's build.
- Work fully offline. No backend, no auth, no network calls, no analytics.
- Use a **fictional brand**. Suggested: `Veloxa Rides` (bike taxi), `Nimbo Mart` (quick commerce), `Karam Eats` (food). Do a 2-minute name search before locking; these are suggestions, not cleared marks.
- Support a configurable delay (0/5/10s) before the notification fires, so the presenter can switch to RiderMate first.

**MUST NOT**
- Use real Rapido / Zepto / Swiggy / Zomato names, logos, colours, or fonts anywhere in the submitted artefact.
- Spoof a real app's package ID (e.g. `com.rapido.rider`). It would collide on-device with the real app and it is deceptive. Use `com.ridermate.mocknotifier`.
- Grow features. No login, no map, no ride lifecycle, no customer app, no order history inside the mock. If a feature isn't "configure a payload and post it," it doesn't belong here.
- Ship a real backend or Firebase.

---

## 4. Tech Stack (locked)

| Layer | Choice | Why |
|---|---|---|
| Framework | **Capacitor + React + TypeScript** | Identical to RiderMate. One toolchain, one skillset, zero new learning. |
| Notification API | **`@capacitor/local-notifications`** (v8.x, match your Capacitor major) | Posts through the real `NotificationManager` — fully visible to `NotificationListenerService`. Supports `largeBody` (BigTextStyle), `group` + `groupSummary` (needed for the degraded-mode scenarios), `channelId`, and `extra`. **No custom Kotlin required for the core mock.** |
| Styling | Plain CSS / CSS Modules | The card is one screen. Don't pull in a UI kit. |
| Storage | `localStorage` | Scenario presets and the capture pack. Nothing else. |
| Backend | **None** | — |

Optional native add-on (M5 only): one small Kotlin `BroadcastReceiver` for laptop-triggered firing. Everything before that is pure JS.

**Android 13+:** `POST_NOTIFICATIONS` is a runtime permission. Call `checkPermissions()` / `requestPermissions()` on first launch. (Plugin ≥8.3.0 auto-requests before scheduling, but request explicitly anyway so the demo never shows a permission dialog on stage.)

---

## 5. Toolchain Setup for Your Machine

Your constraints from prior setup: Dell Inspiron i5-1235U, Claude Code runs reliably **only inside WSL2 Ubuntu-22.04** (native Windows BSODs), Docker Desktop present.

**Do this:**

1. Work entirely inside WSL2. Keep the repo in the **Linux filesystem** (`~/projects/ridermate-mock-notifier`), **never** under `/mnt/c/`. The 9p filesystem bridge makes `node_modules` and Gradle builds several times slower.
2. Inside WSL2, install: Node 20+ (via `nvm`), OpenJDK 17, and the Android **command-line tools** only.
   ```bash
   sdkmanager "platform-tools" "platforms;android-35" "build-tools;35.0.0"
   ```
   Match the API level your Capacitor version targets. **Do not install Android Studio or any emulator image.**
3. **Connecting the phone from WSL2** — USB does not pass through by default. Two options:
   - **Wireless debugging (recommended).** Phone → Developer options → Wireless debugging → Pair device with pairing code. Then from WSL2: `adb pair <ip>:<pairport>` and `adb connect <ip>:<port>`. Outbound LAN access works from WSL2's NAT, so this generally just works and needs no extra software.
   - **USB via `usbipd-win`.** Install on Windows, then `usbipd bind --busid <id>` and `usbipd attach --wsl`. More setup, but stable once done.
4. Release APK builds go through **GitHub Actions** (already your plan). Local Gradle debug builds via `npx cap run android` are fine for daily work.

---

## 6. Repo Layout

```
ridermate-mock-notifier/
├── CLAUDE.md                    ← this file
├── capacitor.config.ts
├── src/
│   ├── App.tsx
│   ├── screens/
│   │   ├── OrderCard.tsx        ← the "real-looking" screen
│   │   └── ControlPanel.tsx     ← scenario picker (demo operator view)
│   ├── data/
│   │   ├── platforms.ts         ← 3 fictional platform profiles
│   │   ├── scenarios.ts         ← named presets
│   │   └── capture-pack.json    ← REAL captured notification strings
│   ├── lib/
│   │   ├── notify.ts            ← the only file that touches LocalNotifications
│   │   └── templating.ts        ← fills {fare}/{km}/{area} into format strings
│   └── styles/
└── android/
```

Single responsibility rule: **`lib/notify.ts` is the only place that posts a notification.** Everything else builds a payload object and hands it over. This keeps the one thing that must be correct in one reviewable file.

---

## 7. The Notification Contract

This is the spec the parser on the RiderMate side will be built against.

### Payload shape

```ts
type MockNotification = {
  id: number;
  channelId: 'veloxa_orders';       // IMPORTANCE_HIGH
  title: string;                    // → android.title
  body: string;                     // → android.text
  largeBody?: string;               // → BigTextStyle (android.bigText)
  summaryText?: string;             // → android.subText
  group?: string;                   // set only for grouping scenarios
  groupSummary?: boolean;
  extra?: Record<string, unknown>;  // NOT parsed by RiderMate — see note
};
```

**Important:** RiderMate must parse `title` / `body` / `largeBody` **as text**, exactly as it would for a real app. It must **never** read the `extra` field. Passing structured JSON through `extra` would be cheating — the real Rapido app will never do that, and a sharp panel member will ask. Keep `extra` empty, or use it only for internal mock bookkeeping that RiderMate ignores.

### Format templates (starting point — replace with real captures ASAP)

Modelled on the real Rapido card in handoff §2 (fare ₹48 + ₹12 cash = ₹60, pickup 1.0 km, drop 3.4 km, area names).

**Veloxa Rides**
```
title:     New ride · ₹{total}
body:      Pickup {pickupKm} km · Drop {dropKm} km · {pickupArea} → {dropArea}
largeBody: Fare ₹{fare} + ₹{cash} collect
           Pickup: {pickupArea} ({pickupKm} km)
           Drop: {dropArea} ({dropKm} km)
```

**Nimbo Mart**
```
title:     New order #{orderId}
body:      ₹{total} · {dropKm} km · {storeName}
```

**Karam Eats**
```
title:     Order available
body:      ₹{total} payout · {dropKm} km · {dropArea}
```

Note the deliberate variation: different field order, different labels, some with two distance legs and some with one. This is what forces the parser table to be a real table rather than one hardcoded regex, and it's what you show in the report.

### Both-legs profit calculation

Per handoff §2, the profit calc must use **pickup + drop** distance (1.0 + 3.4 = 4.4 km), not drop alone. The Veloxa template exposes both legs so RiderMate can be demonstrated doing this correctly. Nimbo/Karam expose only one leg — that's realistic, and it's a good report point about accuracy degrading when the platform gives less data.

---

## 8. Screen Spec — The Order Card

Model this **directly from your Rapido screenshot**, not from memory. Match the visual grammar, not the branding.

Anatomy to reproduce:

- Card slides up from the bottom over a dimmed backdrop (or full-screen — match your screenshot).
- A **countdown ring or depleting bar** at the top. This is the single detail that most makes it read as "real platform." 15s default.
- **Fare in very large type**, top-left. Payment mode chip beside it (`CASH` / `ONLINE`).
- **Two-stop route block:** filled dot → vertical connector line → hollow dot/square. Each stop shows a distance badge and an area name. Pickup row on top, drop row below.
- Total-distance summary line.
- **Full-width ACCEPT button** in the platform's accent colour. A secondary reject/dismiss.
- Sound + vibration on appearance.

Deliberate differences from RiderMate's own design language — the mock should **not** use Manrope / Dark Emerald Green / Remixicon. Give Veloxa its own look (e.g. a bright orange or blue accent, a different sans-serif). When both apps are on screen during the demo, they must look like two different companies' products, because that's the entire point.

Add a small, permanent, low-key `SIMULATOR` watermark in a corner. It costs you nothing in visual fidelity and it removes any accusation of misrepresentation before it's made.

---

## 9. Control Panel & Scenarios

A second screen (reachable by long-press on the logo, or a tab) where the operator configures what gets fired.

**Controls:** platform selector · fare · cash component · pickup km · drop km · area names · fire delay (0/5/10s) · scenario preset dropdown · Fire button.

**Named presets — these are your demo script:**

| Preset | Payload | What it demonstrates in RiderMate |
|---|---|---|
| `good_order` | ₹95, 1.2 + 3.0 km | Profit glance shows healthy net ₹ |
| `bad_order` | ₹38, 2.5 + 9.4 km | Profit warning fires — below rider's ₹/km baseline |
| `unusual_payout` | ₹30, 0.5 + 7.0 km | Unusual-payout flag |
| `long_pickup_trap` | ₹70, 6.0 + 1.5 km | Both-legs calculation matters — looks fine on drop distance alone, bad on total |
| `burst_of_three` | 3 notifications, same `group` | Android grouping/collapse — RiderMate's degraded-input handling |
| `truncated` | body cut mid-field | Partial parse → manual-entry fallback prompt |
| `minimal_info` | "New ride available", no numbers | Full fallback path — manual entry card |
| `replay_real_*` | verbatim from `capture-pack.json` | Real-format parsing |

The last four are not padding. **Firing the degraded scenarios on purpose is a contribution, not an admission.** Handoff §2 identifies notification unreliability as the project's main technical risk; the mock lets you *instrument* that risk and report a measured accuracy figure across input quality tiers. Most student projects hide their failure mode. Yours will have a table quantifying it.

Suggested table for the report:

| Input quality | Samples | Fields extracted correctly | Fallback triggered |
|---|---|---|---|
| Full (rich body + bigText) | n | % | % |
| Truncated | n | % | % |
| Grouped/collapsed | n | % | % |
| Minimal | n | % | % |
| **Real captures (field)** | 27 | 84% | 16% |

---

## 10. Integration Contract with RiderMate

Changes needed **on the RiderMate side** so the two apps fit together honestly.

1. **Parser table gets a `source` concept**, not just a package regex:
   ```json
   {
     "source_id": "veloxa_sim",
     "package_name": "com.ridermate.mocknotifier",
     "platform_label": "Veloxa Rides",
     "is_simulator": true,
     "patterns": [
       { "name": "ride_full", "regex": "...", "fields": ["total","pickupKm","dropKm","pickupArea","dropArea"] },
       { "name": "ride_minimal", "regex": "...", "fields": [] }
     ]
   }
   ```
2. **`orders` table gets a `source` column**: `'simulator' | 'real' | 'manual'`. This flows into the hash chain like any other field.
3. **UI badges simulator rows.** Any order with `source = 'simulator'` renders with a visible `SIM` tag in the log and summary.
4. **Weekly summary and exported PDF exclude simulator rows by default**, with an explicit toggle. The exported work record must never silently contain simulated earnings.

Point 4 matters more than it looks. A tamper-evident work-record export that can be silently seeded with fake orders is not tamper-evident. Building the exclusion in — and saying so in the viva — is exactly the kind of integrity detail that separates a strong project from a demo.

5. **Whitelist `com.android.shell`** in the parser table as a dev-only source, so `adb`-posted test notifications (§11) aren't dropped by package filtering. Remove or flag it before submission.

---

## 11. Build Phases — Prompts for Claude Code

Per handoff §7: **one phase at a time, tested on the physical phone before the next.** Never let the agent build ahead. Use Plan Mode for M2 and M5.

### M0 — Scaffold
> Scaffold a Capacitor + React + TypeScript app in this repo. App name "Veloxa", package ID `com.ridermate.mocknotifier`. Add the Android platform. Add `@capacitor/local-notifications` matching the installed Capacitor major version. No features, no UI beyond a placeholder. Update `.gitignore` for Android build artefacts. Then stop and tell me the exact commands to build and install a debug build on a physical device from WSL2.

**Verify:** app installs and launches on the phone.

### M1 — The notification core
> Implement `src/lib/notify.ts` as the single module that posts notifications. It exposes one function `postMockNotification(payload: MockNotification)` using `@capacitor/local-notifications`. Create the `veloxa_orders` channel at `IMPORTANCE_HIGH`. Handle Android 13+ `POST_NOTIFICATIONS` on first launch. Support `title`, `body`, `largeBody`, `summaryText`, `group`, `groupSummary`, and a `delayMs` parameter. Add a temporary bare screen with hardcoded values and a "Fire" button. No styling yet.

**Verify — this is the make-or-break gate:**
```bash
# 1. Notification appears in the shade
# 2. Confirm what a listener would actually see:
adb shell dumpsys notification --noredact | grep -A 20 "com.ridermate.mocknotifier"
```
Confirm `android.title`, `android.text`, and `android.bigText` contain exactly the strings you set. If this works, the whole plan works. **Do not proceed to M2 until this passes.**

Pre-RiderMate smoke test with no app at all:
```bash
adb shell cmd notification post -S bigtext -t 'New ride · ₹60' tag1 'Pickup 1.0 km · Drop 3.4 km'
```
(Posts under `com.android.shell` — see §10.5.)

### M2 — The order card UI
> Build `src/screens/OrderCard.tsx` styled to match the delivery-platform order card described in section 8 of CLAUDE.md. Countdown ring, large fare, payment chip, two-stop route block with connector line and per-leg distances, full-width ACCEPT button, sound + vibration on appear, permanent low-key SIMULATOR watermark. Use the Veloxa visual identity — deliberately different from RiderMate's Manrope/emerald design. Tapping ACCEPT calls `postMockNotification`. Attach the screenshot at `/design/rapido-card.png` as the layout reference.

*(Put your Rapido screenshot in `/design/` and reference it in the prompt — Claude Code can read it and match the layout.)*

### M3 — Platforms, templates, scenarios
> Add `src/data/platforms.ts` with the three fictional platform profiles and their format templates from section 7. Add `src/lib/templating.ts` to fill placeholders. Add `src/data/scenarios.ts` with the named presets from section 9. Build `src/screens/ControlPanel.tsx` with the controls listed there, persisting to localStorage. Preset selection populates the order card; Fire posts after the configured delay.

### M4 — Replay pack
> Add `src/data/capture-pack.json` holding real captured notifications as `{ id, capturedAt, platform, title, body, bigText, notes }`. Add a Replay tab in the control panel listing them, firing the stored strings **verbatim** with no templating or modification. Include a JSON import button so new captures can be added without a rebuild.

### M5 — Optional: laptop trigger
> Add a Kotlin `BroadcastReceiver` (`FireReceiver`) registered in the manifest that accepts a `scenario` string extra, resolves it against the scenario list, and posts the corresponding notification without bringing the app to the foreground.

```bash
adb shell am broadcast -n com.ridermate.mocknotifier/.FireReceiver \
  --es scenario good_order --include-stopped-packages
```
Why this is worth 30 minutes: the phone stays on RiderMate's screen for the whole demo. You tap your laptop, and an order appears. The panel never sees you switch apps, which is the difference between a demo and a magic trick. `--include-stopped-packages` is required if the mock has been force-stopped.

---

## 12. Demo Runbook

**Night before (not minutes before):**
- [ ] Full run-through on the actual demo phone, on battery, in aeroplane mode where relevant.
- [ ] Confirm RiderMate's **Notification Access** is granted — Settings → Apps → Special app access → Notification access. This can silently reset after reinstalling a fresh debug build (handoff §6). Re-grant and re-verify.
- [ ] `adb shell dumpsys notification --noredact` confirms payloads still parse.
- [ ] Battery saver / Doze exemptions set for both apps.
- [ ] Phone on Do Not Disturb *except* the mock's channel, so no WhatsApp message lands mid-demo.
- [ ] **Record a screen capture of RiderMate correctly parsing a real order notification.** This is your fallback artefact if anything fails live, and it's evidence for the report regardless.

**Demo sequence (~4 min):**
1. Show RiderMate idle on the home screen.
2. Fire `good_order` → profit glance shows healthy net.
3. Fire `long_pickup_trap` → explain the both-legs calculation while it lands.
4. Fire `bad_order` → warning fires.
5. Fire `truncated` → show the manual-entry fallback engaging gracefully.
6. Fire `replay_real_01` → "this is verbatim from a real Rapido order captured on <date>."
7. Open the weekly summary. Point out the `SIM` tags and that simulated rows are excluded from the export.

Step 5 is the one most students would skip. Don't. Demonstrating graceful degradation on purpose is stronger than pretending it never degrades.

---

## 13. What to Say to Your Guide

Frame it as *adopting* the idea, not rejecting it — because you are.

> "Sir, we took your suggestion about using a controlled clone app so the demo isn't dependent on catching a live order. We looked at the clone repos on GitHub and found a technical blocker: they render the order as an in-app screen, not as an OS-level notification, and `NotificationListenerService` can only read OS notifications. So the fork wouldn't actually feed our pipeline without us adding the notification layer ourselves anyway.
>
> So we built a minimal simulator that does exactly the part we need — it posts real Android system notifications in the format we captured from real Rapido orders. It took an afternoon instead of a week of dependency fixing, it uses no real platform branding so there's no trademark issue in the submission, and it also replays our 27 real captured notifications verbatim, so we can report both mock-validated and field-validated accuracy in the paper."

Three things that land there: you took the suggestion seriously, you found a concrete technical reason, and you came back with something *better measured* than what was asked for.

---

## 14. Report & Viva Framing

Non-negotiable honesty rules, per handoff §6:

- Always call it a **simulator** or **controlled notification source**. Never imply the demo ran against a live platform.
- Both numbers appear in the report: **mock-validated pipeline correctness** *and* **real-capture field accuracy (n = X, Y%)**. The mock does not replace the field number.
- The standard question — *"does this work with the real app?"* — has a prepared answer:

  > "Yes, and we measured it. We captured N real order notifications from Swiggy, Zepto and Rapido and our parser extracted the payout and distance fields correctly in Y% of them. The remaining Z% were cases where Android collapsed or truncated the notification, and those route to manual entry rather than being silently dropped. The live demo uses a simulator that replays those same captured formats, so the pipeline can be shown on demand rather than depending on a qualifying order arriving during a five-minute presentation window."

- The `is_simulator` flag, the `SIM` badge, and export exclusion (§10) are not implementation trivia — mention them. They demonstrate that the tamper-evident claim was taken seriously rather than asserted.

---

## 15. Explicitly Do Not

- Do not fork a clone repo. (§1)
- Do not pass structured JSON through notification `extra` for RiderMate to read. Parse text. (§7)
- Do not spoof a real platform's package ID. (§3)
- Do not use real logos, names, or brand colours in the submitted artefact. (§3)
- Do not add features to the mock. Login, maps, order lifecycle, a customer app — all out of scope, permanently.
- Do not install an emulator or Android Studio. (§5)
- Do not put the repo under `/mnt/c/`. (§5)
- Do not let the mock become a substitute for capturing real notifications. It's a multiplier on that work, not a replacement. (§2)
- Do not build ahead of the current phase. (§11)

---

*Companion document to `RiderMate-Project-Handoff.md`. Sections 1–4 and 15 are settled; treat them as constraints, not proposals.*
