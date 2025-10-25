// D:\KLH-Simple\client\src\FeedbackPage.jsx

import React, { useState } from 'react';
import axios from 'axios';

const FeedbackPage = () => {
    const [subject, setSubject] = useState('');
    const [category, setCategory] = useState('Facility');
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('');
        setError('');
        setIsSubmitting(true);

        try {
            const response = await axios.post('http://localhost:5000/api/feedback', {
                subject,
                category,
                message,
            });

            setStatus(`Submission successful! Ticket ID: ${response.data.ticketId}. Status: ${response.data.status}`);
            setSubject('');
            setMessage('');
            setCategory('Facility');

        } catch (err) {
            console.error("Feedback submission failed:", err);
            const errorMessage = err.response?.data?.msg || 'An unknown error occurred. Please check the backend console.';
            setError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'left' }}>
            <h2>Submit Feedback or Grievance</h2>
            <p>Use this form to report issues or provide suggestions.</p>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                
                {status && <div style={{ color: 'var(--secondary-color)', border: '1px solid var(--secondary-color)', padding: '10px', borderRadius: '4px' }}>{status}</div>}
                {error && <div style={{ color: 'var(--danger-color)', border: '1px solid var(--danger-color)', padding: '10px', borderRadius: '4px' }}>Error: {error}</div>}

                <div className="form-group">
                    <label htmlFor="category">Category:</label>
                    <select
                        id="category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        disabled={isSubmitting}
                    >
                        <option value="Facility">Facility Issue</option>
                        <option value="Academic">Academic / Faculty</option>
                        <option value="Safety">Safety / Security</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                
                <div className="form-group">
                    <label htmlFor="subject">Subject:</label>
                    <input
                        id="subject"
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        required
                        disabled={isSubmitting}
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="message">Details/Message:</label>
                    <textarea
                        id="message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        required
                        disabled={isSubmitting}
                        rows="5"
                    />
                </div>
                
                <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="btn btn-warning"
                >
                    {isSubmitting ? 'Submitting...' : 'Submit Grievance/Feedback'}
                </button>
            </form>
        </div>
    );
};

export default FeedbackPage;
