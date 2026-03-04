import { useEffect, useState, useCallback} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getOrder, confirmOrder, shipOrder, invoiceOrder, cancelOrder } from '../api/orders';

const STATUS_COLORS = {
  pending:   'bg-gray-500/20 text-gray-400',
  confirmed: 'bg-yellow-500/20 text-yellow-400',
  shipped:   'bg-purple-500/20 text-purple-400',
  invoiced:  'bg-blue-500/20 text-blue-400',
  paid:      'bg-green-500/20 text-green-400',
  cancelled: 'bg-red-500/20 text-red-400',
};

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [dueDays, setDueDays] = useState(30);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getOrder(id);
      setOrder(res.data.data);
    } catch (error) {
      console.error('Load error:', error);
      toast.error('Failed to load order');
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    load();
  }, [load]);

  const handleConfirm = async () => {
    if (!confirm('Confirm this order?')) return;
    setActionLoading(true);
    try {
      await confirmOrder(id);
      toast.success('Order confirmed');
      load();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to confirm order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleShip = async () => {
    if (!confirm('Mark this order as shipped?')) return;
    setActionLoading(true);
    try {
      await shipOrder(id);
      toast.success('Order marked as shipped');
      load();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to ship order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleInvoice = async () => {
    setActionLoading(true);
    try {
      await invoiceOrder(id, { due_days: dueDays });
      toast.success('Invoice generated');
      setShowInvoiceModal(false);
      load();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to generate invoice');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Cancel this order? This cannot be undone.')) return;
    setActionLoading(true);
    try {
      await cancelOrder(id);
      toast.success('Order cancelled');
      load();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to cancel order');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-500 py-20">Loading order...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-500 py-20">Order not found</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/orders')}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ← Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Order #{order.id}</h1>
            <p className="text-gray-400 text-sm mt-1">
              Created {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString()}
            </p>
          </div>
        </div>
        <span className={`text-sm px-3 py-1.5 rounded-full ${STATUS_COLORS[order.status]}`}>
          {order.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-white font-semibold mb-4">Order Items</h2>
            <div className="space-y-3">
              {order.items?.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0">
                  <div className="flex-1">
                    <p className="text-white font-medium">{item.product_name}</p>
                    <p className="text-gray-500 text-xs font-mono mt-1">SKU: {item.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400 text-sm">
                      {item.quantity} × ${parseFloat(item.unit_price).toFixed(2)}
                    </p>
                    <p className="text-white font-semibold">
                      ${(parseFloat(item.unit_price) * parseInt(item.quantity)).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-800 flex justify-between items-center">
              <span className="text-gray-400">Total Amount</span>
              <span className="text-white text-xl font-bold">
                ${parseFloat(order.total_amount).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="text-white font-semibold mb-3">Notes</h2>
              <p className="text-gray-400 text-sm">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-white font-semibold mb-4">Customer</h2>
            <div className="space-y-2">
              <p className="text-white">{order.customer_name}</p>
              <p className="text-gray-400 text-sm">{order.customer_email}</p>
              {order.customer_phone && (
                <p className="text-gray-400 text-sm">{order.customer_phone}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-white font-semibold mb-4">Actions</h2>
            <div className="space-y-2">
              {order.status === 'pending' && (
                <>
                  <button
                    onClick={handleConfirm}
                    disabled={actionLoading}
                    className="w-full bg-yellow-600 hover:bg-yellow-500 disabled:bg-yellow-800 text-white rounded-lg py-2 text-sm transition-colors"
                  >
                    Confirm Order
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={actionLoading}
                    className="w-full bg-red-600 hover:bg-red-500 disabled:bg-red-800 text-white rounded-lg py-2 text-sm transition-colors"
                  >
                    Cancel Order
                  </button>
                </>
              )}
              {order.status === 'confirmed' && (
                <>
                  <button
                    onClick={handleShip}
                    disabled={actionLoading}
                    className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 text-white rounded-lg py-2 text-sm transition-colors"
                  >
                    Mark as Shipped
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={actionLoading}
                    className="w-full bg-red-600 hover:bg-red-500 disabled:bg-red-800 text-white rounded-lg py-2 text-sm transition-colors"
                  >
                    Cancel Order
                  </button>
                </>
              )}
              {order.status === 'shipped' && (
                <button
                  onClick={() => setShowInvoiceModal(true)}
                  disabled={actionLoading}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white rounded-lg py-2 text-sm transition-colors"
                >
                  Generate Invoice
                </button>
              )}
              {order.status === 'invoiced' && (
                <div className="text-center text-gray-400 text-sm py-2">
                  Waiting for payment
                </div>
              )}
              {order.status === 'paid' && (
                <div className="text-center text-green-400 text-sm py-2">
                  Order completed
                </div>
              )}
              {order.status === 'cancelled' && (
                <div className="text-center text-red-400 text-sm py-2">
                  Order cancelled
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-white font-semibold text-lg mb-5">Generate Invoice</h2>
            <div>
              <label className="block text-gray-400 text-sm mb-1">Payment Due (days)</label>
              <input
                type="number"
                min="1"
                value={dueDays}
                onChange={(e) => setDueDays(parseInt(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
              <p className="text-gray-500 text-xs mt-2">
                Invoice will be due on {new Date(Date.now() + dueDays * 24 * 60 * 60 * 1000).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg py-2 text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleInvoice}
                disabled={actionLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white rounded-lg py-2 text-sm transition-colors"
              >
                {actionLoading ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
