import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import PosPage from './pages/PosPage';
import LoginPage from './pages/LoginPage';
import OrdersPage from './pages/OrdersPage';
import StockPage from './pages/StockPage';
import InventoryPage from './pages/InventoryPage'; // New Inventory Page
import ReportsPage from './pages/ReportsPage';
import UsersPage from './pages/UserPage'; // Pastikan nama file adalah UsersPage.tsx (jamak)
import MembersPage from './pages/MembersPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rute Login */}
        <Route path="/login" element={<LoginPage />} />

        {/* Rute Utama dengan Layout */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<PosPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="stock" element={<StockPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="members" element={<MembersPage />} />
          <Route path="users" element={<UsersPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;