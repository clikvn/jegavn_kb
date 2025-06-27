import React from 'react';
import styles from './ChatBotPanel.module.css';
import chatIcon from '../../icon/chat-icon.png';

/**
 * ChatBot Panel Component
 * 
 * This component provides a sliding panel interface for the JEGA Assistant chatbot.
 * It wraps the ChatBot component and provides additional panel-specific functionality
 * like header controls and panel management.
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.open - Whether the panel is open
 * @param {Function} props.onClose - Callback when panel should close
 * @param {React.ReactNode} props.children - ChatBot component to render inside panel
 * @param {React.RefObject} props.chatBotRef - Ref to the ChatBot component
 */
export default function ChatBotPanel({ open, onClose, children, chatBotRef }) {
  /**
   * Handle delete conversation functionality
   * This calls the clear chat function from the ChatBot component
   */
  const handleDeleteConversation = () => {
    console.log('🗑️ Delete conversation requested');
    
    // Try multiple methods to call the clear function
    if (chatBotRef && chatBotRef.current && typeof chatBotRef.current.clearChat === 'function') {
      // Method 1: Direct ref call
      chatBotRef.current.clearChat();
    } else if (window.clearChatHistory && typeof window.clearChatHistory === 'function') {
      // Method 2: Global function (fallback)
      window.clearChatHistory();
    } else {
      console.warn('Clear chat function not available');
    }
  };

  /**
   * Handle panel close with escape key
   */
  React.useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && open) {
        onClose();
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, onClose]);

  return (
    <>
      {/* Panel container */}
      <div className={`${styles.chatBotPanel} ${open ? styles.open : ''}`}>
        {/* Panel header */}
        <div className={styles.panelHeader}>
          <div className={styles.panelTitleContainer}>
            {/* Chat PNG Icon */}
            <img 
              src={chatIcon} 
              alt="JEGA Assistant Icon" 
              className={styles.panelTitleSparkle}
              width={28}
              height={28}
              style={{ display: 'inline-block', verticalAlign: 'middle' }}
            />
            <h2 className={styles.panelTitle}>JEGA Assistant</h2>
          </div>
          
          <div className={styles.panelHeaderActions}>
            {/* Delete Icon Button */}
            <button 
              onClick={handleDeleteConversation} 
              className={styles.actionButton} 
              aria-label="Xóa cuộc trò chuyện"
              title="Xóa cuộc trò chuyện"
            >
              <svg 
                width="18" 
                height="18" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </button>
            
            {/* Close Icon Button (X) */}
            <button 
              onClick={onClose} 
              className={styles.actionButton} 
              aria-label="Đóng JEGA Assistant"
              title="Đóng JEGA Assistant"
            >
              <svg 
                width="18" 
                height="18" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
        
        {/* Panel content wrapper */}
        <div className={styles.panelContentWrapper}>
          {/* Render children directly without cloning */}
          {children}
        </div>
      </div>
    </>
  );
} 