import React from 'react';
import InvoiceGenerator from '../components/InvoiceGenerator';

export default function GenerateInvoice() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 py-8 px-4">
      <InvoiceGenerator />
    </div>
  );
}