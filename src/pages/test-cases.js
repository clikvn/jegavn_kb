import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faThumbsUp, faThumbsDown, faStar, faComment, faSearch, faFilter, faSort } from '@fortawesome/free-solid-svg-icons';
import styles from './test-cases.module.css';

// Sample test cases data - 500 questions about JEGA software
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
  },
  {
    id: 4,
    question: "Cách tạo cửa sổ với kích thước tùy chỉnh?",
    aiAnswer: "Tạo cửa sổ tùy chỉnh trong JEGA:\n\n1. Chọn công cụ 'Cửa sổ' từ menu\n2. Chọn loại cửa sổ mong muốn\n3. Click vào vị trí muốn đặt cửa sổ\n4. Trong bảng thuộc tính, nhập kích thước chính xác:\n   - Chiều rộng (Width)\n   - Chiều cao (Height)\n   - Độ dày khung (Frame thickness)\n5. Điều chỉnh vị trí nếu cần\n6. Nhấn Enter để xác nhận",
    userRating: null,
    userComment: "",
    category: "Cửa sổ",
    difficulty: "Trung bình"
  },
  {
    id: 5,
    question: "Làm thế nào để render ảnh chất lượng cao?",
    aiAnswer: "Để render ảnh chất lượng cao trong JEGA:\n\n1. Mở cài đặt render (Render Settings)\n2. Thiết lập độ phân giải cao (tối thiểu 1920x1080)\n3. Bật các tính năng nâng cao:\n   - Ray tracing\n   - Global illumination\n   - Soft shadows\n   - Anti-aliasing\n4. Tăng số mẫu (Samples) lên 1000+\n5. Chọn định dạng ảnh chất lượng cao (PNG, TIFF)\n6. Nhấn 'Render' và chờ quá trình hoàn tất",
    userRating: null,
    userComment: "",
    category: "Render",
    difficulty: "Khó"
  },
  {
    id: 6,
    question: "Cách sử dụng chức năng AI để thiết kế nội thất?",
    aiAnswer: "Chức năng AI thiết kế nội thất trong JEGA:\n\n1. Vào mục 'AI Design' hoặc 'Thiết kế AI'\n2. Chọn loại không gian cần thiết kế\n3. Nhập mô tả về phong cách mong muốn\n4. Chọn ngân sách và sở thích\n5. Nhấn 'Tạo thiết kế'\n6. AI sẽ đề xuất nhiều phương án\n7. Chọn phương án phù hợp nhất\n8. Tùy chỉnh thêm nếu cần",
    userRating: null,
    userComment: "",
    category: "AI Design",
    difficulty: "Trung bình"
  },
  {
    id: 7,
    question: "Làm sao để tạo báo giá tự động?",
    aiAnswer: "Tạo báo giá tự động trong JEGA:\n\n1. Hoàn thiện thiết kế dự án\n2. Vào mục 'Báo giá' hoặc 'Quotation'\n3. Chọn 'Tạo báo giá tự động'\n4. Hệ thống sẽ tính toán:\n   - Diện tích các hạng mục\n   - Vật liệu sử dụng\n   - Nhân công\n   - Thời gian thi công\n5. Xem xét và điều chỉnh giá nếu cần\n6. Xuất báo giá ra PDF hoặc Excel",
    userRating: null,
    userComment: "",
    category: "Báo giá",
    difficulty: "Trung bình"
  },
  {
    id: 8,
    question: "Cách sử dụng thư viện 3D models?",
    aiAnswer: "Sử dụng thư viện 3D models trong JEGA:\n\n1. Mở thư viện models từ menu chính\n2. Duyệt qua các danh mục:\n   - Nội thất\n   - Thiết bị vệ sinh\n   - Đèn chiếu sáng\n   - Cây cối\n3. Sử dụng thanh tìm kiếm để tìm model cụ thể\n4. Click vào model để xem trước\n5. Kéo thả vào dự án hoặc click 'Sử dụng'\n6. Điều chỉnh vị trí và kích thước\n7. Lưu vào thư viện cá nhân nếu cần",
    userRating: null,
    userComment: "",
    category: "3D Models",
    difficulty: "Dễ"
  },
  {
    id: 9,
    question: "Làm thế nào để tạo bản vẽ kỹ thuật?",
    aiAnswer: "Tạo bản vẽ kỹ thuật trong JEGA:\n\n1. Hoàn thiện mô hình 3D\n2. Vào mục 'Bản vẽ' hoặc 'Drawings'\n3. Chọn loại bản vẽ cần tạo:\n   - Mặt bằng\n   - Mặt đứng\n   - Mặt cắt\n   - Chi tiết\n4. Thiết lập tỷ lệ và khổ giấy\n5. Thêm kích thước và ghi chú\n6. Chèn bảng thống kê\n7. Xuất bản vẽ ra CAD hoặc PDF",
    userRating: null,
    userComment: "",
    category: "Bản vẽ",
    difficulty: "Khó"
  },
  {
    id: 10,
    question: "Cách sử dụng chức năng walkthrough?",
    aiAnswer: "Chức năng walkthrough trong JEGA:\n\n1. Vào mục 'Walkthrough' hoặc 'Dạo quanh'\n2. Thiết lập điểm bắt đầu và kết thúc\n3. Tạo các điểm dừng (waypoints) dọc đường đi\n4. Điều chỉnh tốc độ di chuyển\n5. Thiết lập góc nhìn camera\n6. Thêm hiệu ứng chuyển cảnh\n7. Xem trước walkthrough\n8. Xuất video hoặc ảnh chụp\n9. Lưu để sử dụng sau",
    userRating: null,
    userComment: "",
    category: "Walkthrough",
    difficulty: "Trung bình"
  }
  // ... 490 more questions will be added here
];

// Generate 490 more questions to reach 500 total
const generateMoreQuestions = () => {
  const categories = [
    "Thiết kế", "Vẽ tường", "Vật liệu", "Cửa sổ", "Render", "AI Design", 
    "Báo giá", "3D Models", "Bản vẽ", "Walkthrough", "Ánh sáng", "Camera",
    "Texture", "Animation", "Export", "Import", "Plugins", "Scripts"
  ];
  
  const difficulties = ["Dễ", "Trung bình", "Khó"];
  
  const questionTemplates = [
    "Làm thế nào để {action} trong JEGA?",
    "Cách sử dụng {feature} của JEGA?",
    "Làm sao để {task} với JEGA?",
    "Hướng dẫn {process} trong JEGA?",
    "Cách thực hiện {operation} bằng JEGA?",
    "Làm gì khi {problem} xảy ra trong JEGA?",
    "Cách tối ưu {aspect} trong JEGA?",
    "Làm thế nào để {improve} hiệu suất JEGA?",
    "Cách khắc phục {issue} trong JEGA?",
    "Hướng dẫn chi tiết về {topic} trong JEGA?"
  ];
  
  const actions = [
    "tạo phòng mới", "thay đổi màu sắc", "thêm ánh sáng", "tạo texture", 
    "xuất bản vẽ", "import model", "tạo animation", "thiết lập camera",
    "tạo walkthrough", "render ảnh", "tạo báo giá", "quản lý dự án",
    "sử dụng AI", "tùy chỉnh giao diện", "cài đặt plugin", "backup dữ liệu"
  ];
  
  const questions = [];
  
  for (let i = 11; i <= 500; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
    const template = questionTemplates[Math.floor(Math.random() * questionTemplates.length)];
    const action = actions[Math.floor(Math.random() * actions.length)];
    
    const question = template.replace('{action}', action)
                           .replace('{feature}', action)
                           .replace('{task}', action)
                           .replace('{process}', action)
                           .replace('{operation}', action)
                           .replace('{problem}', action)
                           .replace('{aspect}', action)
                           .replace('{improve}', action)
                           .replace('{issue}', action)
                           .replace('{topic}', action);
    
    questions.push({
      id: i,
      question: question,
      aiAnswer: `Đây là câu trả lời mẫu cho câu hỏi: "${question}"\n\nTrong JEGA, bạn có thể thực hiện điều này bằng cách:\n\n1. Bước đầu tiên\n2. Bước thứ hai\n3. Bước thứ ba\n\nLưu ý: Đây là câu trả lời mẫu, cần được cập nhật với thông tin thực tế.`,
      userRating: null,
      userComment: "",
      category: category,
      difficulty: difficulty
    });
  }
  
  return questions;
};

// Combine original questions with generated ones
const ALL_TEST_CASES = [...TEST_CASES, ...generateMoreQuestions()];

const TestCasesPage = () => {
  const [testCases, setTestCases] = useState(ALL_TEST_CASES);
  const [filteredCases, setFilteredCases] = useState(ALL_TEST_CASES);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [selectedDifficulty, setSelectedDifficulty] = useState('Tất cả');
  const [sortBy, setSortBy] = useState('id');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [expandedCase, setExpandedCase] = useState(null);

  // Get unique categories and difficulties
  const categories = ['Tất cả', ...new Set(ALL_TEST_CASES.map(tc => tc.category))];
  const difficulties = ['Tất cả', ...new Set(ALL_TEST_CASES.map(tc => tc.difficulty))];

  // Filter and search logic
  useEffect(() => {
    let filtered = ALL_TEST_CASES.filter(tc => {
      const matchesSearch = tc.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           tc.aiAnswer.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'Tất cả' || tc.category === selectedCategory;
      const matchesDifficulty = selectedDifficulty === 'Tất cả' || tc.difficulty === selectedDifficulty;
      
      return matchesSearch && matchesCategory && matchesDifficulty;
    });

    // Sort logic
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'id':
          return a.id - b.id;
        case 'category':
          return a.category.localeCompare(b.category);
        case 'difficulty':
          const difficultyOrder = { 'Dễ': 1, 'Trung bình': 2, 'Khó': 3 };
          return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
        case 'rating':
          return (b.userRating || 0) - (a.userRating || 0);
        default:
          return 0;
      }
    });

    setFilteredCases(filtered);
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedDifficulty, sortBy]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCases.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCases.length / itemsPerPage);

  // Rating handlers
  const handleRating = (testCaseId, rating) => {
    setTestCases(prev => prev.map(tc => 
      tc.id === testCaseId ? { ...tc, userRating: rating } : tc
    ));
  };

  const handleComment = (testCaseId, comment) => {
    setTestCases(prev => prev.map(tc => 
      tc.id === testCaseId ? { ...tc, userComment: comment } : tc
    ));
  };

  const toggleExpanded = (testCaseId) => {
    setExpandedCase(expandedCase === testCaseId ? null : testCaseId);
  };

  const getRatingColor = (rating) => {
    if (rating === true) return '#28a745';
    if (rating === false) return '#dc3545';
    return '#6c757d';
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Dễ': return '#28a745';
      case 'Trung bình': return '#ffc107';
      case 'Khó': return '#dc3545';
      default: return '#6c757d';
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>🧪 Test Cases - JEGA Software</h1>
        <p>500 câu hỏi và trả lời về phần mềm JEGA AiHouse</p>
      </div>

      {/* Search and Filter Section */}
      <div className={styles.controls}>
        <div className={styles.searchSection}>
          <div className={styles.searchBox}>
            <FontAwesomeIcon icon={faSearch} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Tìm kiếm câu hỏi hoặc câu trả lời..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>

        <div className={styles.filterSection}>
          <div className={styles.filterGroup}>
            <label>Danh mục:</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={styles.filterSelect}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label>Độ khó:</label>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className={styles.filterSelect}
            >
              {difficulties.map(diff => (
                <option key={diff} value={diff}>{diff}</option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label>Sắp xếp theo:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="id">ID</option>
              <option value="category">Danh mục</option>
              <option value="difficulty">Độ khó</option>
              <option value="rating">Đánh giá</option>
            </select>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className={styles.stats}>
        <div className={styles.statItem}>
          <span className={styles.statNumber}>{filteredCases.length}</span>
          <span className={styles.statLabel}>Câu hỏi</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statNumber}>
            {testCases.filter(tc => tc.userRating !== null).length}
          </span>
          <span className={styles.statLabel}>Đã đánh giá</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statNumber}>
            {testCases.filter(tc => tc.userComment.trim() !== '').length}
          </span>
          <span className={styles.statLabel}>Có bình luận</span>
        </div>
      </div>

      {/* Test Cases List */}
      <div className={styles.testCasesList}>
        {currentItems.map(testCase => (
          <div key={testCase.id} className={styles.testCase}>
            <div className={styles.testCaseHeader}>
              <div className={styles.testCaseInfo}>
                <span className={styles.testCaseId}>#{testCase.id}</span>
                <span 
                  className={styles.testCaseCategory}
                  style={{ backgroundColor: getDifficultyColor(testCase.difficulty) }}
                >
                  {testCase.category}
                </span>
                <span 
                  className={styles.testCaseDifficulty}
                  style={{ backgroundColor: getDifficultyColor(testCase.difficulty) }}
                >
                  {testCase.difficulty}
                </span>
              </div>
              <button
                onClick={() => toggleExpanded(testCase.id)}
                className={styles.expandButton}
              >
                {expandedCase === testCase.id ? 'Thu gọn' : 'Mở rộng'}
              </button>
            </div>

            <div className={styles.testCaseContent}>
              <div className={styles.questionSection}>
                <h3 className={styles.questionTitle}>❓ Câu hỏi:</h3>
                <p className={styles.questionText}>{testCase.question}</p>
              </div>

              {expandedCase === testCase.id && (
                <>
                  <div className={styles.answerSection}>
                    <h3 className={styles.answerTitle}>🤖 Câu trả lời AI:</h3>
                    <div className={styles.answerText}>
                      {testCase.aiAnswer.split('\n').map((line, index) => (
                        <p key={index}>{line}</p>
                      ))}
                    </div>
                  </div>

                  <div className={styles.interactionSection}>
                    <div className={styles.ratingSection}>
                      <h4>Đánh giá câu trả lời:</h4>
                      <div className={styles.ratingButtons}>
                        <button
                          onClick={() => handleRating(testCase.id, true)}
                          className={`${styles.ratingButton} ${styles.ratingPositive} ${
                            testCase.userRating === true ? styles.selected : ''
                          }`}
                          title="Hữu ích"
                        >
                          <FontAwesomeIcon icon={faThumbsUp} />
                          <span>Hữu ích</span>
                        </button>
                        <button
                          onClick={() => handleRating(testCase.id, false)}
                          className={`${styles.ratingButton} ${styles.ratingNegative} ${
                            testCase.userRating === false ? styles.selected : ''
                          }`}
                          title="Không hữu ích"
                        >
                          <FontAwesomeIcon icon={faThumbsDown} />
                          <span>Không hữu ích</span>
                        </button>
                      </div>
                      {testCase.userRating !== null && (
                        <div className={styles.ratingStatus}>
                          <span style={{ color: getRatingColor(testCase.userRating) }}>
                            {testCase.userRating ? '✅ Đã đánh giá hữu ích' : '❌ Đã đánh giá không hữu ích'}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className={styles.commentSection}>
                      <h4>Bình luận của bạn:</h4>
                      <textarea
                        placeholder="Nhập bình luận của bạn về câu trả lời này..."
                        value={testCase.userComment}
                        onChange={(e) => handleComment(testCase.id, e.target.value)}
                        className={styles.commentInput}
                        rows={3}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className={styles.paginationButton}
          >
            Trước
          </button>
          
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }
            
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`${styles.paginationButton} ${
                  currentPage === pageNum ? styles.active : ''
                }`}
              >
                {pageNum}
              </button>
            );
          })}
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className={styles.paginationButton}
          >
            Sau
          </button>
        </div>
      )}

      {/* Page Info */}
      <div className={styles.pageInfo}>
        Hiển thị {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredCases.length)} 
        trong tổng số {filteredCases.length} câu hỏi
      </div>
    </div>
  );
};

export default TestCasesPage;
