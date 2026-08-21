'use client';

import React from 'react';
import { Menu, Search, Bell, Shield, Sparkles, Building } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { StatusBadge } from '../ui/StatusBadge';

interface HeaderProps {
  onMenuClick: () => void;
  title?: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick, title, subtitle }) => {
  const { user, tenant } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800/80 bg-slate-950/80 px-4 sm:px-6 backdrop-blur-xl">
      {/* Left Title & Mobile Menu */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>

        {title && (
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">{title}</h1>
            {subtitle && <p className="text-xs text-slate-400 hidden sm:block">{subtitle}</p>}
          </div>
        )}
      </div>

      {/* Right Actions & Status */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Global Search Bar (Simulated Command Palette) */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Quick search (orders, SKUs, customers)..."
            className="w-64 lg:w-72 rounded-xl bg-slate-900/80 border border-slate-800 py-1.5 pl-9 pr-8 text-xs text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 border border-slate-700">
            ⌘K
          </kbd>
        </div>

        {/* Live Systems Status */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Operational</span>
        </div>

        {/* User Role Badge */}
        {user?.role && <StatusBadge status={user.role} />}
      </div>
    </header>
  );
};
