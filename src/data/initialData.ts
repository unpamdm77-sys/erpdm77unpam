import { Material, MenuItem, PurchaseOrder, Expense, Transaction, ERPConfig, UserAccount, SalesTarget } from '../types/erp';

export const INITIAL_CONFIG: ERPConfig = {
  storeName: 'DIMSUM MENTAI 77 UNPAM',
  storeTagline: 'Outlet Dimsum Mentai 77 UNPAM (Universitas Pamulang)',
  storeAddress: 'Jl. Pamulang Permai 1 No.Samping Gapura, Kec. Pamulang, Kota Tangerang Selatan, Banten 15417',
  storePhone: '0819-9645-1323',
  cashierName: 'Kasir Shift 1 (Rian)',
  googleWebAppUrl: '',
  autoSyncGoogleSheet: false,
  paperSize: '58mm',
  qrisPayload: '00020101021226600016ID.CO.DIMSUM77.WWW011893600999012345678902150000000000000015204581253033605802ID5919DIMSUM MENTAI 77 UNPAM6013TANGSEL61051541762070703A016304ABCD',
  soundEnabled: true,
};

export const DEFAULT_SALES_TARGET: SalesTarget = {
  daily: 1500000,
  weekly: 10000000,
  monthly: 45000000,
};

export const DEFAULT_MENU_CATEGORIES: string[] = [
  'Dimsum Mentai',
  'Dimsum Goreng',
  'Dimsum Kukus',
  'Minuman',
  'Frozen Pack',
  'Extra Topping'
];

export const DEFAULT_MATERIAL_CATEGORIES: string[] = [
  'Daging & Isian',
  'Saus & Bumbu',
  'Topping & Keju',
  'Kemasan & Alat',
  'Bahan Minuman',
  'Lainnya'
];

export const INITIAL_USERS: UserAccount[] = [
  {
    id: 'usr-1',
    username: 'owner77',
    password: 'owner123',
    name: 'Haji Rahmat (Pemilik Usaha)',
    role: 'OWNER',
    phone: '0812-9988-7711',
    address: 'Pamulang Permai Blok A No. 12',
    joinDate: '2026-01-01',
    isActive: true
  },
  {
    id: 'usr-2',
    username: 'spv_dimas',
    password: 'spv123',
    name: 'Dimas Prasetyo (Kepala Toko UNPAM)',
    role: 'SUPERVISOR',
    phone: '0857-1122-3344',
    address: 'Jl. Pamulang Permai 1, Tangerang Selatan',
    joinDate: '2026-02-15',
    isActive: true
  },
  {
    id: 'usr-3',
    username: 'finance_siti',
    password: 'fin123',
    name: 'Siti Nurhaliza (Admin Finance & Pajak)',
    role: 'FINANCE',
    phone: '0813-4455-6677',
    address: 'Reni Jaya Pamulang Barat',
    joinDate: '2026-03-01',
    isActive: true
  },
  {
    id: 'usr-4',
    username: 'staff_rian',
    password: 'staff123',
    name: 'Rian Kasir (Staff Frontliner)',
    role: 'STAFF',
    phone: '0896-7788-9900',
    address: 'Jl. Surya Kencana Pamulang',
    joinDate: '2026-05-10',
    isActive: true
  }
];

export const INITIAL_MATERIALS: Material[] = [
  {
    id: 'mat-1',
    code: 'B-01',
    name: 'Dimsum Ayam Kukus Mentah (Pcs)',
    category: 'Daging & Isian',
    stock: 280,
    unit: 'pcs',
    minStock: 50,
    costPerUnit: 1750,
    supplier: 'Supplier Dimsum Fresh Tangerang',
    lastUpdated: '2026-11-02'
  },
  {
    id: 'mat-2',
    code: 'B-02',
    name: 'Dimsum Udang Mentah (Pcs)',
    category: 'Daging & Isian',
    stock: 140,
    unit: 'pcs',
    minStock: 30,
    costPerUnit: 2200,
    supplier: 'Supplier Dimsum Fresh Tangerang',
    lastUpdated: '2026-11-02'
  },
  {
    id: 'mat-3',
    code: 'B-03',
    name: 'Saus Mayonaise Mentai Racikan 77',
    category: 'Saus & Bumbu',
    stock: 3500,
    unit: 'gr',
    minStock: 800,
    costPerUnit: 90, // Rp 90 / gram (~Rp 90.000 / kg)
    supplier: 'Dapur Pusat Mentai 77',
    lastUpdated: '2026-11-02'
  },
  {
    id: 'mat-4',
    code: 'B-04',
    name: 'Tobiko Orange (Telur Ikan Terbang)',
    category: 'Topping & Keju',
    stock: 450,
    unit: 'gr',
    minStock: 100,
    costPerUnit: 280, // Rp 280 / gram (~Rp 140.000 / 500gr)
    supplier: 'Seafood Topping Toko Bahari',
    lastUpdated: '2026-11-02'
  },
  {
    id: 'mat-5',
    code: 'B-05',
    name: 'Keju Mozzarella Blok Parut',
    category: 'Topping & Keju',
    stock: 850,
    unit: 'gr',
    minStock: 250,
    costPerUnit: 110, // Rp 110 / gram (~Rp 110.000 / kg)
    supplier: 'Dairy Mart Ciputat',
    lastUpdated: '2026-11-02'
  },
  {
    id: 'mat-6',
    code: 'B-06',
    name: 'Nori Crispy Flakes / Tabur',
    category: 'Topping & Keju',
    stock: 320,
    unit: 'gr',
    minStock: 80,
    costPerUnit: 140,
    supplier: 'Toko Bahan Jepang Pamulang',
    lastUpdated: '2026-11-02'
  },
  {
    id: 'mat-7',
    code: 'B-07',
    name: 'Chili Oil Khas 77 (Botol Kecil/Gr)',
    category: 'Saus & Bumbu',
    stock: 1200,
    unit: 'gr',
    minStock: 300,
    costPerUnit: 45,
    supplier: 'Dapur Pusat Mentai 77',
    lastUpdated: '2026-11-02'
  },
  {
    id: 'mat-8',
    code: 'B-08',
    name: 'Mika Box Bento Dimsum + Tutup',
    category: 'Kemasan & Alat',
    stock: 180,
    unit: 'pcs',
    minStock: 40,
    costPerUnit: 650,
    supplier: 'Toko Plastik Makmur UNPAM',
    lastUpdated: '2026-11-02'
  },
  {
    id: 'mat-9',
    code: 'B-09',
    name: 'Sumpit Bambu Steril + Tusukan',
    category: 'Kemasan & Alat',
    stock: 220,
    unit: 'pcs',
    minStock: 50,
    costPerUnit: 200,
    supplier: 'Toko Plastik Makmur UNPAM',
    lastUpdated: '2026-11-02'
  },
  {
    id: 'mat-10',
    code: 'B-10',
    name: 'Cup Plastik Minuman 16oz + Tutup Seal',
    category: 'Kemasan & Alat',
    stock: 95,
    unit: 'pcs',
    minStock: 30,
    costPerUnit: 450,
    supplier: 'Toko Plastik Makmur UNPAM',
    lastUpdated: '2026-11-02'
  },
  {
    id: 'mat-11',
    code: 'B-11',
    name: 'Sirup Lemon & Sari Jeruk',
    category: 'Bahan Minuman',
    stock: 2500,
    unit: 'ml',
    minStock: 500,
    costPerUnit: 35, // Rp 35 / ml
    supplier: 'Superindo Pamulang',
    lastUpdated: '2026-11-02'
  },
  {
    id: 'mat-12',
    code: 'B-12',
    name: 'Teh Melati Wangi Tubruk',
    category: 'Bahan Minuman',
    stock: 1500,
    unit: 'gr',
    minStock: 300,
    costPerUnit: 50,
    supplier: 'Pasar Ciputat',
    lastUpdated: '2026-11-02'
  },
  {
    id: 'mat-13',
    code: 'B-13',
    name: 'Gas Butane Torch Kaleng (Refill)',
    category: 'Kemasan & Alat',
    stock: 6,
    unit: 'botol',
    minStock: 2,
    costPerUnit: 22000,
    supplier: 'Agen Gas Pamulang',
    lastUpdated: '2026-11-02'
  }
];

export const INITIAL_MENU_ITEMS: MenuItem[] = [
  {
    id: 'menu-1',
    code: 'DM-01',
    name: 'Dimsum Mentai Original (Isi 4)',
    category: 'Dimsum Mentai',
    price: 18000,
    image: '/src/assets/images/dimsum_mentai_original_1793977235878.jpg',
    description: '4 Pcs dimsum ayam lembut disiram saus mentai gurih creamy lalu ditorch wangi dan ditaburi tobiko.',
    isAvailable: true,
    recipe: [
      { materialId: 'mat-1', qty: 4 },   // 4 pcs ayam @ 1750 = 7000
      { materialId: 'mat-3', qty: 35 },  // 35 gr mentai @ 90 = 3150
      { materialId: 'mat-4', qty: 4 },   // 4 gr tobiko @ 280 = 1120
      { materialId: 'mat-8', qty: 1 },   // 1 mika box @ 650 = 650
      { materialId: 'mat-9', qty: 1 },   // 1 sumpit @ 200 = 200
    ]
  },
  {
    id: 'menu-2',
    code: 'DM-02',
    name: 'Dimsum Mentai Mozzarella (Isi 4)',
    category: 'Dimsum Mentai',
    price: 22000,
    image: '/src/assets/images/dimsum_mentai_mozzarella_1793977235926.jpg',
    description: 'Dimsum mentai favorit dengan lumeran keju mozzarella mulur dibakar torch sampai kecoklatan harum.',
    isAvailable: true,
    recipe: [
      { materialId: 'mat-1', qty: 4 },   // 4 pcs ayam = 7000
      { materialId: 'mat-3', qty: 30 },  // 30 gr mentai = 2700
      { materialId: 'mat-5', qty: 25 },  // 25 gr mozzarella @ 110 = 2750
      { materialId: 'mat-4', qty: 3 },   // 3 gr tobiko = 840
      { materialId: 'mat-8', qty: 1 },   // 650
      { materialId: 'mat-9', qty: 1 },   // 200
    ]
  },
  {
    id: 'menu-3',
    code: 'DM-03',
    name: 'Dimsum Mentai Nori Crunchy (Isi 4)',
    category: 'Dimsum Mentai',
    price: 20000,
    image: '/src/assets/images/dimsum_mentai_nori_1793977237418.jpg',
    description: 'Perpaduan lezat saus mentai gurih dengan limpahan taburan nori crispy Jepang yang renyah.',
    isAvailable: true,
    recipe: [
      { materialId: 'mat-1', qty: 4 },
      { materialId: 'mat-3', qty: 35 },
      { materialId: 'mat-6', qty: 10 },  // 10 gr nori @ 140 = 1400
      { materialId: 'mat-8', qty: 1 },
      { materialId: 'mat-9', qty: 1 },
    ]
  },
  {
    id: 'menu-4',
    code: 'DM-04',
    name: 'Dimsum Goreng Mentai Crispy (Isi 4)',
    category: 'Dimsum Goreng',
    price: 19000,
    image: '/src/assets/images/dimsum_goreng_crispy_1793977238184.jpg',
    description: 'Dimsum ayam goreng keemasan renyah di luar juicy di dalam disiram saus mentai panggang.',
    isAvailable: true,
    recipe: [
      { materialId: 'mat-1', qty: 4 },
      { materialId: 'mat-3', qty: 35 },
      { materialId: 'mat-4', qty: 4 },
      { materialId: 'mat-8', qty: 1 },
      { materialId: 'mat-9', qty: 1 },
    ]
  },
  {
    id: 'menu-5',
    code: 'DM-05',
    name: 'Dimsum Kukus Mix Udang & Ayam (Isi 4)',
    category: 'Dimsum Kukus',
    price: 16000,
    description: 'Original kukus hangat (2 Pcs Ayam + 2 Pcs Udang) disajikan dengan chili oil pedas mantap.',
    isAvailable: true,
    recipe: [
      { materialId: 'mat-1', qty: 2 },   // 2 ayam @ 1750 = 3500
      { materialId: 'mat-2', qty: 2 },   // 2 udang @ 2200 = 4400
      { materialId: 'mat-7', qty: 20 },  // 20 gr chili oil @ 45 = 900
      { materialId: 'mat-8', qty: 1 },   // 650
      { materialId: 'mat-9', qty: 1 },   // 200
    ]
  },
  {
    id: 'menu-6',
    code: 'DM-06',
    name: 'Dimsum Mentai Party Box (Isi 12)',
    category: 'Dimsum Mentai',
    price: 52000,
    description: 'Porsi rame-rame mahasiswa UNPAM! 12 Pcs dimsum mix, banjir saus mentai, double tobiko & mozzarella.',
    isAvailable: true,
    recipe: [
      { materialId: 'mat-1', qty: 8 },
      { materialId: 'mat-2', qty: 4 },
      { materialId: 'mat-3', qty: 90 },
      { materialId: 'mat-5', qty: 40 },
      { materialId: 'mat-4', qty: 10 },
      { materialId: 'mat-8', qty: 2 }, // double packaging box
      { materialId: 'mat-9', qty: 3 },
    ]
  },
  {
    id: 'menu-7',
    code: 'FZ-01',
    name: 'Dimsum Frozen Pack Isi 10 + Chili Oil',
    category: 'Frozen Pack',
    price: 35000,
    description: 'Dimsum beku higienis siap kukus/goreng di kost/rumah, include botol chili oil khas 77.',
    isAvailable: true,
    recipe: [
      { materialId: 'mat-1', qty: 10 },
      { materialId: 'mat-7', qty: 40 },
      { materialId: 'mat-8', qty: 1 },
    ]
  },
  {
    id: 'menu-8',
    code: 'MN-01',
    name: 'Es Teh Manis Melati Jumbo',
    category: 'Minuman',
    price: 5000,
    description: 'Teh melati racikan khas sedap wangi disajikan dingin segar pelepas dahaga.',
    isAvailable: true,
    recipe: [
      { materialId: 'mat-12', qty: 15 }, // 15 gr teh melati = 750
      { materialId: 'mat-10', qty: 1 },  // cup + sedotan = 450
    ]
  },
  {
    id: 'menu-9',
    code: 'MN-02',
    name: 'Es Lemon Tea Segar',
    category: 'Minuman',
    price: 8000,
    description: 'Perpaduan teh melati harum dengan perasan sari lemon asli segar asam manis pas.',
    isAvailable: true,
    recipe: [
      { materialId: 'mat-12', qty: 15 },
      { materialId: 'mat-11', qty: 30 }, // 30 ml sirup lemon = 1050
      { materialId: 'mat-10', qty: 1 },
    ]
  },
  {
    id: 'menu-10',
    code: 'TP-01',
    name: 'Extra Topping Keju Mozzarella Melt',
    category: 'Extra Topping',
    price: 5000,
    description: 'Tambah limpahan keju mozzarella yang dibakar lumer.',
    isAvailable: true,
    recipe: [
      { materialId: 'mat-5', qty: 30 },
    ]
  },
  {
    id: 'menu-11',
    code: 'TP-02',
    name: 'Extra Saus Chili Oil Botol',
    category: 'Extra Topping',
    price: 4000,
    description: 'Minyak cabe gurih pedas khas 77 porsi ekstra.',
    isAvailable: true,
    recipe: [
      { materialId: 'mat-7', qty: 40 },
    ]
  }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'trx-101',
    invoiceNo: 'INV-20261102-001',
    date: '2026-11-02T11:15:00',
    customer: 'Nadia (Mhs UNPAM)',
    orderType: 'Dine In',
    tableNo: 'Meja 03',
    paymentMethod: 'QRIS',
    items: [
      {
        id: 'menu-1',
        name: 'Dimsum Mentai Original (Isi 4)',
        price: 18000,
        qty: 2,
        subtotal: 36000,
        hppPerUnit: 12120,
        totalHpp: 24240,
        notes: 'Torch agak gosong sedikit mantap'
      },
      {
        id: 'menu-8',
        name: 'Es Teh Manis Melati Jumbo',
        price: 5000,
        qty: 2,
        subtotal: 10000,
        hppPerUnit: 1200,
        totalHpp: 2400
      }
    ],
    subtotal: 46000,
    discount: 0,
    total: 46000,
    totalHpp: 26640,
    grossProfit: 19360,
    status: 'COMPLETED',
    cashierName: 'Rian (Shift Siang)',
    syncedToGoogleSheet: true
  },
  {
    id: 'trx-102',
    invoiceNo: 'INV-20261102-002',
    date: '2026-11-02T12:30:00',
    customer: 'Budi Santoso',
    orderType: 'Take Away',
    paymentMethod: 'TUNAI',
    items: [
      {
        id: 'menu-2',
        name: 'Dimsum Mentai Mozzarella (Isi 4)',
        price: 22000,
        qty: 1,
        subtotal: 22000,
        hppPerUnit: 14140,
        totalHpp: 14140
      },
      {
        id: 'menu-9',
        name: 'Es Lemon Tea Segar',
        price: 8000,
        qty: 1,
        subtotal: 8000,
        hppPerUnit: 2250,
        totalHpp: 2250
      }
    ],
    subtotal: 30000,
    discount: 0,
    total: 30000,
    cashReceived: 50000,
    change: 20000,
    totalHpp: 16390,
    grossProfit: 13610,
    status: 'COMPLETED',
    cashierName: 'Rian (Shift Siang)',
    syncedToGoogleSheet: true
  },
  {
    id: 'trx-103',
    invoiceNo: 'INV-20261102-003',
    date: '2026-11-02T13:45:00',
    customer: 'Fajar Mahasiswa UNPAM',
    orderType: 'Dine In',
    tableNo: 'Meja 01',
    paymentMethod: 'QRIS',
    items: [
      {
        id: 'menu-6',
        name: 'Dimsum Mentai Party Box (Isi 12)',
        price: 52000,
        qty: 1,
        subtotal: 52000,
        hppPerUnit: 33450,
        totalHpp: 33450,
        notes: 'Piring terpisah ya kak'
      },
      {
        id: 'menu-8',
        name: 'Es Teh Manis Melati Jumbo',
        price: 5000,
        qty: 3,
        subtotal: 15000,
        hppPerUnit: 1200,
        totalHpp: 3600
      }
    ],
    subtotal: 67000,
    discount: 5000, // Diskon promo kumpul mahasiswa
    total: 62000,
    totalHpp: 37050,
    grossProfit: 24950,
    status: 'COMPLETED',
    cashierName: 'Rian (Shift Siang)',
    syncedToGoogleSheet: true
  }
];

export const INITIAL_PURCHASES: PurchaseOrder[] = [
  {
    id: 'po-1',
    poNumber: 'PO-20261101-01',
    date: '2026-11-01',
    supplier: 'Supplier Dimsum Fresh Tangerang',
    materialId: 'mat-1',
    materialName: 'Dimsum Ayam Kukus Mentah (Pcs)',
    qty: 300,
    unit: 'pcs',
    unitPrice: 1750,
    total: 525000,
    paymentStatus: 'LUNAS',
    notes: 'Restock mingguan reguler',
    syncedToGoogleSheet: true
  },
  {
    id: 'po-2',
    poNumber: 'PO-20261101-02',
    date: '2026-11-01',
    supplier: 'Dairy Mart Ciputat',
    materialId: 'mat-5',
    materialName: 'Keju Mozzarella Blok Parut',
    qty: 1000,
    unit: 'gr',
    unitPrice: 110,
    total: 110000,
    paymentStatus: 'LUNAS',
    notes: 'Grade A melty mozzarella',
    syncedToGoogleSheet: true
  },
  {
    id: 'po-3',
    poNumber: 'PO-20261102-01',
    date: '2026-11-02',
    supplier: 'Toko Plastik Makmur UNPAM',
    materialId: 'mat-8',
    materialName: 'Mika Box Bento Dimsum + Tutup',
    qty: 200,
    unit: 'pcs',
    unitPrice: 650,
    total: 130000,
    paymentStatus: 'LUNAS',
    notes: 'Tebal & tahan panas torch',
    syncedToGoogleSheet: true
  }
];

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'exp-1',
    expenseNo: 'EXP-20261101-01',
    date: '2026-11-01',
    name: 'Tabung Gas LPG 3kg (2 Tabung Operasional)',
    category: 'Gas LPG',
    amount: 46000,
    notes: 'Untuk kukusan dimsum gerobak',
    syncedToGoogleSheet: true
  },
  {
    id: 'exp-2',
    expenseNo: 'EXP-20261101-02',
    date: '2026-11-01',
    name: 'Iuran Kebersihan & Keamanan UNPAM',
    category: 'Kebersihan',
    amount: 50000,
    notes: 'Mingguan pedagang sekitar kampus',
    syncedToGoogleSheet: true
  },
  {
    id: 'exp-3',
    expenseNo: 'EXP-20261102-01',
    date: '2026-11-02',
    name: 'Beli Es Batu Kristal Higienis 2 Bal',
    category: 'Operasional',
    amount: 24000,
    notes: 'Untuk es teh & lemon tea',
    syncedToGoogleSheet: true
  }
];
