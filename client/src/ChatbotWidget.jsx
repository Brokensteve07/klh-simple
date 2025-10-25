import React, { useState, useRef, useEffect } from 'react';

// --- STYLES ---
// We add all styles inline as objects for a single-file component
const styles = {
  widgetButton: {
    position: 'fixed',
    bottom: '30px',
    right: '30px',
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '28px',
    zIndex: 9998,
    transition: 'transform 0.2s ease',
  },
  chatWindow: {
    position: 'fixed',
    bottom: '100px',
    right: '30px',
    width: '370px',
    height: '500px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    zIndex: 9999,
    fontFamily: 'Arial, sans-serif',
  },
  chatHeader: {
    padding: '15px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '18px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: 'white',
    fontSize: '20px',
    cursor: 'pointer',
  },
  messageContainer: {
    flexGrow: 1,
    padding: '15px',
    overflowY: 'auto',
    backgroundColor: '#f9f9f9',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  message: {
    padding: '10px 15px',
    borderRadius: '18px',
    maxWidth: '80%',
    lineHeight: '1.4',
  },
  userMessage: {
    backgroundColor: '#007bff',
    color: 'white',
    alignSelf: 'flex-end',
    borderBottomRightRadius: '4px',
  },
  modelMessage: {
    backgroundColor: '#e9e9eb',
    color: '#333',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: '4px',
  },
  inputArea: {
    display: 'flex',
    borderTop: '1px solid #ddd',
    padding: '10px',
  },
  textInput: {
    flexGrow: 1,
    border: '1px solid #ccc',
    borderRadius: '20px',
    padding: '10px 15px',
    fontSize: '14px',
    outline: 'none',
  },
  sendButton: {
    background: 'none',
    border: 'none',
    color: '#007bff',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '0 10px',
  },
  loadingIndicator: {
    alignSelf: 'flex-start',
    fontStyle: 'italic',
    color: '#777',
    padding: '10px 15px',
  }
};
// --- END STYLES ---


// --- API CONFIG ---
const API_KEY = "AIzaSyAPEU4Uif4j-4xRBq96zhjzNsbyVuSjjxM"; // Leave as-is, will be handled by the environment
const MODEL_NAME = "gemini-2.5-flash-preview-09-2025";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;
// -----------------

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = new useState([
    { role: 'model', text: 'Hello! How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleChat = () => setIsOpen(!isOpen);

  // --- GEMINI API CALL ---
  const callGeminiAPI = async (chatHistory) => {
    setIsLoading(true);

    // Format messages for the API
    const contents = chatHistory.map(msg => ({
      role: msg.role === 'model' ? 'model' : 'user',
      parts: [{ text: msg.text }]
    }));

    const payload = { contents };

    try {
      // Note: Implement exponential backoff for production use
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const result = await response.json();
      
      let modelResponse = "Sorry, I couldn't process that. Please try again.";
      if (result.candidates && result.candidates[0]?.content?.parts[0]?.text) {
        modelResponse = result.candidates[0].content.parts[0].text;
      }

      setMessages(prev => [...prev, { role: 'model', text: modelResponse }]);

    } catch (error) {
      console.error("Error calling Gemini API:", error);
      setMessages(prev => [...prev, { role: 'model', text: `Error: ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };
  // -------------------------

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', text: input.trim() };
    const newMessages = [...messages, userMessage];
    
    setMessages(newMessages);
    setInput('');
    
    // Call the API with the new message history
    callGeminiAPI(newMessages);
  };

  return (
    <>
      {/* --- FLOATING CHAT BUTTON --- */}
      <button 
        style={{
          ...styles.widgetButton,
          transform: isOpen ? 'scale(0.8)' : 'scale(1)',
        }} 
        onClick={toggleChat}
        aria-label="Toggle chat"
      >
        {/* Simple Chat Icon (SVG) */}
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      </button>

      {/* --- CHAT WINDOW --- */}
      {isOpen && (
        <div style={styles.chatWindow}>
          
          {/* Header */}
          <div style={styles.chatHeader}>
            <span>Campus Assistant</span>
            <button style={styles.closeButton} onClick={toggleChat}>&times;</button>
          </div>

          {/* Messages */}
          <div style={styles.messageContainer}>
            {messages.map((msg, index) => (
              <div 
                key={index}
                style={{
                  ...styles.message,
                  ...(msg.role === 'user' ? styles.userMessage : styles.modelMessage)
                }}
              >
                {msg.text}
              </div>
            ))}
            {isLoading && (
              <div style={styles.loadingIndicator}>
                Typing...
              </div>
            )}
            {/* Element to scroll to */}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} style={styles.inputArea}>
            <input
              type="text"
              style={styles.textInput}
              placeholder="Ask me anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
            />
            <button type="submit" style={styles.sendButton} disabled={isLoading}>
              {/* Send Icon (SVG) */}
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default ChatbotWidget;
