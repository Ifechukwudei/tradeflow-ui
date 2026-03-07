import { useEffect, useState, useCallback} from 'react';
import toast from 'react-hot-toast';
import { getInvoices, recordPayment } from '../api/invoices';

const STATUS_COLORS = {
  unpaid:  'bg-red-500/20 text-red-400',
  partial: 'bg-yellow-500/20 text-yellow-400',
  paid:    'bg-green-500/20 text-green-400',
};

export default function Invoices() {
  const [invoices, setInvoices]     = useState([]);
  const [pagination, setPagination] = useState({ total: 0, total_pages: 0, has_next: false, has_prev: false });
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(true);
  const [paying, setPaying]         = useState(null);
  const [form, setForm]             = useState({ amount: '', payment_method: 'bank_transfer', reference: '', notes: '' });
  const [saving, setSaving]         = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getInvoices({ page, limit: 20 });
      setInvoices(res.data.data);
      setPagination(res.data.data.pagination || {});
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  },[page]) 

  useEffect(() => { load(); }, [load]);

  const handlePayment = async () => {
    if (!form.amount) return toast.error('Amount is required');
    setSaving(true);
    try {
      await recordPayment(paying.id, {
        amount: parseFloat(form.amount),
        payment_method: form.payment_method,
        reference: form.reference,
        notes: form.notes,
      });
      toast.success('Payment recorded!');
      setPaying(null);
      setForm({ amount: '', payment_method: 'bank_transfer', reference: '', notes: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to record payment');
    } finally {
      setSaving(false);
    }
  };

  const fmt = (n) => `$${parseFloat(n || 0).toFixed(2)}`;
  const outstanding = (inv) => parseFloat(inv.amount_due) - parseFloat(inv.amount_paid);

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-white">Invoices</h1>
        <p className="text-gray-400 text-sm mt-1">{pagination.total || 0} total invoices</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
        <table className="w-full text-sm min-w-[768px]">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left text-gray-400 font-medium px-6 py-3">Invoice #</th>
              <th className="text-left text-gray-400 font-medium px-6 py-3">Order</th>
              <th className="text-left text-gray-400 font-medium px-6 py-3">Amount Due</th>
              <th className="text-left text-gray-400 font-medium px-6 py-3">Paid</th>
              <th className="text-left text-gray-400 font-medium px-6 py-3">Outstanding</th>
              <th className="text-left text-gray-400 font-medium px-6 py-3">Due Date</th>
              <th className="text-left text-gray-400 font-medium px-6 py-3">Status</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center text-gray-500 py-10">Loading...</td></tr>
            ) : invoices.length === 0 ? (
              <tr><td colSpan={8} className="text-center text-gray-500 py-10">No invoices yet</td></tr>
            ) : invoices.map((inv) => (
              <tr key={inv.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                <td className="px-6 py-4 text-white font-mono text-xs">{inv.invoice_number}</td>
                <td className="px-6 py-4 text-gray-400 font-mono">#{inv.order_id}</td>
                <td className="px-6 py-4 text-gray-300">{fmt(inv.amount_due)}</td>
                <td className="px-6 py-4 text-green-400">{fmt(inv.amount_paid)}</td>
                <td className="px-6 py-4 text-white font-medium">{fmt(outstanding(inv))}</td>
                <td className="px-6 py-4 text-gray-400 text-xs">{new Date(inv.due_date).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[inv.status]}`}>
                    {inv.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {inv.status !== 'paid' && (
                    <button
                      onClick={() => { setPaying(inv); setForm(f => ({ ...f, amount: outstanding(inv).toFixed(2) })); }}
                      className="text-blue-400 hover:text-blue-300 text-xs transition-colors"
                    >
                      Record Payment
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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

      {/* Payment Modal */}
      {paying && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-white font-semibold text-lg mb-1">Record Payment</h2>
            <p className="text-gray-400 text-sm mb-5">{paying.invoice_number}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Amount</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Payment Method</label>
                <select
                  value={form.payment_method}
                  onChange={(e) => setForm(f => ({ ...f, payment_method: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="cash">Cash</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Reference</label>
                <input
                  type="text"
                  value={form.reference}
                  onChange={(e) => setForm(f => ({ ...f, reference: e.target.value }))}
                  placeholder="e.g. TXN-001"
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Notes</label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setPaying(null)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg py-2 text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePayment}
                disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white rounded-lg py-2 text-sm transition-colors"
              >
                {saving ? 'Saving...' : 'Record Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}