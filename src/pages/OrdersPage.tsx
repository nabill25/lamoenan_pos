import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Calendar, X, AlertTriangle, Ban } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.tsx';

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  payment_type: string;
  status: string;
  table_name?: string;
  member_id?: string;
  promo_code?: string;
  voided_at?: string;
  void_reason?: string;
}

type FilterPeriode = 'semua' | 'hari_ini' | 'minggu_ini' | 'bulan_ini';

const labelPeriode: Record<FilterPeriode, string> = {
  semua: 'Semua',
  hari_ini: 'Hari Ini',
  minggu_ini: '7 Hari',
  bulan_ini: 'Bulan Ini',
};

export default function OrdersPage() {
  const { user } = useAuth();
  const [semuaOrders, setSemuaOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPeriode, setFilterPeriode] = useState<FilterPeriode>('hari_ini');
  const [filterStatus, setFilterStatus] = useState<'semua' | 'aktif' | 'void'>('aktif');
  const [cariId, setCariId] = useState('');

  // Void modal state
  const [voidTarget, setVoidTarget] = useState<Order | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [voiding, setVoiding] = useState(false);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('id, created_at, total_amount, payment_type, status, table_name, member_id, promo_code, voided_at, void_reason')
      .order('created_at', { ascending: false });
    if (error) console.error(error);
    else setSemuaOrders(data || []);
    setLoading(false);
  };

  const handleVoid = async () => {
    if (!voidTarget || !voidReason.trim()) return;
    setVoiding(true);
    const { error } = await supabase.from('orders').update({
      voided_at: new Date().toISOString(),
      void_reason: voidReason,
      voided_by: user?.id,
      status: 'voided',
    }).eq('id', voidTarget.id);

    if (error) {
      alert('Gagal void: ' + error.message);
    } else {
      setVoidTarget(null);
      setVoidReason('');
      fetchOrders();
    }
    setVoiding(false);
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

    if (filterStatus === 'aktif' && order.voided_at) return false;
    if (filterStatus === 'void' && !order.voided_at) return false;
    if (cariId && !order.id.toLowerCase().includes(cariId.toLowerCase())) return false;
    return true;
  });

  const totalPendapatan = filteredOrders
    .filter(o => !o.voided_at)
    .reduce((sum, o) => sum + o.total_amount, 0);

  return (
    <div className="p-4">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900">Riwayat Pesanan</h1>
        <p className="text-gray-500 text-sm">Daftar semua transaksi. Transaksi yang salah dapat di-void.</p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Transaksi Aktif</p>
          <p className="text-2xl font-bold text-slate-900 mt-0.5">{filteredOrders.filter(o => !o.voided_at).length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total</p>
          <p className="text-lg font-bold text-green-600 mt-0.5">Rp {totalPendapatan.toLocaleString('id-ID')}</p>
        </div>
      </div>

      {/* FILTER */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 mb-4 space-y-3">
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase mb-2">Periode</p>
          <div className="grid grid-cols-4 gap-1.5">
            {(Object.keys(labelPeriode) as FilterPeriode[]).map(p => (
              <button key={p} onClick={() => setFilterPeriode(p)}
                className={`py-1.5 px-1 rounded-lg text-xs font-medium transition-colors text-center ${filterPeriode === p ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-600'}`}>
                {labelPeriode[p]}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase mb-2">Status</p>
          <div className="flex gap-2">
            {(['aktif', 'semua', 'void'] as const).map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors ${filterStatus === s ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                {s === 'aktif' ? 'Aktif' : s === 'void' ? 'Void' : 'Semua'}
              </button>
            ))}
          </div>
        </div>
        <div className="relative">
          <svg className="absolute left-3 top-2.5 text-gray-400 w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input type="text" placeholder="Cari Order ID..." className="w-full pl-8 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" value={cariId} onChange={e => setCariId(e.target.value)} />
        </div>
      </div>

      {/* LIST */}
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
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredOrders.map(order => (
              <div key={order.id} className={`px-4 py-3 ${order.voided_at ? 'bg-red-50/50 opacity-70' : ''}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs text-gray-700 font-semibold">#{order.id.slice(0, 8)}...</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${order.payment_type === 'qris' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                      {order.payment_type}
                    </span>
                    {order.promo_code && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">{order.promo_code}</span>
                    )}
                    {order.voided_at ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 flex items-center gap-1">
                        <Ban size={9} /> VOID
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                        {order.status}
                      </span>
                    )}
                  </div>
                  {/* VOID BUTTON — hanya tampil jika belum void dan dalam 24 jam */}
                  {!order.voided_at && (
                    <button
                      onClick={() => setVoidTarget(order)}
                      className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                      title="Void Transaksi"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-400 flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      <Calendar size={11} />
                      {new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {order.table_name && <span className="text-gray-300">·</span>}
                    {order.table_name && <span>{order.table_name}</span>}
                  </div>
                  <span className={`font-bold text-sm ${order.voided_at ? 'line-through text-gray-400' : 'text-slate-900'}`}>
                    Rp {order.total_amount.toLocaleString('id-ID')}
                  </span>
                </div>
                {order.void_reason && (
                  <p className="text-[10px] text-red-500 mt-1 italic">Alasan void: {order.void_reason}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* VOID CONFIRMATION MODAL */}
      {voidTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="bg-red-500 text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2"><AlertTriangle size={18} /> Void Transaksi</h3>
              <button onClick={() => setVoidTarget(null)} className="p-1 hover:bg-red-400 rounded"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-gray-50 rounded-xl p-3 text-sm">
                <p className="text-gray-500 text-xs mb-1">Order ID</p>
                <p className="font-mono font-bold text-gray-900">#{voidTarget.id.slice(0, 16)}...</p>
                <p className="font-bold text-red-600 mt-1">Rp {voidTarget.total_amount.toLocaleString('id-ID')}</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Alasan Void <span className="text-red-500">*</span></label>
                <textarea
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-400"
                  rows={3}
                  placeholder="Masukkan alasan void (wajib)..."
                  value={voidReason}
                  onChange={e => setVoidReason(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => { setVoidTarget(null); setVoidReason(''); }} className="py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
                  Batal
                </button>
                <button
                  onClick={handleVoid}
                  disabled={voiding || !voidReason.trim()}
                  className="py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-colors"
                >
                  {voiding ? 'Memproses...' : 'Ya, Void Sekarang'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}