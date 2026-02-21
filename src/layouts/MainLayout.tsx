import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Coffee, ShoppingCart, History,
  Users, UserCheck, LogOut, Package, X
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth.tsx';

export default function MainLayout() {
  const { role, user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  // Label & badge warna untuk role
  const roleBadge: Record<string, { label: string; cls: string }> = {
    owner: { label: 'Owner', cls: 'bg-amber-500 text-white' },
    headbar: { label: 'Head Bar', cls: 'bg-blue-500 text-white' },
    barista: { label: 'Barista', cls: 'bg-green-500 text-white' },
  };
  const badge = role ? roleBadge[role] : null;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-16 lg:w-64 bg-slate-900 text-white flex flex-col transition-all duration-300 shrink-0">

        {/* Header Sidebar: Logo + Brand */}
        <div className="h-20 flex items-center gap-3 px-3 border-b border-slate-800 py-4">
          <img
            src="/logo.png"
            alt="Logo"
            className="h-10 w-auto object-contain flex-shrink-0"
          />
          <div className="hidden lg:flex flex-col">
            <h1 className="font-bold text-sm leading-tight text-white uppercase tracking-tight">
              Lamoenan Cafe
            </h1>
            <p className="text-[10px] text-amber-500 font-bold uppercase tracking-[0.2em]">
              & Bistro
            </p>
          </div>
        </div>

        {/* Navigasi */}
        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">

          {/* Menu POS & Members: Bisa diakses SEMUA Staff */}
          <NavItem to="/" icon={<ShoppingCart size={18} />} label="POS" exact />
          <NavItem to="/members" icon={<UserCheck size={18} />} label="Members" />

          {/* Orders & Reports: Semua role */}
          {(role === 'owner' || role === 'headbar' || role === 'barista') && (
            <>
              <NavItem to="/orders" icon={<History size={18} />} label="Orders" />
              <NavItem to="/reports" icon={<LayoutDashboard size={18} />} label="Laporan" />
            </>
          )}

          {/* Stock & Inventory: Owner & Headbar */}
          {(role === 'owner' || role === 'headbar') && (
            <>
              <div className="px-3 pt-3 pb-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden lg:block">Manajemen</p>
              </div>
              <NavItem to="/stock" icon={<Coffee size={18} />} label="Prediksi Stok" />
              <NavItem to="/inventory" icon={<Package size={18} />} label="Bahan Baku" />
            </>
          )}

          {/* Staff Management: Owner Only */}
          {role === 'owner' && (
            <NavItem to="/users" icon={<Users size={18} />} label="Staff" />
          )}
        </nav>

        {/* Footer Sidebar: Info User & Logout */}
        <div className="border-t border-slate-800 p-3">
          <div className="flex items-center gap-2 mb-2 px-1">
            <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
              {user?.email?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="hidden lg:block min-w-0">
              <p className="text-xs text-white font-medium truncate">{user?.email ?? '-'}</p>
              {badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${badge.cls}`}>
                  {badge.label}
                </span>
              )}
            </div>
          </div>
          <button
            id="btn-logout"
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center gap-2 p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors text-sm"
          >
            <LogOut size={16} className="shrink-0" />
            <span className="hidden lg:block">Keluar</span>
          </button>
        </div>
      </aside>

      {/* Konten Utama */}
      <main className="flex-1 overflow-auto bg-gray-100">
        <Outlet />
      </main>

      {/* Modal Konfirmasi Logout */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Keluar dari Aplikasi</h3>
              <button
                id="btn-close-logout-modal"
                onClick={() => setShowLogoutModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-6">Yakin ingin keluar? Anda perlu login kembali untuk mengakses aplikasi.</p>
            <div className="flex gap-3">
              <button
                id="btn-cancel-logout"
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                id="btn-confirm-logout"
                onClick={handleLogout}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-bold hover:bg-red-600 transition-colors"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper komponen NavItem dengan highlight aktif
function NavItem({
  to, icon, label, exact = false
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  exact?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={exact}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-150 text-sm ${isActive
          ? 'bg-amber-600 text-white shadow-sm'
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }`
      }
    >
      <div className="shrink-0">{icon}</div>
      <span className="hidden lg:block font-medium truncate">{label}</span>
    </NavLink>
  );
}