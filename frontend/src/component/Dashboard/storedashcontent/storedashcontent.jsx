import { Link } from 'react-router-dom';
import {
    ShieldCheck,
    ArrowRight,
    BadgeDollarSign,
    IndianRupee,
    TrendingDown,
    AlertTriangle,
    Users,
    UserPlus,
    PlusCircle,
    Wallet,
    MessageSquare,
} from 'lucide-react';
import './StoremanDashboard.css';

/* ------------------------------------------------------------------ */
/* Single demo dataset (everything on the page comes from this object) */
/* ------------------------------------------------------------------ */
const DEMO = {
    user: 'Anil',
    pendingRequests: { count: 1, amount: 8000 },
    stats: {
        totalCredit: 157500,
        paymentsReceived: 94000,
        outstanding: 63500,
        overdue: 36000,
        merchants: 5,
    },
    chart: [
        { month: 'May', credit: 8000, payments: 0 },
        { month: 'Jun', credit: 0, payments: 8000 },
        { month: 'Jul', credit: 37000, payments: 10000 },
        { month: 'Aug', credit: 62000, payments: 15000 },
        { month: 'Sept', credit: 50000, payments: 38000 },
        { month: 'Oct', credit: 0, payments: 23000 },
    ],
    activity: [
        { id: 1, name: 'Raj Grocery Store', note: 'Payment submitted · PR-1006 · UPI', date: '16 Oct, 10:17 pm', status: 'pending', amount: 8000 },
        { id: 2, name: 'Raj Grocery Store', note: 'Payment confirmed · Payment verified (PR-1001)', date: '10 Oct 2026', status: 'confirmed', amount: 12000 },
        { id: 3, name: 'Raj Grocery Store', note: 'Payment submitted · PR-1001 · UPI', date: '10 Oct, 12:44 am', status: 'verified', amount: 12000 },
        { id: 4, name: 'Balaji Provision Store', note: 'Payment submitted · PR-1005 · Cheque', date: '09 Oct, 06:44 am', status: 'rejected', amount: 8000 },
        { id: 5, name: 'Sai Daily Needs', note: 'Payment confirmed · Payment received — Cheque', date: '07 Oct 2026', status: 'confirmed', amount: 6500 },
        { id: 6, name: 'Shree Laxmi Mart', note: 'Payment confirmed · Payment verified (PR-1004)', date: '05 Oct 2026', status: 'confirmed', amount: 4500 },
        { id: 7, name: 'Shree Laxmi Mart', note: 'Payment submitted · PR-1004 · UPI', date: '05 Oct, 12:44 am', status: 'verified', amount: 4500 },
        { id: 8, name: 'Balaji Provision Store', note: 'Payment submitted · PR-1003 · Bank Transfer', date: '03 Oct, 09:44 pm', status: 'rejected', amount: 5000 },
    ],
    balances: [
        { id: 1, name: 'Balaji Provision Store', initials: 'BP', tone: 'slate', due: '01 Aug 2026', amount: 24000, status: 'overdue' },
        { id: 2, name: 'Krishna General Store', initials: 'KG', tone: 'peach', due: '30 Sept 2026', amount: 21500, status: 'overdue' },
        { id: 3, name: 'Shree Laxmi Mart', initials: 'SL', tone: 'pink', due: '20 Oct 2026', amount: 10000, status: 'soon' },
        { id: 4, name: 'Raj Grocery Store', initials: 'RG', tone: 'mint', due: '28 Oct 2026', amount: 8000, status: 'active' },
    ],
};

const STATUS = {
    pending: { label: 'Pending Verification', cls: 'is-orange' },
    confirmed: { label: 'Confirmed', cls: 'is-green' },
    verified: { label: 'Verified', cls: 'is-green' },
    rejected: { label: 'Rejected', cls: 'is-red' },
    overdue: { label: 'Overdue', cls: 'is-red' },
    soon: { label: 'Due Soon', cls: 'is-orange' },
    active: { label: 'Active', cls: 'is-slate' },
};

const QUICK_ACTIONS = [
    { to: '/storeman/merchants', label: 'Add Merchant', icon: UserPlus },
    { to: '/storeman/add-credit', label: 'Record Credit', icon: PlusCircle },
    { to: '/storeman/record-payment', label: 'Record Payment', icon: Wallet },
    { to: '/storeman/chat', label: 'Open Chat', icon: MessageSquare },
];

const formatINR = (n) => `₹${Number(n).toLocaleString('en-IN')}`;
const axisLabel = (n) => (n === 0 ? '₹0' : `₹${(n / 1000).toFixed(1)}k`);

/* ------------------------------ Chart ------------------------------ */
function CreditChart({ data }) {
    const W = 860;
    const H = 280;
    const left = 74;
    const top = 12;
    const plotH = 214;
    const plotW = W - left - 10;
    const max = 80000;
    const ticks = [0, 20000, 40000, 60000, 80000];
    const groupW = plotW / data.length;
    const barW = 50;
    const gap = 3;
    const y = (v) => top + plotH - (v / max) * plotH;

    // bar with only the top corners rounded
    const bar = (x, v, cls) => {
        if (!v) return null;
        const r = 4;
        const yy = y(v);
        const base = top + plotH;
        return (
            <path
                key={`${cls}-${x}`}
                className={cls}
                d={`M${x},${base} V${yy + r} Q${x},${yy} ${x + r},${yy} H${x + barW - r} Q${x + barW},${yy} ${x + barW},${yy + r} V${base} Z`}
            />
        );
    };

    return (
        <svg className="sd-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Credit given versus payments received, last 6 months">
            {ticks.map((t) => (
                <g key={t}>
                    <line className="sd-grid" x1={left} x2={W - 10} y1={y(t)} y2={y(t)} />
                    <text className="sd-axis" x={left - 12} y={y(t) + 4} textAnchor="end">
                        {axisLabel(t)}
                    </text>
                </g>
            ))}
            {data.map((d, i) => {
                const gx = left + i * groupW + (groupW - (barW * 2 + gap)) / 2;
                return (
                    <g key={d.month}>
                        {bar(gx, d.credit, 'sd-bar-credit')}
                        {bar(gx + barW + gap, d.payments, 'sd-bar-pay')}
                        <text className="sd-axis" x={left + i * groupW + groupW / 2} y={top + plotH + 26} textAnchor="middle">
                            {d.month}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
}

/* ------------------------------ Page ------------------------------- */
function StatCard({ label, value, icon: Icon, tone }) {
    return (
        <div className="sd-card sd-stat">
            <div className="sd-stat-text">
                <span className="sd-stat-label">{label}</span>
                <span className="sd-stat-value">{value}</span>
            </div>
            <span className={`sd-stat-icon tone-${tone}`} aria-hidden="true">
                <Icon size={20} strokeWidth={1.9} />
            </span>
        </div>
    );
}

function Pill({ status }) {
    const s = STATUS[status];
    return (
        <span className={`sd-pill ${s.cls}`}>
            <span className="sd-pill-dot" aria-hidden="true" />
            {s.label}
        </span>
    );
}

export default function StoremanDashboard() {
    const { user, pendingRequests, stats, chart, activity, balances } = DEMO;

    return (
        <main className="sd-main">
            <header className="sd-header">
                <h1 className="sd-greeting">Good day, {user}</h1>
                <p className="sd-sub">Here's how your credit book looks today.</p>
            </header>

            {pendingRequests.count > 0 && (
                <Link to="/storeman/payment-verification" className="sd-alert">
                    <ShieldCheck size={20} strokeWidth={1.9} aria-hidden="true" />
                    <span className="sd-alert-text">
                        <strong>
                            {pendingRequests.count} payment request{pendingRequests.count > 1 ? 's' : ''}
                        </strong>{' '}
                        worth {formatINR(pendingRequests.amount)} awaiting your verification. Pending amounts are not
                        deducted yet.
                    </span>
                    <ArrowRight size={18} strokeWidth={1.9} aria-hidden="true" />
                </Link>
            )}

            <section className="sd-stats" aria-label="Summary">
                <StatCard label="Total Credit Given" value={formatINR(stats.totalCredit)} icon={BadgeDollarSign} tone="slate" />
                <StatCard label="Payments Received" value={formatINR(stats.paymentsReceived)} icon={IndianRupee} tone="green" />
                <StatCard label="Outstanding Balance" value={formatINR(stats.outstanding)} icon={TrendingDown} tone="orange" />
                <StatCard label="Total Overdue" value={formatINR(stats.overdue)} icon={AlertTriangle} tone="red" />
                <StatCard label="Total Merchants" value={stats.merchants} icon={Users} tone="mint" />
            </section>

            <div className="sd-row sd-row-top">
                <section className="sd-card sd-panel">
                    <h2 className="sd-panel-title">Credit vs payments — last 6 months</h2>
                    <div className="sd-chart-wrap">
                        <CreditChart data={chart} />
                        <div className="sd-legend">
                            <span className="sd-legend-item credit">
                                <i /> Credit given
                            </span>
                            <span className="sd-legend-item pay">
                                <i /> Payments received
                            </span>
                        </div>
                    </div>
                </section>

                <section className="sd-card sd-panel">
                    <h2 className="sd-panel-title">Quick actions</h2>
                    <div className="sd-actions">
                        {QUICK_ACTIONS.map(({ to, label, icon: Icon }) => (
                            <Link key={label} to={to} className="sd-action">
                                <span className="sd-action-icon" aria-hidden="true">
                                    <Icon size={20} strokeWidth={1.9} />
                                </span>
                                <span className="sd-action-label">{label}</span>
                            </Link>
                        ))}
                    </div>
                </section>
            </div>

            <div className="sd-row sd-row-bottom">
                <section className="sd-card sd-panel">
                    <div className="sd-panel-head">
                        <h2 className="sd-panel-title">Recent activity</h2>
                        <Link to="/storeman/ledger" className="sd-link">
                            View ledger
                        </Link>
                    </div>
                    <ul className="sd-list">
                        {activity.map((a) => (
                            <li key={a.id} className="sd-act">
                                <div className="sd-act-main">
                                    <div className="sd-name">{a.name}</div>
                                    <div className="sd-note">{a.note}</div>
                                </div>
                                <div className="sd-act-date">{a.date}</div>
                                <div className="sd-act-pill">
                                    <Pill status={a.status} />
                                </div>
                                <div className={`sd-act-amount${a.status === 'confirmed' || a.status === 'verified' ? ' is-credit' : ''}`}>
                                    −{formatINR(a.amount)}
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>

                <section className="sd-card sd-panel">
                    <div className="sd-panel-head">
                        <h2 className="sd-panel-title">Outstanding balances</h2>
                        <Link to="/storeman/dues" className="sd-link">
                            All dues
                        </Link>
                    </div>
                    <ul className="sd-list">
                        {balances.map((b) => (
                            <li key={b.id} className="sd-bal">
                                <span className={`sd-avatar tone-${b.tone}`} aria-hidden="true">
                                    {b.initials}
                                </span>
                                <div className="sd-bal-main">
                                    <div className="sd-name">{b.name}</div>
                                    <div className="sd-note">Next due {b.due}</div>
                                </div>
                                <div className="sd-bal-right">
                                    <span className="sd-bal-amount">{formatINR(b.amount)}</span>
                                    <Pill status={b.status} />
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>
            </div>
        </main>
    );
}