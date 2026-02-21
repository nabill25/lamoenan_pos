import { forwardRef } from 'react';

interface ReceiptProps {
  orderData: {
    id: string;
    date: string;
    items: any[];
    total: number;
    paymentMethod: string;
    cashierName?: string;
  } | null;
}

export const Receipt = forwardRef<HTMLDivElement, ReceiptProps>(({ orderData }, ref) => {
  if (!orderData) return null;

  return (
    <div ref={ref} className="hidden-print w-[58mm] p-2 font-mono text-[10px] leading-tight bg-white text-black">
      {/* Header */}
      <div className="text-center mb-2 border-b border-black pb-2 border-dashed">
        <h1 className="font-bold text-sm uppercase">Lamoenan Cafe</h1>
        <p>Jl. Kopi Nikmat No. 1</p>
        <p>Jakarta Selatan</p>
        <p className="mt-1">{orderData.date}</p>
      </div>

      {/* Info Transaksi */}
      <div className="mb-2">
        <p>Order ID: #{orderData.id.slice(0, 8)}</p>
        <p>Kasir: {orderData.cashierName || 'Owner'}</p>
        <p>Metode: {orderData.paymentMethod.toUpperCase()}</p>
      </div>

      {/* Item List */}
      <div className="border-b border-black pb-2 mb-2 border-dashed">
        {orderData.items.map((item: any, index: number) => (
          <div key={index} className="flex justify-between mb-1">
            <span className="w-8">{item.quantity}x</span>
            <span className="flex-1 truncate">{item.name}</span>
            <span className="text-right">
              {(item.price * item.quantity).toLocaleString('id-ID')}
            </span>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="flex justify-between font-bold text-xs mb-4">
        <span>TOTAL</span>
        <span>Rp {orderData.total.toLocaleString('id-ID')}</span>
      </div>

      {/* Footer */}
      <div className="text-center mt-4">
        <p>*** TERIMA KASIH ***</p>
        <p>Silakan datang kembali!</p>
        <p className="mt-2 text-[8px]">Powered by Lamoenan POS</p>
      </div>
    </div>
  );
});

Receipt.displayName = 'Receipt';