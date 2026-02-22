import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
    Plus, Edit2, Trash2, X, Loader2, ImageIcon,
    Layers, ToggleLeft, ToggleRight, PlusCircle, MinusCircle, Save
} from 'lucide-react';

interface MenuItem {
    id: string;
    name: string;
    base_price: number;
    cost: number;
    image_url: string;
    stock_quantity: number;
    categories: { id: string; name: string } | null;
    variants: VariantGroup[];
}

interface Category {
    id: string;
    name: string;
}

interface VariantOption {
    label: string;
    price_adj: number;
}

interface VariantGroup {
    group_name: string;
    is_required: boolean;
    options: VariantOption[];
}

const EMPTY_FORM = {
    name: '', base_price: 0, cost: 0,
    image_url: '', stock_quantity: 0, category_id: ''
};

// ─────────────────────────────────────────────────────────
// MODAL KELOLA VARIAN — menyimpan langsung ke menu_items.variants (JSONB)
// ─────────────────────────────────────────────────────────
function VariantManager({ item, onClose, onSaved }: {
    item: MenuItem;
    onClose: () => void;
    onSaved: (updatedVariants: VariantGroup[]) => void;
}) {
    const [groups, setGroups] = useState<VariantGroup[]>(item.variants || []);
    const [saving, setSaving] = useState(false);
    const [dirty, setDirty] = useState(false);

    // State form tambah grup baru
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupRequired, setNewGroupRequired] = useState(true);

    // State form tambah opsi per grup (key = index grup)
    const [newLabel, setNewLabel] = useState<Record<number, string>>({});
    const [newPrice, setNewPrice] = useState<Record<number, number>>({});

    const saveAll = async (g: VariantGroup[]) => {
        setSaving(true);
        const { error } = await supabase
            .from('menu_items')
            .update({ variants: g })
            .eq('id', item.id);
        if (error) {
            alert('❌ Gagal menyimpan: ' + error.message);
            setSaving(false);
            return false;
        }
        setSaving(false);
        setDirty(false);
        onSaved(g);
        return true;
    };

    const addGroup = async () => {
        if (!newGroupName.trim()) return;
        const updated = [...groups, { group_name: newGroupName.trim(), is_required: newGroupRequired, options: [] }];
        setGroups(updated);
        setNewGroupName('');
        setNewGroupRequired(true);
        setDirty(true);
        await saveAll(updated);
    };

    const deleteGroup = async (idx: number) => {
        if (!confirm('Hapus grup varian "' + groups[idx].group_name + '"?')) return;
        const updated = groups.filter((_, i) => i !== idx);
        setGroups(updated);
        setDirty(true);
        await saveAll(updated);
    };

    const toggleRequired = async (idx: number) => {
        const updated = groups.map((g, i) => i === idx ? { ...g, is_required: !g.is_required } : g);
        setGroups(updated);
        await saveAll(updated);
    };

    const addOption = async (groupIdx: number) => {
        const label = newLabel[groupIdx]?.trim();
        if (!label) return;
        const price = newPrice[groupIdx] || 0;
        const updated = groups.map((g, i) => i === groupIdx
            ? { ...g, options: [...g.options, { label, price_adj: price }] }
            : g
        );
        setGroups(updated);
        setNewLabel(p => ({ ...p, [groupIdx]: '' }));
        setNewPrice(p => ({ ...p, [groupIdx]: 0 }));
        await saveAll(updated);
    };

    const removeOption = async (groupIdx: number, optIdx: number) => {
        const updated = groups.map((g, i) => i === groupIdx
            ? { ...g, options: g.options.filter((_, j) => j !== optIdx) }
            : g
        );
        setGroups(updated);
        await saveAll(updated);
    };

    const applyPreset = async (preset: { name: string; required: boolean; opts: { label: string; price: number }[] }) => {
        const newGroup: VariantGroup = {
            group_name: preset.name,
            is_required: preset.required,
            options: preset.opts.map(o => ({ label: o.label, price_adj: o.price }))
        };
        const updated = [...groups, newGroup];
        setGroups(updated);
        await saveAll(updated);
    };

    const PRESETS = [
        { name: 'Suhu', required: true, opts: [{ label: 'Ice', price: 0 }, { label: 'Hot', price: 0 }] },
        { name: 'Ukuran', required: false, opts: [{ label: 'Regular', price: 0 }, { label: 'Large', price: 5000 }] },
        { name: 'Gula', required: false, opts: [{ label: 'Normal', price: 0 }, { label: 'Less Sugar', price: 0 }, { label: 'No Sugar', price: 0 }] },
        { name: 'Topping', required: false, opts: [{ label: 'Strawberry', price: 0 }, { label: 'Chocolate', price: 0 }, { label: 'Blue Vanilla', price: 0 }] },
    ];

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center">
            <div className="bg-white w-full md:max-w-lg md:rounded-2xl rounded-t-2xl shadow-2xl max-h-[92dvh] flex flex-col overflow-hidden">
                <div className="md:hidden flex justify-center pt-3 shrink-0">
                    <div className="w-10 h-1 bg-gray-200 rounded-full" />
                </div>

                {/* Header */}
                <div className="px-5 py-3.5 border-b flex items-center gap-3 shrink-0">
                    <Layers size={16} className="text-amber-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 text-sm">Kelola Varian</h3>
                        <p className="text-xs text-gray-500 truncate">{item.name}</p>
                    </div>
                    {dirty && saving && <Loader2 size={14} className="animate-spin text-amber-500 shrink-0" />}
                    {!dirty && !saving && groups.length > 0 && (
                        <span className="text-xs text-green-600 font-medium flex items-center gap-1 shrink-0">
                            <Save size={11} /> Tersimpan
                        </span>
                    )}
                    <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg shrink-0">
                        <X size={18} />
                    </button>
                </div>

                {/* Konten scroll */}
                <div className="flex-1 overflow-y-auto">
                    <div className="p-4 space-y-4">

                        {/* Info belum ada varian */}
                        {groups.length === 0 && (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
                                <p className="font-semibold mb-1">💡 Tambahkan varian untuk menu ini</p>
                                <p className="text-xs text-amber-600">Contoh: pilihan Suhu (Ice/Hot), Ukuran, atau Tingkat Manis</p>
                            </div>
                        )}

                        {/* Preset cepat — hanya tampil jika belum punya grup */}
                        {groups.length === 0 && (
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase mb-2">⚡ Tambah Cepat</p>
                                <div className="flex flex-wrap gap-2">
                                    {PRESETS.map(p => (
                                        <button
                                            key={p.name}
                                            onClick={() => applyPreset(p)}
                                            disabled={saving}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border-2 border-amber-200 text-amber-700 rounded-full text-xs font-bold hover:bg-amber-50 hover:border-amber-400 transition-all disabled:opacity-50"
                                        >
                                            <PlusCircle size={12} /> {p.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Daftar grup varian */}
                        {groups.map((group, groupIdx) => (
                            <div key={groupIdx} className="rounded-xl border-2 border-gray-200 overflow-hidden">
                                {/* Header grup */}
                                <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border-b border-gray-200">
                                    <span className="font-bold text-sm text-gray-900 flex-1">{group.group_name}</span>
                                    <button
                                        onClick={() => toggleRequired(groupIdx)}
                                        className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full transition-all ${group.is_required ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}
                                    >
                                        {group.is_required ? <><ToggleRight size={12} />Wajib</> : <><ToggleLeft size={12} />Opsional</>}
                                    </button>
                                    <button onClick={() => deleteGroup(groupIdx)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg">
                                        <Trash2 size={13} />
                                    </button>
                                </div>

                                {/* Opsi-opsi */}
                                <div className="divide-y divide-gray-100">
                                    {group.options.length === 0 && (
                                        <p className="text-xs text-gray-400 italic px-3 py-2 text-center">Belum ada opsi</p>
                                    )}
                                    {group.options.map((opt, optIdx) => (
                                        <div key={optIdx} className="flex items-center gap-2 px-3 py-2">
                                            <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                                            <span className="flex-1 text-sm font-medium text-gray-800">{opt.label}</span>
                                            <span className={`text-xs font-bold ${opt.price_adj > 0 ? 'text-amber-600' : 'text-gray-300'}`}>
                                                {opt.price_adj > 0 ? '+Rp ' + opt.price_adj.toLocaleString('id-ID') : 'Gratis'}
                                            </span>
                                            <button
                                                onClick={() => removeOption(groupIdx, optIdx)}
                                                className="p-1 text-gray-300 hover:text-red-400 transition-colors"
                                            >
                                                <MinusCircle size={15} />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* Form tambah opsi */}
                                <div className="px-3 py-2.5 bg-gray-50 border-t border-gray-100">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Nama opsi (misal: Ice, Hot...)"
                                            className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                                            value={newLabel[groupIdx] || ''}
                                            onChange={e => setNewLabel(p => ({ ...p, [groupIdx]: e.target.value }))}
                                            onKeyDown={e => e.key === 'Enter' && addOption(groupIdx)}
                                        />
                                        <div className="relative w-20 shrink-0">
                                            <span className="absolute left-2 top-1.5 text-gray-400 text-[10px] font-bold">+Rp</span>
                                            <input
                                                type="number"
                                                placeholder="0"
                                                className="w-full border border-gray-200 rounded-lg pl-6 pr-1.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                                                value={newPrice[groupIdx] || ''}
                                                onChange={e => setNewPrice(p => ({ ...p, [groupIdx]: Number(e.target.value) }))}
                                            />
                                        </div>
                                        <button
                                            onClick={() => addOption(groupIdx)}
                                            disabled={!newLabel[groupIdx]?.trim() || saving}
                                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-200 text-white rounded-lg transition-colors shrink-0"
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Form tambah grup baru */}
                        <div className="bg-slate-900 rounded-xl p-4 space-y-3">
                            <p className="text-white font-bold text-sm flex items-center gap-2"><Plus size={14} /> Tambah Grup Varian</p>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Nama grup (Suhu, Ukuran, Gula...)"
                                    className="flex-1 border border-slate-700 bg-slate-800 text-white placeholder-slate-500 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    value={newGroupName}
                                    onChange={e => setNewGroupName(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && addGroup()}
                                />
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <button
                                    onClick={() => setNewGroupRequired(r => !r)}
                                    className={`flex items-center gap-2 text-xs font-medium ${newGroupRequired ? 'text-red-400' : 'text-slate-400'}`}
                                >
                                    {newGroupRequired ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                                    {newGroupRequired ? 'Wajib dipilih' : 'Opsional'}
                                </button>
                                <button
                                    onClick={addGroup}
                                    disabled={!newGroupName.trim() || saving}
                                    className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-700 disabled:text-slate-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors"
                                >
                                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                                    Tambah Grup
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t p-4 shrink-0">
                    <button onClick={onClose} className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl text-sm font-bold transition-colors">
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
            supabase.from('menu_items').select('id, name, base_price, cost, image_url, stock_quantity, variants, categories(id, name)').order('name'),
            supabase.from('categories').select('id, name').order('name'),
        ]);
        setItems((menus as any) || []);
        // Deduplicate categories by name (case-insensitive) to prevent duplicate filter buttons
        const catRaw = cats || [];
        const seen = new Set<string>();
        const uniqueCats = catRaw.filter(c => {
            const key = c.name.toLowerCase().trim();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
        setCategories(uniqueCats);
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
        else await supabase.from('menu_items').insert({ ...payload, variants: [] });
        await fetchAll();
        setShowForm(false);
        setSaving(false);
    };

    const deleteMenu = async (id: string) => {
        if (!confirm('Hapus menu ini?')) return;
        await supabase.from('menu_items').delete().eq('id', id);
        setItems(prev => prev.filter(i => i.id !== id));
    };

    const filtered = items.filter(i => !filterCat || (i.categories as any)?.id === filterCat);
    const margin = form.base_price > 0 ? (((form.base_price - form.cost) / form.base_price) * 100).toFixed(1) : '0';

    return (
        <div className="p-4">
            {variantItem && (
                <VariantManager
                    item={variantItem}
                    onClose={() => setVariantItem(null)}
                    onSaved={(updatedVariants) => {
                        setItems(prev => prev.map(i => i.id === variantItem.id ? { ...i, variants: updatedVariants } : i));
                    }}
                />
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Manajemen Menu</h1>
                    <p className="text-sm text-gray-500">{items.length} menu · tambah, edit, dan atur varian.</p>
                </div>
                <button onClick={openAdd} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl font-bold text-sm">
                    <Plus size={16} /><span className="hidden sm:block">Tambah Menu</span>
                </button>
            </div>

            {/* Filter kategori */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
                <button onClick={() => setFilterCat('')} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 ${!filterCat ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-600'}`}>
                    Semua ({items.length})
                </button>
                {categories.map(c => (
                    <button key={c.id} onClick={() => setFilterCat(c.id)} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 ${filterCat === c.id ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-600'}`}>
                        {c.name} ({items.filter(i => (i.categories as any)?.id === c.id).length})
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
                                    ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                    : <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon size={28} /></div>
                                }
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                                    <button onClick={() => openEdit(item)} className="p-2 bg-white rounded-lg text-blue-600 shadow" title="Edit">
                                        <Edit2 size={13} />
                                    </button>
                                    <button onClick={() => setVariantItem(item)} className="p-2 bg-white rounded-lg text-amber-600 shadow" title="Kelola Varian">
                                        <Layers size={13} />
                                    </button>
                                    <button onClick={() => deleteMenu(item.id)} className="p-2 bg-white rounded-lg text-red-500 shadow" title="Hapus">
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>
                            <div className="p-2.5">
                                <p className="font-semibold text-xs text-gray-900 truncate">{item.name}</p>
                                <p className="text-amber-600 font-bold text-sm">Rp {item.base_price.toLocaleString('id-ID')}</p>
                                <div className="flex items-center justify-between mt-1">
                                    <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded truncate max-w-[70%]">
                                        {(item.categories as any)?.name || '—'}
                                    </span>
                                    <button
                                        onClick={() => setVariantItem(item)}
                                        className={`text-[10px] font-bold flex items-center gap-0.5 ${item.variants?.length > 0 ? 'text-amber-600' : 'text-gray-300'}`}
                                        title="Kelola Varian"
                                    >
                                        <Layers size={9} />
                                        {item.variants?.length > 0 ? item.variants.length : '+'}
                                    </button>
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
                        </div>
                        <div className="border-t p-4 flex gap-3 shrink-0">
                            <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm font-medium text-gray-600">Batal</button>
                            <button onClick={saveMenu} disabled={saving || !form.name || form.base_price <= 0} className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-200 disabled:text-gray-400 text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
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
