import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import './merchantdashboard.css'
import {
    LayoutGrid,
    BookOpen,
    BookOpenText,
    CreditCard,
    Send,
    MessageSquare,
    UserCircle,
    LogOut,
    Bell,
    IndianRupee,
    ReceiptText,
    TrendingDown,
    CalendarClock,
} from 'lucide-react'

/* ---------- Mock data: replace with your API response ---------- */
const merchant = {
    name: 'Rajesh Kumar',
    firstName: 'Rajesh',
    store: 'Raj Grocery Store',
    initials: 'RK',
}

const summary = {
    totalCredit: 20000,
    totalPayments: 0,
    outstanding: 20000,
    nextDueDate: '28 Oct 2026',
    nextDueAmount: 20000,
}

const submissions = [
    {
        id: 'PR-1001',
        amount: 12000,
        method: 'UPI',
        reference: 'UPI123456',
        submittedAt: '10 Oct, 12:44 am',
        status: 'Pending Verification',
    },
]

const upcomingDues = [
    {
        id: 1,
        title: 'Monthly stock — rice, dal, oil, sugar',
        dueDate: '28 Oct 2026',
        amount: 20000,
    },
]

const navItems = [
    { to: '/dashboard', label: 'Dashboard', Icon: LayoutGrid },
    { to: '/ledger', label: 'My Ledger', Icon: BookOpen },
    { to: '/payments', label: 'My Payments', Icon: CreditCard, badge: 1 },
    { to: '/submit-payment', label: 'Submit Payment', Icon: Send },
    { to: '/chat', label: 'Chat', Icon: MessageSquare },
    { to: '/account', label: 'My Account', Icon: UserCircle },
]

const formatINR = (value) => '₹' + Number(value).toLocaleString('en-IN')

/* ---------- Small pieces ---------- */
function StatCard({ label, value, hint, Icon, tone }) {
    return (
        <div className="md-card md-stat">
            <div className="md-stat-top">
                <span className="md-stat-label">{label}</span>
                <span className={`md-stat-icon tone-${tone}`}>
                    <Icon size={22} />
                </span>
            </div>
            <div className="md-stat-value">{value}</div>
            {hint && <div className="md-stat-hint">{hint}</div>}
        </div>
    )
}

function MerchantDashboard() {
    const navigate = useNavigate()

    const handleLogout = () => {
        // TODO: call your logout endpoint here, then redirect
        navigate('/')
    }

    return (
        <div className="md-shell">
            {/* ---------- Sidebar ---------- */}
            <aside className="md-sidebar">
                <div className="md-brand">
                    <span className="md-brand-logo">
                        <BookOpenText size={22} />
                    </span>
                    <div className="md-brand-text">
                        <strong>KhataBook Wholesale</strong>
                        <span>Merchant portal</span>
                    </div>
                </div>

                <nav className="md-nav">
                    {navItems.map(({ to, label, Icon, badge }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) => `md-nav-item ${isActive ? 'active' : ''}`}
                        >
                            <Icon size={20} />
                            <span className="md-nav-label">{label}</span>
                            {badge ? <span className="md-nav-badge">{badge}</span> : null}
                        </NavLink>
                    ))}
                </nav>

                <button type="button" className="md-logout" onClick={handleLogout}>
                    <LogOut size={20} />
                    <span className="md-nav-label">Logout</span>
                </button>
            </aside>

            {/* ---------- Main ---------- */}
            <div className="md-main">
                <header className="md-topbar">
                    <button type="button" className="md-icon-btn" aria-label="Notifications">
                        <Bell size={20} />
                    </button>
                    <div className="md-user">
                        <span className="md-avatar">{merchant.initials}</span>
                        <div className="md-user-text">
                            <strong>{merchant.name}</strong>
                            <span>{merchant.store}</span>
                        </div>
                    </div>
                </header>

                <main className="md-content">
                    <div className="md-greeting">
                        <div>
                            <h1>Namaste, {merchant.firstName}</h1>
                            <p>{merchant.store}</p>
                        </div>
                        <button
                            type="button"
                            className="md-primary-btn"
                            onClick={() => navigate('/submit-payment')}
                        >
                            <Send size={18} />
                            Submit Payment
                        </button>
                    </div>

                    <section className="md-stats">
                        <StatCard
                            label="Total Credit Received"
                            value={formatINR(summary.totalCredit)}
                            Icon={ReceiptText}
                            tone="slate"
                        />
                        <StatCard
                            label="Total Payments Made"
                            value={formatINR(summary.totalPayments)}
                            Icon={IndianRupee}
                            tone="green"
                        />
                        <StatCard
                            label="Outstanding Balance"
                            value={formatINR(summary.outstanding)}
                            hint="Pending payments not yet deducted"
                            Icon={TrendingDown}
                            tone="orange"
                        />
                        <StatCard
                            label="Next Payment Due"
                            value={summary.nextDueDate}
                            hint={`${formatINR(summary.nextDueAmount)} due`}
                            Icon={CalendarClock}
                            tone="mint"
                        />
                    </section>

                    <section className="md-panels">
                        <div className="md-card md-panel">
                            <h2>Payment submissions</h2>
                            {submissions.length === 0 ? (
                                <p className="md-empty">No payments submitted yet.</p>
                            ) : (
                                submissions.map((p) => (
                                    <div className="md-row" key={p.id}>
                                        <div>
                                            <div className="md-row-main">
                                                <strong>{formatINR(p.amount)}</strong>
                                                <span className="md-row-meta">
                                                    {p.id} · {p.method} · {p.reference}
                                                </span>
                                            </div>
                                            <div className="md-row-sub">Submitted {p.submittedAt}</div>
                                        </div>
                                        <span className="md-status pending">
                                            <i />
                                            {p.status}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="md-card md-panel">
                            <h2>Upcoming dues</h2>
                            {upcomingDues.length === 0 ? (
                                <p className="md-empty">Nothing due right now.</p>
                            ) : (
                                upcomingDues.map((d) => (
                                    <div className="md-row" key={d.id}>
                                        <div>
                                            <div className="md-row-title">{d.title}</div>
                                            <div className="md-row-sub">Due {d.dueDate}</div>
                                        </div>
                                        <strong className="md-row-amount">{formatINR(d.amount)}</strong>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                </main>
            </div>
        </div>
    )
}

export default MerchantDashboard