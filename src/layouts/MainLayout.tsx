import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Coffee, ShoppingCart, History, Users, UserCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.tsx';

export default function MainLayout() {
  const { role } = useAuth();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-20 lg:w-72 bg-slate-900 text-white flex flex-col transition-all duration-300">

        {/* Header Sidebar: Logo + Brand */}
        <div className="h-24 flex items-center gap-3 px-4 border-b border-slate-800 py-4">
          <img
            src="/logo.png"
            alt="Logo"
            className="h-12 w-auto object-contain flex-shrink-0"
          />
          <div className="hidden lg:flex flex-col">
            <h1 className="font-bold text-base leading-tight text-white uppercase tracking-tight">
              Lamoenan Cafe
            </h1>
            <p className="text-[10px] text-amber-500 font-bold uppercase tracking-[0.2em]">
              & Bistro
            </p>
          </div>
        </div>

        <nav className="flex-1 py-6 space-y-2 px-2 overflow-y-auto">
          {/* Menu POS & Members: Bisa diakses SEMUA Staff */}
          <NavItem to="/" icon={<ShoppingCart size={20} />} label="POS" />
          <NavItem to="/members" icon={<UserCheck size={20} />} label="Members" />

          {/* Menu Orders & Reports: Sekarang bisa diakses Barista, Headbar, dan Owner */}
          {(role === 'owner' || role === 'headbar' || role === 'barista') && (
            <>
              <NavItem to="/orders" icon={<History size={20} />} label="Orders" />
              <NavItem to="/reports" icon={<LayoutDashboard size={20} />} label="Reports" />
            </>
          )}

          {/* Menu Stock: Khusus Headbar & Owner (Manajemen Stok) */}
          {(role === 'owner' || role === 'headbar') && (
            <>
              <NavItem to="/stock" icon={<Coffee size={20} />} label="Stock Menu" />
              <NavItem to="/inventory" icon={<LayoutDashboard size={20} />} label="Bahan Baku" />
            </>
          )}

          {/* Menu Staff: Khusus Owner (Manajemen User/Role) */}
          {role === 'owner' && (
            <NavItem to="/users" icon={<Users size={20} />} label="Staff" />
          )}
        </nav>
      </aside>

      <main className="flex-1 overflow-auto bg-gray-100">
        <Outlet />
      </main>
    </div>
  );
}

function NavItem({ to, icon, label }: { to: string, icon: React.ReactNode, label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 p-3 rounded-lg transition-colors duration-200 ${isActive
          ? 'bg-indigo-600 text-white shadow-md'
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }`
      }
    >
      <div className="flex-shrink-0">{icon}</div>
      <span className="hidden lg:block font-medium truncate">{label}</span>
    </NavLink>
  );
}