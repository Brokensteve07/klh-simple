import React, { useState } from 'react';
import { useFirebase } from './FirebaseContext.jsx'; // Correct path
import { Link, useNavigate } from 'react-router-dom';

// --- CONFIGURATION ---
const REQUIRED_DOMAIN = '@klh.edu.in';
// ---------------------

const Register = () => {
    // Get all necessary functions from the context
    const { 
        auth, 
        firestore, 
        db, 
        createUserWithEmailAndPassword 
    } = useFirebase();
    
    const navigate = useNavigate();
    
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('Student');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- DOMAIN VALIDATION FUNCTION ---
    const isValidEmail = (email) => {
        if (!email || !email.endsWith(REQUIRED_DOMAIN)) {
            setMessage(`Error: Only ${REQUIRED_DOMAIN} emails are allowed for registration.`);
            setIsSubmitting(false);
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsSubmitting(true);

        if (!auth || !db || !firestore || !createUserWithEmailAndPassword) {
             setMessage("Error: Firebase is not initialized. Please refresh.");
            setIsSubmitting(false);
            return;
        }

        // 1. Validate domain
        if (!isValidEmail(email)) {
            return; // isValidEmail function already set the error
        }

        try {
            // 2. Create the user in Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 3. Save the user's extra data (name, role) to Firestore
            const userDocRef = firestore.doc(db, 'users', user.uid); 
            
            const userData = {
                uid: user.uid,
                name: name,
                email: email, // Save the email
                role: role,
                createdAt: firestore.serverTimestamp()
            };
            
            await firestore.setDoc(userDocRef, userData);
            
            // 4. Registration is complete, send to dashboard
            navigate('/');
            
        } catch (err) {
            console.error("Registration Failed:", err);
            if (err.code === 'auth/email-already-in-use') {
                setMessage("Error: This email address is already registered.");
            } else if (err.code === 'auth/weak-password') {
                setMessage("Error: Password is too weak. Must be at least 6 characters.");
            } else if (err.code === 'permission-denied') {
                setMessage("Error: Permission denied. Please check your Firestore rules.");
            } else {
                setMessage(`Error: Registration failed. ${err.message}`);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="page-container" style={{maxWidth: '500px'}}>
            <h2>Register for KLH Connect</h2>
            
            <form onSubmit={handleSubmit} className="form-feedback">
                
                {message && (
                    <div className={message.startsWith('Error') ? "form-error" : "form-success"}>
                        {message}
                    </div>
                )}

                <div className="form-group">
                    <label htmlFor="name">Full Name:</label>
                    <input
                        id="name"
                        type="text"
                        placeholder="Enter Your Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        disabled={isSubmitting}
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="email">Email:</label>
                    <input
                        id="email"
                        type="email"
                        placeholder="e.g., yourname@klh.edu.in"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isSubmitting}
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="password">Password (min. 6 characters):</label>
                    <input
                        id="password"
                        type="password"
                        placeholder="Create a password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isSubmitting}
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="role">Select Your Campus Role:</label>
                    <select
                        id="role"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        required
                        disabled={isSubmitting}
                    >
                        <option value="Student">Student</option>
                        <option value="Faculty">Faculty</option>
                        <option value="Admin">Admin</option>
                    </select>
                </div>

                <button 
                    type="submit" 
                    className="btn btn-primary" 
                    disabled={isSubmitting}
                    style={{width: '100%'}}
                >
                    {isSubmitting ? 'Registering...' : 'Register'}
                </button>
            </form>
            
            <p style={{textAlign: 'center', marginTop: '20px'}}>
                Already have an account? <Link to="/login">Login Here</Link>
            </p>
        </div>
    );
};

export default Register;
