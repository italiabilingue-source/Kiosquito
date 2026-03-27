import React, { useEffect, useState } from 'react';
import { subscribeToPedidosActivos, updatePedidoEstado } from '../../firebase/pedidos';
import { subscribeToProductos, updateProducto } from '../../firebase/productos';
import { getAlumnos, updateAlumno } from '../../firebase/alumnos';
import { createMovimiento } from '../../firebase/movimientos';
import type { Pedido, Producto, Alumno } from '../../types';
import { ChefHat, Clock, Package, Users, DollarSign, CreditCard } from 'lucide-react';

export const KitchenPanel: React.FC = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  // loading state removed for lint consistency

  useEffect(() => {
    const unsubPedidos = subscribeToPedidosActivos(setPedidos);
    const unsubProductos = subscribeToProductos(setProductos);
    getAlumnos().then(setAlumnos);

    return () => {
      unsubPedidos();
      unsubProductos();
    };
  }, []);

  const getAlumnoNombre = (id: string) => {
    const a = alumnos.find(al => al.id === id);
    return a ? `${a.apellido}, ${a.nombre}` : 'Desconocido';
  };

  const handleCobrarPedido = async (pedido: Pedido, tipo: 'pagado' | 'fiado') => {
    const confirmMsg = tipo === 'pagado' 
      ? `¿Confirmar pago de $${pedido.total}?` 
      : `¿Registrar $${pedido.total} como deuda (fiado)?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const alumno = alumnos.find(a => a.id === pedido.alumnoId);
      if (!alumno) throw new Error("Alumno no encontrado");

      // 1. Crear movimiento de cuenta
      await createMovimiento({
        alumnoId: pedido.alumnoId,
        tipo: 'deuda', // Siempre es un cargo, independientemente de si paga ahora
        monto: pedido.total,
        descripcion: `Pedido: ${pedido.items.map(i => i.productoNombre).join(', ')}`,
        createdAt: Date.now()
      });

      // 2. Si es FIADO, descontar del balance del alumno (aumentar deuda)
      if (tipo === 'fiado') {
        const nuevoBalance = (alumno.balance || 0) - pedido.total;
        await updateAlumno(alumno.id, { balance: nuevoBalance });
      }

      // 3. Marcar pedido como retirado/entregado
      await updatePedidoEstado(pedido.id, 'entregado');
      
      // Refrescar lista de alumnos para los balances
      getAlumnos().then(setAlumnos);

    } catch (e) {
      alert("Error al procesar cobro");
    }
  };

  return (
    <div className="flex bg-slate-100 min-h-screen h-screen font-sans overflow-hidden">
      
      {/* Columna Izquierda: Gestión de Stock */}
      <aside className="w-80 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <header className="p-6 bg-slate-900 text-white">
          <div className="flex items-center">
            <ChefHat className="w-8 h-8 text-cafeteria-500 mr-3" />
            <h1 className="text-2xl font-black italic tracking-tighter">COCINA</h1>
          </div>
          <p className="text-slate-400 text-sm font-bold mt-1 uppercase tracking-widest">Disponibilidad</p>
        </header>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {productos.map(p => (
            <div key={p.id} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center justify-between group transition-all hover:bg-white hover:shadow-md">
              <div className="flex-1 min-w-0 pr-3">
                 <h3 className="font-extrabold text-slate-800 text-sm leading-tight truncate">{p.nombre}</h3>
                 <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{p.categoria}</p>
              </div>
              <button 
                onClick={() => updateProducto(p.id, { disponible: !p.disponible })}
                className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${p.disponible ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}
              >
                {p.disponible ? 'ACTIVO' : 'SIN STOCK'}
              </button>
            </div>
          ))}
        </div>
      </aside>

      {/* Área Central: Pedidos a Entregar */}
      <main className="flex-1 flex flex-col p-6 overflow-hidden">
        <header className="flex items-center justify-between mb-8">
           <h2 className="text-4xl font-black text-slate-900 tracking-tighter">ENTREGAS PENDIENTES</h2>
           <div className="flex space-x-4">
              <div className="bg-white px-6 py-3 rounded-2xl border border-slate-200 shadow-sm flex items-center">
                 <Clock className="w-5 h-5 text-orange-500 mr-3" />
                 <span className="text-2xl font-black text-slate-800">{pedidos.length}</span>
              </div>
           </div>
        </header>

        {pedidos.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
             <div className="bg-white p-12 rounded-[3rem] shadow-sm border-2 border-dashed border-slate-200 text-center">
               <Package className="w-20 h-20 mx-auto mb-6 opacity-20" />
               <p className="text-2xl font-black uppercase tracking-widest italic">Sin pedidos</p>
               <p className="text-slate-400 font-bold mt-2">Todo está al día en la cocina.</p>
             </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 overflow-y-auto pr-2">
            {pedidos.map(p => (
              <div key={p.id} className="bg-white rounded-[3rem] p-8 shadow-xl border border-slate-100 flex flex-col animate-in fade-in slide-in-from-bottom-4 transition-all hover:scale-[1.01]">
                <div className="flex justify-between items-start mb-6">
                   <div className="flex items-center bg-slate-900 text-white px-4 py-2 rounded-2xl">
                      <Users className="w-5 h-5 mr-3 text-cafeteria-500" />
                      <span className="font-black italic uppercase tracking-tighter">{getAlumnoNombre(p.alumnoId)}</span>
                   </div>
                   <div className="bg-orange-50 text-orange-600 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-widest">
                      {p.estado}
                   </div>
                </div>

                <div className="flex-1 space-y-4 mb-8">
                   {p.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                         <div className="flex items-center">
                            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center mr-3 shadow-sm">
                               <span className="font-black text-slate-800 text-sm">{item.cantidad}</span>
                            </div>
                            <span className="font-extrabold text-slate-700 text-lg">{item.productoNombre}</span>
                         </div>
                         <span className="text-slate-400 font-black text-sm">${item.precioUnitario * item.cantidad}</span>
                      </div>
                   ))}
                </div>

                <div className="pt-6 border-t border-slate-100">
                   <div className="flex justify-between items-center mb-6 px-2">
                      <span className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs">Total a Cobrar</span>
                      <span className="text-4xl font-black text-slate-900 tracking-tighter">${p.total}</span>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => handleCobrarPedido(p, 'pagado')}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white py-5 rounded-[2rem] font-black text-xl shadow-lg shadow-emerald-500/20 flex flex-col items-center justify-center transition-all active:scale-95 group"
                      >
                         <DollarSign className="w-6 h-6 mb-1 group-hover:scale-110 transition-transform" />
                         PAGÓ
                      </button>
                      <button 
                        onClick={() => handleCobrarPedido(p, 'fiado')}
                        className="bg-slate-900 hover:bg-black text-white py-5 rounded-[2rem] font-black text-xl shadow-lg flex flex-col items-center justify-center transition-all active:scale-95 group"
                      >
                         <CreditCard className="w-6 h-6 mb-1 group-hover:scale-110 transition-transform text-cafeteria-500" />
                         FIADO
                      </button>
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
