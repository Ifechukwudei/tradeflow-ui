import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { getCustomers, createCustomer } from '../api/customers';

const EMPTY = { name: '', email: '', phone: '', address: '' };

export default function Customers() {
  const [customers, setCustomers]   = useState([]);
  const [pagination, setPagination] = useState({ total: 0, total_pages: 0, has_next: false, has_prev: false });
  const [page, setPage]             = useState(1);
  const [search, setSearch]         = useState('');
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [form, setForm]             = useState(EMPTY);
  const [saving, setSaving]         = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCustomers({ page, limit: 20, search });
      setCustomers(res.data.data);
      setPagination(res.data.pagination);
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [page, search]) 

  useEffect(() => { load(); },[load]);

  const handleSubmit = async () => {
    if (!form.name || !form.email) return toast.error('Name and email are required');
    setSaving(true);
    try {
      await createCustomer(form);
      toast.success('Customer created!');
      setShowForm(false);
      setForm(EMPTY);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create customer');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Customers</h1>
          <p className="text-gray-400 text-sm mt-1">{pagination.total || 0} total customers</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Add Customer
        </button>
      </div>

      <input
        type="text"
        placeholder="Search by name or email..."
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        className="w-full max-w-sm bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 text-sm mb-6 focus:outline-none focus:border-blue-500"
      />

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left text-gray-400 font-medium px-6 py-3">Name</th>
              <th className="text-left text-gray-400 font-medium px-6 py-3">Email</th>
              <th className="text-left text-gray-400 font-medium px-6 py-3">Phone</th>
              <th className="text-left text-gray-400 font-medium px-6 py-3">Address</th>
              <th className="text-left text-gray-400 font-medium px-6 py-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center text-gray-500 py-10">Loading...</td></tr>
            ) : customers.length === 0 ? (
              <tr><td colSpan={5} className="text-center text-gray-500 py-10">No customers found</td></tr>
            ) : customers.map((c) => (
              <tr key={c.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                <td className="px-6 py-4 text-white font-medium">{c.name}</td>
                <td className="px-6 py-4 text-gray-400">{c.email}</td>
                <td className="px-6 py-4 text-gray-400">{c.phone || '—'}</td>
                <td className="px-6 py-4 text-gray-400 max-w-xs truncate">{c.address || '—'}</td>
                <td className="px-6 py-4 text-gray-500 text-xs">
                  {new Date(c.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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

      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-white font-semibold text-lg mb-5">Add Customer</h2>
            <div className="space-y-4">
              {[
                { label: 'Name', key: 'name', type: 'text' },
                { label: 'Email', key: 'email', type: 'email' },
                { label: 'Phone', key: 'phone', type: 'text' },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label className="block text-gray-400 text-sm mb-1">{label}</label>
                  <input
                    type={type}
                    value={form[key]}
                    onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              ))}
              <div>
                <label className="block text-gray-400 text-sm mb-1">Address</label>
                <textarea
                  value={form.address}
                  onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                  rows={2}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowForm(false); setForm(EMPTY); }}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg py-2 text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white rounded-lg py-2 text-sm transition-colors"
              >
                {saving ? 'Saving...' : 'Create Customer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}