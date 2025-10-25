import React, { useState, useEffect } from 'react';
import { useFirebase } from './FirebaseContext.jsx'; // Correct path - ADDED .jsx
// --- FIX: Import all firestore functions directly ---
import { 
    doc, 
    collection, 
    addDoc, 
    onSnapshot, 
    updateDoc, 
    serverTimestamp 
} from 'firebase/firestore'; 

const LostAndFoundPage = () => {
    // Firebase hooks
    const { user, db, appId, isLoading: isAuthLoading } = useFirebase(); 
    
    // --- STATE MANAGEMENT ---
    const [view, setView] = useState('lost'); // 'lost' or 'found' - to control tabs
    const [lostItems, setLostItems] = useState([]);
    const [foundItems, setFoundItems] = useState([]);
    
    // Form states
    const [itemName, setItemName] = useState('');
    const [itemDescription, setItemDescription] = useState('');
    const [itemLocation, setItemLocation] = useState('');

    // Modal/Claiming states
    const [isClaiming, setIsClaiming] = useState(false);
    const [claimingItemId, setClaimingItemId] = useState(null);
    const [phoneNumber, setPhoneNumber] = useState('');
    
    // General UI states
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [itemsCollectionRef, setItemsCollectionRef] = useState(null);

    // --- FIREBASE SETUP ---
    // Set up the collection reference once appId and db are available
    useEffect(() => {
        if (db && appId) {
            const path = `artifacts/${appId}/public/data/lost-and-found`;
            // --- FIX: Use imported 'collection' function ---
            setItemsCollectionRef(collection(db, path));
        }
    }, [db, appId]); // Removed firestore from dependency array

    // Effect to listen for real-time updates to items
    useEffect(() => {
        if (!itemsCollectionRef) return;

        setIsLoading(true);
        // Set up the real-time listener
        // --- FIX: Use imported 'onSnapshot' function ---
        const unsubscribe = onSnapshot(itemsCollectionRef, (querySnapshot) => {
            const allItems = [];
            querySnapshot.forEach((doc) => {
                allItems.push({ id: doc.id, ...doc.data() });
            });

            // Filter items into two lists
            const newLostItems = allItems
                .filter(item => item.type === 'lost')
                .sort((a, b) => b.reportedAt?.seconds - a.reportedAt?.seconds);
                
            const newFoundItems = allItems
                .filter(item => item.type === 'found')
                .sort((a, b) => b.reportedAt?.seconds - a.reportedAt?.seconds);

            setLostItems(newLostItems);
            setFoundItems(newFoundItems);
            setIsLoading(false);

        }, (error) => {
            console.error("Firestore Snapshot Error:", error);
            setMessage("Error: Could not load items. Check console for details.");
            setIsLoading(false);
        });

        // Cleanup function
        return () => unsubscribe();

    }, [itemsCollectionRef]);

    // --- FORM & CLAIM HANDLERS ---

    // --- FIX: Added the correct function to report a NEW item ---
    const handleReportItem = async (e, reportType) => {
        e.preventDefault();
        if (!itemsCollectionRef || !user) {
            setMessage("Error: Database connection not ready or user not found.");
            return;
        }

        setIsSubmitting(true);
        setMessage('');

        try {
            const newItem = {
                name: itemName,
                description: itemDescription,
                location: itemLocation,
                type: reportType, // 'lost' or 'found'
                status: 'unclaimed', // 'unclaimed' or 'claimed'
                reportedBy: {
                    uid: user.uid,
                    name: user.name,
                    email: user.email
                },
                // --- FIX: Use imported 'serverTimestamp' function ---
                reportedAt: serverTimestamp(), 
                claimedBy: null,
                claimedAt: null,
            };

            // --- FIX: Use imported 'addDoc' function ---
            await addDoc(itemsCollectionRef, newItem);
            
            setMessage(`Item ${reportType} successfully!`);
            // Clear the form
            setItemName('');
            setItemDescription('');
            setItemLocation('');

        } catch (err) {
            console.error("Error reporting item:", err);
            setMessage(`Error: Could not report item. ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // --- FIX: Renamed this function from handleReportItem to handleSubmitClaim ---
    const handleSubmitClaim = async (e) => {
        e.preventDefault();
         // --- ADDED CHECKS ---
        if (!claimingItemId || !phoneNumber) {
            setMessage("Error: Phone number is required to claim.");
            return;
        }
        if (!itemsCollectionRef) {
            setMessage("Error: Database connection not ready.");
            return;
        }
        // --- END ADDED CHECKS ---

        setIsSubmitting(true);
        setMessage('');

        try {
            // --- FIX: Use imported 'doc' function ---
            const itemDocRef = doc(db, `artifacts/${appId}/public/data/lost-and-found`, claimingItemId);
            
            await updateDoc(itemDocRef, { // This imported function is correct
                status: 'claimed',
                claimedBy: {
                    uid: user.uid,
                    name: user.name,
                    email: user.email,
                    phone: phoneNumber // <-- ADDING PHONE NUMBER
                },
                // --- FIX: Use imported 'serverTimestamp' function ---
                claimedAt: serverTimestamp() 
            });

            setMessage("Item successfully claimed! The finder has been notified.");
            setIsClaiming(false);
            setClaimingItemId(null);
            setPhoneNumber(''); // Clear phone number after successful claim

        } catch (err) {
            console.error("Error claiming item:", err);
            setMessage(`Error: Could not claim item. ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Step 1: User clicks "Claim", this opens the modal
    const startClaimProcess = (itemId) => {
        const item = foundItems.find(i => i.id === itemId);
        // Prevent user from claiming their own found item
        if (item && item.reportedBy.uid === user.uid) {
            setMessage("You cannot claim an item you reported as found.");
            setTimeout(() => setMessage(''), 3000);
            return;
        }
        
        setIsClaiming(true);
        setClaimingItemId(itemId);
        setPhoneNumber(''); // Reset phone number field
    };


    // --- RENDER CHECKS ---
    if (isAuthLoading) {
        return (
            <div className="page-container" style={{textAlign: 'center'}}>
                <h2>Loading User Session...</h2>
            </div>
        );
    }

    if (!db || !appId || !itemsCollectionRef) {
        return (
            <div className="page-container" style={{textAlign: 'center'}}>
                <h2 style={{color: 'var(--theme-red)'}}>Database Connection Error</h2>
                <p>Waiting for Firebase connection...</p>
            </div>
        );
    }

    // --- HELPER TO RENDER A LIST OF ITEMS ---
    const renderItemList = (items, isFoundList = false) => {
        if (isLoading) {
            return <p style={{textAlign: 'center', color: 'var(--theme-light-gray)'}}>Loading items...</p>;
        }
        if (items.length === 0) {
            return <p style={{textAlign: 'center', color: 'var(--theme-light-gray)'}}>No items in this category yet.</p>;
        }
        
        return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {items.map((item) => (
                    // --- THEME FIX: Removed inline backgroundColor ---
                    <div key={item.id} style={{ border: '1px solid var(--theme-border-color)', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                            {/* --- THEME FIX: Use theme colors --- */}
                            <h4 style={{ marginTop: '0', color: item.type === 'lost' ? 'var(--theme-red)' : 'var(--theme-green)' }}>{item.name}</h4>
                            <p style={{ color: 'var(--theme-white)'}}><strong>Description:</strong> {item.description}</p>
                            <p style={{ color: 'var(--theme-white)'}}><strong>Location:</strong> {item.location}</p>
                            <p style={{fontSize: '0.9em', color: 'var(--theme-light-gray)'}}>
                                Reported by: {item.reportedBy.name}
                            </p>
                        </div>
                        
                        {/* --- Claim Button Logic --- */}
                        {item.status === 'unclaimed' && isFoundList && (
                            <button 
                                className="btn btn-success" 
                                style={{width: '100%', marginTop: '15px'}}
                                onClick={() => startClaimProcess(item.id)}
                                disabled={user.uid === item.reportedBy.uid}
                            >
                                {user.uid === item.reportedBy.uid ? "You posted this" : "Claim This Item"}
                            </button>
                        )}
                        
                        {/* --- UPDATED CLAIMED STATUS --- */}
                        {item.status === 'claimed' && (
                            // --- THEME FIX: Replaced light background with theme colors ---
                            <div style={{ padding: '10px', marginTop: '15px', backgroundColor: 'var(--theme-charcoal)', border: '1px solid var(--theme-border-color)', borderRadius: '4px', textAlign: 'center', color: 'var(--theme-light-gray)' }}>
                                {user.uid === item.reportedBy.uid ? (
                                    // Current user is the one who posted this item
                                    <>
                                        <strong style={{ color: 'var(--theme-orange)' }}>Your Item was Claimed!</strong>
                                        <p style={{margin: '5px 0 0 0', fontSize: '0.9em', color: 'var(--theme-light-gray)'}}>
                                            By: <strong style={{ color: 'var(--theme-white)' }}>{item.claimedBy?.name}</strong>
                                        </p>
                                        <p style={{margin: '5px 0 0 0', fontSize: '0.9em', color: 'var(--theme-light-gray)'}}>
                                            Contact: <strong style={{ color: 'var(--theme-white)' }}>{item.claimedBy?.phone}</strong>
                                        </p>
                                    </>
                                ) : (
                                    // Someone else's item, just show it's claimed
                                    <>
                                        <strong style={{ color: 'var(--theme-orange)' }}>Item Claimed</strong>
                                        <p style={{margin: '5px 0 0 0', fontSize: '0.9em', color: 'var(--theme-light-gray)'}}>
                                            By: {item.claimedBy?.name || 'Claimed'}
                                        </p>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    };


    // --- MAIN RENDER ---
    return (
        // This component is already wrapped in 'page-container' by App.jsx
        // We remove the class here to avoid double-wrapping, but keep max-width
        <div style={{maxWidth: '1200px'}}> 
            <h2>Lost & Found</h2>
            
            {/* --- Message Display --- */}
            {message && (
                <div 
                    className={message.startsWith('Error') ? "form-error" : "form-success"}
                    style={{marginBottom: '20px', textAlign: 'center'}}
                    onClick={() => setMessage('')} // Click to dismiss
                >
                    {message}
                </div>
            )}

            {/* --- CLAIM MODAL --- */}
            {isClaiming && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    {/* --- THEME FIX: Replaced white background --- */}
                    <div style={{ backgroundColor: 'var(--theme-dark-gray)', border: '1px solid var(--theme-border-color)', padding: '30px', borderRadius: '8px', width: '90%', maxWidth: '500px' }}>
                        <form onSubmit={handleSubmitClaim}>
                            <h3 style={{ color: 'var(--theme-orange)', marginTop: 0 }}>Claim Item</h3>
                            <p style={{ color: 'var(--theme-light-gray)'}}>Please enter your phone number so the finder can contact you.</p>
                            <div className="form-group">
                                <label htmlFor="phoneNumber" style={{ color: 'var(--theme-light-gray)'}}>Phone Number:</label>
                                <input
                                    id="phoneNumber"
                                    type="tel"
                                    placeholder="Enter your phone number"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    required
                                    disabled={isSubmitting}
                                    // The input will be styled by App.css
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                                <button type="button" className="btn btn-light" onClick={() => setIsClaiming(false)} disabled={isSubmitting}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                    {isSubmitting ? 'Submitting...' : 'Submit Claim'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- TAB SWITCHER --- */}
            {/* --- THEME FIX: Replaced light border --- */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', borderBottom: '2px solid var(--theme-border-color)' }}>
                <button 
                    className={`btn ${view === 'lost' ? 'btn-primary' : 'btn-light'}`}
                    onClick={() => setView('lost')}
                    style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, fontWeight: '600' }}
                >
                    I Lost Something
                </button>
                <button 
                    className={`btn ${view === 'found' ? 'btn-primary' : 'btn-light'}`}
                    onClick={() => setView('found')}
                    style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, fontWeight: '600' }}
                >
                    I Found Something
                </button>
            </div>

            {/* --- CONDITIONAL VIEWS --- */}
            
            {/* --- VIEW 1: I LOST SOMETHING --- */}
            {view === 'lost' && (
                <div>
                    {/* Section 1: Report a Lost Item Form */}
                    {/* --- THEME FIX: Removed inline backgroundColor --- */}
                    <div style={{ marginBottom: '40px', padding: '20px', borderRadius: '8px', border: '1px solid var(--theme-border-color)' }}>
                        <h3 style={{marginTop: 0}}>Report a Lost Item</h3>
                        <p style={{ color: 'var(--theme-light-gray)'}}>Fill out this form to report an item you lost. It will appear in the "Found Items" list for others to see.</p>
                        <form onSubmit={(e) => handleReportItem(e, 'lost')} className="form-feedback">
                            {/* All inputs/labels are styled by App.css */}
                            <div className="form-group">
                                <label htmlFor="itemNameLost">Item Name:</label>
                                <input id="itemNameLost" type="text" placeholder="e.g., Black Wallet" value={itemName} onChange={(e) => setItemName(e.target.value)} required disabled={isSubmitting} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="itemDescLost">Description:</label>
                                <textarea id="itemDescLost" placeholder="e.g., Contains ID card" value={itemDescription} onChange={(e) => setItemDescription(e.target.value)} required disabled={isSubmitting} rows="3"></textarea>
                            </div>
                            <div className="form-group">
                                <label htmlFor="itemLocLost">Last Seen Location:</label>
                                <input id="itemLocLost" type="text" placeholder="e.g., Library 2nd Floor" value={itemLocation} onChange={(e) => setItemLocation(e.target.value)} required disabled={isSubmitting} />
                            </div>
                            <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{width: '100%'}}>
                                {isSubmitting ? 'Reporting...' : 'Report Lost Item'}
                            </button>
                        </form>
                    </div>
                    
                    {/* Section 2: List of FOUND Items */}
                    <div>
                        <h3>Recently Found Items</h3>
                        <p style={{ color: 'var(--theme-light-gray)'}}>Browse items others have found. If you see yours, claim it!</p>
                        {renderItemList(foundItems, true)}
                    </div>
                </div>
            )}

            {/* --- VIEW 2: I FOUND SOMETHING (FIX: Added this missing block) --- */}
            {view === 'found' && (
                <div>
                    {/* Section 1: Post a Found Item Form */}
                    {/* --- THEME FIX: Removed inline backgroundColor --- */}
                    <div style={{ marginBottom: '40px', padding: '20px', borderRadius: '8px', border: '1px solid var(--theme-border-color)' }}>
                        <h3 style={{marginTop: 0}}>Post a Found Item</h3>
                        <p style={{ color: 'var(--theme-light-gray)'}}>Fill out this form to post an item you found. It will appear in the "Lost Items" list for others to see.</p>
                        <form onSubmit={(e) => handleReportItem(e, 'found')} className="form-feedback">
                            {/* All inputs/labels are styled by App.css */}
                            <div className="form-group">
                                <label htmlFor="itemNameFound">Item Name:</label>
                                <input id="itemNameFound" type="text" placeholder="e.g., Blue Water Bottle" value={itemName} onChange={(e) => setItemName(e.target.value)} required disabled={isSubmitting} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="itemDescFound">Description:</label>
                                <textarea id="itemDescFound" placeholder="e.g., Has a 'Gemini' sticker" value={itemDescription} onChange={(e) => setItemDescription(e.target.value)} required disabled={isSubmitting} rows="3"></textarea>
                            </div>
                            <div className="form-group">
                                <label htmlFor="itemLocFound">Location Found:</label>
                                <input id="itemLocFound" type="text" placeholder="e.g., Canteen Table" value={itemLocation} onChange={(e) => setItemLocation(e.target.value)} required disabled={isSubmitting} />
                            </div>
                            <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{width: '100%'}}>
                                {isSubmitting ? 'Posting...' : 'Post Found Item'}
                            </button>
                        </form>
                    </div>

                    {/* Section 2: List of LOST Items */}
                    <div>
                        <h3>Recently Reported Lost Items</h3>
                        <p style={{ color: 'var(--theme-light-gray)'}}>Browse items others have reported as lost. (You cannot claim these, only they can claim a "found" item).</p>
                        {renderItemList(lostItems, false)}
                    </div>
                </div>
            )}

        </div>
    );
};

export default LostAndFoundPage;
