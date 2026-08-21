'use client';

import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  RotateCcw,
  CheckCircle,
  XCircle,
  Boxes,
  DollarSign,
  FileCheck,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { Tabs } from '@/components/ui/Tabs';
import { ReturnService } from '@/lib/services/return.service';
import { OrderService } from '@/lib/services/order.service';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { CreateReturnPayload, ReturnOrder } from '@/types/return';
import { Order } from '@/types/order';
import { PaginationMeta } from '@/types/api';

const RETURN_TABS = [
  { id: '', label: 'All Returns' },
  { id: 'requested', label: 'Requested' },
  { id: 'approved', label: 'Approved' },
  { id: 'restocked', label: 'Restocked' },
  { id: 'refunded', label: 'Refunded' },
  { id: 'rejected', label: 'Rejected' },
];

export default function ReturnsPage() {
  const [returns, setReturns] = useState<ReturnOrder[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 20,
    total_pages: 1,
    has_next: false,
    has_prev: false,
  });
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  // New RMA Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [shippedOrders, setShippedOrders] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<number | ''>('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [reason, setReason] = useState('Customer changed mind');
  const [notes, setNotes] = useState('');
  const [returnItems, setReturnItems] = useState<{ productId: number; quantity: number }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const loadReturns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ReturnService.getAll({
        page,
        limit: 20,
        status: statusFilter || undefined,
      });
      setReturns(res.data || []);
      if (res.pagination) {
        setPagination(res.pagination);
      }
    } catch (err) {
      toast.error('Failed to load returns');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    loadReturns();
  }, [loadReturns]);

  const openNewReturnModal = async () => {
    try {
      const res = await OrderService.getAll({ limit: 50 });
      // Shipped, invoiced, paid orders are eligible for return
      const eligible = (res.data || []).filter((o) =>
        ['shipped', 'invoiced', 'paid'].includes(o.status)
      );
      setShippedOrders(eligible);
      setSelectedOrderId('');
      setSelectedOrder(null);
      setReturnItems([]);
      setIsModalOpen(true);
    } catch (err) {
      toast.error('Failed to load eligible orders');
    }
  };

  const handleOrderSelect = async (orderIdNum: number) => {
    setSelectedOrderId(orderIdNum);
    try {
      const fullOrder = await OrderService.getById(orderIdNum);
      setSelectedOrder(fullOrder);
      if (fullOrder.items) {
        setReturnItems(
          fullOrder.items.map((i) => ({ productId: i.product_id, quantity: i.quantity }))
        );
      }
    } catch (err) {
      toast.error('Failed to load order items');
    }
  };

  const handleAction = async (
    returnId: number,
    actionName: string,
    actionFn: () => Promise<any>
  ) => {
    setProcessingId(returnId);
    try {
      await actionFn();
      toast.success(`Return #${returnId} ${actionName}!`);
      loadReturns();
    } catch (err: any) {
      toast.error(err.response?.data?.error || `Failed to ${actionName.toLowerCase()}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleCreateReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId) return toast.error('Please select an order');

    const validItems = returnItems.filter((i) => i.productId && i.quantity > 0);
    if (validItems.length === 0) {
      return toast.error('Please select at least one item to return');
    }

    setSubmitting(true);
    try {
      await ReturnService.create({
        order_id: Number(selectedOrderId),
        reason,
        notes,
        items: validItems.map((i) => ({ product_id: i.productId, quantity: i.quantity })),
      });

      toast.success('RMA Return Request created!');
      setIsModalOpen(false);
      loadReturns();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create return request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout
      title="Returns & RMA Management"
      subtitle="Lifecycle management for returns, warehouse restock, and credit note issuance"
    >
      <div className="space-y-6">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Tabs
            tabs={RETURN_TABS}
            activeTab={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
          />

          <button
            onClick={openNewReturnModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-glow transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Initiate Return (RMA)</span>
          </button>
        </div>

        {/* Returns Table */}
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl overflow-hidden shadow-glass">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold bg-slate-950/40">
                  <th className="py-3.5 px-6">Return ID</th>
                  <th className="py-3.5 px-6">Order & Customer</th>
                  <th className="py-3.5 px-6">Reason</th>
                  <th className="py-3.5 px-6">Credit Note</th>
                  <th className="py-3.5 px-6">Date</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Workflow Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-sans">
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-4 w-4 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin" />
                        <span>Loading return records...</span>
                      </div>
                    </td>
                  </tr>
                ) : returns.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-sans">
                      No return records matching this filter.
                    </td>
                  </tr>
                ) : (
                  returns.map((ret) => (
                    <tr key={ret.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-6 font-bold text-white">#{ret.id}</td>
                      <td className="py-4 px-6 font-sans">
                        <p className="font-semibold text-white">{ret.customer_name || 'Customer'}</p>
                        <p className="text-[11px] text-slate-400 font-mono">Order #{ret.order_id}</p>
                      </td>
                      <td className="py-4 px-6 font-sans text-slate-300 max-w-xs truncate">
                        {ret.reason}
                      </td>
                      <td className="py-4 px-6">
                        {ret.credit_note ? (
                          <div>
                            <span className="font-bold text-cyan-400">
                              {ret.credit_note.credit_note_number}
                            </span>
                            <p className="text-[10px] text-slate-400">
                              {formatCurrency(ret.credit_note.amount)}
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-500 font-sans text-[11px]">None</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-slate-400">{formatDateTime(ret.created_at)}</td>
                      <td className="py-4 px-6 font-sans">
                        <StatusBadge status={ret.status} />
                      </td>
                      <td className="py-4 px-6 text-right font-sans">
                        <div className="flex items-center justify-end gap-1.5">
                          {ret.status === 'requested' && (
                            <>
                              <button
                                onClick={() =>
                                  handleAction(ret.id, 'Approved', () =>
                                    ReturnService.approve(ret.id)
                                  )
                                }
                                disabled={processingId === ret.id}
                                className="px-2.5 py-1 rounded-lg bg-blue-600/15 text-blue-400 hover:bg-blue-600/25 border border-blue-500/30 text-xs font-medium transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() =>
                                  handleAction(ret.id, 'Rejected', () =>
                                    ReturnService.reject(ret.id, 'Inspection failed')
                                  )
                                }
                                disabled={processingId === ret.id}
                                className="px-2.5 py-1 rounded-lg bg-rose-600/15 text-rose-400 hover:bg-rose-600/25 border border-rose-500/30 text-xs font-medium transition-colors"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {ret.status === 'approved' && (
                            <button
                              onClick={() =>
                                handleAction(ret.id, 'Restocked & Credit Issued', () =>
                                  ReturnService.restock(ret.id)
                                )
                              }
                              disabled={processingId === ret.id}
                              className="px-2.5 py-1 rounded-lg bg-indigo-600/15 text-indigo-400 hover:bg-indigo-600/25 border border-indigo-500/30 text-xs font-medium transition-colors"
                            >
                              Restock & Issue Credit
                            </button>
                          )}

                          {ret.status === 'restocked' && (
                            <button
                              onClick={() =>
                                handleAction(ret.id, 'Refund Processed', () =>
                                  ReturnService.refund(ret.id)
                                )
                              }
                              disabled={processingId === ret.id}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600/15 text-emerald-400 hover:bg-emerald-600/25 border border-emerald-500/30 text-xs font-medium transition-colors"
                            >
                              Issue Refund
                            </button>
                          )}

                          {['refunded', 'rejected'].includes(ret.status) && (
                            <span className="text-[11px] text-slate-500 font-mono">Completed</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination pagination={pagination} onPageChange={(p) => setPage(p)} />
        </div>
      </div>

      {/* New Return RMA Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Initiate Return Merchandise Authorization (RMA)"
        subtitle="Select order and line items to be returned"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateReturn} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Select Fulfilled Order *
            </label>
            <select
              value={selectedOrderId}
              onChange={(e) => handleOrderSelect(Number(e.target.value))}
              required
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="">-- Choose Order to Return --</option>
              {shippedOrders.map((o) => (
                <option key={o.id} value={o.id}>
                  Order #{o.id} — {o.customer_name} ({formatCurrency(o.total_amount)}) [{o.status}]
                </option>
              ))}
            </select>
          </div>

          {selectedOrder && (
            <div className="space-y-2 p-3 rounded-xl bg-slate-950/80 border border-slate-800">
              <label className="block text-xs font-medium text-slate-300">
                Items to Return (Adjust Quantity)
              </label>
              <div className="space-y-2 text-xs">
                {(selectedOrder.items || []).map((item, idx) => (
                  <div key={item.product_id} className="flex items-center justify-between gap-3">
                    <span className="font-sans text-white truncate flex-1">
                      {item.product_name} ({item.sku})
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-mono text-[10px]">
                        Max: {item.quantity}
                      </span>
                      <input
                        type="number"
                        min="0"
                        max={item.quantity}
                        value={returnItems[idx]?.quantity ?? 0}
                        onChange={(e) => {
                          const next = [...returnItems];
                          next[idx] = {
                            productId: item.product_id,
                            quantity: Number(e.target.value),
                          };
                          setReturnItems(next);
                        }}
                        className="w-16 rounded-lg bg-slate-900 border border-slate-700 px-2 py-1 text-center font-mono text-white"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Reason Preset *</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="Customer changed mind">Customer Changed Mind / Cancellation</option>
              <option value="Defective / Damaged on Arrival">Defective / Damaged on Arrival</option>
              <option value="Incorrect Item Shipped">Incorrect Item Shipped</option>
              <option value="Performance Issue">Product Does Not Meet Specifications</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Inspection / RMA Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Provide return authorization instructions or serial numbers..."
              className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold shadow-glow transition-colors"
            >
              {submitting ? 'Submitting RMA...' : 'Submit RMA Request'}
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
