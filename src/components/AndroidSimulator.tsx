/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Home, Calendar, List, CreditCard, ChevronRight, Wifi, Battery, Signal, ArrowLeft
} from 'lucide-react';
import { FixedExpense, DailyExpense, CardPurchase, ScreenType } from '../types';
import DashboardScreen from './DashboardScreen';
import FixedExpensesScreen from './FixedExpensesScreen';
import DailyExpensesScreen from './DailyExpensesScreen';
import CreditCardsScreen from './CreditCardsScreen';

interface AndroidSimulatorProps {
  fixedExpenses: FixedExpense[];
  dailyExpenses: DailyExpense[];
  cardPurchases: CardPurchase[];
  selectedMonth: string;
  onSetMonth: (month: string) => void;
  // State mutations
  onAddFixed: () => void;
  onEditFixed: (fe: FixedExpense) => void;
  onDeleteFixed: (id: string) => void;
  onToggleFixedActive: (id: string) => void;
  
  onAddDaily: () => void;
  onEditDaily: (de: DailyExpense) => void;
  onDeleteDaily: (id: string) => void;

  onAddCardPurchase: () => void;
  onCancelCardPurchase: (id: string) => void;
}

export default function AndroidSimulator({
  fixedExpenses,
  dailyExpenses,
  cardPurchases,
  selectedMonth,
  onSetMonth,
  onAddFixed,
  onEditFixed,
  onDeleteFixed,
  onToggleFixedActive,
  onAddDaily,
  onEditDaily,
  onDeleteDaily,
  onAddCardPurchase,
  onCancelCardPurchase
}: AndroidSimulatorProps) {
  
  const [activeScreen, setActiveScreen] = useState<ScreenType>('dashboard');
  const [systime, setSystime] = useState('11:29');

  // Keep phone simulator system clock synchronized
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      const hrs = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      setSystime(`${hrs}:${mins}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);

  const handleNavigate = (screen: ScreenType) => {
    setActiveScreen(screen);
  };

  // Render the requested active sub-screen inside the device frame
  const renderScreenContent = () => {
    switch (activeScreen) {
      case 'dashboard':
        return (
          <DashboardScreen
            fixedExpenses={fixedExpenses}
            dailyExpenses={dailyExpenses}
            cardPurchases={cardPurchases}
            selectedMonth={selectedMonth}
            onNavigate={handleNavigate}
            onQuickAdd={(type) => {
              if (type === 'fixed') onAddFixed();
              if (type === 'daily') onAddDaily();
              if (type === 'cards') onAddCardPurchase();
            }}
            onSetMonth={onSetMonth}
          />
        );
      case 'fixed':
        return (
          <FixedExpensesScreen
            fixedExpenses={fixedExpenses}
            onAddClick={onAddFixed}
            onEditClick={onEditFixed}
            onDeleteClick={onDeleteFixed}
            onToggleActive={onToggleFixedActive}
            selectedMonth={selectedMonth}
          />
        );
      case 'daily':
        return (
          <DailyExpensesScreen
            dailyExpenses={dailyExpenses}
            onAddClick={onAddDaily}
            onEditClick={onEditDaily}
            onDeleteClick={onDeleteDaily}
            selectedMonth={selectedMonth}
          />
        );
      case 'cards':
        return (
          <CreditCardsScreen
            cardPurchases={cardPurchases}
            onAddClick={onAddCardPurchase}
            onCancelPurchase={onCancelCardPurchase}
            selectedMonth={selectedMonth}
          />
        );
      default:
        return <div className="p-4 text-center">Screen not found</div>;
    }
  };

  // Human descriptive headers matching Material 3
  const getHeaderTitle = () => {
    switch (activeScreen) {
      case 'dashboard': return 'Control de Gastos';
      case 'fixed': return 'Gastos Fijos';
      case 'daily': return 'Gastos del Día';
      case 'cards': return 'Mis Tarjetas';
      default: return 'Control de Gastos';
    }
  };

  return (
    <div id="android-device-frame" className="relative mx-auto w-full max-w-[390px] h-[780px] bg-slate-950 rounded-[44px] p-3 shadow-2xl border-4 border-slate-800 flex flex-col justify-between shrink-0 select-none">
      
      {/* Front camera notch/punch-hole */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 w-28 h-5.5 bg-black rounded-full z-30 flex items-center justify-center border-b border-white/5">
        <div className="w-3 h-3 bg-slate-900 rounded-full border border-slate-800/80 mr-14 shrink-0" />
        <div className="w-1.5 h-1.5 bg-indigo-950 rounded-full shrink-0" />
      </div>

      {/* Internal rounded view port screen */}
      <div id="android-viewport" className="w-full h-full bg-[#fcf8ff] rounded-[34px] overflow-hidden flex flex-col relative z-20 border border-black/10 shadow-inner">
        
        {/* Android Native Status Bar */}
        <div className="px-6 pt-3 pb-1.5 flex justify-between items-center text-[10.5px] text-slate-800 font-extrabold select-none bg-white z-25 h-7">
          <span className="font-semibold">{systime}</span>
          <div className="flex items-center space-x-1.5 font-bold">
            <span className="text-[9px] text-[#422263] bg-[#f0daf7] px-1.5 py-0.2 rounded font-sans tracking-wide">OFFLINE</span>
            <Signal size={12} className="opacity-80" />
            <Wifi size={12} className="opacity-80" />
            <Battery size={12} className="opacity-80-rotate" />
          </div>
        </div>

        {/* Dynamic Screen Action Bar */}
        <div className="px-5 py-2.5 bg-white border-b border-gray-150 flex items-center justify-between shadow-sm z-20 select-none">
          <div className="flex items-center space-x-2.5">
            {activeScreen !== 'dashboard' && (
              <button 
                id="back-to-dashboard-btn"
                onClick={() => setActiveScreen('dashboard')}
                className="p-1 text-gray-500 hover:text-violet-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <h1 className="text-sm font-black text-slate-900 tracking-tight">{getHeaderTitle()}</h1>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <span className="text-[10px] font-bold text-slate-400 font-mono tracking-wide">ROOM DB ACTIVO</span>
          </div>
        </div>

        {/* Screen View Container */}
        <div className="flex-1 overflow-hidden relative">
          {renderScreenContent()}
        </div>

        {/* Material 3 Bottom Navigation bar */}
        <div id="m3-bottom-nav" className="bg-white border-t border-gray-150 py-2 px-3 flex justify-around items-center select-none z-20 shadow-[0_-1px_3px_rgba(0,0,0,0.02)]">
          
          {/* Dashboard Icon */}
          <button
            id="nav-btn-dashboard"
            onClick={() => handleNavigate('dashboard')}
            className={`flex flex-col items-center justify-center p-1.5 rounded-2xl w-14 transition-all relative cursor-pointer ${
              activeScreen === 'dashboard' ? 'text-violet-700 font-black' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <div className={`p-1 px-3 rounded-full transition-all ${activeScreen === 'dashboard' ? 'bg-[#f0e7f7]' : ''}`}>
              <Home size={18} className={activeScreen === 'dashboard' ? 'stroke-[2.5px]' : 'stroke-[1.8px]'} />
            </div>
            <span className="text-[9px] font-bold mt-1 tracking-tight">Inicio</span>
          </button>

          {/* Fixed Expenses icon */}
          <button
            id="nav-btn-fixed"
            onClick={() => handleNavigate('fixed')}
            className={`flex flex-col items-center justify-center p-1.5 rounded-2xl w-14 transition-all relative cursor-pointer ${
              activeScreen === 'fixed' ? 'text-violet-700 font-black' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <div className={`p-1 px-3 rounded-full transition-all ${activeScreen === 'fixed' ? 'bg-[#f0e7f7]' : ''}`}>
              <Calendar size={18} className={activeScreen === 'fixed' ? 'stroke-[2.5px]' : 'stroke-[1.8px]'} />
            </div>
            <span className="text-[9px] font-bold mt-1 tracking-tight">Fijos</span>
          </button>

          {/* Daily list icon */}
          <button
            id="nav-btn-daily"
            onClick={() => handleNavigate('daily')}
            className={`flex flex-col items-center justify-center p-1.5 rounded-2xl w-14 transition-all relative cursor-pointer ${
              activeScreen === 'daily' ? 'text-violet-700 font-black' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <div className={`p-1 px-3 rounded-full transition-all ${activeScreen === 'daily' ? 'bg-[#f0e7f7]' : ''}`}>
              <List size={18} className={activeScreen === 'daily' ? 'stroke-[2.5px]' : 'stroke-[1.8px]'} />
            </div>
            <span className="text-[9px] font-bold mt-1 tracking-tight">Diarios</span>
          </button>

          {/* Credit Card icon */}
          <button
            id="nav-btn-cards"
            onClick={() => handleNavigate('cards')}
            className={`flex flex-col items-center justify-center p-1.5 rounded-2xl w-14 transition-all relative cursor-pointer ${
              activeScreen === 'cards' ? 'text-violet-700 font-black' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <div className={`p-1 px-3 rounded-full transition-all ${activeScreen === 'cards' ? 'bg-[#f0e7f7]' : ''}`}>
              <CreditCard size={18} className={activeScreen === 'cards' ? 'stroke-[2.5px]' : 'stroke-[1.8px]'} />
            </div>
            <span className="text-[9px] font-bold mt-1 tracking-tight">Tarjetas</span>
          </button>

        </div>

        {/* Android Gesture bar pill */}
        <div className="bg-white py-1 flex items-center justify-center select-none">
          <div className="w-28 h-1 bg-gray-300 rounded-full" />
        </div>

      </div>
    </div>
  );
}
