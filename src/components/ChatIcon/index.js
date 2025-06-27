import React from 'react';

/**
 * ChatIcon Component
 * 
 * A reusable clickable chat icon that opens the JEGA Assistant chat panel.
 * Can be used in any document or component.
 * 
 * @param {Object} props - Component props
 * @param {string} props.text - Text to display above the icon (optional)
 * @param {string} props.size - Size of the icon: 'small', 'medium', 'large' (default: 'medium')
 * @param {string} props.position - Position styling: 'inline', 'center', 'left', 'right' (default: 'center')
 * @param {boolean} props.showBackground - Whether to show background container (default: true)
 */
export default function ChatIcon({ 
  text = "Cần hỗ trợ thêm? Hãy hỏi JEGA Assistant!", 
  size = 'medium', 
  position = 'center',
  showBackground = true 
}) {
  const sizeMap = {
    small: { icon: 16, button: 40 },
    medium: { icon: 24, button: 60 },
    large: { icon: 32, button: 80 }
  };

  const positionMap = {
    inline: { textAlign: 'left', display: 'inline-block' },
    center: { textAlign: 'center', display: 'block' },
    left: { textAlign: 'left', display: 'block' },
    right: { textAlign: 'right', display: 'block' }
  };

  const { icon: iconSize, button: buttonSize } = sizeMap[size];
  const { textAlign, display } = positionMap[position];

  const handleClick = () => {
    if (window.openChatPanel) {
      window.openChatPanel();
    } else {
      console.log('Chat panel not available');
    }
  };

  const buttonStyle = {
    background: '#25c2a0',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: `${buttonSize}px`,
    height: `${buttonSize}px`,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
    boxShadow: '0 2px 8px rgba(37, 194, 160, 0.3)',
  };

  const containerStyle = {
    textAlign,
    display,
    margin: showBackground ? '2rem 0' : '1rem 0',
    padding: showBackground ? '1rem' : '0',
    background: showBackground ? '#f8f9fa' : 'transparent',
    borderRadius: showBackground ? '8px' : '0',
  };

  return (
    <div style={containerStyle}>
      {text && (
        <p style={{ 
          marginBottom: '1rem', 
          color: '#666',
          fontSize: size === 'small' ? '14px' : '16px'
        }}>
          {text}
        </p>
      )}
      <button 
        onClick={handleClick}
        style={buttonStyle}
        onMouseOver={(e) => {
          e.target.style.transform = 'scale(1.1)';
          e.target.style.boxShadow = '0 4px 12px rgba(37, 194, 160, 0.4)';
        }}
        onMouseOut={(e) => {
          e.target.style.transform = 'scale(1)';
          e.target.style.boxShadow = '0 2px 8px rgba(37, 194, 160, 0.3)';
        }}
        title="Mở JEGA Assistant"
        aria-label="Mở JEGA Assistant"
      >
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H6L4 18V4H20V16Z" fill="currentColor"/>
          <path d="M7 9H17V11H7V9ZM7 12H14V14H7V12Z" fill="currentColor"/>
        </svg>
      </button>
    </div>
  );
} 