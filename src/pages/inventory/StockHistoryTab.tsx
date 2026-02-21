import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import type { StockMovement } from '../../types/inventory';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';

export default function StockHistoryTab() {
    const [history, setHistory] = useState<StockMovement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        const { data, error } = await supabase
            .from('stock_movements')
            .select('*, ingredient:ingredients(name, unit)')
            .order('created_at', { ascending: false })
            .limit(50); // Limit to last 50 for performance

        if (error) console.error('Error fetching history:', error);
        else setHistory((data as any) || []);
        setLoading(false);
    };

    return (
        <div className="space-y-6">
            <div className="bg-white border border-gray-100 rounded-lg overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-3">Waktu</th>
                            <th className="px-6 py-3">Bahan</th>
                            <th className="px-6 py-3">Tipe</th>
                            <th className="px-6 py-3 text-right">Jumlah</th>
                            <th className="px-6 py-3">Catatan</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Memuat riwayat...</td></tr>
                        ) : history.length === 0 ? (
                            <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Belum ada riwayat stok.</td></tr>
                        ) : (
                            history.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-gray-600">
                                        {format(new Date(item.created_at), 'dd MMM yyyy HH:mm', { locale: localeId })}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-900">
                                        {item.ingredient?.name || 'Unknown Item'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${item.type === 'in'
                                                ? 'bg-green-100 text-green-700'
                                                : item.type === 'out'
                                                    ? 'bg-red-100 text-red-700'
                                                    : 'bg-blue-100 text-blue-700'
                                                }`}
                                        >
                                            {item.type === 'in' ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                                            {item.type === 'in' ? 'Masuk' : item.type === 'out' ? 'Keluar' : 'Adjustment'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-medium">
                                        {item.type === 'out' ? '-' : '+'}{item.quantity} {item.ingredient?.unit}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 italic">
                                        {item.notes || '-'}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
