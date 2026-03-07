/* eslint-disable no-unused-vars */
import { useEffect, useState } from 'react';
import { getRevenue, getOrdersSummary, getPaymentsSummary, getInventoryStatus } from '../api/reports';
import { getLowStock } from '../api/inventory';

const StatCard = ({ label, value, sub, color = 'blue' }) => {
  const colors = {
    blue:   'border-blue-500/30 bg-blue-500/5',
    green:  'border-green-500/30 bg-green-500/5',
    yellow: 'border-yellow-500/30 bg-yellow-500/5',
    red:    'border-red-500/30 bg-red-500/5',
  };
  return (
    <div className={`border rounded-xl p-5 ${colors[color]}`}>
      <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">{label}</p>
      <p className="text-white text-2xl font-bold">{value}</p>
      {sub && <p className="text-gray-500 text-xs mt-1">{sub}</p>}
    </div>
  );
};

export default function Dashboard() {
  const [revenue, setRevenue]     = useState(null);
  const [orders, setOrders]       = useState([]);
  const [payments, setPayments]   = useState(null);
  const [lowStock, setLowStock]   = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [r, o, p, l] = await Promise.all([
          getRevenue(),
          getOrdersSummary(),
          getPaymentsSummary(),
          getLowStock(),
        ]);
        setRevenue(r.data.data);
        setOrders(o.data.data);
        setPayments(p.data.data);
        setLowStock(l.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const fmt = (n) => `$${parseFloat(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  if (loading) return (
    <div className="p-8 text-gray-400">Loading...</div>
  );



  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl md:text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">Business overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        <StatCard
          label="Total Revenue"
          value={fmt(revenue?.total_revenue)}
          sub={`${revenue?.total_orders} orders`}
          color="blue"
        />
        <StatCard
          label="Collected"
          value={fmt(payments?.total_collected)}
          sub={`${payments?.paid_invoices} paid invoices`}
          color="green"
        />
        <StatCard
          label="Outstanding"
          value={fmt(payments?.total_outstanding)}
          sub={`${payments?.unpaid_invoices} unpaid invoices`}
          color="yellow"
        />
        <StatCard
          label="Low Stock Items"
          value={lowStock.length}
          sub="Need restocking"
          color="red"
        />
      </div>

      {/* Order Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4">Order Pipeline</h2>
          <div className="space-y-3">
            {orders.length === 0 && (
              <p className="text-gray-500 text-sm">No orders yet</p>
            )}
            {orders.map((o) => (
              <div key={o.status} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${
                    o.status === 'paid'      ? 'bg-green-500' :
                    o.status === 'invoiced'  ? 'bg-blue-500'  :
                    o.status === 'shipped'   ? 'bg-purple-500':
                    o.status === 'confirmed' ? 'bg-yellow-500':
                    o.status === 'cancelled' ? 'bg-red-500'   :
                    'bg-gray-500'
                  }`} />
                  <span className="text-gray-300 text-sm capitalize">{o.status}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-gray-400 text-sm">{o.count} orders</span>
                  <span className="text-white text-sm font-medium">{fmt(o.total_value)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4">Low Stock Alerts</h2>
          {lowStock.length === 0 ? (
            <p className="text-gray-500 text-sm">All stock levels are healthy</p>
          ) : (
            <div className="space-y-3">
              {lowStock.slice(0, 6).map((item) => (
                <div key={item.product_id} className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-300 text-sm">{item.name}</p>
                    <p className="text-gray-500 text-xs">{item.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-red-400 text-sm font-medium">{item.qty_available} left</p>
                    <p className="text-gray-500 text-xs">reorder at {item.reorder_point}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}