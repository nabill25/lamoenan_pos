---
name: supabase-query
description: Panduan dan pola query Supabase yang digunakan dalam project Lamoenan POS
---

# Skill: Supabase Query Pattern untuk Lamoenan POS

Gunakan skill ini sebagai referensi saat menulis atau memodifikasi query Supabase di project ini.

---

## Inisialisasi Client

Selalu import dari path berikut. **JANGAN** buat client baru:

```typescript
import { supabase } from '../lib/supabase';
// atau sesuaikan relative path: '../../lib/supabase'
```

---

## Pola Query yang Sudah Terbukti Bekerja di Project Ini

### SELECT dengan Join

```typescript
// Ambil menu items beserta nama kategori
const { data, error } = await supabase
  .from('menu_items')
  .select('*, categories(name)')
  .eq('is_available', true);
```

```typescript
// Ambil orders beserta detail item-nya (termasuk cost untuk kalkulasi HPP)
const { data: orders, error } = await supabase
  .from('orders')
  .select('*, order_items(name, quantity, price, cost)')
  .eq('status', 'completed')
  .order('created_at', { ascending: false });
```

```typescript
// Ambil profil staff beserta role-nya
const { data, error } = await supabase
  .from('profiles')
  .select('id, email, user_roles(role)')
  .order('email');
```

### INSERT

```typescript
// Insert header order
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
```

```typescript
// Insert banyak order items sekaligus (batch insert)
await supabase.from('order_items').insert(orderItems);
// di mana orderItems adalah array of objects
```

### UPDATE

```typescript
// Update stok menu
const { error } = await supabase
  .from('menu_items')
  .update({ stock_quantity: angkaBaru })
  .eq('id', id);
```

```typescript
// Upsert role staff (insert jika belum ada, update jika sudah ada)
const { error } = await supabase
  .from('user_roles')
  .upsert({ user_id: userId, role: newRole }, { onConflict: 'user_id' });
```

### DELETE

```typescript
// Hapus berdasarkan id
const { error } = await supabase
  .from('profiles')
  .delete()
  .eq('id', userId);
```

---

## Pola Error Handling yang Digunakan Project Ini

```typescript
// Pola standar untuk semua query
const { data, error } = await supabase.from('nama_tabel').select('*');

if (error) {
  console.error('Keterangan error:', error);
  // Untuk UI: tampilkan alert atau set state error
  return;
}

// Gunakan data di sini
```

---

## Catatan Penting

- **Selalu gunakan** `.select().single()` jika yakin hasilnya hanya 1 row (misal: cari member by nomor HP).
- **Hati-hati** dengan `.single()` — ia akan throw error jika row tidak ditemukan atau lebih dari 1 row ditemukan.
- **Untuk filter waktu** di laporan, filtering dilakukan di **sisi klien** (JavaScript), bukan di query Supabase. Ini adalah keputusan desain yang sudah ada (`applyFilter()` di `ReportsPage.tsx`).
- Kolom `created_at` bertipe `timestamptz` (timezone-aware). Selalu parse dengan `new Date(order.created_at)`.
