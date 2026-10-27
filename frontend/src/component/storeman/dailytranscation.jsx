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

// Overdue if the due date has passed, otherwise pending
// ("done" is added later in addBalances)
const statusOf = (dueDate) => {
    if (!dueDate) return "";
    return dueDate < toLocalISO(new Date()) ? "overdue" : "pending";
};

// Payment status from the backend: "Pending" | "Approve" | "Reject"
// -> { key: pill colour class, label: text shown, rejected: true/false }
const paymentStatusOf = (raw) => {
    const s = String(raw || "").toLowerCase();
    if (s.startsWith("reject") || s.startsWith("declin") || s === "failed" || s === "cancelled") {
        return { key: "rejected", label: "Rejected", rejected: true };
    }
    if (s.startsWith("approv") || s === "verified" || s === "confirmed") {
        return { key: "done", label: "Approved", rejected: false };
    }
    return { key: "pending", label: "Pending", rejected: false };
};

// finds the paid amount anywhere inside an entry
const findPaid = (obj, depth = 0) => {
    if (!obj || typeof obj !== "object" || depth > 4) return undefined;
    for (const [key, val] of Object.entries(obj)) {
        if (!/paid/i.test(key) || /^(is|un)paid/i.test(key)) continue;
        const n = typeof val === "number" ? val : Number(String(val ?? "").replace(/,/g, ""));
        if (n > 0) return n;
    }
    for (const val of Object.values(obj)) {
        const found = findPaid(val, depth + 1);
        if (found !== undefined) return found;
    }
    return undefined;
};

// One backend entry -> one table row
const toRow = (e) => {
    const dueDate = toLocalISO(e.duedate);
    const isPurchase = e.type === "Purchase";

    const paidRaw = findPaid(e);
    const paidNow = Number(String(paidRaw ?? "").replace(/,/g, "")) || 0;

    // payment status (a rejected payment is not added to paid)
    const pay = isPurchase ? null : paymentStatusOf(e.status);

    // purchase: bill adds to credit, amount paid while taking goods counts as paid
    // payment : the whole amount counts as paid, unless it was rejected
    const attempted = paidNow || Number(e.amount) || 0;
    const rowCredit = isPurchase ? Number(e.amount) || 0 : 0;
    const rowPaid = isPurchase ? paidNow : pay.rejected ? 0 : attempted;

    // text shown in the Description column
    let title = "";
    let sub = "";

    if (isPurchase) {
        title = e.items?.length ? e.items.map((i) => i.name).join(", ") : e.description ?? "";
        sub = e.items?.length ? `${e.items.length} item${e.items.length === 1 ? "" : "s"}` : "";
    } else {
        title = e.paymentMode ? `Payment · ${e.paymentMode}` : "Payment";
        sub = `${pay.rejected ? "Rejected" : "Paid"} ${inr(attempted)}${e.description ? " · " + e.description : ""}`;
    }

    return {
        id: e._id,
        merchantKey: String(e.merchantId),
        merchant: cap(e.username),
        createdAt: e.createdAt,
        date: toLocalISO(e.createdAt),
        title,
        sub,
        type: isPurchase ? "credit" : "payment",
        rowCredit,
        rowPaid,
        attempted,
        rejected: !isPurchase && pay.rejected,
        dueDate,
        // purchase: due-date logic (unchanged), payment: status from the backend
        status: isPurchase ? statusOf(dueDate) : pay.key,
        statusLabel: isPurchase ? "" : pay.label,
    };
};

// Running balance per merchant: credits add, payments subtract
const addBalances = (rows) => {
    const totals = {};

    // Step 1: running balance for every row (oldest first)
    const withBalance = [...rows]
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        .map((r) => {
            const t = totals[r.merchantKey] || { credit: 0, paid: 0 };
            t.credit += r.rowCredit;
            t.paid += r.rowPaid;
            totals[r.merchantKey] = t;

            return { ...r, credit: t.credit, paid: t.paid, balance: t.credit - t.paid };
        });

    // Step 2: if the merchant's final balance is 0, mark their credit rows as "done"
    return withBalance.map((r) => {
        const t = totals[r.merchantKey];
        const finalBalance = t.credit - t.paid;

        if (r.type === "credit" && finalBalance <= 0) {
            return { ...r, status: "done" };
        }
        return r;
    });
};

export default function DailyHistory() {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [storeName, setStoreName] = useState("");

    // for storeman this holds a merchant name, for merchant it holds "credit" / "payment"
    const [merchant, setMerchant] = useState("");
    const [search, setSearch] = useState("");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [role, setRole] = useState("");

    // GET the ledger once, when the page opens
    useEffect(() => {
        const getLedger = async () => {
            try {
                const response = await fetch(`${BACKEND}/daily-transcation`, {
                    method: "GET",
                    credentials: "include",
                });
                const data = await response.json();

                console.log(data)
                if (!response.ok) {
                    setError(data.message || "Could not load the ledger.");
                    return;
                }

                // keep only real transactions (the "no transaction" placeholder has no _id)
                const realEntries = (data.body || []).filter((e) => e._id);

                // if the backend sent no role and there are no transactions,
                // treat it as a merchant with an empty ledger
                setRole(data.role || (realEntries.length === 0 ? "merchant" : ""));

                setEntries(addBalances(realEntries.map(toRow)));
                setStoreName(data.body?.[0]?.username || "");
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

    // name shown in the merchant header
    const headerName = entries.at(-1)?.merchant || (storeName ? cap(storeName) : "");

    // apply the filters, newest first
    const rows = entries
        .filter((e) => {
            if (merchant) {
                if (role === "storeman" && e.merchant !== merchant) return false;
                if (role === "merchant" && e.type !== merchant) return false;
            }
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
            {/* Header changes with the role (both use the same dark blue banner) */}
            {role === "merchant" && (
                <>
                    <div className="ledger-header">
                        <h1>My Ledger</h1>
                        <p>Your credits, confirmed payments and running balance.</p>
                    </div>

                    <div className="ledger-card">
                        <div className="ledger-card-left">
                            <div className="ledger-avatar">
                                {(headerName || "?").slice(0, 2).toUpperCase()}
                            </div>

                            <div className="ledger-store-info">
                                <h3>{headerName || "My Store"}</h3>
                            </div>
                        </div>

                        <div className="ledger-card-right">
                            <div className="ledger-figure">
                                <span>Credit</span>
                                <strong>{inr(entries.at(-1)?.credit)}</strong>
                            </div>
                            <div className="ledger-figure">
                                <span>Paid</span>
                                <strong className="paid">{inr(entries.at(-1)?.paid)}</strong>
                            </div>
                            <div className="ledger-figure">
                                <span>Balance</span>
                                <strong>{inr(entries.at(-1)?.balance)}</strong>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {role === "storeman" && (
                <div className="ledger-header">
                    <h1>Customer Ledger</h1>
                    <p>Credits, payments and running balances. Only verified payments appear here.</p>
                </div>
            )}

            <div className="cl-card">
                {/* Filters */}
                <div className="cl-filters">
                    <select className="cl-select" value={merchant} onChange={(e) => setMerchant(e.target.value)}>
                        {role === "storeman" && (
                            <>
                                <option value="">All merchants</option>
                                {merchantNames.map((name) => (
                                    <option key={name} value={name}>{name}</option>
                                ))}
                            </>
                        )}
                        {role === "merchant" && (
                            <>
                                <option value="">All entries</option>
                                <option value="credit">Credit</option>
                                <option value="payment">Payment</option>
                            </>
                        )}
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
                                {role === "storeman" && <th>Merchant</th>}
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
                                    <td colSpan={role === "storeman" ? 8 : 7} className="cl-empty">{message}</td>
                                </tr>
                            )}

                            {!message && rows.map((e) => (
                                <tr key={e.id}>
                                    <td className="cl-muted">{fmtDate(e.date)}</td>
                                    {role === "storeman" && <td>{e.merchant}</td>}
                                    <td>
                                        <div>{e.title}</div>
                                        {e.sub && <div className="cl-sub">{e.sub}</div>}
                                    </td>
                                    <td className="cl-right cl-credit">{e.type === "credit" ? inr(e.rowCredit) : ""}</td>
                                    <td className="cl-right cl-payment">
                                        {e.rejected ? (
                                            <span className="cl-struck">{inr(e.attempted)}</span>
                                        ) : e.rowPaid > 0 ? (
                                            inr(e.rowPaid)
                                        ) : e.type === "credit" ? (
                                            "-"
                                        ) : (
                                            ""
                                        )}
                                    </td>
                                    <td className="cl-right cl-balance">{inr(e.balance)}</td>
                                    <td className="cl-muted">{fmtDate(e.dueDate)}</td>
                                    <td>
                                        {e.status && (
                                            <span className={`cl-pill cl-pill-${e.status}`}>
                                                <i /> {e.statusLabel || cap(e.status)}
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