---
name: pos-transaction
description: Panduan lengkap alur transaksi POS di Lamoenan, dari keranjang hingga simpan ke database
---

# Skill: Alur Transaksi POS Lamoenan

Skill ini mendokumentasikan alur transaksi secara lengkap agar perubahan apapun pada sistem kasir tidak memecah logika bisnis yang ada.

---

## Alur Transaksi End-to-End

```
1. Kasir klik menu item di PosPage
       ↓
2. addToCart() dipanggil dari cartStore
   → item ditambahkan ke state items[] di Zustand
   → item memiliki: { id, name, price, cost, quantity, addons }
       ↓
3. Kasir bisa input nomor HP untuk mencari member
   → searchMember() di PosPage → query tabel 'members'
   → Jika member ditemukan: setMember(data) + setDiscount(10)
   → Jika tidak ada: tawarkan pendaftaran member baru
       ↓
4. Kasir memilih metode bayar (Cash atau QRIS)
       ↓
5. Kasir klik "Bayar & Cetak" → handlePaymentClick()
   → Jika QRIS: tampilkan modal QR → tunggu konfirmasi manual
   → Jika Cash: langsung processCheckout('cash')
       ↓
6. processCheckout() menjalankan:
   a. Insert ke tabel 'orders':
      { total_amount, discount_amount, member_id, payment_type, status: 'completed' }
   b. Insert ke tabel 'order_items' (satu row per item):
      { order_id, menu_item_id, name, price, cost, quantity }
      ⚠️ 'cost' disimpan sebagai snapshot HPP saat transaksi — ini penting untuk laporan!
   c. Siapkan receiptData → trigger print via react-to-print
   d. clearCart() → kosongkan keranjang
```

---

## Interface Data yang Terlibat

### CartItem (src/store/cartStore.ts)
```typescript
interface CartItem {
  tempId: string;    // UUID unik per item di keranjang (tidak disimpan ke DB)
  id: string;        // ID menu_item dari Supabase
  name: string;
  price: number;     // Harga jual (base_price dari menu_items)
  cost: number;      // HPP/modal (cost dari menu_items) — WAJIB disertakan
  quantity: number;
  variant?: { name: string; price: number };
  addons: { name: string; price: number }[];
}
```

### getTotals() — Rumus Kalkulasi
```typescript
subtotal = sum(item.price + variant?.price + addons) * quantity
discountAmount = subtotal * (discount / 100)
afterDiscount = subtotal - discountAmount
tax = afterDiscount * 0.11  // PPN 11%
total = afterDiscount + tax
```

---

## Kalkulasi Laba Kotor di Laporan

Di `ReportsPage.tsx`, laba kotor dihitung dari data historis `order_items`:

```typescript
let totalCost = 0;
orders.forEach(order => {
  if (order.order_items) {
    order.order_items.forEach((item: any) => {
      totalCost += (item.cost || 0) * item.quantity;
    });
  }
});
const grossProfit = totalRevenue - totalCost;
```

**Penting:** Nilai `cost` yang disimpan di `order_items` adalah snapshot saat transaksi. Ini berarti jika HPP produk berubah di masa depan, laporan masa lalu tetap akurat.

---

## Print Struk

```typescript
// Di PosPage.tsx
const handlePrint = useReactToPrint({
  contentRef: receiptRef,
  documentTitle: 'Struk_Belanja',
  onAfterPrint: () => setReceiptData(null)
});

// Komponen Receipt ada di: src/components/Receipt.tsx
// Data yang dibutuhkan: { id, date, items, total, discount, paymentMethod, cashierName, memberName }
```

---

## HAL YANG TIDAK BOLEH DIUBAH

- Jangan hapus kolom `cost` dari query INSERT ke `order_items` — ini adalah data histori HPP.
- Jangan ubah rumus kalkulasi pajak (11%) tanpa konfirmasi user.
- Jangan hapus logika member dan diskon dari PosPage — ini adalah fitur inti loyalitas.
- `tempId` di CartItem adalah hanya untuk identifikasi lokal di UI, **tidak boleh** dikirim ke database.
