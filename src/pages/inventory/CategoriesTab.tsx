import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import type { IngredientCategory } from '../../types/inventory';

export default function CategoriesTab() {
    const [categories, setCategories] = useState<IngredientCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [tempName, setTempName] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [newName, setNewName] = useState('');

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        const { data, error } = await supabase
            .from('ingredient_categories')
            .select('*')
            .order('name');

        if (error) console.error('Error fetching categories:', error);
        else setCategories((data as any) || []);
        setLoading(false);
    };

    const addCategory = async () => {
        if (!newName.trim()) return;

        const { data, error } = await supabase
            .from('ingredient_categories')
            .insert({ name: newName })
            .select()
            .single();

        if (error) {
            alert('Gagal menambah kategori');
        } else {
            setCategories([...categories, data as any]);
            setNewName('');
            setIsAdding(false);
        }
    };

    const updateCategory = async (id: string) => {
        if (!tempName.trim()) return;

        const { error } = await supabase
            .from('ingredient_categories')
            .update({ name: tempName })
            .eq('id', id);

        if (error) {
            alert('Gagal update kategori');
        } else {
            setCategories(categories.map(c => c.id === id ? { ...c, name: tempName } : c));
            setEditingId(null);
        }
    };

    const deleteCategory = async (id: string) => {
        if (!window.confirm('Yakin ingin menghapus kategori ini?')) return;

        const { error } = await supabase
            .from('ingredient_categories')
            .delete()
            .eq('id', id);

        if (error) {
            alert('Gagal menghapus kategori');
        } else {
            setCategories(categories.filter(c => c.id !== id));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-800">Daftar Kategori Bahan</h2>
                <button
                    onClick={() => setIsAdding(true)}
                    disabled={isAdding}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
                >
                    <Plus size={18} />
                    Tambah Kategori
                </button>
            </div>

            {isAdding && (
                <div className="bg-amber-50 p-4 rounded-lg flex gap-3 animate-in fade-in slide-in-from-top-2">
                    <input
                        type="text"
                        placeholder="Nama Kategori Baru"
                        className="flex-1 px-4 py-2 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        autoFocus
                    />
                    <button
                        onClick={addCategory}
                        className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700"
                    >
                        Simpan
                    </button>
                    <button
                        onClick={() => setIsAdding(false)}
                        className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50"
                    >
                        Batal
                    </button>
                </div>
            )}

            {loading ? (
                <div className="text-center py-8 text-gray-500">Memuat kategori...</div>
            ) : categories.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg text-gray-500">
                    Belum ada kategori bahan.
                </div>
            ) : (
                <div className="grid gap-3">
                    {categories.map((category) => (
                        <div
                            key={category.id}
                            className="group flex items-center justify-between p-4 bg-white border border-gray-100 rounded-lg hover:border-amber-200 transition-colors"
                        >
                            {editingId === category.id ? (
                                <div className="flex-1 flex gap-3">
                                    <input
                                        type="text"
                                        className="flex-1 px-3 py-1.5 border border-amber-500 rounded focus:outline-none"
                                        value={tempName}
                                        onChange={(e) => setTempName(e.target.value)}
                                        autoFocus
                                    />
                                    <button onClick={() => updateCategory(category.id)} className="text-amber-600 hover:text-amber-700">
                                        <Save size={18} />
                                    </button>
                                    <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600">
                                        <X size={18} />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <span className="font-medium text-gray-700">{category.name}</span>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => {
                                                setEditingId(category.id);
                                                setTempName(category.name);
                                            }}
                                            className="p-1.5 text-gray-400 hover:text-amber-600 rounded"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => deleteCategory(category.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
