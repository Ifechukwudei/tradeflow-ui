import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  getRevenue, 
  getOrdersSummary, 
  getTopProducts, 
  getInventoryStatus, 
  getPaymentsSummary 
} from '../api/reports';

// Color palette for charts
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

/**
 * Reports Page Component
 * Displays various business analytics and reports including:
 * - Revenue summary with date filtering
 * - Orders summary by status with pie chart
 * - Top selling products with bar chart
 * - Inventory status with bar chart
 * - Payments summary
 */
export default function Reports() {
  // State for revenue data and date filters
  const [revenue, setRevenue] = useState(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // State for other report sections
  const [ordersSummary, setOrdersSummary] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [inventoryStatus, setInventoryStatus] = useState(null);
  const [paymentsSummary, setPaymentsSummary] = useState(null);
  
  // Loading states for each section
  const [loading, setLoading] = useState({
    revenue: true,
    orders: true,
    products: true,
    inventory: true,
    payments: true,
  });

  /**
   * Load revenue data with optional date filtering
   * Fetches revenue summary from the API
   */
  const loadRevenue = useCallback(async () => {
    setLoading(prev => ({ ...prev, revenue: true }));
    try {
      const params = {};
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;
      
      const res = await getRevenue(params);
      console.log('Revenue response:', res.data);
      setRevenue(res.data.data);
    } catch (error) {
      console.error('Revenue load error:', error);
      toast.error('Failed to load revenue data');
      setRevenue(null);
    } finally {
      setLoading(prev => ({ ...prev, revenue: false }));
    }
  }, [dateFrom, dateTo]);

  /**
   * Load orders summary
   * Fetches count of orders grouped by status
   */
  const loadOrdersSummary = useCallback(async () => {
    setLoading(prev => ({ ...prev, orders: true }));
    try {
      const res = await getOrdersSummary();
      console.log('Orders summary response:', res.data);
      const data = res.data.data || [];
      console.log('Orders summary data:', data);
      setOrdersSummary(data);
    } catch (error) {
      console.error('Orders summary error:', error);
      toast.error('Failed to load orders summary');
      setOrdersSummary(null);
    } finally {
      setLoading(prev => ({ ...prev, orders: false }));
    }
  }, []);

  /**
   * Load top selling products
   * Fetches products sorted by total quantity sold
   */
  const loadTopProducts = useCallback(async () => {
    setLoading(prev => ({ ...prev, products: true }));
    try {
      const res = await getTopProducts({ limit: 10 });
      console.log('Top products response:', res.data);
      const rawData = res.data.data || [];
      console.log('Top products raw data:', rawData);
      
      // Map backend field names to frontend expectations
      const mappedData = rawData.map(product => ({
        ...product,
        product_name: product.name,
        total_quantity: product.total_units_sold,
      }));
      console.log('Top products mapped data:', mappedData);
      setTopProducts(mappedData);
    } catch (error) {
      console.error('Top products error:', error);
      toast.error('Failed to load top products');
      setTopProducts([]);
    } finally {
      setLoading(prev => ({ ...prev, products: false }));
    }
  }, []);

  /**
   * Load inventory status
   * Fetches summary of inventory levels (in stock, low stock, out of stock)
   */
  const loadInventoryStatus = useCallback(async () => {
    setLoading(prev => ({ ...prev, inventory: true }));
    try {
      const res = await getInventoryStatus();
      console.log('Inventory status response:', res.data);
      const items = res.data.data || [];
      console.log('Inventory items:', items);
      
      // Count items by stock status
      const summary = {
        in_stock: items.filter(item => item.stock_status === 'ok').length,
        low_stock: items.filter(item => item.stock_status === 'low_stock').length,
        out_of_stock: items.filter(item => item.stock_status === 'out_of_stock').length,
      };
      console.log('Inventory summary:', summary);
      
      setInventoryStatus(summary);
    } catch (error) {
      console.error('Inventory status error:', error);
      toast.error('Failed to load inventory status');
      setInventoryStatus(null);
    } finally {
      setLoading(prev => ({ ...prev, inventory: false }));
    }
  }, []);

  /**
   * Load payments summary
   * Fetches summary of invoice payments (paid, pending, overdue)
   */
  const loadPaymentsSummary = useCallback(async () => {
    setLoading(prev => ({ ...prev, payments: true }));
    try {
      const res = await getPaymentsSummary();
      console.log('Payments summary response:', res.data);
      const data = res.data.data;
      
      // Map backend field names to frontend expectations
      const summary = {
        total_paid: data.total_collected || 0,
        total_pending: data.total_outstanding || 0,
        total_overdue: 0, // Backend doesn't provide this separately, using outstanding
      };
      console.log('Payments summary mapped:', summary);
      
      setPaymentsSummary(summary);
    } catch (error) {
      console.error('Payments summary error:', error);
      toast.error('Failed to load payments summary');
      setPaymentsSummary(null);
    } finally {
      setLoading(prev => ({ ...prev, payments: false }));
    }
  }, []);

  // Load all reports on component mount
  useEffect(() => {
    loadRevenue();
    loadOrdersSummary();
    loadTopProducts();
    loadInventoryStatus();
    loadPaymentsSummary();
  }, [loadRevenue, loadOrdersSummary, loadTopProducts, loadInventoryStatus, loadPaymentsSummary]);

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Reports & Analytics</h1>
        <p className="text-gray-400 text-sm mt-1">Business insights and performance metrics</p>
      </div>

      {/* Revenue Section */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold text-lg">Revenue Summary</h2>
          <div className="flex gap-2">
            {/* Date range filters */}
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
              placeholder="From"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
              placeholder="To"
            />
            <button
              onClick={loadRevenue}
              className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-1.5 rounded-lg transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
        
        {loading.revenue ? (
          <div className="text-center text-gray-500 py-8">Loading revenue data...</div>
        ) : revenue ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Revenue */}
            <div className="bg-gray-800/50 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">Total Revenue</p>
              <p className="text-white text-2xl font-bold">
                ${parseFloat(revenue.total_revenue || 0).toFixed(2)}
              </p>
            </div>
            {/* Total Orders */}
            <div className="bg-gray-800/50 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">Total Orders</p>
              <p className="text-white text-2xl font-bold">{revenue.total_orders || 0}</p>
            </div>
            {/* Average Order Value */}
            <div className="bg-gray-800/50 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">Average Order Value</p>
              <p className="text-white text-2xl font-bold">
                ${parseFloat(revenue.avg_order_value || 0).toFixed(2)}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">No revenue data available</div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Orders Summary Section with Pie Chart */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-white font-semibold text-lg mb-4">Orders by Status</h2>
          {loading.orders ? (
            <div className="text-center text-gray-500 py-8">Loading...</div>
          ) : ordersSummary && ordersSummary.length > 0 ? (
            <>
              {/* Pie Chart */}
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={ordersSummary.map(item => ({
                      ...item,
                      count: parseInt(item.count) || 0
                    }))}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(entry) => `${entry.status}: ${entry.count}`}
                  >
                    {ordersSummary.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                    labelStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Data Table */}
              <div className="space-y-2 mt-4">
                {ordersSummary.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                      />
                      <span className="text-gray-300 capitalize">{item.status}</span>
                    </div>
                    <span className="text-white font-semibold">{item.count}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center text-gray-500 py-8">No data available</div>
          )}
        </div>

        {/* Inventory Status Section with Bar Chart */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-white font-semibold text-lg mb-4">Inventory Status</h2>
          {loading.inventory ? (
            <div className="text-center text-gray-500 py-8">Loading...</div>
          ) : inventoryStatus ? (
            <>
              {/* Bar Chart */}
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={[
                    { name: 'In Stock', value: inventoryStatus.in_stock || 0, fill: '#10b981' },
                    { name: 'Low Stock', value: inventoryStatus.low_stock || 0, fill: '#f59e0b' },
                    { name: 'Out of Stock', value: inventoryStatus.out_of_stock || 0, fill: '#ef4444' },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="value" />
                </BarChart>
              </ResponsiveContainer>
              {/* Data Summary */}
              <div className="space-y-3 mt-4">
                <div className="flex items-center justify-between py-2 border-b border-gray-800">
                  <span className="text-green-400">In Stock</span>
                  <span className="text-white font-semibold">{inventoryStatus.in_stock || 0}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-800">
                  <span className="text-yellow-400">Low Stock</span>
                  <span className="text-white font-semibold">{inventoryStatus.low_stock || 0}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-red-400">Out of Stock</span>
                  <span className="text-white font-semibold">{inventoryStatus.out_of_stock || 0}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center text-gray-500 py-8">No data available</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products Section with Bar Chart */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-white font-semibold text-lg mb-4">Top Selling Products</h2>
          {loading.products ? (
            <div className="text-center text-gray-500 py-8">Loading...</div>
          ) : topProducts.length > 0 ? (
            <>
              {/* Horizontal Bar Chart */}
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" stroke="#9ca3af" />
                  <YAxis 
                    type="category" 
                    dataKey="product_name" 
                    stroke="#9ca3af" 
                    width={100}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="total_quantity" fill="#3b82f6" name="Quantity Sold" />
                </BarChart>
              </ResponsiveContainer>
              {/* Data Table */}
              <div className="space-y-3 mt-4">
                {topProducts.map((product, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                    <div className="flex-1">
                      <p className="text-white font-medium">{product.product_name}</p>
                      <p className="text-gray-500 text-xs">SKU: {product.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold">{product.total_quantity} sold</p>
                      <p className="text-gray-400 text-sm">
                        ${parseFloat(product.total_revenue || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center text-gray-500 py-8">No products data available</div>
          )}
        </div>

        {/* Payments Summary Section */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-white font-semibold text-lg mb-4">Payments Summary</h2>
          {loading.payments ? (
            <div className="text-center text-gray-500 py-8">Loading...</div>
          ) : paymentsSummary ? (
            <>
              {/* Visual representation with bars */}
              <div className="space-y-4 mb-6">
                {/* Paid */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-green-400">Paid</span>
                    <span className="text-white font-semibold">
                      ${parseFloat(paymentsSummary.total_paid || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ 
                        width: `${Math.min(100, (paymentsSummary.total_paid / (paymentsSummary.total_paid + paymentsSummary.total_pending + paymentsSummary.total_overdue)) * 100)}%` 
                      }}
                    />
                  </div>
                </div>
                {/* Pending */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-yellow-400">Pending</span>
                    <span className="text-white font-semibold">
                      ${parseFloat(paymentsSummary.total_pending || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div 
                      className="bg-yellow-500 h-2 rounded-full" 
                      style={{ 
                        width: `${Math.min(100, (paymentsSummary.total_pending / (paymentsSummary.total_paid + paymentsSummary.total_pending + paymentsSummary.total_overdue)) * 100)}%` 
                      }}
                    />
                  </div>
                </div>
                {/* Overdue */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-red-400">Overdue</span>
                    <span className="text-white font-semibold">
                      ${parseFloat(paymentsSummary.total_overdue || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full" 
                      style={{ 
                        width: `${Math.min(100, (paymentsSummary.total_overdue / (paymentsSummary.total_paid + paymentsSummary.total_pending + paymentsSummary.total_overdue)) * 100)}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
              {/* Summary totals */}
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Amount</span>
                  <span className="text-white text-xl font-bold">
                    ${parseFloat(
                      (paymentsSummary.total_paid || 0) + 
                      (paymentsSummary.total_pending || 0) + 
                      (paymentsSummary.total_overdue || 0)
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center text-gray-500 py-8">No data available</div>
          )}
        </div>
      </div>
    </div>
  );
}
