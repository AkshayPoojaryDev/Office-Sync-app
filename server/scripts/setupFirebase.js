// server/scripts/setupFirebase.js
// Script to initialize Firestore collections and set up admin user
// Run with: node scripts/setupFirebase.js <admin-email>

require('dotenv').config();
const admin = require('firebase-admin');
const readline = require('readline');

// Initialize Firebase
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || '../serviceAccountKey.json';
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Collections that need to exist for the app to function
const REQUIRED_COLLECTIONS = [
    {
        name: 'users',
        description: 'Stores user profiles and roles',
        sampleDoc: {
            email: 'sample@example.com',
            role: 'user',
            displayName: 'Sample User',
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
        }
    },
    {
        name: 'daily_stats',
        description: 'Stores daily beverage order counts',
        sampleDoc: {
            tea: 0,
            coffee: 0,
            juice: 0,
            orders: [],
            lastUpdated: new Date().toISOString()
        }
    },
    {
        name: 'notices',
        description: 'Stores office announcements',
        sampleDoc: {
            title: 'Welcome to OfficeSync',
            message: 'This is your office announcement board. Admins can post important updates here.',
            author: 'admin@example.com',
            authorName: 'Admin',
            type: 'general',
            isPinned: true,
            timestamp: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
    }
];

async function setupCollections() {
    console.log('\n📦 Setting up Firestore collections...\n');

    for (const collection of REQUIRED_COLLECTIONS) {
        try {
            // Check if collection has any documents
            const snapshot = await db.collection(collection.name).limit(1).get();

            if (snapshot.empty) {
                console.log(`  ⚠️  Collection '${collection.name}' is empty`);
                console.log(`     Description: ${collection.description}`);

                // For notices, create a welcome notice
                if (collection.name === 'notices') {
                    await db.collection('notices').add(collection.sampleDoc);
                    console.log(`     ✅ Created welcome notice`);
                } else if (collection.name === 'daily_stats') {
                    // Create today's stats document
                    const today = new Date().toISOString().split('T')[0];
                    await db.collection('daily_stats').doc(today).set(collection.sampleDoc);
                    console.log(`     ✅ Initialized today's stats (${today})`);
                }
            } else {
                console.log(`  ✅ Collection '${collection.name}' exists (${snapshot.size}+ documents)`);
            }
        } catch (error) {
            console.error(`  ❌ Error checking '${collection.name}':`, error.message);
        }
    }
}

async function setAdminUser(email) {
    if (!email) {
        console.log('\n⚠️  No email provided. Skipping admin setup.');
        console.log('   To set an admin, run: node scripts/setupFirebase.js admin@example.com');
        return;
    }

    console.log(`\n👑 Setting up admin user: ${email}`);

    try {
        // Get user by email
        const userRecord = await admin.auth().getUserByEmail(email);
        const uid = userRecord.uid;

        // Update or create user document with admin role
        await db.collection('users').doc(uid).set({
            email: email,
            role: 'admin',
            displayName: userRecord.displayName || email.split('@')[0],
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
        }, { merge: true });

        console.log(`  ✅ Successfully set '${email}' as admin`);
        console.log(`     UID: ${uid}`);

    } catch (error) {
        if (error.code === 'auth/user-not-found') {
            console.log(`  ❌ User '${email}' not found in Firebase Auth`);
            console.log('     The user must sign up/log in at least once before being set as admin');
        } else {
            console.error(`  ❌ Error setting admin:`, error.message);
        }
    }
}

async function listAdmins() {
    console.log('\n📋 Current admin users:');

    try {
        const adminsSnapshot = await db.collection('users')
            .where('role', '==', 'admin')
            .get();

        if (adminsSnapshot.empty) {
            console.log('  No admin users found');
        } else {
            adminsSnapshot.forEach(doc => {
                const data = doc.data();
                console.log(`  • ${data.email} (${doc.id})`);
            });
        }
    } catch (error) {
        console.error('  Error listing admins:', error.message);
    }
}

async function main() {
    const args = process.argv.slice(2);
    const adminEmail = args[0];

    console.log('═══════════════════════════════════════════');
    console.log('      OfficeSync Firebase Setup Script      ');
    console.log('═══════════════════════════════════════════');

    // Setup collections
    await setupCollections();

    // List current admins
    await listAdmins();

    // Set admin if email provided
    if (adminEmail) {
        await setAdminUser(adminEmail);
    }

    console.log('\n═══════════════════════════════════════════');
    console.log('                 Complete!                  ');
    console.log('═══════════════════════════════════════════\n');

    process.exit(0);
}

main().catch(error => {
    console.error('Setup failed:', error);
    process.exit(1);
});
