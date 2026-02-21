import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Search, Filter, AlertCircle, Edit2, Archive } from 'lucide-react';
import type { Ingredient, IngredientCategory } from '../../types/inventory';

export default function IngredientsTab() {
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [categories, setCategories] = useState<IngredientCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterCategory, setFilterCategory] = useState<string>('all');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
    const [currentIngredient, setCurrentIngredient] = useState<Ingredient | null>(null);

    // Stock Adjustment State
    const [adjustmentType, setAdjustmentType] = useState<'in' | 'out'>('in');
    const [adjustmentQty, setAdjustmentQty] = useState(0);
    const [adjustmentNotes, setAdjustmentNotes] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        unit: 'pcs',
        min_stock: 0,
        category_id: '',
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const [ingredientsReq, categoriesReq] = await Promise.all([
            supabase.from('ingredients').select('*, category:ingredient_categories(*)').order('name'),
            supabase.from('ingredient_categories').select('*').order('name')
        ]);

        if (ingredientsReq.error) console.error('Error fetching ingredients:', ingredientsReq.error);
        if (categoriesReq.error) console.error('Error fetching categories:', categoriesReq.error);

        setIngredients((ingredientsReq.data as any) || []);
        setCategories((categoriesReq.data as any) || []);
        setLoading(false);
    };

    const handleSave = async () => {
        if (!formData.name) return;

        const payload = {
            name: formData.name,
            unit: formData.unit,
            min_stock: formData.min_stock,
            category_id: formData.category_id || null,
        };

        if (currentIngredient) {
            // Update
            const { error } = await supabase
                .from('ingredients')
                .update(payload)
                .eq('id', currentIngredient.id);

            if (!error) {
                setIsModalOpen(false);
                fetchData();
            }
        } else {
            // Create
            const { error } = await supabase
                .from('ingredients')
                .insert(payload);

            if (!error) {
                setIsModalOpen(false);
                fetchData();
            }
        }
    };

    const openAdjustment = (ingredient: Ingredient) => {
        setCurrentIngredient(ingredient);
        setAdjustmentType('in');
        setAdjustmentQty(0);
        setAdjustmentNotes('');
        setIsAdjustmentModalOpen(true);
    };

    const submitAdjustment = async () => {
        if (!currentIngredient || adjustmentQty <= 0) return;

        // 1. Record movement
        const { error: moveError } = await supabase
            .from('stock_movements')
            .insert({
                ingredient_id: currentIngredient.id,
                type: adjustmentType,
                quantity: adjustmentQty,
                notes: adjustmentNotes || 'Manual Adjustment'
            });

        if (moveError) {
            alert('Gagal mencatat riwayat stok');
            return;
        }

        // 2. Update stock
        const newStock = adjustmentType === 'in'
            ? currentIngredient.current_stock + adjustmentQty
            : currentIngredient.current_stock - adjustmentQty;

        const { error: updateError } = await supabase
            .from('ingredients')
            .update({ current_stock: newStock })
            .eq('id', currentIngredient.id);

        if (updateError) {
            alert('Gagal update jumlah stok');
        } else {
            setIsAdjustmentModalOpen(false);
            fetchData(); // Refresh to show new stock
        }
    };

    const filteredIngredients = ingredients.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = filterCategory === 'all' || item.category_id === filterCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 justify-between">
                <div className="flex gap-4 flex-1">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Cari bahan..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="relative">
                        <select
                            className="appearance-none pl-10 pr-8 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                        >
                            <option value="all">Semua Kategori</option>
                            {categories.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        <Filter className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    </div>
                </div>
                <button
                    onClick={() => {
                        setCurrentIngredient(null);
                        setFormData({ name: '', unit: 'pcs', min_stock: 0, category_id: '' });
                        setIsModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                >
                    <Plus size={18} />
                    Tambah Bahan
                </button>
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-100 rounded-lg overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-3">Nama Bahan</th>
                            <th className="px-6 py-3">Kategori</th>
                            <th className="px-6 py-3">Stok Saat Ini</th>
                            <th className="px-6 py-3 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">Memuat data...</td></tr>
                        ) : filteredIngredients.length === 0 ? (
                            <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">Tidak ada data ditemukan.</td></tr>
                        ) : (
                            filteredIngredients.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{item.name}</div>
                                        {item.current_stock <= item.min_stock && (
                                            <div className="flex items-center gap-1 text-xs text-red-500 font-bold mt-1">
                                                <AlertCircle size={12} /> Stok Menipis (Min: {item.min_stock})
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {item.category ? (
                                            <span className="bg-gray-100 px-2.5 py-1 rounded text-xs text-gray-600">
                                                {item.category.name}
                                            </span>
                                        ) : '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">
                                            {item.current_stock} <span className="text-gray-500 font-normal text-xs">{item.unit}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => openAdjustment(item)}
                                                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                                                title="Atur Stok"
                                            >
                                                <Archive size={16} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setCurrentIngredient(item);
                                                    setFormData({
                                                        name: item.name,
                                                        unit: item.unit,
                                                        min_stock: item.min_stock,
                                                        category_id: item.category_id || '',
                                                    });
                                                    setIsModalOpen(true);
                                                }}
                                                className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded"
                                                title="Edit"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white rounded-xl w-full max-w-md p-6">
                        <h3 className="text-lg font-bold mb-4">
                            {currentIngredient ? 'Edit Bahan Baku' : 'Tambah Bahan Baku'}
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Bahan</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Satuan</label>
                                    <select
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        value={formData.unit}
                                        onChange={e => setFormData({ ...formData, unit: e.target.value })}
                                    >
                                        <option value="pcs">Pcs</option>
                                        <option value="kg">Kg</option>
                                        <option value="gram">Gram</option>
                                        <option value="liter">Liter</option>
                                        <option value="ml">Milliliter</option>
                                        <option value="pack">Pack</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Min. Stok</label>
                                    <input
                                        type="number"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        value={formData.min_stock}
                                        onChange={e => setFormData({ ...formData, min_stock: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                                <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    value={formData.category_id}
                                    onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                                >
                                    <option value="">Pilih Kategori</option>
                                    {categories.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex-1 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                            >
                                Simpan
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Stock Adjustment Modal */}
            {isAdjustmentModalOpen && currentIngredient && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white rounded-xl w-full max-w-sm p-6 text-center">
                        <h3 className="text-lg font-bold mb-1">Sesuaikan Stok</h3>
                        <p className="text-sm text-gray-500 mb-6">{currentIngredient.name}</p>

                        <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
                            <button
                                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${adjustmentType === 'in' ? 'bg-white shadow text-green-600' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                onClick={() => setAdjustmentType('in')}
                            >
                                Stok Masuk (+Add)
                            </button>
                            <button
                                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${adjustmentType === 'out' ? 'bg-white shadow text-red-600' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                onClick={() => setAdjustmentType('out')}
                            >
                                Stok Keluar (-Reduce)
                            </button>
                        </div>

                        <div className="space-y-4 text-left">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Jumlah</label>
                                <input
                                    type="number"
                                    className="w-full text-center text-2xl font-bold py-2 border-b-2 border-gray-200 focus:border-amber-500 focus:outline-none"
                                    value={adjustmentQty}
                                    onChange={e => setAdjustmentQty(parseInt(e.target.value) || 0)}
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Catatan (Optional)</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    placeholder="Contoh: Belanja harian, Bahan rusak, dll"
                                    value={adjustmentNotes}
                                    onChange={e => setAdjustmentNotes(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setIsAdjustmentModalOpen(false)}
                                className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
                            >
                                Batal
                            </button>
                            <button
                                onClick={submitAdjustment}
                                disabled={adjustmentQty <= 0}
                                className="flex-1 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium disabled:opacity-50"
                            >
                                Konfirmasi
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
