/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, Type, FileText, Settings, Layers, CreditCard } from 'lucide-react';
import { FixedExpense, DailyExpense, CardPurchase, CATEGORIES, PAYMENT_METHODS, CARD_NAMES } from '../types';

interface AddEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'fixed' | 'daily' | 'cards';
  initialItem?: FixedExpense | DailyExpense | CardPurchase;
  onSave: (item: any) => void;
  selectedMonth: string; // YYYY-MM
}

export default function AddEditModal({ isOpen, onClose, type, initialItem, onSave, selectedMonth }: AddEditModalProps) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0].name);
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);
  
  // Daily specific
  const [paymentMethod, setPaymentMethod] = useState<'Efectivo' | 'Débito' | 'Transferencia' | 'Otro'>('Efectivo');
  
  // Card specific
  const [installmentsCount, setInstallmentsCount] = useState<number>(3);
  const [cardName, setCardName] = useState<'Visa' | 'Mastercard' | 'Amex' | 'Otra'>('Visa');

  useEffect(() => {
    if (initialItem) {
      setName(initialItem.name);
      setCategory(('category' in initialItem ? (initialItem as any).category : CATEGORIES[0].name) || CATEGORIES[0].name);
      
      if (type === 'fixed') {
        const item = initialItem as FixedExpense;
        setAmount(item.amount);
        setDate(item.startDate);
        setIsActive(item.isActive);
        setNotes(item.notes || '');
      } else if (type === 'daily') {
        const item = initialItem as DailyExpense;
        setAmount(item.amount);
        setDate(item.date);
        setPaymentMethod(item.paymentMethod);
        setNotes(item.description || '');
      } else if (type === 'cards') {
        const item = initialItem as CardPurchase;
        setAmount(item.totalAmount);
        setDate(item.purchaseDate);
        setInstallmentsCount(item.installmentsCount);
        setCardName(item.cardName);
        setNotes(item.description || '');
      }
    } else {
      // Default initial states when adding new
      setName('');
      setAmount('');
      setCategory(CATEGORIES[0].name);
      setNotes('');
      setIsActive(true);
      
      if (type === 'fixed') {
        setDate(selectedMonth);
      } else if (type === 'daily') {
        const today = new Date().toISOString().split('T')[0];
        // Ensure within selectedMonth if realistic, else today
        if (today.startsWith(selectedMonth)) {
          setDate(today);
        } else {
          setDate(`${selectedMonth}-01`);
        }
        setPaymentMethod('Efectivo');
      } else if (type === 'cards') {
        const today = new Date().toISOString().split('T')[0];
        if (today.startsWith(selectedMonth)) {
          setDate(today);
        } else {
          setDate(`${selectedMonth}-01`);
        }
        setInstallmentsCount(3);
        setCardName('Visa');
      }
    }
  }, [isOpen, initialItem, type, selectedMonth]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || amount === '' || amount <= 0 || !date) return;

    const baseData = {
      id: initialItem?.id || Date.now().toString(),
      name: name.trim(),
    };

    if (type === 'fixed') {
      onSave({
        ...baseData,
        amount: Number(amount),
        startDate: date,
        endDate: (initialItem as FixedExpense)?.endDate,
        isActive,
        category,
        notes: notes.trim() || undefined,
      });
    } else if (type === 'daily') {
      onSave({
        ...baseData,
        amount: Number(amount),
        date,
        category,
        paymentMethod,
        description: notes.trim() || undefined,
      });
    } else if (type === 'cards') {
      onSave({
        ...baseData,
        totalAmount: Number(amount),
        purchaseDate: date,
        installmentsCount: Number(installmentsCount),
        cardName,
        description: notes.trim() || undefined,
      });
    }
    onClose();
  };

  const getTitle = () => {
    const action = initialItem ? 'Editar' : 'Agregar';
    if (type === 'fixed') return `${action} Gasto Fijo`;
    if (type === 'daily') return `${action} Gasto Diario`;
    return `${action} Compra de Tarjeta`;
  };

  return (
    <div id="modal-container" className="fixed inset-0 bg-[#1d1b20]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        id="modal-card" 
        className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="text-lg font-bold text-gray-900 tracking-tight">{getTitle()}</h3>
          <button 
            id="close-button"
            onClick={onClose}
            type="button"
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {/* Nombre / Concepto */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Concepto / Nombre</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Type size={16} />
              </span>
              <input 
                id="expense-name-input"
                type="text"
                required
                placeholder="Ej. Alquiler, Supermercado, TV"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-gray-50/50 border border-gray-300 rounded-xl py-2.5 pl-10 pr-4 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-600 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Monto */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              {type === 'cards' ? 'Monto Total' : 'Monto'}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm">
                $
              </span>
              <input 
                id="expense-amount-input"
                type="number"
                step="any"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-gray-50/50 border border-gray-300 rounded-xl py-2.5 pl-8 pr-4 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-600 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Fecha */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              {type === 'fixed' ? 'Mes de Inicio' : 'Fecha'}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Calendar size={16} />
              </span>
              <input 
                id="expense-date-input"
                type={type === 'fixed' ? 'month' : 'date'}
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-gray-50/50 border border-gray-300 rounded-xl py-2.5 pl-10 pr-4 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-600 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Categoría (solo para Fijos y Diarios) */}
          {type !== 'cards' && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Categoría</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Layers size={16} />
                </span>
                <select
                  id="expense-category-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-gray-50/50 border border-gray-300 rounded-xl py-2.5 pl-10 pr-4 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-600 focus:bg-white transition-all appearance-none cursor-pointer"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.name} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Método de Pago (solo Diarios) */}
          {type === 'daily' && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Método de Pago</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {PAYMENT_METHODS.map((method) => (
                  <button
                    id={`pay-method-${method}`}
                    type="button"
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`py-2 px-3 text-xs font-medium rounded-xl border transition-all ${
                      paymentMethod === method
                        ? 'border-violet-600 bg-violet-50 text-violet-700 font-bold'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Cantidad de Cuotas (solo Tarjeta de Crédito) */}
          {type === 'cards' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Cantidad de Cuotas</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Settings size={16} />
                  </span>
                  <input
                    id="card-installments-input"
                    type="number"
                    min="1"
                    max="48"
                    required
                    value={installmentsCount}
                    onChange={(e) => setInstallmentsCount(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-gray-50/50 border border-gray-300 rounded-xl py-2.5 pl-10 pr-4 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-600 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Tarjeta</label>
                <div className="relative">
                  <span className="absolute left-10 top-1/2 -translate-y-1/2 text-gray-400">
                    <CreditCard size={14} />
                  </span>
                  <select
                    id="card-brand-select"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value as any)}
                    className="w-full bg-gray-50/50 border border-gray-300 rounded-xl py-2.5 pl-10 pr-4 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-600 focus:bg-white transition-all appearance-none cursor-pointer"
                  >
                    {CARD_NAMES.map((card) => (
                      <option key={card} value={card}>
                        {card}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Observaciones / Descripción opcional */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Descripción / Observaciones (Opcional)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-400">
                <FileText size={16} />
              </span>
              <textarea 
                id="expense-notes-textarea"
                rows={2}
                placeholder="Añadir notas relevantes o descripción..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-gray-50/50 border border-gray-300 rounded-xl py-2 pl-10 pr-4 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-600 focus:bg-white transition-all resize-none"
              />
            </div>
          </div>

          {/* Checkbox Activo / Inactivo (solo para Gastos Fijos) */}
          {type === 'fixed' && (
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <input
                id="fixed-active-toggle"
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-violet-600 bg-gray-100 border-gray-300 rounded focus:ring-violet-500 focus:ring-2 cursor-pointer focus:outline-none"
              />
              <div className="flex flex-col">
                <label htmlFor="fixed-active-toggle" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Gasto Activo
                </label>
                <span className="text-xxs text-gray-400 select-none">
                  Si está apagado, no se sumará a los resúmenes del mes.
                </span>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="pt-2">
            <button
              id="submit-expense-button"
              type="submit"
              className="w-full py-3 px-4 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold shadow-md active:bg-violet-800 transition-colors focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:outline-none"
            >
              Guardar Gasto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
