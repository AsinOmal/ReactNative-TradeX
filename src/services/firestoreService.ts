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
    where,
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { MonthRecord, Trade } from '../types';

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

// User Profile (for Goals)
export async function saveUserProfile(userId: string, data: any): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, data, { merge: true });
}

export function subscribeToUserProfile(userId: string, callback: (data: any) => void): Unsubscribe {
    const userRef = doc(db, 'users', userId);
    return onSnapshot(userRef, (doc) => {
        if (doc.exists()) {
            callback(doc.data());
        } else {
            callback(null);
        }
    });
}

// ============================================
// TRADES COLLECTION
// ============================================

/**
 * Get the trades collection reference for a user
 */
function getTradesCollection(userId: string) {
  return collection(db, 'users', userId, 'trades');
}

/**
 * Get the document reference for a specific trade
 */
function getTradeDoc(userId: string, tradeId: string) {
  return doc(db, 'users', userId, 'trades', tradeId);
}

/**
 * Get all trades for a user
 */
export async function getTrades(userId: string): Promise<Trade[]> {
  const tradesRef = getTradesCollection(userId);
  const q = query(tradesRef, orderBy('exitDate', 'desc'));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id,
  })) as Trade[];
}

/**
 * Get trades for a specific month
 */
export async function getTradesByMonth(userId: string, monthKey: string): Promise<Trade[]> {
  const tradesRef = getTradesCollection(userId);
  const q = query(tradesRef, where('monthKey', '==', monthKey), orderBy('exitDate', 'desc'));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id,
  })) as Trade[];
}

/**
 * Save a trade (create or update)
 */
export async function saveTrade(userId: string, trade: Trade): Promise<void> {
  const tradesRef = getTradesCollection(userId);
  const tradeDoc = doc(tradesRef, trade.id);
  
  await setDoc(tradeDoc, {
    ...trade,
    updatedAt: Date.now(),
  });
}

/**
 * Update an existing trade
 */
export async function updateTrade(userId: string, tradeId: string, updates: Partial<Trade>): Promise<void> {
  const tradesRef = getTradesCollection(userId);
  const tradeDoc = doc(tradesRef, tradeId);
  
  await setDoc(tradeDoc, {
    ...updates,
    updatedAt: Date.now(),
  }, { merge: true });
}

/**
 * Delete a trade
 */
export async function deleteTradeFromFirestore(userId: string, tradeId: string): Promise<void> {
  const tradeRef = getTradeDoc(userId, tradeId);
  await deleteDoc(tradeRef);
}

/**
 * Subscribe to real-time updates for a user's trades
 */
export function subscribeToTrades(
  userId: string,
  callback: (trades: Trade[]) => void
): Unsubscribe {
  const tradesRef = getTradesCollection(userId);
  const q = query(tradesRef, orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const trades = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    })) as Trade[];
    callback(trades);
  });
}
