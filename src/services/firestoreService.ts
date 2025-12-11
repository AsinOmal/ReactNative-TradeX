import {
    collection,
    deleteDoc,
    doc,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    setDoc,
    Unsubscribe,
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { MonthRecord } from '../types';

/**
 * Get the months collection reference for a user
 */
function getMonthsCollection(userId: string) {
  return collection(db, 'users', userId, 'months');
}

/**
 * Get the document reference for a specific month
 */
function getMonthDoc(userId: string, monthId: string) {
  return doc(db, 'users', userId, 'months', monthId);
}

/**
 * Get all months for a user
 */
export async function getMonths(userId: string): Promise<MonthRecord[]> {
  const monthsRef = getMonthsCollection(userId);
  const q = query(monthsRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id,
  })) as MonthRecord[];
}

/**
 * Save a month (create or update)
 */
export async function saveMonth(userId: string, month: MonthRecord): Promise<void> {
  const monthRef = getMonthDoc(userId, month.id);
  await setDoc(monthRef, {
    ...month,
    updatedAt: Date.now(),
  });
}

/**
 * Delete a month
 */
export async function deleteMonthFromFirestore(userId: string, monthId: string): Promise<void> {
  const monthRef = getMonthDoc(userId, monthId);
  await deleteDoc(monthRef);
}

/**
 * Subscribe to real-time updates for a user's months
 */
export function subscribeToMonths(
  userId: string,
  callback: (months: MonthRecord[]) => void
): Unsubscribe {
  const monthsRef = getMonthsCollection(userId);
  const q = query(monthsRef, orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const months = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    })) as MonthRecord[];
    callback(months);
  });
}

/**
 * Check if a month exists for a user
 */
export async function monthExistsInFirestore(userId: string, monthKey: string): Promise<boolean> {
  const months = await getMonths(userId);
  return months.some(m => m.month === monthKey);
}
