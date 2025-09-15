import React, { useState, useEffect } from 'react';
import styles from './test-cases.module.css';

// Sample test cases data - 3 simple examples for testing
const TEST_CASES = [
  {
    id: 1,
    question: "Làm thế nào để tạo một dự án mới trong JEGA AiHouse?",
    aiAnswer: "Để tạo dự án mới trong JEGA AiHouse, bạn cần:\n\n1. Mở phần mềm JEGA AiHouse\n2. Chọn 'Dự án mới' từ menu chính\n3. Đặt tên cho dự án\n4. Chọn loại dự án (nhà ở, văn phòng, cửa hàng...)\n5. Thiết lập các thông số cơ bản\n6. Nhấn 'Tạo dự án' để hoàn tất",
    userRating: null,
    userComment: "",
    category: "Dự án",
    difficulty: "Dễ"
  },
  {
    id: 2,
    question: "Cách sử dụng công cụ vẽ tường trong JEGA?",
    aiAnswer: "Công cụ vẽ tường trong JEGA hoạt động như sau:\n\n1. Chọn công cụ 'Vẽ tường' từ thanh công cụ\n2. Click chuột để đặt điểm bắt đầu\n3. Di chuyển chuột để vẽ tường\n4. Click để đặt điểm kết thúc\n5. Nhấn ESC để thoát chế độ vẽ\n\nBạn có thể điều chỉnh độ dày tường trong bảng thuộc tính.",
    userRating: null,
    userComment: "",
    category: "Vẽ tường",
    difficulty: "Trung bình"
  },
  {
    id: 3,
    question: "Làm sao để thay đổi vật liệu cho sàn nhà?",
    aiAnswer: "Để thay đổi vật liệu sàn nhà:\n\n1. Chọn sàn nhà cần thay đổi\n2. Mở bảng thuộc tính (Properties)\n3. Tìm mục 'Vật liệu' hoặc 'Material'\n4. Click vào ô vật liệu hiện tại\n5. Chọn vật liệu mới từ thư viện\n6. Áp dụng thay đổi\n\nBạn cũng có thể tải lên vật liệu tùy chỉnh của riêng mình.",
    userRating: null,
    userComment: "",
    category: "Vật liệu",
    difficulty: "Dễ"
  }
];

// Use only the 3 test cases for now
const ALL_TEST_CASES = TEST_CASES;

const TestCasesPage = () => {
  const [testCases, setTestCases] = useState(ALL_TEST_CASES);
  const [filteredCases, setFilteredCases] = useState(ALL_TEST_CASES);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Navigation functions
  const goToNextQuestion = () => {
    if (currentQuestionIndex < filteredCases.length - 1) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setTimeout(() => setIsTransitioning(false), 150);
      }, 150);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentQuestionIndex(currentQuestionIndex - 1);
        setTimeout(() => setIsTransitioning(false), 150);
      }, 150);
    }
  };

  const currentQuestion = filteredCases[currentQuestionIndex];

  // Rating handlers
  const handleRating = (rating) => {
    if (currentQuestion) {
      setTestCases(prev => prev.map(tc => 
        tc.id === currentQuestion.id ? { ...tc, userRating: rating } : tc
      ));
    }
  };

  const handleComment = (comment) => {
    if (currentQuestion) {
      setTestCases(prev => prev.map(tc => 
        tc.id === currentQuestion.id ? { ...tc, userComment: comment } : tc
      ));
    }
  };

  const getRatingColor = (rating) => {
    if (rating === true) return '#28a745';
    if (rating === false) return '#dc3545';
    return '#6c757d';
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Test Cases - JEGA Software</h1>
      </div>

       {/* Main Content with Side Navigation */}
       <div className={styles.mainContent}>
         {/* Left Navigation Arrow */}
         <button
           onClick={goToPreviousQuestion}
           disabled={currentQuestionIndex === 0}
           className={styles.sideNavArrow}
           aria-label="Câu hỏi trước"
         >
           ←
         </button>

                   {/* Single Question Display */}
          <div className={`${styles.questionDisplay} ${isTransitioning ? styles.fadeEnter : ''}`} style={{ width: '100%' }}>
            {currentQuestion && (
            <div className={styles.testCase}>
              <div className={styles.testCaseContent}>
                <div className={styles.questionSection}>
                  <h3 className={styles.questionTitle}>Câu hỏi:</h3>
                  <p className={styles.questionText}>{currentQuestion.question}</p>
                </div>

                <div className={styles.answerSection}>
                  <h3 className={styles.answerTitle}>Câu trả lời AI:</h3>
                  <div className={styles.answerText}>
                    {currentQuestion.aiAnswer.split('\n').map((line, index) => (
                      <p key={index}>{line}</p>
                    ))}
                  </div>
                </div>

                <div className={styles.interactionSection}>
                  <div className={styles.ratingSection}>
                    <h4>Đánh giá câu trả lời:</h4>
                    <div className={styles.ratingButtons}>
                      <button
                        onClick={() => handleRating(true)}
                        className={`${styles.ratingButton} ${styles.ratingPositive} ${
                          currentQuestion.userRating === true ? styles.selected : ''
                        }`}
                      >
                        Tốt
                      </button>
                      <button
                        onClick={() => handleRating(false)}
                        className={`${styles.ratingButton} ${styles.ratingNegative} ${
                          currentQuestion.userRating === false ? styles.selected : ''
                        }`}
                      >
                        Không tốt
                      </button>
                    </div>
                    {currentQuestion.userRating !== null && (
                      <div className={styles.ratingStatus}>
                        <span style={{ color: getRatingColor(currentQuestion.userRating) }}>
                          {currentQuestion.userRating ? 'Đã đánh giá tốt' : 'Đã đánh giá không tốt'}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className={styles.commentSection}>
                    <h4>Bình luận của bạn:</h4>
                    <textarea
                      placeholder="Nhập bình luận của bạn về câu trả lời này..."
                      value={currentQuestion.userComment}
                      onChange={(e) => handleComment(e.target.value)}
                      className={styles.commentInput}
                      rows={3}
                    />
                  </div>
                                 </div>
               </div>
             </div>
           )}
         </div>

         {/* Right Navigation Arrow */}
         <button
           onClick={goToNextQuestion}
           disabled={currentQuestionIndex === filteredCases.length - 1}
           className={styles.sideNavArrow}
           aria-label="Câu hỏi tiếp theo"
         >
           →
         </button>
       </div>

       {/* Question Counter */}
       <div className={styles.questionCounter}>
         {currentQuestionIndex + 1} / {filteredCases.length}
       </div>
    </div>
  );
};

export default TestCasesPage;
