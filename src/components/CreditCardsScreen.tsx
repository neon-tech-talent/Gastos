/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Plus, CreditCard, Trash2, Calendar, AlertCircle, TrendingDown, CheckCircle } from 'lucide-react';
import { CardPurchase, CARD_NAMES } from '../types';

interface CreditCardsScreenProps {
  cardPurchases: CardPurchase[];
  onAddClick: () => void;
  onCancelPurchase: (id: string) => void;
  selectedMonth: string; // YYYY-MM
}

export default function CreditCardsScreen({
  cardPurchases,
  onAddClick,
  onCancelPurchase,
  selectedMonth
}: CreditCardsScreenProps) {
  const [selectedCardFilter, setSelectedCardFilter] = useState<string>('all');

  // Convert monthly keys (YYYY-MM) to simple absolute months
  const getMonthsAbs = (ym: string) => {
    const [y, m] = ym.split('-').map(Number);
    return y * 12 + (m - 1);
  };

  const selectedMonthAbs = useMemo(() => getMonthsAbs(selectedMonth), [selectedMonth]);

  // Main list computation with installment metrics mapped relative to selectedMonth
  const processedPurchases = useMemo(() => {
    return cardPurchases.map(cp => {
      const purchaseYm = cp.purchaseDate.substring(0, 7);
      const purchaseAbs = getMonthsAbs(purchaseYm);
      const installmentsCount = cp.installmentsCount;

      // Las cuotas corren en meses futuros: desde purchaseAbs + 1 hasta purchaseAbs + N
      const startMonthAbs = purchaseAbs + 1;
      const endMonthAbs = purchaseAbs + installmentsCount;

      // Check if selectedMonth receives an active installment
      const isCurrentlyBilled = selectedMonthAbs >= startMonthAbs && selectedMonthAbs <= endMonthAbs;

      // Cuotas pagadas (including selected month if it's during or after the range)
      let paidInstallments = 0;
      if (selectedMonthAbs >= endMonthAbs) {
        paidInstallments = installmentsCount;
      } else if (selectedMonthAbs >= startMonthAbs) {
        paidInstallments = (selectedMonthAbs - purchaseAbs);
      } else {
        paidInstallments = 0; // Selected Month is before billing start
      }

      const pendingInstallments = installmentsCount - paidInstallments;
      const monthlyAmount = cp.totalAmount / installmentsCount;
      const amountPaid = paidInstallments * monthlyAmount;
      const amountRemaining = cp.totalAmount - amountPaid;

      // What installment number is this current month?
      const currentInstallmentNumber = isCurrentlyBilled ? (selectedMonthAbs - purchaseAbs) : null;
      const monthsRemaining = Math.max(0, endMonthAbs - selectedMonthAbs);

      return {
        ...cp,
        purchaseYm,
        isCurrentlyBilled,
        paidInstallments,
        pendingInstallments,
        monthlyAmount,
        amountPaid,
        amountRemaining,
        currentInstallmentNumber,
        monthsRemaining,
        isActiveForFilter: selectedCardFilter === 'all' || cp.cardName === selectedCardFilter
      };
    });
  }, [cardPurchases, selectedMonth, selectedMonthAbs, selectedCardFilter]);

  // Sub-totals relative to the selected card filter and selected month
  const cardSummary = useMemo(() => {
    let currentBilling = 0;
    let totalPendingAllCards = 0;
    let purchaseVolume = 0;

    processedPurchases.forEach(p => {
      // If we filter, skip unmatching
      const isCardSelected = selectedCardFilter === 'all' || p.cardName === selectedCardFilter;
      
      if (isCardSelected) {
        purchaseVolume += p.totalAmount;
        if (p.isCurrentlyBilled) {
          currentBilling += p.monthlyAmount;
        }
        totalPendingAllCards += p.amountRemaining;
      }
    });

    return {
      currentBilling,
      totalPendingAllCards,
      purchaseVolume
    };
  }, [processedPurchases, selectedCardFilter]);

  // Custom UI colors for virtual credit card renders
  const getCardStyle = (name: string) => {
    switch (name) {
      case 'Visa':
        return 'from-slate-900 to-indigo-950 border-indigo-900/60 text-white';
      case 'Mastercard':
        return 'from-zinc-800 via-stone-900 to-orange-950 border-orange-900/40 text-white';
      case 'Amex':
        return 'from-cyan-900 to-emerald-950 border-cyan-800/40 text-sky-100';
      default:
        return 'from-violet-850 to-purple-950 border-purple-900/30 text-white';
    }
  };

  return (
    <div id="credit-cards-screen" className="flex flex-col h-full bg-[#fcf8ff] text-slate-900 pb-12 overflow-y-auto relative">
      {/* Header Info */}
      <div className="px-5 pt-5 pb-3">
        <h2 className="text-xl font-bold text-gray-800 tracking-tight">Tarjetas de Crédito</h2>
        <p className="text-[11px] text-gray-400 mt-1 leading-normal font-semibold">
          Registro de consumos en cuotas. El sistema divide automáticamente los montos impactando meses futuros periódicamente.
        </p>

        {/* Card filter pills */}
        <div className="flex gap-1.5 mt-3 select-none">
          <button
            id="card-filter-all"
            onClick={() => setSelectedCardFilter('all')}
            className={`px-3 py-1.5 text-[10px] font-extrabold rounded-xl border shrink-0 transition-colors cursor-pointer ${
              selectedCardFilter === 'all' 
                ? 'bg-slate-900 text-white border-transparent' 
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 shadow-sm'
            }`}
          >
            Todas
          </button>
          {CARD_NAMES.map(card => (
            <button
              id={`card-filter-${card}`}
              key={card}
              onClick={() => setSelectedCardFilter(card)}
              className={`px-3 py-1.5 text-[10px] font-extrabold rounded-xl border shrink-0 transition-colors cursor-pointer ${
                selectedCardFilter === card 
                  ? 'bg-slate-900 text-white border-transparent' 
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 shadow-sm'
              }`}
            >
              {card}
            </button>
          ))}
        </div>
      </div>

      {/* Virtual Card Dashboard metrics summary */}
      <div className="px-5 py-2">
        <div className={`rounded-3xl bg-gradient-to-br p-5 shadow-lg border relative overflow-hidden select-none ${getCardStyle(selectedCardFilter)}`}>
          <div className="absolute right-0 bottom-0 select-none opacity-5 flex items-baseline">
            <CreditCard size={144} className="translate-x-12 translate-y-12 shrink-0" />
          </div>
          
          <div className="flex justify-between items-center text-[10px] font-bold tracking-widest uppercase opacity-75">
            <span>RESUMEN {selectedCardFilter === 'all' ? 'MULTI-TARJETA' : selectedCardFilter}</span>
            <span className="font-mono">{selectedMonth}</span>
          </div>

          <div className="mt-4.5">
            <span className="text-[10px] uppercase font-bold text-slate-300 leading-none">Vencimiento del Mes</span>
            <p id="card-current-billing" className="text-2xl font-black mt-1">
              ${cardSummary.currentBilling.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 grid grid-cols-2 gap-4">
            <div>
              <span className="text-[9px] uppercase font-bold text-slate-400">Total a Pagar Futuro</span>
              <p id="card-total-pending" className="text-sm font-extrabold text-white mt-0.5">
                ${cardSummary.totalPendingAllCards.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[9px] uppercase font-bold text-slate-400 font-sans">Volumen de Consumo</span>
              <p className="text-sm font-extrabold text-white mt-0.5">
                ${cardSummary.purchaseVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Installment Items Lists */}
      <div className="flex-1 px-5 space-y-3.5 pb-24 mt-2">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Compras y Cuotas Activas</h3>
        
        {processedPurchases.filter(p => p.isActiveForFilter).length > 0 ? (
          processedPurchases
            .filter(p => p.isActiveForFilter)
            .map((purchase) => {
              const isBilledNow = purchase.isCurrentlyBilled;
              const isFinished = purchase.pendingInstallments === 0;

              return (
                <div 
                  id={`card-purchase-item-${purchase.id}`}
                  key={purchase.id} 
                  className={`bg-white rounded-3xl p-4 border border-gray-100 shadow-sm transition-all hover:border-gray-200 ${
                    isFinished ? 'opacity-55 bg-gray-50/50' : ''
                  }`}
                >
                  {/* Top buy status Row */}
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[9px] font-black text-white px-2 py-0.5 rounded bg-slate-800 tracking-wider">
                          {purchase.cardName}
                        </span>
                        <h4 className="text-sm font-black text-slate-800 truncate max-w-[170px]">{purchase.name}</h4>
                      </div>
                      <span className="text-[10px] text-gray-400 font-bold block mt-1.5 flex items-center gap-1">
                        <Calendar size={11} /> Compra: {purchase.purchaseDate}
                      </span>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-black text-slate-800 leading-tight">
                        ${purchase.totalAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </p>
                      <span className="text-[9px] text-gray-400 font-semibold block mt-0.5">
                        Total en {purchase.installmentsCount} cuotas
                      </span>
                    </div>
                  </div>

                  {/* Description if present */}
                  {purchase.description && (
                    <p className="mt-2 text-xs text-gray-500 bg-gray-50/50 p-2 rounded-xl italic">
                      {purchase.description}
                    </p>
                  )}

                  {/* Math Installment Division detail panel */}
                  <div className="mt-3.5 p-3.5 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col space-y-1.5 text-xs text-slate-600 select-none">
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-400">Cuota este mes:</span>
                      <span className="font-black text-violet-700">
                        {isBilledNow 
                          ? `$${purchase.monthlyAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} (Cuota ${purchase.currentInstallmentNumber} de ${purchase.installmentsCount})` 
                          : isFinished 
                            ? 'Saldada / Finalizada' 
                            : 'No impacta este mes (inicio futuro)'}
                      </span>
                    </div>

                    <div className="flex justify-between border-t border-gray-200/50 pt-1.5">
                      <span className="font-semibold text-gray-400">Cuotas Pagadas:</span>
                      <span className="font-bold text-gray-700">
                        {purchase.paidInstallments} de {purchase.installmentsCount}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-400">Pendiente de Pago:</span>
                      <span className="font-bold text-gray-700">
                        ${purchase.amountRemaining.toLocaleString(undefined, { maximumFractionDigits: 0 })} ({purchase.monthsRemaining} meses)
                      </span>
                    </div>
                  </div>

                  {/* Actions strip */}
                  <div className="mt-3 pt-2.5 border-t border-gray-100/50 flex justify-between items-center">
                    <span className="text-[9px] font-bold text-gray-400 uppercase select-none flex items-center gap-1">
                      {isFinished ? (
                        <span className="text-emerald-600 flex items-center gap-0.5 font-bold"><CheckCircle size={10} /> Completamente Pagada</span>
                      ) : isBilledNow ? (
                        <span className="text-violet-600 flex items-center gap-0.5 font-bold"><AlertCircle size={10} /> Cuota Activa</span>
                      ) : (
                        <span className="text-amber-500 font-bold">Inactivo</span>
                      )}
                    </span>

                    <button
                      id={`cancel-purchase-btn-${purchase.id}`}
                      onClick={() => onCancelPurchase(purchase.id)}
                      className="px-2.5 py-1 text-[10px] font-bold text-red-600 hover:bg-red-50 hover:text-red-700 border border-red-100 hover:border-red-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer select-none"
                    >
                      <Trash2 size={11} /> Cancelar compra/resto
                    </button>
                  </div>
                </div>
              );
            })
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center select-none">
            <div className="w-14 h-14 rounded-2xl bg-pink-50 flex items-center justify-center text-pink-500 mb-3.5">
              <CreditCard size={24} />
            </div>
            <h4 className="text-sm font-bold text-gray-800 font-sans">No hay compras con tarjeta</h4>
            <p className="text-xs text-gray-400 max-w-[200px] mt-1 leading-normal select-none">
              Registra consumos en cuotas de Visa, Mastercard o Amex para simular y calcular impactos.
            </p>
          </div>
        )}
      </div>

      {/* FAB "Agregar compra" */}
      <button
        id="fab-add-cards"
        onClick={onAddClick}
        className="absolute bottom-6 right-6 w-14 h-14 bg-violet-600 text-white rounded-2xl flex items-center justify-center shadow-lg hover:bg-violet-700 active:scale-95 transition-all cursor-pointer group hover:shadow-violet-200 z-10"
        title="Crear Compra Tarjeta"
      >
        <Plus size={24} className="group-hover:rotate-90 transition-transform duration-300" />
      </button>
    </div>
  );
}
