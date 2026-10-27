import React, { useEffect, useState } from "react";
import { Search, CheckCircle2, XCircle } from "lucide-react";
import "./StoremanVerification.css";
import { showSuccessToast } from '../toastMessage/SuccessToast.jsx'
import { toast } from "react-toastify";
import ErrorToastMessage from "../toastMessage/errormessage.jsx";

const showErrorToast = (message, options = {}) => toast.error(message, options);

const BACKEND = import.meta.env.VITE_BACKEND_URL;
const LIST_ENDPOINT = "/pendingpayments"; // GET  -> { message, body: [...] }
const VERIFY_ENDPOINT = "/verfiypayment"; // POST -> { id, status: "verified" | "rejected" }

const inr = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");

const fmtDate = (value) =>
    value ? new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

const fmtDateTime = (value) =>
    value
        ? new Date(value).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
        : "—";

const initials = (name = "") =>
    name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("") || "?";

// Backend status -> "pending" | "verified" | "rejected"
const groupOf = (status) => {
    const s = String(status || "").toLowerCase();
    if (["verified", "approved", "confirmed", "done", "paid", "success"].includes(s)) return "verified";
    if (["rejected", "failed", "declined", "cancelled"].includes(s)) return "rejected";
    return "pending";
};

const LABEL = { pending: "Pending Verification", verified: "Verified", rejected: "Rejected" };

const toCard = (p) => ({
    id: p._id,
    code: p.requestId || "PR-" + String(p._id).slice(-4).toUpperCase(),
    merchant: p.merchantName || p.merchant?.name || "Merchant",
    amount: p.amount,
    method: p.paymentMode || "—",
    reference: p.reference || "—",
    paidOn: p.date || p.createdAt,
    submitted: p.createdAt,
    balance: p.currentBalance ?? p.merchant?.balance,
    group: groupOf(p.status),
});

export default function StoremanVerification() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [tab, setTab] = useState("pending"); // all | pending | verified | rejected
    const [search, setSearch] = useState("");
    const [busyId, setBusyId] = useState("");

    useEffect(() => {
        const load = async () => {
            try {
                const response = await fetch(BACKEND + LIST_ENDPOINT, { method: "GET", credentials: "include" });
                const data = await response.json();

                if (!response.ok) {
                    setError(data.message || "Could not load payments.");
                    return;
                }
                const real = (data.body || []).filter((p) => p._id);
                real.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setItems(real.map(toCard));
            } catch (err) {
                console.log("error in get payments:", err.message);
                setError("Can't reach the server. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        load();
    }, []);

    // Approve or reject one payment
    const decide = async (id, status) => {
        setBusyId(id);
        setError("");
        try {
            const response = await fetch(BACKEND + VERIFY_ENDPOINT, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, status }),
            });
            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                setError(data.message || "Could not update this payment.");
                return;
            }
            if (data.status === "verified") {
                showSuccessToast("Payment Transaction is Approved", { icon: <CheckCircle2 color="green" size={24} /> })
            }

            if (data.status === 'rejected') {
                showErrorToast("Payment Transaction is Rejected", {
                    icon: <XCircle size={20} color="red" />,
                });
            }
            console.log(data)
            setItems((list) => list.map((c) => (c.id === id ? { ...c, group: groupOf(status) } : c)));
        } catch (err) {
            console.log("error in verify payment:", err.message);
            setError("Can't reach the server. Please try again.");
        } finally {
            setBusyId("");
        }
    };

    const count = (g) => (g === "all" ? items.length : items.filter((c) => c.group === g).length);

    const q = search.trim().toLowerCase();
    const cards = items.filter((c) => {
        if (tab !== "all" && c.group !== tab) return false;
        return `${c.merchant} ${c.code} ${c.reference}`.toLowerCase().includes(q);
    });

    let message = "";
    if (loading) message = "Loading payments…";
    else if (cards.length === 0) message = items.length === 0 ? "No payments yet." : "No payments found.";

    return (
        <div className="sv-page">
            <ErrorToastMessage />
            <header className="sv-head">
                <h1>Payment Verification</h1>
                <p>Approve or reject payments submitted by merchants. Only approved payments reduce the balance.</p>
            </header>

            <div className="sv-bar">
                <div className="sv-tabs" role="tablist">
                    {["all", "pending", "verified", "rejected"].map((t) => (
                        <button
                            key={t}
                            type="button"
                            role="tab"
                            aria-selected={tab === t}
                            className={`sv-tab ${tab === t ? "is-on" : ""}`}
                            onClick={() => setTab(t)}
                        >
                            {t.charAt(0).toUpperCase() + t.slice(1)} <span>{count(t)}</span>
                        </button>
                    ))}
                </div>

                <div className="sv-search">
                    <Search size={16} />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by merchant, request ID or reference"
                    />
                </div>
            </div>

            {error && <div className="sv-error" role="alert">{error}</div>}
            {message && <div className="sv-empty">{message}</div>}

            {!message &&
                cards.map((c) => (
                    <article key={c.id} className={`sv-card is-${c.group}`}>
                        <div className="sv-main">
                            <div className="sv-avatar">{initials(c.merchant)}</div>

                            <div className="sv-body">
                                <div className="sv-title">
                                    <strong>{c.merchant}</strong>
                                    <code className="sv-code">{c.code}</code>
                                    <span className={`sv-pill is-${c.group}`}>
                                        <i /> {LABEL[c.group]}
                                    </span>
                                </div>

                                <dl className="sv-grid">
                                    <div>
                                        <dt>Amount</dt>
                                        <dd className="sv-amount">{inr(c.amount)}</dd>
                                    </div>
                                    <div>
                                        <dt>Method</dt>
                                        <dd>{c.method}</dd>
                                    </div>
                                    <div>
                                        <dt>Reference</dt>
                                        <dd className="sv-mono">{c.reference}</dd>
                                    </div>
                                    <div>
                                        <dt>Payment date</dt>
                                        <dd>{fmtDate(c.paidOn)}</dd>
                                    </div>
                                    <div>
                                        <dt>Submitted</dt>
                                        <dd>{fmtDateTime(c.submitted)}</dd>
                                    </div>
                                    <div>
                                        <dt>Current balance</dt>
                                        <dd>{c.balance == null ? "—" : inr(c.balance)}</dd>
                                    </div>
                                </dl>
                            </div>
                        </div>

                        {c.group === "pending" && (
                            <footer className="sv-foot">
                                <span>Did you receive this payment?</span>
                                <div className="sv-actions">
                                    <button
                                        type="button"
                                        className="sv-btn is-yes"
                                        disabled={busyId === c.id}
                                        onClick={() => decide(c.id, "verified")}
                                    >
                                        <CheckCircle2 size={18} /> YES — Payment Successful
                                    </button>
                                    <button
                                        type="button"
                                        className="sv-btn is-no"
                                        disabled={busyId === c.id}
                                        onClick={() => decide(c.id, "rejected")}
                                    >
                                        <XCircle size={18} /> NO — Payment Not Successful
                                    </button>
                                </div>
                            </footer>
                        )}
                    </article>
                ))}
        </div>
    );
}