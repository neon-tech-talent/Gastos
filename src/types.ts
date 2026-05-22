/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface FixedExpense {
  id: string;
  name: string;
  amount: number;
  startDate: string; // YYYY-MM
  endDate?: string;  // YYYY-MM (if became inactive or was updated)
  isActive: boolean;
  category: string;
  notes?: string;
}

export interface DailyExpense {
  id: string;
  name: string;
  amount: number;
  date: string; // YYYY-MM-DD
  category: string;
  paymentMethod: 'Efectivo' | 'Débito' | 'Transferencia' | 'Otro';
  description?: string;
}

export interface CardPurchase {
  id: string;
  name: string;
  totalAmount: number;
  purchaseDate: string; // YYYY-MM-DD or YYYY-MM (e.g., "2026-05-15")
  installmentsCount: number; // e.g., 3
  cardName: 'Visa' | 'Mastercard' | 'Amex' | 'Otra';
  description?: string;
}

export type ScreenType = 'dashboard' | 'fixed' | 'daily' | 'cards' | 'kotlin';

export interface CategoryBudget {
  name: string;
  color: string;
  icon: string;
}

export const CATEGORIES: CategoryBudget[] = [
  { name: 'Alquiler / Hogar', color: '#6366f1', icon: 'Home' },
  { name: 'Servicios', color: '#3b82f6', icon: 'Activity' },
  { name: 'Supermercado', color: '#10b981', icon: 'ShoppingCart' },
  { name: 'Transporte', color: '#f59e0b', icon: 'Car' },
  { name: 'Suscripciones', color: '#ec4899', icon: 'Tv' },
  { name: 'Comida / Salidas', color: '#ef4444', icon: 'Coffee' },
  { name: 'Otros', color: '#8b5cf6', icon: 'Grid' },
];

export const PAYMENT_METHODS = ['Efectivo', 'Débito', 'Transferencia', 'Otro'] as const;
export const CARD_NAMES = ['Visa', 'Mastercard', 'Amex', 'Otra'] as const;
