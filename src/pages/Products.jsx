import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getProducts, createProduct, deleteProduct } from '../api/products';

const EMPTY = { name: '', sku: '', description: '', unit_price: '', initial_stock: '', reorder_point: '' };

export default function Products() {
  const [products, setProducts]   = useState([]);
const [pagination, setPagination] = useState({ total: 0, total_pages: 0, has_next: false, has_prev: false });
  const [page, setPage]           = useState(1);
  const [search, setSearch]       = useState('');
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState(EMPTY);
  const [saving, setSaving]       = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await getProducts({ page, limit: 20, search });
        setProducts(res.data.data.data || []);
        setPagination(res.data.data.pagination || {});
      } catch (err) {
        console.error('Load error:', err);
        toast.error('Failed to load products');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [page, search]);

  const handleSubmit = async () => {
    if (!form.name || !form.sku || !form.unit_price) {
      toast.error('Name, SKU and price are required');
      return;
    }
    setSaving(true);
    try {
      await createProduct(form);
      toast.success('Product created!');
      setShowForm(false);
      setForm(EMPTY);
      setPage(1);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      await deleteProduct(id);
      toast.success('Product deleted');
      setPage(1);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete product');
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Products</h1>
          <p className="text-gray-400 text-sm mt-1">{pagination?.total || 0} total products</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Add Product
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search by name or SKU..."
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        className="w-full max-w-sm bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 text-sm mb-6 focus:outline-none focus:border-blue-500"
      />

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left text-gray-400 font-medium px-6 py-3">Name</th>
              <th className="text-left text-gray-400 font-medium px-6 py-3">SKU</th>
              <th className="text-left text-gray-400 font-medium px-6 py-3">Price</th>
              <th className="text-left text-gray-400 font-medium px-6 py-3">On Hand</th>
              <th className="text-left text-gray-400 font-medium px-6 py-3">Available</th>
              <th className="text-left text-gray-400 font-medium px-6 py-3">Status</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center text-gray-500 py-10">Loading...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={7} className="text-center text-gray-500 py-10">No products found</td></tr>
            ) : (products || []).map((p) => (
              <tr key={p.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                <td className="px-6 py-4 text-white font-medium">{p.name}</td>
                <td className="px-6 py-4 text-gray-400 font-mono text-xs">{p.sku}</td>
                <td className="px-6 py-4 text-gray-300">${parseFloat(p.unit_price).toFixed(2)}</td>
                <td className="px-6 py-4 text-gray-300">{p.qty_on_hand}</td>
                <td className="px-6 py-4 text-gray-300">{p.qty_available}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    p.qty_available === 0      ? 'bg-red-500/20 text-red-400' :
                    p.qty_available <= p.reorder_point ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>
                    {p.qty_available === 0 ? 'Out of stock' :
                     p.qty_available <= p.reorder_point ? 'Low stock' : 'In stock'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="text-gray-500 hover:text-red-400 transition-colors text-xs"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination?.total_pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-gray-500 text-sm">
            Page {pagination?.page} of {pagination?.total_pages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => p - 1)}
              disabled={!pagination?.has_prev}
              className="px-3 py-1.5 text-sm bg-gray-800 text-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-700 transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={!pagination?.has_next}
              className="px-3 py-1.5 text-sm bg-gray-800 text-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-700 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-white font-semibold text-lg mb-5">Add Product</h2>
            <div className="space-y-4">
              {[
                { label: 'Name', key: 'name', type: 'text' },
                { label: 'SKU', key: 'sku', type: 'text' },
                { label: 'Unit Price', key: 'unit_price', type: 'number' },
                { label: 'Initial Stock', key: 'initial_stock', type: 'number' },
                { label: 'Reorder Point', key: 'reorder_point', type: 'number' },
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
                <label className="block text-gray-400 text-sm mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
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
                {saving ? 'Saving...' : 'Create Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
