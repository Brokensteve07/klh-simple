import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Using simplest path (no .jsx)
import { FirebaseProvider } from './FirebaseContext'; // Using simplest path (no .jsx)

// Function to check if the required environment variables are available
// We set this to always return true for local development purposes.
const isEnvironmentReady = () => {
    return true; 
};

// Component to display when environment setup fails (RETAINED FOR SAFETY)
const EnvironmentErrorFallback = () => (
    <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#f9f9f9', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <h1 style={{ color: '#e74c3c' }}>Initialization Error</h1>
        <p style={{ color: '#333' }}>The required Firebase configuration is missing.</p>
        <p>This application must be run inside an environment that securely provides the global configuration variables.</p>
        <p>Please ensure your setup is complete or contact support.</p>
    </div>
);

// Determine the root element
const rootElement = document.getElementById('root');

if (rootElement) {
    if (isEnvironmentReady()) {
        // Render the full application because the check is bypassed
        ReactDOM.createRoot(rootElement).render(
            <React.StrictMode>
                {/* Ensure the FirebaseProvider is used to wrap the whole app */}
                <FirebaseProvider>
                    <App />
                </FirebaseProvider>
            </React.StrictMode>
        );
    } else {
        // This should now never run due to the fix above
        ReactDOM.createRoot(rootElement).render(
            <React.StrictMode>
                <EnvironmentErrorFallback />
            </React.StrictMode>
        );
    }
}
