/**
 * ProtectedRoute.tsx
 * Guard yang memastikan user sudah login dan role sudah dimuat
 * sebelum bisa mengakses halaman apapun di dalam aplikasi.
 *
 * Alur:
 *  1. Jika masih loading (cek session/role) → tampilkan spinner
 *  2. Jika belum login (session === null) → redirect ke /login
 *  3. Jika sudah login → render children
 */
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function ProtectedRoute() {
    const { session, loading } = useAuth();

    // Tampilkan loading spinner selama auth state diselesaikan
    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-sm text-gray-500 font-medium">Memuat sesi...</p>
                </div>
            </div>
        );
    }

    // Jika tidak ada session, paksa ke halaman login
    if (!session) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}
