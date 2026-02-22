import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { CalendarPlus, Users, Phone, X, Check, XCircle, Clock, Trash2 } from 'lucide-react';

interface Reservation {
    id: string;
    customer_name: string;
    customer_phone?: string;
    table_id?: string;
    table_name?: string;
    pax: number;
    scheduled_at: string;
    notes?: string;
    status: 'confirmed' | 'arrived' | 'cancelled' | 'no_show';
    created_at: string;
}

interface Table { id: string; name: string; capacity: number; }

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    confirmed: { label: 'Terkonfirmasi', color: 'bg-blue-100 text-blue-700', icon: <Clock size={12} /> },
    arrived: { label: 'Sudah Datang', color: 'bg-green-100 text-green-700', icon: <Check size={12} /> },
    cancelled: { label: 'Dibatalkan', color: 'bg-red-100 text-red-600', icon: <XCircle size={12} /> },
    no_show: { label: 'Tidak Datang', color: 'bg-gray-100 text-gray-500', icon: <XCircle size={12} /> },
};

export default function ReservationsPage() {
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [tables, setTables] = useState<Table[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [filterDate, setFilterDate] = useState(new Date().toISOString().slice(0, 10));

    // Form state
    const [form, setForm] = useState({
        customer_name: '',
        customer_phone: '',
        table_id: '',
        pax: 2,
        scheduled_at: new Date().toISOString().slice(0, 16),
        notes: '',
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, [filterDate]);

    const fetchData = async () => {
        setLoading(true);
        const startOfDay = `${filterDate}T00:00:00`;
        const endOfDay = `${filterDate}T23:59:59`;

        const [{ data: res }, { data: tbl }] = await Promise.all([
            supabase.from('reservations').select('*').gte('scheduled_at', startOfDay).lte('scheduled_at', endOfDay).order('scheduled_at'),
            supabase.from('tables').select('id, name, capacity').order('name'),
        ]);
        setReservations(res || []);
        setTables(tbl || []);
        setLoading(false);
    };

    const handleSave = async () => {
        if (!form.customer_name.trim() || !form.scheduled_at) return;
        setSaving(true);
        const selectedTable = tables.find(t => t.id === form.table_id);
        const { error } = await supabase.from('reservations').insert({
            customer_name: form.customer_name.trim(),
            customer_phone: form.customer_phone || null,
            table_id: form.table_id || null,
            table_name: selectedTable?.name || null,
            pax: form.pax,
            scheduled_at: form.scheduled_at,
            notes: form.notes || null,
            status: 'confirmed',
        });

        if (error) alert('Gagal menyimpan: ' + error.message);
        else {
            setShowModal(false);
            setForm({ customer_name: '', customer_phone: '', table_id: '', pax: 2, scheduled_at: new Date().toISOString().slice(0, 16), notes: '' });
            fetchData();
        }
        setSaving(false);
    };

    const updateStatus = async (id: string, status: string) => {
        await supabase.from('reservations').update({ status }).eq('id', id);
        fetchData();
    };

    const deleteReservation = async (id: string) => {
        if (!confirm('Hapus reservasi ini?')) return;
        await supabase.from('reservations').delete().eq('id', id);
        fetchData();
    };

    const counts = {
        confirmed: reservations.filter(r => r.status === 'confirmed').length,
        arrived: reservations.filter(r => r.status === 'arrived').length,
        total: reservations.length,
    };

    return (
        <div className="p-4">
            {/* HEADER */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Reservasi Meja</h1>
                    <p className="text-gray-500 text-sm">Kelola status reservasi dan kehadiran tamu.</p>
                </div>
                <button onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors">
                    <CalendarPlus size={16} /> Buat Reservasi
                </button>
            </div>

            {/* DATE PICKER */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 mb-4 flex items-center gap-3">
                <label className="text-xs font-bold text-gray-500 uppercase">Tanggal</label>
                <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
                    className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500" />
                <div className="flex gap-2 text-xs">
                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-lg font-bold">{counts.confirmed} Menanti</span>
                    <span className="bg-green-50 text-green-700 px-2 py-1 rounded-lg font-bold">{counts.arrived} Hadir</span>
                </div>
            </div>

            {/* LIST */}
            <div className="space-y-3">
                {loading ? (
                    <div className="text-center py-16 text-gray-400">
                        <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        Memuat...
                    </div>
                ) : reservations.length === 0 ? (
                    <div className="text-center py-16 text-gray-400 bg-white rounded-xl border border-gray-100">
                        <CalendarPlus size={40} className="mx-auto mb-2 opacity-30" />
                        <p className="text-sm font-medium">Tidak ada reservasi hari ini</p>
                        <p className="text-xs mt-1">Klik "Buat Reservasi" untuk menambah</p>
                    </div>
                ) : (
                    reservations.map(res => {
                        const cfg = STATUS_CONFIG[res.status];
                        const time = new Date(res.scheduled_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                        return (
                            <div key={res.id} className={`bg-white rounded-xl border shadow-sm p-4 ${res.status === 'cancelled' || res.status === 'no_show' ? 'opacity-60' : ''}`}>
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-gray-900">{res.customer_name}</span>
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.color}`}>
                                                {cfg.icon} {cfg.label}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                                            <span className="flex items-center gap-1">🕐 {time}</span>
                                            <span className="flex items-center gap-1"><Users size={11} /> {res.pax} tamu</span>
                                            {res.table_name && <span>🪑 {res.table_name}</span>}
                                            {res.customer_phone && <span className="flex items-center gap-1"><Phone size={11} /> {res.customer_phone}</span>}
                                        </div>
                                        {res.notes && <p className="text-xs text-gray-400 mt-1 italic">{res.notes}</p>}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-1.5 flex-col items-end">
                                        {res.status === 'confirmed' && (
                                            <>
                                                <button onClick={() => updateStatus(res.id, 'arrived')}
                                                    className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-green-700 flex items-center gap-1">
                                                    <Check size={12} /> Hadir
                                                </button>
                                                <button onClick={() => updateStatus(res.id, 'no_show')}
                                                    className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg font-bold hover:bg-gray-200 flex items-center gap-1">
                                                    <XCircle size={12} /> No Show
                                                </button>
                                            </>
                                        )}
                                        <button onClick={() => deleteReservation(res.id)}
                                            className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* CREATE MODAL */}
            {showModal && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center p-0 md:p-4">
                    <div className="bg-white w-full md:max-w-md md:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden">
                        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
                            <h3 className="font-bold flex items-center gap-2"><CalendarPlus size={18} /> Buat Reservasi</h3>
                            <button onClick={() => setShowModal(false)}><X size={18} /></button>
                        </div>
                        <div className="p-5 space-y-3 overflow-y-auto max-h-[80vh]">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Nama Tamu *</label>
                                <input value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))}
                                    placeholder="Nama tamu / pemesan"
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">No. HP</label>
                                <input value={form.customer_phone} onChange={e => setForm(f => ({ ...f, customer_phone: e.target.value }))}
                                    placeholder="08xxxxxxxxxx"
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Waktu Tiba *</label>
                                    <input type="datetime-local" value={form.scheduled_at} onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))}
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Jumlah Tamu</label>
                                    <input type="number" min={1} max={30} value={form.pax} onChange={e => setForm(f => ({ ...f, pax: Number(e.target.value) }))}
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Meja (Opsional)</label>
                                <select value={form.table_id} onChange={e => setForm(f => ({ ...f, table_id: e.target.value }))}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
                                    <option value="">-- Pilih Meja --</option>
                                    {tables.map(t => <option key={t.id} value={t.id}>{t.name} (Kapasitas {t.capacity})</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Catatan</label>
                                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                                    rows={2} placeholder="Permintaan khusus, alergi, dll."
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500" />
                            </div>
                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <button onClick={() => setShowModal(false)} className="py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Batal</button>
                                <button onClick={handleSave} disabled={saving || !form.customer_name.trim()}
                                    className="py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold disabled:opacity-50 hover:bg-slate-800">
                                    {saving ? 'Menyimpan...' : 'Simpan Reservasi'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
