import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Edit2, Trash2, X, Loader2, ImageIcon } from 'lucide-react';

interface MenuItem {
    id: string;
    name: string;
    base_price: number;
    cost: number;
    image_url: string;
    stock_quantity: number;
    categories: { id: string; name: string } | null;
}

interface Category {
    id: string;
    name: string;
}

const EMPTY_FORM = {
    name: '', base_price: 0, cost: 0,
    image_url: '', stock_quantity: 0, category_id: ''
};

export default function MenuPage() {
    const [items, setItems] = useState<MenuItem[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editItem, setEditItem] = useState<MenuItem | null>(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [filterCat, setFilterCat] = useState('');

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        setLoading(true);
        const [{ data: menus }, { data: cats }] = await Promise.all([
            supabase.from('menu_items').select('id, name, base_price, cost, image_url, stock_quantity, categories(id, name)').order('name'),
            supabase.from('categories').select('id, name').order('name'),
        ]);
        setItems((menus as any) || []);
        setCategories(cats || []);
        setLoading(false);
    };

    const openAdd = () => {
        setEditItem(null);
        setForm(EMPTY_FORM);
        setShowForm(true);
    };

    const openEdit = (item: MenuItem) => {
        setEditItem(item);
        setForm({
            name: item.name,
            base_price: item.base_price,
            cost: item.cost,
            image_url: item.image_url || '',
            stock_quantity: item.stock_quantity || 0,
            category_id: (item.categories as any)?.id || '',
        });
        setShowForm(true);
    };

    const saveMenu = async () => {
        if (!form.name || form.base_price <= 0) return;
        setSaving(true);
        const payload = {
            name: form.name,
            base_price: form.base_price,
            cost: form.cost,
            image_url: form.image_url,
            stock_quantity: form.stock_quantity,
            category_id: form.category_id || null,
        };

        if (editItem) {
            await supabase.from('menu_items').update(payload).eq('id', editItem.id);
        } else {
            await supabase.from('menu_items').insert(payload);
        }

        await fetchAll();
        setShowForm(false);
        setSaving(false);
    };

    const deleteMenu = async (id: string) => {
        if (!confirm('Hapus menu ini? Tindakan ini tidak bisa dibatalkan.')) return;
        await supabase.from('menu_items').delete().eq('id', id);
        await fetchAll();
    };

    const filtered = items.filter(i =>
        !filterCat || (i.categories as any)?.id === filterCat
    );

    const margin = form.base_price > 0
        ? (((form.base_price - form.cost) / form.base_price) * 100).toFixed(1)
        : '0';

    return (
        <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Manajemen Menu</h1>
                    <p className="text-sm text-gray-500">Tambah, edit, atau hapus menu café.</p>
                </div>
                <button
                    onClick={openAdd}
                    className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl font-bold text-sm transition-colors"
                >
                    <Plus size={16} />
                    <span className="hidden sm:block">Tambah Menu</span>
                </button>
            </div>

            {/* Filter kategori */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
                <button
                    onClick={() => setFilterCat('')}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 ${!filterCat ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                    Semua ({items.length})
                </button>
                {categories.map(c => (
                    <button
                        key={c.id}
                        onClick={() => setFilterCat(c.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 ${filterCat === c.id ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-600'}`}
                    >
                        {c.name}
                    </button>
                ))}
            </div>

            {/* Grid menu */}
            {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="animate-spin text-amber-500" size={28} /></div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {filtered.map(item => (
                        <div key={item.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden group">
                            <div className="aspect-square bg-gray-100 relative overflow-hidden">
                                {item.image_url ? (
                                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                        <ImageIcon size={28} />
                                    </div>
                                )}
                                {/* Overlay aksi */}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <button
                                        onClick={() => openEdit(item)}
                                        className="p-2 bg-white rounded-lg text-blue-600 hover:bg-blue-50 shadow"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        onClick={() => deleteMenu(item.id)}
                                        className="p-2 bg-white rounded-lg text-red-500 hover:bg-red-50 shadow"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                            <div className="p-2.5">
                                <p className="font-semibold text-xs text-gray-900 truncate">{item.name}</p>
                                <p className="text-amber-600 font-bold text-sm">Rp {item.base_price.toLocaleString('id-ID')}</p>
                                <div className="flex items-center justify-between mt-1">
                                    <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                                        {(item.categories as any)?.name || 'Uncategorized'}
                                    </span>
                                    <span className={`text-[10px] font-bold ${((item.base_price - item.cost) / item.base_price) > 0.6 ? 'text-green-600' : 'text-red-500'}`}>
                                        {item.base_price > 0 ? (((item.base_price - item.cost) / item.base_price) * 100).toFixed(0) : 0}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal Form Tambah/Edit */}
            {showForm && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center">
                    <div className="bg-white w-full md:max-w-lg md:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden max-h-[90dvh] flex flex-col">
                        <div className="md:hidden flex justify-center pt-3 shrink-0"><div className="w-10 h-1 bg-gray-200 rounded-full" /></div>
                        <div className="px-5 py-4 border-b flex items-center justify-between shrink-0">
                            <h3 className="font-bold text-gray-900">{editItem ? 'Edit Menu' : 'Tambah Menu Baru'}</h3>
                            <button onClick={() => setShowForm(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"><X size={18} /></button>
                        </div>

                        <div className="overflow-y-auto flex-1 p-5 space-y-4">
                            {/* Preview gambar */}
                            {form.image_url && (
                                <img src={form.image_url} alt="preview" className="w-full h-40 object-cover rounded-xl border" />
                            )}

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5">URL Gambar</label>
                                <input
                                    type="url" placeholder="https://..."
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    value={form.image_url}
                                    onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5">Nama Menu <span className="text-red-500">*</span></label>
                                <input
                                    type="text" placeholder="contoh: Caffe Latte"
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    value={form.name}
                                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5">Kategori</label>
                                <select
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    value={form.category_id}
                                    onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
                                >
                                    <option value="">-- Pilih Kategori --</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Harga Jual (Rp) <span className="text-red-500">*</span></label>
                                    <input
                                        type="number" min={0}
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        value={form.base_price || ''}
                                        onChange={e => setForm(f => ({ ...f, base_price: Number(e.target.value) }))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5">HPP / Modal (Rp)</label>
                                    <input
                                        type="number" min={0}
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        value={form.cost || ''}
                                        onChange={e => setForm(f => ({ ...f, cost: Number(e.target.value) }))}
                                    />
                                </div>
                            </div>

                            {form.base_price > 0 && (
                                <div className={`px-3 py-2 rounded-lg text-sm font-medium ${Number(margin) >= 50 ? 'bg-green-50 text-green-700' : Number(margin) >= 30 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                                    Margin: <strong>{margin}%</strong> · Laba per item: Rp {(form.base_price - form.cost).toLocaleString('id-ID')}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5">Stok Awal (pcs)</label>
                                <input
                                    type="number" min={0}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    value={form.stock_quantity || ''}
                                    onChange={e => setForm(f => ({ ...f, stock_quantity: Number(e.target.value) }))}
                                />
                            </div>
                        </div>

                        <div className="border-t p-4 flex gap-3 shrink-0">
                            <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Batal</button>
                            <button
                                onClick={saveMenu}
                                disabled={saving || !form.name || form.base_price <= 0}
                                className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-200 disabled:text-gray-400 text-white py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
                            >
                                {saving ? <Loader2 size={16} className="animate-spin" /> : null}
                                {saving ? 'Menyimpan...' : editItem ? 'Simpan Perubahan' : 'Tambah Menu'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
