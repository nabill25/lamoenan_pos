/**
 * RoleGuard.tsx
 * Guard yang memblokir akses URL langsung ke halaman
 * yang tidak diizinkan untuk role tertentu.
 *
 * Contoh: Barista yang tahu URL /users tidak bisa akses
 * meski men-type langsung di address bar.
 *
 * Props:
 *  - allowedRoles: array role yang boleh mengakses
 *  - redirectTo?: URL tujuan jika tidak punya akses (default: "/")
 */
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface RoleGuardProps {
    allowedRoles: ('owner' | 'headbar' | 'barista')[];
    redirectTo?: string;
}

export default function RoleGuard({ allowedRoles, redirectTo = '/' }: RoleGuardProps) {
    const { role, loading } = useAuth();

    // Tunggu sampai role selesai di-load dari database
    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // Jika role tidak ada dalam daftar yang diizinkan → redirect
    if (!role || !allowedRoles.includes(role)) {
        return <Navigate to={redirectTo} replace />;
    }

    return <Outlet />;
}
