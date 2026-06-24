import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Brand from './Brand.jsx';

function NavLink({ to, children }) {
  const { pathname } = useLocation();
  const active = pathname === to;
  return (
    <Link
      to={to}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
        active
          ? 'bg-beacon/15 text-beacon border border-beacon/30'
          : 'text-mut hover:text-fg hover:bg-panel2'
      }`}
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {children}
    </Link>
  );
}

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-full">
      {/* Top coral accent bar */}
      <div className="h-0.5 bg-gradient-to-r from-beacon via-beacon/60 to-transparent" />

      <header className="sticky top-0 z-10 border-b border-line bg-ink/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-8">
            <Link to="/">
              <Brand />
            </Link>
            <nav className="hidden items-center gap-1 sm:flex">
              <NavLink to="/">Dashboard</NavLink>
              <NavLink to="/alerts/new">Create alert</NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden font-mono text-xs text-mut/70 md:inline">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="btn-ghost px-3 py-1.5 text-sm"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>

      <footer className="border-t border-line mt-8">
        <div className="mx-auto max-w-6xl px-5 py-4 flex items-center justify-between">
          <span className="text-xs text-mut/50">© {new Date().getFullYear()} Kobie Marketing. All rights reserved.</span>
          <span className="text-xs text-mut/50 font-mono">GitOps · PrometheusRule · AlertPortal</span>
        </div>
      </footer>
    </div>
  );
}
