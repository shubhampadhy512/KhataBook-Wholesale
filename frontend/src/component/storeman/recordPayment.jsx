import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Info, Wallet, CheckCircle2, Plus, X, XCircle } from "lucide-react";
import "./recordPayment.css";
import { toast } from "react-toastify";
import ErrorToastMessage from "../toastMessage/errormessage.jsx";

const BACKEND = import.meta.env.VITE_BACKEND_URL;
const showErrorToast = (message, options = {}) => toast.error(message, options);
const METHODS = ["Cash", "UPI", "Bank Transfer"];

const QUICK_NOTES = [
    "Paid at counter",
    "Partial payment",
    "Advance payment",
    "Old balance cleared",
    "Full settlement",
];

/* ---------- Helpers ---------- */
const cap = (text) => (text ? text.charAt(0).toUpperCase() + text.slice(1) : "-");
const inr = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");
const todayISO = () => new Date().toISOString().slice(0, 10);

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
const fmtDate = (iso) => {
    if (!iso) return "—";
    const [y, m, d] = iso.slice(0, 10).split("-");
    return `${d} ${MONTHS[Number(m) - 1]} ${y}`;
};

const initials = (name = "") =>
    name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join("") || "?";

// Backend status: "Pending" | "Approve" | "Reject" -> pill colour + label
const statusOf = (raw) => {
    const s = String(raw || "").toLowerCase();
    if (s.startsWith("reject") || s.startsWith("declin")) return { key: "rejected", label: "Rejected" };
    if (s.startsWith("approv") || s === "verified" || s === "confirmed") return { key: "approved", label: "Approved" };
    return { key: "pending", label: "Pending" };
};

const toMerchant = (m) => ({
    _id: m._id,
    merchantId: m.merchantId,
    username: m.shopName ?? m.username ?? "",
    phone: m.phonenumber ?? "", // adjust to your merchant field name
});

// Map one payment from your backend to what the table needs (adjust field names if yours differ)
const toPayment = (p) => ({
    id: p._id ?? p.id ?? `${p.merchantId}-${p.date}-${p.amount}`,
    merchant: cap(p.username ?? ""),
    phone: p.phonenumber ?? "",
    method: p.paymentType ?? "-",
    date: p.date ?? p.paymentDate ?? p.createdAt ?? "",
    amount: Number(p.amount ?? 0),
    status: statusOf(p.status),
});

export default function RecordPayment() {
    /* ---------- State ---------- */
    const [open, setOpen] = useState(false);

    const [merchants, setMerchants] = useState([]);
    const [merchantId, setMerchantId] = useState("");
    const [amount, setAmount] = useState("");
    const [date, setDate] = useState(todayISO());
    const [method, setMethod] = useState("Cash");
    const [notes, setNotes] = useState("");

    const [recent, setRecent] = useState([]);
    const [loadingRecent, setLoadingRecent] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [loadError, setLoadError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    const openBtnRef = useRef(null);

    const selected = useMemo(
        () => merchants.find((m) => String(m.merchantId) === String(merchantId)),
        [merchants, merchantId]
    );

    /* ---------- Load merchants once ---------- */
    useEffect(() => {
        let cancelled = false;

        const getMerchants = async () => {
            try {
                const response = await fetch(`${BACKEND}/merchantsdetails`, {
                    method: "GET",
                    credentials: "include",
                });
                const data = await response.json();

                if (!response.ok) {
                    if (!cancelled) setLoadError(data.message || "Could not load merchants.");
                    return;
                }
                if (!cancelled) setMerchants((data.body || data.info || data.merchants || []).map(toMerchant));
            } catch (err) {
                console.log("error in get merchants", err.message);
                if (!cancelled) setLoadError("Can't reach the server. Please try again.");
            }
        };

        getMerchants();
        return () => { cancelled = true; };
    }, []);

    /* ---------- Load payment history ---------- */
    const getPayments = useCallback(async () => {
        try {
            const response = await fetch(`${BACKEND}/getpayment`, { // change to your history route
                method: "GET",
                credentials: "include",
            });
            const data = await response.json();

            if (!response.ok) {
                setLoadError(data.message || "Could not load payment history.");
                return;
            }
            const list = data.body || data.info || data.payments || data.history || [];
            setRecent(list.map(toPayment));
        } catch (err) {
            console.log("error in get payments", err.message);
            setLoadError("Can't reach the server. Please try again.");
        } finally {
            setLoadingRecent(false);
        }
    }, []);

    useEffect(() => {
        getPayments();
    }, [getPayments]);

    /* ---------- Modal behaviour: Esc to close, lock page scroll ---------- */
    const closeModal = () => {
        if (saving) return;
        setOpen(false);
        setError("");
        openBtnRef.current?.focus();
    };

    useEffect(() => {
        if (!open) return;

        const onKey = (e) => {
            if (e.key === "Escape" && !saving) {
                setOpen(false);
                setError("");
            }
        };
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", onKey);

        return () => {
            document.body.style.overflow = prevOverflow;
            window.removeEventListener("keydown", onKey);
        };
    }, [open, saving]);

    const resetForm = () => {
        setMerchantId("");
        setAmount("");
        setDate(todayISO());
        setMethod("Cash");
        setNotes("");
        setError("");
    };

    const addQuickNote = (text) => {
        setNotes((prev) => {
            const current = prev.trim();
            if (!current) return text;
            if (current.toLowerCase().includes(text.toLowerCase())) return prev;
            return `${current}, ${text.charAt(0).toLowerCase()}${text.slice(1)}`;
        });
    };

    const openModal = () => {
        resetForm();
        setOpen(true);
    };

    /* ---------- Save ---------- */
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (saving) return;

        if (!merchantId) return setError("Select a merchant.");
        if (!(Number(amount) > 0)) return setError("Enter a payment amount greater than 0.");
        if (!date) return setError("Enter a valid payment date.");

        const payload = {
            _id: merchantId,
            amount: Number(amount),
            type: method,
            notes: notes.trim(),
        };

        setError("");
        setSaving(true);
        try {
            const response = await fetch(`${BACKEND}/addpayment`, { // change to your save route
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await response.json();

            // 401: pending payments must be verified first -> red error toast
            if (response.status === 401) {
                showErrorToast(data.message || data.meassage || "First check the payment verification", {
                    icon: <XCircle size={20} color="red" />,
                });
                return;
            }

            if (!response.ok) {
                setError(data.message || "Could not record the payment. Try again.");
                return;
            }

            // show the new row right away (counter payments are confirmed immediately)
            setRecent((prev) => [
                {
                    id: data._id || Date.now(),
                    merchant: cap(selected?.username),
                    phone: selected?.phone || "",
                    method,
                    date,
                    amount: Number(amount),
                    status: { key: "approved", label: "Approved" },
                },
                ...prev,
            ]);
            resetForm();
            setOpen(false);
            getPayments(); // refresh the history from the server

            setSuccessMsg(`Payment of ${inr(payload.amount)} recorded`);
            setTimeout(() => setSuccessMsg(""), 3500);
        } catch (err) {
            console.log("error in record payment", err.message);
            setError("Can't reach the server. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    /* ---------- Screen ---------- */
    return (
        <div className="rp-page">
            <ErrorToastMessage />
            <header className="rp-header">
                <div>
                    <h1 className="rp-title">Record payment</h1>
                    <p className="rp-subtitle">Directly record a payment you received at the counter.</p>
                </div>

                <button ref={openBtnRef} type="button" className="rp-add" onClick={openModal}>
                    <Plus size={18} />
                    Add record
                </button>
            </header>

            {loadError && <p role="alert" className="rp-error rp-error-page">{loadError}</p>}

            {/* Recent payments */}
            <section className="rp-recent-card">
                <div className="rp-recent-head">
                    <h2 className="rp-section-title">Recent payments</h2>
                    {!loadingRecent && <span className="rp-count">{recent.length} payments</span>}
                </div>

                {loadingRecent ? (
                    <div className="rp-empty" role="status">
                        <p>Loading payments…</p>
                    </div>
                ) : recent.length === 0 ? (
                    <div className="rp-empty">
                        <p>No payments recorded yet.</p>
                        <button type="button" className="rp-add" onClick={openModal}>
                            <Plus size={18} />
                            Add record
                        </button>
                    </div>
                ) : (
                    <div className="rp-table-wrap">
                        <table className="rp-table">
                            <thead>
                                <tr>
                                    <th>Merchant</th>
                                    <th>Phone number</th>
                                    <th>Method</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                    <th className="rp-num">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recent.map((p) => (
                                    <tr key={p.id}>
                                        <td>
                                            <span className="rp-merchant">
                                                <span className="rp-avatar" aria-hidden="true">{initials(p.merchant)}</span>
                                                {p.merchant}
                                            </span>
                                        </td>
                                        <td className="rp-phone">{p.phone || "—"}</td>
                                        <td><span className="rp-chip">{p.method}</span></td>
                                        <td>{fmtDate(p.date)}</td>
                                        <td>
                                            <span className={`rp-status is-${p.status.key}`}>
                                                <i /> {p.status.label}
                                            </span>
                                        </td>
                                        <td className="rp-num"><strong>{inr(p.amount)}</strong></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* Add record modal */}
            {open && (
                <div
                    className="rp-overlay"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) closeModal();
                    }}
                >
                    <form
                        className="rp-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="rp-modal-title"
                        onSubmit={handleSubmit}
                        noValidate
                    >
                        <div className="rp-modal-head">
                            <h2 id="rp-modal-title">Add payment record</h2>
                            <button type="button" className="rp-close" onClick={closeModal} aria-label="Close">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="rp-modal-body">
                            <div className="rp-info">
                                <Info size={16} />
                                <span>
                                    Payments recorded here are confirmed immediately. Merchant-submitted payments go through Payment Verification instead.
                                </span>
                            </div>

                            <label className="rp-field">
                                <span className="rp-label">Merchant <em>*</em></span>
                                <select
                                    autoFocus
                                    value={merchantId}
                                    onChange={(e) => setMerchantId(e.target.value)}
                                >
                                    <option value="">Select merchant…</option>
                                    {merchants.map((m) => (
                                        <option key={m._id} value={m.merchantId}>{cap(m.username)}</option>
                                    ))}
                                </select>
                            </label>

                            <div className="rp-row">
                                <label className="rp-field">
                                    <span className="rp-label">Payment amount <em>*</em></span>
                                    <div className="rp-amount">
                                        <span aria-hidden="true">₹</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="any"
                                            inputMode="decimal"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            placeholder="0"
                                        />
                                    </div>
                                </label>

                                <label className="rp-field">
                                    <span className="rp-label">Payment date</span>
                                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                                </label>
                            </div>

                            <div className="rp-field">
                                <span className="rp-label">Payment method</span>
                                <div className="rp-methods" role="radiogroup" aria-label="Payment method">
                                    {METHODS.map((m) => (
                                        <button
                                            key={m}
                                            type="button"
                                            role="radio"
                                            aria-checked={method === m}
                                            className={`rp-method${method === m ? " is-active" : ""}`}
                                            onClick={() => setMethod(m)}
                                        >
                                            {m}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <label className="rp-field">
                                <span className="rp-label">Notes</span>
                                <textarea
                                    rows={3}
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Type a note or pick a quick option below"
                                />
                                <span className="rp-quick" role="group" aria-label="Quick notes">
                                    {QUICK_NOTES.map((q) => (
                                        <button
                                            key={q}
                                            type="button"
                                            className="rp-quick-btn"
                                            onClick={() => addQuickNote(q)}
                                        >
                                            + {q}
                                        </button>
                                    ))}
                                </span>
                            </label>

                            {error && <p role="alert" className="rp-error">{error}</p>}
                        </div>

                        <div className="rp-modal-foot">
                            <button type="button" className="rp-cancel" onClick={closeModal} disabled={saving}>
                                Cancel
                            </button>
                            <button type="submit" className="rp-submit" disabled={saving}>
                                <Wallet size={18} />
                                {saving ? "Recording…" : "Record payment"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {successMsg && (
                <div className="rp-toast" role="status"><CheckCircle2 size={18} /> {successMsg}</div>
            )}
        </div>
    );
}