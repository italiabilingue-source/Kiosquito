import React, { useState, useEffect } from 'react';
import { useRfidReader } from '../../hooks/useRfidReader';
import { getAlumnoByRfid, updateAlumnoBalance } from '../../firebase/alumnos';
import { getPedidosListosPorAlumno, updatePedidoEstado, createPedido } from '../../firebase/pedidos';
import { createMovimiento } from '../../firebase/movimientos';
import { getActiveProductos } from '../../firebase/productos';
import type { Alumno, Pedido, Producto, PedidoItem } from '../../types';
import { Scan, ShoppingCart, Loader2, CheckCircle, Wallet, CreditCard, CheckSquare } from 'lucide-react';

export const CheckoutPanel: React.FC = () => {
  const [alumno, setAlumno] = useState<Alumno | null>(null);
  const [pedidosListos, setPedidosListos] = useState<Pedido[]>([]);
  const [pedidosSeleccionados, setPedidosSeleccionados] = useState<string[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [directCart, setDirectCart] = useState<PedidoItem[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    getActiveProductos().then(setProductos);
  }, []);

  useRfidReader(async (rfid) => {
    if (processing) return;
    setLoading(true);
    setMessage('');
    try {
      const a = await getAlumnoByRfid(rfid);
      if (a) {
        setAlumno(a);
        const pListos = await getPedidosListosPorAlumno(a.id);
        setPedidosListos(pListos);
        // Por defecto seleccionamos todos los pedidos listos
        setPedidosSeleccionados(pListos.map(p => p.id));
        setDirectCart([]);
      } else {
        setMessage('Alumno no encontrado.');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (e) {
      setMessage('Error de conexión.');
    } finally {
      setLoading(false);
    }
  });

  const addToDirectCart = (p: Producto) => {
    setDirectCart(prev => {
      const existing = prev.find(i => i.productoId === p.id);
      if (existing) {
        return prev.map(i => i.productoId === p.id ? { ...i, cantidad: i.cantidad + 1 } : i);
      }
      return [...prev, { id: crypto.randomUUID(), productoId: p.id, productoNombre: p.nombre, cantidad: 1, precioUnitario: p.precio }];
    });
  };

  const clearSession = () => {
    setAlumno(null);
    setPedidosListos([]);
    setPedidosSeleccionados([]);
    setDirectCart([]);
    setMessage('');
  };

  const togglePedidoSeleccionado = (id: string) => {
    setPedidosSeleccionados(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const handleCobro = async (isFiado: boolean) => {
    if (!alumno) return;
    setProcessing(true);
    try {
      let totalPedidosSeleccionados = 0;
      const filteredPedidos = pedidosListos.filter(p => pedidosSeleccionados.includes(p.id));
      for (const p of filteredPedidos) {
        totalPedidosSeleccionados += p.total;
      }
      
      let totalDirecto = directCart.reduce((sum, item) => sum + item.precioUnitario * item.cantidad, 0);
      const granTotal = totalPedidosSeleccionados + totalDirecto;
      
      if (granTotal === 0) {
        setMessage('No hay nada seleccionado para cobrar.');
        setProcessing(false);
        return;
      }

      // 1. Update Balance
      const newBalance = alumno.balance - granTotal;
      await updateAlumnoBalance(alumno.id, newBalance);
      
      // 2. Mark selected ready orders as delivered
      for (const p of filteredPedidos) {
        await updatePedidoEstado(p.id, 'entregado');
      }
      
      // 3. Create direct order if any items
      if (totalDirecto > 0) {
        await createPedido({
          alumnoId: alumno.id,
          estado: 'entregado',
          tipo: 'en_el_momento',
          total: totalDirecto,
          createdAt: Date.now(),
          items: directCart
        });
      }
      
      // 4. Create movement record
      await createMovimiento({
        alumnoId: alumno.id,
        tipo: 'compra',
        monto: granTotal,
        descripcion: isFiado ? 'Compra (Fiado)' : 'Compra (Saldo)',
        createdAt: Date.now()
      });

      setMessage(isFiado ? '¡Cobro Fiado registrado!' : '¡Pago Procesado!');
      setTimeout(() => {
        clearSession();
        setProcessing(false);
      }, 2500);

    } catch (e) {
      console.error(e);
      setMessage('Error al procesar el cobro.');
      setProcessing(false);
    }
  };

  const pedidosSeleccionadosTotal = pedidosListos
    .filter(p => pedidosSeleccionados.includes(p.id))
    .reduce((sum, p) => sum + p.total, 0);
  const directCartTotal = directCart.reduce((sum, item) => sum + item.precioUnitario * item.cantidad, 0);
  const granTotal = pedidosSeleccionadosTotal + directCartTotal;
  const saldoRestante = alumno ? alumno.balance - granTotal : 0;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col lg:flex-row font-sans">
      {/* Columna Izquierda: Escáner y Perfil */}
      <div className="w-full lg:w-1/3 bg-white p-6 lg:p-8 border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col items-center shadow-lg z-10">
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight mb-8 w-full">Caja / Retiros</h1>
        
        {!alumno ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            {loading ? (
              <>
                <Loader2 className="w-24 h-24 mb-6 animate-spin text-cafeteria-500" />
                <p className="text-2xl font-bold">Buscando...</p>
              </>
            ) : (
              <>
                <div className="bg-slate-50 p-8 rounded-full mb-6 relative border border-slate-100 shadow-inner">
                   <Scan className="w-24 h-24 text-slate-300 animate-pulse" />
                </div>
                <p className="text-2xl font-bold text-center text-slate-600">Esperando Tarjeta RFID</p>
                <p className="text-lg mt-2 text-center max-w-xs leading-relaxed">Apoye la tarjeta del alumno para iniciar el cobro.</p>
              </>
            )}
            {message && <p className="mt-6 text-red-500 font-bold text-xl animate-bounce">{message}</p>}
          </div>
        ) : (
          <div className="w-full flex flex-col flex-1 animate-in fade-in slide-in-from-left-4">
            <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 mb-6 text-center shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-24 bg-cafeteria-500 opacity-10"></div>
              <div className="w-24 h-24 bg-white text-cafeteria-600 rounded-full flex items-center justify-center text-4xl font-extrabold mx-auto mb-4 relative z-10 shadow-sm border-4 border-slate-50 uppercase">
                {alumno.apellido.charAt(0)}
              </div>
              <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">{alumno.nombre}</h2>
              <p className="text-slate-500 font-bold text-lg mb-6">{alumno.curso}</p>
              
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <span className="block text-sm text-slate-400 font-bold uppercase tracking-wider mb-2 text-center">Deuda Acumulada</span>
                <span className={`text-5xl font-extrabold tracking-tight text-center block ${alumno.balance < 0 ? 'text-red-500' : 'text-slate-300'}`}>
                  ${Math.abs(alumno.balance)}
                </span>
              </div>
            </div>

            <button 
              onClick={clearSession}
              disabled={processing}
              className="mt-auto w-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 border border-transparent hover:border-slate-200 font-bold py-4 rounded-2xl transition-all"
            >
              Cancelar / Atender a otro alumno
            </button>
          </div>
        )}
      </div>

      {/* Columna Derecha: Pedidos y Cobro */}
      <div className="flex-1 p-8 flex flex-col bg-slate-50 relative">
        {!alumno && (
             <div className="absolute inset-0 bg-slate-50/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center">
                 <ShoppingCart className="w-20 h-20 text-slate-300 mb-4" />
                 <p className="text-2xl font-bold text-slate-400">Escanee una tarjeta primero</p>
             </div>
        )}
        <div className="flex-1 overflow-y-auto pr-4 mb-6">
          {/* Pedidos Anticipados */}
          <div className="mb-8">
            <h3 className="text-2xl font-extrabold text-slate-800 mb-4 flex items-center tracking-tight">
              <CheckCircle className="w-7 h-7 mr-3 text-cafeteria-500" />
              Retiros Pendientes ({pedidosListos.length})
            </h3>
            {pedidosListos.length === 0 ? (
              <p className="text-slate-400 bg-slate-100 p-6 rounded-2xl border border-slate-200 font-medium text-lg text-center border-dashed">No hay viandas preparadas ni pendientes de retiro.</p>
            ) : (
              <div className="space-y-4">
                {pedidosListos.map(p => (
                  <button 
                    key={p.id} 
                    onClick={() => togglePedidoSeleccionado(p.id)}
                    className={`w-full text-left p-6 rounded-2xl shadow-sm border-2 transition-all flex justify-between items-center ${
                      pedidosSeleccionados.includes(p.id) 
                      ? 'bg-cafeteria-50 border-cafeteria-500 ring-2 ring-cafeteria-500/20' 
                      : 'bg-white border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center ${
                        pedidosSeleccionados.includes(p.id) ? 'bg-cafeteria-500 border-cafeteria-500' : 'border-slate-300'
                      }`}>
                         {pedidosSeleccionados.includes(p.id) && <CheckSquare className="w-4 h-4 text-white" />}
                      </div>
                      <ul className="text-slate-700 font-medium space-y-1">
                        {p.items?.map((item, idx) => (
                          <li key={idx} className="flex items-center">
                              <span className="font-extrabold text-slate-400 mr-2 text-xs bg-slate-100 px-1.5 py-0.5 rounded">x{item.cantidad}</span>
                              {item.productoNombre}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <span className="font-extrabold text-2xl text-slate-800">${p.total}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Venta Directa */}
          <div className="mb-8">
            <h3 className="text-2xl font-extrabold text-slate-800 mb-4 flex items-center tracking-tight">
              <ShoppingCart className="w-7 h-7 mr-3 text-blue-500" />
              Extras / Compra Directa
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {productos.map(p => (
                <button
                  key={p.id}
                  onClick={() => addToDirectCart(p)}
                  disabled={processing}
                  className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all text-left active:scale-95 group"
                >
                  <span className="block font-bold text-slate-700 mb-2 truncate" title={p.nombre}>{p.nombre}</span>
                  <span className="block text-cafeteria-600 font-extrabold text-xl">${p.precio}</span>
                </button>
              ))}
            </div>

            {directCart.length > 0 && (
               <div className="bg-blue-50 p-6 rounded-2xl shadow-sm border border-blue-100 space-y-4 transition-all">
                 <h4 className="font-bold text-blue-800 border-b border-blue-100 pb-2 mb-4">Tickets a sumar:</h4>
                 {directCart.map(item => (
                   <div key={item.id} className="flex justify-between font-bold text-slate-700 text-lg">
                     <span><span className="text-blue-500 mr-2 opacity-80">x{item.cantidad}</span>{item.productoNombre}</span>
                     <span>${item.precioUnitario * item.cantidad}</span>
                   </div>
                 ))}
               </div>
            )}
          </div>
        </div>

        {/* Resumen y Acciones */}
        <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-200 shrink-0">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 lg:mb-8 text-center sm:text-left gap-2">
            <span className="text-xl lg:text-2xl font-extrabold text-slate-400 uppercase tracking-widest">Total:</span>
            <span className="text-5xl lg:text-6xl font-black text-slate-800 tracking-tighter">${granTotal}</span>
          </div>
          
          {message && <div className="mb-6 text-center font-bold text-xl text-white bg-green-500 p-4 rounded-xl shadow-inner animate-in fade-in">{message}</div>}

          <div className="flex space-x-6">
            <button
              disabled={granTotal === 0 || processing}
              onClick={() => handleCobro(false)}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white p-6 rounded-2xl text-2xl font-bold shadow-lg shadow-green-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center disabled:cursor-not-allowed group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 w-1/4 skew-x-12 -translate-x-[200%] group-hover:animate-[shimmer_1s_forwards]"></div>
              {processing ? <Loader2 className="w-8 h-8 animate-spin" /> : (
                <>
                  <Wallet className="w-8 h-8 mr-3" /> Cobrar (Pagado)
                </>
              )}
            </button>

            <button
              disabled={granTotal === 0 || processing}
              onClick={() => handleCobro(true)}
              className="flex-1 bg-slate-800 hover:bg-slate-900 text-white p-6 rounded-2xl text-2xl font-bold shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center group"
            >
              {processing ? <Loader2 className="w-8 h-8 animate-spin" /> : (
                <>
                  <CreditCard className="w-8 h-8 mr-3" /> Fiar (Deuda)
                </>
              )}
            </button>
          </div>
          {alumno && saldoRestante < 0 && granTotal > 0 && (
            <div className="bg-red-50 text-red-600 mt-6 text-center font-bold p-3 rounded-xl border border-red-100 flex items-center justify-center">
              El saldo es insuficiente. Se debe utilizar la opción FIAR (quedará un saldo de ${saldoRestante}).
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
