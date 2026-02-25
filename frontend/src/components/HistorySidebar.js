// frontend/src/components/HistorySidebar.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import historyService from '../services/historyService';
import './HistorySidebar.css';

const HistorySidebar = ({ isOpen, onClose, onSelectHistory }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {

    const loadHistory = async () => {
        setLoading(true);
        const result = await historyService.getUserHistory(user.uid);
        if (result.success) {
        setHistory(result.history);
        }
        setLoading(false);
    };

    if (user && isOpen) {
      loadHistory();
    }
  }, [user, isOpen]);



  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getIcon = (item) => {
    if (item.input_type === 'image') return '🖼️';
    return '📝';
  };

  if (!isOpen) return null;

  return (
    <div className={`history-sidebar ${isOpen ? 'open' : ''}`}>
      <div className="history-header">
        <h3>History</h3>
        <button className="history-close" onClick={onClose}>×</button>
      </div>

      {!user ? (
        <div className="history-login-prompt">
          <p>Login to view your history</p>
        </div>
      ) : loading ? (
        <div className="history-loading">Loading...</div>
      ) : history.length === 0 ? (
        <div className="history-empty">
          <p>No history yet</p>
          <p className="history-empty-sub">Start checking news to see your history</p>
        </div>
      ) : (
        <div className="history-list">
          {history.map((item) => (
            <div 
              key={item.id} 
              className="history-item"
              onClick={() => onSelectHistory(item)}
            >
              <div className="history-item-icon">{getIcon(item)}</div>
              <div className="history-item-content">
                <div className="history-item-type">
                  {item.input_type === 'image' ? 'Image' : 'Text'}
                  {item.fake_news && (
                    <span className={`history-badge ${item.fake_news.prediction?.toLowerCase()}`}>
                      {item.fake_news.prediction}
                    </span>
                  )}
                </div>
                <div className="history-item-preview">
                  {item.ocr_text?.substring(0, 50) || 'News text...'}
                </div>
                <div className="history-item-time">
                  {formatDate(item.timestamp)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistorySidebar;