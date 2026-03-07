import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/layouts/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Inventory from './pages/inventory';
import Customers from './pages/Customers';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Invoices from './pages/Invoices';
import Returns from './pages/Returns';
import Reports from './pages/Reports';
import Users from './pages/Users';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard/>} />
        <Route path="orders" element={<Orders/>} />
        <Route path="orders/:id" element={<OrderDetail/>} />
        <Route path="products" element={<Products/>} />
        <Route path="inventory" element={<Inventory/>} />
        <Route path="customers" element={<Customers/>} />
        <Route path="invoices" element={<Invoices/>} />
        <Route path="returns" element={<Returns/>} />
        <Route path="reports" element={<Reports/>} />
         <Route path="users" element={<Users/>} />
      </Route>
    </Routes>
  );
}