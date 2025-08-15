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

const saveMessagesToStorage = (messages, userHistoryLimit) => {
  try {
    if (typeof window === 'undefined') return; // SSR check
    
    // Require userHistoryLimit from Bubble config - no default fallback
    if (!userHistoryLimit || typeof userHistoryLimit !== 'number') {
      console.warn('⚠️ userHistoryLimit not provided from Bubble config, skipping save');
      return;
    }
    
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

// Reusable typewriter streaming function
function runTypewriterStream({
  appendChunk, // function to append chunk to buffer
  getBuffer,   // function to get current buffer
  getDisplayedLength, // function to get current displayed length
  setDisplayedLength, // function to set displayed length
  onTypewriterUpdate, // function to update UI with current text
  intervalMs = 10,    // typewriter speed
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
      model: 'system',
      sources: []
    }
    ];
  });
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chatConfig, setChatConfig] = useState(null); // Must be loaded from Bubble API
  const [currentThoughts, setCurrentThoughts] = useState(''); // Track current thoughts for streaming
  
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
        const apiEndpoint = isDevelopment ? 'http://localhost:3002/api/config' : '/api/config';
        
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
              userHistory: data.config.chatSettings.userHistory,
              // Store full config for potential future use
              fullConfig: data.config
            });
            console.log('🔧 Loaded chat configuration from Bubble:', {
              chatSettings: data.config.chatSettings,
              aiModel: data.config.aiModel,
              hasFullConfig: !!data.config.systemPrompt
            });
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
   * Call Vertex AI API with user message and chat history - STREAMING VERSION
   * Includes retry mechanism for 429 errors as recommended by Google
   * @param {string} userMessage - The user's input message
   * @param {Array} chatHistory - Previous conversation messages
   * @param {Function} onChunk - Callback for streaming chunks
   * @returns {Promise<Object>} Response from Vertex AI
   */
  const callVertexAI = useCallback(async (userMessage, chatHistory, onChunk = null, streamingMessageId = null, onThought = null) => {
    const maxRetries = 2; // Google recommendation: retry no more than 2 times
    const baseDelay = 1000; // Google recommendation: minimum delay of 1 second
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        setError(null);
        
        // Use correct API endpoint - port 3001 for development, relative path for production
        const isDevelopment = process.env.NODE_ENV === 'development' || 
                             window.location.hostname === 'localhost' ||
                             window.location.hostname === '127.0.0.1';
        const apiEndpoint = isDevelopment ? 'http://localhost:3002/api/vertex-ai' : '/api/vertex-ai';
        
        console.log(`🌐 Calling streaming API endpoint (attempt ${attempt + 1}/${maxRetries + 1}):`, apiEndpoint);
        
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

        // Handle streaming response
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullResponse = '';
        let finalMetadata = null;
        let streamCompleted = false; // Track if stream completed properly
        
        console.log('🌊 [STREAM] Starting to process streaming response...');
        console.log('🔍 [DEBUG] onChunk callback type:', typeof onChunk);
        console.log('🔍 [DEBUG] onChunk callback:', onChunk);
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              console.log('✅ [STREAM] Stream complete');
              break;
            }
            
            // Decode chunk and add to buffer
            buffer += decoder.decode(value, { stream: true });
            
            // Process complete lines
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete line in buffer
            
            for (const line of lines) {
              if (line.trim() === '' || !line.startsWith('data: ')) continue;
              
              const dataStr = line.substring(6); // Remove 'data: ' prefix
              
              if (dataStr === '[DONE]') {
                console.log('🏁 [STREAM] Received [DONE] signal');
                
                // 🎯 IMMEDIATE STREAM COMPLETION: Turn off streaming indicators right away
                if (streamingMessageId) {
                  setMessages(prev => prev.map(msg => {
                    if (msg.id === streamingMessageId) {
                      return { 
                        ...msg, 
                        isStreaming: false, // ✅ Immediately stop streaming indicator
                        streamingPhase: null // ✅ Clear streaming phase
                      };
                    }
                    return msg;
                  }));
                }
                
                console.log('✅ [STREAM] Streaming indicators turned off immediately');
                
                // 🔓 CRITICAL: Force break to ensure promise resolves properly
                streamCompleted = true;
                break;
              }
              
              try {
                const data = JSON.parse(dataStr);
                
                if (data.type === 'chunk') {
                  console.log(`🔍 [DEBUG] Processing chunk: ${data.content.length} chars`);
                  console.log(`🔍 [DEBUG] Chunk content: "${data.content.substring(0, 100)}..."`);
                  
                  fullResponse += data.content;
                  
                  // Call onChunk callback for real-time UI updates
                  if (onChunk && typeof onChunk === 'function') {
                    console.log(`🔄 [UI] Calling onChunk with: "${data.content.substring(0, 30)}..."`);
                    onChunk(data.content);
                    console.log(`✅ [UI] onChunk called successfully`);
                  } else {
                    console.error(`❌ [UI] onChunk not available! Type: ${typeof onChunk}`);
                  }
                  
                  console.log(`📝 [STREAM] Received chunk: ${data.content.substring(0, 50)}...`);
                  
                } else if (data.type === 'thought') {
                  console.log(`🧠 [THOUGHT] Processing thought: ${data.content.length} chars`);
                  console.log(`🧠 [THOUGHT] Thought content: "${data.content.substring(0, 100)}..."`);
                  
                  // Accumulate thoughts for display
                  setCurrentThoughts(prev => prev + data.content);
                  
                  // Call onThought callback for typewriter effect
                  if (onThought && typeof onThought === 'function') {
                    console.log(`🧠 [UI] Calling onThought with: "${data.content.substring(0, 30)}..."`);
                    onThought(data.content);
                    console.log(`✅ [UI] onThought called successfully`);
                  } else {
                    console.error(`❌ [UI] onThought not available! Type: ${typeof onThought}`);
                  }
                  
                  console.log(`🧠 [THOUGHT] Received thought: ${data.content.substring(0, 50)}...`);
                  
                } else if (data.type === 'complete') {
                  finalMetadata = data;
                  console.log('📊 [STREAM] Received final metadata:', {
                    model: data.model
                  });
                  
                } else if (data.type === 'error') {
                  throw new Error(data.error || 'Streaming error occurred');
                }
                
              } catch (parseError) {
                console.warn('⚠️ [STREAM] Failed to parse SSE data:', dataStr.substring(0, 100));
              }
            }
            
            // 🔓 CRITICAL: Check if stream completed via [DONE] signal
            if (streamCompleted) {
              console.log('🎯 [STREAM] Breaking outer loop - stream completed');
              break;
            }
          }
          
        } catch (streamError) {
          console.error('❌ [STREAM] Streaming error:', streamError);
          throw streamError;
        }
        
        // Return the complete response with metadata
        if (finalMetadata) {
          return {
            text: finalMetadata.fullResponse || fullResponse,
            model: finalMetadata.model || 'unknown-model',
            usageMetadata: finalMetadata.usageMetadata
          };
        } else {
          // Fallback if no final metadata received
          return {
            text: fullResponse || 'Xin lỗi, không nhận được phản hồi hoàn chỉnh.',
            model: 'unknown-model'
          };
        }
        
      } catch (error) {
        // If this is the last attempt or not a retryable error, throw
        if (attempt === maxRetries || (error.message && !error.message.includes('429'))) {
          console.error('❌ Vertex AI streaming error:', error);
          setError(error.message);
          return {
            text: 'Xin lỗi, hệ thống JEGA Assistant hiện tại không khả dụng. Vui lòng thử lại sau hoặc liên hệ với bộ phận hỗ trợ.',
            model: 'error'
          };
        }
        
        // For retryable errors, continue to next attempt
        console.log(`🔄 Retryable error on attempt ${attempt + 1}, will retry:`, error.message);
      }
    }
  }, [chatConfig]);

  /**
   * Handle sending a new message - STREAMING VERSION with SMOOTH TYPEWRITER EFFECT
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
    setCurrentThoughts(''); // Reset thoughts for new message
    
    // Add user message to chat
    const newUserMessage = {
      id: Date.now(),
      text: userMessage,
      sender: 'user',
      timestamp: new Date()
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
            intervalMs: 10,
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
      


      // Get bot response with streaming (starts immediately!)
      const botResponse = await callVertexAI(userMessage, [...messages, newUserMessage], onChunk, streamingBotMessage.id, onThought);
      
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
  }, [inputValue, isLoading, messages, callVertexAI, chatConfig, currentThoughts]);

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
      .replace(/(?:\n)*<source>(?:\s)*(?:<url>(.*?)<\/url>(?:\s)*<title>(.*?)<\/title>|<title>(.*?)<\/title>(?:\s)*<url>(.*?)<\/url>)(?:\s)*<\/source>/gis, 
        (match, url1, title1, title2, url2) => {
          const url = (url1 || url2).trim();
          const title = (title1 || title2).trim();
          
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
            cssClass: styles.sourceLink 
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
          return `<a href="/docs/${docPath}" class="${styles.sourceLink} internal-link" data-internal-path="/docs/${docPath}">Link</a>`;
        } else {
          return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="${styles.sourceLink}">Link</a>`;
        }
      })
      // Clean up consecutive <br> tags to prevent extra empty lines
      .replace(/(<br\/?>){2,}/gi, '<br>')
      // Remove <br> tags that appear immediately after header closing tags to prevent extra spacing
      .replace(/(<\/h[1-6]>)\s*(<br\/?>)/gi, '$1');
    
    console.log('📝 formatMessage result:', formatted);
    
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
        model: 'system'
      }
    ]);
    setError(null);
    
    // Notify parent component if callback is provided
    if (onClearChat) {
      onClearChat();
    }
  }, [onClearChat]);

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
          <div key={message.id} className={`${styles.messageWrapper} ${message.sender === 'user' ? styles.userMessage : styles.botMessage}`}>
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
                <div className={`${styles.messageBubble} ${message.isStreaming ? styles.streamingMessage : ''}`}>
                  <div 
                    className={styles.messageText} 
                    dangerouslySetInnerHTML={{ __html: formatMessage(message.text) }} 
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
              </div>
            ) : (
              // User message (no thoughts)
              <div className={`${styles.messageBubble} ${message.isStreaming ? styles.streamingMessage : ''}`}>
                <div 
                  className={styles.messageText} 
                  dangerouslySetInnerHTML={{ __html: formatMessage(message.text) }} 
                />
              </div>
            )}
          </div>
        ))}
        

        
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