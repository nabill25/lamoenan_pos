import { useState } from 'react';
import { X, ChevronRight, Plus, Minus } from 'lucide-react';

export interface VariantOption {
    label: string;
    price_adj: number;
}

export interface VariantGroup {
    id: string;
    group_name: string;
    options: VariantOption[];
    is_required: boolean;
}

export interface SelectedVariant {
    group_name: string;
    label: string;
    price: number;
}

interface Props {
    item: {
        id: string;
        name: string;
        base_price: number;
        cost: number;
        image_url: string;
    };
    variants: VariantGroup[];
    onConfirm: (selections: SelectedVariant[], qty: number, notes: string) => void;
    onClose: () => void;
}

export default function VariantModal({ item, variants, onConfirm, onClose }: Props) {
    const [selections, setSelections] = useState<Record<string, SelectedVariant>>({});
    const [qty, setQty] = useState(1);
    const [notes, setNotes] = useState('');

    const selectOption = (group: VariantGroup, option: VariantOption) => {
        setSelections(prev => ({
            ...prev,
            [group.group_name]: {
                group_name: group.group_name,
                label: option.label,
                price: option.price_adj,
            }
        }));
    };

    const totalVariantAdj = Object.values(selections).reduce((sum, s) => sum + s.price, 0);
    const totalPrice = (item.base_price + totalVariantAdj) * qty;

    const canConfirm = variants
        .filter(v => v.is_required)
        .every(v => selections[v.group_name]);

    const handleConfirm = () => {
        if (!canConfirm) return;
        onConfirm(Object.values(selections), qty, notes);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white w-full md:max-w-lg md:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden max-h-[90dvh] flex flex-col">
                {/* Handle bar (mobile) */}
                <div className="md:hidden flex justify-center pt-3 pb-1 shrink-0">
                    <div className="w-10 h-1 bg-gray-200 rounded-full" />
                </div>

                {/* Header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b shrink-0">
                    {item.image_url && (
                        <img src={item.image_url} alt={item.name} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                        <h2 className="font-bold text-gray-900 text-base leading-tight">{item.name}</h2>
                        <p className="text-amber-600 font-bold text-sm">Rp {item.base_price.toLocaleString('id-ID')}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg shrink-0">
                        <X size={20} />
                    </button>
                </div>

                {/* Konten scroll */}
                <div className="flex-1 overflow-y-auto">
                    {/* Varian grup */}
                    {variants.length > 0 && (
                        <div className="p-4 space-y-5">
                            {variants.map(group => (
                                <div key={group.id}>
                                    <div className="flex items-center gap-2 mb-3">
                                        <h3 className="font-bold text-sm text-gray-900">{group.group_name}</h3>
                                        {group.is_required && (
                                            <span className="text-[10px] bg-red-100 text-red-600 font-bold px-1.5 py-0.5 rounded uppercase">Wajib</span>
                                        )}
                                        {!group.is_required && (
                                            <span className="text-[10px] bg-gray-100 text-gray-500 font-medium px-1.5 py-0.5 rounded uppercase">Opsional</span>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {group.options.map(opt => {
                                            const isSelected = selections[group.group_name]?.label === opt.label;
                                            return (
                                                <button
                                                    key={opt.label}
                                                    onClick={() => selectOption(group, opt)}
                                                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${isSelected
                                                            ? 'border-amber-500 bg-amber-50 text-amber-800'
                                                            : 'border-gray-200 text-gray-700 hover:border-gray-300'
                                                        }`}
                                                >
                                                    <span className="flex items-center gap-2">
                                                        <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${isSelected ? 'border-amber-500 bg-amber-500' : 'border-gray-300'
                                                            }`}>
                                                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                                                        </span>
                                                        {opt.label}
                                                    </span>
                                                    {opt.price_adj !== 0 && (
                                                        <span className={`text-xs ${isSelected ? 'text-amber-600' : 'text-gray-400'}`}>
                                                            {opt.price_adj > 0 ? '+' : ''}Rp {opt.price_adj.toLocaleString('id-ID')}
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Jika tidak ada varian */}
                    {variants.length === 0 && (
                        <div className="px-4 pt-4">
                            <p className="text-sm text-gray-400 text-center py-4 bg-gray-50 rounded-xl">Menu ini tidak memiliki varian.</p>
                        </div>
                    )}

                    {/* Catatan pesanan */}
                    <div className="px-4 pb-4">
                        <label className="block text-sm font-bold text-gray-700 mb-2 mt-2">
                            Catatan <span className="text-gray-400 font-normal">(opsional)</span>
                        </label>
                        <textarea
                            placeholder="contoh: tidak pakai es, gula sedikit..."
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500"
                            rows={2}
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                        />
                    </div>
                </div>

                {/* Footer: qty + tombol konfirmasi */}
                <div className="border-t p-4 bg-white shrink-0">
                    <div className="flex items-center gap-4 mb-3">
                        <div className="flex items-center gap-3 bg-gray-100 rounded-xl p-1">
                            <button
                                onClick={() => setQty(q => Math.max(1, q - 1))}
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white shadow-sm text-gray-700 hover:bg-gray-50"
                            >
                                <Minus size={14} />
                            </button>
                            <span className="font-bold text-gray-900 w-6 text-center">{qty}</span>
                            <button
                                onClick={() => setQty(q => q + 1)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white shadow-sm text-gray-700 hover:bg-gray-50"
                            >
                                <Plus size={14} />
                            </button>
                        </div>
                        <div className="flex-1 text-right">
                            <p className="text-xs text-gray-400">Total</p>
                            <p className="font-black text-lg text-gray-900">Rp {totalPrice.toLocaleString('id-ID')}</p>
                        </div>
                    </div>

                    <button
                        onClick={handleConfirm}
                        disabled={!canConfirm}
                        className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                        <Plus size={18} />
                        Tambah ke Keranjang
                        <ChevronRight size={16} />
                    </button>
                    {!canConfirm && (
                        <p className="text-xs text-center text-red-500 mt-2">
                            Pilih varian yang wajib terlebih dahulu
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
