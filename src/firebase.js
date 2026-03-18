// =============================================================
//  SETUP INSTRUCTIONS
// =============================================================
//  1. Go to https://console.firebase.google.com
//  2. Click "Create a project" (or "Add project"), name it anything
//  3. Skip Google Analytics (not needed)
//  4. In the project dashboard, click the web icon </> to add a web app
//  5. Register it with any nickname, skip hosting
//  6. Copy your config values into the object below
//  7. Then in the Firebase console sidebar:
//       - Click "Build" → "Realtime Database"
//       - Click "Create Database"
//       - Choose any region, start in TEST MODE
//       - Done!
// =============================================================

import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "PASTE_YOUR_API_KEY_HERE",
  authDomain: "PASTE_YOUR_AUTH_DOMAIN_HERE",
  databaseURL: "PASTE_YOUR_DATABASE_URL_HERE",
  projectId: "PASTE_YOUR_PROJECT_ID_HERE",
  storageBucket: "PASTE_YOUR_STORAGE_BUCKET_HERE",
  messagingSenderId: "PASTE_YOUR_SENDER_ID_HERE",
  appId: "PASTE_YOUR_APP_ID_HERE",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
