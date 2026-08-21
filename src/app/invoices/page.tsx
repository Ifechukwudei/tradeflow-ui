'use client';

import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  FileText,
  CreditCard,
  CheckCircle2,
  Clock,
  ArrowRight,
  DollarSign,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { InvoiceService } from '@/lib/services/invoice.service';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Invoice, PaymentMethod } from '@/types/invoice';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  // Payment Recording Modal State
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const data = await InvoiceService.getAll();
      setInvoices(data || []);
    } catch (err) {
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const openPaymentModal = (inv: Invoice) => {
    setPayingInvoice(inv);
    const outstanding = Number(inv.amount_due) - Number(inv.amount_paid);
    setAmount(outstanding.toFixed(2));
    setPaymentMethod('bank_transfer');
    setReference('');
    setNotes('');
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingInvoice || !amount) return;

    const amtNum = parseFloat(amount);
    const maxPayable = Number(payingInvoice.amount_due) - Number(payingInvoice.amount_paid);

    if (isNaN(amtNum) || amtNum <= 0) {
      return toast.error('Please enter a valid payment amount');
    }

    if (amtNum > maxPayable + 0.001) {
      return toast.error(`Payment exceeds remaining balance of ${formatCurrency(maxPayable)}`);
    }

    setSubmitting(true);
    try {
      await InvoiceService.recordPayment(payingInvoice.id, {
        amount: amtNum,
        payment_method: paymentMethod,
        reference,
        notes,
      });

      toast.success('Payment recorded and order reconciled!');
      setPayingInvoice(null);
      loadInvoices();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Payment recording failed');
    } finally {
      setSubmitting(false);
    }
  };

  const totalInvoiced = invoices.reduce((s, i) => s + Number(i.amount_due), 0);
  const totalCollected = invoices.reduce((s, i) => s + Number(i.amount_paid), 0);
  const totalOutstanding = totalInvoiced - totalCollected;

  return (
    <AppLayout
      title="Invoices & Collections"
      subtitle="Billing ledger, receivables tracking, and automated payment reconciliation"
    >
      <div className="space-y-6">
        {/* KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Total Invoiced"
            value={formatCurrency(totalInvoiced)}
            subtitle={`${invoices.length} billing statements generated`}
            icon={FileText}
            variant="blue"
          />
          <StatCard
            title="Payments Settled"
            value={formatCurrency(totalCollected)}
            subtitle="Gross cash inflow recorded"
            icon={CheckCircle2}
            variant="emerald"
          />
          <StatCard
            title="Accounts Receivable"
            value={formatCurrency(totalOutstanding)}
            subtitle="Unsettled customer balances"
            icon={Clock}
            variant={totalOutstanding > 0 ? 'amber' : 'emerald'}
          />
        </div>

        {/* Invoices Table */}
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl overflow-hidden shadow-glass">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold bg-slate-950/40">
                  <th className="py-3.5 px-6">Invoice Number</th>
                  <th className="py-3.5 px-6">Customer & Order</th>
                  <th className="py-3.5 px-6">Amount Due</th>
                  <th className="py-3.5 px-6">Paid Balance</th>
                  <th className="py-3.5 px-6">Settlement Progress</th>
                  <th className="py-3.5 px-6">Due Date</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 font-sans">
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-4 w-4 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin" />
                        <span>Loading invoices...</span>
                      </div>
                    </td>
                  </tr>
                ) : invoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 font-sans">
                      No invoices generated yet. Ship an order to generate its invoice.
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => {
                    const due = Number(inv.amount_due);
                    const paid = Number(inv.amount_paid);
                    const percentPaid = due > 0 ? Math.min(100, Math.round((paid / due) * 100)) : 0;

                    return (
                      <tr key={inv.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-4 px-6 font-bold text-white tracking-wide">
                          {inv.invoice_number}
                        </td>
                        <td className="py-4 px-6 font-sans">
                          <p className="font-semibold text-white">{inv.customer_name || 'Customer'}</p>
                          <p className="text-[11px] text-slate-400 font-mono">Order #{inv.order_id}</p>
                        </td>
                        <td className="py-4 px-6 font-bold text-white">
                          {formatCurrency(inv.amount_due)}
                        </td>
                        <td className="py-4 px-6 text-emerald-400">
                          {formatCurrency(inv.amount_paid)}
                        </td>
                        <td className="py-4 px-6 font-sans w-36">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                              <span>{percentPaid}%</span>
                              <span>{formatCurrency(due - paid)} left</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                                style={{ width: `${percentPaid}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-slate-400 font-mono">
                          {formatDate(inv.due_date)}
                        </td>
                        <td className="py-4 px-6 font-sans">
                          <StatusBadge status={inv.status} />
                        </td>
                        <td className="py-4 px-6 text-right font-sans">
                          {inv.status !== 'paid' ? (
                            <button
                              onClick={() => openPaymentModal(inv)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-colors"
                            >
                              <CreditCard className="h-3.5 w-3.5" />
                              <span>Record Payment</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-500 font-mono">Settled ✓</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Record Payment Modal */}
      <Modal
        isOpen={!!payingInvoice}
        onClose={() => setPayingInvoice(null)}
        title="Record Invoice Payment"
        subtitle={`Invoice #${payingInvoice?.invoice_number} • Order #${payingInvoice?.order_id}`}
        maxWidth="md"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5 font-mono">
            <div className="flex justify-between text-slate-400">
              <span>Total Invoiced:</span>
              <span>{formatCurrency(payingInvoice?.amount_due)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Already Paid:</span>
              <span className="text-emerald-400">{formatCurrency(payingInvoice?.amount_paid)}</span>
            </div>
            <div className="flex justify-between font-bold text-white pt-1 border-t border-slate-800">
              <span>Remaining Balance:</span>
              <span className="text-amber-400">
                {formatCurrency(
                  Number(payingInvoice?.amount_due || 0) - Number(payingInvoice?.amount_paid || 0)
                )}
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-slate-300">
                Payment Amount (USD) *
              </label>
              <button
                type="button"
                onClick={() => {
                  const rem =
                    Number(payingInvoice?.amount_due || 0) - Number(payingInvoice?.amount_paid || 0);
                  setAmount(rem.toFixed(2));
                }}
                className="text-[11px] text-blue-400 hover:text-blue-300"
              >
                Pay Full Balance
              </button>
            </div>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={
                Number(payingInvoice?.amount_due || 0) - Number(payingInvoice?.amount_paid || 0)
              }
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs text-white font-mono focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Payment Method *</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="bank_transfer">Wire / Bank Transfer</option>
              <option value="credit_card">Corporate Credit Card</option>
              <option value="cash">Direct Cash Receipt</option>
              <option value="cheque">Bank Cheque</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Transaction / Check Reference #
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. WIRE-8849202"
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs text-white font-mono placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Payment verified by accounting"
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setPayingInvoice(null)}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold shadow-glow transition-colors"
            >
              {submitting ? 'Recording...' : 'Settle Payment'}
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
