import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Edit2, Trash2, X, Loader2, Users, CircleCheck, CircleDot } from 'lucide-react';

interface Table {
    id: string;
    name: string;
    capacity: number;
    status: 'available' | 'occupied';
}

interface Props {
    onSelectTable?: (table: Table | null) => void;
    selectedTableId?: string | null;
    compact?: boolean; // Mode compact untuk dipakai di PosPage
}

export default function TablesPage({ onSelectTable, selectedTableId, compact = false }: Props) {
    const [tables, setTables] = useState<Table[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editTable, setEditTable] = useState<Table | null>(null);
    const [form, setForm] = useState({ name: '', capacity: 4 });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchTables();
    }, []);

    const fetchTables = async () => {
        setLoading(true);
        const { data } = await supabase.from('tables').select('*').order('name');
        setTables((data as any) || []);
        setLoading(false);
    };

    const saveTable = async () => {
        if (!form.name) return;
        setSaving(true);
        if (editTable) {
            await supabase.from('tables').update(form).eq('id', editTable.id);
        } else {
            await supabase.from('tables').insert({ ...form, status: 'available' });
        }
        await fetchTables();
        setShowForm(false);
        setSaving(false);
        setEditTable(null);
        setForm({ name: '', capacity: 4 });
    };

    const deleteTable = async (id: string) => {
        if (!confirm('Hapus meja ini?')) return;
        await supabase.from('tables').delete().eq('id', id);
        await fetchTables();
    };

    const toggleStatus = async (table: Table) => {
        const newStatus = table.status === 'available' ? 'occupied' : 'available';
        await supabase.from('tables').update({ status: newStatus }).eq('id', table.id);
        setTables(ts => ts.map(t => t.id === table.id ? { ...t, status: newStatus } : t));
    };

    // Mode compact: hanya tampilkan grid pilih meja (untuk PosPage)
    if (compact) {
        return (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                <button
                    onClick={() => onSelectTable?.(null)}
                    className={`py-2.5 px-2 rounded-xl border-2 text-xs font-bold transition-all ${!selectedTableId
                        ? 'border-amber-500 bg-amber-50 text-amber-800'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                >
                    Take Away
                </button>
                {tables.map(t => (
                    <button
                        key={t.id}
                        onClick={() => onSelectTable?.(t)}
                        disabled={t.status === 'occupied' && t.id !== selectedTableId}
                        className={`py-2.5 px-2 rounded-xl border-2 text-xs font-bold transition-all text-center ${selectedTableId === t.id
                            ? 'border-amber-500 bg-amber-50 text-amber-800'
                            : t.status === 'occupied'
                                ? 'border-red-200 bg-red-50 text-red-400 cursor-not-allowed'
                                : 'border-gray-200 text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        {t.name}
                        <div className={`text-[9px] mt-0.5 ${t.status === 'occupied' ? 'text-red-400' : 'text-green-500'}`}>
                            {t.status === 'occupied' ? 'Sibuk' : 'Kosong'}
                        </div>
                    </button>
                ))}
            </div>
        );
    }

    // Mode penuh: halaman manajemen meja
    return (
        <div className="p-4">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Manajemen Meja</h1>
                    <p className="text-sm text-gray-500">Kelola denah dan status meja café.</p>
                </div>
                <button
                    onClick={() => { setEditTable(null); setForm({ name: '', capacity: 4 }); setShowForm(true); }}
                    className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl font-bold text-sm"
                >
                    <Plus size={16} />
                    <span className="hidden sm:block">Tambah Meja</span>
                </button>
            </div>

            {/* Statistik */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-green-50 border border-green-100 rounded-xl p-3">
                    <p className="text-xs text-green-600 font-medium flex items-center gap-1"><CircleCheck size={12} /> Kosong</p>
                    <p className="text-2xl font-bold text-green-700">{tables.filter(t => t.status === 'available').length}</p>
                </div>
                <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                    <p className="text-xs text-red-600 font-medium flex items-center gap-1"><CircleDot size={12} /> Sibuk</p>
                    <p className="text-2xl font-bold text-red-700">{tables.filter(t => t.status === 'occupied').length}</p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-amber-500" size={24} /></div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {tables.map(table => (
                        <div
                            key={table.id}
                            className={`relative rounded-2xl border-2 p-4 transition-all ${table.status === 'occupied'
                                ? 'border-red-300 bg-red-50'
                                : 'border-gray-200 bg-white hover:border-amber-300'
                                }`}
                        >
                            {/* Status dot */}
                            <div className={`absolute top-3 right-3 w-3 h-3 rounded-full ${table.status === 'occupied' ? 'bg-red-500' : 'bg-green-400'}`} />

                            <div className="mb-3">
                                <p className="font-bold text-gray-900 text-sm">{table.name}</p>
                                <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                    <Users size={10} /> {table.capacity} kursi
                                </p>
                            </div>

                            <div className={`text-xs font-bold mb-3 ${table.status === 'occupied' ? 'text-red-600' : 'text-green-600'}`}>
                                {table.status === 'occupied' ? '🔴 Sedang dipakai' : '🟢 Tersedia'}
                            </div>

                            <div className="flex gap-1.5">
                                <button
                                    onClick={() => toggleStatus(table)}
                                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors ${table.status === 'occupied'
                                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                                        }`}
                                >
                                    {table.status === 'occupied' ? 'Bebaskan' : 'Tandai Sibuk'}
                                </button>
                                <button
                                    onClick={() => { setEditTable(table); setForm({ name: table.name, capacity: table.capacity }); setShowForm(true); }}
                                    className="p-1.5 bg-gray-100 text-gray-500 hover:bg-gray-200 rounded-lg"
                                >
                                    <Edit2 size={13} />
                                </button>
                                <button
                                    onClick={() => deleteTable(table.id)}
                                    className="p-1.5 bg-red-50 text-red-400 hover:bg-red-100 rounded-lg"
                                >
                                    <Trash2 size={13} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal Form */}
            {showForm && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-5 w-full max-w-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-gray-900">{editTable ? 'Edit Meja' : 'Tambah Meja'}</h3>
                            <button onClick={() => setShowForm(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded"><X size={18} /></button>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5">Nama Meja</label>
                                <input
                                    type="text" placeholder="contoh: Meja 1, Meja VIP..."
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    value={form.name}
                                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5">Kapasitas Kursi</label>
                                <input
                                    type="number" min={1}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    value={form.capacity}
                                    onChange={e => setForm(f => ({ ...f, capacity: Number(e.target.value) }))}
                                />
                            </div>
                            <div className="flex gap-3 pt-1">
                                <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm font-medium text-gray-600">Batal</button>
                                <button
                                    onClick={saveTable}
                                    disabled={saving || !form.name}
                                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-xl text-sm font-bold disabled:opacity-50"
                                >
                                    {saving ? 'Menyimpan...' : editTable ? 'Simpan' : 'Tambah'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
