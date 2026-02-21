import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
    Plus, Edit2, Trash2, X, Loader2, ImageIcon,
    Layers, ChevronRight, ToggleLeft, ToggleRight,
    PlusCircle, MinusCircle
} from 'lucide-react';

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

interface VariantGroup {
    id: string;
    group_name: string;
    options: { label: string; price_adj: number }[];
    is_required: boolean;
}

const EMPTY_FORM = {
    name: '', base_price: 0, cost: 0,
    image_url: '', stock_quantity: 0, category_id: ''
};

// ─────────────────────────────────────────────────────────
// MODAL KELOLA VARIAN
// ─────────────────────────────────────────────────────────
function VariantManager({ item, onClose }: { item: MenuItem; onClose: () => void }) {
    const [groups, setGroups] = useState<VariantGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form grup baru
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupRequired, setNewGroupRequired] = useState(false);

    // Form opsi baru per grup
    const [newOptionLabel, setNewOptionLabel] = useState<Record<string, string>>({});
    const [newOptionPrice, setNewOptionPrice] = useState<Record<string, number>>({});

    useEffect(() => { fetchGroups(); }, []);

    const fetchGroups = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('menu_variants')
            .select('*')
            .eq('menu_item_id', item.id)
            .order('created_at');
        if (error) {
            console.error('fetchGroups error:', error);
            if (error.code === '42P01') {
                alert('❌ Tabel menu_variants belum ada!\n\nJalankan dulu SQL Migration di Supabase:\n1. Buka supabase.com → SQL Editor\n2. Copy isi file supabase_migration_v2.sql\n3. Paste & klik Run');
            }
        }
        setGroups((data as any) || []);
        setLoading(false);
    };

    // Tambah grup baru
    const addGroup = async () => {
        if (!newGroupName.trim()) return;
        setSaving(true);
        const { error } = await supabase.from('menu_variants').insert({
            menu_item_id: item.id,
            group_name: newGroupName.trim(),
            options: [],
            is_required: newGroupRequired,
        });
        if (error) {
            alert('❌ Gagal menyimpan varian: ' + error.message + '\n\nKemungkinan SQL migration belum dijalankan di Supabase!');
            setSaving(false);
            return;
        }
        setNewGroupName('');
        setNewGroupRequired(false);
        await fetchGroups();
        setSaving(false);
    };

    // Hapus grup
    const deleteGroup = async (groupId: string) => {
        if (!confirm('Hapus grup varian ini?')) return;
        await supabase.from('menu_variants').delete().eq('id', groupId);
        await fetchGroups();
    };

    // Toggle wajib/opsional
    const toggleRequired = async (group: VariantGroup) => {
        await supabase.from('menu_variants').update({ is_required: !group.is_required }).eq('id', group.id);
        setGroups(gs => gs.map(g => g.id === group.id ? { ...g, is_required: !g.is_required } : g));
    };

    // Tambah opsi ke grup
    const addOption = async (group: VariantGroup) => {
        const label = newOptionLabel[group.id]?.trim();
        if (!label) return;
        const price = newOptionPrice[group.id] || 0;
        const updatedOptions = [...group.options, { label, price_adj: price }];
        const { error } = await supabase.from('menu_variants').update({ options: updatedOptions }).eq('id', group.id);
        if (error) { alert('❌ Gagal: ' + error.message); return; }
        setNewOptionLabel(p => ({ ...p, [group.id]: '' }));
        setNewOptionPrice(p => ({ ...p, [group.id]: 0 }));
        setGroups(gs => gs.map(g => g.id === group.id ? { ...g, options: updatedOptions } : g));
    };

    // Hapus opsi dari grup
    const removeOption = async (group: VariantGroup, idx: number) => {
        const updatedOptions = group.options.filter((_, i) => i !== idx);
        await supabase.from('menu_variants').update({ options: updatedOptions }).eq('id', group.id);
        setGroups(gs => gs.map(g => g.id === group.id ? { ...g, options: updatedOptions } : g));
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center">
            <div className="bg-white w-full md:max-w-lg md:rounded-2xl rounded-t-2xl shadow-2xl max-h-[90dvh] flex flex-col overflow-hidden">
                {/* Handle mobile */}
                <div className="md:hidden flex justify-center pt-3 shrink-0">
                    <div className="w-10 h-1 bg-gray-200 rounded-full" />
                </div>

                {/* Header */}
                <div className="px-5 py-4 border-b flex items-center gap-3 shrink-0">
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                            <Layers size={16} className="text-amber-500" /> Kelola Varian
                        </h3>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{item.name}</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg shrink-0">
                        <X size={18} />
                    </button>
                </div>

                {/* Konten scroll */}
                <div className="flex-1 overflow-y-auto p-5 space-y-5">
                    {loading ? (
                        <div className="flex justify-center py-8"><Loader2 className="animate-spin text-amber-500" size={24} /></div>
                    ) : (
                        <>
                            {/* Info jika belum ada grup */}
                            {groups.length === 0 && (
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700 flex items-start gap-2">
                                    <span className="text-lg">💡</span>
                                    <div>
                                        <p className="font-semibold">Belum ada varian untuk menu ini.</p>
                                        <p className="text-xs mt-0.5 text-amber-600">
                                            Tambahkan grup varian di bawah, contoh: "Suhu", "Ukuran", "Tingkat Manis"
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Daftar grup yang sudah ada */}
                            {groups.map(group => (
                                <div key={group.id} className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                                    {/* Header grup */}
                                    <div className="flex items-center gap-2 px-4 py-3 bg-white border-b">
                                        <div className="flex-1 min-w-0">
                                            <span className="font-bold text-sm text-gray-900">{group.group_name}</span>
                                        </div>
                                        {/* Toggle wajib */}
                                        <button
                                            onClick={() => toggleRequired(group)}
                                            className={`flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-full transition-colors ${group.is_required
                                                ? 'bg-red-100 text-red-600'
                                                : 'bg-gray-100 text-gray-500'
                                                }`}
                                        >
                                            {group.is_required
                                                ? <><ToggleRight size={13} /> Wajib</>
                                                : <><ToggleLeft size={13} /> Opsional</>
                                            }
                                        </button>
                                        <button
                                            onClick={() => deleteGroup(group.id)}
                                            className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>

                                    {/* Daftar opsi yang sudah ada */}
                                    <div className="px-4 py-2 space-y-2">
                                        {group.options.length === 0 && (
                                            <p className="text-xs text-gray-400 italic py-2 text-center">Belum ada opsi — tambahkan di bawah</p>
                                        )}
                                        {group.options.map((opt, idx) => (
                                            <div key={idx} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-gray-100">
                                                <div className="flex-1 min-w-0">
                                                    <span className="font-medium text-sm text-gray-900">{opt.label}</span>
                                                </div>
                                                <span className={`text-xs font-bold ${opt.price_adj > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                                                    {opt.price_adj > 0 ? `+Rp ${opt.price_adj.toLocaleString('id-ID')}` : 'Gratis'}
                                                </span>
                                                <button
                                                    onClick={() => removeOption(group, idx)}
                                                    className="p-1 text-gray-300 hover:text-red-400 transition-colors"
                                                >
                                                    <MinusCircle size={15} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Form tambah opsi baru */}
                                    <div className="px-4 pb-3 pt-1">
                                        <div className="flex gap-2 items-center">
                                            <input
                                                type="text"
                                                placeholder="Nama opsi (misal: Ice, Hot, Less Sugar)"
                                                className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                                                value={newOptionLabel[group.id] || ''}
                                                onChange={e => setNewOptionLabel(p => ({ ...p, [group.id]: e.target.value }))}
                                                onKeyDown={e => e.key === 'Enter' && addOption(group)}
                                            />
                                            <div className="relative shrink-0 w-24">
                                                <span className="absolute left-2 top-1.5 text-gray-400 text-xs">+Rp</span>
                                                <input
                                                    type="number"
                                                    placeholder="0"
                                                    className="w-full border border-gray-200 rounded-lg pl-7 pr-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                                                    value={newOptionPrice[group.id] || ''}
                                                    onChange={e => setNewOptionPrice(p => ({ ...p, [group.id]: Number(e.target.value) }))}
                                                />
                                            </div>
                                            <button
                                                onClick={() => addOption(group)}
                                                disabled={!newOptionLabel[group.id]?.trim()}
                                                className="p-1.5 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-200 text-white rounded-lg transition-colors shrink-0"
                                            >
                                                <PlusCircle size={15} />
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-gray-400 mt-1 pl-1">Kosongkan harga jika gratis</p>
                                    </div>
                                </div>
                            ))}

                            {/* Contoh preset cepat */}
                            {groups.length === 0 && (
                                <div>
                                    <p className="text-xs font-bold text-gray-500 mb-2">⚡ Tambah Cepat:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            { name: 'Suhu', opts: ['Ice', 'Hot'] },
                                            { name: 'Ukuran', opts: ['Small', 'Medium +5k', 'Large +10k'] },
                                            { name: 'Gula', opts: ['Normal', 'Less Sugar', 'No Sugar'] },
                                        ].map(preset => (
                                            <button
                                                key={preset.name}
                                                onClick={async () => {
                                                    setSaving(true);
                                                    const options = preset.opts.map(o => {
                                                        const match = o.match(/\+(\d+)k/);
                                                        return { label: o.replace(/\s*\+\d+k/, ''), price_adj: match ? parseInt(match[1]) * 1000 : 0 };
                                                    });
                                                    await supabase.from('menu_variants').insert({
                                                        menu_item_id: item.id,
                                                        group_name: preset.name,
                                                        options,
                                                        is_required: true,
                                                    });
                                                    await fetchGroups();
                                                    setSaving(false);
                                                }}
                                                disabled={saving}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-amber-200 text-amber-700 rounded-full text-xs font-medium hover:bg-amber-50 transition-colors"
                                            >
                                                <PlusCircle size={12} /> {preset.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Form tambah grup baru */}
                            <div className="bg-slate-900 rounded-xl p-4 space-y-3">
                                <h4 className="text-white font-bold text-sm flex items-center gap-2">
                                    <Plus size={14} /> Tambah Grup Varian Baru
                                </h4>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Nama grup (misal: Suhu, Ukuran, Gula...)"
                                        className="flex-1 border border-slate-700 bg-slate-800 text-white placeholder-slate-500 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        value={newGroupName}
                                        onChange={e => setNewGroupName(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && addGroup()}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <button
                                        onClick={() => setNewGroupRequired(r => !r)}
                                        className={`flex items-center gap-2 text-xs font-medium transition-colors ${newGroupRequired ? 'text-red-400' : 'text-slate-400'}`}
                                    >
                                        {newGroupRequired ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                                        {newGroupRequired ? 'Wajib dipilih' : 'Opsional (bisa dilewati)'}
                                    </button>
                                    <button
                                        onClick={addGroup}
                                        disabled={!newGroupName.trim() || saving}
                                        className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-700 disabled:text-slate-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors"
                                    >
                                        {saving ? <Loader2 size={14} className="animate-spin" /> : <ChevronRight size={14} />}
                                        Tambah Grup
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t p-4 shrink-0">
                    <button
                        onClick={onClose}
                        className="w-full border border-gray-200 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
                    >
                        Selesai
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────
// MENU PAGE UTAMA
// ─────────────────────────────────────────────────────────
export default function MenuPage() {
    const [items, setItems] = useState<MenuItem[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editItem, setEditItem] = useState<MenuItem | null>(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [filterCat, setFilterCat] = useState('');
    const [variantItem, setVariantItem] = useState<MenuItem | null>(null);

    useEffect(() => { fetchAll(); }, []);

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

    const openAdd = () => { setEditItem(null); setForm(EMPTY_FORM); setShowForm(true); };
    const openEdit = (item: MenuItem) => {
        setEditItem(item);
        setForm({ name: item.name, base_price: item.base_price, cost: item.cost, image_url: item.image_url || '', stock_quantity: item.stock_quantity || 0, category_id: (item.categories as any)?.id || '' });
        setShowForm(true);
    };

    const saveMenu = async () => {
        if (!form.name || form.base_price <= 0) return;
        setSaving(true);
        const payload = { name: form.name, base_price: form.base_price, cost: form.cost, image_url: form.image_url, stock_quantity: form.stock_quantity, category_id: form.category_id || null };
        if (editItem) await supabase.from('menu_items').update(payload).eq('id', editItem.id);
        else await supabase.from('menu_items').insert(payload);
        await fetchAll();
        setShowForm(false);
        setSaving(false);
    };

    const deleteMenu = async (id: string) => {
        if (!confirm('Hapus menu ini?')) return;
        await supabase.from('menu_items').delete().eq('id', id);
        await fetchAll();
    };

    const filtered = items.filter(i => !filterCat || (i.categories as any)?.id === filterCat);
    const margin = form.base_price > 0 ? (((form.base_price - form.cost) / form.base_price) * 100).toFixed(1) : '0';

    return (
        <div className="p-4">
            {/* Modal Kelola Varian */}
            {variantItem && <VariantManager item={variantItem} onClose={() => setVariantItem(null)} />}

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Manajemen Menu</h1>
                    <p className="text-sm text-gray-500">Tambah, edit, dan atur varian menu café.</p>
                </div>
                <button onClick={openAdd} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl font-bold text-sm transition-colors">
                    <Plus size={16} />
                    <span className="hidden sm:block">Tambah Menu</span>
                </button>
            </div>

            {/* Filter kategori */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
                <button onClick={() => setFilterCat('')} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 ${!filterCat ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-600'}`}>
                    Semua ({items.length})
                </button>
                {categories.map(c => (
                    <button key={c.id} onClick={() => setFilterCat(c.id)} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 ${filterCat === c.id ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-600'}`}>
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
                                {item.image_url
                                    ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                    : <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon size={28} /></div>
                                }
                                {/* Overlay aksi */}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <button onClick={() => openEdit(item)} className="p-2 bg-white rounded-lg text-blue-600 hover:bg-blue-50 shadow" title="Edit menu">
                                        <Edit2 size={13} />
                                    </button>
                                    <button onClick={() => setVariantItem(item)} className="p-2 bg-white rounded-lg text-amber-600 hover:bg-amber-50 shadow" title="Kelola varian">
                                        <Layers size={13} />
                                    </button>
                                    <button onClick={() => deleteMenu(item.id)} className="p-2 bg-white rounded-lg text-red-500 hover:bg-red-50 shadow" title="Hapus menu">
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>
                            <div className="p-2.5">
                                <p className="font-semibold text-xs text-gray-900 truncate">{item.name}</p>
                                <p className="text-amber-600 font-bold text-sm">Rp {item.base_price.toLocaleString('id-ID')}</p>
                                <div className="flex items-center justify-between mt-1">
                                    <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{(item.categories as any)?.name || '—'}</span>
                                    <button onClick={() => setVariantItem(item)} className="text-[10px] text-amber-600 hover:underline flex items-center gap-0.5">
                                        <Layers size={9} /> varian
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal Form Tambah/Edit Menu */}
            {showForm && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center">
                    <div className="bg-white w-full md:max-w-lg md:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden max-h-[90dvh] flex flex-col">
                        <div className="md:hidden flex justify-center pt-3 shrink-0"><div className="w-10 h-1 bg-gray-200 rounded-full" /></div>
                        <div className="px-5 py-4 border-b flex items-center justify-between shrink-0">
                            <h3 className="font-bold text-gray-900">{editItem ? 'Edit Menu' : 'Tambah Menu Baru'}</h3>
                            <button onClick={() => setShowForm(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"><X size={18} /></button>
                        </div>

                        <div className="overflow-y-auto flex-1 p-5 space-y-4">
                            {form.image_url && <img src={form.image_url} alt="preview" className="w-full h-40 object-cover rounded-xl border" />}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5">URL Gambar</label>
                                <input type="url" placeholder="https://..." className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5">Nama Menu <span className="text-red-500">*</span></label>
                                <input type="text" placeholder="contoh: Caffe Latte" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5">Kategori</label>
                                <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}>
                                    <option value="">-- Pilih Kategori --</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Harga Jual (Rp) <span className="text-red-500">*</span></label>
                                    <input type="number" min={0} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" value={form.base_price || ''} onChange={e => setForm(f => ({ ...f, base_price: Number(e.target.value) }))} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5">HPP / Modal (Rp)</label>
                                    <input type="number" min={0} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" value={form.cost || ''} onChange={e => setForm(f => ({ ...f, cost: Number(e.target.value) }))} />
                                </div>
                            </div>
                            {form.base_price > 0 && (
                                <div className={`px-3 py-2 rounded-lg text-sm font-medium ${Number(margin) >= 50 ? 'bg-green-50 text-green-700' : Number(margin) >= 30 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                                    Margin: <strong>{margin}%</strong> · Laba: Rp {(form.base_price - form.cost).toLocaleString('id-ID')}
                                </div>
                            )}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5">Stok Awal (pcs)</label>
                                <input type="number" min={0} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" value={form.stock_quantity || ''} onChange={e => setForm(f => ({ ...f, stock_quantity: Number(e.target.value) }))} />
                            </div>
                        </div>

                        <div className="border-t p-4 flex gap-3 shrink-0">
                            <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Batal</button>
                            <button onClick={saveMenu} disabled={saving || !form.name || form.base_price <= 0} className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-200 disabled:text-gray-400 text-white py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2">
                                {saving ? <Loader2 size={16} className="animate-spin" /> : null}
                                {saving ? 'Menyimpan...' : editItem ? 'Simpan' : 'Tambah Menu'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
