import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useCartStore } from '../store/cartStore';
import { Search, Plus, Minus, Loader2, QrCode, X, Banknote, Printer, UserPlus } from 'lucide-react';
import { Receipt } from '../components/Receipt';
import { useReactToPrint } from 'react-to-print';

interface MenuItem {
  id: string;
  name: string;
  base_price: number;
  cost: number;
  image_url: string;
  categories: { name: string } | null;
}

export default function PosPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // State untuk Pembayaran & Member
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qris'>('cash');
  const [showQrisModal, setShowQrisModal] = useState(false);
  const [memberPhone, setMemberPhone] = useState('');

  // State untuk Struk
  const [receiptData, setReceiptData] = useState<any>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  // Store keranjang (Sekarang dengan fitur Member & Diskon)
  const {
    items, addToCart, removeFromCart, updateQuantity,
    getTotals, clearCart, selectedMember, setMember,
    discount, setDiscount
  } = useCartStore();

  const totals = getTotals();

  // Fungsi Print
  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: 'Struk_Belanja',
    onAfterPrint: () => setReceiptData(null)
  });

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*, categories(name)')
        .eq('is_available', true);
      if (!error) setMenuItems((data as unknown as MenuItem[]) || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  // --- LOGIKA MEMBER ---
  const searchMember = async () => {
    if (!memberPhone) return;

    const { data } = await supabase
      .from('members')
      .select('*')
      .eq('phone', memberPhone)
      .single();

    if (data) {
      setMember(data);
      setDiscount(10); // Diskon otomatis 10% untuk member
    } else {
      if (confirm("Nomor tidak terdaftar. Ingin mendaftarkan sebagai member baru?")) {
        const name = prompt("Masukkan Nama Pelanggan:");
        if (name) {
          const { data: newMember, error: regError } = await supabase
            .from('members')
            .insert([{ name, phone: memberPhone }])
            .select().single();

          if (!regError) {
            setMember(newMember);
            setDiscount(10);
            alert("Member berhasil didaftarkan & diskon diterapkan!");
          }
        }
      }
    }
  };

  const handlePaymentClick = () => {
    if (items.length === 0) return;
    if (paymentMethod === 'qris') setShowQrisModal(true);
    else processCheckout('cash');
  };

  const processCheckout = async (method: 'cash' | 'qris') => {
    setProcessing(true);
    try {
      // 1. Simpan ke Database
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          total_amount: totals.total,
          discount_amount: totals.discountAmount,
          member_id: selectedMember?.id,
          payment_type: method,
          status: 'completed'
        })
        .select()
        .single();

      if (orderError || !orderData) throw new Error('Gagal order');

      const orderItems = items.map(item => ({
        order_id: orderData.id,
        menu_item_id: item.id,
        name: item.name,
        price: item.price,
        cost: item.cost,
        quantity: item.quantity
      }));

      await supabase.from('order_items').insert(orderItems);

      // 2. Auto-deduct stok bahan baku berdasarkan resep menu
      try {
        // Kumpulkan semua menu_item_id yang unik dari keranjang
        const menuIdsUnik = [...new Set(items.map(i => i.id))];

        // Ambil semua resep untuk menu yang terjual sekaligus
        const { data: semuaResep } = await supabase
          .from('menu_item_ingredients')
          .select('menu_item_id, ingredient_id, quantity, ingredients(id, name, current_stock, unit)')
          .in('menu_item_id', menuIdsUnik);

        if (semuaResep && semuaResep.length > 0) {
          // Hitung total pemakaian per bahan baku: { ingredient_id -> { total_pakai, nama } }
          const pemakaianBahan: Record<string, { total: number; nama: string; stokSekarang: number; unit: string }> = {};

          items.forEach(itemKeranjang => {
            const resepMenu = semuaResep.filter(r => r.menu_item_id === itemKeranjang.id);
            resepMenu.forEach((r: any) => {
              const ingId = r.ingredient_id;
              const totalPakai = r.quantity * itemKeranjang.quantity;
              if (!pemakaianBahan[ingId]) {
                pemakaianBahan[ingId] = {
                  total: 0,
                  nama: r.ingredients.name,
                  stokSekarang: r.ingredients.current_stock,
                  unit: r.ingredients.unit,
                };
              }
              pemakaianBahan[ingId].total += totalPakai;
            });
          });

          // Update stok dan catat riwayat untuk setiap bahan yang dipakai
          const updatePromises = Object.entries(pemakaianBahan).map(async ([ingId, info]) => {
            const stokBaru = Math.max(0, info.stokSekarang - info.total);

            // Update stok bahan baku
            await supabase
              .from('ingredients')
              .update({ current_stock: stokBaru })
              .eq('id', ingId);

            // Catat riwayat keluar di stock_movements
            await supabase.from('stock_movements').insert({
              ingredient_id: ingId,
              type: 'out',
              quantity: info.total,
              notes: `Penjualan Order #${orderData.id.slice(0, 8)}`,
            });
          });

          await Promise.all(updatePromises);
        }
      } catch (recipeError) {
        // Jika auto-deduct gagal, transaksi tetap valid — hanya catat error
        console.error('Gagal auto-deduct stok bahan:', recipeError);
      }


      setReceiptData({
        id: orderData.id,
        date: new Date().toLocaleString('id-ID'),
        items: [...items],
        total: totals.total,
        discount: totals.discountAmount,
        paymentMethod: method,
        cashierName: 'Admin',
        memberName: selectedMember?.name
      });

      // 3. Sukses & Bersihkan
      setShowQrisModal(false);
      clearCart();
      setMemberPhone('');

      if (confirm('Transaksi Berhasil! Apakah ingin mencetak struk?')) {
        setTimeout(() => handlePrint(), 300);
      }

    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const filteredItems = menuItems.filter((item) => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    // @ts-ignore
    const categoryName = item.categories?.name || 'Uncategorized';
    const matchCategory = selectedCategory === 'All' || categoryName === selectedCategory;
    return matchSearch && matchCategory;
  });

  // @ts-ignore
  const categories = ['All', ...new Set(menuItems.map(i => i.categories?.name).filter(Boolean))];

  return (
    <div className="flex h-[calc(100vh-2rem)] gap-4 relative">

      {/* --- STRUK TERSEMBUNYI (OFF-SCREEN) --- */}
      <div style={{ position: 'fixed', top: '-10000px', left: '-10000px' }}>
        <Receipt ref={receiptRef} orderData={receiptData} />
      </div>

      {/* --- MODAL QRIS --- */}
      {showQrisModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2"><QrCode size={20} /> Scan QRIS</h3>
              <button onClick={() => setShowQrisModal(false)}><X size={20} /></button>
            </div>
            <div className="p-6 flex flex-col items-center text-center">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=Lamoenan-${totals.total}`} className="w-48 h-48 mb-4 border p-2 rounded" alt="QR" />
              <h2 className="text-3xl font-bold mb-6">Rp {totals.total.toLocaleString('id-ID')}</h2>
              <button onClick={() => processCheckout('qris')} disabled={processing} className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold flex justify-center gap-2">
                {processing ? <Loader2 className="animate-spin" /> : "Verifikasi Pembayaran"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- GRID MENU --- */}
      <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
            <input type="text" placeholder="Cari menu..." className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((cat) => (
              <button key={String(cat)} onClick={() => setSelectedCategory(String(cat))} className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === cat ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{String(cat)}</button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {loading ? <div className="flex justify-center h-40 items-center"><Loader2 className="animate-spin" /></div> :
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredItems.map((item) => (
                <div key={item.id} onClick={() => addToCart({ id: item.id, name: item.name, price: item.base_price, cost: item.cost || 0, quantity: 1, addons: [] })} className="bg-white rounded-xl shadow-sm hover:shadow-md cursor-pointer transition-all overflow-hidden group border border-gray-100">
                  <div className="aspect-square bg-gray-100 relative overflow-hidden">
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <div className="absolute bottom-2 right-2 bg-white/90 p-1 rounded-full opacity-0 group-hover:opacity-100"><Plus size={16} /></div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-sm truncate">{item.name}</h3>
                    <p className="text-amber-700 font-bold text-sm">Rp {item.base_price.toLocaleString('id-ID')}</p>
                  </div>
                </div>
              ))}
            </div>
          }
        </div>
      </div>

      {/* --- KERANJANG --- */}
      <div className="w-96 bg-white rounded-xl shadow-sm flex flex-col border border-gray-100">
        <div className="p-4 border-b"><h2 className="font-bold text-lg">Current Order</h2></div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.map((item) => (
            <div key={item.tempId} className="flex gap-3">
              <div className="flex-1"><h4 className="font-medium text-sm">{item.name}</h4><p className="text-xs text-gray-500">Rp {item.price.toLocaleString('id-ID')}</p></div>
              <div className="flex items-center gap-2">
                <button onClick={() => updateQuantity(item.tempId, item.quantity - 1)} disabled={item.quantity <= 1} className="p-1 bg-gray-100 rounded"><Minus size={12} /></button>
                <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.tempId, item.quantity + 1)} className="p-1 bg-gray-100 rounded"><Plus size={12} /></button>
                <button onClick={() => removeFromCart(item.tempId)} className="text-red-400 p-1"><X size={16} /></button>
              </div>
            </div>
          ))}
        </div>

        {/* --- PANEL MEMBER & DISKON --- */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 space-y-3">
          <div className="flex gap-2">
            <input
              type="text" placeholder="No. HP Member..."
              className="flex-1 text-xs p-2 border rounded outline-none focus:ring-1 focus:ring-slate-400"
              value={memberPhone} onChange={(e) => setMemberPhone(e.target.value)}
            />
            <button onClick={searchMember} className="bg-slate-800 text-white text-[10px] px-3 rounded flex items-center gap-1">
              <UserPlus size={12} /> Cari
            </button>
          </div>

          {selectedMember && (
            <div className="flex justify-between items-center text-xs bg-green-50 p-2 rounded border border-green-100">
              <span className="text-green-700 font-bold">✨ {selectedMember.name}</span>
              <button onClick={() => { setMember(null); setDiscount(0); }} className="text-red-400 font-bold">X</button>
            </div>
          )}

          <div className="flex items-center justify-between">
            <label className="text-xs text-gray-500">Diskon (%)</label>
            <input
              type="number" className="w-16 p-1 border rounded text-right text-xs"
              value={discount} onChange={(e) => setDiscount(Number(e.target.value))}
            />
          </div>
        </div>

        {/* --- SUMMARY TOTAL --- */}
        <div className="p-4 bg-gray-50 border-t">
          <div className="space-y-1 mb-4 text-xs">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span>Rp {totals.subtotal.toLocaleString('id-ID')}</span>
            </div>
            {totals.discountAmount > 0 && (
              <div className="flex justify-between text-red-500">
                <span>Diskon</span>
                <span>-Rp {totals.discountAmount.toLocaleString('id-ID')}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-500">
              <span>Pajak (11%)</span>
              <span>Rp {totals.tax.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between font-bold text-lg text-slate-900 border-t pt-2 mt-2">
              <span>Total</span>
              <span>Rp {totals.total.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            <button onClick={() => setPaymentMethod('cash')} className={`py-2 px-3 rounded border text-sm flex items-center justify-center gap-2 ${paymentMethod === 'cash' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white'}`}><Banknote size={16} /> Cash</button>
            <button onClick={() => setPaymentMethod('qris')} className={`py-2 px-3 rounded border text-sm flex items-center justify-center gap-2 ${paymentMethod === 'qris' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white'}`}><QrCode size={16} /> QRIS</button>
          </div>

          <button onClick={handlePaymentClick} disabled={items.length === 0 || processing} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold flex justify-center gap-2 items-center hover:bg-slate-800 transition">
            {processing ? <Loader2 className="animate-spin" /> : <Printer size={18} />}
            {processing ? 'Memproses...' : 'Bayar & Cetak'}
          </button>
        </div>
      </div>

    </div>
  );
}