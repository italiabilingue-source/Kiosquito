import { collection, doc, getDocs, query, where, updateDoc, addDoc, onSnapshot } from 'firebase/firestore';
import { db } from './config';
import type { Alumno } from '../types';

const alumnosCollection = collection(db, 'alumnos');

export const getAlumnos = async (): Promise<Alumno[]> => {
  const snapshot = await getDocs(alumnosCollection);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Alumno));
};

export const subscribeToAlumnos = (callback: (alumnos: Alumno[]) => void): (() => void) => {
  return onSnapshot(alumnosCollection, (snapshot) => {
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Alumno));
    callback(list);
  });
};

export const getAlumnoByRfid = async (rfid: string): Promise<Alumno | null> => {
  if (!rfid) return null;
  const q = query(alumnosCollection, where("rfid", "==", rfid), where("activo", "==", true));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const docRef = snapshot.docs[0];
  return { id: docRef.id, ...docRef.data() } as Alumno;
};

export const createAlumno = async (alumno: Omit<Alumno, 'id'>): Promise<string> => {
  const docRef = await addDoc(alumnosCollection, alumno);
  return docRef.id;
};

export const updateAlumno = async (id: string, data: Partial<Alumno>): Promise<void> => {
  const ref = doc(db, 'alumnos', id);
  await updateDoc(ref, data);
};

export const updateAlumnoBalance = async (alumnoId: string, newBalance: number): Promise<void> => {
  const ref = doc(db, 'alumnos', alumnoId);
  await updateDoc(ref, {
    balance: newBalance
  });
};

