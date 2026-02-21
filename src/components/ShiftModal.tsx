import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth.tsx';
import { Clock, DollarSign, X, Lock, Unlock, TrendingUp, ShoppingBag } from 'lucide-react';

interface Shift {
    id: string;
    opener_email: string;
    opened_at: string;
    closed_at: string | null;
    opening_cash: number;
    closing_cash: number | null;
    total_sales: number;
    transaction_count: number;
    status: 'open' | 'closed';
    notes: string | null;
}

interface Props {
    onClose: () => void;
    onShiftChange: (shift: Shift | null) => void;
}

export default function ShiftModal({ onClose, onShiftChange }: Props) {
    const { user } = useAuth();
    const [activeShift, setActiveShift] = useState<Shift | null>(null);
    const [openingCash, setOpeningCash] = useState(0);
    const [closingCash, setClosingCash] = useState(0);
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [todaySales, setTodaySales] = useState(0);
    const [todayCount, setTodayCount] = useState(0);

    useEffect(() => {
        fetchActiveShift();
    }, []);

    const fetchActiveShift = async () => {
        setLoading(true);

        // Cek shift yang masih open
        const { data: shift } = await supabase
            .from('shifts')
            .select('*')
            .eq('status', 'open')
            .single();

        setActiveShift(shift || null);
        onShiftChange(shift || null);

        // Hitung pendapatan hari ini
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const { data: orders } = await supabase
            .from('orders')
            .select('total_amount')
            .gte('created_at', today.toISOString())
            .is('voided_at', null);

        if (orders) {
            setTodaySales(orders.reduce((s, o) => s + o.total_amount, 0));
            setTodayCount(orders.length);
        }

        setLoading(false);
    };

    const bukaShift = async () => {
        if (!user) return;
        setSaving(true);
        const { data, error } = await supabase
            .from('shifts')
            .insert({
                opened_by: user.id,
                opener_email: user.email,
                opening_cash: openingCash,
                status: 'open',
            })
            .select()
            .single();

        if (!error && data) {
            setActiveShift(data);
            onShiftChange(data);
        }
        setSaving(false);
    };

    const tutupShift = async () => {
        if (!activeShift) return;
        setSaving(true);
        const { data, error } = await supabase
            .from('shifts')
            .update({
                closed_at: new Date().toISOString(),
                closing_cash: closingCash,
                total_sales: todaySales,
                transaction_count: todayCount,
                status: 'closed',
                notes,
            })
            .eq('id', activeShift.id)
            .select()
            .single();

        if (!error && data) {
            setActiveShift(null);
            onShiftChange(null);
        }
        setSaving(false);
    };

    const durasi = activeShift ? (() => {
        const diff = Date.now() - new Date(activeShift.opened_at).getTime();
        const hours = Math.floor(diff / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);
        return `${hours}j ${mins}m`;
    })() : '-';

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
                <div className="bg-white rounded-2xl p-8 flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm font-medium text-gray-600">Memuat shift...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center p-0 md:p-4">
            <div className="bg-white w-full md:max-w-md md:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden">
                {/* Handle mobile */}
                <div className="md:hidden flex justify-center pt-3 pb-1">
                    <div className="w-10 h-1 bg-gray-200 rounded-full" />
                </div>

                {/* Header */}
                <div className={`px-5 py-4 flex items-center justify-between ${activeShift ? 'bg-green-600' : 'bg-slate-900'}`}>
                    <div className="flex items-center gap-2 text-white">
                        {activeShift ? <Unlock size={18} /> : <Lock size={18} />}
                        <h2 className="font-bold text-base">
                            {activeShift ? 'Shift Sedang Berjalan' : 'Buka Shift Kasir'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-1.5 text-white/70 hover:text-white rounded-lg">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    {/* Status shift aktif */}
                    {activeShift && (
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-green-50 border border-green-100 rounded-xl p-3">
                                <p className="text-xs text-green-600 font-medium">Kasir</p>
                                <p className="font-bold text-sm text-green-900 mt-0.5 truncate">{activeShift.opener_email?.split('@')[0]}</p>
                            </div>
                            <div className="bg-green-50 border border-green-100 rounded-xl p-3">
                                <p className="text-xs text-green-600 font-medium">Durasi</p>
                                <p className="font-bold text-sm text-green-900 mt-0.5 flex items-center gap-1">
                                    <Clock size={12} /> {durasi}
                                </p>
                            </div>
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                                <p className="text-xs text-blue-600 font-medium flex items-center gap-1"><ShoppingBag size={11} /> Transaksi</p>
                                <p className="font-bold text-xl text-blue-900 mt-0.5">{todayCount}</p>
                            </div>
                            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                                <p className="text-xs text-amber-600 font-medium flex items-center gap-1"><TrendingUp size={11} /> Pendapatan</p>
                                <p className="font-bold text-sm text-amber-900 mt-0.5">Rp {todaySales.toLocaleString('id-ID')}</p>
                            </div>
                        </div>
                    )}

                    {/* Form buka shift */}
                    {!activeShift && (
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5">Modal Kas Awal (Rp)</label>
                                <div className="relative">
                                    <DollarSign size={15} className="absolute left-3 top-2.5 text-gray-400" />
                                    <input
                                        type="number"
                                        className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        placeholder="0"
                                        value={openingCash || ''}
                                        onChange={e => setOpeningCash(Number(e.target.value))}
                                    />
                                </div>
                            </div>
                            <button
                                onClick={bukaShift}
                                disabled={saving}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <Unlock size={16} />
                                {saving ? 'Membuka Shift...' : 'Buka Shift Kasir'}
                            </button>
                        </div>
                    )}

                    {/* Form tutup shift */}
                    {activeShift && (
                        <div className="space-y-3 border-t pt-4">
                            <h3 className="text-sm font-bold text-gray-700">Tutup Shift</h3>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1.5">Uang Kas Akhir (Rp)</label>
                                <div className="relative">
                                    <DollarSign size={15} className="absolute left-3 top-2.5 text-gray-400" />
                                    <input
                                        type="number"
                                        className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        placeholder="0"
                                        value={closingCash || ''}
                                        onChange={e => setClosingCash(Number(e.target.value))}
                                    />
                                </div>
                            </div>
                            {closingCash > 0 && (
                                <div className={`flex justify-between text-sm px-3 py-2 rounded-lg ${closingCash >= activeShift.opening_cash ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                    <span className="font-medium">Selisih Kas</span>
                                    <span className="font-bold">
                                        {closingCash >= activeShift.opening_cash ? '+' : ''}Rp {(closingCash - activeShift.opening_cash).toLocaleString('id-ID')}
                                    </span>
                                </div>
                            )}
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1.5">Catatan (opsional)</label>
                                <textarea
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    rows={2}
                                    placeholder="Catatan tutup shift..."
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={tutupShift}
                                disabled={saving}
                                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <Lock size={16} />
                                {saving ? 'Menutup Shift...' : 'Tutup Shift & Rekap'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
