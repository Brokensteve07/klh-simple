import React, { useState, useEffect } from 'react';
import { useFirebase } from './FirebaseContext'; // Correct path
import {
    collection,
    addDoc,
    onSnapshot,
    serverTimestamp,
    query,
    orderBy, // Import orderBy
    doc,
    updateDoc,
    arrayUnion // Import arrayUnion for enrollments
} from 'firebase/firestore';

// --- THEME COLORS (Copied from App.css, assuming it's available globally) ---
// Using custom CSS properties defined in App.css for consistent theming
const theme = {
    charcoal: 'var(--theme-charcoal, #222222)',
    darkGray: 'var(--theme-dark-gray, #333333)',
    lightGray: 'var(--theme-light-gray, #aaaaaa)',
    white: 'var(--theme-white, #eeeeee)',
    orange: 'var(--theme-orange, #f39c12)',
    red: 'var(--theme-red, #e74c3c)',
    green: 'var(--theme-green, #2ecc71)',
    darkRedBg: 'var(--form-error-bg, #5d2a2a)', // Using form-error background
    darkGreenBg: 'var(--form-success-bg, #2a5d2a)', // Using form-success background
    borderColor: 'var(--theme-border-color, #555555)',
};

const EventsPage = () => {
    // --- FIREBASE & AUTH ---
    const { user, db, appId, isLoading: isAuthLoading } = useFirebase();
    // Check user role
    const canPostEvents = user && (user.role === 'Faculty' || user.role === 'Admin');

    // --- STATE ---
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [enrollmentLoading, setEnrollmentLoading] = useState({}); // Track loading state per event
    const [showEnrollmentsModal, setShowEnrollmentsModal] = useState(false);
    const [selectedEventEnrollments, setSelectedEventEnrollments] = useState([]);
    const [selectedEventTitle, setSelectedEventTitle] = useState('');

    // Form state
    const [title, setTitle] = useState('');
    const [eventDate, setEventDate] = useState(''); // Changed from 'date' to 'eventDate' to match object key
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');

    const [eventsCollectionRef, setEventsCollectionRef] = useState(null);

    // --- FIREBASE SETUP ---
    // Set up the collection reference once appId and db are available
    useEffect(() => {
        if (db && appId) {
            const path = `artifacts/${appId}/public/data/events`;
            setEventsCollectionRef(collection(db, path));
        }
    }, [db, appId]);

    // --- REAL-TIME DATA LISTENER ---
    // Effect to listen for real-time updates to events
    useEffect(() => {
        if (!eventsCollectionRef) return;

        setIsLoading(true);

        // Create a query to order events by date (ascending)
        const eventsQuery = query(eventsCollectionRef, orderBy('eventDate', 'asc'));

        const unsubscribe = onSnapshot(eventsQuery, (querySnapshot) => {
            const allEvents = [];
            querySnapshot.forEach((doc) => {
                // Include enrollments array in the fetched data
                allEvents.push({ id: doc.id, ...doc.data(), enrollments: doc.data().enrollments || [] });
            });
            setEvents(allEvents);
            setIsLoading(false);

        }, (error) => {
            console.error("Firestore Snapshot Error:", error);
            setMessage("Error: Could not load events. Check console for details.");
            setIsLoading(false);
        });

        // Cleanup function
        return () => unsubscribe();

    }, [eventsCollectionRef]);

    // --- FORM HANDLER ---
    const handlePostEvent = async (e) => {
        e.preventDefault();
        if (!eventsCollectionRef || !user || !canPostEvents) {
            setMessage("Error: You do not have permission to post events.");
            return;
        }

        setIsSubmitting(true);
        setMessage('');

        try {
            const newEvent = {
                title,
                eventDate,
                location,
                description,
                postedBy: {
                    uid: user.uid,
                    name: user.name, // Save faculty name
                    email: user.email // Save faculty email
                },
                createdAt: serverTimestamp(),
                enrollments: [] // Initialize enrollments as an empty array
            };

            await addDoc(eventsCollectionRef, newEvent);

            setMessage("Event posted successfully!");
            // Clear the form
            setTitle('');
            setEventDate('');
            setLocation('');
            setDescription('');

        } catch (err) {
            console.error("Error posting event:", err);
            setMessage(`Error: Could not post event. ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- ENROLLMENT HANDLER ---
    const handleEnroll = async (eventId) => {
        if (!eventsCollectionRef || !user || user.role === 'Faculty' || user.role === 'Admin') {
            setMessage("Only students can enroll in events.");
            return;
        }

        setEnrollmentLoading(prev => ({ ...prev, [eventId]: true }));
        setMessage('');

        try {
            const eventDocRef = doc(db, `artifacts/${appId}/public/data/events`, eventId);

            const enrollmentData = {
                uid: user.uid,
                name: user.name,
                email: user.email,
                enrolledAt: new Date().toISOString() // Use client-side date format
            };
            
            // FIX: The original error was caused by using serverTimestamp() inside arrayUnion.
            // We fix it by adding the array update, and then updating another field with a serverTimestamp.
            
            await updateDoc(eventDocRef, {
                enrollments: arrayUnion(enrollmentData),
                lastUpdated: serverTimestamp() // Add a separate field for timestamp update
            });

            setMessage("Successfully enrolled!");

        } catch (err) {
            console.error("Error enrolling in event:", err);
            setMessage(`Error: Could not enroll. ${err.message}`);
        } finally {
            setEnrollmentLoading(prev => ({ ...prev, [eventId]: false }));
        }
    };

    // --- VIEW ENROLLMENTS HANDLER ---
    const handleViewEnrollments = (event) => {
        setSelectedEventTitle(event.title);
        setSelectedEventEnrollments(event.enrollments || []);
        setShowEnrollmentsModal(true);
    };

    // --- CHECK IF USER IS ALREADY ENROLLED ---
    const isUserEnrolled = (event) => {
        if (!user || !event.enrollments) return false;
        return event.enrollments.some(enrollment => enrollment.uid === user.uid);
    };


    // --- RENDER CHECKS ---
    if (isAuthLoading) {
        return (
            <div className="page-container" style={{ textAlign: 'center' }}>
                <h2>Loading User Session...</h2>
            </div>
        );
    }

    if (!db || !appId) {
        return (
            <div className="page-container" style={{ textAlign: 'center' }}>
                <h2 style={{ color: theme.red }}>Database Connection Error</h2>
                <p>Waiting for Firebase connection...</p>
            </div>
        );
    }

    // --- DYNAMIC STYLES FOR MESSAGES ---
    const messageStyle = {
        marginBottom: '20px',
        textAlign: 'center',
        padding: '10px',
        borderRadius: '4px',
        border: '1px solid',
        backgroundColor: message.startsWith('Error') ? theme.darkRedBg : theme.darkGreenBg,
        color: message.startsWith('Error') ? '#ffcccc' : '#ccffcc',
        borderColor: message.startsWith('Error') ? theme.red : theme.green,
    };

    // --- MAIN RENDER ---
    return (
        // Removed inline styles, relies on App.css for dark theme via .page-container
        <div className="page-container" style={{ maxWidth: '1000px' }}>
            <h2>Campus Events Calendar</h2>
            <p>Upcoming academic, club, and administrative events.</p>

            {/* --- Message Display --- */}
            {message && (
                <div style={messageStyle} onClick={() => setMessage('')}>
                    {message}
                </div>
            )}

            {/* --- EVENT CREATION FORM (Faculty/Admin Only) --- */}
            {canPostEvents && (
                // This div uses styles from App.css form-container
                <div className="form-container" style={{ marginBottom: '40px', padding: '20px' }}>
                    <h3 style={{ marginTop: 0 }}>Post a New Event</h3>
                    <form onSubmit={handlePostEvent} className="form-feedback">
                        <div className="form-group">
                            <label htmlFor="eventTitle">Event Title:</label>
                            <input id="eventTitle" type="text" placeholder="e.g., Guest Lecture on AI" value={title} onChange={(e) => setTitle(e.target.value)} required disabled={isSubmitting} />
                        </div>

                        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                            <div className="form-group" style={{ flex: 1, minWidth: '250px' }}>
                                <label htmlFor="eventDateInput">Date and Time:</label>
                                <input id="eventDateInput" type="datetime-local" value={eventDate} onChange={(e) => setEventDate(e.target.value)} required disabled={isSubmitting} />
                            </div>
                            <div className="form-group" style={{ flex: 1, minWidth: '250px' }}>
                                <label htmlFor="eventLocation">Location:</label>
                                <input id="eventLocation" type="text" placeholder="e.g., C-Block Auditorium" value={location} onChange={(e) => setLocation(e.target.value)} required disabled={isSubmitting} />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="eventDesc">Description:</label>
                            <textarea id="eventDesc" placeholder="Provide event details, speakers, etc." value={description} onChange={(e) => setDescription(e.target.value)} required disabled={isSubmitting} rows="4"></textarea>
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ width: '100%' }}>
                            {isSubmitting ? 'Posting...' : 'Post Event'}
                        </button>
                    </form>
                </div>
            )}

            {/* --- EVENT LIST (For Everyone) --- */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
                <h3>Upcoming Events</h3>
                {isLoading && <p style={{ textAlign: 'center', color: theme.lightGray }}>Loading events...</p>}

                {!isLoading && events.length === 0 && (
                    <p style={{ textAlign: 'center', color: theme.lightGray }}>No events scheduled at this time.</p>
                )}

                {events.map((event) => {
                    const enrolled = isUserEnrolled(event);
                    const isCreator = user && event.postedBy && user.uid === event.postedBy.uid;
                    const eventDateObj = new Date(event.eventDate);

                    return (
                        <div
                            key={event.id}
                            className="list-item-card status-event" // Use class from App.css for styling
                        >
                            <h3 style={{ marginTop: 0 }}>{event.title}</h3>
                            <p style={{ margin: '5px 0' }}>
                                <strong>When:</strong> {eventDateObj.toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}
                            </p>
                            <p style={{ margin: '5px 0' }}>
                                <strong>Where:</strong> {event.location}
                            </p>
                            <p style={{ marginTop: '15px' }}>{event.description}</p>
                            <p className="event-posted-by"> {/* Use class */}
                                Posted by: {event.postedBy.name}
                            </p>

                            {/* --- Enrollment/View Buttons --- */}
                            <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: `1px solid ${theme.borderColor}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                {isCreator ? (
                                    <button
                                        className="btn btn-light"
                                        onClick={() => handleViewEnrollments(event)}
                                    >
                                        View Enrollments ({event.enrollments.length})
                                    </button>
                                ) : (
                                    <button
                                        className={`btn ${enrolled ? 'btn-light' : 'btn-success'}`}
                                        onClick={() => !enrolled && handleEnroll(event.id)}
                                        disabled={enrolled || enrollmentLoading[event.id] || canPostEvents || eventDateObj < new Date()} // Disable for past events
                                    >
                                        {eventDateObj < new Date() ? 'Event Passed' : (enrollmentLoading[event.id] ? 'Enrolling...' : (enrolled ? 'Enrolled' : 'Enroll Now'))}
                                    </button>
                                )}
                                <span style={{fontSize: '0.9em', color: theme.lightGray}}>
                                     {event.enrollments.length} enrolled
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* --- ENROLLMENTS MODAL --- */}
            {showEnrollmentsModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div style={{ backgroundColor: theme.darkGray, border: `1px solid ${theme.borderColor}`, padding: '30px', borderRadius: '8px', width: '90%', maxWidth: '700px', maxHeight: '80vh', overflowY: 'auto' }}>
                         <h3 style={{ color: theme.orange, marginTop: 0 }}>Enrollments for "{selectedEventTitle}"</h3>
                         {selectedEventEnrollments.length === 0 ? (
                             <p style={{ color: theme.lightGray }}>No students have enrolled yet.</p>
                         ) : (
                             <ul style={{ listStyle: 'none', padding: 0 }}>
                                 {selectedEventEnrollments.map((enrollment, index) => (
                                     <li key={index} style={{ borderBottom: `1px solid ${theme.borderColor}`, padding: '10px 0', display: 'flex', justifyContent: 'space-between', color: theme.white }}>
                                        <span>{enrollment.name}</span>
                                        <span style={{color: theme.lightGray, fontSize: '0.9em'}}>
                                            {enrollment.email} (Enrolled: {new Date(enrollment.enrolledAt).toLocaleDateString()})
                                        </span>
                                     </li>
                                 ))}
                             </ul>
                         )}
                         <div style={{ textAlign: 'right', marginTop: '20px' }}>
                             <button type="button" className="btn btn-light" onClick={() => setShowEnrollmentsModal(false)}>
                                 Close
                             </button>
                         </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default EventsPage;
