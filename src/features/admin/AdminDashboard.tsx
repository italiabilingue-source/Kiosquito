import React, { useState, useEffect } from 'react';
import { subscribeToAlumnos, createAlumno, updateAlumno } from '../../firebase/alumnos';
import { getAllProductos, createProducto, updateProducto, deleteProducto } from '../../firebase/productos';
import { subscribeToMovimientos, createMovimiento } from '../../firebase/movimientos';
import type { Alumno, Producto, Movimiento } from '../../types';
import { Users, Package, Plus, Search, Trash2, Edit, X, UserPlus, History, ArrowUpRight, ArrowDownLeft, DollarSign, CheckCircle, Loader2 } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'stats' | 'alumnos' | 'productos' | 'historial'>('stats');
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [editingAlumno, setEditingAlumno] = useState<Partial<Alumno> | null>(null);
  const [editingProducto, setEditingProducto] = useState<Partial<Producto> | null>(null);
  const [settleAmount, setSettleAmount] = useState<number>(0);
  const [settlingAlumno, setSettlingAlumno] = useState<Alumno | null>(null);

  useEffect(() => {
    // Suscripciones en tiempo real
    const unsubAlumnos = subscribeToAlumnos(setAlumnos);
    const unsubMovimientos = subscribeToMovimientos(setMovimientos);
    
    // Carga inicial de productos (estáticos para evitar exceso de lecturas)
    getAllProductos().then(setProductos).finally(() => setLoading(false));

    return () => {
      unsubAlumnos();
      unsubMovimientos();
    };
  }, []);

  const handleSaveAlumno = async () => {
    if (!editingAlumno) return;
    try {
      if (editingAlumno.id) {
        await updateAlumno(editingAlumno.id, editingAlumno);
      } else {
        await createAlumno({
          nombre: editingAlumno.nombre || '',
          apellido: editingAlumno.apellido || '',
          dni: editingAlumno.dni || '',
          curso: editingAlumno.curso || '',
          rfid: editingAlumno.rfid || '',
          balance: editingAlumno.balance || 0,
          activo: true,
          createdAt: Date.now()
        });
      }
      setEditingAlumno(null);
    } catch (e) { alert("Error"); }
  };

  const handleSaveProducto = async () => {
    if (!editingProducto) return;
    try {
      if (editingProducto.id) {
        await updateProducto(editingProducto.id, editingProducto);
      } else {
        await createProducto({
          nombre: editingProducto.nombre || '',
          precio: editingProducto.precio || 0,
          categoria: editingProducto.categoria || 'Almuerzo',
          activo: true,
          disponible: true,
          soloHorario: editingProducto.soloHorario || false,
          horaInicio: editingProducto.horaInicio || "07:00",
          horaFin: editingProducto.horaFin || "10:00"
        });
      }
      setEditingProducto(null);
      getAllProductos().then(setProductos);
    } catch (e) { alert("Error"); }
  };

  const handleDeleteProducto = async (id: string) => {
    if (window.confirm("¿Eliminar producto?")) {
      await deleteProducto(id);
      getAllProductos().then(setProductos);
    }
  };

  const handleSettleDebt = async () => {
    if (!settlingAlumno || settleAmount <= 0) return;
    try {
      await createMovimiento({
        alumnoId: settlingAlumno.id,
        tipo: 'pago',
        monto: settleAmount,
        descripcion: `Pago en efectivo / Liquidación de deuda`,
        createdAt: Date.now()
      });
      const nuevoBalance = (settlingAlumno.balance || 0) + settleAmount;
      await updateAlumno(settlingAlumno.id, { balance: nuevoBalance });
      setSettlingAlumno(null);
      setSettleAmount(0);
    } catch (e) { alert("Error al procesar pago"); }
  };

  const getAlumnoNombre = (id: string) => {
    const a = alumnos.find(al => al.id === id);
    return a ? `${a.apellido}, ${a.nombre}` : 'Eliminado';
  };

  const filteredAlumnos = alumnos.filter(a => 
    `${a.nombre} ${a.apellido} ${a.dni}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 border-x border-slate-200 lg:max-w-7xl lg:mx-auto">
      <header className="bg-slate-900 text-white p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between shadow-xl shrink-0">
        <div className="flex items-center mb-4 md:mb-0">
          <div className="bg-cafeteria-500 p-2 rounded-xl mr-3"><Users className="text-slate-900" /></div>
          <h1 className="text-xl md:text-2xl font-black tracking-tighter uppercase italic leading-none">KIOSCO ADMIN</h1>
        </div>
        <nav className="flex flex-wrap gap-2 bg-slate-800 p-1 rounded-2xl">
          {[
            {id: 'stats', label: 'Dashboard', icon: Users},
            {id: 'alumnos', label: 'Alumnos', icon: UserPlus},
            {id: 'productos', label: 'Cartilla', icon: Package},
            {id: 'historial', label: 'Auditoría', icon: History}
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} 
              className={`px-3 py-2 rounded-xl text-xs md:text-sm font-black flex items-center transition-all ${activeTab === tab.id ? 'bg-cafeteria-500 text-slate-900 shadow-md' : 'text-slate-400 hover:text-white'}`}>
              <tab.icon className="w-4 h-4 mr-2" /> {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
        {loading ? <div className="flex justify-center p-20"><Loader2 className="animate-spin text-cafeteria-500" /></div> : (
          <>
            {activeTab === 'stats' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in">
                 <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
                    <span className="text-slate-400 font-bold uppercase text-[10px] block mb-2">Deuda en Calle</span>
                    <span className="text-3xl font-black text-red-500 tracking-tighter">${alumnos.reduce((s, a) => s + (a.balance < 0 ? Math.abs(a.balance) : 0), 0).toLocaleString()}</span>
                 </div>
                 <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
                    <span className="text-slate-400 font-bold uppercase text-[10px] block mb-2">Créditos de Alumnos</span>
                    <span className="text-3xl font-black text-emerald-500 tracking-tighter">${alumnos.reduce((s, a) => s + (a.balance > 0 ? a.balance : 0), 0).toLocaleString()}</span>
                 </div>
                 <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
                    <span className="text-slate-400 font-bold uppercase text-[10px] block mb-2">Total Alumnos</span>
                    <span className="text-3xl font-black text-slate-800 tracking-tighter">{alumnos.length}</span>
                 </div>
              </div>
            )}

            {activeTab === 'alumnos' && (
              <div className="space-y-6 animate-in slide-in-from-right-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input type="text" placeholder="Buscar por Nombre o DNI..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-4 font-bold outline-none focus:border-cafeteria-500" />
                  </div>
                  <button onClick={() => setEditingAlumno({})} className="bg-cafeteria-600 text-white font-black px-6 py-3 rounded-2xl flex items-center justify-center transition-all active:scale-95 shadow-lg shadow-cafeteria-600/20 text-xs md:text-sm"><Plus className="mr-2 w-4 h-4" /> NUEVO ALUMNO</button>
                </div>
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr><th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Alumno / Curso</th><th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 text-right">SaldoActual</th><th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 text-center">Acciones</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredAlumnos.map(a => (
                        <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 border-l-4 border-transparent hover:border-cafeteria-500">
                            <div className="font-black text-slate-800 uppercase tracking-tighter italic leading-none mb-1">{a.apellido}, {a.nombre}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{a.curso} • DNI {a.dni}</div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className={`text-xl font-black ${a.balance < 0 ? 'text-red-500' : 'text-emerald-500'} tracking-tighter`}>${a.balance}</span>
                          </td>
                          <td className="px-6 py-4 text-center space-x-1">
                             <button onClick={() => { setSettlingAlumno(a); setSettleAmount(Math.abs(a.balance)); }} 
                               className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all" title="Liquidar Deuda">
                               <DollarSign className="w-5 h-5" />
                             </button>
                             <button onClick={() => setEditingAlumno(a)} className="p-2 text-slate-300 hover:text-blue-500 hover:bg-slate-50 rounded-xl transition-all"><Edit className="w-5 h-5" /></button>
                             <button onClick={() => updateAlumno(a.id, { activo: !a.activo }).then(() => {})} className={`p-2 rounded-xl transition-all ${a.activo ? 'text-red-300 hover:bg-red-50' : 'text-emerald-300 hover:bg-emerald-50'}`}><Trash2 className="w-5 h-5" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'productos' && (
              <div className="space-y-6 animate-in slide-in-from-left-4">
                <div className="flex justify-end"><button onClick={() => setEditingProducto({})} className="bg-slate-800 text-white font-black px-6 py-3 rounded-2xl flex items-center transition-all active:scale-95 text-xs md:text-sm"><Plus className="mr-2 w-4 h-4" /> NUEVO EN LA CARTA</button></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {productos.map(p => (
                    <div key={p.id} className="bg-white p-5 rounded-[2.5rem] border border-slate-200 shadow-sm group hover:shadow-md transition-all">
                       <div className="flex justify-between items-center mb-3">
                          <span className="bg-slate-50 text-[9px] font-black px-3 py-1 rounded-full uppercase text-slate-400 tracking-widest">{p.categoria}</span>
                          <div className="flex"><button onClick={() => setEditingProducto(p)} className="p-1 text-slate-300 hover:text-blue-500"><Edit className="w-4 h-4" /></button><button onClick={() => handleDeleteProducto(p.id)} className="p-1 text-slate-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button></div>
                       </div>
                       <h3 className="font-black text-sm text-slate-800 italic uppercase leading-tight mb-4 truncate">{p.nombre}</h3>
                       <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
                          <span className="text-xl font-black text-cafeteria-600 tracking-tighter">${p.precio}</span>
                          <button 
                            onClick={() => updateProducto(p.id, { disponible: !p.disponible }).then(() => getAllProductos().then(setProductos))}
                            className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase transition-all ${p.disponible ? 'text-emerald-500 bg-emerald-50' : 'text-red-500 bg-red-50'}`}
                          >
                            {p.disponible ? 'STOCK' : 'AGOTADO'}
                          </button>
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'historial' && (
              <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-4">
                <div className="p-6 bg-slate-50 border-b flex items-center justify-between">
                   <h3 className="font-black italic uppercase tracking-widest text-slate-400 text-xs">Auditoría de Movimientos</h3>
                </div>
                <table className="w-full text-left">
                   <thead className="bg-slate-50 border-b">
                     <tr><th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Fecha</th><th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Alumno / Cliente</th><th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Concepto</th><th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 text-right">Variación</th></tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {movimientos.map(m => (
                       <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                         <td className="px-6 py-4 text-[10px] font-bold text-slate-500 whitespace-nowrap">
                           {new Date(m.createdAt).toLocaleString('es-AR', {day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'})}
                         </td>
                         <td className="px-6 py-4 font-black uppercase text-xs tracking-tighter italic text-slate-700">{getAlumnoNombre(m.alumnoId)}</td>
                         <td className="px-6 py-4">
                           <div className="flex items-center">
                             {m.tipo === 'deuda' ? <ArrowDownLeft className="text-red-500 w-3 h-3 mr-2 shrink-0" /> : <ArrowUpRight className="text-emerald-500 w-3 h-3 mr-2 shrink-0" />}
                             <span className="text-[11px] font-bold text-slate-600 leading-tight">{m.descripcion}</span>
                           </div>
                         </td>
                         <td className="px-6 py-4 text-right">
                           <span className={`font-black text-base md:text-lg tracking-tighter ${m.tipo === 'deuda' ? 'text-red-500' : 'text-emerald-500'}`}>
                             {m.tipo === 'deuda' ? '-' : '+'}${m.monto}
                           </span>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>

      {/* MODAL: Liquidar Deuda / Cobrar */}
      {settlingAlumno && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-3xl z-[100] flex items-center justify-center p-4 animate-in fade-in">
           <div className="bg-white rounded-[3rem] p-8 md:p-12 w-full max-w-md shadow-2xl relative border border-slate-100">
              <button onClick={() => setSettlingAlumno(null)} className="absolute top-8 right-8 text-slate-300 hover:text-slate-900 transition-all"><X className="w-8 h-8" /></button>
              <div className="w-16 h-16 bg-emerald-100 rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-emerald-200"><DollarSign className="w-8 h-8 text-emerald-600" /></div>
              <h2 className="text-3xl font-black text-slate-900 mb-2 leading-none uppercase italic tracking-tighter">Cobrar</h2>
              <p className="text-slate-400 font-bold mb-8 uppercase tracking-widest text-[10px]">Alumno: <span className="text-slate-800">{getAlumnoNombre(settlingAlumno.id)}</span></p>
              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 mb-8 text-center relative">
                 <span className="absolute top-4 left-4 text-[10px] font-black text-slate-300 uppercase tracking-widest">Saldo a ingresar</span>
                 <div className="text-5xl font-black text-slate-900 tracking-tighter flex items-center justify-center pt-4">
                    <span className="text-emerald-500 mr-2">$</span>
                    <input type="number" value={settleAmount} onChange={e => setSettleAmount(Number(e.target.value))} className="bg-transparent border-none outline-none w-32 font-black" autoFocus />
                 </div>
                 <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between items-center opacity-60">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Deuda Actual:</span>
                    <span className="text-xl font-black text-red-500">${settlingAlumno.balance}</span>
                 </div>
              </div>
              <button onClick={handleSettleDebt} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white h-20 rounded-[2.5rem] font-black text-2xl shadow-xl shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center uppercase tracking-tighter group italic">Confirmar Pago <CheckCircle className="ml-3 w-8 h-8 group-hover:scale-110 transition-transform" /></button>
           </div>
        </div>
      )}

      {/* Modal Alumno (Registros) */}
      {editingAlumno && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl relative border">
             <button onClick={() => setEditingAlumno(null)} className="absolute top-6 right-6 text-slate-300 hover:text-slate-800"><X /></button>
             <h2 className="text-2xl font-black mb-6 uppercase italic tracking-tighter">Ficha Alumno</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Nombre</label><input type="text" value={editingAlumno.nombre || ''} onChange={e => setEditingAlumno({...editingAlumno, nombre: e.target.value})} className="w-full bg-slate-50 p-4 rounded-xl font-bold border border-slate-100" /></div>
                <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Apellido</label><input type="text" value={editingAlumno.apellido || ''} onChange={e => setEditingAlumno({...editingAlumno, apellido: e.target.value})} className="w-full bg-slate-50 p-4 rounded-xl font-bold border border-slate-100" /></div>
                <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">DNI</label><input type="text" value={editingAlumno.dni || ''} onChange={e => setEditingAlumno({...editingAlumno, dni: e.target.value})} className="w-full bg-slate-50 p-4 rounded-xl font-bold border border-slate-100" /></div>
                <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Curso</label><input type="text" value={editingAlumno.curso || ''} onChange={e => setEditingAlumno({...editingAlumno, curso: e.target.value})} className="w-full bg-slate-50 p-4 rounded-xl font-bold border border-slate-100" /></div>
                <div className="col-span-1 md:col-span-2 space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">RFID</label><input type="text" value={editingAlumno.rfid || ''} onChange={e => setEditingAlumno({...editingAlumno, rfid: e.target.value})} className="w-full bg-slate-50 p-4 rounded-xl font-bold border border-slate-100 text-cafeteria-600" /></div>
             </div>
             <button onClick={handleSaveAlumno} className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase italic shadow-lg mt-8 active:scale-95 transition-all">Guardar</button>
          </div>
        </div>
      )}

      {/* Modal Producto (Carta) */}
      {editingProducto && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl relative border">
             <button onClick={() => setEditingProducto(null)} className="absolute top-6 right-6 text-slate-300 hover:text-slate-800 transition-all"><X /></button>
             <h2 className="text-2xl font-black mb-6 uppercase italic tracking-tighter">Producto</h2>
             <div className="space-y-4">
                <input type="text" value={editingProducto.nombre || ''} onChange={e => setEditingProducto({...editingProducto, nombre: e.target.value})} placeholder="Nombre" className="w-full bg-slate-50 p-4 rounded-xl font-bold border" />
                <input type="number" value={editingProducto.precio || ''} onChange={e => setEditingProducto({...editingProducto, precio: Number(e.target.value)})} placeholder="Precio" className="w-full bg-slate-100 p-4 rounded-xl font-black border border-slate-100 text-cafeteria-600 text-2xl" />
                <input type="text" value={editingProducto.categoria || ''} onChange={e => setEditingProducto({...editingProducto, categoria: e.target.value})} placeholder="Categoría" className="w-full bg-slate-50 p-4 rounded-xl font-bold border" />
                <div className="pt-4 border-t border-slate-100">
                   <label className="flex items-center font-black text-[10px] text-slate-700 uppercase tracking-widest">
                      <input type="checkbox" checked={editingProducto.soloHorario || false} onChange={e => setEditingProducto({...editingProducto, soloHorario: e.target.checked})} className="mr-3 w-5 h-5 rounded-lg accent-cafeteria-600" />
                      Limitar Horario
                   </label>
                   {editingProducto.soloHorario && (
                     <div className="grid grid-cols-2 gap-4 mt-4">
                        <input type="time" value={editingProducto.horaInicio || "07:00"} onChange={e => setEditingProducto({...editingProducto, horaInicio: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold" />
                        <input type="time" value={editingProducto.horaFin || "10:00"} onChange={e => setEditingProducto({...editingProducto, horaFin: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold" />
                     </div>
                   )}
                </div>
             </div>
             <button onClick={handleSaveProducto} className="w-full bg-cafeteria-600 text-white py-5 rounded-[2rem] font-black uppercase italic shadow-lg mt-8 active:scale-95 transition-all">Guardar</button>
          </div>
        </div>
      )}
    </div>
  );
};
