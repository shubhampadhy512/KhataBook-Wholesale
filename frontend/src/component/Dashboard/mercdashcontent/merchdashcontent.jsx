import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Send,
    BadgeDollarSign,
    IndianRupee,
    TrendingDown,
    BookOpen,
    CreditCard,
    Store,
} from 'lucide-react';
import './MerchantDashboard.css';

const API = import.meta.env.VITE_BACKEND_URL;

const EMPTY_SUMMARY = {
    totalCredit: 0,
    totalPaid: 0,
    outstanding: 0,
};

const STATUS = {
    pending: { label: 'Pending Verification', className: 'is-pending' },
    verified: { label: 'Verified ', className: 'is-verified' },
    rejected: { label: 'Rejected', className: 'is-rejected' },
};

/* Routes other than submit-payment are placeholders, so change them to your real ones */
const QUICK_ACTIONS = [
    { to: '/merchant/submit-payment', label: 'Submit Payment', icon: Send },
    { to: '/merchant/daily-history', label: 'History', icon: BookOpen },
    { to: '/merchant/payments', label: 'My Payments', icon: CreditCard },
    { to: '/merchant/Mystore', label: 'My Store', icon: Store },
];

const formatINR = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const capitalize = (str = '') => str.charAt(0).toUpperCase() + str.slice(1);

const normalizeStatus = (raw) => {
    const v = String(raw || '').toLowerCase();
    if (['approve', 'approved', 'verified', 'success', 'successful'].includes(v)) return 'verified';
    if (['reject', 'rejected', 'declined', 'failed'].includes(v)) return 'rejected';
    return 'pending';
};

const formatDate = (value) => {
    if (!value) return '';
    const d = new Date(value);
    return Number.isNaN(d.getTime())
        ? String(value)
        : d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
};

const normalizeSubmissions = (list) => {
    if (!Array.isArray(list)) return [];

    const seen = new Map();

    return list.map((s, index) => {
        const baseId = String(s.id ?? s._id ?? `row-${index}`);
        const count = seen.get(baseId) ?? 0;
        seen.set(baseId, count + 1);

        return {
            ...s,
            id: count === 0 ? baseId : `${baseId}-${count}`,
            displayId: String(s.displayId ?? s.paymentId ?? s.orderId ?? '').trim() || '-',
            amount: Number(s.amount) || 0,
            method: s.method ?? s.paymentType ?? '',
            reference: s.reference ?? s.notes ?? '',
            submittedAt: formatDate(s.submittedAt ?? s.createdAt),
            status: normalizeStatus(s.status),
        };
    });
};

const sumBy = (list, status) =>
    list.filter((s) => s.status === status).reduce((total, s) => total + s.amount, 0);

const buildSummary = (list) => ({
    totalPaid: sumBy(list, 'verified'),
    outstanding: sumBy(list, 'pending'),
});

function StatCard({ label, value, note, icon: Icon, tone }) {
    return (
        <div className="md-card md-stat">
            <div className="md-stat-top">
                <span className="md-stat-label">{label}</span>
                <span className={`md-stat-icon tone-${tone}`} aria-hidden="true">
                    <Icon size={22} strokeWidth={1.9} />
                </span>
            </div>
            <span className="md-stat-value">{value}</span>
            {note && <span className="md-stat-note">{note}</span>}
        </div>
    );
}

export default function MerchantDashboard() {
    const [merchant, setMerchant] = useState({ name: '', store: '' });
    const [summary, setSummary] = useState(EMPTY_SUMMARY);
    const [submissions, setSubmissions] = useState([]);

    useEffect(() => {
        const controller = new AbortController();

        const fetchDashboard = async () => {
            try {
                const res = await fetch(`${API}/getdashboarddetails`, {
                    method: 'GET',
                    credentials: 'include',
                    signal: controller.signal,
                });

                const data = await res.json().catch(() => ({}));
                console.log(data)
                if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);

                const body = data.body || {};
                setMerchant({ name: '', store: '', ...(body.merchant || {}) });
                const list = normalizeSubmissions(body.submissions);
                setSummary({ ...EMPTY_SUMMARY, ...buildSummary(list), ...(body.summary || {}) });
                setSubmissions(list);
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.log('error loading merchant dashboard', err.message);
                }
            }
        };

        fetchDashboard();
        return () => controller.abort();
    }, []);

    return (
        <main className="md-main">
            <header className="md-header">
                <div>
                    <h1 className="md-greeting">
                        {merchant.name ? `Namaste, ${capitalize(merchant.name)}` : 'Namaste'}
                    </h1>
                    <p className="md-store">
                        {merchant.store || "Here's how your account looks today."}
                    </p>
                </div>
            </header>

            <section className="md-stats" aria-label="Account summary">
                <StatCard label="Total Credit Received" value={formatINR(summary.totalCredit)} icon={BadgeDollarSign} tone="slate" />
                <StatCard label="Total Payments Made" value={formatINR(summary.totalPaid)} icon={IndianRupee} tone="green" />
                <StatCard
                    label="Outstanding Balance"
                    value={formatINR(summary.outstanding)}
                    note="Pending payments not yet deducted"
                    icon={TrendingDown}
                    tone="orange"
                />
            </section>

            <div className="md-panels">
                <section className="md-card md-panel md-submissions">
                    <h2 className="md-panel-title">Payment submissions</h2>
                    {submissions.length === 0 ? (
                        <p className="md-empty">No payments submitted yet.</p>
                    ) : (
                        <ul className="md-list">
                            {submissions.map((s) => {
                                const status = STATUS[s.status] ?? STATUS.pending;
                                const meta = [s.displayId, s.method, s.reference].filter(Boolean).join(' · ');
                                return (
                                    <li key={s.id} className="md-item">
                                        <div className="md-item-main">
                                            <div className="md-item-line">
                                                <span className="md-item-amount">{formatINR(s.amount)}</span>
                                                <span className="md-item-meta">{meta}</span>
                                            </div>
                                            {s.submittedAt && (
                                                <div className="md-item-sub">Submitted {s.submittedAt}</div>
                                            )}
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

                <section className="md-card md-panel md-quick">
                    <h2 className="md-panel-title">Quick actions</h2>
                    <div className="md-actions">
                        {QUICK_ACTIONS.map(({ to, label, icon: Icon }) => (
                            <Link key={label} to={to} className="md-action">
                                <span className="md-action-icon" aria-hidden="true">
                                    <Icon size={20} strokeWidth={1.9} />
                                </span>
                                <span className="md-action-label">{label}</span>
                            </Link>
                        ))}
                    </div>
                </section>
            </div>
        </main>
    );
}