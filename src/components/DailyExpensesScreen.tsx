/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Search, Plus, TrendingDown, Home, Activity, ShoppingCart, 
  Car, Tv, Coffee, Grid, Edit3, Trash2, Calendar, DollarSign, SlidersHorizontal, CreditCard
} from 'lucide-react';
import { DailyExpense, CATEGORIES, PAYMENT_METHODS } from '../types';

interface DailyExpensesScreenProps {
  dailyExpenses: DailyExpense[];
  onAddClick: () => void;
  onEditClick: (expense: DailyExpense) => void;
  onDeleteClick: (id: string) => void;
  selectedMonth: string; // YYYY-MM
}

export default function DailyExpensesScreen({
  dailyExpenses,
  onAddClick,
  onEditClick,
  onDeleteClick,
  selectedMonth
}: DailyExpensesScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>(''); // YYYY-MM-DD
  const [showFilters, setShowFilters] = useState(false);

  // --- 1. FILTRADO CONJUNTO ---
  const filteredExpenses = useMemo(() => {
    return dailyExpenses.filter(expense => {
      // Filtrar siempre por el mes seleccionado primero (para no contaminar pantallas)
      if (!expense.date.startsWith(selectedMonth)) return false;

      // Buscar por query de nombre o descripcion
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = expense.name.toLowerCase().includes(query);
        const matchesDesc = expense.description?.toLowerCase().includes(query) || false;
        if (!matchesName && !matchesDesc) return false;
      }

      // Filtrar por categoria
      if (selectedCategory !== 'all' && expense.category !== selectedCategory) {
        return false;
      }

      // Filtrar por metodo de pago
      if (selectedPaymentMethod !== 'all' && expense.paymentMethod !== selectedPaymentMethod) {
        return false;
      }

      // Filtrar por fecha exacta
      if (selectedDateFilter && expense.date !== selectedDateFilter) {
        return false;
      }

      return true;
    });
  }, [dailyExpenses, selectedMonth, searchQuery, selectedCategory, selectedPaymentMethod, selectedDateFilter]);

  // --- 2. CÁLCULO DE TOTALES ---
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

  const totalMes = useMemo(() => {
    return dailyExpenses
      .filter(de => de.date.startsWith(selectedMonth))
      .reduce((sum, item) => sum + item.amount, 0);
  }, [dailyExpenses, selectedMonth]);

  // Icon mapping helper
  const getCategoryTheme = (category: string) => {
    switch (category) {
      case 'Alquiler / Hogar': return { bg: 'bg-indigo-50', text: 'text-indigo-700', icon: <Home size={15} /> };
      case 'Servicios': return { bg: 'bg-blue-50', text: 'text-blue-700', icon: <Activity size={15} /> };
      case 'Supermercado': return { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: <ShoppingCart size={15} /> };
      case 'Transporte': return { bg: 'bg-amber-50', text: 'text-amber-700', icon: <Car size={15} /> };
      case 'Suscripciones': return { bg: 'bg-pink-50', text: 'text-pink-700', icon: <Tv size={15} /> };
      case 'Comida / Salidas': return { bg: 'bg-red-50', text: 'text-red-700', icon: <Coffee size={15} /> };
      default: return { bg: 'bg-violet-50', text: 'text-violet-700', icon: <Grid size={15} /> };
    }
  };

  return (
    <div id="daily-expenses-screen" className="flex flex-col h-full bg-[#fcf8ff] text-slate-900 pb-12 overflow-y-auto relative">
      {/* Tab Header and Totals Segment */}
      <div className="px-5 pt-5 pb-3">
        <h2 className="text-xl font-bold text-gray-800 tracking-tight">Gastos Diarios</h2>
        <p className="text-[11px] text-gray-400 mt-1 leading-normal font-semibold">
          Seguimiento de compras cotidianas y gastos rápidos del día a día.
        </p>

        {/* Dashboard aggregations inside tab */}
        <div className="grid grid-cols-3 gap-2 mt-4 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm text-center">
          <div>
            <span className="text-[9px] font-bold text-gray-400 uppercase">Hoy</span>
            <p id="daily-total-hoy" className="text-xs font-black text-gray-800 mt-1">${totalHoy.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          </div>
          <div className="border-x border-gray-100">
            <span className="text-[9px] font-bold text-gray-400 uppercase">Semana</span>
            <p id="daily-total-semana" className="text-xs font-black text-emerald-600 mt-1">${totalSemana.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          </div>
          <div>
            <span className="text-[9px] font-bold text-gray-400 uppercase">Mes</span>
            <p id="daily-total-mes" className="text-xs font-black text-violet-700 mt-1">${totalMes.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          </div>
        </div>
      </div>

      {/* Search and Filters container */}
      <div className="px-5 mb-3 space-y-2 select-none">
        <div className="flex gap-2">
          {/* Search bar inputs */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input 
              id="daily-search-input"
              type="text" 
              placeholder="Buscar gasto diario..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl py-2 pl-9 pr-4 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-violet-600 transition-all shadow-sm"
            />
          </div>
          
          {/* Filter toggle button */}
          <button 
            id="daily-filter-toggle-btn"
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-xl border transition-colors flex items-center justify-center cursor-pointer shadow-sm ${
              showFilters ? 'bg-violet-100 text-violet-700 border-violet-200' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <SlidersHorizontal size={16} />
          </button>
        </div>

        {/* Expandable filters drawer */}
        {showFilters && (
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3">
            {/* Category selection */}
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase">Categoría</span>
              <div className="flex flex-wrap gap-1 mt-1.5">
                <button
                  id="cat-filter-all"
                  onClick={() => setSelectedCategory('all')}
                  className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg border transition-colors cursor-pointer ${
                    selectedCategory === 'all' 
                      ? 'bg-violet-600 text-white border-transparent' 
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  Todas
                </button>
                {CATEGORIES.map(cat => (
                  <button
                    id={`cat-filter-${cat.name}`}
                    key={cat.name}
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg border transition-colors cursor-pointer ${
                      selectedCategory === cat.name 
                        ? 'bg-violet-600 text-white border-transparent' 
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment method selection */}
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase">Método de Pago</span>
              <div className="flex flex-wrap gap-1 mt-1.5">
                <button
                  id="method-filter-all"
                  onClick={() => setSelectedPaymentMethod('all')}
                  className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg border transition-colors cursor-pointer ${
                    selectedPaymentMethod === 'all' 
                      ? 'bg-violet-600 text-white border-transparent' 
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  Todos
                </button>
                {PAYMENT_METHODS.map(method => (
                  <button
                    id={`method-filter-${method}`}
                    key={method}
                    onClick={() => setSelectedPaymentMethod(method)}
                    className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg border transition-colors cursor-pointer ${
                      selectedPaymentMethod === method 
                        ? 'bg-violet-600 text-white border-transparent' 
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {/* Exact Date selection */}
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
                <Calendar size={11} /> Filtrar por fecha
              </span>
              <div className="flex items-center gap-1 mt-1.5">
                <input 
                  id="date-filter-input"
                  type="date"
                  value={selectedDateFilter}
                  onChange={(e) => setSelectedDateFilter(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-1.5 text-[11px] font-medium text-gray-700 focus:outline-none"
                />
                {selectedDateFilter && (
                  <button 
                    id="clear-date-filter-btn"
                    onClick={() => setSelectedDateFilter('')}
                    className="text-[10px] font-bold text-red-500 hover:underline px-2 cursor-pointer"
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Expenses Scroll feed */}
      <div className="flex-1 px-5 space-y-2.5 pb-24">
        {filteredExpenses.length > 0 ? (
          filteredExpenses.map((expense) => {
            const theme = getCategoryTheme(expense.category);

            return (
              <div 
                id={`daily-item-${expense.id}`}
                key={expense.id} 
                className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col hover:border-gray-200 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3 truncate">
                    {/* Category circle */}
                    <div className={`p-2.5 rounded-xl shrink-0 ${theme.bg} ${theme.text}`}>
                      {theme.icon}
                    </div>
                    <div className="truncate">
                      <h4 className="text-sm font-black text-slate-800 truncate leading-tight">{expense.name}</h4>
                      <div className="flex items-center space-x-1.5 mt-1 select-none">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${theme.bg} ${theme.text}`}>
                          {expense.category}
                        </span>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 flex items-center gap-0.5 select-none">
                          <CreditCard size={10} /> {expense.paymentMethod}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Pricing and dates */}
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-red-600 leading-tight">
                      -${expense.amount.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                    </p>
                    <span className="text-[9px] text-gray-400 font-medium font-mono">
                      {expense.date}
                    </span>
                  </div>
                </div>

                {/* Optional note description */}
                {expense.description && (
                  <p className="mt-2 text-xs text-slate-500 italic bg-gray-50/50 p-2 rounded-xl border border-gray-100/50 leading-snug">
                    {expense.description}
                  </p>
                )}

                {/* Individual action items */}
                <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-gray-100/40">
                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                    Gasto Diario
                  </span>
                  <div className="flex items-center space-x-1">
                    <button
                      id={`edit-daily-btn-${expense.id}`}
                      onClick={() => onEditClick(expense)}
                      className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors cursor-pointer"
                      title="Editar gasto diario"
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      id={`delete-daily-btn-${expense.id}`}
                      onClick={() => onDeleteClick(expense.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Eliminar gasto diario"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center select-none">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500 mb-3.5">
              <TrendingDown size={24} />
            </div>
            <h4 className="text-sm font-bold text-gray-800">No hay gastos en esta selección</h4>
            <p className="text-xs text-gray-400 max-w-[200px] mt-1 leading-normal select-none">
              Usa el botón flotante en la esquina inferior para registrar un gasto diario.
            </p>
          </div>
        )}
      </div>

      {/* FAB "Agregar Gasto Diario" */}
      <button
        id="fab-add-daily"
        onClick={onAddClick}
        className="absolute bottom-6 right-6 w-14 h-14 bg-violet-600 text-white rounded-2xl flex items-center justify-center shadow-lg hover:bg-violet-700 active:scale-95 transition-all cursor-pointer group hover:shadow-violet-200 z-10"
        title="Crear Gasto Diario"
      >
        <Plus size={24} className="group-hover:rotate-90 transition-transform duration-300" />
      </button>
    </div>
  );
}
