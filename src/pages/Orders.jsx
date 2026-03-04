import { useEffect, useState,useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getOrders, createOrder } from '../api/orders';
import { getCustomers } from '../api/customers';
import { getProducts } from '../api/products';

const STATUS_COLORS = {
  pending:   'bg-gray-500/20 text-gray-400',
  confirmed: 'bg-yellow-500/20 text-yellow-400',
  shipped:   'bg-purple-500/20 text-purple-400',
  invoiced:  'bg-blue-500/20 text-blue-400',
  paid:      'bg-green-500/20 text-green-400',
  cancelled: 'bg-red-500/20 text-red-400',
};

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders]         = useState([]);
  const [pagination, setPagination] = useState({ total: 0, total_pages: 0, has_next: false, has_prev: false });
  const [page, setPage]             = useState(1);
  const [status, setStatus]         = useState('');
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [customers, setCustomers]   = useState([]);
  const [products, setProducts]     = useState([]);
  const [form, setForm]             = useState({ customer_id: '', notes: '', items: [{ product_id: '', quantity: 1 }] });
  const [saving, setSaving]         = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Only include status in params if it has a value
      const params = { page, limit: 20 };
      if (status) params.status = status;
      
      const res = await getOrders(params);
      setOrders(res.data.data?.data || res.data.data || []);
      setPagination(res.data.data?.pagination || res.data.pagination || {});
    } catch (error) {
      console.error('Load error:', error);
      toast.error('Failed to load orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => { load(); }, [load]);

  const openForm = async () => {
    try {
      const [c, p] = await Promise.all([
        getCustomers({ limit: 100 }),
        getProducts({ limit: 100 }),
      ]);
      setCustomers(c.data.data?.data || c.data.data || []);
      setProducts(p.data.data?.data || p.data.data || []);
      setShowForm(true);
    } catch (error) {
      console.error('Form data error:', error);
      toast.error('Failed to load form data');
    }
  };

  const addItem = () => setForm(f => ({
    ...f, items: [...f.items, { product_id: '', quantity: 1 }]
  }));

  const removeItem = (i) => setForm(f => ({
    ...f, items: f.items.filter((_, idx) => idx !== i)
  }));

  const updateItem = (i, key, val) => setForm(f => ({
    ...f,
    items: f.items.map((item, idx) => idx === i ? { ...item, [key]: val } : item)
  }));

  const handleSubmit = async () => {
    if (!form.customer_id) return toast.error('Please select a customer');
    if (form.items.some(i => !i.product_id)) return toast.error('Please select a product for each item');
    setSaving(true);
    try {
      await createOrder({
        customer_id: parseInt(form.customer_id),
        notes: form.notes,
        items: form.items.map(i => ({
          product_id: parseInt(i.product_id),
          quantity: parseInt(i.quantity),
        })),
      });
      toast.success('Order created!');
      setShowForm(false);
      setForm({ customer_id: '', notes: '', items: [{ product_id: '', quantity: 1 }] });
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create order');
    } finally {
      setSaving(false);
    }
  };

  const getTotal = () => {
    return form.items.reduce((sum, item) => {
      const product = products.find(p => p.id === parseInt(item.product_id));
      return sum + (product ? parseFloat(product.unit_price) * parseInt(item.quantity || 0) : 0);
    }, 0).toFixed(2);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Orders</h1>
          <p className="text-gray-400 text-sm mt-1">{pagination.total || 0} total orders</p>
        </div>
        <button
          onClick={openForm}
          className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + New Order
        </button>
      </div>

      {/* Filter */}
      <select
        value={status}
        onChange={(e) => { setStatus(e.target.value); setPage(1); }}
        className="bg-gray-800 border border-gray-700 text-gray-300 rounded-lg px-4 py-2 text-sm mb-6 focus:outline-none focus:border-blue-500"
      >
        <option value="">All statuses</option>
        <option value="pending">Pending</option>
        <option value="confirmed">Confirmed</option>
        <option value="shipped">Shipped</option>
        <option value="invoiced">Invoiced</option>
        <option value="paid">Paid</option>
        <option value="cancelled">Cancelled</option>
      </select>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left text-gray-400 font-medium px-6 py-3">Order #</th>
              <th className="text-left text-gray-400 font-medium px-6 py-3">Customer</th>
              <th className="text-left text-gray-400 font-medium px-6 py-3">Total</th>
              <th className="text-left text-gray-400 font-medium px-6 py-3">Status</th>
              <th className="text-left text-gray-400 font-medium px-6 py-3">Date</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center text-gray-500 py-10">Loading...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={6} className="text-center text-gray-500 py-10">No orders found</td></tr>
            ) : orders.map((o) => (
              <tr key={o.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                <td className="px-6 py-4 text-white font-mono">#{o.id}</td>
                <td className="px-6 py-4 text-gray-300">{o.customer_name}</td>
                <td className="px-6 py-4 text-white font-medium">
                  ${parseFloat(o.total_amount).toFixed(2)}
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[o.status]}`}>
                    {o.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-500 text-xs">
                  {new Date(o.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => navigate(`/orders/${o.id}`)}
                    className="text-blue-400 hover:text-blue-300 text-xs transition-colors"
                  >
                    View →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-gray-500 text-sm">Page {pagination.page} of {pagination.total_pages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => p - 1)} disabled={!pagination.has_prev}
              className="px-3 py-1.5 text-sm bg-gray-800 text-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-700 transition-colors">
              Previous
            </button>
            <button onClick={() => setPage(p => p + 1)} disabled={!pagination.has_next}
              className="px-3 py-1.5 text-sm bg-gray-800 text-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-700 transition-colors">
              Next
            </button>
          </div>
        </div>
      )}

      {/* Create Order Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-white font-semibold text-lg mb-5">New Order</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Customer</label>
                <select
                  value={form.customer_id}
                  onChange={(e) => setForm(f => ({ ...f, customer_id: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select customer...</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-gray-400 text-sm">Items</label>
                  <button onClick={addItem} className="text-blue-400 hover:text-blue-300 text-xs transition-colors">
                    + Add item
                  </button>
                </div>
                <div className="space-y-2">
                  {form.items.map((item, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <select
                        value={item.product_id}
                        onChange={(e) => updateItem(i, 'product_id', e.target.value)}
                        className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                      >
                        <option value="">Select product...</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} — ${parseFloat(p.unit_price).toFixed(2)} ({p.qty_available} avail)
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(i, 'quantity', e.target.value)}
                        className="w-16 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                      />
                      {form.items.length > 1 && (
                        <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-300 text-xs">✕</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Total Preview */}
              <div className="bg-gray-800/50 rounded-lg px-4 py-3 flex justify-between items-center">
                <span className="text-gray-400 text-sm">Estimated Total</span>
                <span className="text-white font-semibold">${getTotal()}</span>
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-1">Notes (optional)</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                  rows={2}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowForm(false); setForm({ customer_id: '', notes: '', items: [{ product_id: '', quantity: 1 }] }); }}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg py-2 text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white rounded-lg py-2 text-sm transition-colors"
              >
                {saving ? 'Creating...' : 'Create Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}