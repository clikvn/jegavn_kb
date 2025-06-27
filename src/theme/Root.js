import React, { useState, useEffect, useRef } from 'react';
import {useLocation} from '@docusaurus/router';
import ChatBot from './ChatBot';
import ChatBotPanel from '../components/ChatBotPanel';

export default function Root({children}) {
  const location = useLocation();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const chatBotRef = useRef(null);

  // Mintlify-inspired smooth scrolling and focus management
  useEffect(() => {
    // Smooth scroll to top on route change
    window.scrollTo(0, 0);
    
    // Focus management for accessibility
    const mainContent = document.querySelector('main');
    if (mainContent) {
      mainContent.focus();
    }
  }, [location.pathname]);

  // Make chat panel functions globally available
  useEffect(() => {
    // Global function to open chat panel
    window.openChatPanel = () => {
      setIsPanelOpen(true);
    };

    // Global function to close chat panel
    window.closeChatPanel = () => {
      setIsPanelOpen(false);
    };

    // Add click handlers for chat icons
    const addChatIconListeners = () => {
      const chatIcons = document.querySelectorAll('.chat-icon');
      chatIcons.forEach(icon => {
        if (!icon.hasAttribute('data-click-handler')) {
          icon.setAttribute('data-click-handler', 'true');
          icon.addEventListener('click', () => {
            if (window.openChatPanel) {
              window.openChatPanel();
            }
          });
        }
      });
    };

    // Initial setup
    addChatIconListeners();

    // Handle dynamically added content
    const observer = new MutationObserver(() => {
      addChatIconListeners();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Cleanup on unmount
    return () => {
      delete window.openChatPanel;
      delete window.closeChatPanel;
      observer.disconnect();
    };
  }, []);

  // Mintlify-inspired theme toggle using Docusaurus's built-in system
  useEffect(() => {
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
      themeToggle.innerHTML = `
        <button 
          onclick="window.toggleTheme && window.toggleTheme()"
          style="
            background: none;
            border: none;
            cursor: pointer;
            padding: 8px;
            border-radius: 6px;
            color: var(--foreground);
            transition: background-color 0.2s ease;
          "
          onmouseover="this.style.backgroundColor='var(--muted)'"
          onmouseout="this.style.backgroundColor='transparent'"
          aria-label="Toggle theme"
        >
          🌙
        </button>
      `;
    }
    
    // Make toggle function globally available using Docusaurus's color mode
    window.toggleTheme = () => {
      const colorModeToggle = document.querySelector('[data-theme-toggle]');
      if (colorModeToggle) {
        colorModeToggle.click();
      }
    };

    // Update theme icon based on current theme
    const updateThemeIcon = () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const themeToggle = document.querySelector('.theme-toggle button');
      if (themeToggle) {
        themeToggle.innerHTML = isDark ? '☀️' : '🌙';
      }
    };

    // Initial update
    updateThemeIcon();

    // Listen for theme changes
    const observer = new MutationObserver(updateThemeIcon);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });

    return () => observer.disconnect();
  }, []);

  // Handle clear chat functionality
  const handleClearChat = () => {
    console.log('🗑️ Clear chat requested from Root component');
    // The actual clearing is handled by the ChatBot component itself
    // This is just for logging and any future panel-level actions
  };

  return (
    <>
      {children}
      
      {/* ChatBot component now primarily acts as the icon trigger for the panel */}
      <ChatBot 
        onIconClick={() => setIsPanelOpen(true)} 
        isPanelVersion={false} /* Tells ChatBot to only render its icon */
      />

      <ChatBotPanel open={isPanelOpen} onClose={() => setIsPanelOpen(false)} chatBotRef={chatBotRef}>
        {/* Render ChatBot's UI part inside the panel, only when panel is open */}
        {isPanelOpen && (
          <ChatBot 
            ref={chatBotRef}
            isPanelVersion={true} 
            onClearChat={handleClearChat}
          />
        )}
      </ChatBotPanel>
      
      {/* Mintlify-inspired floating action button for scroll-to-top - REMOVED */}

      {/* Mintlify-inspired progress bar */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '3px',
          background: 'var(--primary)',
          transform: 'scaleX(0)',
          transformOrigin: 'left',
          transition: 'transform 0.3s ease',
          zIndex: 1001,
        }}
        id="progress-bar"
      />
    </>
  );
} 