import React, { useState } from 'react';
import { useFirebase } from './FirebaseContext.jsx'; // We need this hook

// This is your old 'login.jsx' file, renamed to 'Profile'
const Profile = () => {
    // Get the user, db, firestore functions, AND the new manual update function
    const { user, firestore, db, isLoading: isAuthLoading, manuallyUpdateUser } = useFirebase();
    
    const [name, setName] = useState('');
    const [role, setRole] = useState('Student');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsSubmitting(true);
        
        if (!user) {
            setMessage('Error: User session not found. Please refresh.');
            setIsSubmitting(false);
            return;
        }

        try {
            const userDocRef = firestore.doc(db, 'users', user.uid); 
            
            const userData = {
                uid: user.uid,
                name: name,
                email: user.email,
                role: role,
                createdAt: firestore.serverTimestamp()
            };
            
            // 1. Save the user's name and role to Firestore
            await firestore.setDoc(userDocRef, userData);
            
            // 2. --- THIS IS THE FIX ---
            // Manually update the user state in the context
            // This tells the app you have a role now, so App.jsx will show the dashboard
            manuallyUpdateUser(userData);
            
        } catch (err) {
            console.error("Role Registration Failed:", err);
            if (err.code === 'permission-denied') {
                setMessage("Error: Permission denied. Please check your Firestore rules to allow writes to the 'users' collection.");
            } else {
                setMessage(`Error: Registration failed. ${err.message}`);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isAuthLoading) {
        return <div className="page-container" style={{textAlign: 'center'}}><h2>Loading user session...</h2></div>
    }

    // This check is now safe, because App.jsx will only show this
    // component if a user is already logged in.
    if (!user) {
        return <div className="page-container" style={{textAlign: 'center'}}><h2>User not authenticated. Please wait or refresh.</h2></div>
    }

    return (
        <div className="page-container" style={{maxWidth: '500px'}}>
            <h2>Complete Profile & Select Role</h2>
            <p style={{marginBottom: '20px', color: '#666', textAlign: 'center'}}>
                Your User ID: {user.uid}
            </p>
            
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
          _   </div>
                
                <div className="form-group">
                    <label htmlFor="role">Select Your Campus Role:</label>
                    <select
                        id="role"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        required
                        disabled={isSubmitting}
s                   >
                        <option value="Student">Student</option>
                        <option value="Faculty">Faculty</option>
                        <option value="Admin">Admin</option>
E                 </select>
                </div>

                <button 
                    type="submit" 
                    className="btn btn-primary" 
A                 disabled={isSubmitting}
    _             style={{width: '100%'}}
                >
                    {isSubmitting ? 'Registering...' : 'Register and Enter Hub'}
                </button>
            </form>
        </div>
    );
};

export default Profile;
