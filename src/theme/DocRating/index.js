import React, { useState, useEffect } from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faThumbsUp, faThumbsDown } from '@fortawesome/free-solid-svg-icons';
import './index.css';

const DocRating = () => {
  const { siteConfig } = useDocusaurusContext();
  const [currentPath, setCurrentPath] = useState('');
  const [ratingStats, setRatingStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRating, setSelectedRating] = useState(null);
  const [userHasRated, setUserHasRated] = useState(false);
  const [userPreviousRating, setUserPreviousRating] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Extract doc_id from current page path
  const getDocId = () => {
    const path = currentPath;
    // Remove /docs prefix and trailing slash
    const docPath = path.replace(/^\/docs/, '').replace(/\/$/, '');
    return docPath || '/';
  };

  // Fetch rating statistics for current document
  const fetchRatingStats = async () => {
    const docId = getDocId();
    if (!docId) return;

    setIsLoading(true);
    try {
      // Use relative path for production, localhost for development
      const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const apiEndpoint = isDevelopment ? `http://localhost:3002/api/feedback/${docId}` : `/api/feedback/${docId}`;
      
      const response = await fetch(apiEndpoint);
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success') {
          setRatingStats(data.stats);
        }
      }
    } catch (error) {
      console.error('Failed to fetch rating stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle rating submission
  const handleRating = async (isGood, userFeedback = '') => {
    const docId = getDocId();
    if (!docId) return;

    try {
      setIsSubmitting(true);
      // Use relative path for production, localhost for development
      const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const apiEndpoint = isDevelopment ? 'http://localhost:3002/api/feedback' : '/api/feedback';
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          doc_id: docId,
          isGood: isGood,
          user_question: '', // We'll use this later for AI answers
          user_feedback: userFeedback
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success') {
          setUserHasRated(true);
          // Save to localStorage with detailed rating info
          const ratedDocs = JSON.parse(localStorage.getItem('ratedDocs') || '{}');
          const userRatingData = {
            isGood: isGood,
            feedback: userFeedback,
            timestamp: new Date().toISOString()
          };
          ratedDocs[getDocId()] = userRatingData;
          setUserPreviousRating(userRatingData);
          localStorage.setItem('ratedDocs', JSON.stringify(ratedDocs));
          // Refresh stats
          await fetchRatingStats();
          // Don't reset feedback - keep it so user can see what they submitted
        }
      }
    } catch (error) {
      console.error('Failed to submit rating:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Set rating selection
  const selectRating = (isGood) => {
    setSelectedRating(isGood);
  };

  // Submit rating with feedback
  const submitRating = async () => {
    if (selectedRating !== null) {
      await handleRating(selectedRating, feedback);
    }
  };

  // Track current path and update when it changes
  useEffect(() => {
    const updatePath = () => {
      setCurrentPath(window.location.pathname);
    };

    // Set initial path
    updatePath();

    // Listen for navigation events
    const handleRouteChange = () => {
      updatePath();
    };

    // Listen for popstate (back/forward navigation)
    window.addEventListener('popstate', handleRouteChange);
    
    // Listen for pushstate/replacestate (programmatic navigation)
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      setTimeout(updatePath, 0);
    };
    
    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      setTimeout(updatePath, 0);
    };

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, []);

  // Check if user has already rated this document and load previous data
  useEffect(() => {
    const ratedDocs = JSON.parse(localStorage.getItem('ratedDocs') || '{}');
    const docId = getDocId();
    const userRating = ratedDocs[docId];
    
    if (userRating) {
      // Handle both old format (boolean) and new format (object)
      if (typeof userRating === 'boolean') {
        setUserHasRated(true);
        setUserPreviousRating(null);
      } else {
        setUserHasRated(true);
        setUserPreviousRating(userRating);
        setSelectedRating(userRating.isGood);
        setFeedback(userRating.feedback || '');
      }
    } else {
      setUserHasRated(false);
      setUserPreviousRating(null);
      setSelectedRating(null);
      setFeedback('');
    }
  }, [currentPath]);

  // Fetch stats when component mounts or page changes
  useEffect(() => {
    fetchRatingStats();
  }, [currentPath]);

  // Don't render on non-document pages
  if (!currentPath.startsWith('/docs/')) {
    return null;
  }

  return (
    <div className="doc-rating-wrapper">
      <div className="doc-rating-container">
        {/* Rating Section - Question and Buttons on same row */}
        <div className="rating-section">
          <div className="rating-question">
            Bài viết này có hữu ích?
          </div>
          
          {/* Rating Buttons - Always show, with previous selection */}
          <div className="rating-buttons">
            <button
              className={`rating-btn rating-btn-positive ${selectedRating === true ? 'selected' : ''}`}
              onClick={() => selectRating(true)}
              title={userHasRated ? "Cập nhật đánh giá thành thích" : "Thích trang này"}
              disabled={isLoading}
            >
              <FontAwesomeIcon icon={faThumbsUp} />
            </button>
            <button
              className={`rating-btn rating-btn-negative ${selectedRating === false ? 'selected' : ''}`}
              onClick={() => selectRating(false)}
              title={userHasRated ? "Cập nhật đánh giá thành không thích" : "Không thích trang này"}
              disabled={isLoading}
            >
              <FontAwesomeIcon icon={faThumbsDown} />
            </button>
          </div>
        </div>

        {/* Comment Section - Below the rating */}
        <div className="comment-section">
          <textarea
            id="feedback-input"
            className="feedback-textarea"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Nhập góp ý của bạn ở đây..."
            rows="3"
            maxLength="500"
            disabled={isSubmitting}
          />
          
          <div className="comment-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={submitRating}
              disabled={isSubmitting || selectedRating === null}
            >
              {isSubmitting 
                ? 'Đang gửi...' 
                : (userHasRated ? 'Cập nhật đánh giá' : 'Gửi góp ý')
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocRating;
