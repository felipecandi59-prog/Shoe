// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCcJZKUtXfp4g0vWGO3SmCtnqDfEwY7PyQ",
  authDomain: "shoe-5873a.firebaseapp.com",
  projectId: "shoe-5873a",
  storageBucket: "shoe-5873a.firebasestorage.app",
};

// Inicializa Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
