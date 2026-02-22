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
import MenuPage from './pages/MenuPage';
import TablesPage from './pages/TablesPage';
import KitchenPage from './pages/KitchenPage';
import ReservationsPage from './pages/ReservationsPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>

              {/* Semua role */}
              <Route index element={<PosPage />} />
              <Route path="members" element={<MembersPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="tables" element={<TablesPage />} />
              <Route path="kitchen" element={<KitchenPage />} />
              <Route path="reservations" element={<ReservationsPage />} />

              {/* Owner & Headbar */}
              <Route element={<RoleGuard allowedRoles={['owner', 'headbar']} />}>
                <Route path="menu" element={<MenuPage />} />
                <Route path="stock" element={<StockPage />} />
                <Route path="inventory" element={<InventoryPage />} />
              </Route>

              {/* Owner only */}
              <Route element={<RoleGuard allowedRoles={['owner']} />}>
                <Route path="users" element={<UsersPage />} />
              </Route>

            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;