import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Info, Download, ArrowUpRight } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
      case '/dashboard':
        return 'Dashboard';
      case '/land-legal':
        return 'Land & Legal';
      case '/ai-search':
        return 'AI Search';
      default:
        return 'Land & Legal';
    }
  };

  const handleInstallApp = () => {
    showToast('Application is ready for offline PWA installation.');
  };

  const handleSignOut = async () => {
    try {
      await api.signOut();
      showToast('Signed out successfully.');
      navigate('/dashboard');
    } catch (e) {
      showToast('Signed out.');
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Land & Legal', path: '/land-legal' },
    { name: 'AI Search', path: '/ai-search' },
  ];

  return (
    <div className="min-h-screen flex bg-[#fafafa]">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-zinc-200/80 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div className="p-6">
          {/* Logo & Identity */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#c29a6b] flex items-center justify-center shadow-sm">
                <svg
                  viewBox="0 0 100 100"
                  className="w-5 h-5 text-white stroke-current fill-none"
                  strokeWidth="6"
                  strokeLinejoin="round"
                >
                  <path d="M 50 20 L 78 36 L 78 68 L 50 84 L 22 68 L 22 36 Z" />
                  <path d="M 50 52 L 50 84 M 50 52 L 78 36 M 50 52 L 22 36" />
                  <circle cx="50" cy="52" r="7" strokeWidth="4" />
                </svg>
              </div>
              <span className="font-bold text-zinc-900 tracking-tight text-base">
                Properties
              </span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 text-zinc-400 hover:text-zinc-600 rounded-md"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const isActive =
                item.path === '/dashboard'
                  ? location.pathname === '/' || location.pathname === '/dashboard'
                  : location.pathname.startsWith(item.path);

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`block px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[#18181b] text-white shadow-sm'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/70'
                  }`}
                >
                  {item.name}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Authenticated User Profile */}
        <div className="p-6 border-t border-zinc-100">
          <div className="mb-2">
            <h4 className="text-sm font-semibold text-zinc-900 tracking-tight">
              Advocate
            </h4>
            <p className="text-xs text-zinc-400">Legal Advisor</p>
          </div>
          <button
            onClick={handleSignOut}
            className="text-xs text-zinc-500 hover:text-red-600 transition-colors cursor-pointer font-medium"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Top Application Header */}
        <header className="h-14 bg-white border-b border-zinc-200/80 sticky top-0 z-30 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 -ml-1.5 text-zinc-600 hover:text-zinc-900 rounded-lg lg:hidden"
              aria-label="Toggle Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
              <span className="text-zinc-400">Properties</span>
              <span className="text-zinc-300">/</span>
              <span className="text-zinc-800 font-semibold">{getPageTitle()}</span>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setInfoOpen(true)}
              className="w-8 h-8 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-500 hover:text-zinc-800 hover:border-zinc-300 transition-colors"
              title="System Information"
            >
              <Info className="w-4 h-4" />
            </button>

            <button
              onClick={handleInstallApp}
              className="border border-zinc-300 hover:border-zinc-400 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-800 flex items-center gap-1.5 hover:bg-zinc-50 transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-zinc-600" />
              <span>Install App</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Info Dialog */}
      {infoOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-zinc-200 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-4">
              <h3 className="font-bold text-zinc-900 text-base">Legal Hub</h3>
              <button
                onClick={() => setInfoOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs text-zinc-600 space-y-3 leading-relaxed">
              <p>
                <strong>Land Management & Legal Due Diligence Application</strong> recreates the verified interface for legal audit, document review, and plot plain-language discovery.
              </p>
              <p>
                <strong>Active Advocate:</strong> Legal Advisor
              </p>
              <p>
                <strong>Jurisdiction:</strong> Coimbatore District & Sub-Registrar Offices (Perur, Singanallur, Sulur, Kinathukadavu).
              </p>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setInfoOpen(false)}
                className="px-4 py-2 bg-zinc-900 text-white text-xs font-medium rounded-xl hover:bg-zinc-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
