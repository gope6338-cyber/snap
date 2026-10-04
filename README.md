# Nook — Moments Diary & Memory Journal

> An intimate moments diary and friends-only memory journal Progressive Web App (PWA). Capture genuine, raw moments, apply warm film filters, track daily streaks, and stay close to your circle.

---

## ✨ Features

- **📸 In-App Viewfinder & Camera**: Capture live moments using your device's webcam / mobile camera (`navigator.mediaDevices.getUserMedia`) with front/rear switching, physical mechanical shutter sound (synthesized via Web Audio API), and instant flash effect.
- **🎞️ Film Aesthetic Filters**: Apply instant real-time photo filters including *Warm Sun*, *35mm Noir*, *Vintage Film*, *Cyber Neon*, and *Velvet Glow*.
- **🔥 Daily Reflection Prompts & Streaks**: Never miss a beat with inspirational daily reflection questions and continuous streak tracking.
- **📅 Memories Calendar**: Browse your visual archive by month and day with interactive timeline cards.
- **📱 Locket Mode Widget Simulator**: Preview your latest shared moment as a dynamic home screen / lock screen widget.
- **❤️ Floating Emoji Reactions & Notes**: Tap to react with floating physics-based emoji bursts and write notes on shared moments.
- **🔒 Local-First Privacy**: Moments are stored locally on your device (`localStorage` / IndexedDB). Includes one-click JSON backup export and restore.
- **⚡ Offline-First PWA**: Installable on iOS, Android, and Desktop with offline caching via Service Worker.

---

## 📁 Project Structure

```text
nook/
├── index.html        # Semantic HTML5 app structure, views, and native <dialog> modals
├── styles.css        # Premium dark glassmorphism design system & micro-animations
├── app.js            # Reactive application logic, camera capture, audio synthesis & storage
├── manifest.json     # PWA manifest (standalone display, theme colors, shortcuts)
├── sw.js             # Service Worker for offline asset caching and stale-while-revalidate
├── icon.svg          # Modern glowing camera aperture vector app icon
├── package.json      # Project metadata and quick development scripts
└── README.md         # Documentation & guide
```

---

## 🚀 Running Locally

No complicated build tooling or node compilation required! You can run Nook directly with any static server:

```bash
# Option 1: Using npx serve
npx serve -l 3000 .

# Option 2: Using Python built-in HTTP server
python -m http.server 3000
```

Then open your browser at `http://localhost:3000`.

---

## 📲 Installing as a PWA

1. Open Nook in your mobile browser (Chrome on Android or Safari on iOS).
2. Tap the browser menu or share button and select **"Add to Home Screen"** or **"Install App"**.
3. Launch Nook directly from your home screen for an edge-to-edge native app experience.

---

## 🛡️ Roadmap: Friends-Only Backend

The current prototype is local-first. Future updates will introduce:
- **End-to-End Encrypted Group Spaces**: Private circles with invitation codes.
- **Cloud Sync**: Supabase / Firebase backend for real-time live widget push notifications.
- **Live Widgets**: Native iOS WidgetKit and Android AppWidget integrations.

---

## 📄 License

MIT © [gope6338-cyber](https://github.com/gope6338-cyber)
