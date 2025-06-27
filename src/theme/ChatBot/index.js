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
const MAX_MESSAGES = 100; // Limit to prevent storage bloat

const saveMessagesToStorage = (messages) => {
  try {
    if (typeof window === 'undefined') return; // SSR check
    const messagesToSave = messages.slice(-MAX_MESSAGES); // Keep only last MAX_MESSAGES
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      messages: messagesToSave,
      lastUpdated: new Date().toISOString()
    }));
    console.log('💾 Saved', messagesToSave.length, 'messages to localStorage');
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
        text: '👋 Xin chào! Tôi là JEGA Assistant, trợ lý AI chuyên hỗ trợ thiết kế nội thất với phần mềm Jega/AiHouse. Tôi được trang bị Gemini 2.5 Pro và Vertex AI Search để cung cấp thông tin chính xác từ cơ sở tri thức JEGA. Hãy hỏi tôi về cách sử dụng phần mềm, hướng dẫn thiết kế, hoặc khắc phục sự cố!',
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
  
  // Refs
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Expose clearChat function through ref
  useImperativeHandle(ref, () => ({
    clearChat: handleClearChat
  }), []);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      saveMessagesToStorage(messages);
    }
  }, [messages]);

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
   * Call Vertex AI API with streaming support
   * @param {string} userMessage - The user's input message
   * @param {Array} chatHistory - Previous conversation messages
   * @param {Function} onChunk - Callback for each text chunk
   * @param {Function} onSources - Callback when sources are received
   * @param {Function} onComplete - Callback when streaming is complete
   * @param {Function} onError - Callback for errors
   */
  const callVertexAIStream = useCallback(async (userMessage, chatHistory, onChunk, onSources, onComplete, onError) => {
    try {
      setError(null);
      
      // Determine API endpoint based on environment
      const isDevelopment = process.env.NODE_ENV === 'development' || 
                           window.location.hostname === 'localhost' ||
                           window.location.hostname === '127.0.0.1';
      const apiEndpoint = isDevelopment ? 'http://localhost:3002/api/vertex-ai-stream' : '/api/vertex-ai-stream';
      
      console.log('🌐 Calling streaming API endpoint:', apiEndpoint);
      
      // Create EventSource for Server-Sent Events
      const eventSource = new EventSource(`${apiEndpoint}?data=${encodeURIComponent(JSON.stringify({
        message: userMessage,
        chatHistory: chatHistory
      }))}`);

      let fullResponse = '';
      let sources = [];

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'status':
              console.log('📡 Status:', data.message);
              break;
              
            case 'chunk':
              if (data.text) {
                fullResponse += data.text;
                onChunk(data.text);
              }
              break;
              
            case 'sources':
              if (data.sources) {
                sources = data.sources;
                onSources(data.sources);
              }
              break;
              
            case 'complete':
              console.log('✅ Streaming complete:', data);
              eventSource.close();
              onComplete(fullResponse, sources);
              break;
              
            case 'error':
              console.error('❌ Streaming error:', data.message);
              eventSource.close();
              onError(data.message);
              break;
              
            default:
              console.log('📡 Unknown event type:', data.type);
          }
        } catch (parseError) {
          console.error('❌ Error parsing SSE data:', parseError);
        }
      };

      eventSource.onerror = (error) => {
        console.error('❌ EventSource error:', error);
        eventSource.close();
        onError('Connection error - please try again');
      };

      // Set a timeout for the connection
      const timeout = setTimeout(() => {
        eventSource.close();
        onError('Request timeout - please try again');
      }, 60000); // 60 seconds timeout

      // Clean up timeout when streaming completes
      eventSource.addEventListener('complete', () => {
        clearTimeout(timeout);
      });

    } catch (error) {
      console.error('❌ Streaming setup error:', error);
      onError(error.message);
    }
  }, []);

  /**
   * Handle sending a new message with streaming
   */
  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;
    
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
    
    // Create placeholder for bot response
    const botMessageId = Date.now() + 1;
    const initialBotMessage = {
      id: botMessageId,
      text: '',
      sender: 'bot',
      timestamp: new Date(),
      model: 'gemini-2.5-pro',
      sources: [],
      isStreaming: true
    };
    
    setMessages(prev => [...prev, initialBotMessage]);
    
    try {
      // Start streaming response
      await callVertexAIStream(
        userMessage, 
        [...messages, newUserMessage],
        
        // onChunk callback - update text in real-time
        (chunk) => {
          setMessages(prev => prev.map(msg => 
            msg.id === botMessageId 
              ? { ...msg, text: msg.text + chunk }
              : msg
          ));
        },
        
        // onSources callback - update sources when received
        (sources) => {
          setMessages(prev => prev.map(msg => 
            msg.id === botMessageId 
              ? { ...msg, sources: sources }
              : msg
          ));
        },
        
        // onComplete callback - mark streaming as complete
        (fullResponse, sources) => {
          setMessages(prev => prev.map(msg => 
            msg.id === botMessageId 
              ? { 
                  ...msg, 
                  text: fullResponse,
                  sources: sources,
                  isStreaming: false 
                }
              : msg
          ));
          setIsLoading(false);
        },
        
        // onError callback - handle errors
        (errorMessage) => {
          setMessages(prev => prev.map(msg => 
            msg.id === botMessageId 
              ? { 
                  ...msg, 
                  text: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.',
                  model: 'error',
                  sources: [],
                  isStreaming: false 
                }
              : msg
          ));
          setError(errorMessage);
          setIsLoading(false);
        }
      );
      
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.map(msg => 
        msg.id === botMessageId 
          ? { 
              ...msg, 
              text: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.',
              model: 'error',
              sources: [],
              isStreaming: false 
            }
          : msg
      ));
      setIsLoading(false);
    }
  }, [inputValue, isLoading, messages, callVertexAIStream]);

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
        text: '👋 Xin chào! Tôi là JEGA Assistant, trợ lý AI chuyên hỗ trợ thiết kế nội thất với phần mềm Jega/AiHouse. Tôi được trang bị Gemini 2.5 Pro và Vertex AI Search để cung cấp thông tin chính xác từ cơ sở tri thức JEGA. Hãy hỏi tôi về cách sử dụng phần mềm, hướng dẫn thiết kế, hoặc khắc phục sự cố!',
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
          <div key={message.id} className={`${styles.messageWrapper} ${message.sender === 'user' ? styles.userMessage : styles.botMessage} ${message.isStreaming ? styles.messageStreaming : ''}`}>
            <div className={styles.messageBubble}>
              <div 
                className={styles.messageText} 
                dangerouslySetInnerHTML={{ __html: formatMessage(message.text) }} 
              />
              
              {/* Streaming indicator */}
              {message.isStreaming && (
                <div className={styles.streamingIndicator}>
                  <span>Đang trả lời</span>
                  <div className={styles.typingDots}>
                    <div className={styles.typingDot}></div>
                    <div className={styles.typingDot}></div>
                    <div className={styles.typingDot}></div>
                  </div>
                  <span className={styles.streamingCursor}></span>
                </div>
              )}
              
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
        
        {/* Loading indicator - only show if no message is currently streaming */}
        {isLoading && !messages.some(msg => msg.isStreaming) && (
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
            placeholder="Nhập câu hỏi của bạn..."
            className={styles.messageInput}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            aria-label="Nhập tin nhắn"
          />
          <button 
            className={styles.sendButton} 
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            aria-label="Gửi tin nhắn"
            title="Gửi tin nhắn"
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