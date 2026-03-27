import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRfidReader } from '../../hooks/useRfidReader';
import { getAlumnoByRfid } from '../../firebase/alumnos';
import { useAppStore } from '../../store/useAppStore';
import { Scan, AlertCircle, Loader2 } from 'lucide-react';

export const KioskHome: React.FC = () => {
  const navigate = useNavigate();
  const setCurrentAlumno = useAppStore(state => state.setCurrentAlumno);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useRfidReader(async (rfid) => {
    if (loading) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const alumno = await getAlumnoByRfid(rfid);
      if (alumno) {
        setCurrentAlumno(alumno);
        // Play success sound here if needed
        navigate('/menu');
      } else {
        setError('Tarjeta no reconocida o alumno inactivo.');
        setTimeout(() => setError(null), 3000);
      }
    } catch (err) {
      console.error(err);
      setError('Error al conectar con la base de datos.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  });

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white select-none">
      <div className="absolute top-8 left-8 text-2xl font-bold text-cafeteria-500 tracking-wider">
        COMEDOR
      </div>
      
      <div className="bg-slate-800 p-12 rounded-3xl shadow-2xl flex flex-col items-center max-w-lg w-full text-center border border-slate-700 transition-all duration-300">
        <div className="bg-cafeteria-500/20 p-6 rounded-full mb-8 relative">
          <Scan className="w-24 h-24 text-cafeteria-500 animate-pulse" />
          <div className="absolute inset-0 rounded-full border-4 border-cafeteria-500/30 animate-ping"></div>
        </div>
        
        <h1 className="text-4xl font-extrabold mb-4 tracking-tight">
          ¡Hola!
        </h1>
        <p className="text-slate-400 text-xl mb-8 leading-relaxed">
          Apoyá tu tarjeta en el lector para realizar tu pedido anticipado.
        </p>

        <div className="h-16 flex items-center justify-center w-full">
          {loading && (
            <div className="flex items-center text-cafeteria-500">
              <Loader2 className="w-8 h-8 animate-spin mr-3" />
              <span className="text-xl font-medium">Cargando perfil...</span>
            </div>
          )}

          {error && (
            <div className="flex items-center text-red-400 bg-red-400/10 px-6 py-4 rounded-xl border border-red-400/20 animate-in fade-in slide-in-from-bottom-4">
              <AlertCircle className="w-6 h-6 mr-3" />
              <span className="text-lg font-medium">{error}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
