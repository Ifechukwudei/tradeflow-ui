import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { getInventory, getLowStock, adjustStock, getHistory } from '../api/inventory';

export default function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, total_pages: 0, has_next: false, has_prev: false });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [adjustForm, setAdjustForm] = useState({ quantity: '', reason: '', type: 'adjustment' });
  const [history, setHistory] = useState([]);
  const [saving, setSaving] = useState(false);
  const [showLowStock, setShowLowStock] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = showLowStock 
        ? await getLowStock()
        : await getInventory({ page, limit: 20, search });
      setInventory(res.data.data.data || []);
      setPagination(res.data.data.pagination || {});
    } catch (error) {
      console.error('Load error:', error);
      toast.error('Failed to load inventory');
      setInventory([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, showLowStock]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdjust = async () => {
    if (!adjustForm.quantity || !adjustForm.reason) {
      toast.error('Quantity and reason are required');
      return;
    }
    setSaving(true);
    try {
      await adjustStock(selectedProduct.product_id, adjustForm);
      toast.success('Stock adjusted successfully');
      setShowAdjustModal(false);
      setAdjustForm({ quantity: '', reason: '', type: 'adjustment' });
      setSelectedProduct(null);
      load();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to adjust stock');
    } finally {
      setSaving(false);
    }
  };

  const handleViewHistory = async (product) => {
    setSelectedProduct(product);
    setShowHistoryModal(true);
    try {
      const res = await getHistory(product.product_id);
      setHistory(res.data.data || []);
    } catch (error) {
      console.error('History error:', error);
      toast.error('Failed to load history');
      setHistory([]);
    }
  };

  const openAdjustModal = (product) => {
    setSelectedProduct(product);
    setShowAdjustModal(true);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Inventory Management</h1>
          <p className="text-gray-400 text-sm mt-1">{pagination?.total || 0} total items</p>
        </div>
        <button
          onClick={() => setShowLowStock(!showLowStock)}
          className={`${
            showLowStock ? 'bg-yellow-600 hover:bg-yellow-500' : 'bg-gray-700 hover:bg-gray-600'
          } text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors`}
        >
          {showLowStock ? 'Show All' : 'Show Low Stock'}
        </button>
      </div>

      {/* Search */}
      {!showLowStock && (
        <input
          type="text"
          placeholder="Search by product name or SKU..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full max-w-sm bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 text-sm mb-6 focus:outline-none focus:border-blue-500"
        />
      )}

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left text-gray-400 font-medium px-6 py-3">Product</th>
              <th className="text-left text-gray-400 font-medium px-6 py-3">SKU</th>
              <th className="text-left text-gray-400 font-medium px-6 py-3">On Hand</th>
              <th className="text-left text-gray-400 font-medium px-6 py-3">Reserved</th>
              <th className="text-left text-gray-400 font-medium px-6 py-3">Available</th>
              <th className="text-left text-gray-400 font-medium px-6 py-3">Reorder Point</th>
              <th className="text-left text-gray-400 font-medium px-6 py-3">Status</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center text-gray-500 py-10">Loading...</td></tr>
            ) : inventory.length === 0 ? (
              <tr><td colSpan={8} className="text-center text-gray-500 py-10">No inventory found</td></tr>
            ) : (inventory || []).map((item) => (
              <tr key={item.product_id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                <td className="px-6 py-4 text-white font-medium">{item.name}</td>
                <td className="px-6 py-4 text-gray-400 font-mono text-xs">{item.sku}</td>
                <td className="px-6 py-4 text-gray-300">{item.qty_on_hand}</td>
                <td className="px-6 py-4 text-gray-300">{item.qty_reserved}</td>
                <td className="px-6 py-4 text-gray-300 font-semibold">{item.qty_available}</td>
                <td className="px-6 py-4 text-gray-400">{item.reorder_point}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    item.qty_available === 0 ? 'bg-red-500/20 text-red-400' :
                    item.qty_available <= item.reorder_point ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>
                    {item.qty_available === 0 ? 'Out of stock' :
                     item.qty_available <= item.reorder_point ? 'Low stock' : 'In stock'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => openAdjustModal(item)}
                      className="text-blue-400 hover:text-blue-300 transition-colors text-xs"
                    >
                      Adjust
                    </button>
                    <button
                      onClick={() => handleViewHistory(item)}
                      className="text-gray-500 hover:text-gray-400 transition-colors text-xs"
                    >
                      History
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!showLowStock && pagination?.total_pages > 1 && (
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

      {/* Adjust Stock Modal */}
      {showAdjustModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-white font-semibold text-lg mb-2">Adjust Stock</h2>
            <p className="text-gray-400 text-sm mb-5">
              {selectedProduct.product_name} - Current: {selectedProduct.qty_on_hand}
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Adjustment Type</label>
                <select
                  value={adjustForm.type}
                  onChange={(e) => setAdjustForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="adjustment">Adjustment</option>
                  <option value="damage">Damage</option>
                  <option value="loss">Loss</option>
                  <option value="found">Found</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Quantity (use negative for decrease)</label>
                <input
                  type="number"
                  value={adjustForm.quantity}
                  onChange={(e) => setAdjustForm(f => ({ ...f, quantity: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                  placeholder="e.g., 10 or -5"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Reason</label>
                <textarea
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm(f => ({ ...f, reason: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                  rows={3}
                  placeholder="Explain the reason for this adjustment..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAdjustModal(false);
                  setAdjustForm({ quantity: '', reason: '', type: 'adjustment' });
                  setSelectedProduct(null);
                }}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg py-2 text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAdjust}
                disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white rounded-lg py-2 text-sm transition-colors"
              >
                {saving ? 'Saving...' : 'Adjust Stock'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-3xl max-h-[80vh] overflow-y-auto">
            <h2 className="text-white font-semibold text-lg mb-2">Stock History</h2>
            <p className="text-gray-400 text-sm mb-5">{selectedProduct.product_name}</p>
            
            {history.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No history available</p>
            ) : (
              <div className="space-y-3">
                {history.map((h, idx) => (
                  <div key={idx} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-sm font-semibold ${
                            h.quantity_change > 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {h.quantity_change > 0 ? '+' : ''}{h.quantity_change}
                          </span>
                          <span className="text-xs text-gray-500">•</span>
                          <span className="text-xs text-gray-400 uppercase">{h.transaction_type}</span>
                        </div>
                        {h.reason && (
                          <p className="text-sm text-gray-400">{h.reason}</p>
                        )}
                        {h.reference_id && (
                          <p className="text-xs text-gray-500 mt-1">Ref: {h.reference_id}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {new Date(h.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-600">
                          {new Date(h.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <button
              onClick={() => {
                setShowHistoryModal(false);
                setSelectedProduct(null);
                setHistory([]);
              }}
              className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg py-2 text-sm transition-colors mt-6"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
