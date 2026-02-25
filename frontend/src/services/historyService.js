// frontend/src/services/historyService.js
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs,
  deleteDoc,
  doc,
  limit 
} from 'firebase/firestore';
import { db } from '../firebase/config';

class HistoryService {
  constructor() {
    this.collection = 'detection_history';
  }

  // Save detection result to history
  async saveToHistory(userId, detectionData) {
    try {
      // Clean the data one more time
      const cleanData = {
        userId,
        ...detectionData,
        timestamp: detectionData.timestamp || new Date().toISOString()
      };

      // Remove any undefined or null values
      Object.keys(cleanData).forEach(key => {
        if (cleanData[key] === undefined || cleanData[key] === null) {
          delete cleanData[key];
        }
      });

      // Ensure all string fields are actually strings
      if (cleanData.ocr_text && typeof cleanData.ocr_text !== 'string') {
        cleanData.ocr_text = String(cleanData.ocr_text);
      }
      if (cleanData.news_text && typeof cleanData.news_text !== 'string') {
        cleanData.news_text = String(cleanData.news_text);
      }

      const historyRef = collection(db, this.collection);
      const docRef = await addDoc(historyRef, cleanData);
      console.log('History saved successfully:', docRef.id);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error saving to history:', error);
      return { success: false, error: error.message };
    }
  }

  // Get user's history
  async getUserHistory(userId, limitCount = 50) {
    try {
      const historyRef = collection(db, this.collection);
      const q = query(
        historyRef, 
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const history = [];
      querySnapshot.forEach((doc) => {
        history.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return { success: true, history };
    } catch (error) {
      console.error('Error fetching history:', error);
      return { success: false, error: error.message };
    }
  }

  // Delete a history item
  async deleteHistoryItem(historyId) {
    try {
      await deleteDoc(doc(db, this.collection, historyId));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Clear all user history
  async clearUserHistory(userId) {
    try {
      const historyRef = collection(db, this.collection);
      const q = query(historyRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      const deletePromises = [];
      querySnapshot.forEach((document) => {
        deletePromises.push(deleteDoc(doc(db, this.collection, document.id)));
      });
      
      await Promise.all(deletePromises);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export default new HistoryService();