import { useState } from 'react';
import { Package, Layers, History, UtensilsCrossed } from 'lucide-react';
import IngredientsTab from './inventory/IngredientsTab';
import CategoriesTab from './inventory/CategoriesTab';
import StockHistoryTab from './inventory/StockHistoryTab';
import RecipeTab from './inventory/RecipeTab';

export default function InventoryPage() {
    const [activeTab, setActiveTab] = useState<'ingredients' | 'categories' | 'history' | 'recipe'>('ingredients');

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Manajemen Bahan Baku</h1>
                <p className="text-gray-500">Kelola stok bahan baku, update stok, dan pantau riwayat.</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[600px]">
                {/* Tabs Header */}
                <div className="flex border-b border-gray-100 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('ingredients')}
                        className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'ingredients'
                            ? 'text-amber-600 border-b-2 border-amber-600 bg-amber-50/50'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        <Package size={18} />
                        Bahan Baku
                    </button>
                    <button
                        onClick={() => setActiveTab('categories')}
                        className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'categories'
                            ? 'text-amber-600 border-b-2 border-amber-600 bg-amber-50/50'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        <Layers size={18} />
                        Kategori Bahan
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'history'
                            ? 'text-amber-600 border-b-2 border-amber-600 bg-amber-50/50'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        <History size={18} />
                        Riwayat Stok
                    </button>
                    <button
                        onClick={() => setActiveTab('recipe')}
                        className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'recipe'
                            ? 'text-amber-600 border-b-2 border-amber-600 bg-amber-50/50'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        <UtensilsCrossed size={18} />
                        Resep Menu
                    </button>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                    {activeTab === 'ingredients' && <IngredientsTab />}
                    {activeTab === 'categories' && <CategoriesTab />}
                    {activeTab === 'history' && <StockHistoryTab />}
                    {activeTab === 'recipe' && <RecipeTab />}
                </div>
            </div>
        </div>
    );
}
