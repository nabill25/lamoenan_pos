import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import RoleGuard from './components/RoleGuard';
import MainLayout from './layouts/MainLayout';

import LoginPage from './pages/LoginPage';
import PosPage from './pages/PosPage';
import OrdersPage from './pages/OrdersPage';
import StockPage from './pages/StockPage';
import InventoryPage from './pages/InventoryPage';
import ReportsPage from './pages/ReportsPage';
import UsersPage from './pages/UserPage';
import MembersPage from './pages/MembersPage';

/**
 * Struktur Routing & Auth:
 *
 *  /login               → Publik (tanpa login)
 *
 *  /                    → ProtectedRoute (harus login)
 *    /                  → PosPage         (semua role)
 *    /members           → MembersPage     (semua role)
 *    /orders            → OrdersPage      (semua role)
 *    /reports           → ReportsPage     (semua role)
 *    /stock             → StockPage       [owner, headbar]
 *    /inventory         → InventoryPage   [owner, headbar]
 *    /users             → UsersPage       [owner only]
 */
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Halaman Login — Publik */}
          <Route path="/login" element={<LoginPage />} />

          {/* Semua route di bawah ini harus login */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>

              {/* Halaman yang bisa diakses SEMUA role */}
              <Route index element={<PosPage />} />
              <Route path="members" element={<MembersPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="reports" element={<ReportsPage />} />

              {/* Halaman khusus Owner & Headbar */}
              <Route element={<RoleGuard allowedRoles={['owner', 'headbar']} />}>
                <Route path="stock" element={<StockPage />} />
                <Route path="inventory" element={<InventoryPage />} />
              </Route>

              {/* Halaman khusus Owner saja */}
              <Route element={<RoleGuard allowedRoles={['owner']} />}>
                <Route path="users" element={<UsersPage />} />
              </Route>

            </Route>
          </Route>

          {/* Catch-all: redirect ke home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;