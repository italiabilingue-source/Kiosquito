import { collection, getDocs, query, where, addDoc, updateDoc, doc, onSnapshot, deleteDoc } from 'firebase/firestore';
import { db } from './config';
import type { Producto } from '../types';

const prodCollection = collection(db, 'productos');

export const getActiveProductos = async (): Promise<Producto[]> => {
  const q = query(prodCollection, where("activo", "==", true));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Producto));
};

export const subscribeToProductos = (callback: (productos: Producto[]) => void) => {
  const q = query(prodCollection, where("activo", "==", true));
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Producto));
    callback(list);
  });
};

export const getAllProductos = async (): Promise<Producto[]> => {
  const snapshot = await getDocs(prodCollection);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Producto));
};

export const createProducto = async (producto: Omit<Producto, 'id'>): Promise<string> => {
  const docRef = await addDoc(prodCollection, producto);
  return docRef.id;
};

export const updateProducto = async (id: string, data: Partial<Producto>): Promise<void> => {
  const ref = doc(db, 'productos', id);
  await updateDoc(ref, data);
};

export const deleteProducto = async (id: string): Promise<void> => {
  const ref = doc(db, 'productos', id);
  await deleteDoc(ref);
};
