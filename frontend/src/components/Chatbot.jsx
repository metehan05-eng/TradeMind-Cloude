import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, Sparkles } from 'lucide-react';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: 'Merhaba! Ben TradeMind AI. Gümrük süreçleri, yeni pazar fırsatları veya stok optimizasyonu hakkında ne sormak istersiniz?'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage = { id: Date.now(), sender: 'user', text: inputValue };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const res = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage.text,
          sectorContext: 'E-Ticaret Danışmanlığı' 
        })
      });

      const data = await res.json();
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: data.response }]);
    } catch (err) {
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: 'Backend sunucusuna ulaşılamadı. (Node.js kapalı olabilir)' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <>
      <div className="chat-toggle-btn" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </div>

      {isOpen && (
        <div className="chatbot-container">
          <div className="chat-header">
            <div className="chat-title">
              <Bot size={24} className="text-secondary" color="var(--accent-purple)" />
              <span>TradeMind AI Asistan</span>
            </div>
            <Sparkles size={18} color="var(--accent-blue)" />
          </div>

          <div className="chat-body">
            {messages.map((msg) => (
              <div key={msg.id} className={`chat-message ${msg.sender}`}>
                {msg.text}
              </div>
            ))}
            {isTyping && (
              <div className="chat-message bot">
                <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>Analiz ediliyor...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-area">
            <input
              type="text"
              className="chat-input"
              placeholder="Yeni pazar analizleri, stok sorma..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button className="chat-send-btn" onClick={handleSend}>
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;
