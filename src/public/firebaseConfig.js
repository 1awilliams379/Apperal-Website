import { initializeApp } from "firebase/app";
const firebaseConfig = {
    apiKey: "AIzaSyDXuFouMhVCavQyzPWk-Al1xu7fSqgc8YQ",
    authDomain: "relentlessbtl.firebaseapp.com",
    databaseURL: "https://relentlessbtl-default-rtdb.firebaseio.com",
    projectId: "relentlessbtl",
    storageBucket: "relentlessbtl.appspot.com",
    messagingSenderId: "66156275759",
    appId: "1:66156275759:web:e995da5cf635aae937beda",
    measurementId: "G-ZXQYTJWH4H"
};

export const app = initializeApp(firebaseConfig);