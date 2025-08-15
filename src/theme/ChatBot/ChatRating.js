import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faThumbsUp, faThumbsDown } from '@fortawesome/free-solid-svg-icons';
import styles from './styles.module.css';

/**
 * ChatRating Component
 * Displays thumbs up/down rating buttons for AI responses
 */
const ChatRating = ({ messageId, question, answer, onRatingSubmit }) => {
  const [userRating, setUserRating] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasRated, setHasRated] = useState(false);

  // Check if user has already rated this message
  useEffect(() => {
    const ratedMessages = JSON.parse(localStorage.getItem('jega_chat_ratings') || '{}');
    if (ratedMessages[messageId]) {
      setUserRating(ratedMessages[messageId].rating);
      setHasRated(true);
    }
  }, [messageId]);

  // Add a small delay before showing the rating component for better UX
  const [showRating, setShowRating] = useState(false);
  
  useEffect(() => {
    if (question && answer) {
      const timer = setTimeout(() => {
        setShowRating(true);
      }, 500); // 500ms delay after answer is complete
      
      return () => clearTimeout(timer);
    }
  }, [question, answer]);

  const handleRating = async (rating) => {
    if (isSubmitting) return;
    
    // If user is re-rating with the same rating, do nothing
    if (hasRated && userRating === rating) return;
    
    setIsSubmitting(true);
    try {
      // Call the rating API - use relative path for production, localhost for development
      const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const apiEndpoint = isDevelopment ? 'http://localhost:3002/api/chat-rating' : '/api/chat-rating';
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message_id: messageId,
          question: question,
          answer: answer,
          rating: rating, // true for thumbs up, false for thumbs down
        }),
      });

      if (response.ok) {
        // Save to localStorage
        const ratedMessages = JSON.parse(localStorage.getItem('jega_chat_ratings') || '{}');
        ratedMessages[messageId] = {
          rating: rating,
          timestamp: new Date().toISOString(),
        };
        localStorage.setItem('jega_chat_ratings', JSON.stringify(ratedMessages));
        
        setUserRating(rating);
        setHasRated(true);
        
        // Call the callback if provided
        if (onRatingSubmit) {
          onRatingSubmit(messageId, rating);
        }
      }
    } catch (error) {
      console.error('Failed to submit chat rating:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't show rating if not ready yet
  if (!showRating) {
    return null;
  }

  // Always show rating buttons, even after user has rated (allows re-rating)
  return (
    <div className={styles.chatRatingContainer}>
      <div className={styles.ratingQuestion}>
        Câu trả lời này có hữu ích không?
      </div>
      

      
      <div className={styles.ratingButtons}>
        <button
          className={`${styles.ratingBtn} ${styles.ratingBtnPositive} ${userRating === true ? styles.selected : ''}`}
          onClick={() => handleRating(true)}
          disabled={isSubmitting}
          title={hasRated ? "Cập nhật đánh giá thành hữu ích" : "Câu trả lời hữu ích"}
        >
          <FontAwesomeIcon icon={faThumbsUp} />
        </button>
        <button
          className={`${styles.ratingBtn} ${styles.ratingBtnNegative} ${userRating === false ? styles.selected : ''}`}
          onClick={() => handleRating(false)}
          disabled={isSubmitting}
          title={hasRated ? "Cập nhật đánh giá thành không hữu ích" : "Câu trả lời không hữu ích"}
        >
          <FontAwesomeIcon icon={faThumbsDown} />
        </button>
      </div>
    </div>
  );

};

export default ChatRating;
