# Nook — Moments Diary & Memory Journal

> An intimate moments diary and friends-only memory journal Progressive Web App (PWA). Capture genuine, raw moments, apply warm film filters, track daily streaks, and stay close to your circle.

---

## ✨ Features

- **📸 Dual-Camera Mode (Main + Selfie PiP)**: Capture both perspectives (environment + selfie reaction) in one moment, with interactive tap-to-swap in the feed.
- **🎨 Creative Studio Doodling**: Freehand drawing pen with vibrant neon color swatches, smoothing, and clear controls.
- **✨ Draggable Emoji Stickers**: Place and reposition fun expressive stickers across your captured moments.
- **🎙️ Voice Memos & Waveform Player**: Record audio thoughts with live timer, preview, and an interactive waveform player in feed cards.
- **💾 IndexedDB Unlimited Media Storage (NookDB)**: Seamless local-first storage capable of handling high-resolution photos and audio clips without browser quota limitations.
- **🎞️ Analog 35mm Grain & Vignette Sliders**: Customizable real-time film grain texture and optical corner falloff.
- **🔊 Synthesized Mechanical Shutter**: Retro tactile sound effect generated directly with Web Audio API.
- **📅 Memories Calendar & Streaks**: Monthly memory view, daily prompt generator, and streak tracking.
- **📱 Locket Mode Widget Simulator**: Live lockscreen widget demonstration with dynamic real-time clock.
- **❤️ Floating Emoji Reactions & Notes**: Physics-based floating particles on reaction.
- **⚡ Offline-First PWA**: Installable standalone app with Service Worker caching.

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
