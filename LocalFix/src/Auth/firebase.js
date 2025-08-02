// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAExKPjFRgvRppdl21__RalMTuY1e9fraw",
  authDomain: "localfix-f83d1.firebaseapp.com",
  projectId: "localfix-f83d1",
  storageBucket: "localfix-f83d1.firebasestorage.app",
  messagingSenderId: "143158661358",
  appId: "1:143158661358:web:60b25e5077be1d75d5a3ff",
  measurementId: "G-J07W28ZXRQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export {auth};