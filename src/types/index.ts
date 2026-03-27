export interface Alumno {
  id: string;
  nombre: string;
  apellido: string;
  dni: string;
  curso: string;
  balance: number;
  rfid: string;
  activo: boolean;
  createdAt: number;
}

export interface Producto {
  id: string;
  nombre: string;
  precio: number;
  categoria: string;
  activo: boolean;
  disponible: boolean; 
  soloHorario: boolean; // Si es false, se ve todo el día
  horaInicio: string;    // Formato "HH:mm" (ej: "07:00")
  horaFin: string;       // Formato "HH:mm" (ej: "10:00")
}

export type EstadoPedido = 'pendiente' | 'preparando' | 'listo' | 'entregado' | 'cancelado';
export type TipoPedido = 'anticipado' | 'en_el_momento';

export interface Pedido {
  id: string;
  alumnoId: string;
  estado: EstadoPedido;
  tipo: TipoPedido;
  total: number;
  createdAt: number;
  horarioEntrega?: string; // e.g., 'recreo', 'almuerzo'
  items: PedidoItem[]; 
}

export interface PedidoItem {
  id: string;
  pedidoId?: string; // Optional if embedded inside Pedido
  productoId: string;
  productoNombre: string;
  cantidad: number;
  precioUnitario: number;
}

export type TipoMovimiento = 'deuda' | 'pago' | 'ajuste' | 'carga';

export interface Movimiento {
  id: string;
  alumnoId: string;
  tipo: TipoMovimiento;
  monto: number;
  descripcion: string;
  createdAt: number;
}
