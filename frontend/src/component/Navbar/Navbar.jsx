import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  BookOpen,
  CreditCard,
  Send,
  MessageSquare,
  CircleUser,
  LogOut,
  Users,
  PlusCircle,
  Wallet,
  ShieldCheck,
  Clock,
  BarChart3,
  BookText,
} from 'lucide-react';
import "./Navbar.css"

const MENUS = {
  merchant: {
    subtitle: 'Merchant portal',
    items: [
      { to: '/merchant/dashboard', label: 'Dashboard', icon: LayoutGrid, end: true },
      { to: '/merchant/ledger', label: 'My Ledger', icon: BookOpen },
      { to: '/merchant/payments', label: 'My Payments', icon: CreditCard },
      { to: '/merchant/submit-payment', label: 'Submit Payment', icon: Send },
      { to: '/merchant/chat', label: 'Chat', icon: MessageSquare, badgeKey: 'chat' },
      { to: '/merchant/account', label: 'My Account', icon: CircleUser },
    ],
  },
  storeman: {
    subtitle: 'Storeman console',
    items: [
      { to: '/storeman/dashboard', label: 'Dashboard', icon: LayoutGrid, end: true },
      { to: '/storeman/merchants', label: 'Merchants', icon: Users },
      { to: '/storeman/add-credit', label: 'Add Credit Entry', icon: PlusCircle },
      { to: '/storeman/ledger', label: 'Customer Ledger', icon: BookOpen },
      { to: '/storeman/record-payment', label: 'Record Payment', icon: Wallet },
      { to: '/storeman/payment-verification', label: 'Payment Verification', icon: ShieldCheck },
      { to: '/storeman/chat', label: 'Chat', icon: MessageSquare, badgeKey: 'chat' },
      { to: '/storeman/dues', label: 'Outstanding Dues', icon: Clock },
      { to: '/storeman/reports', label: 'Reports', icon: BarChart3 },
    ],
  },
};

// Treat "admin" as the same console so either role name works.
MENUS.admin = MENUS.storeman;

/**
 * Sidebar navigation.
 *
 * Props
 *  - role:     'merchant' | 'storeman' ('admin' works as an alias). Picks which menu
 *              to show. Defaults to 'merchant'.
 *  - badges:   { chat: number } unread counts keyed by item badgeKey.
 *  - onLogout: called when "Logout" is clicked.
 */
function Navbar({ role = 'storeman', badges = {} }) {
  const menu = MENUS[role] ?? MENUS.merchant;

  const navigate = useNavigate()

  const onLogout = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/logout`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json"
          }
        }
      )
      const data = response.json()
      if (response.status === 200) {
        // Clear frontend authentication state
        navigate("/");
      }
      console.log(data.message);
    } catch (err) {
      console.log("Invalid acces token", err)
    }
  }

  return (
    <aside className="nb" aria-label="Main navigation">
      <div className="nb-brand">
        <div className="nb-logo" aria-hidden="true">
          <BookText size={22} strokeWidth={2} />
        </div>
        <div className="nb-brand-text">
          <span className="nb-title">KhataBook Wholesale</span>
          <span className="nb-subtitle">{menu.subtitle}</span>
        </div>
      </div>

      <nav className="nb-nav">
        {menu.items.map(({ to, label, icon: Icon, end, badgeKey }) => {
          const count = badgeKey ? badges[badgeKey] ?? 0 : 0;
          return (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `nb-link${isActive ? ' is-active' : ''}`}
            >
              <Icon size={20} strokeWidth={1.75} className="nb-icon" aria-hidden="true" />
              <span className="nb-label">{label}</span>
              {count > 0 && (
                <span className="nb-badge" aria-label={`${count} unread`}>
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="nb-footer">
        <button type="button" className="nb-link nb-logout" onClick={onLogout}>
          <LogOut size={20} strokeWidth={1.75} className="nb-icon" aria-hidden="true" />
          <span className="nb-label">Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default Navbar