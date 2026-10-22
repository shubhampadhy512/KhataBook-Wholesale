import React, { useEffect, useState } from "react";
import { Search } from "lucide-react";
import "./dailytranscation.css";

const BACKEND = import.meta.env.VITE_BACKEND_URL;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];

// Any date value from the backend -> "2026-11-10" in the user's local time
const toLocalISO = (value) => {
    if (!value) return "";
    const d = new Date(value);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${mm}-${dd}`;
};

// "2026-11-10" -> "10 Nov 2026"
const fmtDate = (iso) => {
    if (!iso) return "—";
    const [y, m, d] = iso.split("-");
    return `${d} ${MONTHS[Number(m) - 1]} ${y}`;
};

const cap = (text) => (text ? text.charAt(0).toUpperCase() + text.slice(1) : "-");

const inr = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");

// Status depends only on the due date: overdue if it has passed, otherwise pending
const statusOf = (dueDate) => {
    if (!dueDate) return "";
    return dueDate < toLocalISO(new Date()) ? "overdue" : "pending";
};

// One backend entry -> one table row
const toRow = (e) => {
    const dueDate = toLocalISO(e.duedate);

    return {
        id: e._id,
        merchantKey: String(e.merchantId),                     // only used to keep each merchant's balance separate
        merchant: cap(e.username),
        date: toLocalISO(e.createdAt),
        title: e.items?.length ? e.items.map((i) => i.name).join(", ") : e.description ?? "",
        sub: e.items?.length ? `${e.items.length} item${e.items.length === 1 ? "" : "s"}` : e.reference ?? "",
        type: e.type === "Purchase" ? "credit" : "payment",
        amount: e.amount,
        dueDate,
        status: statusOf(dueDate),
    };
};

// Running balance per merchant: credits add, payments subtract
const addBalances = (rows) => {
    const totals = {};
    return [...rows]
        .sort((a, b) => (a.date > b.date ? 1 : -1))            // oldest first
        .map((r) => {
            totals[r.merchantKey] = (totals[r.merchantKey] || 0) + (r.type === "credit" ? r.amount : -r.amount);
            return { ...r, balance: totals[r.merchantKey] };
        });
};

export default function DailyHistory() {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [merchant, setMerchant] = useState("");
    const [search, setSearch] = useState("");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    // GET the ledger once, when the page opens
    useEffect(() => {
        const getLedger = async () => {
            try {
                const response = await fetch(`${BACKEND}/daily-transcation`, {   // change to your route
                    method: "GET",
                    credentials: "include",
                });
                const data = await response.json();

                if (!response.ok) {
                    setError(data.message || "Could not load the ledger.");
                    return;
                }
                setEntries(addBalances((data.body || []).map(toRow)));
            } catch (err) {
                console.log("error in get ledger", err.message);
                setError("Can't reach the server. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        getLedger();
    }, []);

    const merchantNames = [...new Set(entries.map((e) => e.merchant))];

    // apply the filters, newest first
    const rows = entries
        .filter((e) => {
            if (merchant && e.merchant !== merchant) return false;
            if (fromDate && e.date < fromDate) return false;
            if (toDate && e.date > toDate) return false;
            return `${e.title} ${e.sub}`.toLowerCase().includes(search.trim().toLowerCase());
        })
        .reverse();

    const clearFilters = () => {
        setMerchant("");
        setSearch("");
        setFromDate("");
        setToDate("");
    };

    // message shown inside the table when there are no rows
    let message = "";
    if (loading) message = "Loading ledger…";
    else if (error) message = error;
    else if (rows.length === 0) message = "No entries found.";

    return (
        <div className="cl-page">
            <h1 className="cl-title">Customer Ledger</h1>
            <p className="cl-subtitle">
                Credits, payments and running balances. Only verified payments appear here.
            </p>

            <div className="cl-card">
                {/* Filters */}
                <div className="cl-filters">
                    <select className="cl-select" value={merchant} onChange={(e) => setMerchant(e.target.value)}>
                        <option value="">All merchants</option>
                        {merchantNames.map((name) => (
                            <option key={name} value={name}>{name}</option>
                        ))}
                    </select>

                    <div className="cl-search">
                        <Search size={16} />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search description or reference"
                        />
                    </div>

                    <input type="date" className="cl-date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} aria-label="From date" />
                    <input type="date" className="cl-date" value={toDate} onChange={(e) => setToDate(e.target.value)} aria-label="To date" />

                    <button type="button" className="cl-clear" onClick={clearFilters}>Clear</button>
                </div>

                {/* Table */}
                <div className="cl-table-wrap">
                    <table className="cl-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Merchant</th>
                                <th>Description</th>
                                <th className="cl-right">Credit</th>
                                <th className="cl-right">Payment</th>
                                <th className="cl-right">Balance</th>
                                <th>Due date</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {message && (
                                <tr>
                                    <td colSpan={8} className="cl-empty">{message}</td>
                                </tr>
                            )}

                            {!message && rows.map((e) => (
                                <tr key={e.id}>
                                    <td className="cl-muted">{fmtDate(e.date)}</td>
                                    <td>{e.merchant}</td>
                                    <td>
                                        <div>{e.title}</div>
                                        {e.sub && <div className="cl-sub">{e.sub}</div>}
                                    </td>
                                    <td className="cl-right cl-credit">{e.type === "credit" ? inr(e.amount) : ""}</td>
                                    <td className="cl-right cl-payment">{e.type === "payment" ? inr(e.amount) : ""}</td>
                                    <td className="cl-right cl-balance">{inr(e.balance)}</td>
                                    <td className="cl-muted">{fmtDate(e.dueDate)}</td>
                                    <td>
                                        {e.status && (
                                            <span className={`cl-pill cl-pill-${e.status}`}>
                                                <i /> {e.status === "overdue" ? "Overdue" : "Pending"}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}