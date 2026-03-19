import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyC_c2PzJJeI4TVupn6i9zwbJKqn5yS4prM",
  authDomain: "louie-poopometer.firebaseapp.com",
  databaseURL: "https://louie-poopometer-default-rtdb.firebaseio.com",
  projectId: "louie-poopometer",
  storageBucket: "louie-poopometer.firebasestorage.app",
  messagingSenderId: "114737283631",
  appId: "1:114737283631:web:65246418f178a0bc143cda",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
