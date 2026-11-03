import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Material,
  MenuItem,
  CartItem,
  Transaction,
  PurchaseOrder,
  Expense,
  StockAdjustment,
  ERPConfig,
  PaymentMethod,
  ParkedOrder,
  ShiftSummary
} from '../types/erp';
import { mapRowsToBOM } from '../utils/excelExportImport';
import {
  INITIAL_MATERIALS,
  INITIAL_MENU_ITEMS,
  INITIAL_TRANSACTIONS,
  INITIAL_PURCHASES,
  INITIAL_EXPENSES,
  INITIAL_CONFIG
} from '../data/initialData';
import { posSound } from '../utils/formatters';

interface ERPContextType {
  materials: Material[];
  menuItems: MenuItem[];
  transactions: Transaction[];
  purchases: PurchaseOrder[];
  expenses: Expense[];
  adjustments: StockAdjustment[];
  config: ERPConfig;
  cart: CartItem[];
  customerName: string;
  orderType: 'Dine In' | 'Take Away' | 'Online Grab/Gojek';
  tableNo: string;
  discount: number;
  
  // Setters
  setCustomerName: (name: string) => void;
  setOrderType: (type: 'Dine In' | 'Take Away' | 'Online Grab/Gojek') => void;
  setTableNo: (table: string) => void;
  setDiscount: (discount: number) => void;
  updateConfig: (newConfig: Partial<ERPConfig>) => void;

  // POS & Cart
  addToCart: (item: MenuItem, qty?: number) => void;
  updateCartQty: (itemId: string, delta: number) => void;
  updateCartNotes: (itemId: string, notes: string) => void;
  removeCartItem: (itemId: string) => void;
  clearCart: () => void;
  calculateMenuHpp: (item: MenuItem) => number;
  checkMenuStockAvailability: (item: MenuItem) => { available: boolean; maxPortions: number; missingIngredient?: string };
  processCheckout: (
    paymentMethod: PaymentMethod,
    cashReceived?: number,
    notes?: string
  ) => Promise<Transaction>;

  // Materials
  addMaterial: (material: Omit<Material, 'id' | 'lastUpdated'>) => void;
  updateMaterial: (id: string, updates: Partial<Material>) => void;
  deleteMaterial: (id: string) => void;

  // Menu & HPP
  addMenuItem: (item: Omit<MenuItem, 'id'>) => void;
  updateMenuItem: (id: string, updates: Partial<MenuItem>) => void;
  deleteMenuItem: (id: string) => void;

  // Purchasing
  addPurchase: (po: Omit<PurchaseOrder, 'id' | 'poNumber' | 'date' | 'total'> & { date?: string }) => Promise<void>;
  deletePurchase: (id: string) => void;

  // Expenses
  addExpense: (exp: Omit<Expense, 'id' | 'expenseNo' | 'date'> & { date?: string }) => Promise<void>;
  deleteExpense: (id: string) => void;

  // Stock Adjustment
  addAdjustment: (data: {
    materialId: string;
    actualStock: number;
    reason: StockAdjustment['reason'];
    adjustedBy?: string;
  }) => void;

  // History & Refund
  refundTransaction: (transactionId: string) => void;

  // Google Sheets Sync
  syncWithGoogleSheet: (action: 'ADD_TRANSACTION' | 'ADD_PURCHASE' | 'ADD_EXPENSE', data: any) => Promise<{ success: boolean; message: string }>;
  syncAllToGoogleSheet: () => Promise<{ successCount: number; failCount: number }>;

  // Parked Orders (Hold & Recall)
  parkedOrders: ParkedOrder[];
  parkCurrentOrder: (customLabel?: string) => boolean;
  recallParkedOrder: (orderId: string) => void;
  deleteParkedOrder: (orderId: string) => void;

  // Import Batch for BOM, Bahan Baku, and Menu
  importMaterialsBatch: (newMaterials: Material[]) => { added: number; updated: number };
  importMenuBatch: (newMenuItems: MenuItem[]) => { added: number; updated: number };
  importBOMBatch: (bomRows: any[]) => { matchedCount: number; unmatchedErrors: string[] };

  // Shift & Cashier Utilities
  getShiftSummary: () => ShiftSummary;
  addQuickToppingToCartItem: (itemId: string, toppingName: string, additionalPrice: number) => void;
  resetAllData: () => void;
}

const ERPContext = createContext<ERPContextType | undefined>(undefined);

const STORAGE_KEYS = {
  MATERIALS: 'dimsum77_materials_v1',
  MENU: 'dimsum77_menu_v1',
  TRANSACTIONS: 'dimsum77_transactions_v1',
  PURCHASES: 'dimsum77_purchases_v1',
  EXPENSES: 'dimsum77_expenses_v1',
  ADJUSTMENTS: 'dimsum77_adjustments_v1',
  CONFIG: 'dimsum77_config_v1',
  PARKED: 'dimsum77_parked_v1',
};

export const ERPProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [materials, setMaterials] = useState<Material[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MATERIALS);
    return saved ? JSON.parse(saved) : INITIAL_MATERIALS;
  });

  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MENU);
    return saved ? JSON.parse(saved) : INITIAL_MENU_ITEMS;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [purchases, setPurchases] = useState<PurchaseOrder[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PURCHASES);
    return saved ? JSON.parse(saved) : INITIAL_PURCHASES;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });

  const [adjustments, setAdjustments] = useState<StockAdjustment[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ADJUSTMENTS);
    return saved ? JSON.parse(saved) : [];
  });

  const [parkedOrders, setParkedOrders] = useState<ParkedOrder[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PARKED);
    return saved ? JSON.parse(saved) : [];
  });

  const [config, setConfig] = useState<ERPConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
    return saved ? { ...INITIAL_CONFIG, ...JSON.parse(saved) } : INITIAL_CONFIG;
  });

  // Active POS Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState<string>('Pelanggan Dimsum');
  const [orderType, setOrderType] = useState<'Dine In' | 'Take Away' | 'Online Grab/Gojek'>('Dine In');
  const [tableNo, setTableNo] = useState<string>('Meja 01');
  const [discount, setDiscount] = useState<number>(0);

  // Persistence effects
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PARKED, JSON.stringify(parkedOrders));
  }, [parkedOrders]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(materials));
  }, [materials]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(menuItems));
  }, [menuItems]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(purchases));
  }, [purchases]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ADJUSTMENTS, JSON.stringify(adjustments));
  }, [adjustments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  }, [config]);

  const updateConfig = (newConfig: Partial<ERPConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  // Calculate live HPP of a menu item based on current material costs
  const calculateMenuHpp = (item: MenuItem): number => {
    if (!item.recipe || item.recipe.length === 0) return 0;
    return item.recipe.reduce((total, ing) => {
      const mat = materials.find(m => m.id === ing.materialId);
      return total + (mat ? mat.costPerUnit * ing.qty : 0);
    }, 0);
  };

  // Check how many portions can be served based on current raw material inventory
  const checkMenuStockAvailability = (item: MenuItem): { available: boolean; maxPortions: number; missingIngredient?: string } => {
    if (!item.recipe || item.recipe.length === 0) {
      return { available: item.isAvailable, maxPortions: 999 };
    }

    let minPortions = 99999;
    let missingName: string | undefined = undefined;

    for (const ing of item.recipe) {
      const mat = materials.find(m => m.id === ing.materialId);
      if (!mat || mat.stock <= 0) {
        return { available: false, maxPortions: 0, missingIngredient: mat ? mat.name : 'Bahan tidak ditemukan' };
      }
      const possible = Math.floor(mat.stock / ing.qty);
      if (possible < minPortions) {
        minPortions = possible;
        if (possible <= 0) {
          missingName = mat.name;
        }
      }
    }

    return {
      available: item.isAvailable && minPortions > 0,
      maxPortions: Math.max(0, minPortions),
      missingIngredient: missingName
    };
  };

  // Cart operations
  const addToCart = (item: MenuItem, qty = 1) => {
    posSound.playBeep();
    setCart(prev => {
      const existing = prev.find(i => i.menuItem.id === item.id);
      const hpp = calculateMenuHpp(item);
      if (existing) {
        return prev.map(i =>
          i.menuItem.id === item.id
            ? { ...i, qty: i.qty + qty, calculatedHpp: hpp }
            : i
        );
      }
      return [...prev, { menuItem: item, qty, calculatedHpp: hpp }];
    });
  };

  const updateCartQty = (itemId: string, delta: number) => {
    posSound.playBeep();
    setCart(prev => {
      return prev
        .map(i => {
          if (i.menuItem.id === itemId) {
            const newQty = i.qty + delta;
            return newQty > 0 ? { ...i, qty: newQty } : null;
          }
          return i;
        })
        .filter((i): i is CartItem => i !== null);
    });
  };

  const updateCartNotes = (itemId: string, notes: string) => {
    setCart(prev =>
      prev.map(i => (i.menuItem.id === itemId ? { ...i, notes } : i))
    );
  };

  const removeCartItem = (itemId: string) => {
    setCart(prev => prev.filter(i => i.menuItem.id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
  };

  // Google Sheets Apps Script Webhook Integration
  const syncWithGoogleSheet = async (action: 'ADD_TRANSACTION' | 'ADD_PURCHASE' | 'ADD_EXPENSE', data: any): Promise<{ success: boolean; message: string }> => {
    if (!config.googleWebAppUrl || !config.googleWebAppUrl.trim().startsWith('http')) {
      return { success: false, message: 'URL Google Apps Script belum diisi di Pengaturan.' };
    }

    try {
      // Sends payload matching the user's processERPAction Google Apps Script engine
      const payload = {
        action,
        data
      };

      // In browser to Google Apps Script Web App, mode: 'no-cors' is typically used for direct execution without preflight issues
      await fetch(config.googleWebAppUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      return { status: 'SUCCESS', success: true, message: 'Terkirim ke Google Sheet!' } as any;
    } catch (err: any) {
      console.warn('Google Sheets sync notice:', err);
      return { success: false, message: err?.message || 'Gagal mengirim ke Google Apps Script.' };
    }
  };

  // Complete checkout & BOM stock deduction
  const processCheckout = async (
    paymentMethod: PaymentMethod,
    cashReceived?: number,
    notes?: string
  ): Promise<Transaction> => {
    if (cart.length === 0) {
      throw new Error('Keranjang belanja masih kosong!');
    }

    const subtotal = cart.reduce((sum, item) => sum + item.menuItem.price * item.qty, 0);
    const total = Math.max(0, subtotal - discount);
    const totalHpp = cart.reduce((sum, item) => sum + item.calculatedHpp * item.qty, 0);
    const grossProfit = total - totalHpp;

    const change = cashReceived && cashReceived >= total ? cashReceived - total : 0;

    const now = new Date();
    const dateStr = now.toISOString();
    const ymd = now.getFullYear().toString() + (now.getMonth() + 1).toString().padStart(2, '0') + now.getDate().toString().padStart(2, '0');
    const seq = (transactions.length + 1).toString().padStart(3, '0');
    const invoiceNo = `INV-${ymd}-${seq}`;

    const transactionItems = cart.map(i => ({
      id: i.menuItem.id,
      name: i.menuItem.name,
      price: i.menuItem.price,
      qty: i.qty,
      subtotal: i.menuItem.price * i.qty,
      hppPerUnit: i.calculatedHpp,
      totalHpp: i.calculatedHpp * i.qty,
      notes: i.notes || notes
    }));

    // 1. Deduct Materials from Inventory via Bill of Materials (BOM)
    setMaterials(currentMaterials => {
      const updated = currentMaterials.map(mat => ({ ...mat }));

      cart.forEach(cartItem => {
        if (!cartItem.menuItem.recipe) return;
        cartItem.menuItem.recipe.forEach(recipeIng => {
          const target = updated.find(m => m.id === recipeIng.materialId);
          if (target) {
            const deduction = recipeIng.qty * cartItem.qty;
            target.stock = Math.max(0, target.stock - deduction);
            target.lastUpdated = new Date().toISOString().slice(0, 10);
          }
        });
      });

      return updated;
    });

    // 2. Create Transaction object
    const newTransaction: Transaction = {
      id: `trx-${Date.now()}`,
      invoiceNo,
      date: dateStr,
      customer: customerName || 'Pelanggan Umum',
      orderType,
      tableNo: orderType === 'Dine In' ? tableNo : undefined,
      paymentMethod,
      items: transactionItems,
      subtotal,
      discount,
      total,
      cashReceived,
      change,
      totalHpp,
      grossProfit,
      status: 'COMPLETED',
      cashierName: config.cashierName,
      syncedToGoogleSheet: false
    };

    // 3. Play sound & celebratory confetti
    posSound.playCashRegister();
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 }
      });
    } catch {
      // Ignore
    }

    // 4. Update transactions state
    setTransactions(prev => [newTransaction, ...prev]);

    // 5. Try syncing to Google Sheet if enabled
    if (config.autoSyncGoogleSheet && config.googleWebAppUrl) {
      syncWithGoogleSheet('ADD_TRANSACTION', {
        id: newTransaction.invoiceNo,
        date: newTransaction.date,
        customer: newTransaction.customer,
        paymentMethod: newTransaction.paymentMethod,
        items: newTransaction.items,
        subtotal: newTransaction.subtotal,
        discount: newTransaction.discount,
        total: newTransaction.total,
        totalHpp: newTransaction.totalHpp,
        grossProfit: newTransaction.grossProfit
      }).then(res => {
        if (res.success) {
          setTransactions(prev =>
            prev.map(t => (t.id === newTransaction.id ? { ...t, syncedToGoogleSheet: true } : t))
          );
        }
      });
    }

    // Reset Cart
    clearCart();

    return newTransaction;
  };

  // Purchasing restock
  const addPurchase = async (poData: Omit<PurchaseOrder, 'id' | 'poNumber' | 'date' | 'total'> & { date?: string }) => {
    const now = new Date();
    const dateStr = poData.date || now.toISOString().slice(0, 10);
    const ymd = now.getFullYear().toString() + (now.getMonth() + 1).toString().padStart(2, '0') + now.getDate().toString().padStart(2, '0');
    const seq = (purchases.length + 1).toString().padStart(2, '0');
    const poNumber = `PO-${ymd}-${seq}`;
    const total = poData.qty * poData.unitPrice;

    const newPO: PurchaseOrder = {
      id: `po-${Date.now()}`,
      poNumber,
      date: dateStr,
      supplier: poData.supplier,
      materialId: poData.materialId,
      materialName: poData.materialName,
      qty: poData.qty,
      unit: poData.unit,
      unitPrice: poData.unitPrice,
      total,
      paymentStatus: poData.paymentStatus,
      notes: poData.notes,
      syncedToGoogleSheet: false
    };

    // Increase material stock and update weighted average cost
    setMaterials(prev =>
      prev.map(mat => {
        if (mat.id === poData.materialId) {
          const currentTotalVal = mat.stock * mat.costPerUnit;
          const purchaseVal = poData.qty * poData.unitPrice;
          const newStock = mat.stock + poData.qty;
          const newAvgCost = newStock > 0 ? Math.round((currentTotalVal + purchaseVal) / newStock) : poData.unitPrice;

          return {
            ...mat,
            stock: newStock,
            costPerUnit: newAvgCost,
            supplier: poData.supplier || mat.supplier,
            lastUpdated: dateStr
          };
        }
        return mat;
      })
    );

    setPurchases(prev => [newPO, ...prev]);

    // Sync to GAS
    if (config.autoSyncGoogleSheet && config.googleWebAppUrl) {
      syncWithGoogleSheet('ADD_PURCHASE', {
        id: newPO.poNumber,
        date: newPO.date,
        supplier: newPO.supplier,
        materialName: newPO.materialName,
        qty: newPO.qty,
        unit: newPO.unit,
        unitPrice: newPO.unitPrice,
        total: newPO.total
      });
    }
  };

  const deletePurchase = (id: string) => {
    setPurchases(prev => prev.filter(p => p.id !== id));
  };

  // Non-stock operational expenses
  const addExpense = async (expData: Omit<Expense, 'id' | 'expenseNo' | 'date'> & { date?: string }) => {
    const now = new Date();
    const dateStr = expData.date || now.toISOString().slice(0, 10);
    const ymd = now.getFullYear().toString() + (now.getMonth() + 1).toString().padStart(2, '0') + now.getDate().toString().padStart(2, '0');
    const seq = (expenses.length + 1).toString().padStart(2, '0');
    const expenseNo = `EXP-${ymd}-${seq}`;

    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      expenseNo,
      date: dateStr,
      name: expData.name,
      category: expData.category,
      amount: expData.amount,
      notes: expData.notes,
      syncedToGoogleSheet: false
    };

    setExpenses(prev => [newExpense, ...prev]);

    if (config.autoSyncGoogleSheet && config.googleWebAppUrl) {
      syncWithGoogleSheet('ADD_EXPENSE', {
        id: newExpense.expenseNo,
        name: newExpense.name,
        amount: newExpense.amount
      });
    }
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  // Stock Adjustment / Stock Opname
  const addAdjustment = (data: {
    materialId: string;
    actualStock: number;
    reason: StockAdjustment['reason'];
    adjustedBy?: string;
  }) => {
    const mat = materials.find(m => m.id === data.materialId);
    if (!mat) return;

    const diff = data.actualStock - mat.stock;
    const lossCost = diff < 0 ? Math.abs(diff) * mat.costPerUnit : 0;

    const newAdjustment: StockAdjustment = {
      id: `adj-${Date.now()}`,
      date: new Date().toISOString(),
      materialId: mat.id,
      materialName: mat.name,
      unit: mat.unit,
      systemStock: mat.stock,
      actualStock: data.actualStock,
      difference: diff,
      reason: data.reason,
      lossCost,
      adjustedBy: data.adjustedBy || config.cashierName
    };

    // Update material to actual stock
    setMaterials(prev =>
      prev.map(m =>
        m.id === mat.id
          ? { ...m, stock: data.actualStock, lastUpdated: new Date().toISOString().slice(0, 10) }
          : m
      )
    );

    setAdjustments(prev => [newAdjustment, ...prev]);
  };

  // Void / Refund Transaction (Restores Raw Material Stock!)
  const refundTransaction = (transactionId: string) => {
    const trx = transactions.find(t => t.id === transactionId);
    if (!trx || trx.status === 'REFUNDED') return;

    // Restore raw materials
    setMaterials(currentMaterials => {
      const updated = currentMaterials.map(m => ({ ...m }));

      trx.items.forEach(tItem => {
        const menuItem = menuItems.find(m => m.name === tItem.name);
        if (menuItem && menuItem.recipe) {
          menuItem.recipe.forEach(recipeIng => {
            const target = updated.find(m => m.id === recipeIng.materialId);
            if (target) {
              target.stock += recipeIng.qty * tItem.qty;
            }
          });
        }
      });

      return updated;
    });

    setTransactions(prev =>
      prev.map(t => (t.id === transactionId ? { ...t, status: 'REFUNDED' } : t))
    );
  };

  // Materials CRUD
  const addMaterial = (mat: Omit<Material, 'id' | 'lastUpdated'>) => {
    const newMat: Material = {
      ...mat,
      id: `mat-${Date.now()}`,
      lastUpdated: new Date().toISOString().slice(0, 10)
    };
    setMaterials(prev => [...prev, newMat]);
  };

  const updateMaterial = (id: string, updates: Partial<Material>) => {
    setMaterials(prev =>
      prev.map(m =>
        m.id === id ? { ...m, ...updates, lastUpdated: new Date().toISOString().slice(0, 10) } : m
      )
    );
  };

  const deleteMaterial = (id: string) => {
    setMaterials(prev => prev.filter(m => m.id !== id));
  };

  // Menu items CRUD
  const addMenuItem = (item: Omit<MenuItem, 'id'>) => {
    const newItem: MenuItem = {
      ...item,
      id: `menu-${Date.now()}`
    };
    setMenuItems(prev => [...prev, newItem]);
  };

  const updateMenuItem = (id: string, updates: Partial<MenuItem>) => {
    setMenuItems(prev =>
      prev.map(m => (m.id === id ? { ...m, ...updates } : m))
    );
  };

  const deleteMenuItem = (id: string) => {
    setMenuItems(prev => prev.filter(m => m.id !== id));
  };

  // Parked Orders (Hold & Recall)
  const parkCurrentOrder = (customLabel?: string): boolean => {
    if (cart.length === 0) return false;
    const subtotal = cart.reduce((sum, item) => sum + item.menuItem.price * item.qty, 0);
    const total = Math.max(0, subtotal - discount);

    const defaultLabel = orderType === 'Dine In'
      ? `${tableNo} - ${customerName}`
      : `${orderType} - ${customerName}`;

    const newParked: ParkedOrder = {
      id: `parked-${Date.now()}`,
      timestamp: new Date().toISOString(),
      label: customLabel || defaultLabel,
      customer: customerName,
      orderType,
      tableNo: orderType === 'Dine In' ? tableNo : undefined,
      cart: [...cart],
      discount,
      total
    };

    setParkedOrders(prev => [newParked, ...prev]);
    clearCart();
    setCustomerName('Pelanggan Dimsum');
    return true;
  };

  const recallParkedOrder = (orderId: string) => {
    const target = parkedOrders.find(p => p.id === orderId);
    if (!target) return;

    setCart(target.cart);
    setCustomerName(target.customer);
    setOrderType(target.orderType);
    if (target.tableNo) setTableNo(target.tableNo);
    setDiscount(target.discount);

    setParkedOrders(prev => prev.filter(p => p.id !== orderId));
  };

  const deleteParkedOrder = (orderId: string) => {
    setParkedOrders(prev => prev.filter(p => p.id !== orderId));
  };

  // Batch import materials from Excel / CSV (Updates existing if matched, else appends)
  const importMaterialsBatch = (newMats: Material[]): { added: number; updated: number } => {
    let added = 0;
    let updated = 0;

    setMaterials(prev => {
      const copy = [...prev];
      newMats.forEach(nm => {
        const existingIdx = copy.findIndex(
          m => m.code.toLowerCase() === nm.code.toLowerCase() || m.name.toLowerCase() === nm.name.toLowerCase()
        );
        if (existingIdx >= 0) {
          copy[existingIdx] = {
            ...copy[existingIdx],
            ...nm,
            id: copy[existingIdx].id,
            lastUpdated: new Date().toISOString().slice(0, 10)
          };
          updated++;
        } else {
          copy.push(nm);
          added++;
        }
      });
      return copy;
    });

    return { added, updated };
  };

  // Batch import Menu items from Excel / CSV
  const importMenuBatch = (newMenuItems: MenuItem[]): { added: number; updated: number } => {
    let added = 0;
    let updated = 0;

    setMenuItems(prev => {
      const copy = [...prev];
      newMenuItems.forEach(nMenu => {
        const existingIdx = copy.findIndex(
          m => m.code.toLowerCase() === nMenu.code.toLowerCase() || m.name.toLowerCase() === nMenu.name.toLowerCase()
        );
        if (existingIdx >= 0) {
          copy[existingIdx] = {
            ...copy[existingIdx],
            ...nMenu,
            id: copy[existingIdx].id,
            recipe: copy[existingIdx].recipe.length > 0 ? copy[existingIdx].recipe : nMenu.recipe
          };
          updated++;
        } else {
          copy.push(nMenu);
          added++;
        }
      });
      return copy;
    });

    return { added, updated };
  };

  // Batch import BOM (Recipe Formulas) linking Menu with Raw Materials
  const importBOMBatch = (bomRows: any[]): { matchedCount: number; unmatchedErrors: string[] } => {
    const res = mapRowsToBOM(bomRows, menuItems, materials);
    if (res.matchedCount > 0) {
      setMenuItems(res.updatedMenuItems);
    }
    return {
      matchedCount: res.matchedCount,
      unmatchedErrors: res.unmatchedErrors
    };
  };

  // Quick modifier / Topping addition for Cashier
  const addQuickToppingToCartItem = (itemId: string, toppingName: string, additionalPrice: number) => {
    setCart(prev =>
      prev.map(i => {
        if (i.menuItem.id === itemId) {
          const currentNotes = i.notes ? `${i.notes}, +${toppingName}` : `+${toppingName}`;
          return {
            ...i,
            notes: currentNotes,
            menuItem: {
              ...i.menuItem,
              price: i.menuItem.price + additionalPrice
            }
          };
        }
        return i;
      })
    );
  };

  // Cashier Shift Summary (X-Reading)
  const getShiftSummary = (): ShiftSummary => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const shiftTrx = transactions.filter(t => t.status === 'COMPLETED' && t.date.startsWith(todayStr));

    const grossSales = shiftTrx.reduce((sum, t) => sum + t.subtotal, 0);
    const totalDiscounts = shiftTrx.reduce((sum, t) => sum + t.discount, 0);
    const netSales = shiftTrx.reduce((sum, t) => sum + t.total, 0);
    const cashSales = shiftTrx.filter(t => t.paymentMethod === 'TUNAI').reduce((sum, t) => sum + t.total, 0);
    const qrisSales = shiftTrx.filter(t => t.paymentMethod === 'QRIS').reduce((sum, t) => sum + t.total, 0);
    const transferSales = shiftTrx.filter(t => t.paymentMethod === 'TRANSFER').reduce((sum, t) => sum + t.total, 0);
    const debitSales = shiftTrx.filter(t => t.paymentMethod === 'DEBIT').reduce((sum, t) => sum + t.total, 0);
    const totalHpp = shiftTrx.reduce((sum, t) => sum + t.totalHpp, 0);
    const grossProfit = netSales - totalHpp;

    return {
      cashierName: config.cashierName,
      startTime: shiftTrx.length > 0 ? shiftTrx[shiftTrx.length - 1].date : new Date().toISOString(),
      totalTransactions: shiftTrx.length,
      grossSales,
      totalDiscounts,
      netSales,
      cashSales,
      qrisSales,
      transferSales,
      debitSales,
      totalHpp,
      grossProfit
    };
  };

  // Sync all transactions & purchases & expenses to GAS
  const syncAllToGoogleSheet = async () => {
    let successCount = 0;
    let failCount = 0;

    for (const trx of transactions) {
      if (!trx.syncedToGoogleSheet) {
        const res = await syncWithGoogleSheet('ADD_TRANSACTION', {
          id: trx.invoiceNo,
          date: trx.date,
          customer: trx.customer,
          paymentMethod: trx.paymentMethod,
          items: trx.items,
          subtotal: trx.subtotal,
          discount: trx.discount,
          total: trx.total,
          totalHpp: trx.totalHpp,
          grossProfit: trx.grossProfit
        });
        if (res.success) {
          successCount++;
        } else {
          failCount++;
        }
      }
    }

    return { successCount, failCount };
  };

  const resetAllData = () => {
    setMaterials(INITIAL_MATERIALS);
    setMenuItems(INITIAL_MENU_ITEMS);
    setTransactions(INITIAL_TRANSACTIONS);
    setPurchases(INITIAL_PURCHASES);
    setExpenses(INITIAL_EXPENSES);
    setAdjustments([]);
    setParkedOrders([]);
    setConfig(INITIAL_CONFIG);
    setCart([]);
  };

  return (
    <ERPContext.Provider
      value={{
        materials,
        menuItems,
        transactions,
        purchases,
        expenses,
        adjustments,
        parkedOrders,
        config,
        cart,
        customerName,
        orderType,
        tableNo,
        discount,
        setCustomerName,
        setOrderType,
        setTableNo,
        setDiscount,
        updateConfig,
        addToCart,
        updateCartQty,
        updateCartNotes,
        removeCartItem,
        clearCart,
        calculateMenuHpp,
        checkMenuStockAvailability,
        processCheckout,
        parkCurrentOrder,
        recallParkedOrder,
        deleteParkedOrder,
        addMaterial,
        updateMaterial,
        deleteMaterial,
        addMenuItem,
        updateMenuItem,
        deleteMenuItem,
        addPurchase,
        deletePurchase,
        addExpense,
        deleteExpense,
        addAdjustment,
        refundTransaction,
        syncWithGoogleSheet,
        syncAllToGoogleSheet,
        importMaterialsBatch,
        importMenuBatch,
        importBOMBatch,
        getShiftSummary,
        addQuickToppingToCartItem,
        resetAllData,
      }}
    >
      {children}
    </ERPContext.Provider>
  );
};

export const useERP = () => {
  const context = useContext(ERPContext);
  if (!context) {
    throw new Error('useERP must be used within an ERPProvider');
  }
  return context;
};
