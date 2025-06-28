import React, { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

/**
 * JEGA Assistant ChatBot Component
 * 
 * This component provides an AI-powered chat interface for JEGA software support.
 * It integrates with Google Vertex AI using Gemini 2.5 Pro and Vertex AI Search
 * for contextual responses based on the JEGA knowledge base.
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onIconClick - Callback when chat icon is clicked (for panel mode)
 * @param {boolean} props.isPanelVersion - Whether to render as panel content or floating icon
 * @param {Function} props.onClearChat - Callback to clear chat history (for panel mode)
 */

// LocalStorage utility functions
const STORAGE_KEY = 'jega-chat-history';

const saveMessagesToStorage = (messages, userHistoryLimit = 100) => {
  try {
    if (typeof window === 'undefined') return; // SSR check
    const messagesToSave = messages.slice(-userHistoryLimit); // Keep only last userHistoryLimit
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      messages: messagesToSave,
      lastUpdated: new Date().toISOString()
    }));
    console.log('💾 Saved', messagesToSave.length, 'messages to localStorage (limit:', userHistoryLimit, ')');
  } catch (error) {
    console.warn('⚠️ Failed to save messages to localStorage:', error);
  }
};

const loadMessagesFromStorage = () => {
  try {
    if (typeof window === 'undefined') return null; // SSR check
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      // Convert timestamp strings back to Date objects
      const messages = data.messages.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));
      console.log('📂 Loaded', messages.length, 'messages from localStorage');
      return messages;
    }
  } catch (error) {
    console.warn('⚠️ Failed to load messages from localStorage:', error);
  }
  return null;
};

const clearMessagesFromStorage = () => {
  try {
    if (typeof window === 'undefined') return; // SSR check
    localStorage.removeItem(STORAGE_KEY);
    console.log('🗑️ Cleared messages from localStorage');
  } catch (error) {
    console.warn('⚠️ Failed to clear messages from localStorage:', error);
  }
};

const SITE_BASE_URL = 'https://jegavn-kb.vercel.app'; // Change this if your domain changes

/**
 * Limit chat history to conversation memory for Vertex AI
 * @param {Array} messages - Full message history
 * @param {number} conversationMemory - Maximum messages to send to AI (required)
 * @returns {Array} Limited message history for AI
 */
const limitConversationMemory = (messages, conversationMemory) => {
  if (!conversationMemory) {
    throw new Error('conversationMemory is required from Bubble config');
  }
  
  if (!messages || messages.length <= conversationMemory) {
    return messages;
  }
  
  // Keep the most recent conversationMemory messages
  const limitedMessages = messages.slice(-conversationMemory);
  console.log(`📝 Limited conversation memory from ${messages.length} to ${limitedMessages.length} messages for Vertex AI`);
  return limitedMessages;
};

const ChatBot = forwardRef(({ onIconClick, isPanelVersion, onClearChat }, ref) => {
  // State management
  const [messages, setMessages] = useState(() => {
    // Initialize with stored messages or default welcome message
    const storedMessages = loadMessagesFromStorage();
    if (storedMessages && storedMessages.length > 0) {
      return storedMessages;
    }
    return [
    {
      id: 1,
      text: 'Chào bạn, tôi có thể giúp gì cho bạn hôm nay?',
      sender: 'bot',
      timestamp: new Date(),
      model: 'system',
      sources: []
    }
    ];
  });
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chatConfig, setChatConfig] = useState(null); // Must be loaded from Bubble API
  
  // Refs
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Expose clearChat function through ref
  useImperativeHandle(ref, () => ({
    clearChat: handleClearChat
  }), []);

  // Load chat configuration from backend
  useEffect(() => {
    const loadChatConfig = async () => {
      try {
        const isDevelopment = process.env.NODE_ENV === 'development' || 
                             window.location.hostname === 'localhost' ||
                             window.location.hostname === '127.0.0.1';
        const apiEndpoint = isDevelopment ? 'http://localhost:3001/api/config' : '/api/config';
        
        const response = await fetch(apiEndpoint);
        if (response.ok) {
          const data = await response.json();
          if (data.config && data.config.chatSettings) {
            // Require all settings from Bubble - no defaults
            if (!data.config.chatSettings.conversationMemory || !data.config.chatSettings.userHistory) {
              console.error('❌ Missing required chat settings from Bubble API');
              setError('Cấu hình chatbot không đầy đủ. Vui lòng liên hệ quản trị viên.');
              return;
            }
            
            setChatConfig({
              conversationMemory: data.config.chatSettings.conversationMemory,
              userHistory: data.config.chatSettings.userHistory
            });
            console.log('🔧 Loaded chat configuration from Bubble:', data.config.chatSettings);
          } else {
            console.error('❌ No chat settings found in Bubble API response');
            setError('Không thể tải cấu hình chatbot từ Bubble API. Vui lòng liên hệ quản trị viên.');
          }
        } else {
          console.error('❌ Failed to fetch chat configuration from API');
          setError('Không thể kết nối đến API cấu hình. Vui lòng thử lại sau.');
        }
      } catch (error) {
        console.error('❌ Failed to load chat configuration:', error);
        setError('Lỗi khi tải cấu hình chatbot. Vui lòng thử lại sau.');
      }
    };

    loadChatConfig();
  }, []);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0 && chatConfig && chatConfig.userHistory) {
      // Use userHistory from Bubble config (required)
      saveMessagesToStorage(messages, chatConfig.userHistory);
    }
  }, [messages, chatConfig]);

  // Focus input when panel opens
  useEffect(() => {
    if (isPanelVersion && inputRef.current) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isPanelVersion]);

  /**
   * Call Vertex AI API with user message and chat history
   * Includes retry mechanism for 429 errors as recommended by Google
   * @param {string} userMessage - The user's input message
   * @param {Array} chatHistory - Previous conversation messages
   * @returns {Promise<Object>} Response from Vertex AI
   */
  const callVertexAI = useCallback(async (userMessage, chatHistory) => {
    const maxRetries = 2; // Google recommendation: retry no more than 2 times
    const baseDelay = 1000; // Google recommendation: minimum delay of 1 second
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        setError(null);
        
        // Determine API endpoint based on environment
        const isDevelopment = process.env.NODE_ENV === 'development' || 
                             window.location.hostname === 'localhost' ||
                             window.location.hostname === '127.0.0.1';
        const apiEndpoint = isDevelopment ? 'http://localhost:3001/api/vertex-ai' : '/api/vertex-ai';
        
        console.log(`🌐 Calling API endpoint (attempt ${attempt + 1}/${maxRetries + 1}):`, apiEndpoint);
        
        // Require conversation memory from Bubble config
        if (!chatConfig || !chatConfig.conversationMemory) {
          throw new Error('Chat configuration not loaded from Bubble API');
        }
        
        const limitedHistory = limitConversationMemory(chatHistory, chatConfig.conversationMemory);
        
        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: userMessage,
            chatHistory: limitedHistory
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          
          // Handle 429 (Resource Exhausted) with retry logic
          if (response.status === 429 && attempt < maxRetries) {
            const delay = baseDelay * Math.pow(2, attempt); // Exponential backoff
            console.log(`⏳ Received 429 error, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
            
            // Show user feedback about retry
            setError(`Hệ thống đang bận, đang thử lại... (${attempt + 1}/${maxRetries + 1})`);
            
            await new Promise(resolve => setTimeout(resolve, delay));
            continue; // Retry the request
          }
          
          throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`);
        }

        const data = await response.json();
        
        if (data.response) {
          return {
            text: data.response,
            model: data.model || 'unknown-model',
            sources: data.sources || []
          };
        } else {
          throw new Error('No response received from Vertex AI');
        }
        
      } catch (error) {
        // If this is the last attempt or not a retryable error, throw
        if (attempt === maxRetries || (error.message && !error.message.includes('429'))) {
          console.error('❌ Vertex AI error:', error);
          setError(error.message);
          return {
            text: 'Xin lỗi, hệ thống JEGA Assistant hiện tại không khả dụng. Vui lòng thử lại sau hoặc liên hệ với bộ phận hỗ trợ.',
            model: 'error',
            sources: []
          };
        }
        
        // For retryable errors, continue to next attempt
        console.log(`🔄 Retryable error on attempt ${attempt + 1}, will retry:`, error.message);
      }
    }
  }, [chatConfig]);

  /**
   * Handle sending a new message
   */
  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;
    
    // Ensure chat config is loaded from Bubble before allowing messages
    if (!chatConfig) {
      setError('Chưa tải được cấu hình chatbot. Vui lòng thử lại sau.');
      return;
    }
    
    const userMessage = inputValue.trim();
    setInputValue('');
    setIsLoading(true);
    setError(null);
    
    // Add user message to chat
    const newUserMessage = {
      id: Date.now(),
      text: userMessage,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newUserMessage]);
    
    try {
      // Get bot response
      const botResponse = await callVertexAI(userMessage, [...messages, newUserMessage]);
      
      const newBotMessage = {
        id: Date.now() + 1,
        text: botResponse.text,
        sender: 'bot',
        timestamp: new Date(),
        model: botResponse.model,
        sources: botResponse.sources
      };
      
      setMessages(prev => [...prev, newBotMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.',
        sender: 'bot',
        timestamp: new Date(),
        model: 'error',
        sources: []
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, messages, callVertexAI, chatConfig]);

  /**
   * Handle keyboard events
   */
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  /**
   * Format message text with markdown-like syntax
   */
  const formatMessage = useCallback((text) => {
    if (!text) return '';
    
    let formatted = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>')
      // Remove numbering patterns like "1. ", "2. " etc. before links
      .replace(/(\d+\.\s*)(<a\s+href=)/g, '$2')
      // Remove numbering patterns like "1. " that appear before any text
      .replace(/(\d+\.\s*)([^<])/g, '$2')
      // Convert [Link] URL patterns to clickable links
      .replace(/\[Link\]\s*(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="' + styles.sourceLink + '">Link</a>');
    
    return formatted;
  }, []);

  /**
   * Clear chat history
   */
  const handleClearChat = useCallback(() => {
    console.log('🗑️ Clearing chat history...');
    
    // Clear from localStorage
    clearMessagesFromStorage();
    
    // Reset to default welcome message
    setMessages([
      {
        id: Date.now(),
        text: 'Chào bạn, tôi có thể giúp gì cho bạn hôm nay?',
        sender: 'bot',
        timestamp: new Date(),
        model: 'system',
        sources: []
      }
    ]);
    setError(null);
    
    // Notify parent component if callback is provided
    if (onClearChat) {
      onClearChat();
    }
  }, [onClearChat]);

  // Expose clear chat function to parent component (fallback method)
  useEffect(() => {
    if (isPanelVersion) {
      // This allows the panel to call the clear function via global method
      window.clearChatHistory = handleClearChat;
    }
    
    return () => {
      if (window.clearChatHistory) {
        delete window.clearChatHistory;
      }
    };
  }, [isPanelVersion, handleClearChat]);

  // Render floating chat icon (non-panel mode)
  if (!isPanelVersion) {
    return (
      <button 
        className={styles.chatIcon} 
        onClick={onIconClick}
        aria-label="Mở JEGA Assistant"
        title="Mở JEGA Assistant"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H6L4 18V4H20V16Z" fill="currentColor"/>
          <path d="M7 9H17V11H7V9ZM7 12H14V14H7V12Z" fill="currentColor"/>
        </svg>
      </button>
    );
  }

  // Render chat interface (panel mode)
  return (
    <>
      {/* Error banner */}
      {error && (
        <div className={styles.errorBanner}>
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)} className={styles.errorClose}>
            ×
          </button>
        </div>
      )}

      {/* Messages area */}
      <div className={styles.chatMessages}>
        {messages.map((message) => (
          <div key={message.id} className={`${styles.messageWrapper} ${message.sender === 'user' ? styles.userMessage : styles.botMessage}`}>
            <div className={styles.messageBubble}>
              <div 
                className={styles.messageText} 
                dangerouslySetInnerHTML={{ __html: formatMessage(message.text) }} 
              />
              
              {/* Sources section */}
              {message.sources && message.sources.length > 0 && !message.text.includes('<a href=') && (
                <div className={styles.sourcesSection}>
                  <div className={styles.sourcesHeader}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" fill="none"/>
                      <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" fill="none"/>
                    </svg>
                    Nguồn tham khảo ({message.sources.length})
                  </div>
                  <div className={styles.sourcesList}>
                    {message.sources.map((source, index) => {
                      let isInternal = false;
                      let internalPath = source.url;
                      if (source.url) {
                        if (source.url.startsWith('/docs/')) {
                          isInternal = true;
                        } else if (source.url.startsWith(SITE_BASE_URL + '/docs/')) {
                          isInternal = true;
                          internalPath = source.url.replace(SITE_BASE_URL, '');
                        }
                      }
                      return isInternal ? (
                        <Link
                          key={index}
                          to={internalPath}
                          className={styles.sourceLink}
                          title={source.displayTitle}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                            <path d="M18 13V19C18 19.5304 17.7893 20.0391 17.4142 20.4142C17.0391 20.7893 16.5304 21 16 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V8C3 7.46957 3.21071 6.96086 3.58579 6.58579C3.96086 6.21071 4.46957 6 5 6H11" stroke="currentColor" strokeWidth="2" fill="none"/>
                            <path d="M15 3H21V9" stroke="currentColor" strokeWidth="2" fill="none"/>
                            <path d="M10 14L21 3" stroke="currentColor" strokeWidth="2" fill="none"/>
                          </svg>
                          {source.displayTitle}
                        </Link>
                      ) : (
                        <a
                          key={index}
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.sourceLink}
                          title={source.displayTitle}
                        >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                            <path d="M18 13V19C18 19.5304 17.7893 20.0391 17.4142 20.4142C17.0391 20.7893 16.5304 21 16 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V8C3 7.46957 3.21071 6.96086 3.58579 6.58579C3.96086 6.21071 4.46957 6 5 6H11" stroke="currentColor" strokeWidth="2" fill="none"/>
                            <path d="M15 3H21V9" stroke="currentColor" strokeWidth="2" fill="none"/>
                            <path d="M10 14L21 3" stroke="currentColor" strokeWidth="2" fill="none"/>
                          </svg>
                        {source.displayTitle}
                      </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className={`${styles.messageWrapper} ${styles.botMessage}`}>
            <div className={styles.messageBubble}>
              <div className={styles.typingIndicator}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className={styles.chatInput}>
        <div className={styles.inputContainer}>
          <input 
            ref={inputRef}
            type="text" 
            placeholder={!chatConfig ? "Đang tải cấu hình..." : "Nhập câu hỏi của bạn..."}
            className={styles.messageInput}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading || !chatConfig}
            aria-label="Nhập tin nhắn"
          />
          <button 
            className={styles.sendButton} 
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading || !chatConfig}
            aria-label="Gửi tin nhắn"
            title={!chatConfig ? "Đang tải cấu hình..." : "Gửi tin nhắn"}
          >
            <svg 
              width="18"
              height="18"
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                d="M12 4L12 20M12 4L18 10M12 4L6 10"
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
});

ChatBot.displayName = 'ChatBot';

export default ChatBot; 