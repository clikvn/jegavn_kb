import React, { useState, useRef, useEffect, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';
import ChatRating from './ChatRating';

/**
 * JEGA Assistant ChatBot Component
 * 
 * This component provides an AI-powered chat interface for JEGA software support.
 * It integrates with Flowise AI for contextual responses based on the JEGA knowledge base.
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

// Removed limitConversationMemory function - not needed for Flowise

// Reusable typewriter streaming function
function runTypewriterStream({
  appendChunk, // function to append chunk to buffer
  getBuffer,   // function to get current buffer
  getDisplayedLength, // function to get current displayed length
  setDisplayedLength, // function to set displayed length
  onTypewriterUpdate, // function to update UI with current text
  intervalMs = 3,     // typewriter speed
  onDone = null       // callback when done
}) {
  let interval = setInterval(() => {
    const buffer = getBuffer();
    let displayedLength = getDisplayedLength();
    if (displayedLength < buffer.length) {
      displayedLength++;
      setDisplayedLength(displayedLength);
      onTypewriterUpdate(buffer.substring(0, displayedLength));
    } else {
      clearInterval(interval);
      if (onDone) {
        console.log('✅ [TYPEWRITER] Stream complete, calling onDone callback');
        onDone();
      }
    }
  }, intervalMs);
  return interval;
}

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
      model: 'flowise',
      sources: []
    }
    ];
  });
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentThoughts, setCurrentThoughts] = useState(''); // Track current thoughts for streaming
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  
  // Refs
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Expose clearChat function through ref
  useImperativeHandle(ref, () => ({
    clearChat: handleClearChat
  }), []);

  // No need to load configuration - Flowise handles everything

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Get user question for a specific bot message
  const getUserQuestionForMessage = useCallback((messageId) => {
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    if (messageIndex > 0) {
      // Find the previous user message
      for (let i = messageIndex - 1; i >= 0; i--) {
        if (messages[i].sender === 'user') {
          return messages[i].text;
        }
      }
    }
    return '';
  }, [messages]);

  // Handle chat rating submission
  const handleChatRatingSubmit = useCallback((messageId, rating) => {
    console.log(`Chat rating submitted: Message ${messageId}, Rating: ${rating ? 'Positive' : 'Negative'}`);
    // You can add additional logic here if needed
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);



  // Save messages to localStorage whenever they change (but not during streaming)
  useEffect(() => {
    if (messages.length > 0) {
      // Only save if no messages are currently streaming
      const hasStreamingMessages = messages.some(msg => msg.isStreaming);
      if (!hasStreamingMessages) {
        // Use default limit for Flowise (no Bubble config needed)
        saveMessagesToStorage(messages, 100); // Default limit
      }
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

  // Removed callVertexAI function - using Flowise only

  /**
   * Initialize a new Flowise session for faster response
   */
  const initializeFlowiseSession = useCallback(async () => {
    try {
      console.log('🔄 [FLOWISE SESSION] Initializing new session...');
      const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const apiEndpoint = isDevelopment ? 'http://localhost:3002/api/flowise/stream' : '/api/flowise/stream';
      
      // Send a simple initialization message to create new session
      const initResponse = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question: 'init',
          streaming: true
        })
      });
      
      if (initResponse.ok) {
        console.log('✅ [FLOWISE SESSION] New session initialized successfully');
        return true;
      } else {
        console.log('⚠️ [FLOWISE SESSION] Session initialization failed');
        return false;
      }
    } catch (error) {
      console.log('⚠️ [FLOWISE SESSION] Session initialization error:', error.message);
      return false;
    }
  }, []);

  /**
   * Call Flowise API with streaming support
   * @param {string} userMessage - The user's input message
   * @param {Function} onChunk - Callback for streaming chunks
   * @param {number} streamingMessageId - ID of the streaming message
   * @param {Array} images - Array of images to upload
   * @returns {Promise<Object>} Response from Flowise
   */
  const callFlowise = useCallback(async (userMessage, onChunk = null, streamingMessageId = null, images = []) => {
    try {
      setError(null);
      
      // Use correct API endpoint - port 3002 for development, relative path for production
      const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const apiEndpoint = isDevelopment ? 'http://localhost:3002/api/flowise/stream' : '/api/flowise/stream';
      
      console.log(`🌐 Calling Flowise real streaming API endpoint:`, apiEndpoint);
      
      // Get session data from browser storage
      const sessionData = JSON.parse(localStorage.getItem('jega_flowise_session') || '{}');
      const { chatId, sessionId } = sessionData;
      
      console.log(`🔍 [FLOWISE SESSION] Using chatId: ${chatId ? chatId.substring(0, 8) + '...' : 'none'}, sessionId: ${sessionId ? sessionId.substring(0, 8) + '...' : 'none'}`);
      
      // Debug image uploads
      if (images.length > 0) {
        console.log(`📷 [FLOWISE UPLOAD] Sending ${images.length} image(s) to Flowise:`, images.map(img => ({
          name: img.name,
          type: img.type,
          mime: img.mime,
          dataLength: img.data.length,
          dataPreview: img.data.substring(0, 50) + '...'
        })));
      }
      
      // Use fetch with streaming for real-time response - include session context
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question: userMessage,
          chatId: chatId || '',
          sessionId: sessionId || '',
          uploads: images.length > 0 ? images : []
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP ${response.status}: ${errorData.detail || response.statusText}`);
      }

      // Handle real streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';
      let metadata = {};
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            console.log('🔍 [FLOWISE STREAM] Stream completed');
            break;
          }

          // Decode the chunk
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;

          // Process complete lines
          const lines = buffer.split('\n');
          buffer = lines.pop(); // Keep incomplete line in buffer

          for (const line of lines) {
            if (line.trim() === '') continue;

            console.log('🔍 [FLOWISE STREAM] Processing line:', line);

            // Handle different types of streaming data
            if (line.startsWith('data:')) {
              try {
                const dataContent = line.substring(5).trim();
                if (dataContent === '[DONE]') {
                  console.log('🔍 [FLOWISE STREAM] Stream marked as done');
                  break;
                }
                
                const data = JSON.parse(dataContent);
                console.log('🔍 [FLOWISE STREAM] Parsed data:', data);

                // Handle token events (actual content)
                if (data.event === 'token' && data.data) {
                  const token = data.data;
                  console.log('🔍 [FLOWISE STREAM] Token:', token);
                  
                  // Accumulate response
                  fullResponse += token;
                  
                  // Send chunk to UI for real-time display
                  if (onChunk && typeof onChunk === 'function') {
                    onChunk(token);
                  }
                } else if (data.event === 'metadata' && data.data) {
                  metadata = data.data;
                  console.log('🔍 [FLOWISE STREAM] Metadata:', metadata);
                  
                  // Store session data for future requests
                  if (metadata.chatId || metadata.sessionId) {
                    const sessionData = {
                      chatId: metadata.chatId || '',
                      sessionId: metadata.sessionId || '',
                      lastUpdated: new Date().toISOString()
                    };
                    localStorage.setItem('jega_flowise_session', JSON.stringify(sessionData));
                    console.log('💾 [FLOWISE SESSION] Stored session data:', sessionData);
                  }
                }
              } catch (parseError) {
                console.warn('⚠️ [FLOWISE STREAM] Parse error for line:', line, parseError);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
      
      // Turn off streaming indicators
      if (streamingMessageId) {
        setMessages(prev => prev.map(msg => {
          if (msg.id === streamingMessageId) {
            return { 
              ...msg, 
              isStreaming: false,
              streamingPhase: null
            };
          }
          return msg;
        }));
      }
      
      // Return the complete response with metadata
      return {
        text: fullResponse || 'Xin lỗi, không nhận được phản hồi hoàn chỉnh từ Flowise.',
        model: 'flowise',
        metadata: metadata || {},
        sources: [] // Flowise doesn't provide sources in the same format
      };
      
    } catch (error) {
      console.error('❌ Flowise streaming error:', error);
      setError(error.message);
      return {
        text: 'Xin lỗi, hệ thống Flowise hiện tại không khả dụng. Vui lòng thử lại sau.',
        model: 'error'
      };
    }
  }, []);

  /**
   * Handle sending a new message - STREAMING VERSION with SMOOTH TYPEWRITER EFFECT
   */
  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;
    
    const userMessage = inputValue.trim();
    const imagesToSend = [...selectedImages]; // Store images before clearing
    setInputValue('');
    clearImages(); // Clear selected images after storing them
    setIsLoading(true);
    setError(null);
    setCurrentThoughts(''); // Reset thoughts for new message
    
    // Add user message to chat with images
    const newUserMessage = {
      id: Date.now(),
      text: userMessage,
      sender: 'user',
      timestamp: new Date(),
      images: imagesToSend.length > 0 ? imagesToSend : []
    };
    
    setMessages(prev => [...prev, newUserMessage]);
    
    // Create initial bot message for streaming
    const streamingBotMessage = {
      id: Date.now() + 1,
      text: '', // Will be updated as chunks arrive
      sender: 'bot',
      timestamp: new Date(),
      model: 'loading...',
      isStreaming: true, // Flag to indicate streaming status
      streamingPhase: 'processing', // Track streaming phase: 'processing' -> 'thinking' -> 'searching' -> 'generating'
      thoughts: '', // Will store accumulated thoughts
      isThinking: false // Flag to show thinking is active
    };
    
    setMessages(prev => [...prev, streamingBotMessage]);
    
    try {
      // Buffers and state for answer and thoughts
      let answerBuffer = '';
      let answerDisplayedLength = 0;
      let answerTypewriterInterval = null;
      let thoughtsBuffer = '';
      let processingTimer = null;
      let thinkingTimer = null;
      
      // 🕐 TIMING TRACKING: Track thoughts timing
      let thoughtsStartTime = null;
      let thoughtsEndTime = null;
      let thoughtsDuration = 0;
      let thoughtsChunkTimeout = null;

      // Typewriter update for answer - can start immediately
      const updateAnswer = (text) => {
        setMessages(prev => prev.map(msg => {
          if (msg.id === streamingBotMessage.id) {
            return { ...msg, text: text };
          }
          return msg;
        }));
      };

      // Instant update for thoughts - no typewriter animation
      const updateThoughts = (text) => {
        setMessages(prev => prev.map(msg => {
          if (msg.id === streamingBotMessage.id) {
            return { 
              ...msg, 
              thoughts: text, 
              isThinking: true,
              thoughtsCollapsed: true // Always collapsed by default
            };
          }
          return msg;
        }));
      };

      // Parallel flow: answer can start immediately, thoughts appear instantly
      let answerStarted = false;
      
      // Define onChunk callback for answer - start immediately when ready
      const onChunk = (chunk) => {
        answerBuffer += chunk;
        // Start answer typewriter immediately on first chunk
        if (!answerTypewriterInterval && !answerStarted) {
          answerStarted = true;
          console.log('📝 [PARALLEL] Starting answer typewriter immediately');
          answerTypewriterInterval = runTypewriterStream({
            getBuffer: () => answerBuffer,
            getDisplayedLength: () => answerDisplayedLength,
            setDisplayedLength: (len) => { answerDisplayedLength = len; },
            onTypewriterUpdate: updateAnswer,
            intervalMs: 3,
            onDone: () => {
              console.log('📝 [PARALLEL] Answer typewriter complete');
              setMessages(prev => prev.map(msg => {
                if (msg.id === streamingBotMessage.id) {
                  return { 
                    ...msg, 
                    isStreaming: false,
                    streamingPhase: null
                  };
                }
                return msg;
              }));
            }
          });
        }
      };
      
      // Define onThought callback for thoughts - instant display, no typewriter
      const onThought = (chunk) => {
        // 🕐 TIMING: Start timing when first thought chunk arrives
        if (!thoughtsStartTime) {
          thoughtsStartTime = Date.now();
          console.log('🕐 [TIMING] Thoughts started at:', new Date(thoughtsStartTime).toISOString());
        }
        
        thoughtsBuffer += chunk;
        
        // 🕐 TIMING: Track when we receive chunks to detect when thoughts are complete
        if (thoughtsChunkTimeout) {
          clearTimeout(thoughtsChunkTimeout);
        }
        
        // Set a timeout to detect when thoughts are complete (no more chunks for 500ms)
        thoughtsChunkTimeout = setTimeout(() => {
          if (!thoughtsEndTime) {
            thoughtsEndTime = Date.now();
            thoughtsDuration = thoughtsEndTime - thoughtsStartTime;
            console.log('🕐 [TIMING] Thoughts completed (no more chunks) in:', thoughtsDuration, 'ms');
            
            // Update thoughts duration when complete
            setMessages(prev => prev.map(msg => {
              if (msg.id === streamingBotMessage.id) {
                return { 
                  ...msg, 
                  isThinking: false,
                  thoughtsDuration: thoughtsDuration
                };
              }
              return msg;
            }));
          }
        }, 500);
        
        // Update thoughts instantly - no typewriter effect
        console.log('🧠 [PARALLEL] Updating thoughts instantly');
        updateThoughts(thoughtsBuffer);
      };

      // 🎯 ADAPTIVE UX PHASES: Shorter timers, skip searching for quick responses
      console.log(`🚀 [UX] API call starting - using adaptive phases`);
      
      let startTime = Date.now();
      let hasReceivedFirstChunk = false;
      
      // Phase 1 -> 2: Processing (2s) -> Thinking  
      processingTimer = setTimeout(() => {
        // Only switch to thinking if no chunk received yet
        if (!hasReceivedFirstChunk) {
          setMessages(prev => prev.map(msg => {
            if (msg.id === streamingBotMessage.id) {
              return { ...msg, streamingPhase: 'thinking' };
            }
            return msg;
          }));
          console.log(`🧠 [UX] Switched to 'thinking' phase after 2s`);
          
          // Phase 2 -> 3: Thinking (4s more) -> Searching (only for slower responses)
          thinkingTimer = setTimeout(() => {
            // Only show searching if still no chunks and it's been a while
            if (!hasReceivedFirstChunk) {
              setMessages(prev => prev.map(msg => {
                if (msg.id === streamingBotMessage.id) {
                  return { ...msg, streamingPhase: 'searching' };
                }
                return msg;
              }));
              console.log(`🔍 [UX] Switched to 'searching' phase after 6s total (slower response)`);
            }
          }, 4000);
        }
      }, 2000);
      


      // Get bot response - Flowise only (no chat history needed)
      const botResponse = await callFlowise(userMessage, onChunk, streamingBotMessage.id, imagesToSend);
      
      // 🔓 CRITICAL: Reset loading state immediately after API call completes
      // This ensures input is enabled as soon as the response is received
      setIsLoading(false);
      console.log('🔓 [INPUT] Loading state reset - input enabled');
      
      // ✅ Update metadata only - preserve the typewriter-animated text
      setMessages(prev => prev.map(msg => 
        msg.id === streamingBotMessage.id 
          ? {
              ...msg,
              // ✅ Ensure final text is complete (fallback) - but only if thoughts are done
              text: answerBuffer || msg.text,
              model: botResponse.model,
              sources: botResponse.sources,
              groundingMetadata: botResponse.groundingMetadata,
              usageMetadata: botResponse.usageMetadata,
              thoughts: thoughtsBuffer || msg.thoughts || '', // Always preserve full thoughts
              isThinking: !answerStarted, // Keep thinking state if answer not started
              isStreaming: !answerStarted, // Keep streaming if answer not started
              streamingPhase: answerStarted ? null : 'thinking' // Keep phase if answer not started
            }
          : msg
      ));
      
      console.log('🔄 [UI] Updated metadata only - preserved typewriter text');
      
      const totalResponseTime = Date.now() - startTime;
      
      console.log('✅ [CHAT] Streaming message completed:', {
        responseLength: answerBuffer.length,
        thoughtsLength: thoughtsBuffer.length,
        model: botResponse.model,
        totalResponseTime: totalResponseTime
      });
      
    } catch (error) {
      console.error('Error sending streaming message:', error);
      
      // 🧹 CLEANUP TYPEWRITER AND TIMERS ON ERROR
      if (answerTypewriterInterval) {
        clearInterval(answerTypewriterInterval);
        answerTypewriterInterval = null;
      }
      if (thoughtsChunkTimeout) {
        clearTimeout(thoughtsChunkTimeout);
        thoughtsChunkTimeout = null;
      }
      if (processingTimer) {
        clearTimeout(processingTimer);
        processingTimer = null;
      }
      if (thinkingTimer) {
        clearTimeout(thinkingTimer);
        thinkingTimer = null;
      }
      
      // 🔓 CRITICAL: Reset loading state on error to ensure input is not stuck
      setIsLoading(false);
      console.log('🔓 [ERROR] Loading state reset after error - input enabled');
      
      // Update the streaming message with error (preserve any streamed text)
      setMessages(prev => prev.map(msg => 
        msg.id === streamingBotMessage.id 
          ? {
              ...msg,
              // Only replace text if no streaming happened, otherwise preserve typewriter text
              text: answerBuffer || msg.text || 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.',
              thoughts: thoughtsBuffer || msg.thoughts || '',
              model: 'error',
              isStreaming: false,
              streamingPhase: null // Clear streaming phase on error
            }
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, messages, callFlowise, currentThoughts]);

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
   * Memoized message item component to prevent unnecessary re-renders
   */
  const MessageItem = React.memo(({ message, styles, onRatingSubmit }) => {
    const formattedText = useMemo(() => formatMessage(message.text), [message.text]);
    const formattedThoughts = useMemo(() => formatMessage(message.thoughts), [message.thoughts]);
    
    return (
      <div className={`${styles.messageWrapper} ${message.sender === 'bot' ? styles.botMessage : styles.userMessage}`}>
        {message.sender === 'bot' ? (
          <div className={styles.botGroupContainer}>
            {/* Thoughts section (if any) */}
            {message.thoughts && message.thoughts.trim() && (
              <details className={message.isThinking ? styles.thinkingContainer : styles.thoughtsContainer} open={!message.thoughtsCollapsed}>
                <summary className={styles.thoughtsSummary}>
                  🧠 {message.isThinking ? 'Đang suy nghĩ...' : 'Quá trình suy nghĩ'} ({message.thoughts.length} ký tự)
                  {message.thoughtsDuration && (
                    <span className={styles.thoughtsDuration}>
                      • {message.thoughtsDuration}ms
                    </span>
                  )}
                  {message.isThinking && <span className={styles.thinkingDots}>...</span>}
                </summary>
                <div className={styles.thoughtsContent}>
                  <pre>{message.thoughts}</pre>
                </div>
              </details>
            )}
            {/* Divider if both thoughts and message exist */}
            {message.thoughts && message.thoughts.trim() && message.text && (
              <div className={styles.thoughtsDivider} />
            )}
            {/* Bot message bubble */}
            <div 
              className={`${styles.messageBubble} ${message.isStreaming ? styles.streamingMessage : ''}`}
              data-model={message.model}
            >
              <div 
                className={styles.messageText} 
                dangerouslySetInnerHTML={{ __html: formattedText }} 
              />
              {/* Enhanced streaming indicator with four-phase messages */}
              {message.isStreaming && (
                <div className={styles.streamingIndicator}>
                  {message.streamingPhase === 'processing' && 'Đang xử lý câu hỏi của bạn...'}
                  {message.streamingPhase === 'thinking' && 'Suy nghĩ về câu hỏi của bạn...'}
                  {message.streamingPhase === 'searching' && 'Đang tìm kiếm dữ liệu...'}
                  {message.streamingPhase === 'generating' && 'Đang tạo phản hồi...'}
                </div>
              )}
            </div>
            
            {/* Chat Rating Component - Only show for completed bot messages (not streaming) */}
            {!message.isStreaming && message.text && (
              <ChatRating
                messageId={message.id}
                question={getUserQuestionForMessage(message.id)}
                answer={message.text}
                onRatingSubmit={onRatingSubmit}
              />
            )}
          </div>
        ) : (
          // User message (no thoughts)
          <div 
            className={`${styles.messageBubble} ${message.isStreaming ? styles.streamingMessage : ''}`}
            data-model={message.model}
          >
            <div 
              className={styles.messageText} 
              dangerouslySetInnerHTML={{ __html: formattedText }} 
            />
            {/* Display uploaded images in user message */}
            {message.images && message.images.length > 0 && (
              <div className={styles.userImageContainer}>
                {message.images.map((image) => (
                  <div key={image.id} className={styles.userImagePreview}>
                    <img 
                      src={image.data} 
                      alt={image.name}
                      className={styles.userImage}
                    />
                    <span className={styles.userImageName}>{image.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  });

  /**
   * Format message text with markdown-like syntax
   */
  const formatMessage = useCallback((text) => {
    if (!text) return '';
    
    // Simple HTML escaping function
    function esc(str) {
      return str.replace(/[&<>"']/g, (match) => {
        const escapeMap = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
        return escapeMap[match];
      });
    }
    
    let formatted = text
      // Convert markdown headers (must be done before \n to <br> conversion)
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      // Process source links BEFORE list processing to avoid breaking list structure
      .replace(/(?:\n)*<source>(?:\s)*(?:<url>(.*?)<\/url>(?:\s)*(?:<title>(.*?)<\/title>)?|<title>(.*?)<\/title>(?:\s)*<url>(.*?)<\/url>)(?:\s)*<\/source>/gis, 
        (match, url1, title1, title2, url2) => {
          const url = (url1 || url2).trim();
          const title = (title1 || title2 || 'Xem bài hướng dẫn tại đây').trim();
          
          // Check if this is an internal docusaurus link
          const isInternal = url.includes('jegavn-kb.vercel.app/docs/') || url.includes('localhost:3000/docs/');
          
          let linkAttrs = '';
          let iconPath = '';
          
          if (isInternal) {
            // For internal links, extract the path and navigate internally
            const docPath = url.split('/docs/')[1].replace(/^\/+/, ''); // Remove leading slashes to prevent double slashes
            linkAttrs = `href="/docs/${docPath}" class="${styles.sourceLink} internal-link" data-internal-path="/docs/${docPath}"`;
            // Use internal navigation icon
            iconPath = '<path d="M9 12L11 14L15 10" stroke="currentColor" stroke-width="2" fill="none"/><path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" fill="none"/>';
          } else {
            // For external links, use target="_blank"
            linkAttrs = `href="${esc(url)}" target="_blank" rel="noopener noreferrer" class="${styles.sourceLink}"`;
            // Use external link icon
            iconPath = '<path d="M18 13V19C18 19.5304 17.7893 20.0391 17.4142 20.4142C17.0391 20.7893 16.5304 21 16 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V8C3 7.46957 3.21071 6.96086 3.58579 6.58579C3.96086 6.21071 4.46957 6 5 6H11" stroke="currentColor" stroke-width="2" fill="none"/><path d="M15 3H21V9" stroke="currentColor" stroke-width="2" fill="none"/><path d="M10 14L21 3" stroke="currentColor" stroke-width="2" fill="none"/>';
          }
          
          console.log('🔗 Found source link:', { 
            originalUrl: url, 
            title, 
            isInternal, 
            docPath: isInternal ? url.split('/docs/')[1].replace(/^\/+/, '') : null, 
            cssClass: styles.sourceLink,
            match: match
          });
          // Use a span instead of div to keep it inline within list items
          return `<span class="source-link-container"><a ${linkAttrs}><svg width="12" height="12" viewBox="0 0 24 24" fill="none">${iconPath}</svg>${esc(title)}</a></span>`;
        });

    // Process lists after source links are converted to inline elements
    // Handle numbered lists (1. 2. 3. etc.) - now with proper source link handling
    formatted = formatted.replace(/(^|\n)((?:\d+\.\s+.+(?:\n|$))+)/gm, (match, prefix, listContent) => {
      const items = listContent.trim().split('\n').map(item => {
        const cleaned = item.replace(/^\d+\.\s+/, '').trim();
        return cleaned ? `<li>${cleaned}</li>` : '';
      }).filter(Boolean);
      return `${prefix}<ol>${items.join('')}</ol>`;
    });

    // Handle bullet lists (*, -, + patterns)
    formatted = formatted.replace(/(^|\n)((?:[*+-]\s+.+(?:\n|$))+)/gm, (match, prefix, listContent) => {
      const items = listContent.trim().split('\n').map(item => {
        const cleaned = item.replace(/^[*+-]\s+/, '').trim();
        return cleaned ? `<li>${cleaned}</li>` : '';
      }).filter(Boolean);
      return `${prefix}<ul>${items.join('')}</ul>`;
    });

    // Now convert remaining newlines to <br>
    formatted = formatted.replace(/\n/g, '<br>')
      // Convert [Link] URL patterns to clickable links
      .replace(/\[Link\]\s*(https?:\/\/[^\s]+)/g, (match, url) => {
        const isInternal = url.includes('jegavn-kb.vercel.app/docs/') || url.includes('localhost:3000/docs/');
        
        if (isInternal) {
          const docPath = url.split('/docs/')[1].replace(/^\/+/, ''); // Remove leading slashes to prevent double slashes
          return `<a href="/docs/${docPath}" class="${styles.sourceLink} internal-link" data-internal-path="/docs/${docPath}">Xem bài hướng dẫn tại đây</a>`;
        } else {
          return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="${styles.sourceLink}">Xem bài hướng dẫn tại đây</a>`;
        }
      })
      // Clean up consecutive <br> tags to prevent extra empty lines
      .replace(/(<br\/?>){2,}/gi, '<br>')
      // Remove <br> tags that appear immediately after header closing tags to prevent extra spacing
      .replace(/(<\/h[1-6]>)\s*(<br\/?>)/gi, '$1');
    
    return formatted;
  }, []);

  /**
   * Handle image file selection
   */
  const handleImageSelect = useCallback((event) => {
    const files = Array.from(event.target.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) return;
    
    // Check if user is trying to select more than 3 images total
    const totalImagesAfterSelection = selectedImages.length + imageFiles.length;
    if (totalImagesAfterSelection > 3) {
      // Remove any existing warning messages first, then add new one
      setMessages(prev => {
        const filteredMessages = prev.filter(msg => msg.model !== 'warning');
        return [...filteredMessages, {
          id: Date.now(),
          text: `⚠️ Bạn chỉ có thể tải lên tối đa 3 ảnh. Hiện tại bạn đã có ${selectedImages.length} ảnh, vui lòng chọn tối đa ${3 - selectedImages.length} ảnh nữa.`,
          sender: 'bot',
          timestamp: new Date(),
          model: 'warning'
        }];
      });
      
      // Clear the input
      event.target.value = '';
      return;
    }
    
    // Remove any existing warning messages when user selects correct number
    setMessages(prev => prev.filter(msg => msg.model !== 'warning'));
    
    // Limit to 3 images max
    const newImages = imageFiles.slice(0, 3 - selectedImages.length);
    
    newImages.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target.result;
        const mimeType = file.type;
        const fileName = file.name;
        
        const imageData = {
          data: base64,
          type: 'image',
          name: fileName,
          mime: mimeType,
          id: Date.now() + Math.random() // Unique ID for React key
        };
        
        setSelectedImages(prev => [...prev, imageData]);
        console.log('📷 Image selected:', { 
          fileName, 
          mimeType, 
          size: file.size,
          base64Length: base64.length,
          base64Preview: base64.substring(0, 50) + '...'
        });
      };
      reader.readAsDataURL(file);
    });
    
    // Clear the input so the same file can be selected again
    event.target.value = '';
  }, [selectedImages.length]);

  /**
   * Remove selected image
   */
  const removeImage = useCallback((imageId) => {
    setSelectedImages(prev => prev.filter(img => img.id !== imageId));
  }, []);

  /**
   * Clear all selected images
   */
  const clearImages = useCallback(() => {
    setSelectedImages([]);
    setImagePreview(null);
  }, []);

  /**
   * Clear chat history and initialize new Flowise session
   */
  const handleClearChat = useCallback(async () => {
    console.log('🗑️ Clearing chat history...');
    
    // Clear from localStorage
    clearMessagesFromStorage();
    
    // Clear Flowise session data
    localStorage.removeItem('jega_flowise_session');
    console.log('🗑️ [FLOWISE SESSION] Cleared session data');
    
    // Clear selected images
    clearImages();
    
    // Reset to default welcome message
    setMessages([
      {
        id: Date.now(),
        text: 'Chào bạn, tôi có thể giúp gì cho bạn hôm nay?',
        sender: 'bot',
        timestamp: new Date(),
        model: 'system'
      }
    ]);
    setError(null);
    
    // Initialize new Flowise session for faster response
    await initializeFlowiseSession();
    
    // Notify parent component if callback is provided
    if (onClearChat) {
      onClearChat();
    }
  }, [onClearChat, clearImages]);

  // Handle internal link navigation
  useEffect(() => {
    const handleInternalLinkClick = (event) => {
      const target = event.target.closest('a.internal-link');
      if (target) {
        event.preventDefault();
        const internalPath = target.getAttribute('data-internal-path');
        if (internalPath) {
          console.log('🔄 Navigating to internal path:', internalPath);
          // Use browser history for navigation without page reload to preserve ChatBot panel state
          window.history.pushState({}, '', internalPath);
          // Trigger a popstate event to notify React Router
          window.dispatchEvent(new PopStateEvent('popstate'));
          // Note: Removed window.location.href to prevent full page reload that closes the ChatBot panel
        }
      }
    };

    // Add click listener to the chat messages container
    const chatMessagesContainer = document.querySelector(`.${styles.chatMessages}`);
    if (chatMessagesContainer) {
      chatMessagesContainer.addEventListener('click', handleInternalLinkClick);
    }

    return () => {
      if (chatMessagesContainer) {
        chatMessagesContainer.removeEventListener('click', handleInternalLinkClick);
      }
    };
  }, [messages]);

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
          <MessageItem 
            key={message.id} 
            message={message} 
            styles={styles} 
            onRatingSubmit={handleChatRatingSubmit}
          />
        ))}
        

        
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className={styles.chatInput}>
        {/* Image preview area */}
        {selectedImages.length > 0 && (
          <div className={styles.imagePreviewContainer}>
            {selectedImages.map((image) => (
              <div key={image.id} className={styles.imagePreview}>
                <img 
                  src={image.data} 
                  alt={image.name}
                  className={styles.previewImage}
                />
                <button 
                  className={styles.removeImageButton}
                  onClick={() => removeImage(image.id)}
                  aria-label="Xóa ảnh"
                >
                  ×
                </button>
                <span className={styles.imageName}>{image.name}</span>
              </div>
            ))}
          </div>
        )}
        
        <div className={styles.inputContainer}>
          {/* Image upload button - moved to left */}
          <input
            type="file"
            id="image-upload"
            accept="image/*"
            multiple
            onChange={handleImageSelect}
            style={{ display: 'none' }}
            disabled={isLoading || selectedImages.length >= 3}
          />
          <label 
            htmlFor="image-upload" 
            className={`${styles.imageUploadButton} ${(isLoading || selectedImages.length >= 3) ? styles.disabled : ''}`}
            title={selectedImages.length >= 3 ? 'Tối đa 3 ảnh' : 'Tải lên ảnh'}
          >
            <i className="fa-regular fa-images"></i>
          </label>
          
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