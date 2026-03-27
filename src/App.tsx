import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// We will create these shortly
import { KioskHome } from './features/kiosk/KioskHome';
import { KioskMenu } from './features/kiosk/KioskMenu';
import { KitchenPanel } from './features/kitchen/KitchenPanel';
import { CheckoutPanel } from './features/checkout/CheckoutPanel';
import { AdminDashboard } from './features/admin/AdminDashboard';
import { AuthGuard } from './components/AuthGuard';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-cafeteria-100 selection:text-cafeteria-700">
        <Routes>
          {/* Public / Student Kiosk Routes */}
          <Route path="/" element={<KioskMenu />} />
          <Route path="/identificar" element={<KioskHome />} />
          
          {/* Internal / Staff Routes */}
          <Route path="/kitchen" element={<AuthGuard><KitchenPanel /></AuthGuard>} />
          <Route path="/checkout" element={<AuthGuard><CheckoutPanel /></AuthGuard>} />
          <Route path="/cocina" element={<AuthGuard><KitchenPanel /></AuthGuard>} />
          <Route path="/admin" element={<AuthGuard><AdminDashboard /></AuthGuard>} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
