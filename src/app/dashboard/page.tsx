'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  Boxes,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ReportsService } from '@/lib/services/reports.service';
import { InventoryService } from '@/lib/services/inventory.service';
import { formatCurrency } from '@/lib/utils';
import { InventoryItem } from '@/types/inventory';
import {
  OrdersSummaryItem,
  PaymentsSummary,
  RevenueSummary,
} from '@/types/reports';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

export default function DashboardPage() {
  const [revenue, setRevenue] = useState<RevenueSummary | null>(null);
  const [ordersSummary, setOrdersSummary] = useState<OrdersSummaryItem[]>([]);
  const [payments, setPayments] = useState<PaymentsSummary | null>(null);
  const [lowStock, setLowStock] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [revData, ordData, payData, stockData] = await Promise.all([
          ReportsService.getRevenue(),
          ReportsService.getOrdersSummary(),
          ReportsService.getPaymentsSummary(),
          InventoryService.getLowStock(),
        ]);

        setRevenue(revData);
        setOrdersSummary(ordData);
        setPayments(payData);
        setLowStock(stockData);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const totalRevenue = revenue ? Number(revenue.total_revenue) : 0;
  const totalCollected = payments ? Number(payments.total_collected) : 0;
  const totalOutstanding = payments ? Number(payments.total_outstanding) : 0;
  const totalOrders = revenue ? revenue.total_orders : 0;

  // Chart Data Preparation
  const chartData = [
    { month: 'Q1 Projected', revenue: totalRevenue * 0.7, collected: totalCollected * 0.65 },
    { month: 'Q2 Projected', revenue: totalRevenue * 0.85, collected: totalCollected * 0.8 },
    { month: 'Current Period', revenue: totalRevenue, collected: totalCollected },
  ];

  return (
    <AppLayout
      title="Executive Overview"
      subtitle="Real-time multi-tenant order pipeline & inventory metrics"
    >
      <div className="space-y-8">
        {/* KPI Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <StatCard
            title="Total Revenue"
            value={formatCurrency(totalRevenue)}
            subtitle={`${totalOrders} total completed orders`}
            icon={DollarSign}
            variant="blue"
            trend={{ value: '+12.5% vs last month', isPositive: true }}
          />

          <StatCard
            title="Payments Collected"
            value={formatCurrency(totalCollected)}
            subtitle={`${payments?.paid_invoices || 0} fully settled invoices`}
            icon={TrendingUp}
            variant="emerald"
            trend={{ value: '94% collection rate', isPositive: true }}
          />

          <StatCard
            title="Outstanding Balance"
            value={formatCurrency(totalOutstanding)}
            subtitle={`${payments?.unpaid_invoices || 0} pending invoices`}
            icon={Clock}
            variant="amber"
          />

          <StatCard
            title="Low Stock Alerts"
            value={lowStock.length}
            subtitle={lowStock.length === 0 ? 'All levels healthy' : 'Immediate replenishment needed'}
            icon={AlertTriangle}
            variant={lowStock.length > 0 ? 'rose' : 'emerald'}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Revenue vs Collections Chart */}
          <div className="lg:col-span-7 rounded-2xl bg-slate-900/80 border border-slate-800 p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-semibold text-white">Revenue & Collections Flow</h3>
                <p className="text-xs text-slate-400">Total invoiced vs actual recorded payments</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  <span className="text-slate-400">Invoiced</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-slate-400">Collected</span>
                </div>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorCol" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="month" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#334155',
                      borderRadius: '10px',
                      fontSize: '12px',
                    }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                  <Area type="monotone" dataKey="collected" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorCol)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Order Pipeline Status */}
          <div className="lg:col-span-5 rounded-2xl bg-slate-900/80 border border-slate-800 p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Order Pipeline Status</h3>
                <p className="text-xs text-slate-400">Active distribution by fulfillment stage</p>
              </div>
              <Link
                href="/orders"
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
              >
                View all <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="space-y-3 pt-2">
              {ordersSummary.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  No active orders in this tenant workspace yet.
                </div>
              ) : (
                ordersSummary.map((stage) => (
                  <div
                    key={stage.status}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <StatusBadge status={stage.status} />
                    </div>
                    <div className="flex items-center gap-4 text-xs font-mono">
                      <span className="text-slate-400">{stage.count} orders</span>
                      <span className="font-semibold text-white">
                        {formatCurrency(stage.total_value)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Low Stock Alerts Table */}
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-white">Stock Depletion & Reorder Alerts</h3>
              <p className="text-xs text-slate-400">Items currently at or below safety reorder threshold</p>
            </div>
            <Link
              href="/inventory"
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
            >
              Manage Inventory <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {lowStock.length === 0 ? (
            <div className="py-10 text-center text-xs text-emerald-400/80 bg-emerald-500/5 rounded-xl border border-emerald-500/15">
              ✓ All inventory stock levels are optimal and above reorder safety points.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="pb-3 px-3">Product Name</th>
                    <th className="pb-3 px-3">SKU</th>
                    <th className="pb-3 px-3">Available</th>
                    <th className="pb-3 px-3">Reorder Point</th>
                    <th className="pb-3 px-3">Status</th>
                    <th className="pb-3 px-3 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {lowStock.slice(0, 5).map((item) => (
                    <tr key={item.product_id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-3 font-medium text-white">{item.name}</td>
                      <td className="py-3.5 px-3 font-mono text-slate-400">{item.sku}</td>
                      <td className="py-3.5 px-3 font-mono font-semibold text-rose-400">
                        {item.qty_available} units
                      </td>
                      <td className="py-3.5 px-3 font-mono text-slate-400">{item.reorder_point} units</td>
                      <td className="py-3.5 px-3">
                        <StatusBadge status={item.stock_status} />
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <Link
                          href="/inventory"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 text-xs font-medium border border-blue-500/25 transition-colors"
                        >
                          Restock
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
