import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ChefHat, Clock, CheckCircle2, Utensils, Bell } from 'lucide-react';

interface KitchenOrder {
    id: string;
    created_at: string;
    kitchen_status: 'pending' | 'cooking' | 'ready' | 'served';
    table_name?: string;
    payment_type: string;
    order_items: {
        id: string;
        name: string;
        quantity: number;
        notes?: string;
    }[];
}

const STATUS_CONFIG = {
    pending: { label: 'Antri', color: 'bg-amber-400', text: 'text-amber-800', bg: 'bg-amber-50 border-amber-200', icon: <Clock size={14} />, next: 'cooking', nextLabel: '🍳 Mulai Masak' },
    cooking: { label: 'Dimasak', color: 'bg-blue-500', text: 'text-blue-800', bg: 'bg-blue-50 border-blue-200', icon: <ChefHat size={14} />, next: 'ready', nextLabel: '🔔 Siap Antar' },
    ready: { label: 'Siap', color: 'bg-green-500', text: 'text-green-800', bg: 'bg-green-50 border-green-200', icon: <Bell size={14} />, next: 'served', nextLabel: '✅ Sudah Diantar' },
    served: { label: 'Selesai', color: 'bg-gray-400', text: 'text-gray-600', bg: 'bg-gray-50 border-gray-200', icon: <CheckCircle2 size={14} />, next: null, nextLabel: null },
};

export default function KitchenPage() {
    const [orders, setOrders] = useState<KitchenOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<'pending' | 'cooking' | 'ready' | 'all'>('pending');

    useEffect(() => {
        fetchOrders();

        // Supabase Realtime subscription
        const channel = supabase
            .channel('kitchen-orders')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
                fetchOrders();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    const fetchOrders = async () => {
        const { data } = await supabase
            .from('orders')
            .select(`
        id, created_at, kitchen_status, table_name, payment_type,
        order_items(id, name, quantity)
      `)
            .not('voided_at', 'is', null) // exclude voided
            .neq('kitchen_status', 'served')
            .order('created_at', { ascending: true });

        setOrders((data as any) || []);
        setLoading(false);
    };

    const updateStatus = async (orderId: string, newStatus: string) => {
        await supabase.from('orders').update({ kitchen_status: newStatus }).eq('id', orderId);
        // Realtime akan otomatis refresh, tapi kita juga update lokal
        setOrders(prev => prev.map(o =>
            o.id === orderId ? { ...o, kitchen_status: newStatus as any } : o
        ).filter(o => o.kitchen_status !== 'served'));
    };

    const displayed = filterStatus === 'all'
        ? orders
        : orders.filter(o => o.kitchen_status === filterStatus);

    const pendingCount = orders.filter(o => o.kitchen_status === 'pending').length;
    const cookingCount = orders.filter(o => o.kitchen_status === 'cooking').length;
    const readyCount = orders.filter(o => o.kitchen_status === 'ready').length;

    return (
        <div className="p-4 min-h-screen bg-gray-900 text-white">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
                        <ChefHat size={22} />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold">Kitchen Display</h1>
                        <p className="text-gray-400 text-xs">Order masuk secara realtime</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-gray-400">Live</span>
                </div>
            </div>

            {/* Stats bar */}
            <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="bg-amber-500/20 border border-amber-500/30 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-amber-400">{pendingCount}</p>
                    <p className="text-xs text-amber-300">Antri</p>
                </div>
                <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-blue-400">{cookingCount}</p>
                    <p className="text-xs text-blue-300">Dimasak</p>
                </div>
                <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-green-400">{readyCount}</p>
                    <p className="text-xs text-green-300">Siap Antar</p>
                </div>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 mb-4 overflow-x-auto">
                {([
                    { key: 'pending', label: '⏳ Antri' },
                    { key: 'cooking', label: '🍳 Dimasak' },
                    { key: 'ready', label: '🔔 Siap' },
                    { key: 'all', label: 'Semua' },
                ] as const).map(tab => (
                    <button key={tab.key} onClick={() => setFilterStatus(tab.key)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${filterStatus === tab.key ? 'bg-amber-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Order cards */}
            {loading ? (
                <div className="text-center py-20 text-gray-500">
                    <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    Memuat order...
                </div>
            ) : displayed.length === 0 ? (
                <div className="text-center py-20 text-gray-500">
                    <Utensils size={48} className="mx-auto mb-3 opacity-30" />
                    <p className="font-medium">Tidak ada order aktif</p>
                    <p className="text-xs mt-1 text-gray-600">Order baru akan muncul otomatis di sini</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {displayed.map(order => {
                        const cfg = STATUS_CONFIG[order.kitchen_status];
                        const menit = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000);
                        return (
                            <div key={order.id} className={`border rounded-2xl overflow-hidden ${cfg.bg}`}>
                                {/* Card header */}
                                <div className="px-4 py-3 flex items-center justify-between border-b border-current/10">
                                    <div>
                                        <p className="font-bold text-gray-900 text-sm">#{order.id.slice(0, 6).toUpperCase()}</p>
                                        <p className="text-xs text-gray-500">{order.table_name || 'Take Away'}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${cfg.text} ${cfg.color} bg-opacity-20`}>
                                            {cfg.icon} {cfg.label}
                                        </span>
                                        <p className={`text-xs mt-1 ${menit > 15 ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                                            ⏱ {menit}m lalu
                                        </p>
                                    </div>
                                </div>

                                {/* Items list */}
                                <div className="px-4 py-3 space-y-1.5">
                                    {order.order_items?.map(item => (
                                        <div key={item.id} className="flex justify-between items-center text-sm">
                                            <span className="text-gray-800 font-medium">{item.name}</span>
                                            <span className="font-bold text-gray-900 bg-white px-2 py-0.5 rounded-lg shadow-sm">×{item.quantity}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Action button */}
                                {cfg.next && (
                                    <div className="px-4 pb-4">
                                        <button
                                            onClick={() => updateStatus(order.id, cfg.next!)}
                                            className="w-full py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors"
                                        >
                                            {cfg.nextLabel}
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
