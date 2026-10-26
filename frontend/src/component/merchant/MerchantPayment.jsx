import React, { useEffect, useState } from "react";
import { Search } from "lucide-react";
import "./merchantPaymentHistory.css"; // all styles for this page are in this one file

const BACKEND = import.meta.env.VITE_BACKEND_URL;
const ENDPOINT = "/getpayment"; // change to your route (GET, returns { message, body: [...] })

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

// Backend status -> colour group: "good" (green), "wait" (amber), "bad" (red)
const groupOf = (status) => {
    const s = String(status || "").toLowerCase();
    if (["verified", "approved", "confirmed", "done", "paid", "success"].includes(s)) return "good";
    if (["rejected", "failed", "declined", "cancelled"].includes(s)) return "bad";
    return "wait"; // pending or anything else
};

// One backend payment -> one table row
const toRow = (p) => ({
    id: p._id,
    date: toLocalISO(p.createdAt),
    title: p.paymentMode ? `Payment · ${p.paymentMode}` : "Payment",
    sub: `Paid ${inr(p.amount)}${p.description ? " · " + p.description : ""}`,
    amount: Number(p.amount) || 0,
    statusText: p.status ? cap(p.status) : "Pending",
    group: groupOf(p.status),
});

export default function MerchantPayments() {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [filter, setFilter] = useState(""); // "" | good | wait | bad
    const [search, setSearch] = useState("");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    // GET this merchant's payments once, when the page opens
    useEffect(() => {
        const getPayments = async () => {
            try {
                const response = await fetch(BACKEND + ENDPOINT, {
                    method: "GET",
                    credentials: "include",
                });
                const data = await response.json();

                if (!response.ok) {
                    setError(data.message || "Could not load your payments.");
                    return;
                }

                // keep only real payments (a "no payment" placeholder has no _id)
                const real = (data.body || []).filter((p) => p._id);

                // newest first
                real.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setPayments(real.map(toRow));
            } catch (err) {
                console.log("error in get payments:", err.message);
                setError("Can't reach the server. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        getPayments();
    }, []);

    // Apply the filters
    const q = search.trim().toLowerCase();
    const rows = payments.filter((p) => {
        if (filter && p.group !== filter) return false;
        if (fromDate && p.date < fromDate) return false;
        if (toDate && p.date > toDate) return false;
        return `${p.title} ${p.sub}`.toLowerCase().includes(q);
    });

    const clearFilters = () => {
        setFilter("");
        setSearch("");
        setFromDate("");
        setToDate("");
    };

    // Message shown inside the table when there are no rows
    let message = "";
    if (loading) message = "Loading payments…";
    else if (error) message = error;
    else if (rows.length === 0) message = payments.length === 0 ? "No payments yet." : "No entries found.";

    return (
        <div className="mp-page">
            <div className="mp-header">
                <h1>My Payments</h1>
                <p>Every payment you made and whether it is verified.</p>
            </div>

            <div className="mp-card">
                {/* Filters */}
                <div className="mp-filters">
                    <select className="mp-select" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter by status">
                        <option value="">All entries</option>
                        <option value="good">Verified</option>
                        <option value="wait">Pending</option>
                        <option value="bad">Rejected</option>
                    </select>

                    <div className="mp-search">
                        <Search size={16} />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search description or reference"
                        />
                    </div>

                    <input type="date" className="mp-date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} aria-label="From date" />
                    <input type="date" className="mp-date" value={toDate} onChange={(e) => setToDate(e.target.value)} aria-label="To date" />

                    <button type="button" className="mp-clear" onClick={clearFilters}>Clear</button>
                </div>

                {/* Table */}
                <div className="mp-table-wrap">
                    <table className="mp-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Description</th>
                                <th className="mp-right mp-gap">Payment</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {message && (
                                <tr>
                                    <td colSpan={4} className="mp-empty">{message}</td>
                                </tr>
                            )}

                            {!message && rows.map((p) => (
                                <tr key={p.id}>
                                    <td className="mp-muted">{fmtDate(p.date)}</td>
                                    <td>
                                        <div>{p.title}</div>
                                        {p.sub && <div className="mp-sub">{p.sub}</div>}
                                    </td>
                                    <td className="mp-right mp-payment mp-gap">{inr(p.amount)}</td>
                                    <td>
                                        <span className={`mp-pill mp-pill-${p.group}`}>
                                            <i /> {p.statusText}
                                        </span>
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