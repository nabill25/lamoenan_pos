import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Search, AlertCircle, CheckCircle2, XCircle, TrendingDown, UtensilsCrossed, RefreshCw } from 'lucide-react';


interface ResepRaw {
  menu_item_id: string;
  quantity: number;
  ingredients: {
    id: string;
    name: string;
    unit: string;
    current_stock: number;
  };
}

// Tipe yang sudah diolah untuk ditampilkan
interface StockPrediksi {
  id: string;
  name: string;
  category: string;
  hasResep: boolean;
  porsiEstimasi: number; // jumlah porsi yang bisa dibuat (-1 jika tidak ada resep)
  bottleneck: string | null; // nama bahan yang paling cepat habis
  manualStock: number; // fallback jika tidak ada resep
  status: 'aman' | 'hampir_habis' | 'habis' | 'no_recipe';
}

export default function StockPage() {
  const [stocks, setStocks] = useState<StockPrediksi[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetchDanHitung();
  }, []);

  const fetchDanHitung = async () => {
    setLoading(true);

    // Ambil semua menu
    const { data: menus } = await supabase
      .from('menu_items')
      .select('id, name, stock_quantity, categories(name)')
      .order('name');

    // Ambil semua resep sekaligus (semua menu)
    const { data: semuaResep } = await supabase
      .from('menu_item_ingredients')
      .select('menu_item_id, quantity, ingredients(id, name, unit, current_stock)');

    if (!menus) { setLoading(false); return; }

    // Kelompokkan resep berdasarkan menu_item_id
    const resepPerMenu: Record<string, ResepRaw[]> = {};
    (semuaResep || []).forEach((r: any) => {
      if (!resepPerMenu[r.menu_item_id]) resepPerMenu[r.menu_item_id] = [];
      resepPerMenu[r.menu_item_id].push(r);
    });

    // Hitung prediksi porsi untuk setiap menu
    const hasil: StockPrediksi[] = (menus as any[]).map(menu => {
      const resep = resepPerMenu[menu.id] || [];
      const hasResep = resep.length > 0;

      if (!hasResep) {
        // Tidak ada resep — gunakan stok manual
        return {
          id: menu.id,
          name: menu.name,
          category: menu.categories?.name || '-',
          hasResep: false,
          porsiEstimasi: menu.stock_quantity,
          bottleneck: null,
          manualStock: menu.stock_quantity,
          status: menu.stock_quantity === 0 ? 'habis' : menu.stock_quantity < 5 ? 'hampir_habis' : 'aman',
        } as StockPrediksi;
      }

      // Ada resep — hitung porsi berdasarkan bahan paling sedikit
      let minPorsi = Infinity;
      let bottleneckName: string | null = null;

      resep.forEach(r => {
        const stokBahan = r.ingredients.current_stock;
        const qtyPerPorsi = r.quantity;
        if (qtyPerPorsi <= 0) return;

        const bisa = Math.floor(stokBahan / qtyPerPorsi);
        if (bisa < minPorsi) {
          minPorsi = bisa;
          bottleneckName = `${r.ingredients.name} (${stokBahan} ${r.ingredients.unit} tersisa)`;
        }
      });

      const porsi = minPorsi === Infinity ? 0 : minPorsi;

      let status: StockPrediksi['status'] = 'aman';
      if (porsi === 0) status = 'habis';
      else if (porsi <= 5) status = 'hampir_habis';

      return {
        id: menu.id,
        name: menu.name,
        category: menu.categories?.name || '-',
        hasResep: true,
        porsiEstimasi: porsi,
        bottleneck: bottleneckName,
        manualStock: menu.stock_quantity,
        status,
      } as StockPrediksi;
    });

    setStocks(hasil);
    setLastUpdated(new Date());
    setLoading(false);
  };

  const filtered = stocks.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  // Ringkasan angka untuk header
  const aman = stocks.filter(s => s.status === 'aman').length;
  const hampirHabis = stocks.filter(s => s.status === 'hampir_habis').length;
  const habis = stocks.filter(s => s.status === 'habis').length;
  const tanpaResep = stocks.filter(s => !s.hasResep).length;

  const StatusBadge = ({ status }: { status: StockPrediksi['status'] }) => {
    const map = {
      aman: { icon: <CheckCircle2 size={14} />, label: 'Aman', cls: 'bg-green-100 text-green-700' },
      hampir_habis: { icon: <AlertCircle size={14} />, label: 'Hampir Habis', cls: 'bg-amber-100 text-amber-700' },
      habis: { icon: <XCircle size={14} />, label: 'Habis', cls: 'bg-red-100 text-red-700' },
      no_recipe: { icon: <UtensilsCrossed size={14} />, label: 'Manual', cls: 'bg-gray-100 text-gray-500' },
    };
    const s = status === 'no_recipe' ? map.no_recipe : map[status];
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${s.cls}`}>
        {s.icon} {s.label}
      </span>
    );
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prediksi Stok Menu</h1>
          <p className="text-gray-500 text-sm mt-1">
            Estimasi porsi yang bisa dibuat berdasarkan stok bahan baku & resep.
          </p>
        </div>
        <button
          onClick={fetchDanHitung}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Kartu Ringkasan */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-green-50 border border-green-100 rounded-xl p-4">
          <div className="text-3xl font-bold text-green-700">{aman}</div>
          <div className="text-sm text-green-600 mt-1 flex items-center gap-1">
            <CheckCircle2 size={14} /> Stok Aman
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
          <div className="text-3xl font-bold text-amber-700">{hampirHabis}</div>
          <div className="text-sm text-amber-600 mt-1 flex items-center gap-1">
            <TrendingDown size={14} /> Hampir Habis
          </div>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-xl p-4">
          <div className="text-3xl font-bold text-red-700">{habis}</div>
          <div className="text-sm text-red-600 mt-1 flex items-center gap-1">
            <XCircle size={14} /> Tidak Bisa Dibuat
          </div>
        </div>
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
          <div className="text-3xl font-bold text-gray-500">{tanpaResep}</div>
          <div className="text-sm text-gray-400 mt-1 flex items-center gap-1">
            <UtensilsCrossed size={14} /> Tanpa Resep
          </div>
        </div>
      </div>

      {/* Tabel */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Cari menu..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {lastUpdated && (
            <p className="text-xs text-gray-400 hidden md:block">
              Diperbarui: {lastUpdated.toLocaleTimeString('id-ID')}
            </p>
          )}
        </div>

        {/* Header tabel */}
        <div className="grid grid-cols-12 bg-gray-50 px-5 py-3 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
          <div className="col-span-4">Nama Menu</div>
          <div className="col-span-2">Kategori</div>
          <div className="col-span-2 text-center">Estimasi Porsi</div>
          <div className="col-span-2 text-center">Status</div>
          <div className="col-span-2">Bahan Pembatas</div>
        </div>

        {/* Isi tabel */}
        <div className="divide-y divide-gray-50">
          {loading ? (
            <div className="py-12 text-center text-gray-400">
              <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
              Menghitung prediksi stok...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-gray-400">Tidak ada menu ditemukan.</div>
          ) : (
            filtered.map(item => (
              <div
                key={item.id}
                className={`grid grid-cols-12 px-5 py-4 items-center text-sm hover:bg-gray-50 transition-colors ${item.status === 'habis' ? 'bg-red-50/40' : ''}`}
              >
                {/* Nama */}
                <div className="col-span-4 flex items-center gap-3">
                  <div className={`w-2 h-8 rounded-full ${item.status === 'habis' ? 'bg-red-400' : item.status === 'hampir_habis' ? 'bg-amber-400' : 'bg-green-400'}`} />
                  <div>
                    <div className="font-semibold text-gray-900">{item.name}</div>
                    {!item.hasResep && (
                      <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                        <UtensilsCrossed size={10} /> Belum ada resep
                      </div>
                    )}
                  </div>
                </div>

                {/* Kategori */}
                <div className="col-span-2">
                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">
                    {item.category}
                  </span>
                </div>

                {/* Estimasi Porsi — angka besar di tengah */}
                <div className="col-span-2 text-center">
                  {item.hasResep ? (
                    <div>
                      <span className={`text-2xl font-black ${item.status === 'habis' ? 'text-red-600' : item.status === 'hampir_habis' ? 'text-amber-600' : 'text-green-600'}`}>
                        {item.porsiEstimasi}
                      </span>
                      <span className="text-xs text-gray-400 ml-1">porsi</span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-2xl font-black text-gray-400">{item.manualStock}</span>
                      <span className="text-xs text-gray-400 ml-1">pcs</span>
                    </div>
                  )}
                </div>

                {/* Status badge */}
                <div className="col-span-2 text-center">
                  <StatusBadge status={item.hasResep ? item.status : 'no_recipe'} />
                </div>

                {/* Bahan Pembatas (bottleneck) */}
                <div className="col-span-2 text-xs">
                  {item.hasResep && item.bottleneck ? (
                    <div className={`flex items-start gap-1 ${item.status === 'habis' ? 'text-red-600' : item.status === 'hampir_habis' ? 'text-amber-600' : 'text-gray-400'}`}>
                      {item.status !== 'aman' && <AlertCircle size={12} className="mt-0.5 shrink-0" />}
                      <span>{item.bottleneck}</span>
                    </div>
                  ) : item.hasResep ? (
                    <span className="text-gray-300">—</span>
                  ) : (
                    <span className="text-xs text-blue-500 cursor-pointer hover:underline"
                      onClick={() => {
                        // Arahkan ke tab Resep Menu di Inventory
                        window.location.href = '/inventory';
                      }}
                    >
                      Atur resep →
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-400 flex items-center justify-between">
          <span>
            💡 Prediksi dihitung dari: <strong>Min(stok bahan ÷ qty per porsi)</strong> untuk setiap bahan dalam resep.
          </span>
          <span>
            Menu tanpa resep: gunakan <a href="/inventory" className="text-amber-600 hover:underline font-medium">Bahan Baku → Resep Menu</a> untuk mengatur.
          </span>
        </div>
      </div>
    </div>
  );
}