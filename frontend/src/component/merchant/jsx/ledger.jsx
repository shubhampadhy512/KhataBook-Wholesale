import { useMemo, useState } from "react";
import "../cssfile/Ledger.css";

const TRANSACTIONS = [
    {
        id: "tx-1",
        date: "2026-09-28",
        type: "credit",
        desc: "Monthly stock — rice, dal, oil, sugar",
        note: "4 items",
        amount: 20000,
        due: "2026-10-28",
        status: "Open",
    },
    {
        id: "tx-2",
        date: "2026-10-10",
        type: "payment",
        desc: "Payment verified (PR-1001)",
        note: "UPI · UPI123456",
        amount: 12000,
        due: null,
        status: "Confirmed",
    },
];

const ACCOUNT = {
    initials: "RG",
    store: "Raj Grocery Store",
    owner: "Rajesh Kumar",
    phone: "+91 98765 43210",
    status: "Active",
};

const inr = (n) => "₹" + n.toLocaleString("en-IN");

const formatDate = (iso) =>
    new Date(iso + "T00:00:00")
        .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
        .replace("Sep ", "Sept ");

// Running balance, calculated oldest -> newest
function withRunningBalance(list) {
    let run = 0;
    const balances = {};
    [...list]
        .sort((a, b) => a.date.localeCompare(b.date))
        .forEach((t) => {
            run += t.type === "credit" ? t.amount : -t.amount;
            balances[t.id] = run;
        });
    return list.map((t) => ({ ...t, balance: balances[t.id] }));
}

export default function Ledger({ transactions = TRANSACTIONS, account = ACCOUNT }) {
    const [type, setType] = useState("all");
    const [query, setQuery] = useState("");
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");

    const all = useMemo(() => withRunningBalance(transactions), [transactions]);

    const totals = useMemo(() => {
        const credit = all.filter((t) => t.type === "credit").reduce((s, t) => s + t.amount, 0);
        const paid = all
            .filter((t) => t.type === "payment" && t.status === "Confirmed")
            .reduce((s, t) => s + t.amount, 0);
        return { credit, paid, balance: credit - paid };
    }, [all]);

    const rows = useMemo(() => {
        const q = query.trim().toLowerCase();
        return all
            .filter(
                (t) =>
                    (type === "all" || t.type === type) &&
                    (!from || t.date >= from) &&
                    (!to || t.date <= to) &&
                    (!q || `${t.desc} ${t.note}`.toLowerCase().includes(q))
            )
            .sort((a, b) => b.date.localeCompare(a.date));
    }, [all, type, query, from, to]);

    const clearFilters = () => {
        setType("all");
        setQuery("");
        setFrom("");
        setTo("");
    };

    return (
        <main className="ledger">
            <div className="ledger__wrap">
                <h1 className="ledger__title">My Ledger</h1>
                <p className="ledger__sub">Your credits, confirmed payments and running balance.</p>

                <section className="ledger__card ledger__account">
                    <div className="ledger__who">
                        <div className="ledger__avatar">{account.initials}</div>
                        <div>
                            <div className="ledger__name">{account.store}</div>
                            <div className="ledger__meta">
                                {account.owner} · {account.phone}
                            </div>
                        </div>
                        <span className="ledger__pill">{account.status}</span>
                    </div>

                    <div className="ledger__stats">
                        <div className="ledger__stat">
                            <span>Credit</span>
                            <b>{inr(totals.credit)}</b>
                        </div>
                        <div className="ledger__stat">
                            <span>Paid</span>
                            <b className="is-green">{inr(totals.paid)}</b>
                        </div>
                        <div className="ledger__stat">
                            <span>Balance</span>
                            <b>{inr(totals.balance)}</b>
                        </div>
                    </div>
                </section>

                <section className="ledger__card">
                    <div className="ledger__filters">
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            aria-label="Transaction type"
                        >
                            <option value="all">All transactions</option>
                            <option value="credit">Credits</option>
                            <option value="payment">Payments</option>
                        </select>
                        <input
                            className="ledger__search"
                            type="search"
                            placeholder="Search description or reference"
                            aria-label="Search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        <input
                            type="date"
                            aria-label="From date"
                            value={from}
                            onChange={(e) => setFrom(e.target.value)}
                        />
                        <input
                            type="date"
                            aria-label="To date"
                            value={to}
                            onChange={(e) => setTo(e.target.value)}
                        />
                        <button type="button" onClick={clearFilters}>
                            Clear
                        </button>
                    </div>

                    <div className="ledger__scroll">
                        <table className="ledger__table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Description</th>
                                    <th className="n">Credit</th>
                                    <th className="n">Payment</th>
                                    <th className="n">Balance</th>
                                    <th>Due date</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="ledger__empty">
                                            No transactions match these filters. Try clearing them.
                                        </td>
                                    </tr>
                                ) : (
                                    rows.map((t) => (
                                        <tr key={t.id}>
                                            <td className="date">{formatDate(t.date)}</td>
                                            <td>
                                                {t.desc}
                                                <small>{t.note}</small>
                                            </td>
                                            <td className="n cr">{t.type === "credit" ? inr(t.amount) : ""}</td>
                                            <td className="n pay">{t.type === "payment" ? inr(t.amount) : ""}</td>
                                            <td className="n bal">{inr(t.balance)}</td>
                                            <td className="due">{t.due ? formatDate(t.due) : "—"}</td>
                                            <td>
                                                <span
                                                    className={
                                                        "ledger__pill" + (t.status === "Confirmed" ? " is-ok" : "")
                                                    }
                                                >
                                                    {t.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </main>
    );
}