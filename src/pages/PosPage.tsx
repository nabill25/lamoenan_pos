import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useCartStore } from '../store/cartStore';
import { Search, Plus, Minus, Loader2, QrCode, X, Banknote, Printer, UserPlus, ShoppingCart, ChevronDown, MapPin, ChevronUp } from 'lucide-react';
import { Receipt } from '../components/Receipt';
import { useReactToPrint } from 'react-to-print';
import VariantModal from '../components/VariantModal';
import type { VariantGroup, SelectedVariant } from '../components/VariantModal';


interface MenuItem {
  id: string;
  name: string;
  base_price: number;
  cost: number;
  image_url: string;
  categories: { name: string } | null;
  variants: VariantGroup[];
}


interface Table {
  id: string;
  name: string;
  capacity: number;
  status: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  type: string;
}

export default function PosPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null);
  const [showQrisModal, setShowQrisModal] = useState(false);
  const [memberPhone, setMemberPhone] = useState('');
  const [receiptData, setReceiptData] = useState<any>(null);
  const [showCartMobile, setShowCartMobile] = useState(false);
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');

  // State Varian — langsung dari item.variants (tidak perlu query tambahan)
  const [variantItem, setVariantItem] = useState<MenuItem | null>(null);
  const [variantGroups, setVariantGroups] = useState<VariantGroup[]>([]);


  // State Meja
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [showTablePicker, setShowTablePicker] = useState(false);

  const receiptRef = useRef<HTMLDivElement>(null);

  const {
    items, addToCart, removeFromCart, updateQuantity,
    getTotals, clearCart, selectedMember, setMember,
    setDiscount, promoCode, setPromoCode, setStoreSettings,
    redeemPoints, setRedeemPoints
  } = useCartStore();

  const totals = getTotals();

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: 'Struk_Belanja',
    onAfterPrint: () => setReceiptData(null)
  });

  useEffect(() => {
    fetchMenu();
    fetchTables();
    fetchStoreSettings();
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    const { data } = await supabase.from('payment_methods').select('*').eq('is_active', true).order('sort_order', { ascending: true });
    if (data) {
      setPaymentMethods(data as PaymentMethod[]);
      if (data.length > 0) setSelectedPayment(data[0]);
    }
  };

  const fetchStoreSettings = async () => {
    const { data } = await supabase.from('store_settings').select('*').single();
    if (data) {
      setStoreSettings(data.tax_rate, data.service_charge_rate);
    }
  };

  const fetchMenu = async () => {
    const { data } = await supabase
      .from('menu_items')
      .select('id, name, base_price, cost, image_url, variants, categories(name)')
      .order('name');
    setMenuItems(data as any || []);
    setLoading(false);
  };


  const fetchTables = async () => {
    const { data } = await supabase.from('tables').select('*').order('name');
    setTables((data as any) || []);
  };

  // Klik item → langsung buka VariantModal dengan data yang sudah ada
  const handleItemClick = (item: MenuItem) => {
    setVariantItem(item);
    setVariantGroups(item.variants || []);
  };


  // Konfirmasi dari VariantModal → tambah ke keranjang
  const handleVariantConfirm = (selections: SelectedVariant[], qty: number, notes: string) => {
    if (!variantItem) return;
    const variantAdj = selections.reduce((sum, s) => sum + s.price, 0);
    const variantLabel = selections.map(s => s.label).join(' · ');
    addToCart({
      id: variantItem.id,
      name: variantItem.name + (variantLabel ? ` (${variantLabel})` : ''),
      price: variantItem.base_price + variantAdj,
      cost: variantItem.cost || 0,
      quantity: qty,
      addons: notes ? [{ name: notes, price: 0 }] : [],
      variant: variantLabel ? { name: variantLabel, price: variantAdj } : undefined,
    });
    setVariantItem(null);
  };

  const searchMember = async () => {
    if (!memberPhone) return;
    const { data } = await supabase.from('members').select('*').eq('phone', memberPhone).single();
    if (data) {
      setMember(data);
      setDiscount(10);
    } else {
      if (confirm("Nomor tidak terdaftar. Ingin mendaftarkan sebagai member baru?")) {
        const name = prompt("Masukkan Nama Pelanggan:");
        if (name) {
          const { data: newMember, error: regError } = await supabase
            .from('members').insert({ name, phone: memberPhone }).select().single();
          if (!regError && newMember) {
            setMember(newMember);
            setDiscount(10);
            alert(`Member "${name}" berhasil didaftarkan!`);
          }
        }
      }
    }
  };

  const checkPromoCode = async () => {
    setPromoError('');
    if (!promoInput) {
      setPromoCode(null);
      setDiscount(0, 'percentage');
      return;
    }

    const { data: promo, error } = await supabase
      .from('promos')
      .select('*')
      .eq('code', promoInput.toUpperCase())
      .eq('is_active', true)
      .single();

    if (error || !promo) {
      setPromoError('Promo tidak ditemukan atau tidak aktif');
      setPromoCode(null);
      setDiscount(0, 'percentage');
      return;
    }

    // Check dates
    const now = new Date();
    if (promo.start_date && new Date(promo.start_date) > now) {
      setPromoError('Promo belum berlaku');
      return;
    }
    if (promo.end_date && new Date(promo.end_date) < now) {
      setPromoError('Promo sudah kadaluarsa');
      return;
    }

    // Check Min Spend
    const tempSubtotal = totals.subtotal;
    if (promo.min_order_amount && tempSubtotal < promo.min_order_amount) {
      setPromoError(`Min. belanja Rp ${promo.min_order_amount.toLocaleString('id-ID')}`);
      return;
    }

    // Apply promo
    setPromoCode(promo.code);
    setDiscount(promo.discount_value, promo.discount_type);
  };

  const handlePaymentClick = () => {
    if (items.length === 0) return;
    // Fallback jika payment_methods belum ada di DB (SQL belum dirun)
    const method = selectedPayment ?? { id: 'fallback', name: 'CASH', type: 'cash' };
    if (method.type === 'qris') setShowQrisModal(true);
    else processCheckout(method.name, method.type);
  };

  const processCheckout = async (methodName: string, methodType: string = 'cash') => {
    setProcessing(true);
    try {
      const earnedPoints = Math.floor(totals.total / 10000); // 1 point per Rp 10.000 spent

      // Kolom wajib (selalu ada sejak awal)
      const orderPayload: Record<string, any> = {
        total_amount: totals.total,
        discount_amount: totals.discountAmount,
        member_id: selectedMember?.id,
        payment_type: methodType,
        status: 'completed',
        table_id: selectedTable?.id || null,
        table_name: selectedTable?.name || 'Take Away',
      };

      // Kolom opsional Tier 2 — hanya ikut jika bernilai (kolom mungkin belum ada jika SQL belum dirun)
      // Dibungkus try-catch di bawah agar tidak merusak transaksi
      const tier2Fields: Record<string, any> = {
        tax_amount: totals.taxAmount,
        service_charge_amount: totals.serviceChargeAmount,
        points_redeemed: totals.pointsDiscount,
        promo_code: promoCode,
      };

      // Coba insert dengan kolom tier2 dulu
      let { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({ ...orderPayload, ...tier2Fields })
        .select().single();

      // Jika error kolom tidak dikenal (kode 42703), coba lagi tanpa kolom tier2
      if (orderError && (orderError.code === '42703' || orderError.message?.includes('column'))) {
        console.warn('Kolom tier2 belum ada, insert ulang tanpa kolom tersebut:', orderError.message);
        const retry = await supabase.from('orders').insert(orderPayload).select().single();
        orderData = retry.data;
        orderError = retry.error;
      }

      if (orderError || !orderData) throw new Error(`Gagal order: ${orderError?.message || 'Unknown error'}`);

      await supabase.from('order_items').insert(items.map(item => ({
        order_id: orderData.id, menu_item_id: item.id,
        name: item.name, price: item.price, cost: item.cost, quantity: item.quantity
      })));

      // Tandai meja sebagai occupied
      if (selectedTable) {
        await supabase.from('tables').update({ status: 'occupied' }).eq('id', selectedTable.id);
      }

      // Auto-deduct stok bahan baku
      try {
        const menuIdsUnik = [...new Set(items.map(i => i.id))];
        const { data: semuaResep } = await supabase
          .from('menu_item_ingredients')
          .select('menu_item_id, ingredient_id, quantity, ingredients(id, name, current_stock, unit)')
          .in('menu_item_id', menuIdsUnik);

        if (semuaResep && semuaResep.length > 0) {
          const pemakaianBahan: Record<string, { total: number; stokSekarang: number }> = {};
          items.forEach(itemKeranjang => {
            semuaResep.filter(r => r.menu_item_id === itemKeranjang.id).forEach((r: any) => {
              const ingId = r.ingredient_id;
              if (!pemakaianBahan[ingId]) pemakaianBahan[ingId] = { total: 0, stokSekarang: r.ingredients.current_stock };
              pemakaianBahan[ingId].total += r.quantity * itemKeranjang.quantity;
            });
          });
          await Promise.all(Object.entries(pemakaianBahan).map(async ([ingId, info]) => {
            const stokBaru = Math.max(0, info.stokSekarang - info.total);
            await supabase.from('ingredients').update({ current_stock: stokBaru }).eq('id', ingId);
            await supabase.from('stock_movements').insert({ ingredient_id: ingId, type: 'out', quantity: info.total, notes: `Penjualan #${orderData.id.slice(0, 8)}` });
          }));
        }
      } catch (e) { console.error('Auto-deduct gagal:', e); }

      // Proses Poin Loyalti
      if (selectedMember) {
        try {
          // Jika ada poin yang diredeem
          if (totals.pointsDiscount > 0) {
            await supabase.from('point_histories').insert({
              member_id: selectedMember.id,
              order_id: orderData.id,
              type: 'redeemed',
              points_amount: -totals.pointsDiscount,
              notes: `Redeem untuk transaksi #${orderData.id.slice(0, 8)}`
            });
          }
          // Tambahkan poin yang didapat
          if (earnedPoints > 0) {
            await supabase.from('point_histories').insert({
              member_id: selectedMember.id,
              order_id: orderData.id,
              type: 'earned',
              points_amount: earnedPoints,
              notes: `Earned dari transaksi #${orderData.id.slice(0, 8)}`
            });
          }
          // Update total poin di tabel members
          const netPoints = earnedPoints - totals.pointsDiscount;
          const { data: memberData } = await supabase.from('members').select('points').eq('id', selectedMember.id).single();
          if (memberData) {
            const currentPoints = memberData.points || 0;
            await supabase.from('members').update({ points: currentPoints + netPoints }).eq('id', selectedMember.id);
          }
        } catch (e) { console.error('Gagal memproses poin:', e); }
      }

      setReceiptData({
        id: orderData.id, date: new Date().toLocaleString('id-ID'),
        items: [...items],
        subtotal: totals.subtotal,
        discount: totals.discountAmount,
        pointsDiscount: totals.pointsDiscount,
        earnedPoints: earnedPoints,
        taxAmount: totals.taxAmount,
        serviceChargeAmount: totals.serviceChargeAmount,
        total: totals.total,
        paymentMethod: methodName, cashierName: 'Admin',
        memberName: selectedMember?.name, tableName: selectedTable?.name || 'Take Away'
      });

      setShowQrisModal(false);
      setShowCartMobile(false);
      clearCart();
      setMemberPhone('');
      setSelectedTable(null);
      fetchTables(); // refresh status meja

      if (confirm('Transaksi Berhasil! Apakah ingin mencetak struk?')) setTimeout(() => handlePrint(), 300);

    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const filteredItems = menuItems.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    // @ts-ignore
    const categoryName = item.categories?.name || 'Uncategorized';
    return matchSearch && (selectedCategory === 'All' || categoryName === selectedCategory);
  });
  // @ts-ignore
  const categories = ['All', ...new Set(menuItems.map(i => i.categories?.name).filter(Boolean))];

  // ─── Komponen CartContent ───
  const CartContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b flex justify-between items-center shrink-0">
        <h2 className="font-bold text-lg">
          Current Order
          {selectedTable && <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">{selectedTable.name}</span>}
        </h2>
        <button className="md:hidden p-1 text-gray-400" onClick={() => setShowCartMobile(false)}>
          <ChevronDown size={22} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {items.length === 0 ? (
          <div className="text-center text-gray-300 py-10">
            <ShoppingCart size={36} className="mx-auto mb-2" />
            <p className="text-sm">Keranjang masih kosong</p>
          </div>
        ) : items.map(item => (
          <div key={item.tempId} className="flex gap-3">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm leading-tight">{item.name}</h4>
              {item.addons?.[0]?.name && <p className="text-xs text-gray-400 italic mt-0.5">📝 {item.addons[0].name}</p>}
              <p className="text-xs text-gray-500">Rp {item.price.toLocaleString('id-ID')}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button onClick={() => updateQuantity(item.tempId, item.quantity - 1)} disabled={item.quantity <= 1} className="p-1 bg-gray-100 rounded disabled:opacity-40"><Minus size={12} /></button>
              <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
              <button onClick={() => updateQuantity(item.tempId, item.quantity + 1)} className="p-1 bg-gray-100 rounded"><Plus size={12} /></button>
              <button onClick={() => removeFromCart(item.tempId)} className="text-red-400 p-1"><X size={16} /></button>
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-gray-100 bg-gray-50/50 space-y-2 shrink-0">
        <div className="flex gap-2">
          <input type="text" placeholder="No. HP Member..." className="flex-1 text-xs p-2 border rounded outline-none focus:ring-1 focus:ring-slate-400" value={memberPhone} onChange={e => setMemberPhone(e.target.value)} />
          <button onClick={searchMember} className="bg-slate-800 text-white text-[10px] px-3 rounded flex items-center gap-1"><UserPlus size={12} /> Cari</button>
        </div>
        {selectedMember && (
          <div className="flex flex-col gap-2 mt-2 bg-green-50 p-2 rounded border border-green-100">
            <div className="flex justify-between items-center text-xs">
              <span className="text-green-700 font-bold">✨ {selectedMember.name} (Poin: {selectedMember.points || 0})</span>
              <button
                onClick={() => {
                  setMember(null); setDiscount(0, 'percentage'); setPromoCode(null); setPromoInput(''); setRedeemPoints(0);
                }}
                className="text-red-400 font-bold"
              >
                X
              </button>
            </div>
            {/* Opsi Tukar Poin */}
            {(selectedMember.points || 0) > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  id="usePoints"
                  checked={redeemPoints > 0}
                  onChange={(e) => {
                    setRedeemPoints(e.target.checked ? selectedMember.points : 0);
                  }}
                />
                <label htmlFor="usePoints" className="text-gray-700 cursor-pointer">
                  Tukar {selectedMember.points} Poin (Diskon Rp {selectedMember.points.toLocaleString('id-ID')})
                </label>
              </div>
            )}
          </div>
        )}

        {/* Promo Code Input */}
        <div className="flex gap-2 pt-1 border-t border-gray-100">
          <input type="text" placeholder="Kode Promo / Voucher" className="flex-1 text-xs p-2 border rounded outline-none focus:ring-1 focus:ring-amber-400 uppercase" value={promoInput} onChange={e => setPromoInput(e.target.value.toUpperCase())} />
          <button onClick={checkPromoCode} className="bg-amber-100 text-amber-700 text-[10px] font-bold px-3 rounded flex items-center gap-1 hover:bg-amber-200">Pakai</button>
        </div>
        {promoError && <p className="text-[10px] text-red-500 font-medium">{promoError}</p>}
        {promoCode && !promoError && <p className="text-[10px] text-green-600 font-medium">✨ Promo {promoCode} terpasang!</p>}
      </div>

      <div className="p-4 bg-gray-50 border-t shrink-0">
        <div className="space-y-1 mb-3 text-xs">
          <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>Rp {totals.subtotal.toLocaleString('id-ID')}</span></div>
          {totals.discountAmount > 0 && <div className="flex justify-between text-red-500"><span>Diskon</span><span>-Rp {totals.discountAmount.toLocaleString('id-ID')}</span></div>}
          {totals.pointsDiscount > 0 && <div className="flex justify-between text-amber-600"><span>Tukar Poin</span><span>-Rp {totals.pointsDiscount.toLocaleString('id-ID')}</span></div>}
          {totals.serviceChargeAmount > 0 && <div className="flex justify-between text-gray-500"><span>Service Charge</span><span>Rp {totals.serviceChargeAmount.toLocaleString('id-ID')}</span></div>}
          <div className="flex justify-between text-gray-500"><span>Pajak (PB1)</span><span>Rp {totals.taxAmount.toLocaleString('id-ID')}</span></div>
          <div className="flex justify-between font-bold text-base text-slate-900 border-t pt-2 mt-1"><span>Total</span><span>Rp {totals.total.toLocaleString('id-ID')}</span></div>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {paymentMethods.map(pm => (
            <button
              key={pm.id}
              onClick={() => setSelectedPayment(pm)}
              className={`py-2 px-3 rounded border text-xs flex items-center justify-center gap-1.5 ${selectedPayment?.id === pm.id ? 'bg-slate-900 text-white' : 'bg-white text-gray-700'}`}
            >
              {pm.type.toLowerCase() === 'cash' ? <Banknote size={14} /> : <QrCode size={14} />}
              {pm.name}
            </button>
          ))}
        </div>
        <button onClick={handlePaymentClick} disabled={items.length === 0 || processing} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold flex justify-center gap-2 items-center hover:bg-slate-800 transition disabled:opacity-50">
          {processing ? <Loader2 className="animate-spin" /> : <Printer size={18} />}
          {processing ? 'Memproses...' : 'Bayar & Cetak'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row h-full gap-0 md:gap-4 md:p-4 md:h-[calc(100vh-2rem)]">

      {/* Struk off-screen */}
      <div style={{ position: 'fixed', top: '-10000px', left: '-10000px' }}>
        <Receipt ref={receiptRef} orderData={receiptData} />
      </div>

      {/* Modal Varian */}
      {variantItem && (
        <VariantModal
          item={variantItem}
          variants={variantGroups}
          onConfirm={handleVariantConfirm}
          onClose={() => setVariantItem(null)}
        />
      )}


      {/* Modal QRIS */}
      {showQrisModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2"><QrCode size={20} /> Scan QRIS</h3>
              <button onClick={() => setShowQrisModal(false)}><X size={20} /></button>
            </div>
            <div className="p-6 flex flex-col items-center text-center">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=Lamoenan-${totals.total}`} className="w-48 h-48 mb-4 border p-2 rounded" alt="QR" />
              <h2 className="text-3xl font-bold mb-6">Rp {totals.total.toLocaleString('id-ID')}</h2>
              <button onClick={() => { const m = selectedPayment ?? { name: 'QRIS', type: 'qris' }; processCheckout(m.name, m.type); }} disabled={processing} className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold flex justify-center gap-2">
                {processing ? <Loader2 className="animate-spin" /> : "Verifikasi Pembayaran"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== GRID MENU ===== */}
      <div className="flex-1 flex flex-col bg-white md:rounded-xl shadow-sm overflow-hidden">
        {/* Search + kategori */}
        <div className="p-3 border-b border-gray-100">
          <div className="relative mb-2.5">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={17} />
            <input type="text" placeholder="Cari menu..." className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {categories.map(cat => (
              <button key={String(cat)} onClick={() => setSelectedCategory(String(cat))} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${selectedCategory === cat ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-600'}`}>{String(cat)}</button>
            ))}
          </div>
        </div>

        {/* Pemilih meja — tampil di atas grid menu */}
        <div className="px-3 py-2 border-b bg-gray-50/50">
          <button
            onClick={() => setShowTablePicker(p => !p)}
            className="flex items-center gap-2 text-xs font-medium text-gray-600 hover:text-gray-900"
          >
            <MapPin size={14} className="text-amber-500" />
            <span>{selectedTable ? selectedTable.name : 'Take Away'}</span>
            {showTablePicker ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showTablePicker && (
            <div className="mt-2 grid grid-cols-4 sm:grid-cols-6 gap-1.5">
              <button
                onClick={() => { setSelectedTable(null); setShowTablePicker(false); }}
                className={`py-1.5 rounded-lg border text-[10px] font-bold text-center ${!selectedTable ? 'border-amber-500 bg-amber-50 text-amber-800' : 'border-gray-200 text-gray-600'}`}
              >
                Take Away
              </button>
              {tables.map(t => (
                <button
                  key={t.id}
                  onClick={() => { setSelectedTable(t); setShowTablePicker(false); }}
                  disabled={t.status === 'occupied' && t.id !== selectedTable?.id}
                  className={`py-1.5 rounded-lg border text-[10px] font-bold text-center ${selectedTable?.id === t.id
                    ? 'border-amber-500 bg-amber-50 text-amber-800'
                    : t.status === 'occupied'
                      ? 'border-red-200 bg-red-50 text-red-400 cursor-not-allowed'
                      : 'border-gray-200 text-gray-600'
                    }`}
                >
                  {t.name.replace('Meja ', '')}
                  <div className={`text-[8px] ${t.status === 'occupied' ? 'text-red-400' : 'text-green-500'}`}>
                    {t.status === 'occupied' ? 'Sibuk' : 'Kosong'}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Grid menu */}
        <div className="flex-1 overflow-y-auto p-3 bg-gray-50 pb-24 md:pb-4">
          {loading
            ? <div className="flex justify-center h-40 items-center"><Loader2 className="animate-spin" /></div>
            : <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredItems.map(item => (
                <div key={item.id}
                  onClick={() => handleItemClick(item)}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md cursor-pointer transition-all overflow-hidden group border border-gray-100 active:scale-95"
                >
                  <div className="aspect-square bg-gray-100 relative overflow-hidden">
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <div className="absolute bottom-2 right-2 bg-amber-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><Plus size={13} /></div>
                  </div>
                  <div className="p-2 md:p-3">
                    <h3 className="font-semibold text-xs md:text-sm truncate">{item.name}</h3>
                    <p className="text-amber-700 font-bold text-xs md:text-sm">Rp {item.base_price.toLocaleString('id-ID')}</p>
                  </div>
                </div>
              ))}
            </div>
          }
        </div>
      </div>

      {/* ===== KERANJANG DESKTOP ===== */}
      <div className="hidden md:flex w-96 bg-white rounded-xl shadow-sm flex-col border border-gray-100">
        <CartContent />
      </div>

      {/* ===== FLOATING CART BUTTON (mobile) ===== */}
      <button
        className="md:hidden fixed bottom-20 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-5 py-3 rounded-full shadow-xl flex items-center gap-2.5 font-bold text-sm active:scale-95 transition-transform"
        onClick={() => setShowCartMobile(true)}
      >
        <ShoppingCart size={18} />
        <span>Keranjang</span>
        {items.length > 0 && <>
          <span className="bg-amber-500 text-white text-xs font-black min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center">
            {items.reduce((a, i) => a + i.quantity, 0)}
          </span>
          <span className="font-black text-amber-400">· Rp {totals.total.toLocaleString('id-ID')}</span>
        </>}
      </button>

      {/* ===== MOBILE CART BOTTOM SHEET ===== */}
      {showCartMobile && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowCartMobile(false)} />
          <div className="relative bg-white rounded-t-2xl shadow-2xl flex flex-col max-h-[90dvh]">
            <div className="flex justify-center pt-2.5 pb-1 shrink-0">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>
            <CartContent />
          </div>
        </div>
      )}
    </div>
  );
}