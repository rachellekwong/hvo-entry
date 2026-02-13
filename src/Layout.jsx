import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { Fuel, FileText } from 'lucide-react';

export default function Layout({ children, currentPageName }) {
  const navItems = [
    { name: 'EnterSurvey', label: 'Fuel Entry 輸入', icon: Fuel },
    { name: 'GenerateInvoice', label: 'Generate Invoice 發票', icon: FileText }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 backdrop-blur-xl bg-white/80">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698d530486a5af9808992ca1/e6be25309_wahfupic.jpg" 
                alt="Logo" 
                className="max-w-8 max-h-8 w-auto h-auto object-contain"
              />
              <span className="font-semibold text-slate-900 hidden sm:block">HVO Logger 油品記錄器</span>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {navItems.map((item) => {
                const isActive = currentPageName === item.name;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={createPageUrl(item.name)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <main>
        {children}
      </main>
    </div>
  );
}