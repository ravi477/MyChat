import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// TODO: Replace with your actual Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCRvuAwbnzhu8eaeAduM6Ii1Ai0tnLmqRk",
    authDomain: "pvr-browser.firebaseapp.com",
    projectId: "pvr-browser",
    storageBucket: "pvr-browser.firebasestorage.app",
    messagingSenderId: "38858847560",
    appId: "1:38858847560:web:9df0eff8e2d123410d2f7d"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
