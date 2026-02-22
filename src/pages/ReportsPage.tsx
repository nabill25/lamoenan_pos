import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, ShoppingBag, Printer, Calendar, ReceiptText, TrendingDown } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { ReportPrint } from '../components/ReportPrint';

type TipeFilter = 'daily' | 'weekly' | 'monthly';

const LABEL_FILTER: Record<TipeFilter, string> = {
  daily: 'Hari Ini',
  weekly: '7 Hari Terakhir',
  monthly: 'Bulan Ini',
};

export default function ReportsPage() {
  const [semuaOrders, setSemuaOrders] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [itemSales, setItemSales] = useState<any[]>([]);
  const [promoUsage, setPromoUsage] = useState<any[]>([]);
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    avgOrder: 0,
    grossProfit: 0,
    marginPersen: 0,
    totalDiscounts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<TipeFilter>('daily');

  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Laporan_Penjualan_${LABEL_FILTER[filterType]}`,
  });

  useEffect(() => {
    fetchSemuaOrders();
  }, []);

  // Ambil semua order beserta detail item (termasuk cost untuk HPP)
  const fetchSemuaOrders = async () => {
    // Coba fetch dengan kolom cost (untuk kalkulasi HPP)
    let { data: orders, error } = await supabase
      .from('orders')
      .select('*, order_items(name, quantity, price, cost)')
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    // Jika kolom 'cost' belum ada di DB, fallback ke query tanpa cost
    if (error && error.code === '42703') {
      console.warn('Kolom cost belum ada di order_items. Memuat laporan tanpa data HPP...');
      const fallback = await supabase
        .from('orders')
        .select('*, order_items(name, quantity, price)')
        .eq('status', 'completed')
        .order('created_at', { ascending: false });
      orders = fallback.data;
      error = fallback.error;
    }

    if (error) console.error('Error memuat laporan:', error);

    if (orders) {
      setSemuaOrders(orders);
      terapkanFilter(orders, 'daily');
    }
    setLoading(false);
  };

  // Filter orders berdasarkan periode waktu yang dipilih
  const terapkanFilter = (orders: any[], type: TipeFilter) => {
    setFilterType(type);
    const sekarang = new Date();

    const filtered = orders.filter((order) => {
      const tanggalOrder = new Date(order.created_at);

      if (type === 'daily') {
        return (
          tanggalOrder.getDate() === sekarang.getDate() &&
          tanggalOrder.getMonth() === sekarang.getMonth() &&
          tanggalOrder.getFullYear() === sekarang.getFullYear()
        );
      } else if (type === 'weekly') {
        const tujuhHariLalu = new Date();
        tujuhHariLalu.setDate(sekarang.getDate() - 7);
        return tanggalOrder >= tujuhHariLalu;
      } else if (type === 'monthly') {
        return (
          tanggalOrder.getMonth() === sekarang.getMonth() &&
          tanggalOrder.getFullYear() === sekarang.getFullYear()
        );
      }
      return true;
    });

    setFilteredData(filtered);
    hitungSummaryDanGrafik(filtered, type);
  };

  // Hitung summary, item sales, dan data grafik dari orders yang difilter
  const hitungSummaryDanGrafik = (orders: any[], type: TipeFilter) => {
    // Hitung pendapatan dan laba
    const totalRevenue = orders.reduce((sum, o) => sum + o.total_amount, 0);
    const totalOrders = orders.length;
    const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    let totalCost = 0;
    let totalDiscounts = 0;
    orders.forEach((order) => {
      totalDiscounts += order.discount_amount || 0;
      order.order_items?.forEach((item: any) => {
        totalCost += (item.cost || 0) * item.quantity;
      });
    });
    const grossProfit = totalRevenue - totalCost;
    // Persentase margin laba kotor: (labaKotor / pendapatan) * 100
    const marginPersen = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    setSummary({ totalRevenue, totalOrders, avgOrder, grossProfit, marginPersen, totalDiscounts });

    // Aggregasi penjualan per nama menu
    const mapMenu: Record<string, { quantity: number; total: number }> = {};
    orders.forEach((order) => {
      order.order_items?.forEach((item: any) => {
        if (!mapMenu[item.name]) mapMenu[item.name] = { quantity: 0, total: 0 };
        mapMenu[item.name].quantity += item.quantity;
        mapMenu[item.name].total += item.price * item.quantity;
      });
    });
    const sortedSales = Object.entries(mapMenu)
      .map(([name, val]) => ({ name, ...val }))
      .sort((a, b) => b.quantity - a.quantity);
    setItemSales(sortedSales);

    // Aggregasi penggunaan promo
    const mapPromo: Record<string, { count: number; totalDiscount: number }> = {};
    orders.forEach((order) => {
      if (order.promo_code) {
        if (!mapPromo[order.promo_code]) mapPromo[order.promo_code] = { count: 0, totalDiscount: 0 };
        mapPromo[order.promo_code].count += 1;
        mapPromo[order.promo_code].totalDiscount += order.discount_amount || 0;
      }
    });
    const sortedPromos = Object.entries(mapPromo)
      .map(([code, val]) => ({ code, ...val }))
      .sort((a, b) => b.count - a.count);
    setPromoUsage(sortedPromos);

    // Olah data untuk grafik bar
    // Jika filter harian, group by jam. Jika lainnya, group by tanggal.
    const ordersUrutLama = [...orders].reverse();
    const groupedData: Record<string, number> = {};

    ordersUrutLama.forEach((order) => {
      let kunci: string;
      if (type === 'daily') {
        // Untuk filter harian, tampilkan per jam (misal "14:00")
        kunci = new Date(order.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      } else {
        kunci = new Date(order.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
      }
      if (!groupedData[kunci]) groupedData[kunci] = 0;
      groupedData[kunci] += order.total_amount;
    });

    setChartData(Object.entries(groupedData).map(([name, revenue]) => ({ name, revenue })));
  };

  // Warna laba: hijau jika positif, merah jika negatif
  const warnaLaba = summary.grossProfit >= 0 ? 'text-green-700' : 'text-red-600';
  const bgLaba = summary.grossProfit >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500';

  return (
    <div className="p-6">
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laporan Penjualan</h1>
          <p className="text-gray-500">Analisa performa bisnis Lamoenan Cafe & Bistro.</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Tombol Filter Periode */}
          <div className="flex bg-white rounded-lg shadow-sm border border-gray-200 p-1">
            {(['daily', 'weekly', 'monthly'] as TipeFilter[]).map((type) => (
              <button
                key={type}
                onClick={() => terapkanFilter(semuaOrders, type)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition ${filterType === type
                  ? 'bg-slate-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                {LABEL_FILTER[type]}
              </button>
            ))}
          </div>

          {/* Tombol Cetak */}
          <button
            onClick={() => handlePrint()}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-medium transition shadow-sm"
          >
            <Printer size={18} /> Cetak Laporan
          </button>
        </div>
      </div>

      {/* Komponen cetak (sembunyi di luar layar) */}
      <div style={{ position: 'fixed', top: '-10000px', left: '-10000px' }}>
        <ReportPrint
          ref={printRef}
          data={filteredData}
          summary={summary}
          itemSales={itemSales}
          period={LABEL_FILTER[filterType]}
        />
      </div>

      {/* --- KARTU RINGKASAN (4 KARTU) --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {/* Pendapatan */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-lg flex-shrink-0">
              <DollarSign size={22} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 font-medium uppercase">Pendapatan · {LABEL_FILTER[filterType]}</p>
              <h3 className="text-xl font-bold text-gray-900 truncate">
                Rp {summary.totalRevenue.toLocaleString('id-ID')}
              </h3>
            </div>
          </div>
        </div>

        {/* Laba Kotor */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg flex-shrink-0 ${bgLaba}`}>
              {summary.grossProfit >= 0 ? <TrendingUp size={22} /> : <TrendingDown size={22} />}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 font-medium uppercase">Laba Kotor · {LABEL_FILTER[filterType]}</p>
              <h3 className={`text-xl font-bold truncate ${warnaLaba}`}>
                Rp {summary.grossProfit.toLocaleString('id-ID')}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Margin: {summary.marginPersen.toFixed(1)}%
                {totalCostIsZero(summary) && (
                  <span className="text-amber-500 ml-1">(cost belum diisi)</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Total Transaksi */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg flex-shrink-0">
              <ShoppingBag size={22} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 font-medium uppercase">Transaksi · {LABEL_FILTER[filterType]}</p>
              <h3 className="text-xl font-bold text-gray-900">{summary.totalOrders}</h3>
            </div>
          </div>
        </div>

        {/* Rata-rata Order */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-lg flex-shrink-0">
              <ReceiptText size={22} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 font-medium uppercase">Rata-rata Order</p>
              <h3 className="text-xl font-bold text-gray-900 truncate">
                Rp {Math.round(summary.avgOrder).toLocaleString('id-ID')}
              </h3>
            </div>
          </div>
        </div>

        {/* Total Diskon */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-100 text-amber-600 rounded-lg flex-shrink-0">
              <DollarSign size={22} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 font-medium uppercase">Total Diskon / Promo</p>
              <h3 className="text-xl font-bold text-gray-900 truncate">
                Rp {summary.totalDiscounts.toLocaleString('id-ID')}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* — GRAFIK PENDAPATAN — */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
        <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Calendar size={18} className="text-gray-400" />
          Grafik Pendapatan
          <span className="text-xs font-normal text-gray-400 ml-1">
            ({LABEL_FILTER[filterType]})
          </span>
        </h3>

        {loading ? (
          <div className="h-64 flex items-center justify-center text-gray-400">Memuat data...</div>
        ) : chartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
            Tidak ada data penjualan pada periode ini.
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 11 }}
                  dy={8}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 11 }}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  width={40}
                />
                <Tooltip
                  cursor={{ fill: '#f9fafb' }}
                  contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value: any) => [`Rp ${Number(value).toLocaleString('id-ID')}`, 'Pendapatan']}
                />
                <Bar dataKey="revenue" fill="#0f172a" radius={[4, 4, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* — TABEL RINCIAN MENU TERLARIS — */}
      {itemSales.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-base font-bold text-gray-800">
              Rincian Penjualan Menu
            </h3>
            <span className="text-xs text-gray-400">{LABEL_FILTER[filterType]} · {itemSales.length} menu</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                  <th className="px-5 py-3 text-left">#</th>
                  <th className="px-5 py-3 text-left">Nama Menu</th>
                  <th className="px-5 py-3 text-right">Terjual (Qty)</th>
                  <th className="px-5 py-3 text-right">Total Pendapatan</th>
                  <th className="px-5 py-3 text-right">Kontribusi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {itemSales.map((item, i) => {
                  const kontribusi =
                    summary.totalRevenue > 0
                      ? ((item.total / summary.totalRevenue) * 100).toFixed(1)
                      : '0.0';
                  return (
                    <tr key={item.name} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 text-gray-400 text-xs">{i + 1}</td>
                      <td className="px-5 py-3 font-medium text-gray-900">
                        {i === 0 && (
                          <span className="mr-2 text-amber-500 text-xs font-bold">🏆 Terlaris</span>
                        )}
                        {item.name}
                      </td>
                      <td className="px-5 py-3 text-right font-bold text-slate-700">
                        {item.quantity}
                      </td>
                      <td className="px-5 py-3 text-right text-gray-700">
                        Rp {item.total.toLocaleString('id-ID')}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-slate-700 h-1.5 rounded-full"
                              style={{ width: `${kontribusi}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 w-8 text-right">{kontribusi}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t-2 border-gray-200 bg-gray-50">
                <tr className="font-bold text-sm">
                  <td colSpan={2} className="px-5 py-3 text-gray-700">Total Keseluruhan</td>
                  <td className="px-5 py-3 text-right text-gray-700">
                    {itemSales.reduce((s, i) => s + i.quantity, 0)} pcs
                  </td>
                  <td className="px-5 py-3 text-right text-gray-700">
                    Rp {summary.totalRevenue.toLocaleString('id-ID')}
                  </td>
                  <td className="px-5 py-3 text-right text-gray-500">100%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* — TABEL PENGGUNAAN PROMO — */}
      {promoUsage.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-6">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-base font-bold text-gray-800">
              Rincian Penggunaan Promo / Voucher
            </h3>
            <span className="text-xs text-gray-400">{LABEL_FILTER[filterType]} · {promoUsage.length} promo</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                  <th className="px-5 py-3 text-left">#</th>
                  <th className="px-5 py-3 text-left">Kode Promo</th>
                  <th className="px-5 py-3 text-right">Digunakan (Kali)</th>
                  <th className="px-5 py-3 text-right">Total Diskon Diberikan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {promoUsage.map((item, i) => (
                  <tr key={item.code} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 text-gray-400 text-xs">{i + 1}</td>
                    <td className="px-5 py-3 font-bold text-amber-600">
                      {item.code}
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-slate-700">
                      {item.count}x
                    </td>
                    <td className="px-5 py-3 text-right text-gray-700 font-medium">
                      Rp {item.totalDiscount.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper: deteksi jika semua cost = 0 (belum diisi HPP)
function totalCostIsZero(summary: { grossProfit: number; totalRevenue: number }) {
  return summary.grossProfit === summary.totalRevenue && summary.totalRevenue > 0;
}