import { useState } from 'react';
import { Lock } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const [password, setPassword] = useState('');
  const [isAuth, setIsAuth] = useState(false);
  const [error, setError] = useState(false);

  const adminPass = import.meta.env.VITE_ADMIN_PASSWORD;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === adminPass) {
      setIsAuth(true);
      setError(false);
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  if (isAuth) return <>{children}</>;

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="bg-slate-800 p-8 rounded-[2.5rem] shadow-2xl border border-slate-700 w-full max-w-md text-center">
        <div className="bg-cafeteria-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock className="w-10 h-10 text-cafeteria-500" />
        </div>
        <h1 className="text-3xl font-extrabold text-white mb-2">Acceso Restringido</h1>
        <p className="text-slate-400 mb-8">Ingrese la contraseña de administración para continuar.</p>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            autoFocus
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            className={`w-full bg-slate-700 border-2 ${error ? 'border-red-500' : 'border-slate-600'} rounded-2xl p-4 text-white text-center text-xl focus:border-cafeteria-500 outline-none transition-all`}
          />
          {error && <p className="text-red-400 font-bold animate-shake">Contraseña incorrecta</p>}
          <button
            type="submit"
            className="w-full bg-cafeteria-600 hover:bg-cafeteria-700 text-white font-bold py-4 rounded-2xl text-lg shadow-lg shadow-cafeteria-600/20 transition-all active:scale-95"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
};
