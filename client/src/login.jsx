import React, { useState } from 'react';
import { useFirebase } from './FirebaseContext'; // FIX: Removing .jsx extension to prevent resolution errors while using correct name
import { Link, useNavigate } from 'react-router-dom';

// --- CONFIGURATION ---
const REQUIRED_DOMAIN = '@klh.edu.in';
// ---------------------

const Login = () => {
    // Get all necessary functions from the context
    const { 
        auth, 
        signInWithEmailAndPassword, 
        googleProvider, 
        signInWithPopup,
        signOut 
    } = useFirebase();
    
    const navigate = useNavigate();
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- DOMAIN VALIDATION FUNCTION ---
    const isValidEmail = (email) => {
        if (!email || !email.endsWith(REQUIRED_DOMAIN)) {
            setMessage(`Error: Only ${REQUIRED_DOMAIN} emails are allowed.`);
            setIsSubmitting(false);
            return false;
        }
        return true;
    };

    // --- EMAIL/PASSWORD SUBMIT HANDLER ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsSubmitting(true);

        if (!auth) {
            setMessage("Error: Firebase is not initialized. Please refresh.");
            setIsSubmitting(false);
            return;
        }

        // 1. Validate domain
        if (!isValidEmail(email)) {
            return; // isValidEmail function already set the error
        }

        // 2. Try to sign in
        try {
            await signInWithEmailAndPassword(auth, email, password); 
            // The FirebaseContext will automatically update.
            navigate('/');
            
        } catch (err) {
            console.error("Login Failed:", err);
            if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                setMessage("Error: Invalid email or password.");
            } else {
                setMessage(`Error: Login failed. ${err.message}`);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- GOOGLE SIGN-IN HANDLER ---
    const handleGoogleSignIn = async () => {
        setMessage('');
        setIsSubmitting(true);

        if (!auth || !googleProvider || !signInWithPopup || !signOut) {
            setMessage("Error: Google Sign-In is not ready. Please refresh.");
            setIsSubmitting(false);
            return;
        }

        try {
            const result = await signInWithPopup(auth, googleProvider);
            const userEmail = result.user.email;

            // 1. Validate domain
            if (!userEmail.endsWith(REQUIRED_DOMAIN)) {
                setMessage(`Error: Only ${REQUIRED_DOMAIN} Google accounts are allowed.`);
                await signOut(auth); // Sign them out immediately
                setIsSubmitting(false);
                return;
            }
            
            // 2. Validation passed.
            navigate('/');

        } catch (err) {
            console.error("Google Sign-In Failed:", err);
            if (err.code === 'auth/popup-closed-by-user') {
                setMessage('Sign-in cancelled.');
            } else {
                setMessage(`Error: Google Sign-In failed. ${err.message}`);
            }
        } finally {
            setIsSubmitting(false);
        }
    };


    return (
        // The component is wrapped in the .form-container by App.jsx, which provides the dark background.
        <div> 
            
            {message && (
                <div 
                    className={message.startsWith('Error') ? "form-error" : "form-success"}
                    style={{marginBottom: '15px'}}
                >
                    {message}
                </div>
            )}

            {/* --- GOOGLE SIGN-IN BUTTON --- */}
            <div className="form-group">
                <button 
                    type="button" 
                    // Use a custom class for Google button to ensure dark text and white icon on a dark button
                    className="btn btn-google-login" 
                    onClick={handleGoogleSignIn}
                    disabled={isSubmitting}
                    style={{
                        width: '100%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: '10px'
                    }}
                >
                    <svg style={{width: '20px', height: '20px'}} viewBox="0 0 24 24">
                        {/* Ensure SVG icon color is white for visibility on dark/orange background */}
                        <path fill="white" d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.36,19.27 5.03,16.21 5.03,12.21C5.03,8.21 8.36,5.15 12.19,5.15C14.04,5.15 15.31,5.82 16.22,6.62L18.28,4.56C16.43,2.97 14.28,2.09 12.19,2.09C6.88,2.09 2.5,6.5 2.5,12.21C2.5,17.92 6.88,22.33 12.19,22.33C17.65,22.33 21.62,18.46 21.62,12.51C21.62,11.96 21.5,11.53 21.35,11.1Z"></path>
                    </svg>
                    {isSubmitting ? 'Loading...' : 'Sign in with Google'}
                </button>
            </div>

            {/* --- DIVIDER --- */}
            <div style={{textAlign: 'center', margin: '20px 0', color: 'var(--theme-light-gray)', display: 'flex', alignItems: 'center', gap: '10px'}}>
                <hr style={{flex: 1, borderTop: '1px solid var(--theme-border-color)', borderBottom: 'none'}} />
                OR
                <hr style={{flex: 1, borderTop: '1px solid var(--theme-border-color)', borderBottom: 'none'}} />
            </div>
            
            <form onSubmit={handleSubmit} className="form-feedback">
                
                {/* Inputs and Labels will use styles from App.css for dark theme */}
                <div className="form-group">
                    <label htmlFor="email">Email:</label>
                    <input
                        id="email"
                        type="email"
                        placeholder={`e.g., yourname${REQUIRED_DOMAIN}`}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isSubmitting}
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="password">Password:</label>
                    <input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isSubmitting}
                    />
                </div>

                <button 
                    type="submit" 
                    className="btn btn-primary" // This is correctly orange
                    disabled={isSubmitting}
                    style={{width: '100%'}}
                >
                    {isSubmitting ? 'Logging in...' : 'Login'}
                </button>
            </form>
            
            {/* --- Link color and fix navigation --- */}
            <p style={{textAlign: 'center', marginTop: '20px'}}>
                Don't have an account? <Link to="/register" style={{ color: 'var(--theme-orange)' }}>Register Here</Link>
            </p>
        </div>
    );
};

export default Login;
