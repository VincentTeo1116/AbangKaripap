import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs,
  deleteDoc,
  doc,
  limit,
  Timestamp
} from 'firebase/firestore';
import { db } from './config';

// Save detection to history
export const saveDetection = async (userId, detectionData) => {
  try {
    const docRef = await addDoc(collection(db, 'detections'), {
      userId,
      ...detectionData,
      timestamp: Timestamp.now(),
      // Store only necessary data
      textPreview: detectionData.text?.substring(0, 200),
      prediction: detectionData.result?.fake_news?.prediction,
      confidence: detectionData.result?.fake_news?.confidence
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error saving detection:', error);
    return { success: false, error: error.message };
  }
};

// Get user's detection history
export const getUserHistory = async (userId, limitCount = 20) => {
  try {
    const q = query(
      collection(db, 'detections'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const history = [];
    
    querySnapshot.forEach((doc) => {
      history.push({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      });
    });
    
    return { success: true, history };
  } catch (error) {
    console.error('Error fetching history:', error);
    return { success: false, error: error.message };
  }
};

// Delete a history item
export const deleteHistoryItem = async (docId) => {
  try {
    await deleteDoc(doc(db, 'detections', docId));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Clear all history for a user
export const clearUserHistory = async (userId) => {
  try {
    const q = query(
      collection(db, 'detections'),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const deletePromises = [];
    
    querySnapshot.forEach((doc) => {
      deletePromises.push(deleteDoc(doc.ref));
    });
    
    await Promise.all(deletePromises);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};