# Rencana Implementasi: Tema Putih-Biru, Foto Menu POS, Adjust Purchasing & Import Excel/PDF

Peningkatan sistem ERP & POS Dimsum Mentai 77 mencakup perombakan tema visual menjadi **Light Theme Putih & Biru Modern Clean** (dengan mempertahankan 100% tata letak yang sudah ada), penambahan **fitur upload foto menu** untuk mempermudah kasir, kemampuan **adjust/edit transaksi purchasing dan catatan operasional**, serta **menu import data Excel & PDF** dengan template profesional siap pakai.

---

### User Review & Keputusan Terkonfirmasi

> [!IMPORTANT]
> Berdasarkan jawaban klarifikasi yang telah Anda pilih:
> 1. **Upload Foto Menu**: Mendukung upload file gambar langsung dari penyimpanan perangkat atau kamera (dengan kompresi otomatis agar ringan dan cepat tersinkron ke cloud).
> 2. **Tema Warna**: Biru modern clean dengan aksen biru laut tajam (`#2563EB`, `#0284C7`, latar putih `#FFFFFF` dan `#F8FAFC`), dengan **tata letak/layout yang dipertahankan penuh**.
> 3. **Cakupan Import Data**: Mendukung seluruh data master dan operasional (Bahan Baku, Menu Resep HPP, Pembelian Restock, Transaksi Kasir, dan Pengeluaran).

---

## 1. Ikhtisar & Tujuan Solusi

- **Tema Light Putih-Biru Bersih**: Mengubah seluruh tampilan gelap (*dark slate/black*) pada sidebar, header, card, dan modal menjadi palet putih salju dengan aksen biru laut cerah (*ocean blue*) yang bersih, tajam, dan tidak melelahkan mata staf kasir saat operasional seharian, tanpa menggeser posisi layout tombol maupun grid.
- **Identifikasi Visual Kasir (Foto Menu)**: Menambahkan foto hidangan pada tombol dan kartu menu di kasir POS (misal: Dimsum Mentai Original, Mozzarella, Nori, Ekado, dll.) sehingga kasir baru maupun lama dapat langsung mengenali menu tanpa salah klik.
- **Koreksi & Edit Purchasing & Catatan Operasional**: Memungkinkan supervisor/owner mengedit data PO pembelian yang salah catat (jumlah kg/pcs, harga beli per unit, supplier, status lunas/hutang, atau catatan), serta otomatis mengoreksi stok dan HPP bahan baku yang bersangkutan.
- **Import Data Terpadu Excel & PDF**: Menyediakan halaman import interaktif yang dilengkapi tombol unduh template Excel (.xlsx/.csv) dan panduan PDF visual, disertai parser otomatis yang memverifikasi data sebelum disimpan ke Firestore.

---

## 2. Pengalaman Pengguna & Desain Visual (Light Theme Putih-Biru)

### A. Palet Warna & Tipografi
- **Background Utama**: `#FFFFFF` (Putih bersih) dan `#F8FAFC` (Slate 50 ultra-soft untuk background halaman).
- **Surface & Kartu**: `#FFFFFF` dengan garis tepi hairline halus `#E2E8F0` dan bayangan lembut (*soft shadow*).
- **Aksen Utama (Ocean Blue)**: `#2563EB` (Blue 600) dan `#1D4ED8` (Blue 700) untuk tombol aksi utama, header navigasi aktif, dan status penting.
- **Aksen Sekunder (Sky/Cyan)**: `#0284C7` (Sky 600) dan `#E0F2FE` (Sky 100) untuk badge penanda dan highlight baris.
- **Teks & Kontras**: `#0F172A` (Slate 900 untuk judul tebal), `#334155` (Slate 700 untuk teks body), dan `#64748B` untuk teks pembantu. Memenuhi standar aksesibilitas WCAG AA.
- **Layout Preservation**: Struktur 2-kolom POS (katalog menu di kiri, keranjang checkout di kanan), sidebar kiri fixed, serta header atas tetap berada di posisi yang persis sama.

### B. Alur Pengguna (User Flows)
1. **Kasir di Tab POS**:
   - Melihat kartu menu dengan foto visual resolusi tajam di bagian atas setiap kotak menu.
   - Tetap dapat mencari menu lewat search bar atau klik kategori, lalu klik kartu untuk memasukkan ke keranjang belanja.
2. **Owner/Admin di Tab Menu (Products)**:
   - Saat menambah atau mengedit menu, terdapat drop-zone foto: klik tombol "Pilih Foto / Ambil Foto" dari kamera atau galeri HP/laptop.
   - Preview foto langsung tampil dengan opsi crop/ganti foto.
3. **Supervisor/Owner di Tab Purchasing & Finance**:
   - Pada setiap baris riwayat pembelian (PO), terdapat tombol ikon **"Edit / Adjust PO"**.
   - Modal edit muncul untuk mengubah jumlah beli, harga satuan, supplier, tanggal, atau catatan tambahan.
   - Pada tab Finance, pengeluaran operasional memiliki tombol edit untuk memperbarui nominal dan catatan biaya.
4. **Tab Import Data (Excel & PDF)**:
   - Tampilan bersih dengan tab: *Import Bahan Baku*, *Import Menu*, *Import Pembelian*, *Import Transaksi*, dan *Import Biaya*.
   - Setiap tab memiliki tombol **"Unduh Template Excel"** dan **"Lihat Panduan Format PDF"**.
   - Fitur drag-and-drop file untuk mengunggah spreadsheet atau laporan PDF, dengan tabel validasi preview sebelum commit ke sistem cloud.

---

## 3. Keputusan Produk & Arsitektur Teknis

```
┌────────────────────────────────────────────────────────────────────────┐
│                   ERP & POS DIMSUM MENTAI 77 (LIGHT THEME)             │
├───────────────────┬────────────────────────────────────────────────────┤
│   SIDEBAR KIRI    │ HEADER ATAS: Status Cloud Live, Sync Manual, Akun  │
│  (Putih-Biru)     ├────────────────────────────────────────────────────┤
│                   │ KONTEN UTAMA:                                      │
│ • Dashboard       │ ┌──────────────────────┐ ┌───────────────────────┐ │
│ • Kasir (POS)     │ │ KATALOG MENU DENGAN  │ │ KERANJANG CHECKOUT    │ │
│ • Purchasing      │ │ FOTO (Grid Produk)   │ │ & PEMBAYARAN          │ │
│ • Menu & HPP      │ └──────────────────────┘ └───────────────────────┘ │
│ • Stok Bahan      │ ATAU TAB: Purchasing (Adjust), Finance, Import     │
│ • Import/Export   │                                                    │
│ • Setting Akun    │                                                    │
└───────────────────┴────────────────────────────────────────────────────┘
```

### A. Kompresi Foto di Sisi Klien (Client-Side Compression)
- Foto yang diunggah dikompresi otomatis via HTML5 Canvas menjadi format WebP/JPEG berukuran maksimal 400x400 piksel (~30KB-60KB).
- Data disimpan dalam string base64 / data URL teroptimasi yang tersimpan di dokumen Firestore `menuItems` secara langsung, sehingga foto dapat disinkronkan secara instan ke seluruh perangkat kasir tanpa membutuhkan bucket eksternal terpisah.

### B. Penyesuaian Purchasing & Rekalkulasi Stok
- Saat PO di-adjust:
  1. Menghitung selisih kuantitas baru vs lama.
  2. Menyesuaikan stok bahan baku di koleksi `materials`.
  3. Menghitung ulang harga rata-rata bahan (*Weighted Average Cost*).
  4. Menyimpan pembaruan ke Firestore secara real-time.

### C. Parser Import Excel & PDF
- Menggunakan library parsing tabular yang andal (`xlsx` untuk file Excel dan reader terstruktur untuk teks PDF).
- Memetakan baris spreadsheet/PDF ke format entitas TypeScript sistem ERP (`Material`, `MenuItem`, `PurchaseOrder`, `Transaction`, `Expense`).
- Validasi baris sebelum import: menandai baris yang memiliki nilai tidak valid atau kolom kosong.

---

## 4. Rencana Langkah Pengerjaan

1. **Transformasi Tema Putih-Biru (Layout Tetap)**:
   - Memperbarui `Sidebar.tsx`, `Header.tsx`, `PosTab.tsx`, `PurchasingTab.tsx`, `ProductsTab.tsx`, `MaterialsTab.tsx`, `FinanceTab.tsx`, `HistoryTab.tsx`, dan `AccountSettingsTab.tsx`.
   - Mengganti latar gelap dengan latar putih `#FFFFFF`, permukaan `#F8FAFC`, dan aksen biru laut `#2563EB` / `#0284C7`.
2. **Fitur Upload & Tampilan Foto Menu**:
   - Menambahkan input file foto dan handler kompresi canvas di `ProductsTab.tsx` dan `ERPContext.tsx`.
   - Mempercantik kartu menu di `PosTab.tsx` agar foto tampil dominan dan jelas di atas judul dan harga menu.
3. **Fitur Adjust Purchasing & Catatan Operasional**:
   - Menambahkan fungsi `updatePurchase` dan `updateExpense` di `ERPContext.tsx` serta sinkronisasi Firestore.
   - Menambahkan tombol edit dan modal penyesuaian di `PurchasingTab.tsx` dan `FinanceTab.tsx`.
4. **Halaman & Template Import Data Excel/PDF**:
   - Memperkaya `ImportExportTab.tsx` dengan kartu template yang menarik dan tombol unduh template file Excel/PDF.
   - Parser import untuk memproses file yang diunggah dan langsung menyimpan hasilnya ke state dan Cloud Firestore.
5. **Verifikasi Build & Sinkronisasi**:
   - Menjalankan `compile_applet` dan `lint_applet` untuk memastikan tidak ada kesalahan tipe data atau regresi.
