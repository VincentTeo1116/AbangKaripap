import React, { useState, useEffect } from 'react';
import './App.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthModal from './components/AuthModal';
import HistorySidebar from './components/HistorySidebar';
import historyService from './services/historyService';
import LogoutConfirmModal from './components/LogoutConfirmModal';
import HistoryViewModal from './components/HistoryViewModal';

function App() {
  const [inputType, setInputType] = useState('text');
  const [newsText, setNewsText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('fake');
  const [dragActive, setDragActive] = useState(false);
  const [language, setLanguage] = useState('en');
  const [backendStatus, setBackendStatus] = useState(null);
  const [ocrStatus, setOcrStatus] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const { user, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loadingFromHistory] = useState(false);
  const [lastSavedResult, setLastSavedResult] = useState(null);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  

  // Check backend status on load
  useEffect(() => {
    checkBackendStatus();
  }, []);

  // Save to history when result comes in and user is logged in
  useEffect(() => {
    const saveToHistory = async () => {
      // Don't save if:
      // 1. No result
      // 2. No user
      // 3. Result has error
      // 4. We're loading from history
      if (!result || !user || result.error || loadingFromHistory) {
        console.log('Not saving:', { 
          hasResult: !!result, 
          hasUser: !!user, 
          hasError: result?.error,
          loadingFromHistory 
        });
        return;
      }
      
      // Create a simple hash of the result to check for duplicates
      const resultHash = JSON.stringify({
        input_type: result.input_type,
        ocr_text: result.ocr_text,
        fake_news: result.fake_news?.prediction,
        clickbait: result.clickbait?.prediction
      });
      
      // Don't save if this exact result was just saved
      if (lastSavedResult === resultHash) {
        console.log('Duplicate result, not saving');
        return;
      }
      
      // Clean the data before saving
      const historyData = {
        input_type: result.input_type || 'text',
        news_text: newsText || '',
        ocr_text: result.ocr_text || '',
        fake_news: result.fake_news || null,
        clickbait: result.clickbait || null,
        timestamp: new Date().toISOString()
      };
      
      // Remove any fields that are still undefined
      Object.keys(historyData).forEach(key => {
        if (historyData[key] === undefined) {
          delete historyData[key];
        }
      });
      
      await historyService.saveToHistory(user.uid, historyData);
      
      // Update last saved hash
      setLastSavedResult(resultHash);
    };
    
    saveToHistory();
  }, [result, user, newsText, loadingFromHistory, lastSavedResult]); // ← ADD lastSavedResult here

  const checkBackendStatus = async () => {
    try {
      const response = await fetch('http://localhost:8000/health');
      const data = await response.json();
      setBackendStatus(data);
    } catch (error) {
      setBackendStatus({ status: 'unavailable' });
    }
  };

  const translations = {
    en: {
      title: "ABANG KARIPAP",
      subtitle: "The Fact Checker",
      fakeNews: "Fake News Detection",
      clickbait: "Clickbait Detection",
      textInput: "Text Input",
      imageInput: "Image Input",
      textPlaceholder: "Paste news text or headline here...",
      detectNews: "Detect Fake News",
      detectClickbait: "Check Clickbait",
      analyzing: "Analyzing...",
      processing: "Processing...",
      uploadMain: "Click to upload or drag and drop",
      uploadHint: "Supports JPG, PNG, GIF (max 10MB)",
      extractingText: "Extracting text from image...",
      ocrCompleted: "OCR completed",
      ocrFailed: "OCR failed",
      detectionResult: "Detection Result",
      image: "Image",
      text: "Text",
      ocrResult: "Text from Image",
      prediction: "Prediction",
      fakeNewsResult: "Fake News",
      realNews: "Real News",
      cannotDetermine: "Cannot Determine",
      systemError: "System Error",
      explanation: "Explanation",
      keyPoints: "Key Points",
      confidence: "Confidence",
      clickbaitScore: "Clickbait Score",
      clickbaitElements: "Clickbait Elements",
      processingTime: "Processing Time",
      seconds: "s",
      enterTextError: "Please enter text to analyze",
      selectImageError: "Please select an image",
      imageSizeError: "Image size cannot exceed 10MB",
      login: "Login",
      logout: "Logout",
      history: "History",
      welcome: "Welcome",
      characters: "chars",
      logoutConfirm: "Logout Confirmation",
      logoutMessage: "Are you sure you want to logout?",
      cancel: "Cancel",
      confirm: "Logout",
    },
    ms: {
      title: "ABANG KARIPAP",
      subtitle: "Pemeriksa Fakta",
      fakeNews: "Pengesan Berita Palsu",
      clickbait: "Pengesanan Clickbait",
      textInput: "Input Teks",
      imageInput: "Input Imej",
      textPlaceholder: "Tampal teks berita atau tajuk di sini...",
      detectNews: "Kesan Berita Palsu",
      detectClickbait: "Periksa Clickbait",
      analyzing: "Menganalisis...",
      processing: "Memproses...",
      uploadMain: "Klik untuk muat naik atau seret dan lepas",
      uploadHint: "Menyokong JPG, PNG, GIF (max 10MB)",
      extractingText: "Mengekstrak teks dari imej...",
      ocrCompleted: "OCR selesai",
      ocrFailed: "OCR gagal",
      detectionResult: "Keputusan Pengesanan",
      image: "Imej",
      text: "Teks",
      ocrResult: "Teks dari Imej",
      prediction: "Ramalan",
      fakeNewsResult: "Berita Palsu",
      realNews: "Berita Benar",
      cannotDetermine: "Tidak Dapat Ditentukan",
      systemError: "Ralat Sistem",
      explanation: "Penjelasan",
      keyPoints: "Perkara Utama",
      confidence: "Keyakinan",
      clickbaitScore: "Skor Clickbait",
      clickbaitElements: "Elemen Clickbait",
      processingTime: "Masa Pemprosesan",
      seconds: "s",
      enterTextError: "Sila masukkan teks untuk dianalisis",
      selectImageError: "Sila pilih imej",
      imageSizeError: "Saiz imej tidak boleh melebihi 10MB",
      login: "Log Masuk",
      logout: "Log Keluar",
      history: "Sejarah",
      welcome: "Selamat Datang",
      characters: "aksara",
      logoutConfirm: "Pengesahan Log Keluar",
      logoutMessage: "Adakah anda pasti mahu log keluar?",
      cancel: "Batal",
      confirm: "Log Keluar",
    },
    zh: {
      title: "ABANG KARIPAP",
      subtitle: "事实核查员",
      fakeNews: "假新闻检测",
      clickbait: "标题党检测",
      textInput: "文字输入",
      imageInput: "图片输入",
      textPlaceholder: "在这里粘贴新闻文字或标题...",
      detectNews: "检测假新闻",
      detectClickbait: "检测标题党",
      analyzing: "分析中...",
      processing: "处理中...",
      uploadMain: "点击上传或拖拽图片",
      uploadHint: "支持 JPG、PNG、GIF（最大10MB）",
      extractingText: "正在提取图片中的文字...",
      ocrCompleted: "OCR完成",
      ocrFailed: "OCR失败",
      detectionResult: "检测结果",
      image: "图片",
      text: "文字",
      ocrResult: "图片文字",
      prediction: "判断结果",
      fakeNewsResult: "假新闻",
      realNews: "真实新闻",
      cannotDetermine: "无法判断",
      systemError: "系统错误",
      explanation: "解释说明",
      keyPoints: "关键判断点",
      confidence: "置信度",
      clickbaitScore: "标题党评分",
      clickbaitElements: "标题党元素",
      processingTime: "处理时间",
      seconds: "秒",
      enterTextError: "请输入要分析的文本",
      selectImageError: "请选择图片",
      imageSizeError: "图片大小不能超过10MB",
      login: "登录",
      logout: "登出",
      history: "历史记录",
      welcome: "欢迎",
      characters: "字符",
      logoutConfirm: "退出确认",
      logoutMessage: "您确定要退出登录吗？",
      cancel: "取消",
      confirm: "退出",
    }
  };

  const t = translations[language];

  // Handle image drag and drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageSelect({ target: { files: [e.dataTransfer.files[0]] } });
    }
  };

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      setShowLogoutConfirm(false);
      setShowHistory(false); // Close history sidebar if open
      // Optional: Clear any user-specific data
      setResult(null);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert(t.imageSizeError);
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        alert(t.selectImageError);
        return;
      }

      setSelectedImage(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setOcrStatus('');
    }
  };

  const getBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setOcrStatus('');
  };

  const handleTextDetect = async () => {
    if (!newsText.trim()) {
      alert(t.enterTextError);
      return;
    }

    setLoading(true);
    setResult(null);
    
    try {
      const endpoint = activeTab === 'fake' ? 'detect/text' : 'detect/text';
      const response = await fetch(`http://localhost:8000/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newsText }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ 
        error: true,
        message: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageDetect = async () => {
    if (!selectedImage) {
      alert(t.selectImageError);
      return;
    }

    setLoading(true);
    setOcrStatus(t.extractingText);
    setResult(null);

    try {
      const base64Image = await getBase64(selectedImage);
      const response = await fetch('http://localhost:8000/detect/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      setResult(data);
      setOcrStatus(data.fake_news?.prediction === 'Error' ? `❌ ${t.ocrFailed}` : `✅ ${t.ocrCompleted}`);
    } catch (error) {
      setResult({ 
        error: true,
        message: error.message
      });
      setOcrStatus(`❌ ${t.ocrFailed}`);
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return '#2e7d32';
    if (confidence >= 60) return '#ceed02';
    return '#d32f2f';
  };

  const getPredictionColor = (prediction) => {
    switch(prediction) {
      case 'Fake': return { bg: '#fff1e6', text: '#fcbb08', icon: '❌' };
      case 'Not Fake': return { bg: '#e6f7e6', text: '#2e7d32', icon: '✅' };
      case 'Unknown': return { bg: '#fff9e6', text: '#ed6c02', icon: '⚠️' };
      default: return { bg: '#f3f4f6', text: '#6b7280', icon: '❓' };
    }
  };

  const renderFakeNewsResult = (fakeNews) => {
    const colors = getPredictionColor(fakeNews.prediction);
    
    return (
      <div className="result-section fake-news" style={{ backgroundColor: colors.bg }}>
        <div className="section-header">
          <span className="section-icon">🕵️</span>
          <h3>{t.fakeNews}</h3>
        </div>
        
        <div className="prediction-display">
          <span className="prediction-icon">{colors.icon}</span>
          <div className="prediction-details">
            <span className="prediction-label">{t.prediction}</span>
            <span className="prediction-value" style={{ color: colors.text }}>
              {fakeNews.prediction === 'Fake' && t.fakeNewsResult}
              {fakeNews.prediction === 'Not Fake' && t.realNews}
              {fakeNews.prediction === 'Unknown' && t.cannotDetermine}
              {fakeNews.prediction === 'Error' && t.systemError}
            </span>
          </div>
        </div>

        {fakeNews.confidence > 0 && (
          <div className="confidence-section">
            <div className="confidence-label">
              <span>{t.confidence}</span>
              <span>{fakeNews.confidence}%</span>
            </div>
            <div className="confidence-bar">
              <div 
                className="confidence-fill"
                style={{ 
                  width: `${fakeNews.confidence}%`,
                  backgroundColor: getConfidenceColor(fakeNews.confidence)
                }}
              />
            </div>
          </div>
        )}

        {fakeNews.explanation && (
          <div className="explanation-section">
            <div className="explanation-header">
              <span className="explanation-icon">📋</span>
              <span>{t.explanation}</span>
            </div>
            <p className="explanation-text">{fakeNews.explanation}</p>
          </div>
        )}

        {fakeNews.key_points && fakeNews.key_points.length > 0 && (
          <div className="key-points-section">
            <div className="key-points-header">
              <span className="key-points-icon">🔑</span>
              <span>{t.keyPoints}</span>
            </div>
            <ul className="key-points-list">
              {fakeNews.key_points.map((point, index) => (
                <li key={index} className="key-point-item">
                  <span className="point-bullet">•</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderClickbaitResult = (clickbait) => {
    return (
      <div className="result-section clickbait">
        <div className="section-header">
          <span className="section-icon">🎣</span>
          <h3>{t.clickbait}</h3>
        </div>
        
        <div className="clickbait-score">
          <div className="score-header">
            <span>{t.clickbaitScore}</span>
            <span className="score-value">{clickbait.score}%</span>
          </div>
          <div className="score-bar">
            <div 
              className="score-fill"
              style={{ 
                width: `${clickbait.score}%`,
                backgroundColor: clickbait.score > 70 ? '#d32f2f' : clickbait.score > 40 ? '#ed6c02' : '#2e7d32'
              }}
            />
          </div>
        </div>

        <div className="prediction-tag">
          <span className={`prediction-badge ${clickbait.prediction?.toLowerCase()}`}>
            {clickbait.prediction === 'Clickbait' ? '🎣 Clickbait' : '📰 Not Clickbait'}
          </span>
        </div>

        {clickbait.explanation && (
          <div className="explanation-section">
            <div className="explanation-header">
              <span className="explanation-icon">📋</span>
              <span>{t.explanation}</span>
            </div>
            <p className="explanation-text">{clickbait.explanation}</p>
          </div>
        )}

        {clickbait.clickbait_elements && clickbait.clickbait_elements.length > 0 && (
          <div className="clickbait-elements">
            <div className="elements-header">
              <span className="elements-icon">🔍</span>
              <span>{t.clickbaitElements}</span>
            </div>
            <div className="elements-list">
              {clickbait.clickbait_elements.map((element, index) => (
                <span key={index} className="element-tag">{element}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // UPDATED: Header controls with new buttons
  const renderHeaderControls = () => (
    <div className="header-controls">
      <div className={`backend-status ${backendStatus?.status === 'healthy' ? 'online' : 'offline'}`}>
        <span className="status-dot"></span>
        {backendStatus?.status === 'healthy' ? t.backendOnline : t.backendOffline}
      </div>
      
      {user && (
        <button 
          className="history-toggle" 
          onClick={() => setShowHistory(true)}
          title={t.history}
        >
          <span className="btn-icon">📚</span>
          <span className="history-text">{t.history}</span>
        </button>
      )}
      
      {!user ? (
        <button 
          className="login-toggle" 
          onClick={() => setShowAuthModal(true)}
        >
          <span className="btn-icon">👤</span>
          <span>{t.login}</span>
        </button>
      ) : (
        <div className="user-menu-container">
          <button 
            className="user-menu"
            title={user.email}
          >
            <span className="btn-icon">👤</span>
            <span className="user-email">{user.email?.split('@')[0]}</span>
          </button>
          <button 
            className="logout-button"
            onClick={() => setShowLogoutConfirm(true)}
            title={t.logout}
          >
            <span className="btn-icon">🚪</span>
          </button>
        </div>
      )}
      
      <button 
        className="language-toggle" 
        onClick={() => {
          if (language === 'en') setLanguage('ms');
          else if (language === 'ms') setLanguage('zh');
          else setLanguage('en');
        }}
      >
        {language === 'en' && '🌐 MS'}
        {language === 'ms' && '🌐 中'}
        {language === 'zh' && '🌐 EN'}
      </button>
    </div>
  );

  return (
    <div className="app">
      {/* Background decoration */}
      <div className="background-decoration">
        <div className="circle circle-1"></div>
        <div className="circle circle-2"></div>
        <div className="circle circle-3"></div>
      </div>

      <div className="container">
        {/* Header */}
        <header className="header">
          <div className="header-top">
            <div className="logo-container">
              <div className="logo-icon">🔍</div>
              <h1 className="title">
                <span className="title-gradient">{t.title}</span>
                <span className="title-light">: {t.subtitle}</span>
              </h1>
            </div>
            
            {renderHeaderControls()}
          </div>
        </header>

        {/* Main Card */}
        <div className="card">
          {/* Tab Switcher */}
          <div className="tab-container">
            <button 
              className={`tab ${activeTab === 'fake' ? 'active' : ''}`}
              onClick={() => setActiveTab('fake')}
            >
              <span className="tab-icon">🕵️</span>
              <span>{t.fakeNews}</span>
            </button>
            <button 
              className={`tab ${activeTab === 'clickbait' ? 'active' : ''}`}
              onClick={() => setActiveTab('clickbait')}
            >
              <span className="tab-icon">🎣</span>
              <span>{t.clickbait}</span>
            </button>
          </div>

          {/* Input Type Switcher - Only show for Fake News tab */}
          {activeTab === 'fake' && (
            <div className="input-type-switch">
              <button 
                className={`input-type-btn ${inputType === 'text' ? 'active' : ''}`}
                onClick={() => setInputType('text')}
              >
                <span className="btn-icon">📝</span>
                <span>{t.textInput}</span>
              </button>
              <button 
                className={`input-type-btn ${inputType === 'image' ? 'active' : ''}`}
                onClick={() => setInputType('image')}
              >
                <span className="btn-icon">🖼️</span>
                <span>{t.imageInput}</span>
              </button>
            </div>
          )}

          {/* Text Input Area */}
          {(activeTab === 'fake' && inputType === 'text') || activeTab === 'clickbait' ? (
            <div className="text-input-area">
              <textarea
                className="text-input"
                rows="6"
                value={newsText}
                onChange={(e) => setNewsText(e.target.value)}
                placeholder={activeTab === 'clickbait' ? "Paste headline here..." : t.textPlaceholder}
              />
              <button 
                className="btn btn-primary"
                onClick={handleTextDetect}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    {t.analyzing}
                  </>
                ) : (
                  <>
                    <span className="btn-icon">🔍</span>
                    {activeTab === 'clickbait' ? t.detectClickbait : t.detectNews}
                  </>
                )}
              </button>
            </div>
          ) : null}

          {/* Image Input Area - Only for Fake News with image input */}
          {activeTab === 'fake' && inputType === 'image' && (
            <div className="image-input-area">
              <div 
                className={`upload-area ${dragActive ? 'drag-active' : ''} ${imagePreview ? 'has-image' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="file-input"
                  id="file-upload"
                />
                
                {!imagePreview ? (
                  <label htmlFor="file-upload" className="upload-label">
                    <div className="upload-icon">📤</div>
                    <div className="upload-text">
                      <span className="upload-main">{t.uploadMain}</span>
                      <span className="upload-hint">{t.uploadHint}</span>
                    </div>
                  </label>
                ) : (
                  <div className="preview-container">
                    <img src={imagePreview} alt="Preview" className="preview-image" />
                    <button className="clear-image" onClick={clearImage}>×</button>
                  </div>
                )}
              </div>

              {ocrStatus && (
                <div className={`ocr-status ${ocrStatus.includes('✅') ? 'success' : ocrStatus.includes('❌') ? 'error' : 'info'}`}>
                  {ocrStatus}
                </div>
              )}

              <button 
                className="btn btn-primary"
                onClick={handleImageDetect}
                disabled={loading || !selectedImage}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    {t.processing}
                  </>
                ) : (
                  <>
                    <span className="btn-icon">🔍</span>
                    {t.detectNews}
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Results */}
        {result && !result.error && (
          <div className="result-card">
            <div className="result-header">
              <h2>{t.detectionResult}</h2>
              <div className="result-meta">
                <span className="result-badge">
                  {result.input_type === 'image' ? `🖼️ ${t.image}` : `📝 ${t.text}`}
                </span>
                <span className="processing-time">
                  ⏱️ {result.processing_time}{t.seconds}
                </span>
              </div>
            </div>

            {/* OCR Result for images */}
            {result.input_type === 'image' && result.ocr_text && (
              <div className="ocr-result">
                <div className="ocr-header">
                  <span className="ocr-icon">📄</span>
                  <span className="ocr-title">{t.ocrResult}</span>
                  {result.ocr_length && (
                    <span className="ocr-length">{result.ocr_length} {t.characters}</span>
                  )}
                </div>
                <div className="ocr-text">
                  {result.ocr_text}
                </div>
              </div>
            )}

            {/* Fake News Result */}
            {result.fake_news && renderFakeNewsResult(result.fake_news)}

            {/* Clickbait Result */}
            {result.clickbait && renderClickbaitResult(result.clickbait)}
          </div>
        )}

        {/* Error Result */}
        {result?.error && (
          <div className="result-card error">
            <div className="error-icon">⚠️</div>
            <h3>Error</h3>
            <p>{result.message}</p>
            <button className="btn btn-secondary" onClick={() => setResult(null)}>
              Try Again
            </button>
          </div>
        )}

        {/* Footer */}
        <footer className="footer">
          <p className="copyright">Powered by Google Vision & Gemini AI</p>
        </footer>
      </div>

      <LogoutConfirmModal 
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        translations={translations[language]}
      />
      
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        language={language}
        translations={translations[language]}
      />

      <HistoryViewModal 
        isOpen={!!selectedHistoryItem}
        onClose={() => setSelectedHistoryItem(null)}
        historyItem={selectedHistoryItem}
        translations={translations[language]}
      />

      <HistorySidebar 
        isOpen={showHistory} 
        onClose={() => setShowHistory(false)}
        onSelectHistory={(item) => {
          // Just open the modal with the history item
          setSelectedHistoryItem(item);
          setShowHistory(false); // Close the sidebar
        }}
        language={language}
        translations={translations[language]}
      />
    </div>
  );
}

// NEW: Wrap App with AuthProvider
const AppWithAuth = () => (
  <AuthProvider>
    <App />
  </AuthProvider>
);

export default AppWithAuth;