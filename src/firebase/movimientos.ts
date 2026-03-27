import { collection, addDoc, query, where, getDocs, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from './config';
import type { Movimiento } from '../types';

const movCollection = collection(db, 'movimientos');

export const createMovimiento = async (movimiento: Omit<Movimiento, 'id'>): Promise<string> => {
  const docRef = await addDoc(movCollection, movimiento);
  return docRef.id;
};

export const getMovimientosPorAlumno = async (alumnoId: string, limitCount = 20): Promise<Movimiento[]> => {
  const q = query(
    movCollection, 
    where("alumnoId", "==", alumnoId),
    orderBy("createdAt", "desc"),
    limit(limitCount)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Movimiento));
};

export const subscribeToMovimientos = (callback: (movimientos: Movimiento[]) => void): (() => void) => {
  const q = query(movCollection, orderBy("createdAt", "desc"), limit(100));
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Movimiento));
    callback(list);
  });
};
