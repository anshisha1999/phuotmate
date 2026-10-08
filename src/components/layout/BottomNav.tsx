import React from 'react';
import { Home, Compass, CalendarDays, Wallet, Layers } from 'lucide-react';

export type TabType = 'home' | 'overview' | 'itinerary' | 'expenses';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  expenseCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  expenseCount = 0,
}) => {
  const tabs = [
    {
      id: 'home' as TabType,
      label: 'Trang chủ',
      icon: Home,
      badge: null,
    },
    {
      id: 'itinerary' as TabType,
      label: 'Lịch trình',
      icon: CalendarDays,
      badge: 'AI',
    },
    {
      id: 'expenses' as TabType,
      label: 'Sổ quỹ',
      icon: Wallet,
      badge: expenseCount > 0 ? `${expenseCount}` : null,
    },
    {
      id: 'overview' as TabType,
      label: 'Tour này',
      icon: Compass,
      badge: null,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800/80 pb-safe transition-all max-w-lg mx-auto">
      <div className="flex items-center justify-around px-2 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`relative flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-orange-400 font-semibold scale-105'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'stroke-[2.4] text-orange-400' : 'stroke-[1.8]'
                  }`}
                />
                {tab.badge && (
                  <span
                    className={`absolute -top-1.5 -right-3 text-[9px] px-1 py-0.2 rounded-full font-bold uppercase ${
                      tab.badge === 'AI' || tab.badge === 'Hot'
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white'
                        : tab.badge === 'Store'
                        ? 'bg-emerald-500 text-slate-950 font-black'
                        : 'bg-red-500 text-white'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-1 tracking-tight">
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 w-8 h-0.5 bg-orange-400 rounded-full"></span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
