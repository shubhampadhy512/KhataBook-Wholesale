import React, { useEffect, useMemo, useRef, useState } from "react";
import { Info, Wallet, CheckCircle2, Plus, X } from "lucide-react";
import "./recordPayment.css";

const BACKEND = import.meta.env.VITE_BACKEND_URL;

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

const toMerchant = (m) => ({
    _id: m._id,
    merchantId: m.merchantId,
    username: m.shopName ?? m.username ?? "",
    phone: m.phone ?? m.phoneNumber ?? m.mobile ?? "",   // adjust to your merchant field name
});

// Placeholder list until you load real recent payments from your backend
const SAMPLE_RECENT = [
    { id: "r1", phone: "98200 11122", merchant: "Raj Grocery Store", method: "UPI", date: "2026-10-10", amount: 12000 },
    { id: "r2", phone: "98190 33445", merchant: "Sai Daily Needs", method: "Cash", date: "2026-10-07", amount: 6500 },
    { id: "r3", phone: "97020 55667", merchant: "Shree Laxmi Mart", method: "UPI", date: "2026-10-05", amount: 4500 },
    { id: "r4", phone: "99870 77889", merchant: "Krishna General Store", method: "UPI", date: "2026-09-25", amount: 6000 },
    { id: "r5", phone: "97020 55667", merchant: "Shree Laxmi Mart", method: "Bank Transfer", date: "2026-09-12", amount: 32000 },
    { id: "r6", phone: "99870 77889", merchant: "Krishna General Store", method: "UPI", date: "2026-08-27", amount: 15000 },
];

export default function RecordPayment() {
    /* ---------- State ---------- */
    const [open, setOpen] = useState(false);

    const [merchants, setMerchants] = useState([]);
    const [merchantId, setMerchantId] = useState("");
    const [amount, setAmount] = useState("");
    const [date, setDate] = useState(todayISO());
    const [method, setMethod] = useState("Cash");
    const [notes, setNotes] = useState("");

    const [recent, setRecent] = useState(SAMPLE_RECENT);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [loadError, setLoadError] = useState("");
    const [toast, setToast] = useState("");

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
            merchantId,
            amount: Number(amount),
            date,
            method,
            notes: notes.trim(),
        };

        setError("");
        setSaving(true);
        try {
            const response = await fetch(`${BACKEND}/recordpayment`, {   // change to your save route
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await response.json();

            if (!response.ok) {
                setError(data.message || "Could not record the payment. Try again.");
                return;
            }

            // add to the recent list, close the modal, clear the form
            setRecent((prev) => [
                {
                    id: data._id || Date.now(),
                    merchant: cap(selected?.username),
                    phone: selected?.phone || "",
                    method,
                    date,
                    amount: Number(amount),
                },
                ...prev,
            ]);
            resetForm();
            setOpen(false);

            setToast(`Payment of ${inr(payload.amount)} recorded`);
            setTimeout(() => setToast(""), 3500);
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
                    <h2 className="rp-section-title">Recent confirmed payments</h2>
                    <span className="rp-count">{recent.length} payments</span>
                </div>

                {recent.length === 0 ? (
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

            {toast && (
                <div className="rp-toast" role="status"><CheckCircle2 size={18} /> {toast}</div>
            )}
        </div>
    );
}