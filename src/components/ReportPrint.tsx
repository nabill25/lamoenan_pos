import { forwardRef } from 'react';

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  payment_type: string;
  status: string;
}

interface ItemSales {
  name: string;
  quantity: number;
  total: number;
}

interface ReportPrintProps {
  data: Order[];
  summary: {
    totalRevenue: number;
    totalOrders: number;
    avgOrder: number;
    grossProfit: number;
    marginPersen: number;
  };
  itemSales: ItemSales[];
  period: string;
}

export const ReportPrint = forwardRef<HTMLDivElement, ReportPrintProps>(
  ({ data, summary, itemSales, period }, ref) => {
    return (
      <div ref={ref} className="p-8 font-sans text-slate-900 bg-white w-[210mm] min-h-[297mm]">

        {/* Header Laporan */}
        <div className="border-b-2 border-slate-800 pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold uppercase tracking-wider">Lamoenan Cafe</h1>
              <p className="text-sm text-slate-500 mt-1">& Bistro</p>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-semibold text-slate-700">LAPORAN PENJUALAN</h2>
              <p className="text-sm font-medium bg-slate-100 px-3 py-1 rounded inline-block mt-2 uppercase">
                Periode: {period}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Dicetak: {new Date().toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </div>

        {/* Ringkasan Keuangan (4 kotak, termasuk Laba Kotor) */}
        <div className="grid grid-cols-4 gap-3 mb-8">
          <div className="border p-3 rounded-lg bg-slate-50">
            <p className="text-[10px] text-slate-500 uppercase font-bold">Total Pendapatan</p>
            <p className="text-lg font-bold mt-1">Rp {summary.totalRevenue.toLocaleString('id-ID')}</p>
          </div>
          <div className="border p-3 rounded-lg bg-slate-50">
            <p className="text-[10px] text-slate-500 uppercase font-bold">Laba Kotor (HPP)</p>
            <p className={`text-lg font-bold mt-1 ${summary.grossProfit >= 0 ? 'text-green-700' : 'text-red-600'}`}>
              Rp {summary.grossProfit.toLocaleString('id-ID')}
            </p>
            <p className="text-[10px] text-slate-400">Margin: {summary.marginPersen.toFixed(1)}%</p>
          </div>
          <div className="border p-3 rounded-lg bg-slate-50">
            <p className="text-[10px] text-slate-500 uppercase font-bold">Total Transaksi</p>
            <p className="text-lg font-bold mt-1">{summary.totalOrders}</p>
          </div>
          <div className="border p-3 rounded-lg bg-slate-50">
            <p className="text-[10px] text-slate-500 uppercase font-bold">Rata-rata Order</p>
            <p className="text-lg font-bold mt-1">Rp {Math.round(summary.avgOrder).toLocaleString('id-ID')}</p>
          </div>
        </div>

        {/* Rincian Penjualan Per Menu */}
        <div className="mb-8">
          <h3 className="text-base font-bold text-slate-800 mb-3 border-b pb-2">
            Rincian Penjualan Menu
          </h3>
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-xs">
              <tr>
                <th className="px-4 py-2">#</th>
                <th className="px-4 py-2">Nama Menu</th>
                <th className="px-4 py-2 text-right">Terjual (Qty)</th>
                <th className="px-4 py-2 text-right">Total Pendapatan</th>
                <th className="px-4 py-2 text-right">Kontribusi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {itemSales.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-slate-400">
                    Tidak ada data menu terjual.
                  </td>
                </tr>
              ) : (
                itemSales.map((item, index) => {
                  const kontribusi =
                    summary.totalRevenue > 0
                      ? ((item.total / summary.totalRevenue) * 100).toFixed(1)
                      : '0.0';
                  return (
                    <tr key={index} className="hover:bg-slate-50">
                      <td className="px-4 py-2 text-slate-400">{index + 1}</td>
                      <td className="px-4 py-2 font-medium">{item.name}</td>
                      <td className="px-4 py-2 text-right">{item.quantity}</td>
                      <td className="px-4 py-2 text-right">Rp {item.total.toLocaleString('id-ID')}</td>
                      <td className="px-4 py-2 text-right text-slate-500">{kontribusi}%</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Riwayat Transaksi */}
        <h3 className="text-base font-bold text-slate-800 mb-3 border-b pb-2">Riwayat Transaksi</h3>
        <table className="w-full text-sm text-left mb-8">
          <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-xs">
            <tr>
              <th className="px-4 py-2">No</th>
              <th className="px-4 py-2">Waktu</th>
              <th className="px-4 py-2">Order ID</th>
              <th className="px-4 py-2">Metode</th>
              <th className="px-4 py-2 text-right">Jumlah</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {data.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-slate-400">
                  Tidak ada data transaksi.
                </td>
              </tr>
            ) : (
              data.map((order, index) => (
                <tr key={order.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2">{index + 1}</td>
                  <td className="px-4 py-2">
                    {new Date(order.created_at).toLocaleString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-4 py-2 font-mono text-xs">{order.id.slice(0, 8)}...</td>
                  <td className="px-4 py-2 uppercase text-xs font-bold">{order.payment_type}</td>
                  <td className="px-4 py-2 text-right font-medium">
                    Rp {order.total_amount.toLocaleString('id-ID')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot className="border-t-2 border-slate-300 font-bold bg-slate-50">
            <tr>
              <td colSpan={4} className="px-4 py-3 text-right uppercase">
                Total Periode Ini
              </td>
              <td className="px-4 py-3 text-right text-base">
                Rp {summary.totalRevenue.toLocaleString('id-ID')}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Footer Tanda Tangan */}
        <div className="flex justify-between items-end mt-8">
          <p className="text-xs text-slate-400">
            *Laba Kotor = Total Pendapatan – Total HPP yang tercatat saat transaksi.
          </p>
          <div className="text-center w-48">
            <p className="text-sm text-slate-500 mb-16">Mengetahui,</p>
            <div className="border-b border-slate-400"></div>
            <p className="text-sm font-bold mt-2">Manager / Owner</p>
          </div>
        </div>
      </div>
    );
  }
);

ReportPrint.displayName = 'ReportPrint';