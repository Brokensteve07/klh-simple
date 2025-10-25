import React, { createContext, useContext, useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    signInAnonymously, 
    signInWithCustomToken, 
    onAuthStateChanged, 
    signOut, 
    setPersistence, 
    browserLocalPersistence,
    createUserWithEmailAndPassword, // Added for email auth
    signInWithEmailAndPassword, // Added for email auth
    GoogleAuthProvider, // <-- ADDED
    signInWithPopup // <-- ADDED
} from 'firebase/auth';
import { 
    getFirestore, 
    doc, 
    setDoc, 
    collection, 
    query, 
    where, 
    onSnapshot, 
    getDocs, 
    addDoc, 
    serverTimestamp, 
    deleteDoc 
} from 'firebase/firestore';
import { setLogLevel } from 'firebase/app'; 

setLogLevel('debug'); // Enable detailed logging

const FirebaseContext = createContext(null);

export const useFirebase = () => useContext(FirebaseContext);

// --- FALLBACK CONFIGURATION (CRITICAL FIX) ---
// This is your specific configuration
const YOUR_REAL_FIREBASE_CONFIG = {
  apiKey: "AIzaSyCqcPiFs6Zkpjp11NpK29LH5VJAd_onGJM",
  authDomain: "klh-connect-campus-hub.firebaseapp.com",
  projectId: "klh-connect-campus-hub",
  storageBucket: "klh-connect-campus-hub.firebasestorage.app",
  messagingSenderId: "341301807076",
  appId: "1:341301807076:web:a002cee3c4e7803224a9f1",
  measurementId: "G-6G4E08T1D9"
};
// --- END FALLBACK CONFIG ---

// Get global config variables (Mandatory for Canvas environment)
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : YOUR_REAL_FIREBASE_CONFIG;
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
// --- THIS IS THE FIX ---
// We force a single, shared appId so all users connect to the same public data.
const appId = 'klh-connect-default'; 
// const appId = typeof __app_id !== 'undefined' ? __app_id : 'klh-connect-default'; // <-- This was the original line

// --- ADD GOOGLE PROVIDER ---
const googleProvider = new GoogleAuthProvider();
// --- END ADD ---

export const FirebaseProvider = ({ children }) => {
    const [app, setApp] = useState(null);
    const [auth, setAuth] = useState(null);
    const [db, setDb] = useState(null);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // 1. Initialization and Initial Auth
    useEffect(() => {
        try {
            const firebaseApp = initializeApp(firebaseConfig);
            const firebaseAuth = getAuth(firebaseApp);
            const firestoreDb = getFirestore(firebaseApp);

            setApp(firebaseApp);
            setAuth(firebaseAuth);
            setDb(firestoreDb);

            // Set persistence to keep user logged in across sessions
            setPersistence(firebaseAuth, browserLocalPersistence);

            // 2. Handle Initial Authentication
            const handleAuth = async () => {
                if (initialAuthToken) {
                    await signInWithCustomToken(firebaseAuth, initialAuthToken);
                    console.log("Signed in with Custom Token.");
                } else {
                    // We are now handling manual Email/Password login,
                    // so we no longer call signInAnonymously() here.
                    // The onAuthStateChanged listener will just find no user.
                    console.log("No initial token. Waiting for manual login.");
                }
            };
            
            handleAuth();
            
        } catch (error) {
            console.error("Firebase Initialization Error (Fatal Crash):", error);
            setIsLoading(false); 
        }
    }, []);

    // 3. Auth State Listener & User Data Fetch from Firestore
    useEffect(() => {
        if (auth && db) {
            const usersCollectionRef = collection(db, 'users');

            const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
                if (authUser) {
                    // User is logged in (either via email or just registered)
                    const userDocRef = doc(usersCollectionRef, authUser.uid);
                    
                    const unsubscribeSnapshot = onSnapshot(userDocRef, (docSnapshot) => {
                        const storedUser = docSnapshot.data();

                        const baseUser = {
                            uid: authUser.uid,
                            email: authUser.email || 'guest@campus.com',
                            name: authUser.email ? authUser.email.split('@')[0] : 'Guest',
                        };

                        if (storedUser) {
                            // User is registered in Firestore
                            setUser({
                                ...baseUser,
                                name: storedUser.name,
                                role: storedUser.role 
                            });
                        } else {
                            // User is authenticated but NOT in Firestore (e.g., just registered)
                            // We set role to null to allow Register.jsx to save it
                            setUser({
                                ...baseUser,
                                role: null 
                            });
                        }
                        setIsLoading(false);
                    }, (error) => {
                        console.error("Firestore Snapshot Error:", error);
                        setUser({ ...baseUser, role: null }); // Set to base user on error
                        setIsLoading(false);
                    });
                    
                    return () => unsubscribeSnapshot();
                    
                } else {
                    // No authenticated user (logged out)
                    setUser(null);
                    setIsLoading(false);
                }
            });
            return () => unsubscribeAuth();
        }
    }, [auth, db]);
    
    // --- THIS IS THE FIX ---
    // This function allows Login/Register components to manually update
    // the user state after a successful write, breaking the loop.
    const manuallyUpdateUser = (userData) => {
        console.log("Context: Manually updating user data:", userData);
        setUser(prevUser => ({
            ...prevUser, // Keep existing UID, email from auth
            name: userData.name,
            role: userData.role
        }));
    };
    // --- END FIX ---

    const getCollectionRef = (collectionName, isPublic = false) => {
        if (!db) throw new Error("Firestore not initialized.");
        return collection(db, collectionName);
    };
    
    const value = {
        user,
        db,
        auth,
        appId,
        isLoading,
        getCollectionRef,
        manuallyUpdateUser, // --- EXPORT THE FIX ---
        
        // --- EXPOSE AUTH FUNCTIONS ---
        googleProvider,
        signInWithPopup,
        signOut,
        createUserWithEmailAndPassword,
        signInWithEmailAndPassword,
        // --- END EXPOSE ---

        // Expose Firebase functions needed by components
        firestore: { 
            doc, 
            setDoc, 
            query, 
            where, 
            onSnapshot, 
            getDocs, 
            addDoc, 
            serverTimestamp, 
            deleteDoc, 
            collection 
        }
    };

    return (
        <FirebaseContext.Provider value={value}>
            {children}
        </FirebaseContext.Provider>
    );
};

