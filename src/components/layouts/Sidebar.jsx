import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Sheet, SheetContent } from '../ui/sheet';
import { Button } from '../ui/button';

const allLinks = [
  { to: '/dashboard',  label: 'Dashboard', icon: '▦', roles: ['admin', 'staff', 'viewer'] },
  { to: '/orders',     label: 'Orders',    icon: '◈', roles: ['admin', 'staff'] },
  { to: '/products',   label: 'Products',  icon: '◉', roles: ['admin', 'staff'] },
  { to: '/inventory',  label: 'Inventory', icon: '◧', roles: ['admin', 'staff'] },
  { to: '/customers',  label: 'Customers', icon: '◎', roles: ['admin', 'staff'] },
  { to: '/invoices',   label: 'Invoices',  icon: '◪', roles: ['admin', 'staff'] },
  { to: '/returns',    label: 'Returns',   icon: '↩', roles: ['admin', 'staff'] },
  { to: '/reports',    label: 'Reports',   icon: '◈', roles: ['admin', 'staff', 'viewer'] },
  { to: '/users',      label: 'Users',     icon: '◉', roles: ['admin'] },
];

function SidebarContent({ onNavigate }) {
  const { logout: logoutUser, user } = useAuth();
  const navigate = useNavigate();
  const links = allLinks.filter(link => link.roles.includes(user?.role));

  const handleLogout = async () => {
    logoutUser();
    toast.success('Logged out');
    navigate('/login');
  };

  const handleNavClick = (to) => {
    if (onNavigate) onNavigate();
  };

  return (
    <>
      <div className="px-6 py-5 border-b border-gray-800">
        <h1 className="text-white font-bold text-lg tracking-tight">Tradeflow</h1>
        <p className="text-gray-500 text-xs mt-0.5">O2C Management</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            onClick={() => handleNavClick(link.to)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`
            }
          >
            <span className="text-base">{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-gray-800">
        <p className="text-gray-400 text-xs truncate mb-2">{user?.email}</p>
        <button
          onClick={handleLogout}
          className="w-full text-left text-sm text-gray-400 hover:text-red-400 transition-colors px-2 py-1"
        >
          Sign out
        </button>
      </div>
    </>
  );
}

export default function Sidebar({ open, onOpenChange }) {
  // Desktop sidebar (always visible on large screens)
  if (!onOpenChange) {
    return (
      <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col min-h-screen">
        <SidebarContent />
      </aside>
    );
  }

  // Mobile sidebar (sheet/drawer)
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {open && (
        <SheetContent side="left" className="w-64 p-0 flex flex-col">
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800">
            <div>
              <h1 className="text-white font-bold text-lg tracking-tight">Tradeflow</h1>
              <p className="text-gray-500 text-xs mt-0.5">O2C Management</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="text-gray-400 hover:text-white"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </Button>
          </div>
          <SidebarContent onNavigate={() => onOpenChange(false)} />
        </SheetContent>
      )}
    </Sheet>
  );
}