// HALAMAN: Riwayat Pesanan (OrdersPage.tsx)
// Menambahkan filter berdasarkan: periode waktu (harian/mingguan/bulanan), metode bayar, dan pencarian ID

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Calendar, Search, Filter } from 'lucide-react';

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  payment_type: string;
  status: string;
}

type FilterPeriode = 'semua' | 'hari_ini' | 'minggu_ini' | 'bulan_ini';
type FilterMetode = 'semua' | 'cash' | 'qris';

export default function OrdersPage() {
  // State data
  const [semuaOrders, setSemuaOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // State filter
  const [filterPeriode, setFilterPeriode] = useState<FilterPeriode>('hari_ini');
  const [filterMetode, setFilterMetode] = useState<FilterMetode>('semua');
  const [cariId, setCariId] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) console.error('Error fetching orders:', error);
    else setSemuaOrders(data || []);
    setLoading(false);
  };

  // --- LOGIKA FILTER ---
  const filteredOrders = semuaOrders.filter((order) => {
    const orderDate = new Date(order.created_at);
    const sekarang = new Date();

    // Filter Periode
    if (filterPeriode === 'hari_ini') {
      const cocok =
        orderDate.getDate() === sekarang.getDate() &&
        orderDate.getMonth() === sekarang.getMonth() &&
        orderDate.getFullYear() === sekarang.getFullYear();
      if (!cocok) return false;
    } else if (filterPeriode === 'minggu_ini') {
      const tujuhHariLalu = new Date();
      tujuhHariLalu.setDate(sekarang.getDate() - 7);
      if (orderDate < tujuhHariLalu) return false;
    } else if (filterPeriode === 'bulan_ini') {
      const cocok =
        orderDate.getMonth() === sekarang.getMonth() &&
        orderDate.getFullYear() === sekarang.getFullYear();
      if (!cocok) return false;
    }

    // Filter Metode Pembayaran
    if (filterMetode !== 'semua' && order.payment_type !== filterMetode) {
      return false;
    }

    // Filter Pencarian ID
    if (cariId && !order.id.toLowerCase().includes(cariId.toLowerCase())) {
      return false;
    }

    return true;
  });

  // Hitung total pendapatan dari hasil filter
  const totalPendapatan = filteredOrders.reduce(
    (sum, order) => sum + order.total_amount,
    0
  );

  const labelPeriode: Record<FilterPeriode, string> = {
    semua: 'Semua Waktu',
    hari_ini: 'Hari Ini',
    minggu_ini: '7 Hari Terakhir',
    bulan_ini: 'Bulan Ini',
  };

  return (
    <div className="p-6">
      {/* --- HEADER --- */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Riwayat Pesanan</h1>
          <p className="text-gray-500">Daftar semua transaksi yang masuk.</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-white px-4 py-2 border border-gray-200 rounded-lg shadow-sm text-sm font-medium text-gray-600">
            Transaksi:{' '}
            <span className="text-slate-900 font-bold">{filteredOrders.length}</span>
          </div>
          <div className="bg-white px-4 py-2 border border-gray-200 rounded-lg shadow-sm text-sm font-medium text-gray-600">
            Total:{' '}
            <span className="text-green-600 font-bold">
              Rp {totalPendapatan.toLocaleString('id-ID')}
            </span>
          </div>
        </div>
      </div>

      {/* --- PANEL FILTER --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">

          {/* Filter Periode */}
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-400 flex-shrink-0" />
            <span className="text-xs font-bold text-gray-500 uppercase whitespace-nowrap">Periode:</span>
            <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
              {(['semua', 'hari_ini', 'minggu_ini', 'bulan_ini'] as FilterPeriode[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setFilterPeriode(p)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${filterPeriode === p
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  {labelPeriode[p]}
                </button>
              ))}
            </div>
          </div>

          {/* Filter Metode Bayar */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 uppercase whitespace-nowrap">Metode:</span>
            <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
              {(['semua', 'cash', 'qris'] as FilterMetode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setFilterMetode(m)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors uppercase ${filterMetode === m
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  {m === 'semua' ? 'Semua' : m.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Pencarian ID */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
            <input
              type="text"
              placeholder="Cari Order ID..."
              className="w-full pl-8 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={cariId}
              onChange={(e) => setCariId(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* --- TABEL ORDERS --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header tabel — hanya desktop */}
        <div className="hidden md:grid grid-cols-5 bg-gray-50 p-4 border-b border-gray-100 font-medium text-sm text-gray-500">
          <div className="col-span-2">ORDER ID</div>
          <div>TANGGAL</div>
          <div>TOTAL</div>
          <div className="text-right">STATUS</div>
        </div>

        <div className="divide-y divide-gray-100">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Memuat data...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <p className="font-medium">Tidak ada transaksi.</p>
              <p className="text-xs mt-1">Coba ubah filter yang dipilih.</p>
            </div>
          ) : filteredOrders.map((order) => (
            <div key={order.id}>
              {/* ── MOBILE CARD ── */}
              <div className="md:hidden p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="font-mono text-xs text-gray-600 font-semibold">#{order.id.slice(0, 8)}...</span>
                    <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${order.payment_type === 'qris' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                      }`}>{order.payment_type}</span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${order.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>{order.status}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">
                    {new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="font-bold text-slate-900 text-sm">Rp {order.total_amount.toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* ── DESKTOP ROW ── */}
              <div className="hidden md:grid grid-cols-5 p-4 items-center hover:bg-gray-50 transition-colors text-sm">
                <div className="col-span-2 flex items-center gap-2">
                  <span className="font-mono text-gray-600 truncate pr-4" title={order.id}>#{order.id.slice(0, 8)}...</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${order.payment_type === 'qris' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                    }`}>{order.payment_type}</span>
                </div>
                <div className="text-gray-600 flex items-center gap-2">
                  <Calendar size={14} />
                  {new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="font-bold text-slate-900">Rp {order.total_amount.toLocaleString('id-ID')}</div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${order.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>{order.status.toUpperCase()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}