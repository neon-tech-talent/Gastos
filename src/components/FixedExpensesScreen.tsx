/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Plus, Home, Activity, ShoppingCart, Car, Tv, Coffee, Grid, Edit3, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { FixedExpense, ScreenType } from '../types';

interface FixedExpensesScreenProps {
  fixedExpenses: FixedExpense[];
  onAddClick: () => void;
  onEditClick: (expense: FixedExpense) => void;
  onDeleteClick: (id: string) => void;
  onToggleActive: (id: string) => void;
  selectedMonth: string;
}

export default function FixedExpensesScreen({
  fixedExpenses,
  onAddClick,
  onEditClick,
  onDeleteClick,
  onToggleActive,
  selectedMonth
}: FixedExpensesScreenProps) {

  const getCategoryTheme = (category: string) => {
    switch (category) {
      case 'Alquiler / Hogar': return { bg: 'bg-indigo-50', text: 'text-indigo-700', icon: <Home size={16} /> };
      case 'Servicios': return { bg: 'bg-blue-50', text: 'text-blue-700', icon: <Activity size={16} /> };
      case 'Supermercado': return { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: <ShoppingCart size={16} /> };
      case 'Transporte': return { bg: 'bg-amber-50', text: 'text-amber-700', icon: <Car size={16} /> };
      case 'Suscripciones': return { bg: 'bg-pink-50', text: 'text-pink-700', icon: <Tv size={16} /> };
      case 'Comida / Salidas': return { bg: 'bg-red-50', text: 'text-red-700', icon: <Coffee size={16} /> };
      default: return { bg: 'bg-violet-50', text: 'text-violet-700', icon: <Grid size={16} /> };
    }
  };

  const activeThisMonth = (fe: FixedExpense) => {
    if (fe.startDate > selectedMonth) return false;
    if (fe.endDate && fe.endDate < selectedMonth) return false;
    return true;
  };

  return (
    <div id="fixed-expenses-screen" className="flex flex-col h-full bg-[#fcf8ff] text-slate-900 pb-12 overflow-y-auto relative">
      {/* Header Info */}
      <div className="px-5 pt-5 pb-3">
        <h2 className="text-xl font-bold text-gray-800 tracking-tight">Gastos Fijos</h2>
        <p className="text-[11px] text-gray-400 mt-1 leading-relaxed font-semibold">
          Gastos configurados que se repiten automáticamente todos los meses. Se suman al resumen según estén activos en el mes de consulta.
        </p>
      </div>

      {/* Expenses List */}
      <div className="flex-1 px-5 space-y-3 pb-24">
        {fixedExpenses.length > 0 ? (
          fixedExpenses.map((expense) => {
            const theme = getCategoryTheme(expense.category);
            const isApplicableNow = activeThisMonth(expense);

            return (
              <div 
                id={`fixed-item-${expense.id}`}
                key={expense.id} 
                className={`bg-white rounded-3xl p-4.5 border transition-all shadow-sm ${
                  !expense.isActive ? 'opacity-60 border-gray-100 bg-gray-50/50' : 
                  isApplicableNow ? 'border-violet-100 hover:border-violet-200 shadow-sm' : 'border-gray-100'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start space-x-3 truncate">
                    <div className={`p-2.5 rounded-2xl shrink-0 ${theme.bg} ${theme.text}`}>
                      {theme.icon}
                    </div>
                    <div className="truncate">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-black text-slate-800 truncate">{expense.name}</h4>
                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full select-none shrink-0 ${theme.bg} ${theme.text}`}>
                          {expense.category}
                        </span>
                      </div>
                      
                      {/* Active status metrics */}
                      <span className="text-[10px] text-gray-400 font-semibold block mt-0.5">
                        Inicia: {expense.startDate} {expense.endDate ? `| Finaliza: ${expense.endDate}` : ''}
                      </span>
                    </div>
                  </div>

                  {/* Pricing segment */}
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-slate-900">
                      ${expense.amount.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                    </p>
                    <span className="text-[9px] text-gray-400 font-medium font-mono">
                      ARS / mes
                    </span>
                  </div>
                </div>

                {/* Notes segment */}
                {expense.notes && (
                  <p className="mt-2.5 text-xs text-gray-500 bg-gray-50 p-2.5 rounded-xl border border-gray-100 italic leading-snug">
                    {expense.notes}
                  </p>
                )}

                {/* Operations & Toggles */}
                <div className="mt-4 pt-3.5 border-t border-gray-50 flex items-center justify-between">
                  {/* Toggle Active state directly */}
                  <button
                    id={`toggle-active-btn-${expense.id}`}
                    onClick={() => onToggleActive(expense.id)}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold border transition-colors cursor-pointer select-none ${
                      expense.isActive 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100' 
                        : 'bg-red-50 text-red-700 border-red-100 hover:bg-red-100'
                    }`}
                  >
                    {expense.isActive ? (
                      <>
                        <CheckCircle2 size={12} />
                        <span>Activo</span>
                      </>
                    ) : (
                      <>
                        <XCircle size={12} />
                        <span>Inactivo</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center space-x-1">
                    <button
                      id={`edit-fixed-btn-${expense.id}`}
                      onClick={() => onEditClick(expense)}
                      className="p-2 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-colors cursor-pointer"
                      title="Editar gasto"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      id={`delete-fixed-btn-${expense.id}`}
                      onClick={() => onDeleteClick(expense.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                      title="Eliminar gasto"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center select-none">
            <div className="w-16 h-16 rounded-3xl bg-indigo-50 flex items-center justify-center text-indigo-500 mb-4">
              <Home size={28} />
            </div>
            <h4 className="text-sm font-bold text-gray-800">No hay gastos fijos</h4>
            <p className="text-xs text-gray-400 max-w-[200px] mt-1 leading-normal select-none">
              Configura tu primer gasto fijo (ej: Alquiler, Netflix) usando el botón flotante.
            </p>
          </div>
        )}
      </div>

      {/* Floating Action Button "Agregar Gasto Fijo" */}
      <button
        id="fab-add-fixed"
        onClick={onAddClick}
        className="absolute bottom-6 right-6 w-14 h-14 bg-violet-600 text-white rounded-2xl flex items-center justify-center shadow-lg hover:bg-violet-700 active:scale-95 transition-all cursor-pointer group hover:shadow-violet-200 z-10"
        title="Crear Gasto Fijo"
      >
        <Plus size={24} className="group-hover:rotate-90 transition-transform duration-300" />
      </button>
    </div>
  );
}
