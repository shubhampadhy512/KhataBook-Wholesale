import { Link } from 'react-router-dom';
import {
    Send,
    BadgeDollarSign,
    IndianRupee,
    TrendingDown,
    CalendarClock,
} from 'lucide-react';
import './MerchantDashboard.css';

const formatINR = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

// Demo data so the page renders on its own. Replace with props / API data.
const DEMO = {
    merchant: { name: 'Rajesh', store: 'Raj Grocery Store' },
    notice: 'Payment Successful! Your payment of ₹12,000 (PR-1001) was approved. Outstanding balance: ₹8,000.',
    summary: {
        totalCredit: 20000,
        totalPaid: 12000,
        outstanding: 8000,
        nextDueDate: '28 Oct 2026',
        nextDueAmount: 8000,
    },
    submissions: [
        {
            id: 'PR-1006',
            amount: 8000,
            method: 'UPI',
            reference: 'asdfasdf',
            submittedAt: '16 Oct, 10:17 pm',
            status: 'pending',
        },
        {
            id: 'PR-1001',
            amount: 12000,
            method: 'UPI',
            reference: 'UPI123456',
            submittedAt: '10 Oct, 12:44 am',
            status: 'verified',
        },
    ],
    dues: [
        { id: 1, title: 'Monthly stock — rice, dal, oil, sugar', dueDate: '28 Oct 2026', amount: 8000 },
    ],
};

const STATUS = {
    pending: { label: 'Pending Verification', className: 'is-pending' },
    verified: { label: 'Verified — Successful', className: 'is-verified' },
};

function StatCard({ label, value, note, icon: Icon, tone }) {
    return (
        <div className="md-card md-stat">
            <div className="md-stat-top">
                <span className="md-stat-label">{label}</span>
                <span className={`md-stat-icon tone-${tone}`} aria-hidden="true">
                    <Icon size={20} strokeWidth={1.9} />
                </span>
            </div>
            <div className="md-stat-value">{value}</div>
            {note && <div className="md-stat-note">{note}</div>}
        </div>
    );
}

export default function MerchantDashboard({
    merchant = DEMO.merchant,
    notice = DEMO.notice,
    summary = DEMO.summary,
    submissions = DEMO.submissions,
    dues = DEMO.dues,
}) {
    return (
        <main className="md-main">
            <header className="md-header">
                <div>
                    <h1 className="md-greeting">Namaste, {merchant.name}</h1>
                    <p className="md-store">{merchant.store}</p>
                </div>
                <Link to="/merchant/submit-payment" className="md-btn">
                    <Send size={18} strokeWidth={1.9} aria-hidden="true" />
                    Submit Payment
                </Link>
            </header>

            {notice && (
                <div className="md-notice" role="status">
                    {notice}
                </div>
            )}

            <section className="md-stats" aria-label="Account summary">
                <StatCard
                    label="Total Credit Received"
                    value={formatINR(summary.totalCredit)}
                    icon={BadgeDollarSign}
                    tone="slate"
                />
                <StatCard
                    label="Total Payments Made"
                    value={formatINR(summary.totalPaid)}
                    icon={IndianRupee}
                    tone="green"
                />
                <StatCard
                    label="Outstanding Balance"
                    value={formatINR(summary.outstanding)}
                    note="Pending payments not yet deducted"
                    icon={TrendingDown}
                    tone="orange"
                />
                <StatCard
                    label="Next Payment Due"
                    value={summary.nextDueDate}
                    note={`${formatINR(summary.nextDueAmount)} due`}
                    icon={CalendarClock}
                    tone="green"
                />
            </section>

            <div className="md-panels">
                <section className="md-card md-panel">
                    <h2 className="md-panel-title">Payment submissions</h2>
                    {submissions.length === 0 ? (
                        <p className="md-empty">No payments submitted yet.</p>
                    ) : (
                        <ul className="md-list">
                            {submissions.map((s) => {
                                const status = STATUS[s.status] ?? STATUS.pending;
                                return (
                                    <li key={s.id} className="md-row">
                                        <div className="md-row-main">
                                            <div className="md-row-line">
                                                <span className="md-row-amount">{formatINR(s.amount)}</span>
                                                <span className="md-row-meta">
                                                    {s.id} · {s.method} · {s.reference}
                                                </span>
                                            </div>
                                            <div className="md-row-sub">Submitted {s.submittedAt}</div>
                                        </div>
                                        <span className={`md-pill ${status.className}`}>
                                            <span className="md-pill-dot" aria-hidden="true" />
                                            {status.label}
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </section>

                <section className="md-card md-panel">
                    <h2 className="md-panel-title">Upcoming dues</h2>
                    {dues.length === 0 ? (
                        <p className="md-empty">Nothing due right now.</p>
                    ) : (
                        <ul className="md-list">
                            {dues.map((d) => (
                                <li key={d.id} className="md-row">
                                    <div className="md-row-main">
                                        <div className="md-due-title">{d.title}</div>
                                        <div className="md-row-sub">Due {d.dueDate}</div>
                                    </div>
                                    <span className="md-due-amount">{formatINR(d.amount)}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </main>
    );
}