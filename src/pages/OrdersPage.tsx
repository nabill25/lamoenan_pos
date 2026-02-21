import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Calendar } from 'lucide-react';

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  payment_type: string;
  status: string;
}

type FilterPeriode = 'semua' | 'hari_ini' | 'minggu_ini' | 'bulan_ini';
type FilterMetode = 'semua' | 'cash' | 'qris';

const labelPeriode: Record<FilterPeriode, string> = {
  semua: 'Semua',
  hari_ini: 'Hari Ini',
  minggu_ini: '7 Hari',
  bulan_ini: 'Bulan Ini',
};

export default function OrdersPage() {
  const [semuaOrders, setSemuaOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPeriode, setFilterPeriode] = useState<FilterPeriode>('hari_ini');
  const [filterMetode, setFilterMetode] = useState<FilterMetode>('semua');
  const [cariId, setCariId] = useState('');

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) console.error(error);
    else setSemuaOrders(data || []);
    setLoading(false);
  };

  const filteredOrders = semuaOrders.filter((order) => {
    const orderDate = new Date(order.created_at);
    const sekarang = new Date();

    if (filterPeriode === 'hari_ini') {
      const cocok = orderDate.getDate() === sekarang.getDate() &&
        orderDate.getMonth() === sekarang.getMonth() &&
        orderDate.getFullYear() === sekarang.getFullYear();
      if (!cocok) return false;
    } else if (filterPeriode === 'minggu_ini') {
      const tujuh = new Date(); tujuh.setDate(sekarang.getDate() - 7);
      if (orderDate < tujuh) return false;
    } else if (filterPeriode === 'bulan_ini') {
      const cocok = orderDate.getMonth() === sekarang.getMonth() &&
        orderDate.getFullYear() === sekarang.getFullYear();
      if (!cocok) return false;
    }
    if (filterMetode !== 'semua' && order.payment_type !== filterMetode) return false;
    if (cariId && !order.id.toLowerCase().includes(cariId.toLowerCase())) return false;
    return true;
  });

  const totalPendapatan = filteredOrders.reduce((sum, o) => sum + o.total_amount, 0);

  return (
    <div className="p-4">
      {/* ===== HEADER ===== */}
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900">Riwayat Pesanan</h1>
        <p className="text-gray-500 text-sm">Daftar semua transaksi yang masuk.</p>
      </div>

      {/* ===== STATS CARDS ===== */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Transaksi</p>
          <p className="text-2xl font-bold text-slate-900 mt-0.5">{filteredOrders.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total</p>
          <p className="text-lg font-bold text-green-600 mt-0.5">Rp {totalPendapatan.toLocaleString('id-ID')}</p>
        </div>
      </div>

      {/* ===== FILTER PANEL ===== */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 mb-4 space-y-3">
        {/* Filter Periode */}
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase mb-2">Periode</p>
          <div className="grid grid-cols-4 gap-1.5">
            {(Object.keys(labelPeriode) as FilterPeriode[]).map(p => (
              <button
                key={p}
                onClick={() => setFilterPeriode(p)}
                className={`py-1.5 px-1 rounded-lg text-xs font-medium transition-colors text-center ${filterPeriode === p
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                {labelPeriode[p]}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Metode */}
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase mb-2">Metode Bayar</p>
          <div className="flex gap-2">
            {(['semua', 'cash', 'qris'] as FilterMetode[]).map(m => (
              <button
                key={m}
                onClick={() => setFilterMetode(m)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors ${filterMetode === m
                  ? 'bg-amber-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                {m === 'semua' ? 'Semua' : m.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Cari ID */}
        <div className="relative">
          <svg className="absolute left-3 top-2.5 text-gray-400 w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input
            type="text"
            placeholder="Cari Order ID..."
            className="w-full pl-8 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            value={cariId}
            onChange={e => setCariId(e.target.value)}
          />
        </div>
      </div>

      {/* ===== LIST ORDER ===== */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">
            <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Memuat data...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Calendar size={32} className="mx-auto mb-2 opacity-30" />
            <p className="font-medium text-sm">Tidak ada transaksi.</p>
            <p className="text-xs mt-1">Coba ubah filter yang dipilih.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredOrders.map(order => (
              <div key={order.id} className="px-4 py-3">
                {/* Baris 1: Order ID + badge metode + badge status */}
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-gray-700 font-semibold">
                      #{order.id.slice(0, 8)}...
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${order.payment_type === 'qris'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600'
                      }`}>
                      {order.payment_type}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${order.status === 'completed'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                    }`}>
                    {order.status}
                  </span>
                </div>
                {/* Baris 2: Tanggal + Total */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Calendar size={11} />
                    {new Date(order.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric', month: 'short',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                  <span className="font-bold text-slate-900 text-sm">
                    Rp {order.total_amount.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}