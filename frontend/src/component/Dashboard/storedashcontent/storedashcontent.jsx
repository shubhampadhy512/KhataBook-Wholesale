import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    BadgeDollarSign,
    IndianRupee,
    TrendingDown,
    Users,
    UserPlus,
    PlusCircle,
    Wallet,
    MessageSquare,
} from 'lucide-react';
import './StoremanDashboard.css';

const API = import.meta.env.VITE_BACKEND_URL;

const QUICK_ACTIONS = [
    { to: '/storeman/merchants', label: 'Add Merchant', icon: UserPlus },
    { to: '/storeman/add-credit', label: 'Record Credit', icon: PlusCircle },
    { to: '/storeman/record-payment', label: 'Record Payment', icon: Wallet },
    { to: '/storeman/chat', label: 'Open Chat', icon: MessageSquare },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

/* Last 6 months (with year) and 0 values, used until / unless the backend sends real data */
const emptyChart = () => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        return { month: MONTHS[d.getMonth()], year: d.getFullYear(), credit: 0, payments: 0 };
    });
};

const EMPTY_STATS = {
    totalCredit: 0,
    paymentsReceived: 0,
    outstanding: 0,
    merchants: 0,
};

const formatINR = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const axisLabel = (n) => (n === 0 ? '₹0' : `₹${(n / 1000).toFixed(1)}k`);
const capitalize = (str = '') => str.charAt(0).toUpperCase() + str.slice(1);

/* Picks a clean step (5k, 10k, 20k, 50k...) so the chart scales to the real data */
const getStep = (highest) => {
    if (highest <= 0) return 5000;
    const raw = highest / 4;
    const magnitude = Math.pow(10, Math.floor(Math.log10(raw)));
    const normalized = raw / magnitude;
    const nice = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
    return nice * magnitude;
};

/* ------------------------------ Chart ------------------------------ */
function CreditChart({ data }) {
    const W = 860;
    const H = 280;
    const left = 74;
    const top = 12;
    const plotH = 214;
    const plotW = W - left - 10;

    const highest = Math.max(0, ...data.flatMap((d) => [d.credit || 0, d.payments || 0]));
    const step = getStep(highest);
    const max = step * 4;
    const ticks = [0, 1, 2, 3, 4].map((i) => i * step);

    const groupW = plotW / Math.max(data.length, 1);
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
        <svg
            className="sd-chart"
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label="Credit given versus payments received, last 6 months"
        >
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
                const cx = left + i * groupW + groupW / 2;
                return (
                    <g key={`${d.month}-${d.year ?? ''}-${i}`}>
                        {bar(gx, d.credit, 'sd-bar-credit')}
                        {bar(gx + barW + gap, d.payments, 'sd-bar-pay')}
                        <text className="sd-axis" x={cx} y={top + plotH + 24} textAnchor="middle">
                            {d.month}
                        </text>
                        {d.year && (
                            <text className="sd-axis sd-axis-year" x={cx} y={top + plotH + 42} textAnchor="middle">
                                {d.year}
                            </text>
                        )}
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

export default function StoremanDashboard() {
    // starts with zeros; replaced only if the backend returns data
    const [user, setUser] = useState('');
    const [stats, setStats] = useState(EMPTY_STATS);
    const [chart, setChart] = useState(emptyChart);

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
                setUser(body.user || '');
                setStats({ ...EMPTY_STATS, ...(body.stats || {}) });
                if (Array.isArray(body.chart) && body.chart.length > 0) {
                    setChart(body.chart);
                }
            } catch (err) {
                // on any failure, keep the zero values
                if (err.name !== 'AbortError') {
                    console.log('error loading dashboard', err.message);
                }
            }
        };

        fetchDashboard();
        return () => controller.abort();
    }, []);

    return (
        <main className="sd-main">
            <header className="sd-header">
                <h1 className="sd-greeting">
                    {user ? `Good day, ${capitalize(user)}` : 'Good day'}
                </h1>
                <p className="sd-sub">Here's how your credit book looks today.</p>
            </header>

            <section className="sd-stats" aria-label="Summary">
                <StatCard label="Total Credit Given" value={formatINR(stats.totalCredit)} icon={BadgeDollarSign} tone="slate" />
                <StatCard label="Payments Received" value={formatINR(stats.paymentsReceived)} icon={IndianRupee} tone="green" />
                <StatCard label="Outstanding Balance" value={formatINR(stats.outstanding)} icon={TrendingDown} tone="orange" />
                <StatCard label="Total Merchants" value={stats.merchants ?? 0} icon={Users} tone="mint" />
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
        </main>
    );
}