import { initializeApp, getApps, cert, ServiceAccount, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getStorage, Storage } from "firebase-admin/storage";

let adminDb: Firestore;
let adminStorage: Storage;

// Only initialize if we have the required env vars (prevents build errors)
const projectId = process.env.FIREBASE_PROJECT_ID;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

if (projectId && privateKey && clientEmail) {
    const serviceAccount: ServiceAccount = {
        projectId,
        privateKey,
        clientEmail,
    };

    let app: App;
    if (!getApps().length) {
        app = initializeApp({
            credential: cert(serviceAccount),
            storageBucket: storageBucket || `${projectId}.appspot.com`,
        });
    } else {
        app = getApps()[0];
    }

    adminDb = getFirestore(app);
    adminStorage = getStorage(app);
} else {
    // Create a mock for build time - actual runtime will have env vars
    console.warn("Firebase Admin SDK not initialized - missing environment variables");
    adminDb = null as unknown as Firestore;
    adminStorage = null as unknown as Storage;
}

export { adminDb, adminStorage };

