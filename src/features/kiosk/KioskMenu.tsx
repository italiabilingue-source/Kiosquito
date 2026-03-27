import { useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { subscribeToProductos } from '../../firebase/productos';
import { createPedido } from '../../firebase/pedidos';
import { getAlumnoByRfid } from '../../firebase/alumnos';
import { useRfidReader } from '../../hooks/useRfidReader';
import type { Producto, Alumno } from '../../types';
import { ShoppingBag, CheckCircle, Clock, Scan, X, Package, Utensils, ChevronRight, Info, Menu, Loader2 } from 'lucide-react';
import { parse, isBefore, isAfter, format } from 'date-fns';

export const KioskMenu: React.FC = () => {
  const { cart, addToCart, clearCart, cartTotal, setCurrentAlumno } = useAppStore();
  
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showRfidModal, setShowRfidModal] = useState(false);
  const [rfidError, setRfidError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeCategory, setActiveCategory] = useState<string>('Todos');
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToProductos((allProd) => {
      const now = new Date();
      setCurrentTime(now);
      const filtered = allProd.filter(p => {
        if (!p.disponible) return false;
        if (!p.soloHorario) return true;
        try {
          const start = parse(p.horaInicio, 'HH:mm', now);
          const end = parse(p.horaFin, 'HH:mm', now);
          return isAfter(now, start) && isBefore(now, end);
        } catch (e) { return true; }
      });
      setProductos(filtered);
      setLoading(false);
    });
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => { unsubscribe(); clearInterval(timer); };
  }, []);

  useRfidReader(async (rfid) => {
    if (!showRfidModal || isSubmitting || success) return;
    setIsSubmitting(true);
    setRfidError(null);
    try {
      const alumno = await getAlumnoByRfid(rfid);
      if (alumno) { await processOrder(alumno); } 
      else {
        setRfidError('Tarjeta no reconocida.');
        setIsSubmitting(false);
        setTimeout(() => setRfidError(null), 3000);
      }
    } catch (err) { setRfidError('Error de conexión.'); setIsSubmitting(false); }
  });

  const processOrder = async (alumno: Alumno) => {
    try {
      await createPedido({
        alumnoId: alumno.id,
        estado: 'pendiente',
        tipo: 'anticipado',
        total: cartTotal(),
        createdAt: Date.now(),
        horarioEntrega: 'almuerzo',
        items: cart
      });
      setSuccess(true);
      setTimeout(() => {
        clearCart();
        setCurrentAlumno(null);
        setShowRfidModal(false);
        setSuccess(false);
        setIsSubmitting(false);
      }, 3500);
    } catch (e) { setRfidError('Error al guardar.'); setIsSubmitting(false); }
  };

  const categorias = ['Todos', ...Array.from(new Set(productos.map(p => p.categoria)))];
  const displayedProducts = activeCategory === 'Todos' ? productos : productos.filter(p => p.categoria === activeCategory);

  return (
    <div className="flex flex-col md:flex-row bg-white min-h-screen h-screen overflow-hidden font-sans select-none text-slate-900 border-x border-slate-200 lg:max-w-7xl lg:mx-auto">
      
      {/* Sidebar de Categorías - Adaptativo */}
      <aside className={`fixed inset-0 z-50 md:relative md:flex md:w-24 bg-slate-50 border-r border-slate-100 flex-col items-center py-4 space-y-4 shrink-0 transition-transform md:translate-x-0 ${showMobileMenu ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="flex md:hidden absolute top-4 right-4"><button onClick={() => setShowMobileMenu(false)}><X className="w-8 h-8 text-slate-400" /></button></div>
        <div className="w-12 h-12 bg-cafeteria-600 rounded-xl flex items-center justify-center shadow-lg mb-4">
           <Utensils className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 w-full overflow-y-auto px-2 space-y-2">
          {categorias.map(cat => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setShowMobileMenu(false); }}
              className={`w-full py-4 rounded-xl flex flex-col items-center justify-center transition-all ${
                activeCategory === cat ? 'bg-white shadow text-cafeteria-600 border border-slate-100' : 'text-slate-400 hover:bg-slate-100'
              }`}
            >
              <Package className={`w-5 h-5 mb-1 ${activeCategory === cat ? 'text-cafeteria-500' : 'text-slate-300'}`} />
              <span className="text-[10px] font-black uppercase tracking-tighter text-center leading-tight">{cat === 'Todos' ? 'Menú' : cat}</span>
            </button>
          ))}
        </div>
      </aside>

      {/* Área Central */}
      <main className="flex-1 flex flex-col bg-white overflow-hidden relative">
        <header className="p-4 md:p-6 flex items-center justify-between z-10 border-b border-slate-50 bg-white/80 backdrop-blur-sm">
          <div className="flex items-center">
            <button onClick={() => setShowMobileMenu(true)} className="md:hidden mr-4 p-2 bg-slate-100 rounded-lg"><Menu className="w-6 h-6" /></button>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tighter leading-none">{activeCategory === 'Todos' ? 'Menú' : activeCategory}</h1>
              <p className="text-[10px] md:text-xs font-bold text-slate-400">Seleccioná tus productos.</p>
            </div>
          </div>
          <div className="bg-slate-100 px-3 py-1 rounded-full flex items-center border border-slate-200">
             <Clock className="w-3 h-3 text-cafeteria-600 mr-2" />
             <span className="text-sm font-black text-slate-700">{format(currentTime, 'HH:mm')}</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 pb-32 scrollbar-hide">
          {loading ? (
             <div className="h-full flex items-center justify-center text-slate-300"><Loader2 className="animate-spin" /></div>
          ) : displayedProducts.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center text-center opacity-40"><Info className="w-12 h-12 mb-2" /><h3 className="font-black text-sm">Sin disponibilidad</h3></div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
              {displayedProducts.map(p => (
                <button
                  key={p.id}
                  onClick={() => addToCart({ productoId: p.id, productoNombre: p.nombre, cantidad: 1, precioUnitario: p.precio })}
                  className="bg-white rounded-2xl p-3 text-left border border-slate-100 shadow-sm hover:shadow-md transition-all active:scale-95 group overflow-hidden"
                >
                  <div className="aspect-square bg-slate-50 rounded-xl mb-3 flex items-center justify-center group-hover:bg-cafeteria-50 transition-colors">
                     <Package className="w-8 h-8 md:w-12 md:h-12 text-slate-100 group-hover:text-cafeteria-100" />
                  </div>
                  <h3 className="text-xs font-black text-slate-800 leading-tight mb-1 truncate">{p.nombre}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-sm md:text-lg font-black text-cafeteria-600 tracking-tight">${p.precio}</span>
                    <div className="w-6 h-6 md:w-8 md:h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white text-xs md:text-sm group-hover:bg-cafeteria-600 transition-colors">+</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Barra de Carrito Flotante (McDonald's Style) */}
        <div className={`fixed bottom-0 left-0 right-0 bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.15)] border-t border-slate-100 px-4 py-3 md:py-4 transition-all duration-500 z-40 ${cart.length > 0 ? 'translate-y-0' : 'translate-y-full'}`}>
           <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
              <div className="flex items-center space-x-3 shrink-0">
                 <div className="relative">
                    <div className="bg-slate-900 w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center shadow-lg"><ShoppingBag className="w-5 h-5 text-white" /></div>
                    <span className="absolute -top-2 -right-2 bg-cafeteria-600 text-white w-5 h-5 rounded-full border-2 border-white flex items-center justify-center font-black text-[10px]">{cart.reduce((s, i) => s + i.cantidad, 0)}</span>
                 </div>
                 <div className="hidden xs:block"><p className="text-xl font-black text-slate-900 tracking-tight">${cartTotal()}</p></div>
              </div>

              <div className="flex items-center space-x-2 flex-1 justify-end">
                 <button onClick={clearCart} className="text-[10px] font-black text-slate-400 uppercase tracking-tighter px-2">Borrar</button>
                 <button
                   onClick={() => setShowRfidModal(true)}
                   className="flex-1 max-w-xs bg-cafeteria-600 text-white h-12 md:h-14 rounded-xl text-lg md:text-xl font-black shadow-lg shadow-cafeteria-600/20 active:scale-95 flex items-center justify-center uppercase tracking-tighter truncate px-4"
                 >
                   Confirmar <ChevronRight className="ml-1 w-5 h-5" />
                 </button>
              </div>
           </div>
        </div>
      </main>

      {/* Modal RFID - Adaptado para Teléfono */}
      {showRfidModal && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
           <div className="bg-white rounded-[2rem] p-6 md:p-8 max-w-sm w-full text-center shadow-2xl relative">
              {!success && <button onClick={() => setShowRfidModal(false)} className="absolute top-6 right-6 text-slate-300 hover:text-slate-900"><X className="w-8 h-8" /></button>}
              {success ? (
                <div className="animate-in zoom-in-50">
                  <div className="bg-emerald-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/30"><CheckCircle className="w-10 h-10 text-white" /></div>
                  <h2 className="text-3xl font-black text-slate-900 mb-2 italic">¡LISTO!</h2>
                  <p className="text-slate-400 font-bold">Reserva confirmada.</p>
                </div>
              ) : (
                <>
                  <div className="bg-slate-50 w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-slate-100"><Scan className="w-12 h-12 text-cafeteria-600 animate-pulse" /></div>
                  <h2 className="text-2xl font-black text-slate-900 mb-2 leading-none">IDENTIFICARSE</h2>
                  <p className="text-slate-400 font-bold mb-8 text-xs">Apoyá la tarjeta en el lector.</p>
                  <div className="h-10 flex items-center justify-center">
                    {isSubmitting ? <Loader2 className="animate-spin text-cafeteria-600" /> : 
                     rfidError ? <div className="text-red-500 text-[10px] font-black uppercase text-center">{rfidError}</div> :
                     <div className="flex space-x-1"><div className="w-2 h-2 bg-slate-200 rounded-full animate-bounce"></div><div className="w-2 h-2 bg-slate-200 rounded-full animate-bounce delay-100"></div></div>}
                  </div>
                </>
              )}
           </div>
        </div>
      )}
    </div>
  );
};
