import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css'; // This now imports your new CHARCOAL/ORANGE theme

// Import all components (REVERTING TO NO .jsx EXTENSION TO FIX RESOLUTION ISSUE)
import Login from './login';
import Register from './Register';
import { useFirebase } from './FirebaseContext'; 
import LostAndFoundPage from './LostAndFound'; 
import EventsPage from './EventsPage';
import FeedbackPage from './FeedbackPage'; 
import ChatbotWidget from './ChatbotWidget';

// --- KLH HEADER COMPONENT ---
const KlhHeader = ({ user, onLogout }) => (
  <header>
    {/* Main header with logo and navigation */}
    <div className="klh-main-header">
      <Link to="/">
        <img 
          src="KLH_Logo.png" 
          alt="KLH Logo" 
          className="klh-logo"
        />
      </Link>
      
      <nav className="klh-nav-links">
        {user ? (
          <>
            {/* Logged-in links */}
            <Link to="/">Home</Link>
            <Link to="/lost-found">Lost & Found</Link>
            <Link to="/events">Events</Link>
            <Link to="/feedback">Feedback</Link>
            <span className="user-info">Logged in as {user.email}</span>
            <button onClick={onLogout} className="btn btn-danger" style={{padding: '8px 15px'}}>
              Logout
            </button>
          </>
        ) : (
          <>
            {/* Logged-out links */}
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
            <a 
              href="https://www.kluniversity.in/admissions/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn btn-primary" // This will now be ORANGE
              style={{padding: '8px 15px'}}
            >
              Admissions Open
            </a>
          </>
        )}
      </nav>
    </div>
  </header>
);

// --- HOMEPAGE COMPONENT ---
const Homepage = ({ user }) => (
  <div className="homepage-container">
    <h1 className="welcome-header">Welcome, {user.name}!</h1>
    <p className="welcome-subheader">What would you like to do today?</p>
    
    <div className="feature-grid">
      
      {/* Lost & Found Card */}
      <Link to="/lost-found" className="feature-card">
        <div>
          <h3 className="card-title">Lost & Found</h3>
          <p className="card-description">Report a lost item or post one you've found. Help connect items back to their owners.</p>
        </div>
        <button className="btn btn-primary" style={{width: '100%'}}>Go to Lost & Found</button>
      </Link>

      {/* Events Card */}
      <Link to="/events" className="feature-card">
        <div>
          <h3 className="card-title">Events</h3>
          <p className="card-description">See all upcoming campus events, workshops, and seminars. Stay up to date!</p>
        </div>
        <button className="btn btn-success" style={{width: '100%'}}>See All Events</button>
      </Link>

      {/* Feedback Card */}
      <Link to="/feedback" className="feature-card">
        <div>
          <h3 className="card-title">Feedback</h3>
          <p className="card-description">Have a suggestion or an issue? Submit your feedback to help us improve campus life.</p>
        </div>
        <button className="btn btn-warning" style={{width: '100%'}}>Give Feedback</button>
      </Link>
    </div>
  </div>
);

// --- Login/Register Page Layout (Simplified) ---
const AuthPageLayout = ({ children, title }) => (
  // The 'page-container' ensures the dark background for the whole page area
  <div className="page-container" style={{maxWidth: '600px', margin: '50px auto', background: 'transparent', border: 'none', boxShadow: 'none'}}>
    <div className="form-container" style={{paddingTop: '50px', paddingBottom: '50px'}}>
      <h2 style={{marginTop: 0, marginBottom: '20px'}}>{title}</h2>
      {children}
    </div>
  </div>
);


function App() {
  const { user, auth } = useFirebase();

  const handleLogout = () => {
    if (auth) {
      auth.signOut();
    }
  };

  return (
    <Router>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* Render the new KLH Header */}
        <KlhHeader user={user} onLogout={handleLogout} />
        
        {/* Main Content Area (Pages) */}
        <main style={{ flexGrow: 1 }}>
          <Routes>
            <Route path="/" element={
              user ? ( 
                <Homepage user={user} />
              ) : (
                <AuthPageLayout title="Login to KLH Connect">
                  <Login />
                </AuthPageLayout>
              )
            } />
            
            <Route path="/login" element={
              <AuthPageLayout title="Login to KLH Connect">
                <Login />
              </AuthPageLayout>
            } />
            
            <Route path="/register" element={
              <AuthPageLayout title="Register for KLH Connect">
                <Register />
              </AuthPageLayout>
            } />

            {/* Feature Routes */}
            <Route path="/lost-found" element={<div className="page-container"><LostAndFoundPage /></div>} />
            <Route path="/events" element={<div className="page-container" style={{background: 'transparent', border: 'none', boxShadow: 'none'}}><EventsPage /></div>} />
            <Route path="/feedback" element={<div className="page-container"><FeedbackPage /></div>} />
          </Routes>
        </main>
        
        <ChatbotWidget />
      </div>
    </Router>
  );
}

export default App;
