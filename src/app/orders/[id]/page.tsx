'use client';

import React, { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  CheckCircle,
  Truck,
  FileText,
  XCircle,
  User as UserIcon,
  Calendar,
  DollarSign,
  Package,
  Building,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { OrderService } from '@/lib/services/order.service';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Order, OrderStatus } from '@/types/order';

const ORDER_STAGES: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'invoiced', 'paid'];

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const orderId = Number(resolvedParams.id);
  const router = useRouter();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const loadOrder = useCallback(async () => {
    try {
      const data = await OrderService.getById(orderId);
      setOrder(data);
    } catch (err) {
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const handleAction = async (actionName: string, actionFn: () => Promise<any>) => {
    setProcessing(true);
    try {
      await actionFn();
      toast.success(`Order ${actionName} successfully!`);
      loadOrder();
    } catch (err: any) {
      toast.error(err.response?.data?.error || `Failed to ${actionName.toLowerCase()} order`);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <AppLayout title="Order Details">
        <div className="py-20 text-center text-slate-400 flex items-center justify-center gap-2">
          <div className="h-4 w-4 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin" />
          <span>Loading order #{orderId}...</span>
        </div>
      </AppLayout>
    );
  }

  if (!order) {
    return (
      <AppLayout title="Order Not Found">
        <div className="p-8 text-center space-y-4">
          <p className="text-sm text-slate-400">The requested order could not be located.</p>
          <Link
            href="/orders"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-white text-xs"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Orders
          </Link>
        </div>
      </AppLayout>
    );
  }

  const currentStageIndex = ORDER_STAGES.indexOf(order.status);
  const isCancelled = order.status === 'cancelled';

  return (
    <AppLayout
      title={`Order #${order.id}`}
      subtitle={`Created on ${formatDateTime(order.created_at)}`}
    >
      <div className="space-y-6">
        {/* Top Header Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Link
            href="/orders"
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Orders
          </Link>

          {/* Action Trigger Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {order.status === 'pending' && (
              <button
                onClick={() => handleAction('Confirmed', () => OrderService.confirm(order.id))}
                disabled={processing}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-glow disabled:opacity-50 transition-colors"
              >
                <CheckCircle className="h-3.5 w-3.5" />
                <span>Confirm Order</span>
              </button>
            )}

            {order.status === 'confirmed' && (
              <button
                onClick={() => handleAction('Shipped', () => OrderService.ship(order.id))}
                disabled={processing}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-glow disabled:opacity-50 transition-colors"
              >
                <Truck className="h-3.5 w-3.5" />
                <span>Fulfill & Ship</span>
              </button>
            )}

            {order.status === 'shipped' && (
              <button
                onClick={() => handleAction('Invoiced', () => OrderService.generateInvoice(order.id))}
                disabled={processing}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-glow disabled:opacity-50 transition-colors"
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Generate Invoice</span>
              </button>
            )}

            {['pending', 'confirmed'].includes(order.status) && (
              <button
                onClick={() => handleAction('Cancelled', () => OrderService.cancel(order.id))}
                disabled={processing}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600/15 hover:bg-rose-600/25 border border-rose-500/30 text-rose-400 text-xs font-semibold disabled:opacity-50 transition-colors"
              >
                <XCircle className="h-3.5 w-3.5" />
                <span>Cancel Order</span>
              </button>
            )}
          </div>
        </div>

        {/* Order Lifecycle Progress Stepper */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Fulfillment & Payment Lifecycle
            </h3>
            <StatusBadge status={order.status} />
          </div>

          {isCancelled ? (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <XCircle className="h-4 w-4 shrink-0" />
              <span>This order has been cancelled and stock reservations released.</span>
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-2 pt-2">
              {ORDER_STAGES.map((stage, idx) => {
                const isPassed = currentStageIndex >= idx;
                const isCurrent = currentStageIndex === idx;

                return (
                  <div key={stage} className="space-y-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        isPassed
                          ? isCurrent
                            ? 'bg-blue-500 shadow-glow'
                            : 'bg-emerald-500'
                          : 'bg-slate-800'
                      }`}
                    />
                    <p
                      className={`text-[11px] font-medium capitalize text-center ${
                        isPassed ? 'text-white' : 'text-slate-500'
                      }`}
                    >
                      {stage}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Content Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Line Items Table */}
          <div className="lg:col-span-8 rounded-2xl bg-slate-900/80 border border-slate-800 p-6 backdrop-blur-xl space-y-4">
            <h3 className="text-sm font-semibold text-white">Ordered Items</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="pb-3 px-2">Item</th>
                    <th className="pb-3 px-2">SKU</th>
                    <th className="pb-3 px-2 text-center">Qty</th>
                    <th className="pb-3 px-2 text-right">Unit Price</th>
                    <th className="pb-3 px-2 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {(order.items || []).map((item, i) => (
                    <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-2 font-sans font-medium text-white">
                        {item.product_name || `Product #${item.product_id}`}
                      </td>
                      <td className="py-3 px-2 text-slate-400">{item.sku || '—'}</td>
                      <td className="py-3 px-2 text-center text-slate-200">{item.quantity}</td>
                      <td className="py-3 px-2 text-right text-slate-300">
                        {formatCurrency(item.unit_price)}
                      </td>
                      <td className="py-3 px-2 text-right font-semibold text-emerald-400">
                        {formatCurrency(Number(item.unit_price) * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total Calculation Card */}
            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Grand Total:</span>
              <span className="text-xl font-bold font-mono text-emerald-400">
                {formatCurrency(order.total_amount)}
              </span>
            </div>

            {order.notes && (
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                <p className="text-slate-400 font-semibold mb-1">Order Notes:</p>
                <p className="text-slate-300 italic">{order.notes}</p>
              </div>
            )}
          </div>

          {/* Right Column: Customer & Tenancy Info */}
          <div className="lg:col-span-4 space-y-5">
            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 backdrop-blur-xl space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Customer Information
              </h3>

              <div className="flex items-center gap-3 pt-1">
                <div className="h-10 w-10 rounded-xl bg-slate-800 text-blue-400 font-bold flex items-center justify-center">
                  <UserIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{order.customer_name || 'Customer'}</p>
                  <p className="text-xs text-slate-400 font-mono">{order.customer_email}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 backdrop-blur-xl space-y-3 text-xs">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Audit Timeline
              </h3>

              <div className="space-y-2 font-mono text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Created:</span>
                  <span>{formatDateTime(order.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Last Updated:</span>
                  <span>{formatDateTime(order.updated_at)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
