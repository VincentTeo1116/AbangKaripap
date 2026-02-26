import React, { useState, useEffect } from 'react';
import './App.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthModal from './components/AuthModal';
import HistorySidebar from './components/HistorySidebar';
import historyService from './services/historyService';
import LogoutConfirmModal from './components/LogoutConfirmModal';
import HistoryViewModal from './components/HistoryViewModal';

function App() {
  const [showWelcome, setShowWelcome] = useState(true);
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
  const [lastSavedResult, setLastSavedResult] = useState(null);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
  

  // Check backend status on load
  useEffect(() => {
    checkBackendStatus();
  }, []);

  // Save to history when result comes in and user is logged in
  useEffect(() => {
    const saveToHistory = async () => {
      if (!result || !user || result.error) return;
      
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
      
      // Clean the data before saving - only include what exists
      const historyData = {
        input_type: result.input_type || 'text',
        news_text: newsText || '',
        ocr_text: result.ocr_text || '',
        timestamp: new Date().toISOString()
      };
      
      // Only add detection results if they exist
      if (result.fake_news) {
        historyData.fake_news = result.fake_news;
      }
      if (result.clickbait) {
        historyData.clickbait = result.clickbait;
      }
      
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
  }, [result, user, newsText, lastSavedResult]);

  const goToMainApp = () => {
    setShowWelcome(false);
  };

  const checkBackendStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
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
      // Choose endpoint based on active tab
      const endpoint = activeTab === 'fake' ? 'detect/text/fakenews' : 'detect/text/clickbait';
      
      const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
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
      // For image, we always do fake news detection (since clickbait is usually text)
      const response = await fetch(`${API_BASE_URL}/detect/image/fakenews`, {
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
        {language === 'en' && '🌐 EN'}
        {language === 'ms' && '🌐 MS'}
        {language === 'zh' && '🌐 中'}
      </button>
    </div>
  );

  return showWelcome ? (
        <div className="app">
          {/* Background decoration */}
          <div className="background-decoration">
            <div className="circle circle-1"></div>
            <div className="circle circle-2"></div>
            <div className="circle circle-3"></div>
          </div>

          <div className="container">
            {/* Welcome Header */}
            <header className="header" style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div className="logo-container" style={{ justifyContent: 'center' }}>
                <div className="logo-icon" style={{ fontSize: '64px' }}>🔍</div>
                <h1 className="title">
                  <span className="title-gradient">ABANG KARIPAP</span>
                  <span className="title-light">: The Fact Checker</span>
                </h1>
              </div>
              <p className="subtitle" style={{ textAlign: 'center', fontSize: '18px', marginTop: '10px' }}>
                Your trusted companion in the battle against misinformation
              </p>
            </header>

            {/* Main Welcome Card */}
            <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
              {/* Clickable Karipap Image */}
              <div 
                onClick={goToMainApp}
                style={{ 
                  cursor: 'pointer',
                  display: 'inline-block',
                  position: 'relative',
                  marginBottom: '30px',
                  transition: 'transform 0.3s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <div style={{
                  width: '240px',
                  height: '240px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                  position: 'relative'
                }}>
                  {/* Replace with your base64 image */}
                  <img 
                    src="data:image/png;base64,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" 
                    alt="Karipap"
                    style={{
                      width: '240px',
                      height: '240px',
                      objectFit: 'contain',
                      transform: 'rotate(21.64deg)',
                      filter: 'drop-shadow(4px 8px 16px rgba(0,0,0,0.3))',
                      transition: 'transform 0.25s, filter 0.25s'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'rotate(21.64deg) scale(1.08)';
                      e.target.style.filter = 'drop-shadow(4px 10px 22px rgba(0,0,0,0.45))';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'rotate(21.64deg)';
                      e.target.style.filter = 'drop-shadow(4px 8px 16px rgba(0,0,0,0.3))';
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -45%)',
                    textAlign: 'center',
                    fontFamily: 'Impact, Arial Black, sans-serif',
                    fontSize: '22px',
                    fontWeight: 900,
                    color: '#1A0A00',
                    lineHeight: 1.15,
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    pointerEvents: 'none'
                  }}>
                    KARIPAP<br/>CERTIFIED?
                  </div>
                </div>
              </div>

              {/* Feature Cards */}
              <h2 style={{ 
                color: '#333', 
                marginBottom: '30px',
                fontSize: '28px',
                fontWeight: 600
              }}>
                WHAT WE OFFER?
              </h2>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '20px',
                marginBottom: '30px'
              }}>
                {/* Fake News Detection Card */}
                <div style={{
                  background: '#f8fafc',
                  borderRadius: '16px',
                  padding: '25px 15px',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(252, 187, 8, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                >
                  <div style={{ fontSize: '48px', marginBottom: '15px' }}>🕵️</div>
                  <h3 style={{ color: '#333', marginBottom: '10px' }}>Fake News Detection</h3>
                  <p style={{ color: '#666', lineHeight: '1.6' }}>
                    Analyze news articles and text to determine if they're fake or real with AI-powered insights
                  </p>
                </div>

                {/* Clickbait Detection Card */}
                <div style={{
                  background: '#f8fafc',
                  borderRadius: '16px',
                  padding: '25px 15px',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(252, 187, 8, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                >
                  <div style={{ fontSize: '48px', marginBottom: '15px' }}>🎣</div>
                  <h3 style={{ color: '#333', marginBottom: '10px' }}>Clickbait Detection</h3>
                  <p style={{ color: '#666', lineHeight: '1.6' }}>
                    Identify misleading headlines and sensationalized content designed to grab attention
                  </p>
                </div>

                {/* Image Analysis Card */}
                <div style={{
                  background: '#f8fafc',
                  borderRadius: '16px',
                  padding: '25px 15px',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(252, 187, 8, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                >
                  <div style={{ fontSize: '48px', marginBottom: '15px' }}>🖼️</div>
                  <h3 style={{ color: '#333', marginBottom: '10px' }}>Image OCR Analysis</h3>
                  <p style={{ color: '#666', lineHeight: '1.6' }}>
                    Extract text from images using Google Vision API for comprehensive fact-checking
                  </p>
                </div>
              </div>

              {/* Stats Section */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-around',
                flexWrap: 'wrap',
                gap: '20px',
                marginTop: '40px',
                padding: '30px 0',
                borderTop: '2px solid #f3f4f6'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#fcbb08' }}>AI-Powered</div>
                  <div style={{ color: '#666' }}>Gemini AI Integration</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#fcbb08' }}>Multi-Language</div>
                  <div style={{ color: '#666' }}>EN · BM · 中文</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#fcbb08' }}>Free</div>
                  <div style={{ color: '#666' }}>Always free to use</div>
                </div>
              </div>

              {/* Enter Button (Alternative) */}
              <button 
                className="btn btn-primary" 
                onClick={goToMainApp}
                style={{ 
                  marginTop: '30px',
                  padding: '15px 40px',
                  fontSize: '18px'
                }}
              >
                Get Started
              </button>
            </div>

            {/* Footer */}
            <footer className="footer" style={{ marginTop: '30px' }}>
              <p className="copyright">Powered by Google Vision & Gemini AI</p>
            </footer>
          </div>
        </div>
      ) : (
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
                    <img src={"imagePreview"} alt="Preview" className="preview-image" />
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
                {result.processing_time && (
                  <span className="processing-time">
                    ⏱️ {result.processing_time}{t.seconds}
                  </span>
                )}
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

            {/* Show only the relevant result based on what was returned */}
            {result.fake_news && renderFakeNewsResult(result.fake_news)}
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