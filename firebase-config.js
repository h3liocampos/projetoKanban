import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBCzYxYx2-HSr2yQkwyurdzuT0WDM6TjY4",
  authDomain: "projetokanban-1dbf4.firebaseapp.com",
  projectId: "projetokanban-1dbf4",
  storageBucket: "projetokanban-1dbf4.firebasestorage.app",
  messagingSenderId: "258763961851",
  appId: "1:258763961851:web:d0027f04447db69279475e",
  measurementId: "G-LGJ66KX8KZ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
