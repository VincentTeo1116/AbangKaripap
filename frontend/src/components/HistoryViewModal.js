// frontend/src/components/HistoryViewModal.js
import React from 'react';
import './HistoryViewModal.css';

const HistoryViewModal = ({ isOpen, onClose, historyItem, translations }) => {
  if (!isOpen || !historyItem) return null;

  const getPredictionColor = (prediction) => {
    switch(prediction) {
      case 'Fake': return { bg: '#fff1e6', text: '#fcbb08', icon: '❌' };
      case 'Not Fake': return { bg: '#e6f7e6', text: '#2e7d32', icon: '✅' };
      case 'Unknown': return { bg: '#fff9e6', text: '#ed6c02', icon: '⚠️' };
      default: return { bg: '#f3f4f6', text: '#6b7280', icon: '❓' };
    }
  };

  const renderFakeNewsResult = (fakeNews) => {
    if (!fakeNews) return null;
    const colors = getPredictionColor(fakeNews.prediction);
    
    return (
      <div className="history-fake-news" style={{ backgroundColor: colors.bg }}>
        <div className="history-section-header">
          <span className="history-section-icon">🕵️</span>
          <h4>{translations?.fakeNews || 'Fake News Detection'}</h4>
        </div>
        
        <div className="history-prediction">
          <span className="history-prediction-icon">{colors.icon}</span>
          <div>
            <span className="history-prediction-label">{translations?.prediction || 'Prediction'}:</span>
            <span className="history-prediction-value" style={{ color: colors.text }}>
              {fakeNews.prediction === 'Fake' && (translations?.fakeNewsResult || 'Fake News')}
              {fakeNews.prediction === 'Not Fake' && (translations?.realNews || 'Real News')}
              {fakeNews.prediction === 'Unknown' && (translations?.cannotDetermine || 'Cannot Determine')}
            </span>
          </div>
        </div>

        {fakeNews.confidence > 0 && (
          <div className="history-confidence">
            <div className="history-confidence-label">
              <span>{translations?.confidence || 'Confidence'}</span>
              <span>{fakeNews.confidence}%</span>
            </div>
            <div className="history-confidence-bar">
              <div 
                className="history-confidence-fill"
                style={{ 
                  width: `${fakeNews.confidence}%`,
                  backgroundColor: fakeNews.confidence >= 80 ? '#2e7d32' : fakeNews.confidence >= 60 ? '#ceed02' : '#d32f2f'
                }}
              />
            </div>
          </div>
        )}

        {fakeNews.explanation && (
          <div className="history-explanation">
            <div className="history-explanation-header">
              <span>📋</span>
              <span>{translations?.explanation || 'Explanation'}</span>
            </div>
            <p>{fakeNews.explanation}</p>
          </div>
        )}
      </div>
    );
  };

  const renderClickbaitResult = (clickbait) => {
    if (!clickbait) return null;
    
    return (
      <div className="history-clickbait">
        <div className="history-section-header">
          <span className="history-section-icon">🎣</span>
          <h4>{translations?.clickbait || 'Clickbait Detection'}</h4>
        </div>
        
        <div className="history-clickbait-score">
          <div className="history-score-header">
            <span>{translations?.clickbaitScore || 'Clickbait Score'}</span>
            <span className="history-score-value">{clickbait.score}%</span>
          </div>
          <div className="history-score-bar">
            <div 
              className="history-score-fill"
              style={{ 
                width: `${clickbait.score}%`,
                backgroundColor: clickbait.score > 70 ? '#d32f2f' : clickbait.score > 40 ? '#ed6c02' : '#2e7d32'
              }}
            />
          </div>
        </div>

        <div className="history-prediction-tag">
          <span className={`history-prediction-badge ${clickbait.prediction?.toLowerCase()}`}>
            {clickbait.prediction === 'Clickbait' ? '🎣 Clickbait' : '📰 Not Clickbait'}
          </span>
        </div>

        {clickbait.explanation && (
          <div className="history-explanation">
            <div className="history-explanation-header">
              <span>📋</span>
              <span>{translations?.explanation || 'Explanation'}</span>
            </div>
            <p>{clickbait.explanation}</p>
          </div>
        )}
      </div>
    );
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="history-view-overlay" onClick={onClose}>
      <div className="history-view-modal" onClick={(e) => e.stopPropagation()}>
        <div className="history-view-header">
          <h2>{translations?.detectionResult || 'Detection Result'}</h2>
          <button className="history-view-close" onClick={onClose}>×</button>
        </div>

        <div className="history-view-content">
          <div className="history-view-meta">
            <span className="history-view-badge">
              {historyItem.input_type === 'image' ? '🖼️ Image' : '📝 Text'}
            </span>
            <span className="history-view-time">
              ⏱️ {formatDate(historyItem.timestamp)}
            </span>
          </div>

          {/* Original Text */}
          {(historyItem.news_text || historyItem.ocr_text) && (
            <div className="history-view-text">
              <div className="history-view-text-header">
                <span>📄</span>
                <span>{historyItem.input_type === 'image' ? 
                  (translations?.ocrResult || 'Text from Image') : 
                  (translations?.text || 'Original Text')}
                </span>
              </div>
              <div className="history-view-text-content">
                {historyItem.news_text || historyItem.ocr_text}
              </div>
            </div>
          )}

          {/* Results */}
          {renderFakeNewsResult(historyItem.fake_news)}
          {renderClickbaitResult(historyItem.clickbait)}
        </div>

        <div className="history-view-footer">
          <button className="history-view-close-btn" onClick={onClose}>
            {translations?.close || 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HistoryViewModal;