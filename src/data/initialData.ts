import { Material, MenuItem, PurchaseOrder, Expense, Transaction, ERPConfig, UserAccount, SalesTarget } from '../types/erp';

export const INITIAL_CONFIG: ERPConfig = {
  storeName: 'DIMSUM MENTAI 77 UNPAM',
  storeTagline: 'Outlet Dimsum Mentai 77 UNPAM (Universitas Pamulang)',
  storeAddress: 'Jl. Pamulang Permai 1, Samping Gapura, Kec. Pamulang, Kota Tangerang Selatan, Banten 15417',
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

export const DEFAULT_PAYMENT_METHODS: string[] = [
  'TUNAI',
  'QRIS',
  'TRANSFER',
  'DEBIT'
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

// Initial Material Inventory (Dimsum Mentai 77 UNPAM)
export const INITIAL_MATERIALS: Material[] = [
  {
    id: 'mat-1',
    code: 'B-01',
    name: 'Dimsum Ayam Beku (Frozen)',
    category: 'Daging & Isian',
    stock: 250,
    unit: 'pcs',
    minStock: 50,
    costPerUnit: 1200,
    supplier: 'Supplier Dimsum Fresh',
    lastUpdated: '2026-11-10'
  },
  {
    id: 'mat-2',
    code: 'B-02',
    name: 'Saus Mentai Special 77',
    category: 'Saus & Bumbu',
    stock: 3500,
    unit: 'gr',
    minStock: 800,
    costPerUnit: 85,
    supplier: 'Dapur Pusat 77',
    lastUpdated: '2026-11-10'
  },
  {
    id: 'mat-3',
    code: 'B-03',
    name: 'Tobiko Orange (Telur Ikan Terbang)',
    category: 'Topping & Keju',
    stock: 450,
    unit: 'gr',
    minStock: 100,
    costPerUnit: 150,
    supplier: 'Toko Bahari Fresh',
    lastUpdated: '2026-11-10'
  },
  {
    id: 'mat-4',
    code: 'B-04',
    name: 'Keju Mozzarella Grated',
    category: 'Topping & Keju',
    stock: 1200,
    unit: 'gr',
    minStock: 300,
    costPerUnit: 120,
    supplier: 'Dairy Mart Pamulang',
    lastUpdated: '2026-11-10'
  },
  {
    id: 'mat-5',
    code: 'B-05',
    name: 'Mika Lunchbox Dimsum + Tutup',
    category: 'Kemasan & Alat',
    stock: 180,
    unit: 'pcs',
    minStock: 40,
    costPerUnit: 650,
    supplier: 'Toko Plastik UNPAM',
    lastUpdated: '2026-11-10'
  },
  {
    id: 'mat-6',
    code: 'B-06',
    name: 'Sumpit Bambu Steril + Tusukan',
    category: 'Kemasan & Alat',
    stock: 220,
    unit: 'pcs',
    minStock: 50,
    costPerUnit: 200,
    supplier: 'Toko Plastik UNPAM',
    lastUpdated: '2026-11-10'
  },
  {
    id: 'mat-7',
    code: 'B-07',
    name: 'Nori Seaweed Bubuk / Tabur',
    category: 'Topping & Keju',
    stock: 300,
    unit: 'gr',
    minStock: 50,
    costPerUnit: 90,
    supplier: 'Distributor Bahan Jepang',
    lastUpdated: '2026-11-10'
  },
  {
    id: 'mat-8',
    code: 'B-08',
    name: 'Minyak Goreng Sawit',
    category: 'Saus & Bumbu',
    stock: 5000,
    unit: 'ml',
    minStock: 1000,
    costPerUnit: 16,
    supplier: 'Agen Sembako Pamulang',
    lastUpdated: '2026-11-10'
  },
  {
    id: 'mat-9',
    code: 'B-09',
    name: 'Saus Sambal Extra Pedas Sachet',
    category: 'Saus & Bumbu',
    stock: 500,
    unit: 'pcs',
    minStock: 100,
    costPerUnit: 350,
    supplier: 'Distributor Saus Pamulang',
    lastUpdated: '2026-11-10'
  },
  {
    id: 'mat-10',
    code: 'B-10',
    name: 'Teh Melati Wangi Tubruk',
    category: 'Bahan Minuman',
    stock: 1000,
    unit: 'gr',
    minStock: 200,
    costPerUnit: 40,
    supplier: 'Pasar Ciputat',
    lastUpdated: '2026-11-10'
  },
  {
    id: 'mat-11',
    code: 'B-11',
    name: 'Gula Pasir Kristal',
    category: 'Bahan Minuman',
    stock: 3000,
    unit: 'gr',
    minStock: 500,
    costPerUnit: 18,
    supplier: 'Agen Sembako Pamulang',
    lastUpdated: '2026-11-10'
  },
  {
    id: 'mat-12',
    code: 'B-12',
    name: 'Cup Plastik 22oz + Tutup & Sedotan',
    category: 'Kemasan & Alat',
    stock: 200,
    unit: 'pcs',
    minStock: 50,
    costPerUnit: 450,
    supplier: 'Toko Plastik UNPAM',
    lastUpdated: '2026-11-10'
  },
  {
    id: 'mat-13',
    code: 'B-13',
    name: 'Gas Butane Can Torch',
    category: 'Kemasan & Alat',
    stock: 8,
    unit: 'botol',
    minStock: 2,
    costPerUnit: 18000,
    supplier: 'Toko Gas Berkah',
    lastUpdated: '2026-11-10'
  },
  {
    id: 'mat-14',
    code: 'B-14',
    name: 'Baterai AA Timbangan Digital',
    category: 'Lainnya',
    stock: 12,
    unit: 'pcs',
    minStock: 4,
    costPerUnit: 5000,
    supplier: 'Toko Elektronik Pamulang',
    lastUpdated: '2026-11-10'
  },
  {
    id: 'mat-15',
    code: 'B-15',
    name: 'Tisu Makan Kotak',
    category: 'Kemasan & Alat',
    stock: 20,
    unit: 'pack',
    minStock: 5,
    costPerUnit: 8000,
    supplier: 'Toko Plastik UNPAM',
    lastUpdated: '2026-11-10'
  }
];

// Initial Finished Menu Items with Complete BOM Recipes
export const INITIAL_MENU_ITEMS: MenuItem[] = [
  {
    id: 'menu-1',
    code: 'DM-01',
    name: 'Dimsum Mentai Original (Isi 4)',
    category: 'Dimsum Mentai',
    categories: ['Dimsum Mentai'],
    price: 20000,
    description: '4 Pcs dimsum ayam lembut disiram saus mentai gurih creamy khas 77, di-torch harum dengan taburan tobiko renyah.',
    image: '/src/assets/images/dimsum_mentai_original_1793977235878.jpg',
    isAvailable: true,
    serviceFeeType: 'percentage',
    serviceFeeValue: 20,
    recipe: [
      { materialId: 'mat-1', qty: 4 },
      { materialId: 'mat-2', qty: 35 },
      { materialId: 'mat-3', qty: 5 },
      { materialId: 'mat-5', qty: 1 },
      { materialId: 'mat-6', qty: 1 }
    ]
  },
  {
    id: 'menu-2',
    code: 'DM-02',
    name: 'Dimsum Mentai Mozzarella Melt',
    category: 'Dimsum Mentai',
    categories: ['Dimsum Mentai'],
    price: 25000,
    description: 'Dimsum mentai topping keju mozzarella melimpah yang dibakar lumer melted berpadu saus mentai gurih.',
    image: '/src/assets/images/dimsum_mentai_mozzarella_1793977235926.jpg',
    isAvailable: true,
    serviceFeeType: 'percentage',
    serviceFeeValue: 20,
    recipe: [
      { materialId: 'mat-1', qty: 4 },
      { materialId: 'mat-2', qty: 35 },
      { materialId: 'mat-4', qty: 20 },
      { materialId: 'mat-3', qty: 5 },
      { materialId: 'mat-5', qty: 1 },
      { materialId: 'mat-6', qty: 1 }
    ]
  },
  {
    id: 'menu-3',
    code: 'DM-03',
    name: 'Dimsum Mentai Nori Crunch',
    category: 'Dimsum Mentai',
    categories: ['Dimsum Mentai'],
    price: 22000,
    description: 'Dimsum saus mentai torch taburan nori crispy gurih renyah.',
    image: '/src/assets/images/dimsum_mentai_nori_1793977237418.jpg',
    isAvailable: true,
    serviceFeeType: 'percentage',
    serviceFeeValue: 20,
    recipe: [
      { materialId: 'mat-1', qty: 4 },
      { materialId: 'mat-2', qty: 35 },
      { materialId: 'mat-7', qty: 3 },
      { materialId: 'mat-3', qty: 3 },
      { materialId: 'mat-5', qty: 1 },
      { materialId: 'mat-6', qty: 1 }
    ]
  },
  {
    id: 'menu-4',
    code: 'DM-04',
    name: 'Dimsum Goreng Crispy Original',
    category: 'Dimsum Goreng',
    categories: ['Dimsum Goreng'],
    price: 18000,
    description: 'Dimsum goreng kulit renyah garing isi daging ayam padat juicy disajikan dengan saus cocolan.',
    image: '/src/assets/images/dimsum_goreng_crispy_1793977238184.jpg',
    isAvailable: true,
    recipe: [
      { materialId: 'mat-1', qty: 4 },
      { materialId: 'mat-8', qty: 50 },
      { materialId: 'mat-9', qty: 2 },
      { materialId: 'mat-5', qty: 1 },
      { materialId: 'mat-6', qty: 1 }
    ]
  },
  {
    id: 'menu-5',
    code: 'MN-01',
    name: 'Es Teh Manis Melati Jumbo',
    category: 'Minuman',
    categories: ['Minuman'],
    price: 5000,
    description: 'Teh melati wangi manis segar porsi jumbo pelepas dahaga.',
    isAvailable: true,
    recipe: [
      { materialId: 'mat-10', qty: 15 },
      { materialId: 'mat-11', qty: 25 },
      { materialId: 'mat-12', qty: 1 }
    ]
  }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [];
export const INITIAL_PURCHASES: PurchaseOrder[] = [];
export const INITIAL_EXPENSES: Expense[] = [];
