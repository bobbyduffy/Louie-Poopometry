# 🐶 Louie's Potty Log

A simple, mobile-friendly web app to track your puppy's bathroom breaks and accidents. Both you and your partner can log entries from your phones and everything syncs in real time via Firebase.

![Louie's Potty Log](https://img.shields.io/badge/status-ready%20to%20deploy-brightgreen)

## Features

- **Quick logging** — tap to log pee/poop, inside/outside, with optional notes
- **Daily timeline** — entries grouped by day with easy delete
- **Weekly stats** — pees, poops, accidents, and success rate
- **14-day chart** — see total breaks vs accidents over time
- **Time-of-day heatmap** — spot patterns in the last 7 days
- **Real-time sync** — both users see updates instantly

## Setup (5 minutes)

### 1. Create a Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **"Create a project"** — name it anything (e.g. `louie-tracker`)
3. Skip Google Analytics → click **Create**
4. On the project dashboard, click the **web icon `</>`** to add a web app
5. Register with any name, **skip Firebase Hosting**
6. You'll see a config object — keep this tab open

### 2. Create the Realtime Database

1. In the Firebase Console sidebar, go to **Build → Realtime Database**
2. Click **Create Database**
3. Choose any region
4. Select **Start in test mode** → click Enable

> ⚠️ Test mode allows open access for 30 days. That's fine for personal use. If you want to keep it running longer, update the rules to allow authenticated access.

### 3. Add your Firebase config

Open `src/firebase.js` and replace the placeholder values with your config:

```js
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "louie-tracker-xxxxx.firebaseapp.com",
  databaseURL: "https://louie-tracker-xxxxx-default-rtdb.firebaseio.com",
  projectId: "louie-tracker-xxxxx",
  storageBucket: "louie-tracker-xxxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123",
};
```

### 4. Install and run locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173` on your phone and computer — they'll sync!

## Deploy for free

### Option A: Netlify (easiest)

1. Push this repo to GitHub
2. Go to [netlify.com](https://netlify.com) → **Add new site → Import from Git**
3. Connect your GitHub repo
4. Build command: `npm run build`
5. Publish directory: `dist`
6. Click **Deploy**

You'll get a URL like `louie-tracker.netlify.app` — bookmark it on both phones!

### Option B: Vercel

1. Push to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project → Import**
3. It auto-detects Vite — just click **Deploy**

### Option C: GitHub Pages

1. Install: `npm install -D gh-pages`
2. Add to `package.json` scripts: `"deploy": "npm run build && gh-pages -d dist"`
3. In `vite.config.js`, set `base: '/your-repo-name/'`
4. Run: `npm run deploy`

## Add to Home Screen (feels like a native app!)

On your phone, open the deployed URL in Safari/Chrome:
- **iPhone**: Tap Share → "Add to Home Screen"
- **Android**: Tap ⋮ menu → "Add to Home Screen"

## Tech

- React 18 + Vite
- Firebase Realtime Database
- No dependencies beyond React and Firebase
- Fully responsive, mobile-first design
