// src/firebase.js
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDcjLslqHE4cD4YhVkS9M4SGYuJ02bT8sY",
    authDomain: "watersubstracker.firebaseapp.com",
      databaseURL: "https://watersubstracker-default-rtdb.asia-southeast1.firebasedatabase.app",
        projectId: "watersubstracker",
          storageBucket: "watersubstracker.firebasestorage.app",
            messagingSenderId: "337275338555",
              appId: "1:337275338555:web:57ac0c213170d8c8dc811e"
              };

              const app = initializeApp(firebaseConfig);
              const database = getDatabase(app);

              export { database };
              