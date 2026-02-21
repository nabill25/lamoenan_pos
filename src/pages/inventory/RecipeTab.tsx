// Tab Resep Menu — mengelola daftar bahan baku yang dibutuhkan setiap menu
// Akses: Headbar & Owner
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { UtensilsCrossed, Plus, Trash2, ChevronDown } from 'lucide-react';

interface MenuItem {
    id: string;
    name: string;
}

interface Ingredient {
    id: string;
    name: string;
    unit: string;
    current_stock: number;
}

interface ResepItem {
    id: string;
    ingredient_id: string;
    quantity: number;
    ingredients: {
        name: string;
        unit: string;
        current_stock: number;
    };
}

export default function RecipeTab() {
    const [menus, setMenus] = useState<MenuItem[]>([]);
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [selectedMenuId, setSelectedMenuId] = useState<string>('');
    const [resep, setResep] = useState<ResepItem[]>([]);
    const [loading, setLoading] = useState(false);

    // State form tambah bahan ke resep
    const [formIngredientId, setFormIngredientId] = useState('');
    const [formQty, setFormQty] = useState<number>(1);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchMenusAndIngredients();
    }, []);

    useEffect(() => {
        if (selectedMenuId) fetchResep(selectedMenuId);
        else setResep([]);
    }, [selectedMenuId]);

    const fetchMenusAndIngredients = async () => {
        const [menuRes, ingRes] = await Promise.all([
            supabase.from('menu_items').select('id, name').order('name'),
            supabase.from('ingredients').select('id, name, unit, current_stock').order('name'),
        ]);
        setMenus(menuRes.data || []);
        setIngredients(ingRes.data || []);
    };

    const fetchResep = async (menuId: string) => {
        setLoading(true);
        const { data, error } = await supabase
            .from('menu_item_ingredients')
            .select('id, ingredient_id, quantity, ingredients(name, unit, current_stock)')
            .eq('menu_item_id', menuId)
            .order('ingredients(name)');

        if (error) console.error('Gagal memuat resep:', error);
        setResep((data as any) || []);
        setLoading(false);
    };

    const tambahBahan = async () => {
        if (!selectedMenuId || !formIngredientId || formQty <= 0) return;
        setSaving(true);

        const { error } = await supabase.from('menu_item_ingredients').insert({
            menu_item_id: selectedMenuId,
            ingredient_id: formIngredientId,
            quantity: formQty,
        });

        if (error) {
            if (error.code === '23505') {
                alert('Bahan ini sudah ada dalam resep menu tersebut.');
            } else {
                alert('Gagal menambahkan bahan: ' + error.message);
            }
        } else {
            setFormIngredientId('');
            setFormQty(1);
            fetchResep(selectedMenuId);
        }
        setSaving(false);
    };

    const hapusBahan = async (resepId: string) => {
        if (!confirm('Hapus bahan ini dari resep?')) return;
        const { error } = await supabase
            .from('menu_item_ingredients')
            .delete()
            .eq('id', resepId);

        if (!error) fetchResep(selectedMenuId);
    };

    const updateQty = async (resepId: string, newQty: number) => {
        if (newQty <= 0) return;
        await supabase
            .from('menu_item_ingredients')
            .update({ quantity: newQty })
            .eq('id', resepId);
        fetchResep(selectedMenuId);
    };

    const selectedMenu = menus.find(m => m.id === selectedMenuId);

    // Bahan yang belum ada di resep (untuk dropdown tambah)
    const bahanBelumDipakai = ingredients.filter(
        ing => !resep.some(r => r.ingredient_id === ing.id)
    );

    return (
        <div className="space-y-6">
            {/* Header & Pilih Menu */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div>
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <UtensilsCrossed size={18} className="text-amber-600" />
                        Manajemen Resep Menu
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                        Tentukan bahan baku yang digunakan setiap menu. Stok akan otomatis berkurang saat transaksi.
                    </p>
                </div>
                {/* Dropdown pilih menu */}
                <div className="relative min-w-[220px]">
                    <select
                        className="w-full appearance-none pl-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
                        value={selectedMenuId}
                        onChange={e => setSelectedMenuId(e.target.value)}
                    >
                        <option value="">-- Pilih Menu --</option>
                        {menus.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
                </div>
            </div>

            {/* Jika belum pilih menu */}
            {!selectedMenuId && (
                <div className="text-center py-16 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <UtensilsCrossed size={40} className="mx-auto mb-3 opacity-40" />
                    <p className="font-medium">Pilih menu di atas untuk melihat atau mengatur resepnya.</p>
                </div>
            )}

            {/* Jika sudah pilih menu */}
            {selectedMenuId && (
                <div className="space-y-4">
                    {/* Card resep menu yang dipilih */}
                    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                        <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-amber-50">
                            <div>
                                <p className="text-xs text-amber-600 font-bold uppercase tracking-wider">Resep</p>
                                <h4 className="font-bold text-gray-900 text-base">{selectedMenu?.name}</h4>
                            </div>
                            <span className="text-xs text-gray-400">{resep.length} bahan</span>
                        </div>

                        {/* Tabel resep */}
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-100 text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                                <tr>
                                    <th className="px-5 py-3 text-left">Bahan Baku</th>
                                    <th className="px-5 py-3 text-right">Stok Sekarang</th>
                                    <th className="px-5 py-3 text-right">Jumlah / Porsi</th>
                                    <th className="px-5 py-3 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr><td colSpan={4} className="py-8 text-center text-gray-400">Memuat resep...</td></tr>
                                ) : resep.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-10 text-center text-gray-400">
                                            <p className="font-medium">Belum ada bahan dalam resep ini.</p>
                                            <p className="text-xs mt-1">Tambahkan bahan di bawah.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    resep.map(r => (
                                        <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-5 py-3 font-medium text-gray-900">
                                                {r.ingredients.name}
                                                <span className="text-gray-400 font-normal ml-1 text-xs">({r.ingredients.unit})</span>
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${r.ingredients.current_stock <= 5
                                                    ? 'bg-red-100 text-red-700'
                                                    : 'bg-green-100 text-green-700'
                                                    }`}>
                                                    {r.ingredients.current_stock} {r.ingredients.unit}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <input
                                                    type="number"
                                                    min={0.1}
                                                    step={0.1}
                                                    className="w-20 text-right border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                                    defaultValue={r.quantity}
                                                    onBlur={e => updateQty(r.id, parseFloat(e.target.value) || 0)}
                                                />
                                                <span className="text-gray-400 text-xs ml-1">{r.ingredients.unit}</span>
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <button
                                                    onClick={() => hapusBahan(r.id)}
                                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                                    title="Hapus dari resep"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Form tambah bahan ke resep */}
                    <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
                        <h5 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                            <Plus size={16} className="text-amber-600" />
                            Tambah Bahan ke Resep
                        </h5>

                        {/* Pesan jika semua bahan sudah masuk resep */}
                        {bahanBelumDipakai.length === 0 && ingredients.length > 0 && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700 flex items-start gap-2">
                                <span className="text-lg leading-none">⚠️</span>
                                <div>
                                    <p className="font-semibold">Semua bahan sudah masuk dalam resep ini.</p>
                                    <p className="text-xs mt-0.5 text-amber-600">Untuk menambah bahan baru, tambahkan dulu di tab <strong>Bahan Baku</strong>. Untuk mengubah jumlah, edit langsung angka di kolom "Jumlah / Porsi" di tabel atas.</p>
                                </div>
                            </div>
                        )}

                        {/* Pesan jika belum ada bahan sama sekali */}
                        {ingredients.length === 0 && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-700">
                                ℹ️ Belum ada bahan baku. Tambahkan dulu di tab <strong>Bahan Baku</strong>.
                            </div>
                        )}

                        {/* Form hanya tampil jika ada bahan yang bisa ditambahkan */}
                        {bahanBelumDipakai.length > 0 && (
                            <div className="flex flex-col md:flex-row gap-3">
                                <select
                                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    value={formIngredientId}
                                    onChange={e => setFormIngredientId(e.target.value)}
                                >
                                    <option value="">— Pilih bahan baku —</option>
                                    {bahanBelumDipakai.map(ing => (
                                        <option key={ing.id} value={ing.id}>
                                            {ing.name} ({ing.unit}) · stok: {ing.current_stock}
                                        </option>
                                    ))}
                                </select>
                                <div className="flex items-center gap-2">
                                    <div className="flex flex-col">
                                        <input
                                            type="number"
                                            min={0.1}
                                            step={0.1}
                                            placeholder="Qty/porsi"
                                            className="w-28 border border-gray-200 rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            value={formQty}
                                            onChange={e => setFormQty(parseFloat(e.target.value) || 0)}
                                        />
                                    </div>
                                    <button
                                        onClick={tambahBahan}
                                        disabled={!formIngredientId || formQty <= 0 || saving}
                                        className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                                        title={!formIngredientId ? 'Pilih bahan dulu' : formQty <= 0 ? 'Isi jumlah lebih dari 0' : 'Tambah ke resep'}
                                    >
                                        {saving ? 'Menyimpan...' : '+ Tambah'}
                                    </button>
                                </div>
                                {/* Hint jika belum pilih bahan */}
                                {!formIngredientId && (
                                    <p className="text-xs text-gray-400 mt-1 md:hidden">← Pilih bahan dari dropdown terlebih dahulu</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
