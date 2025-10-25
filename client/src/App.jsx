import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css'; // This now imports your new PURPLE/BLUE/WHITE theme

// FIX: Switching to imports without .jsx extension for stable resolution
import Login from './login';
import Register from './Register';
import { useFirebase } from './FirebaseContext'; 
import LostAndFoundPage from './LostAndFound'; 
import EventsPage from './EventsPage';
import FeedbackPage from './FeedbackPage'; 
import ChatbotWidget from './ChatbotWidget';

// --- KLH HEADER COMPONENT (Using light theme styles) ---
const KlhHeader = ({ user, onLogout }) => (
  <header>
    {/* Main header with logo and navigation */}
    <div className="klh-main-header">
      <Link to="/">
        <img 
          src="https://www.kluniversity.in/img/logo.png" 
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
              className="btn btn-primary" 
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

// --- REUSABLE FEATURE CARD WITH HOVER EFFECT ---
const FeatureCard = ({ to, title, description, buttonText, buttonClass, icon }) => {
  const [isHovered, setIsHovered] = useState(false);
  const cardStyle = {
    transform: isHovered ? 'translateY(-8px)' : 'translateY(0)',
    boxShadow: isHovered ? '0 15px 30px rgba(0, 0, 0, 0.15)' : '0 6px 15px rgba(0, 0, 0, 0.08)',
    transition: 'all 0.3s ease',
  };

  return (
    <Link to={to} className="feature-card" style={cardStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
        <div style={{
          fontSize: '2.5em', 
          color: 'var(--theme-primary-purple)', 
          marginBottom: '15px'
        }}>{icon}</div>
        
        <h3 className="card-title">{title}</h3>
        {/* The description relies on App.css for flex-grow */}
        <p className="card-description">{description}</p>
        
        <button className={`btn ${buttonClass}`} style={{width: '100%', marginTop: '10px'}}>
          {buttonText}
        </button>
        
      </div>
    </Link>
  );
};


// --- FINAL HOMEPAGE COMPONENT ---
// FIX 1: Add onLogout to the destructured props
const Homepage = ({ user, onLogout }) => (
  <div className="homepage-container">
    {/* --- NEW HERO SECTION with Purple Gradient --- */}
    <div style={{
      background: 'linear-gradient(135deg, var(--theme-primary-purple) 0%, var(--theme-secondary-blue) 100%)',
      padding: '100px 40px',
      borderRadius: '20px',
      marginBottom: '80px',
      boxShadow: '0 15px 40px rgba(0, 0, 0, 0.3)',
      color: 'white',
      minHeight: '350px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background SVG style elements for dynamic look */}
      <div style={{position: 'absolute', top: '-50px', left: '-50px', width: '200px', height: '200px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%'}}></div>
      <div style={{position: 'absolute', bottom: '0', right: '0', width: '300px', height: '300px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', transform: 'translate(50%, 50%)'}}></div>

      <p style={{
        fontSize: '1.2em',
        fontWeight: '500',
        color: 'rgba(255, 255, 255, 0.8)',
        marginBottom: '10px',
        zIndex: 1
      }}>
        Your Platform for Success
      </p>
      <h1 className="welcome-header" style={{
        fontSize: '4.2em',
        fontWeight: '800',
        color: 'white',
        textShadow: '0 4px 8px rgba(0,0,0,0.2)',
        marginBottom: '25px',
        lineHeight: '1.1',
        zIndex: 1
      }}>
        Showcase Your Mastery. <br/>Get Connected.
      </h1>
      <p style={{
        fontSize: '1.3em',
        fontWeight: '300',
        color: 'rgba(255, 255, 255, 0.9)',
        maxWidth: '800px',
        margin: '0 auto',
        zIndex: 1
      }}>
        Welcome, **{user?.name || user?.email || 'User'}**! Explore essential campus resources and collaborate seamlessly with peers and faculty.
      </p>
    </div>
    {/* --- END HERO SECTION --- */}
    
    <h2 style={{color: 'var(--theme-secondary-blue)', marginBottom: '50px', fontSize: '2.5em', fontWeight: '800'}}>
        Explore Campus Essentials
    </h2>

    <div className="feature-grid" style={{marginTop: '50px'}}>
      
      <FeatureCard 
        to="/lost-found"
        title="Lost & Found"
        description="Report or claim items instantly. Get notified when your lost property is found."
        buttonText="Go to L&F"
        buttonClass="btn-primary"
        icon="🔍"
      />

      <FeatureCard 
        to="/events"
        title="Campus Events"
        description="View and enroll in upcoming lectures, workshops, and student-run seminars."
        buttonText="View Events"
        buttonClass="btn-success"
        icon="🗓️"
      />

      <FeatureCard 
        to="/feedback"
        title="Submit Feedback"
        description="Share your suggestions and report issues directly to campus administration."
        buttonText="Give Feedback"
        buttonClass="btn-warning"
        icon="💬"
      />
    </div>
    
    <button onClick={onLogout} className="btn btn-danger" style={{ marginTop: '70px', marginBottom: '50px', padding: '12px 30px' }}>
      Logout
    </button>
  </div>
);

// --- Login/Register Page Layout (Wrapper to center forms) ---
const AuthPageLayout = ({ children, title }) => (
  <div style={{
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '50px 0',
    backgroundColor: 'var(--theme-bg-light)' // Match body background
  }}>
    <div className="form-container">
      <h2 style={{marginTop: 0, marginBottom: '20px', textAlign: 'center', color: 'var(--theme-secondary-blue)'}}>{title}</h2>
      {children}
      <p style={{textAlign: 'center', marginTop: '20px'}}>
        <Link to="/">Go Home</Link>
      </p>
    </div>
  </div>
);


function App() {
  const { user, auth, isLoading } = useFirebase(); // Destructure isLoading

  const handleLogout = () => {
    if (auth && auth.signOut) {
      auth.signOut();
    } else {
      console.error("Auth object or signOut function is missing.");
    }
  };
  
  // RENDER SAFETY CHECK: If Firebase is still loading, show a loading message
  if (isLoading) {
      return (
          <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'var(--theme-bg-light)', color: 'var(--theme-primary-purple)', fontSize: '2em' }}>
              <p>Loading application...</p>
          </div>
      );
  }

  return (
    <Router>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* Render the new KLH Header, passing handleLogout */}
        <KlhHeader user={user} onLogout={handleLogout} />
        
        {/* Main Content Area (Pages) */}
        <main style={{ flexGrow: 1, backgroundColor: 'var(--theme-bg-light)' }}>
          <Routes>
            {/* FIX: The error occurred right here. I removed a stray closing parenthesis that was accidentally placed after the first <Route path="/" element={...} wrapper, which caused the parser confusion. The original fix (passing onLogout) is retained. */}
            <Route path="/" element={
              user ? ( 
                <Homepage user={user} onLogout={handleLogout} />
              ) : (
                <AuthPageLayout title="Log in to KLH Connect">
                  <Login />
                </AuthPageLayout>
              )
            } />
            
            <Route path="/login" element={
              <AuthPageLayout title="Log in to KLH Connect">
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
            <Route path="/events" element={<div className="page-container"><EventsPage /></div>} />
            <Route path="/feedback" element={<div className="page-container"><FeedbackPage /></div>} />
          </Routes>
        </main>
        
        <ChatbotWidget />
      </div>
    </Router>
  );
}

export default App;
