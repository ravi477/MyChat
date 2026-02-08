
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, serverTimestamp } = require('firebase/firestore');

const firebaseConfig = {
    apiKey: "AIzaSyCRvuAwbnzhu8eaeAduM6Ii1Ai0tnLmqRk",
    authDomain: "pvr-browser.firebaseapp.com",
    projectId: "pvr-browser",
    storageBucket: "pvr-browser.firebasestorage.app",
    messagingSenderId: "38858847560",
    appId: "1:38858847560:web:9df0eff8e2d123410d2f7d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const staticUsers = [
    {
        uid: 'static_1',
        name: 'James Wilson',
        email: 'james@example.com',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James',
        status: 'online',
        lastSeen: new Date()
    },
    {
        uid: 'static_2',
        name: 'Sarah Parker',
        email: 'sarah@example.com',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
        status: 'away',
        lastSeen: new Date()
    },
    {
        uid: 'static_3',
        name: 'Michael Chen',
        email: 'michael@example.com',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
        status: 'offline',
        lastSeen: new Date()
    }
];

async function seed() {
    console.log('Seeding static users...');
    for (const user of staticUsers) {
        await setDoc(doc(db, 'users', user.uid), {
            ...user,
            lastSeen: serverTimestamp()
        });
        console.log(`Added user: ${user.name}`);
    }
    console.log('Seeding complete!');
    process.exit(0);
}

seed().catch(err => {
    console.error('Seed failed:', err);
    process.exit(1);
});
