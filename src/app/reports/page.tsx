'use client';

import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  BarChart3,
  DollarSign,
  TrendingUp,
  Package,
  Boxes,
  Calendar,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ReportsService } from '@/lib/services/reports.service';
import { formatCurrency } from '@/lib/utils';
import {
  InventoryStatusItem,
  PaymentsSummary,
  RevenueSummary,
  TopProduct,
} from '@/types/reports';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const CHART_COLORS = ['#3B82F6', '#60A5FA', '#93C5FD', '#10B981', '#34D399', '#A855F7', '#C084FC'];

export default function ReportsPage() {
  const [revenue, setRevenue] = useState<RevenueSummary | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [inventoryStatus, setInventoryStatus] = useState<InventoryStatusItem[]>([]);
  const [payments, setPayments] = useState<PaymentsSummary | null>(null);

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(true);

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const [rev, top, inv, pay] = await Promise.all([
        ReportsService.getRevenue({ from: fromDate || undefined, to: toDate || undefined }),
        ReportsService.getTopProducts(10),
        ReportsService.getInventoryStatus(),
        ReportsService.getPaymentsSummary(),
      ]);

      setRevenue(rev);
      setTopProducts(top || []);
      setInventoryStatus(inv || []);
      setPayments(pay);
    } catch (err) {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const totalStockValuation = inventoryStatus.reduce(
    (acc, item) => acc + Number(item.stock_value || 0),
    0
  );

  return (
    <AppLayout
      title="Financial Reports & Executive Analytics"
      subtitle="Enterprise revenue analytics, product sales rankings, and inventory asset valuation"
    >
      <div className="space-y-8">
        {/* Date Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-white">
            <Calendar className="h-4 w-4 text-blue-400" />
            <span>Revenue Reporting Period:</span>
          </div>

          <div className="flex items-center gap-3 text-xs w-full sm:w-auto">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="rounded-xl bg-slate-950 border border-slate-800 px-3 py-1.5 text-white font-mono focus:border-blue-500 focus:outline-none"
            />
            <span className="text-slate-500">to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="rounded-xl bg-slate-950 border border-slate-800 px-3 py-1.5 text-white font-mono focus:border-blue-500 focus:outline-none"
            />
            {(fromDate || toDate) && (
              <button
                onClick={() => {
                  setFromDate('');
                  setToDate('');
                }}
                className="text-xs text-rose-400 hover:text-rose-300"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* KPI Financial Overview Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Period Revenue"
            value={formatCurrency(revenue?.total_revenue)}
            subtitle={`${revenue?.total_orders || 0} completed orders`}
            icon={DollarSign}
            variant="blue"
          />

          <StatCard
            title="Average Order Value"
            value={formatCurrency(revenue?.avg_order_value)}
            subtitle="Per completed order"
            icon={TrendingUp}
            variant="emerald"
          />

          <StatCard
            title="Total Cash Collected"
            value={formatCurrency(revenue?.total_collected)}
            subtitle="Cleared payment receipts"
            icon={FileCheck}
            variant="purple"
          />

          <StatCard
            title="Warehouse Asset Value"
            value={formatCurrency(totalStockValuation)}
            subtitle={`${inventoryStatus.length} distinct stocked SKUs`}
            icon={Boxes}
            variant="amber"
          />
        </div>

        {/* Top Products Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Chart */}
          <div className="lg:col-span-6 rounded-2xl bg-slate-900/80 border border-slate-800 p-6 backdrop-blur-xl space-y-4">
            <h3 className="text-sm font-semibold text-white">Top 10 Selling Products by Revenue</h3>
            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topProducts}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" horizontal={false} />
                  <XAxis type="number" stroke="#64748B" fontSize={10} tickFormatter={(val) => `$${val}`} />
                  <YAxis dataKey="sku" type="category" stroke="#64748B" fontSize={10} width={70} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#334155',
                      borderRadius: '10px',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [formatCurrency(val), 'Revenue']}
                  />
                  <Bar dataKey="total_revenue" radius={[0, 6, 6, 0]}>
                    {topProducts.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Ranking Table */}
          <div className="lg:col-span-6 rounded-2xl bg-slate-900/80 border border-slate-800 p-6 backdrop-blur-xl space-y-4">
            <h3 className="text-sm font-semibold text-white">Product Sales Leaderboard</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="pb-3 px-2">SKU</th>
                    <th className="pb-3 px-2">Product Name</th>
                    <th className="pb-3 px-2 text-center">Units Sold</th>
                    <th className="pb-3 px-2 text-right">Gross Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {topProducts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400 font-sans">
                        No product sales recorded in this period.
                      </td>
                    </tr>
                  ) : (
                    topProducts.map((p, i) => (
                      <tr key={p.id} className="hover:bg-slate-800/30">
                        <td className="py-2.5 px-2 font-bold text-white">
                          <span className="text-blue-400 mr-2">#{i + 1}</span>
                          {p.sku}
                        </td>
                        <td className="py-2.5 px-2 font-sans text-slate-300 truncate max-w-[140px]">
                          {p.name}
                        </td>
                        <td className="py-2.5 px-2 text-center text-slate-200">{p.total_units_sold}</td>
                        <td className="py-2.5 px-2 text-right font-bold text-emerald-400">
                          {formatCurrency(p.total_revenue)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Inventory Valuation & Breakdown */}
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Warehouse Inventory Asset Breakdown</h3>
              <p className="text-xs text-slate-400">Stock valuation and safety replenishment status</p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400">
              Total Stock Worth: {formatCurrency(totalStockValuation)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="pb-3 px-4">SKU</th>
                  <th className="pb-3 px-4">Product Name</th>
                  <th className="pb-3 px-4">Unit Cost</th>
                  <th className="pb-3 px-4 text-center">On Hand</th>
                  <th className="pb-3 px-4 text-center">Available</th>
                  <th className="pb-3 px-4">Stock Status</th>
                  <th className="pb-3 px-4 text-right">Total Asset Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {inventoryStatus.slice(0, 10).map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-bold text-white">{item.sku}</td>
                    <td className="py-3 px-4 font-sans text-slate-300">{item.name}</td>
                    <td className="py-3 px-4 text-slate-300">{formatCurrency(item.unit_price)}</td>
                    <td className="py-3 px-4 text-center text-slate-200">{item.qty_on_hand}</td>
                    <td className="py-3 px-4 text-center font-semibold text-emerald-400">
                      {item.qty_available}
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <StatusBadge status={item.stock_status} />
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-white">
                      {formatCurrency(item.stock_value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
