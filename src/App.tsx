/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  CreditCard, BookOpen, Smartphone, ShieldCheck, HelpCircle, HardDriveDownload, Sparkles, RotateCcw, TrendingDown, Layers, Plus
} from 'lucide-react';
import { FixedExpense, DailyExpense, CardPurchase } from './types';
import AndroidSimulator from './components/AndroidSimulator';
import KotlinCodeExplorer from './components/KotlinCodeExplorer';
import AddEditModal from './components/AddEditModal';

// Mock preset state values to make the initial experience rich and testable
const PRESET_FIXED_EXPENSES: FixedExpense[] = [
  {
    id: 'f-1',
    name: 'Alquiler Departamento',
    amount: 65000,
    startDate: '2026-05',
    isActive: true,
    category: 'Alquiler / Hogar',
    notes: 'Ajuste semestral incluido'
  },
  {
    id: 'f-2',
    name: 'Plan Internet Fibra',
    amount: 12000,
    startDate: '2026-05',
    isActive: true,
    category: 'Servicios',
    notes: 'Claro 300 Megas'
  },
  {
    id: 'f-3',
    name: 'Suscripción Netflix Duo',
    amount: 4500,
    startDate: '2026-05',
    isActive: true,
    category: 'Suscripciones',
    notes: 'Débito automático'
  }
];

const PRESET_DAILY_EXPENSES: DailyExpense[] = [
  {
    id: 'd-1',
    name: 'Compra Supermercado',
    amount: 32000,
    date: '2026-05-22',
    category: 'Supermercado',
    paymentMethod: 'Débito',
    description: 'Compra semanal de carnes y verduras'
  },
  {
    id: 'd-2',
    name: 'Carga Nafta Shell',
    amount: 15000,
    date: '2026-05-21',
    category: 'Transporte',
    paymentMethod: 'Transferencia',
    description: 'Nafta Super tanque parcial'
  },
  {
    id: 'd-3',
    name: 'Cena pizzería con amigos',
    amount: 9500,
    date: '2026-05-19',
    category: 'Comida / Salidas',
    paymentMethod: 'Efectivo',
    description: 'Pizza grande y gaseosas'
  }
];

const PRESET_CARD_PURCHASES: CardPurchase[] = [
  {
    id: 'c-1',
    name: 'Smart TV 50" 4K',
    totalAmount: 90000,
    purchaseDate: '2026-05-15',
    installmentsCount: 3,
    cardName: 'Visa',
    description: 'Compra en cuotas sin interés. TV para el living.'
  }
];

export default function App() {
  // Key state variables
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
  const [dailyExpenses, setDailyExpenses] = useState<DailyExpense[]>([]);
  const [cardPurchases, setCardPurchases] = useState<CardPurchase[]>([]);
  
  // Selected observation month (defaults to Mayo 2026 matching current date simulation)
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-05');

  // Modal control triggers
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'fixed' | 'daily' | 'cards'>('daily');
  const [editingItem, setEditingItem] = useState<any>(null);

  // --- 1. LOCAL STORAGE PERSISTENCE ENGINE ---
  useEffect(() => {
    const storedFixed = localStorage.getItem('gastos_fixed');
    const storedDaily = localStorage.getItem('gastos_daily');
    const storedCards = localStorage.getItem('gastos_cards');

    if (storedFixed && storedDaily && storedCards) {
      try {
        setFixedExpenses(JSON.parse(storedFixed));
        setDailyExpenses(JSON.parse(storedDaily));
        setCardPurchases(JSON.parse(storedCards));
      } catch (e) {
        console.error('Error parsing stored data, using fallbacks', e);
        setFixedExpenses(PRESET_FIXED_EXPENSES);
        setDailyExpenses(PRESET_DAILY_EXPENSES);
        setCardPurchases(PRESET_CARD_PURCHASES);
      }
    } else {
      // Initialize with healthy fintech simulation data
      setFixedExpenses(PRESET_FIXED_EXPENSES);
      setDailyExpenses(PRESET_DAILY_EXPENSES);
      setCardPurchases(PRESET_CARD_PURCHASES);
      
      localStorage.setItem('gastos_fixed', JSON.stringify(PRESET_FIXED_EXPENSES));
      localStorage.setItem('gastos_daily', JSON.stringify(PRESET_DAILY_EXPENSES));
      localStorage.setItem('gastos_cards', JSON.stringify(PRESET_CARD_PURCHASES));
    }
  }, []);

  // Save changes to localStorage on any state modification
  const saveFixed = (list: FixedExpense[]) => {
    setFixedExpenses(list);
    localStorage.setItem('gastos_fixed', JSON.stringify(list));
  };

  const saveDaily = (list: DailyExpense[]) => {
    setDailyExpenses(list);
    localStorage.setItem('gastos_daily', JSON.stringify(list));
  };

  const saveCards = (list: CardPurchase[]) => {
    setCardPurchases(list);
    localStorage.setItem('gastos_cards', JSON.stringify(list));
  };

  const handleResetData = () => {
    if (window.confirm('¿Seguro que deseas restaurar los valores iniciales de prueba? Se borrarán tus cambios locales.')) {
      saveFixed(PRESET_FIXED_EXPENSES);
      saveDaily(PRESET_DAILY_EXPENSES);
      saveCards(PRESET_CARD_PURCHASES);
      setSelectedMonth('2026-05');
    }
  };

  // --- Helper to shift calendar month relative to target ---
  const handleSetMonth = (month: string) => {
    setSelectedMonth(month);
  };

  // --- GASTOS FIJOS MANAGEMENT CORES ---
  const handleOpenAddFixed = () => {
    setModalType('fixed');
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEditFixed = (fe: FixedExpense) => {
    setModalType('fixed');
    setEditingItem(fe);
    setIsModalOpen(true);
  };

  const handleSaveFixedExpense = (savedItem: FixedExpense) => {
    const isEdit = fixedExpenses.some(fe => fe.id === savedItem.id);
    
    if (isEdit) {
      const original = fixedExpenses.find(fe => fe.id === savedItem.id)!;
      const amountChanged = original.amount !== savedItem.amount;

      if (amountChanged) {
        // --- LOGIC: SI EL MONTO CAMBIA, LOS PRÓXIMOS MESES DEBEN USAR EL NUEVO VALOR SIN AFECTAR LOS MESES PASADOS ---
        // 1. Ponemos endDate en el gasto original como el mes PREVIO al mes seleccionado actual.
        // Convertir selectedMonth a mes anterior
        const [year, month] = selectedMonth.split('-').map(Number);
        let prevYear = year;
        let prevMonth = month - 1;
        if (prevMonth === 0) {
          prevMonth = 12;
          prevYear -= 1;
        }
        const prevMonthStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;

        const updatedOriginal: FixedExpense = {
          ...original,
          endDate: prevMonthStr,
          isActive: original.isActive // mantiene sintonía
        };

        // 2. Creamos una copia del gasto fijando su inicio en selectedMonth y su nuevo valor.
        const newCopiedExpense: FixedExpense = {
          ...savedItem,
          id: `f-${Date.now()}`,
          startDate: selectedMonth,
          endDate: undefined,
          isActive: true
        };

        const list = fixedExpenses.map(item => item.id === original.id ? updatedOriginal : item);
        saveFixed([...list, newCopiedExpense]);
        alert(`Monto modificado. El valor anterior se mantendrá hasta ${prevMonthStr}. Desde el mes actual (${selectedMonth}) se aplicará el valor de $${savedItem.amount}.`);
      } else {
        // Edición normal sin alteración de montos
        const updated = fixedExpenses.map(item => item.id === savedItem.id ? savedItem : item);
        saveFixed(updated);
      }
    } else {
      // Creación simple
      saveFixed([...fixedExpenses, savedItem]);
    }
  };

  const handleDeleteFixedExpense = (id: string) => {
    if (window.confirm('¿Deseas eliminar permanentemente este Gasto Fijo?')) {
      saveFixed(fixedExpenses.filter(item => item.id !== id));
    }
  };

  const handleToggleFixedActive = (id: string) => {
    const updated = fixedExpenses.map(item => {
      if (item.id === id) {
        return { ...item, isActive: !item.isActive };
      }
      return item;
    });
    saveFixed(updated);
  };


  // --- GASTOS DIARIOS MANAGEMENT CORES ---
  const handleOpenAddDaily = () => {
    setModalType('daily');
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEditDaily = (de: DailyExpense) => {
    setModalType('daily');
    setEditingItem(de);
    setIsModalOpen(true);
  };

  const handleSaveDailyExpense = (savedItem: DailyExpense) => {
    const exists = dailyExpenses.some(de => de.id === savedItem.id);
    if (exists) {
      saveDaily(dailyExpenses.map(de => de.id === savedItem.id ? savedItem : de));
    } else {
      saveDaily([...dailyExpenses, savedItem]);
    }
  };

  const handleDeleteDailyExpense = (id: string) => {
    if (window.confirm('¿Seguro que deseas eliminar este gasto diario?')) {
      saveDaily(dailyExpenses.filter(de => de.id !== id));
    }
  };


  // --- COMPRAS CON TARJETA MANAGEMENT CORES ---
  const handleOpenAddCardPurchase = () => {
    setModalType('cards');
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleSaveCardPurchase = (savedItem: CardPurchase) => {
    // Al agregar compras con tarjeta lo agregamos como un único evento de compra
    saveCards([...cardPurchases, savedItem]);
  };

  const handleCancelCardPurchase = (id: string) => {
    if (window.confirm('¿Deseas cancelar esta compra de la tarjeta de crédito? Se eliminarán todas las cuotas pendientes y futuras de tus resúmenes.')) {
      saveCards(cardPurchases.filter(cp => cp.id !== id));
    }
  };


  // --- Live Calculations for Bento Dashboard Metrics ---
  const activeMonthFixedExpenses = useMemo(() => {
    return fixedExpenses.filter(fe => {
      if (!fe.isActive) return false;
      if (fe.startDate > selectedMonth) return false;
      if (fe.endDate && fe.endDate < selectedMonth) return false;
      return true;
    });
  }, [fixedExpenses, selectedMonth]);

  const totalFixedAmount = useMemo(() => {
    return activeMonthFixedExpenses.reduce((sum, item) => sum + item.amount, 0);
  }, [activeMonthFixedExpenses]);

  const activeMonthDailyExpenses = useMemo(() => {
    return dailyExpenses.filter(de => de.date.startsWith(selectedMonth));
  }, [dailyExpenses, selectedMonth]);

  const totalDailyAmount = useMemo(() => {
    return activeMonthDailyExpenses.reduce((sum, item) => sum + item.amount, 0);
  }, [dailyExpenses, selectedMonth]);

  const isMonthImpactedByPurchase = (purchaseDateYmd: string, installments: number, targetYm: string) => {
    const purchaseYm = purchaseDateYmd.substring(0, 7);
    const [pYear, pMonth] = purchaseYm.split('-').map(Number);
    const [tYear, tMonth] = targetYm.split('-').map(Number);
    
    // Convert to absolute months
    const purchaseMonthsAbs = pYear * 12 + (pMonth - 1);
    const targetMonthsAbs = tYear * 12 + (tMonth - 1);
    
    const diff = targetMonthsAbs - purchaseMonthsAbs;
    return diff >= 1 && diff <= installments;
  };

  const activeMonthCardPurchases = useMemo(() => {
    return cardPurchases.filter(cp => isMonthImpactedByPurchase(cp.purchaseDate, cp.installmentsCount, selectedMonth));
  }, [cardPurchases, selectedMonth]);

  const totalCardAmount = useMemo(() => {
    return activeMonthCardPurchases.reduce((sum, cp) => {
      return sum + (cp.totalAmount / cp.installmentsCount);
    }, 0);
  }, [activeMonthCardPurchases]);

  const totalGeneral = totalFixedAmount + totalDailyAmount + totalCardAmount;

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const totalHoy = useMemo(() => {
    return dailyExpenses
      .filter(de => de.date === todayStr)
      .reduce((sum, item) => sum + item.amount, 0);
  }, [dailyExpenses, todayStr]);

  const totalSemana = useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return dailyExpenses
      .filter(de => de.date >= oneWeekAgo && de.date <= todayStr)
      .reduce((sum, item) => sum + item.amount, 0);
  }, [dailyExpenses, todayStr]);

  const formatMonthNameVerbose = (ym: string) => {
    const [year, month] = ym.split('-');
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans select-none antialiased">
      
      {/* Bento Standard Navbar */}
      <nav className="flex flex-col md:flex-row items-center justify-between px-8 py-6 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800">Control de Gastos</h1>
            <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">Android architecture playground</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 mt-4 md:mt-0">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <span className="px-4 py-1.5 bg-white shadow-sm rounded-md text-xs font-bold text-slate-800">
              {formatMonthNameVerbose(selectedMonth)}
            </span>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleResetData}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
              title="Restaurar base de datos SQLite inicial"
            >
              <RotateCcw size={14} className="text-slate-500" />
              <span>Restaurar Datos</span>
            </button>
            <div className="hidden sm:flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl px-4 py-2 text-xs font-bold">
              <ShieldCheck className="text-emerald-500 shrink-0" size={14} />
              <span>Room DB (LocalStorage)</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Bento Grid Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-8">
        
        {/* Bento Grid Row 1: Real-time Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* CARD 1: Main Balance (Large Black/Slate Card) */}
          <div className="md:col-span-12 lg:col-span-5 bg-[#0F172A] rounded-[2.2rem] p-8 text-white flex flex-col justify-between relative overflow-hidden shadow-xl min-h-[250px]">
            <div className="relative z-10 flex-1 flex flex-col justify-between">
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Gasto Total del Mes ({formatMonthNameVerbose(selectedMonth)})</p>
                <h2 className="text-4xl lg:text-5xl font-black tracking-tight">${totalGeneral.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
                <div className="mt-4 inline-flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold">Resumen de Cuenta Offline-First</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-white/10 rounded-2xl p-4">
                  <p className="text-[10px] text-slate-300 font-bold uppercase mb-1">Gasto Fijo Activo</p>
                  <p className="text-lg font-black">${totalFixedAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                </div>
                <div className="bg-white/10 rounded-2xl p-4">
                  <p className="text-[10px] text-slate-300 font-bold uppercase mb-1">Gastos Diarios</p>
                  <p className="text-lg font-black">${totalDailyAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                </div>
              </div>
            </div>
            <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
          </div>

          {/* CARD 2: Gastado Hoy */}
          <div className="md:col-span-6 lg:col-span-3 bg-white border border-slate-200 rounded-[2.2rem] p-8 flex flex-col justify-between items-center text-center shadow-sm hover:shadow-md transition-shadow min-h-[250px]">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
            <div>
              <p className="text-slate-400 text-xs font-extrabold uppercase tracking-wider mb-1">Gastado Hoy</p>
              <p className="text-4xl font-black text-slate-800">${totalHoy.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>
            <span className="text-[10px] text-slate-400 font-bold font-mono tracking-wide mt-2">Día de simulación activo</span>
          </div>

          {/* CARD 3: Esta Semana */}
          <div className="md:col-span-6 lg:col-span-4 bg-white border border-slate-200 rounded-[2.2rem] p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow min-h-[250px]">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-slate-400 text-xs font-extrabold uppercase tracking-wider">Últimos 7 días</span>
                <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full">Automático</span>
              </div>
              <p className="text-4xl font-black text-slate-800">${totalSemana.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Tarjeta (Cuotas de este mes)</span>
                  <span className="font-bold text-slate-900">${totalCardAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full transition-all" style={{ width: `${Math.min(100, (totalSemana / (totalGeneral || 1)) * 100)}%` }}></div>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-medium">Incluye compras registradas en los últimos 7 días con cualquier método de pago.</p>
          </div>

        </div>

        {/* Bento Grid Row 2: Device Simulator and Android Code Layouts */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Simulator Panel (Android style mockups surrounded by clean visual bounds) */}
          <section className="lg:col-span-5 xl:col-span-4 bg-white border border-slate-200 rounded-[2.2rem] p-6 shadow-sm flex flex-col items-center">
            <div className="text-center mb-5 select-none">
              <span className="text-xxs uppercase font-extrabold tracking-widest text-emerald-600 bg-emerald-55 border border-emerald-100 px-3 py-1 rounded-full mb-1 inline-block">
                Interfaz Android M3
              </span>
              <p className="text-xs text-slate-400 mt-1">Modifica valores en el simulador para actualizar las estadísticas</p>
            </div>
            
            <AndroidSimulator
              fixedExpenses={fixedExpenses}
              dailyExpenses={dailyExpenses}
              cardPurchases={cardPurchases}
              selectedMonth={selectedMonth}
              onSetMonth={handleSetMonth}
              onAddFixed={handleOpenAddFixed}
              onEditFixed={handleOpenEditFixed}
              onDeleteFixed={handleDeleteFixedExpense}
              onToggleFixedActive={handleToggleFixedActive}
              onAddDaily={handleOpenAddDaily}
              onEditDaily={handleOpenEditDaily}
              onDeleteDaily={handleDeleteDailyExpense}
              onAddCardPurchase={handleOpenAddCardPurchase}
              onCancelCardPurchase={handleCancelCardPurchase}
            />
          </section>

          {/* Code panel with high fidelity tabs */}
          <section className="lg:col-span-7 xl:col-span-8 flex flex-col h-[780px]">
            <KotlinCodeExplorer />
          </section>

        </div>

      </main>

      {/* Clean elegant footer */}
      <footer className="bg-white border-t border-slate-200 p-8 select-none">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <Smartphone size={16} className="text-emerald-500" />
            <span className="font-bold text-slate-700">Control de Gastos Android Simulator • Premium Bento Grid</span>
          </div>
          <div className="flex items-center space-x-6 text-[11px] font-bold text-slate-450 uppercase">
            <span>Material Design 3 Layouts</span>
            <span>Room Persistence LocalStorage</span>
            <span>Kotlin Architecture Components</span>
          </div>
        </div>
      </footer>

      {/* Add / Edit Expense Floating form Dialog Modal Component */}
      <AddEditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        type={modalType}
        initialItem={editingItem}
        selectedMonth={selectedMonth}
        onSave={(saved) => {
          if (modalType === 'fixed') handleSaveFixedExpense(saved);
          if (modalType === 'daily') handleSaveDailyExpense(saved);
          if (modalType === 'cards') handleSaveCardPurchase(saved);
          setIsModalOpen(false);
        }}
      />

    </div>
  );
}
