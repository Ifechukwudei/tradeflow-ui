'use client';

import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Boxes,
  AlertTriangle,
  History,
  ArrowUpDown,
  TrendingDown,
  TrendingUp,
  Settings,
  Search,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { Tabs } from '@/components/ui/Tabs';
import { InventoryService } from '@/lib/services/inventory.service';
import { formatDateTime } from '@/lib/utils';
import { InventoryAdjustment, InventoryItem } from '@/types/inventory';
import { PaginationMeta } from '@/types/api';

const STOCK_TABS = [
  { id: '', label: 'All Items' },
  { id: 'low_stock', label: 'Low Stock' },
  { id: 'out_of_stock', label: 'Out of Stock' },
  { id: 'ok', label: 'Healthy Stock' },
];

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
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

  // Stock Adjustment Modal
  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null);
  const [delta, setDelta] = useState('');
  const [reason, setReason] = useState('Shipment Received');
  const [customReason, setCustomReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // History Drawer State
  const [historyItem, setHistoryItem] = useState<InventoryItem | null>(null);
  const [historyLogs, setHistoryLogs] = useState<InventoryAdjustment[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Reorder Point Modal State
  const [reorderItem, setReorderItem] = useState<InventoryItem | null>(null);
  const [reorderPointVal, setReorderPointVal] = useState('');

  const loadInventory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await InventoryService.getAll({
        page,
        limit: 20,
        stock_status: statusFilter || undefined,
      });
      setItems(res.data || []);
      if (res.pagination) {
        setPagination(res.pagination);
      }
    } catch (err) {
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustItem || !delta) return;

    const deltaNum = parseInt(delta, 10);
    if (isNaN(deltaNum) || deltaNum === 0) {
      return toast.error('Please enter a non-zero adjustment quantity');
    }

    setSubmitting(true);
    try {
      const finalReason = reason === 'Other' ? customReason : reason;
      await InventoryService.adjustStock(adjustItem.product_id, {
        delta: deltaNum,
        reason: finalReason || 'Manual adjustment',
      });

      toast.success('Stock adjusted successfully!');
      setAdjustItem(null);
      setDelta('');
      loadInventory();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Adjustment failed');
    } finally {
      setSubmitting(false);
    }
  };

  const openHistory = async (item: InventoryItem) => {
    setHistoryItem(item);
    setLoadingHistory(true);
    try {
      const logs = await InventoryService.getHistory(item.product_id);
      setHistoryLogs(logs);
    } catch (err) {
      toast.error('Failed to load audit history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleReorderPointSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reorderItem || !reorderPointVal) return;

    setSubmitting(true);
    try {
      await InventoryService.updateReorderPoint(
        reorderItem.product_id,
        parseInt(reorderPointVal, 10) || 0
      );
      toast.success('Safety reorder threshold updated');
      setReorderItem(null);
      loadInventory();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update reorder point');
    } finally {
      setSubmitting(false);
    }
  };

  const lowStockCount = items.filter((i) => i.stock_status === 'low_stock').length;
  const outOfStockCount = items.filter((i) => i.stock_status === 'out_of_stock').length;

  return (
    <AppLayout
      title="Inventory Control"
      subtitle="Stock levels, warehouse adjustments, and safety reorder thresholds"
    >
      <div className="space-y-6">
        {/* KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Monitored SKUs"
            value={pagination.total || items.length}
            subtitle="Active inventory records"
            icon={Boxes}
            variant="blue"
          />
          <StatCard
            title="Low Stock Warnings"
            value={lowStockCount}
            subtitle="Approaching depletion"
            icon={AlertTriangle}
            variant={lowStockCount > 0 ? 'amber' : 'emerald'}
          />
          <StatCard
            title="Depleted / Out of Stock"
            value={outOfStockCount}
            subtitle="Zero quantity available"
            icon={TrendingDown}
            variant={outOfStockCount > 0 ? 'rose' : 'emerald'}
          />
        </div>

        {/* Filter Controls */}
        <div className="flex items-center justify-between">
          <Tabs
            tabs={STOCK_TABS}
            activeTab={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
          />
        </div>

        {/* Inventory Table */}
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl overflow-hidden shadow-glass">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold bg-slate-950/40">
                  <th className="py-3.5 px-6">Product</th>
                  <th className="py-3.5 px-6">On Hand</th>
                  <th className="py-3.5 px-6">Reserved</th>
                  <th className="py-3.5 px-6">Available</th>
                  <th className="py-3.5 px-6">Reorder At</th>
                  <th className="py-3.5 px-6">Health</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-4 w-4 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin" />
                        <span>Loading inventory levels...</span>
                      </div>
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-sans">
                      No inventory records matching this view.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.product_id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-6 font-sans">
                        <p className="font-semibold text-white">{item.name}</p>
                        <p className="font-mono text-slate-400 text-[11px] uppercase">{item.sku}</p>
                      </td>
                      <td className="py-4 px-6 text-slate-200">{item.qty_on_hand}</td>
                      <td className="py-4 px-6 text-amber-400">{item.qty_reserved}</td>
                      <td className="py-4 px-6 font-bold text-emerald-400 text-sm">
                        {item.qty_available}
                      </td>
                      <td className="py-4 px-6 text-slate-400">
                        <button
                          onClick={() => {
                            setReorderItem(item);
                            setReorderPointVal(String(item.reorder_point));
                          }}
                          className="hover:text-blue-400 flex items-center gap-1 group font-sans"
                        >
                          <span className="font-mono">{item.reorder_point}</span>
                          <Settings className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                        </button>
                      </td>
                      <td className="py-4 px-6 font-sans">
                        <StatusBadge status={item.stock_status} />
                      </td>
                      <td className="py-4 px-6 text-right font-sans">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setAdjustItem(item);
                              setDelta('');
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 text-xs font-medium transition-colors"
                          >
                            <ArrowUpDown className="h-3 w-3" /> Adjust
                          </button>

                          <button
                            onClick={() => openHistory(item)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                            title="View Audit History"
                          >
                            <History className="h-3.5 w-3.5" />
                          </button>
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

      {/* Stock Adjustment Modal */}
      <Modal
        isOpen={!!adjustItem}
        onClose={() => setAdjustItem(null)}
        title="Adjust Inventory Stock"
        subtitle={`Product: ${adjustItem?.name} (${adjustItem?.sku})`}
        maxWidth="md"
      >
        <form onSubmit={handleAdjustSubmit} className="space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs flex justify-between">
            <span className="text-slate-400">Current On Hand:</span>
            <span className="font-mono font-bold text-white">{adjustItem?.qty_on_hand} units</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Quantity Adjustment Delta (+ or -) *
            </label>
            <input
              type="number"
              value={delta}
              onChange={(e) => setDelta(e.target.value)}
              placeholder="e.g. +50 or -10"
              required
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs text-white font-mono placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Use positive numbers to add stock, negative to decrease.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Reason Preset *</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="Shipment Received">Shipment Received from Supplier</option>
              <option value="Cycle Count Adjustment">Physical Cycle Count Correction</option>
              <option value="Damage / Spoilage">Damaged / Defective Stock Scrapped</option>
              <option value="Customer Return Restock">Customer Return Restocked</option>
              <option value="Other">Other (Specify below)</option>
            </select>
          </div>

          {reason === 'Other' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Custom Reason Note
              </label>
              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Audit discrepancy batch #441"
                required
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setAdjustItem(null)}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold shadow-glow transition-colors"
            >
              {submitting ? 'Updating...' : 'Confirm Adjustment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Reorder Threshold Modal */}
      <Modal
        isOpen={!!reorderItem}
        onClose={() => setReorderItem(null)}
        title="Update Safety Reorder Point"
        subtitle={`Product: ${reorderItem?.name}`}
        maxWidth="sm"
      >
        <form onSubmit={handleReorderPointSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Minimum Safety Threshold (Units) *
            </label>
            <input
              type="number"
              min="0"
              value={reorderPointVal}
              onChange={(e) => setReorderPointVal(e.target.value)}
              required
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs text-white font-mono focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setReorderItem(null)}
              className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
            >
              Save Point
            </button>
          </div>
        </form>
      </Modal>

      {/* Audit History Modal */}
      <Modal
        isOpen={!!historyItem}
        onClose={() => setHistoryItem(null)}
        title="Stock Adjustment Log"
        subtitle={`Audit trail for ${historyItem?.name} (${historyItem?.sku})`}
        maxWidth="lg"
      >
        <div className="max-h-72 overflow-y-auto space-y-2 pr-1 text-xs">
          {loadingHistory ? (
            <div className="py-8 text-center text-slate-400">Loading audit history...</div>
          ) : historyLogs.length === 0 ? (
            <div className="py-8 text-center text-slate-400">
              No manual stock adjustments recorded for this product.
            </div>
          ) : (
            historyLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800 font-mono"
              >
                <div className="space-y-0.5">
                  <p className="font-sans font-medium text-white">{log.reason}</p>
                  <p className="text-[10px] text-slate-400">{formatDateTime(log.created_at)}</p>
                </div>
                <div
                  className={`text-sm font-bold ${
                    log.delta > 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {log.delta > 0 ? `+${log.delta}` : log.delta} units
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>
    </AppLayout>
  );
}
