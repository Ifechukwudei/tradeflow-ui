'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  ShoppingBag,
  Plus,
  Search,
  ArrowUpRight,
  Trash2,
  Calendar,
  User as UserIcon,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { Tabs } from '@/components/ui/Tabs';
import { OrderService } from '@/lib/services/order.service';
import { CustomerService } from '@/lib/services/customer.service';
import { ProductService } from '@/lib/services/product.service';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Order } from '@/types/order';
import { Customer } from '@/types/customer';
import { Product } from '@/types/product';
import { PaginationMeta } from '@/types/api';

const ORDER_TABS = [
  { id: '', label: 'All Orders' },
  { id: 'pending', label: 'Pending' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'shipped', label: 'Shipped' },
  { id: 'invoiced', label: 'Invoiced' },
  { id: 'paid', label: 'Paid' },
  { id: 'cancelled', label: 'Cancelled' },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
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

  // New Order Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerId, setCustomerId] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<{ productId: number | ''; quantity: number }[]>([
    { productId: '', quantity: 1 },
  ]);
  const [submitting, setSubmitting] = useState(false);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await OrderService.getAll({
        page,
        limit: 20,
        status: statusFilter || undefined,
      });
      setOrders(res.data || []);
      if (res.pagination) {
        setPagination(res.pagination);
      }
    } catch (err) {
      console.error('Failed to load orders', err);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const openNewOrderModal = async () => {
    try {
      const [custRes, prodRes] = await Promise.all([
        CustomerService.getAll({ limit: 100 }),
        ProductService.getAll({ limit: 100 }),
      ]);
      setCustomers(custRes.data || []);
      setProducts(prodRes.data || []);
      setIsModalOpen(true);
    } catch (err) {
      toast.error('Failed to load customers or products');
    }
  };

  const handleAddItem = () => {
    setItems([...items, { productId: '', quantity: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: 'productId' | 'quantity', value: any) => {
    const next = [...items];
    next[index] = { ...next[index], [field]: value };
    setItems(next);
  };

  // Calculate live total preview
  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      if (!item.productId) return sum;
      const product = products.find((p) => p.id === Number(item.productId));
      const price = product ? Number(product.unit_price) : 0;
      return sum + price * (Number(item.quantity) || 0);
    }, 0);
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) return toast.error('Please select a customer');

    const validItems = items.filter((i) => i.productId && Number(i.quantity) > 0);
    if (validItems.length === 0) {
      return toast.error('Please select at least one valid product and quantity');
    }

    setSubmitting(true);
    try {
      await OrderService.create({
        customer_id: Number(customerId),
        notes,
        items: validItems.map((i) => ({
          product_id: Number(i.productId),
          quantity: Number(i.quantity),
        })),
      });

      toast.success('Order placed successfully!');
      setIsModalOpen(false);
      setCustomerId('');
      setNotes('');
      setItems([{ productId: '', quantity: 1 }]);
      loadOrders();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout
      title="Sales Orders"
      subtitle="Track, fulfill, invoice, and manage customer purchase orders"
    >
      <div className="space-y-6">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Tabs
            tabs={ORDER_TABS}
            activeTab={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
          />

          <button
            onClick={openNewOrderModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-glow transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Create Order</span>
          </button>
        </div>

        {/* Orders Table */}
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl overflow-hidden shadow-glass">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold bg-slate-950/40">
                  <th className="py-3.5 px-6">Order ID</th>
                  <th className="py-3.5 px-6">Customer</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Total Amount</th>
                  <th className="py-3.5 px-6">Date Placed</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-4 w-4 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin" />
                        <span>Loading orders...</span>
                      </div>
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No orders found matching the selected filter.
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-6 font-mono font-bold text-white">
                        #{order.id}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-md bg-slate-800 flex items-center justify-center text-slate-300 font-bold text-[10px]">
                            {order.customer_name ? order.customer_name[0] : 'C'}
                          </div>
                          <div>
                            <p className="font-medium text-white">{order.customer_name || 'Customer'}</p>
                            <p className="text-[11px] text-slate-400 font-mono">{order.customer_email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="py-4 px-6 font-mono font-bold text-emerald-400 text-sm">
                        {formatCurrency(order.total_amount)}
                      </td>
                      <td className="py-4 px-6 text-slate-400 font-mono">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Link
                          href={`/orders/${order.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-medium transition-colors"
                        >
                          <span>Manage</span>
                          <ArrowUpRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            pagination={pagination}
            onPageChange={(p) => setPage(p)}
          />
        </div>
      </div>

      {/* Create Order Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Sales Order"
        subtitle="Reserve stock items and place order for customer"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateOrder} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Select Customer *
            </label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(Number(e.target.value))}
              required
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="">-- Select a Customer --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.email})
                </option>
              ))}
            </select>
          </div>

          {/* Line Items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-slate-300">
                Order Line Items *
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                <Plus className="h-3 w-3" /> Add item
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {items.map((item, index) => {
                const selectedProd = products.find((p) => p.id === Number(item.productId));
                const lineTotal = selectedProd
                  ? Number(selectedProd.unit_price) * (Number(item.quantity) || 0)
                  : 0;

                return (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800"
                  >
                    <div className="flex-1">
                      <select
                        value={item.productId}
                        onChange={(e) =>
                          handleItemChange(index, 'productId', Number(e.target.value))
                        }
                        required
                        className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                      >
                        <option value="">-- Choose Product --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.sku}) — {formatCurrency(p.unit_price)} [{p.qty_available ?? 0} in stock]
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-20">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(index, 'quantity', Number(e.target.value))
                        }
                        required
                        className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-xs text-white font-mono text-center focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="w-24 text-right font-mono text-xs font-semibold text-emerald-400">
                      {formatCurrency(lineTotal)}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      disabled={items.length <= 1}
                      className="p-1.5 text-slate-500 hover:text-rose-400 disabled:opacity-30"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Order Total */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <span className="text-xs font-semibold text-slate-300">Estimated Total:</span>
            <span className="text-base font-bold font-mono text-emerald-400">
              {formatCurrency(calculateTotal())}
            </span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Internal Notes / PO Ref (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="e.g. Rush delivery requested by client..."
              className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none"
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
              {submitting ? 'Placing Order...' : 'Confirm & Reserve Stock'}
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
