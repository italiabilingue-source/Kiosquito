import { collection, addDoc, updateDoc, doc, onSnapshot, query, where, getDocs } from 'firebase/firestore';
import { db } from './config';
import type { Pedido, EstadoPedido } from '../types';

const pedidosCollection = collection(db, 'pedidos');

export const createPedido = async (pedido: Omit<Pedido, 'id'>): Promise<string> => {
  const docRef = await addDoc(pedidosCollection, pedido);
  return docRef.id;
};

export const updatePedidoEstado = async (pedidoId: string, nuevoEstado: EstadoPedido): Promise<void> => {
  const ref = doc(db, 'pedidos', pedidoId);
  await updateDoc(ref, { estado: nuevoEstado });
};

export const subscribeToPedidosActivos = (callback: (pedidos: Pedido[]) => void): (() => void) => {
  const q = query(
    pedidosCollection, 
    where("estado", "in", ["pendiente", "preparando", "listo"])
  );
  
  return onSnapshot(q, (snapshot) => {
    const pedidos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Pedido));
    callback(pedidos);
  });
};

export const getPedidosListosPorAlumno = async (alumnoId: string): Promise<Pedido[]> => {
  if (!alumnoId) return [];
  const q = query(
    pedidosCollection, 
    where("alumnoId", "==", alumnoId),
    where("estado", "==", "listo")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Pedido));
};
