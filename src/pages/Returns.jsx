import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { getReturns, createReturn, approveReturn, rejectReturn, restockReturn, refundReturn } from '../api/returns';
import { getOrders } from '../api/orders';
import { getProducts } from '../api/products';

const STATUS_COLORS = {
  requested: 'bg-gray-500/20 text-gray-400',
  approved:  'bg-yellow-500/20 text-yellow-400',
  restocked: 'bg-blue-500/20 text-blue-400',
  refunded:  'bg-green-500/20 text-green-400',
  rejected:  'bg-red-500/20 text-red-400',
};

const EMPTY_FORM = { order_id: '', reason: '', notes: '', items: [{ product_id: '', quantity: 1 }] };

export default function Returns() {
  const [returns, setReturns]       = useState([]);
  const [pagination, setPagination] = useState({ total: 0, total_pages: 0, has_next: false, has_prev: false });
  const [page, setPage]             = useState(1);
  const [status, setStatus]         = useState('');
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [orders, setOrders]         = useState([]);
  const [products, setProducts]     = useState([]);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);
  const [acting, setActing]         = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getReturns({ page, limit: 20, status });
      setReturns(res.data.data?.data || res.data.data || []);
      setPagination(res.data.data?.pagination || res.data.pagination || {});
    } catch (error) {
      console.error('Load error:', error);
      toast.error('Failed to load returns');
      setReturns([]);
    } finally {
      setLoading(false);
    }
  },[page, status]);

  useEffect(() => { load(); }, [load] );

  const openForm = async () => {
    try {
      const [o, p] = await Promise.all([
        getOrders({ limit: 100 }),
        getProducts({ limit: 100 }),
      ]);
      const ordersData = o.data.data?.data || o.data.data || [];
      const productsData = p.data.data?.data || p.data.data || [];
      
      console.log('Orders loaded:', ordersData);
      console.log('Products loaded:', productsData);
      
      setOrders(ordersData);
      setProducts(productsData);
      setShowForm(true);
    } catch (error) {
      console.error('Form data error:', error);
      toast.error('Failed to load form data');
    }
  };

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { product_id: '', quantity: 1 }] }));
  const removeItem = (i) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
  const updateItem = (i, key, val) => setForm(f => ({
    ...f, items: f.items.map((item, idx) => idx === i ? { ...item, [key]: val } : item)
  }));

  const handleSubmit = async () => {
    if (!form.order_id) return toast.error('Please select an order');
    if (!form.reason) return toast.error('Reason is required');
    if (form.items.some(i => !i.product_id)) return toast.error('Please select a product for each item');
    setSaving(true);
    try {
      await createReturn({
        order_id: parseInt(form.order_id),
        reason: form.reason,
        notes: form.notes,
        items: form.items.map(i => ({
          product_id: parseInt(i.product_id),
          quantity: parseInt(i.quantity),
        })),
      });
      toast.success('Return request created!');
      setShowForm(false);
      setForm(EMPTY_FORM);
      load();
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(error.response?.data?.error || 'Failed to create return');
    } finally {
      setSaving(false);
    }
  };

  const handleAction = async (id, fn, label) => {
    setActing(id);
    try {
      await fn(id);
      toast.success(`Return ${label}!`);
      load();
    } catch (error) {
      console.error('Action error:', error);
      toast.error(error.response?.data?.error || `Failed to ${label} return`);
    } finally {
      setActing(null);
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Returns</h1>
          <p className="text-gray-400 text-sm mt-1">{pagination.total || 0} total returns</p>
        </div>
        <button
          onClick={openForm}
          className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors w-full sm:w-auto"
        >
          + New Return
        </button>
      </div>

      {/* Filter */}
      <select
        value={status}
        onChange={(e) => { setStatus(e.target.value); setPage(1); }}
        className="bg-gray-800 border border-gray-700 text-gray-300 rounded-lg px-4 py-2 text-sm mb-6 focus:outline-none focus:border-blue-500"
      >
        <option value="">All statuses</option>
        <option value="requested">Requested</option>
        <option value="approved">Approved</option>
        <option value="restocked">Restocked</option>
        <option value="refunded">Refunded</option>
        <option value="rejected">Rejected</option>
      </select>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
        <table className="w-full text-sm min-w-[768px]">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left text-gray-400 font-medium px-6 py-3">Return #</th>
              <th className="text-left text-gray-400 font-medium px-6 py-3">Order</th>
              <th className="text-left text-gray-400 font-medium px-6 py-3">Customer</th>
              <th className="text-left text-gray-400 font-medium px-6 py-3">Reason</th>
              <th className="text-left text-gray-400 font-medium px-6 py-3">Status</th>
              <th className="text-left text-gray-400 font-medium px-6 py-3">Date</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center text-gray-500 py-10">Loading...</td></tr>
            ) : returns.length === 0 ? (
              <tr><td colSpan={7} className="text-center text-gray-500 py-10">No returns found</td></tr>
            ) : returns.map((r) => (
              <tr key={r.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                <td className="px-6 py-4 text-white font-mono">#{r.id}</td>
                <td className="px-6 py-4 text-gray-400 font-mono">#{r.order_id}</td>
                <td className="px-6 py-4 text-gray-300">{r.customer_name}</td>
                <td className="px-6 py-4 text-gray-400 max-w-xs truncate">{r.reason}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[r.status]}`}>
                    {r.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-500 text-xs">
                  {new Date(r.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    {r.status === 'requested' && (
                      <>
                        <button
                          onClick={() => handleAction(r.id, approveReturn, 'approved')}
                          disabled={acting === r.id}
                          className="text-yellow-400 hover:text-yellow-300 text-xs transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleAction(r.id, rejectReturn, 'rejected')}
                          disabled={acting === r.id}
                          className="text-red-400 hover:text-red-300 text-xs transition-colors"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {r.status === 'approved' && (
                      <button
                        onClick={() => handleAction(r.id, restockReturn, 'restocked')}
                        disabled={acting === r.id}
                        className="text-blue-400 hover:text-blue-300 text-xs transition-colors"
                      >
                        Restock
                      </button>
                    )}
                    {r.status === 'restocked' && (
                      <button
                        onClick={() => handleAction(r.id, refundReturn, 'refunded')}
                        disabled={acting === r.id}
                        className="text-green-400 hover:text-green-300 text-xs transition-colors"
                      >
                        Refund
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
          <p className="text-gray-500 text-sm">Page {pagination.page} of {pagination.total_pages}</p>
          <div className="flex gap-2 w-full sm:w-auto">
            <button onClick={() => setPage(p => p - 1)} disabled={!pagination.has_prev}
              className="flex-1 sm:flex-none px-3 py-1.5 text-sm bg-gray-800 text-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-700 transition-colors">
              Previous
            </button>
            <button onClick={() => setPage(p => p + 1)} disabled={!pagination.has_next}
              className="flex-1 sm:flex-none px-3 py-1.5 text-sm bg-gray-800 text-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-700 transition-colors">
              Next
            </button>
          </div>
        </div>
      )}

      {/* Create Return Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-white font-semibold text-lg mb-5">New Return Request</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Order</label>
                <select
                  value={form.order_id}
                  onChange={(e) => setForm(f => ({ ...f, order_id: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select order...</option>
                  {orders.length === 0 ? (
                    <option disabled>No orders available</option>
                  ) : (
                    orders.map(o => (
                      <option key={o.id} value={o.id}>
                        #{o.id} — {o.customer_name} — ${parseFloat(o.total_amount || 0).toFixed(2)} — {o.status}
                      </option>
                    ))
                  )}
                </select>
                {orders.length === 0 && (
                  <p className="text-yellow-400 text-xs mt-1">No orders found. Create an order first.</p>
                )}
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-1">Reason</label>
                <input
                  type="text"
                  value={form.reason}
                  onChange={(e) => setForm(f => ({ ...f, reason: e.target.value }))}
                  placeholder="e.g. Item arrived damaged"
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-gray-400 text-sm">Items to Return</label>
                  <button onClick={addItem} className="text-blue-400 hover:text-blue-300 text-xs">
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
                          <option key={p.id} value={p.id}>{p.name}</option>
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
                onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg py-2 text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white rounded-lg py-2 text-sm transition-colors"
              >
                {saving ? 'Submitting...' : 'Submit Return'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}