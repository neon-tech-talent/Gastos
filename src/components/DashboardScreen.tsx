/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { 
  TrendingDown, ShoppingCart, Tv, Activity, Home, 
  Coffee, Car, Grid, Plus, Calendar, ChevronRight, CreditCard, ArrowUpRight
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { FixedExpense, DailyExpense, CardPurchase, CATEGORIES, ScreenType } from '../types';

interface DashboardScreenProps {
  fixedExpenses: FixedExpense[];
  dailyExpenses: DailyExpense[];
  cardPurchases: CardPurchase[];
  selectedMonth: string; // YYYY-MM
  onNavigate: (screen: ScreenType) => void;
  onQuickAdd: (type: 'fixed' | 'daily' | 'cards') => void;
  onSetMonth: (month: string) => void;
}

export default function DashboardScreen({
  fixedExpenses,
  dailyExpenses,
  cardPurchases,
  selectedMonth,
  onNavigate,
  onQuickAdd,
  onSetMonth
}: DashboardScreenProps) {

  // --- 1. LÓGICA DE CÁLCULO DE GASTOS FIJOS ---
  // Un gasto fijo impacta si está activo, su fecha de inicio es <= mes seleccionado
  // y su fecha de fin es nula o >= mes seleccionado.
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

  // --- 2. LÓGICA DE CÁLCULO DE GASTOS DIARIOS ---
  const activeMonthDailyExpenses = useMemo(() => {
    return dailyExpenses.filter(de => de.date.startsWith(selectedMonth));
  }, [dailyExpenses, selectedMonth]);

  const totalDailyAmount = useMemo(() => {
    return activeMonthDailyExpenses.reduce((sum, item) => sum + item.amount, 0);
  }, [activeMonthDailyExpenses]);

  // --- 3. LÓGICA DE TARJETAS DE CRÉDITO ---
  // Si se compra en Mayo con 3 cuotas, impacta Junio, Julio, Agosto (mes de compra + 1..N)
  const isMonthImpactedByPurchase = (purchaseDateYmd: string, installments: number, targetYm: string) => {
    const purchaseYm = purchaseDateYmd.substring(0, 7); // YYYY-MM
    const [pYear, pMonth] = purchaseYm.split('-').map(Number);
    const [tYear, tMonth] = targetYm.split('-').map(Number);
    
    // Convertir meses a valor absoluto
    const purchaseMonthsAbs = pYear * 12 + (pMonth - 1);
    const targetMonthsAbs = tYear * 12 + (tMonth - 1);
    
    // Las cuotas impactan en meses futuros: desde purchaseMonthsAbs + 1 hasta purchaseMonthsAbs + installments
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

  // Total General
  const totalGeneral = totalFixedAmount + totalDailyAmount + totalCardAmount;

  // --- RESÚMENES CONEXOS ---
  // Hoy
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const totalHoy = useMemo(() => {
    return dailyExpenses
      .filter(de => de.date === todayStr)
      .reduce((sum, item) => sum + item.amount, 0);
  }, [dailyExpenses, todayStr]);

  // Semana (Últimos 7 días)
  const totalSemana = useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return dailyExpenses
      .filter(de => de.date >= oneWeekAgo && de.date <= todayStr)
      .reduce((sum, item) => sum + item.amount, 0);
  }, [dailyExpenses, todayStr]);

  // --- GRÁFICO POR CATEGORÍA ---
  const chartData = useMemo(() => {
    const categoryTotals: Record<string, number> = {};

    // Iniciar categorías con 0
    CATEGORIES.forEach(c => {
      categoryTotals[c.name] = 0;
    });

    // Sumar Gastos Fijos
    activeMonthFixedExpenses.forEach(fe => {
      const cat = fe.category || 'Otros';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + fe.amount;
    });

    // Sumar Gastos Diarios
    activeMonthDailyExpenses.forEach(de => {
      const cat = de.category || 'Otros';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + de.amount;
    });

    // Tarjeta van a "Otros" o podemos clasificarlo o dejarlo como "Tarjetas"
    if (totalCardAmount > 0) {
      categoryTotals['Tarjetas (Cuotas)'] = totalCardAmount;
    }

    return Object.entries(categoryTotals)
      .map(([name, value]) => {
        const found = CATEGORIES.find(c => c.name === name);
        return {
          name,
          value,
          color: name === 'Tarjetas (Cuotas)' ? '#ec4899' : (found?.color || '#a78bfa'),
        };
      })
      .filter(item => item.value > 0);
  }, [activeMonthFixedExpenses, activeMonthDailyExpenses, totalCardAmount]);

  // Combinación de últimos movimientos para el feed
  const recentMovements = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      amount: number;
      date: string;
      tag: string;
      type: 'fixed' | 'daily' | 'card';
    }> = [];

    activeMonthFixedExpenses.forEach(fe => {
      list.push({
        id: `f-${fe.id}`,
        title: fe.name,
        amount: fe.amount,
        date: `${selectedMonth}-01`,
        tag: 'Gasto Fijo',
        type: 'fixed',
      });
    });

    activeMonthDailyExpenses.forEach(de => {
      list.push({
        id: `d-${de.id}`,
        title: de.name,
        amount: de.amount,
        date: de.date,
        tag: 'Diario',
        type: 'daily',
      });
    });

    activeMonthCardPurchases.forEach(cp => {
      // Determinar qué cuota es
      const purchaseYm = cp.purchaseDate.substring(0, 7);
      const [pYear, pMonth] = purchaseYm.split('-').map(Number);
      const [sYear, sMonth] = selectedMonth.split('-').map(Number);
      const diff = (sYear * 12 + (sMonth - 1)) - (pYear * 12 + (pMonth - 1));

      list.push({
        id: `c-${cp.id}`,
        title: `${cp.name} (${cp.cardName})`,
        amount: cp.totalAmount / cp.installmentsCount,
        date: cp.purchaseDate,
        tag: `Cuota ${diff} de ${cp.installmentsCount}`,
        type: 'card',
      });
    });

    // Ordenar por fecha u tipo dándolo el toque más representativo
    return list.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  }, [activeMonthFixedExpenses, activeMonthDailyExpenses, activeMonthCardPurchases, selectedMonth]);

  // Icon getter
  const getCategoryIcon = (categoryName: string) => {
    switch (categoryName) {
      case 'Alquiler / Hogar': return <Home size={16} className="text-indigo-600" />;
      case 'Servicios': return <Activity size={16} className="text-blue-500" />;
      case 'Supermercado': return <ShoppingCart size={16} className="text-emerald-500" />;
      case 'Transporte': return <Car size={16} className="text-amber-500" />;
      case 'Suscripciones': return <Tv size={16} className="text-pink-500" />;
      case 'Comida / Salidas': return <Coffee size={16} className="text-red-500" />;
      default: return <Grid size={16} className="text-violet-500" />;
    }
  };

  // Selector de meses para navegación simple
  const listMonths = useMemo(() => {
    const list = [];
    const baseDate = new Date(2026, 4, 1); // Mayo 2026
    for (let i = -1; i <= 4; i++) {
      const d = new Date(baseDate.getFullYear(), baseDate.getMonth() + i, 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      list.push(ym);
    }
    return list;
  }, []);

  const formatMonthName = (ym: string) => {
    const [year, month] = ym.split('-');
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  return (
    <div id="dashboard-screen-container" className="flex flex-col h-full bg-[#fcf8ff] text-slate-900 pb-12 overflow-y-auto">
      {/* Selector de Meses */}
      <div id="month-carousel" className="px-5 pt-4 pb-2">
        <div className="flex space-x-2 overflow-x-auto scrollbar-none py-1">
          {listMonths.map(ym => (
            <button
              id={`month-selector-${ym}`}
              key={ym}
              onClick={() => onSetMonth(ym)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-full border transition-all shrink-0 ${
                selectedMonth === ym 
                  ? 'bg-violet-700 text-white border-transparent shadow' 
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              {formatMonthName(ym)}
            </button>
          ))}
        </div>
      </div>

      {/* Main Total Premium FinTech Card */}
      <div className="px-5 py-3 select-none">
        <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 to-indigo-800 text-white rounded-[2rem] p-6 shadow-xl shadow-indigo-100">
          <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 w-44 h-44 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute left-1/3 top-0 -translate-y-6 w-24 h-24 rounded-full bg-indigo-400/10 pointer-events-none" />
          
          <div className="flex justify-between items-center z-10">
            <span className="text-xs font-medium uppercase tracking-widest text-indigo-100">Total Gastado del Mes</span>
            <div className="bg-white/10 px-2.5 py-1 rounded-lg text-[10px] font-bold backdrop-blur-sm">
              Offline-First
            </div>
          </div>
          
          <div className="mt-4 flex items-baseline space-x-1">
            <span className="text-xl font-medium text-indigo-200">$</span>
            <h2 id="total-general-display" className="text-4xl font-extrabold tracking-tight">
              {totalGeneral.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
          </div>

          <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-3 gap-2 text-center select-none">
            <div className="cursor-pointer hover:bg-white/5 p-1 rounded-lg transition-colors" onClick={() => onNavigate('fixed')}>
              <p className="text-[10px] text-indigo-200 font-medium uppercase">Gastos Fijos</p>
              <p id="total-fijos-dashboard" className="text-sm font-bold text-white mt-0.5">${totalFixedAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>
            
            <div className="cursor-pointer hover:bg-white/5 p-1 rounded-lg transition-colors" onClick={() => onNavigate('daily')}>
              <p className="text-[10px] text-indigo-200 font-medium uppercase">Diarios</p>
              <p id="total-diarios-dashboard" className="text-sm font-bold text-white mt-0.5">${totalDailyAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>

            <div className="cursor-pointer hover:bg-white/5 p-1 rounded-lg transition-colors" onClick={() => onNavigate('cards')}>
              <p className="text-[10px] text-indigo-200 font-medium uppercase">Tarjetas</p>
              <p id="total-tarjetas-dashboard" className="text-sm font-bold text-white mt-0.5">${totalCardAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Resúmenes Rápidos (Hoy, Semana) */}
      <div className="px-5 py-2 grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Gastado Hoy</span>
          <span className="text-sm font-black text-gray-800 mt-1">${totalHoy.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
        </div>
        <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Últimos 7 días</span>
          <span className="text-sm font-black text-emerald-600 mt-1">${totalSemana.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
        </div>
        <div className="bg-violet-50 text-violet-900 rounded-2xl p-3 border border-violet-100 shadow-sm flex flex-col justify-center items-center text-center">
          <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wide">Mes</span>
          <span className="text-sm font-black text-violet-700 mt-1">{formatMonthName(selectedMonth).split(' ')[0]}</span>
        </div>
      </div>

      {/* Cat Pie Chart Segment */}
      {chartData.length > 0 ? (
        <div className="px-5 py-3">
          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
            <div className="w-[45%] h-36 flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={36}
                    outerRadius={50}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Gasto']}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Distrib.</span>
              </div>
            </div>

            {/* Legend layout */}
            <div className="w-[50%] space-y-1.5 overflow-hidden">
              <h4 className="text-xs font-bold text-gray-500 mb-1">Categorías del Mes</h4>
              <div className="max-h-24 overflow-y-auto space-y-1.5 scrollbar-thin">
                {chartData.map((item, idx) => (
                  <div key={idx} className="flex items-center space-x-1.5 text-slate-700 truncate text-[11px]">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="truncate font-semibold text-gray-600 flex-1">{item.name}</span>
                    <span className="font-bold text-gray-900 shrink-0">${item.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="px-5 py-3">
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm text-center">
            <span className="block text-sm text-gray-400 font-medium">No hay gastos ingresados para este mes.</span>
            <button
              onClick={() => onQuickAdd('daily')}
              className="mt-2 text-xs font-semibold text-violet-600 hover:text-violet-700 inline-flex items-center gap-1 cursor-pointer"
            >
              Agregar primer gasto diario <ArrowUpRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Accesos Rápidos - Fintech Quick Tools */}
      <div className="px-5 py-2">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2.5 px-1">Registrar Gasto Rápido</h3>
        <div className="grid grid-cols-3 gap-3">
          <button
            id="quick-add-fixed"
            onClick={() => onQuickAdd('fixed')}
            className="flex flex-col items-center p-3 bg-white rounded-2xl border border-gray-100 hover:border-violet-300 transition-all cursor-pointer shadow-sm group font-semibold"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Plus size={18} />
            </div>
            <span className="text-[10px] text-gray-600 font-bold mt-2 text-center leading-tight">Gasto Fijo</span>
          </button>

          <button
            id="quick-add-daily"
            onClick={() => onQuickAdd('daily')}
            className="flex flex-col items-center p-3 bg-white rounded-2xl border border-gray-100 hover:border-violet-300 transition-all cursor-pointer shadow-sm group font-semibold"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Plus size={18} />
            </div>
            <span className="text-[10px] text-gray-600 font-bold mt-2 text-center leading-tight">Diario Rápido</span>
          </button>

          <button
            id="quick-add-cards"
            onClick={() => onQuickAdd('cards')}
            className="flex flex-col items-center p-3 bg-white rounded-2xl border border-gray-100 hover:border-violet-300 transition-all cursor-pointer shadow-sm group font-semibold"
          >
            <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Plus size={18} />
            </div>
            <span className="text-[10px] text-gray-600 font-bold mt-2 text-center leading-tight">Cuota Tarjeta</span>
          </button>
        </div>
      </div>

      {/* Últimos Movimientos Feed */}
      <div id="recent-movements-feed" className="px-5 py-3">
        <div className="flex justify-between items-center mb-2 px-1">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Últimos Movimientos</h3>
          <button 
            id="view-all-daily-btn"
            onClick={() => onNavigate('daily')}
            className="text-[10px] text-violet-600 hover:text-violet-700 font-semibold flex items-center gap-0.5 cursor-pointer"
          >
            Ver más <ChevronRight size={12} />
          </button>
        </div>

        <div className="space-y-2 select-none">
          {recentMovements.length > 0 ? (
            recentMovements.map((mov) => (
              <div 
                id={`recent-move-item-${mov.id}`}
                key={mov.id} 
                className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between"
              >
                <div className="flex items-center space-x-3 truncate">
                  <div className={`p-2.5 rounded-xl ${
                    mov.type === 'fixed' ? 'bg-indigo-50' : mov.type === 'daily' ? 'bg-emerald-50' : 'bg-pink-50'
                  }`}>
                    {mov.type === 'fixed' ? <Home size={16} className="text-indigo-600" /> : 
                     mov.type === 'daily' ? <TrendingDown size={16} className="text-emerald-600" /> : 
                     <CreditCard size={16} className="text-pink-600" />}
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-slate-800 truncate">{mov.title}</p>
                    <span className="text-[9px] font-bold text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded-md">
                      {mov.tag}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-black text-red-600">
                    -${mov.amount.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                  </p>
                  <p className="text-[9px] text-gray-400 font-medium">
                    {mov.date}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center bg-white border border-gray-100 p-6 rounded-2xl text-xs text-gray-400 font-medium select-none">
              Sin movimientos registrados en este mes.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
