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

  const roleBadge: Record<string, { label: string; cls: string }> = {
    owner: { label: 'Owner', cls: 'bg-amber-500 text-white' },
    headbar: { label: 'Head Bar', cls: 'bg-blue-500 text-white' },
    barista: { label: 'Barista', cls: 'bg-green-500 text-white' },
  };
  const badge = role ? roleBadge[role] : null;

  // Item navigasi utama (untuk sidebar desktop & bottom nav mobile)
  const navItems = [
    { to: '/', icon: <ShoppingCart size={20} />, label: 'POS', exact: true, roles: ['owner', 'headbar', 'barista'] },
    { to: '/members', icon: <UserCheck size={20} />, label: 'Members', roles: ['owner', 'headbar', 'barista'] },
    { to: '/orders', icon: <History size={20} />, label: 'Orders', roles: ['owner', 'headbar', 'barista'] },
    { to: '/reports', icon: <LayoutDashboard size={20} />, label: 'Laporan', roles: ['owner', 'headbar', 'barista'] },
    { to: '/stock', icon: <Coffee size={20} />, label: 'Stok', roles: ['owner', 'headbar'] },
    { to: '/inventory', icon: <Package size={20} />, label: 'Bahan', roles: ['owner', 'headbar'] },
    { to: '/users', icon: <Users size={20} />, label: 'Staff', roles: ['owner'] },
  ];

  const visibleNav = navItems.filter(item =>
    role && (item.roles as string[]).includes(role)
  );

  // Bottom nav hanya tampilkan maksimal 5 item pertama
  const bottomNavItems = visibleNav.slice(0, 5);

  return (
    <div className="flex h-[100dvh] bg-gray-50">

      {/* ===== SIDEBAR — hanya desktop (md ke atas) ===== */}
      <aside className="hidden md:flex md:w-64 bg-slate-900 text-white flex-col shrink-0">
        {/* Header */}
        <div className="h-20 flex items-center gap-3 px-4 border-b border-slate-800">
          <img src="/logo.png" alt="Logo" className="h-10 w-auto object-contain shrink-0" />
          <div className="flex flex-col">
            <h1 className="font-bold text-sm leading-tight text-white uppercase tracking-tight">Lamoenan Cafe</h1>
            <p className="text-[10px] text-amber-500 font-bold uppercase tracking-[0.2em]">& Bistro</p>
          </div>
        </div>

        {/* Navigasi */}
        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          {visibleNav.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm ${isActive
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <div className="shrink-0">{item.icon}</div>
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer: info user + logout */}
        <div className="border-t border-slate-800 p-3">
          <div className="flex items-center gap-2 mb-2 px-1">
            <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
              {user?.email?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-white font-medium truncate">{user?.email ?? '-'}</p>
              {badge && <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${badge.cls}`}>{badge.label}</span>}
            </div>
          </div>
          <button
            id="btn-logout"
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center gap-2 p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors text-sm"
          >
            <LogOut size={16} className="shrink-0" />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* ===== KONTEN UTAMA ===== */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header mobile — logo + nama app + tombol logout */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Logo" className="h-8 w-auto object-contain" />
            <div>
              <div className="font-bold text-sm leading-tight uppercase">Lamoenan Cafe</div>
              {badge && <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${badge.cls}`}>{badge.label}</span>}
            </div>
          </div>
          <button onClick={() => setShowLogoutModal(true)} className="p-2 text-slate-400 hover:text-red-400 transition-colors">
            <LogOut size={18} />
          </button>
        </header>

        {/* Halaman konten */}
        <main className="flex-1 overflow-auto pb-16 md:pb-0">
          <Outlet />
        </main>
      </div>

      {/* ===== BOTTOM NAVIGATION — hanya mobile ===== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-slate-900 border-t border-slate-800 flex">
        {bottomNavItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[10px] font-medium transition-colors ${isActive ? 'text-amber-400' : 'text-slate-500'}`
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* ===== MODAL LOGOUT ===== */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Keluar dari Aplikasi</h3>
              <button id="btn-close-logout-modal" onClick={() => setShowLogoutModal(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded">
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-6">Yakin ingin keluar? Anda perlu login kembali untuk mengakses aplikasi.</p>
            <div className="flex gap-3">
              <button id="btn-cancel-logout" onClick={() => setShowLogoutModal(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">Batal</button>
              <button id="btn-confirm-logout" onClick={handleLogout} className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-bold hover:bg-red-600">Ya, Keluar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}