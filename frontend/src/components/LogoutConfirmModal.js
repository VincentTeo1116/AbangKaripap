// frontend/src/components/LogoutConfirmModal.js
import React from 'react';
import './LogoutConfirmModal.css';

const LogoutConfirmModal = ({ isOpen, onClose, onConfirm, translations }) => {
  if (!isOpen) return null;

  return (
    <div className="logout-modal-overlay" onClick={onClose}>
      <div className="logout-modal" onClick={(e) => e.stopPropagation()}>
        <div className="logout-modal-header">
          <span className="logout-modal-icon">🚪</span>
          <h3>{translations?.logoutConfirm || 'Logout Confirmation'}</h3>
        </div>
        
        <div className="logout-modal-content">
          <p>{translations?.logoutMessage || 'Are you sure you want to logout?'}</p>
        </div>
        
        <div className="logout-modal-actions">
          <button 
            className="logout-modal-cancel"
            onClick={onClose}
          >
            {translations?.cancel || 'Cancel'}
          </button>
          <button 
            className="logout-modal-confirm"
            onClick={onConfirm}
          >
            {translations?.confirm || 'Logout'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutConfirmModal;