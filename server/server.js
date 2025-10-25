// D:\KLH-Simple\server\server.js

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 5000;

// Mock Data for Lost & Found
const mockLostItems = [
    { id: 101, title: 'Blue Backpack', category: 'Bag', type: 'Lost', location: 'Library, 2nd Floor', status: 'Lost', reporter: 'Test Student', reportedAt: '2025-10-24' },
    { id: 102, title: 'Found Apple Watch', category: 'Electronics', type: 'Found', location: 'Cafeteria Table 5', status: 'Found', reporter: 'Faculty A', reportedAt: '2025-10-23' },
    { id: 103, title: 'KLH ID Card (Smith)', category: 'Documents', type: 'Lost', location: 'Admin Building', status: 'Lost', reporter: 'Student B', reportedAt: '2025-10-25' },
    { id: 104, title: 'Black Keys on Lanyard', category: 'Keys', type: 'Lost', location: 'Parking Lot B', status: 'Lost', reporter: 'Student C', reportedAt: '2025-10-22' },
];

// Mock Data for Events
const mockEvents = [
    { id: 201, title: 'Annual Tech Summit', date: '2025-11-15', location: 'Auditorium A', creator: 'Faculty A', attendees: 150 },
    { id: 202, title: 'Career Workshop: Resume Building', date: '2025-10-30', location: 'Conference Hall B', creator: 'Admin', attendees: 45 },
    { id: 203, title: 'Robotics Club Meeting', date: '2025-10-27', location: 'Lab 101', creator: 'Student B', attendees: 22 },
    { id: 204, title: 'Campus Feedback Session', date: '2025-11-05', location: 'Student Center', creator: 'Admin', attendees: 80 },
];


// --- MIDDLEWARE SETUP ---
app.use(cors({ origin: 'http://localhost:5173' })); 
app.use(bodyParser.json());


// --- ROUTES START HERE ---
app.get('/', (req, res) => {
    res.send('Mock Server is running!');
});

// MOCK LOGIN ENDPOINT
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    
    if (email === 'test@klh.com' && password === 'password') {
        return res.json({
            token: 'mock-jwt-token-12345',
            user: { id: 1, name: 'Test Student', email: email, role: 'Student' } 
        });
    }
    res.status(401).json({ msg: 'Invalid Credentials (Use test@klh.com / password)' });
});


// MOCK LOST & FOUND ENDPOINT
app.get('/api/lost-found', (req, res) => {
    res.json(mockLostItems);
});


// MOCK EVENTS ENDPOINT
app.get('/api/events', (req, res) => {
    res.json(mockEvents);
});

// MOCK FEEDBACK SUBMISSION ENDPOINT
app.post('/api/feedback', (req, res) => {
    const { subject, category, message } = req.body;

    if (!subject || !message) {
        return res.status(400).json({ msg: 'Subject and Message are required for feedback.' });
    }

    const mockTicketId = Math.floor(Math.random() * 9000) + 1000;
    
    console.log(`[MOCK LOG] New Feedback Received: ID-${mockTicketId}, Subject: ${subject}, Category: ${category}`);

    res.status(201).json({
        msg: 'Your feedback has been submitted successfully!',
        ticketId: mockTicketId,
        status: 'Pending Review',
        submittedData: { subject, category, message }
    });
});

// server/server.js

// ... (existing mock data and routes)

// --- NEW MOCK CHATBOT ENDPOINT ---
app.post('/api/chatbot/query', (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ msg: 'Message is required for the chatbot query.' });
    }
    
    // Simulate domain-specific responses based on keywords
    let responseText = "I am the KLH Connect AI assistant. How can I help you navigate the campus hub?";

    if (message.toLowerCase().includes('lost')) {
        responseText = "To report a lost item, please visit the Lost & Found page and submit a new report. We track all non-resolved items in real-time.";
    } else if (message.toLowerCase().includes('event')) {
        responseText = "You can find all upcoming events, including workshops and club meetings, on the Events page. Use the filter feature to find what you need!";
    } else if (message.toLowerCase().includes('feedback')) {
        responseText = "If you have a grievance or feedback, please use the dedicated Feedback submission form available in the main navigation.";
    }

    console.log(`[MOCK CHATBOT] User: "${message}" | Response: "${responseText}"`);

    // Simulate a delay for a more realistic API response
    setTimeout(() => {
        res.status(200).json({
            response: responseText
        });
    }, 500); // 500ms delay for realism
});


app.listen(PORT, () => {
    console.log(`Mock Server listening on http://localhost:${PORT}`);
});