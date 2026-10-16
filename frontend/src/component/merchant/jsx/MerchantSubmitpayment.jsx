import { useEffect, useRef, useState } from "react";
import "../cssfile/MerchantSubmitPayment.css";

const inr = (n) => "₹" + Number(n).toLocaleString("en-IN");

const todayISO = () => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const METHODS = ["UPI", "Cash", "Bank transfer", "Cheque", "Card"];

/**
 * Props
 *  - balance:      outstanding balance in rupees
 *  - pendingTotal: total already submitted and waiting for verification
 *  - onSubmit:     (payment) => void | Promise  — receives the form values
 */
export default function MerchantSubmitPayment({ balance = 8000, pendingTotal = 16000, onSubmit }) {
    const [target, setTarget] = useState("balance");
    const [amount, setAmount] = useState("");
    const [date, setDate] = useState(todayISO());
    const [method, setMethod] = useState("UPI");
    const [reference, setReference] = useState("");
    const [message, setMessage] = useState("");
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState("");
    const [errors, setErrors] = useState({});
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const fileInput = useRef(null);

    // Preview the chosen screenshot, and free the object URL afterwards
    useEffect(() => {
        if (!file) {
            setPreview("");
            return;
        }
        const url = URL.createObjectURL(file);
        setPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    const validate = () => {
        const next = {};
        if (!amount || Number(amount) <= 0) next.amount = "Enter the amount you paid.";
        if (!reference.trim()) next.reference = "Enter the UPI ref, UTR or cheque number.";
        if (!date) next.date = "Choose the payment date.";
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSent(false);
        if (!validate()) return;
        setSending(true);
        try {
            await onSubmit?.({
                target,
                amount: Number(amount),
                date,
                method,
                reference: reference.trim(),
                message: message.trim(),
                screenshot: file,
            });
            setSent(true);
            setAmount("");
            setReference("");
            setMessage("");
            setFile(null);
            if (fileInput.current) fileInput.current.value = "";
        } finally {
            setSending(false);
        }
    };

    return (
        <main className="submit">
            <div className="submit__wrap">
                <h1 className="submit__title">Submit Payment</h1>
                <p className="submit__sub">
                    Tell the storeman about a payment you made. Your balance updates after verification.
                </p>

                <form className="submit__grid" onSubmit={handleSubmit} noValidate>
                    <section className="submit__card submit__form">
                        <div className="submit__field">
                            <label htmlFor="sp-target">Pay towards</label>
                            <select id="sp-target" value={target} onChange={(e) => setTarget(e.target.value)}>
                                <option value="balance">Account balance — {inr(balance)}</option>
                            </select>
                        </div>

                        <div className="submit__two">
                            <div className="submit__field">
                                <label htmlFor="sp-amount">Payment amount (₹) *</label>
                                <input
                                    id="sp-amount"
                                    type="number"
                                    inputMode="decimal"
                                    min="0"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    aria-invalid={!!errors.amount}
                                />
                                {errors.amount && <span className="submit__error">{errors.amount}</span>}
                            </div>
                            <div className="submit__field">
                                <label htmlFor="sp-date">Payment date</label>
                                <input
                                    id="sp-date"
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    aria-invalid={!!errors.date}
                                />
                                {errors.date && <span className="submit__error">{errors.date}</span>}
                            </div>
                        </div>

                        <div className="submit__two">
                            <div className="submit__field">
                                <label htmlFor="sp-method">Payment method</label>
                                <select id="sp-method" value={method} onChange={(e) => setMethod(e.target.value)}>
                                    {METHODS.map((m) => (
                                        <option key={m}>{m}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="submit__field">
                                <label htmlFor="sp-ref">Transaction reference *</label>
                                <input
                                    id="sp-ref"
                                    type="text"
                                    placeholder="UPI ref / UTR / cheque no."
                                    value={reference}
                                    onChange={(e) => setReference(e.target.value)}
                                    aria-invalid={!!errors.reference}
                                />
                                {errors.reference && <span className="submit__error">{errors.reference}</span>}
                            </div>
                        </div>

                        <div className="submit__field">
                            <label htmlFor="sp-file">Payment screenshot (optional)</label>
                            <input
                                id="sp-file"
                                ref={fileInput}
                                className="submit__file"
                                type="file"
                                accept="image/*"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                            />
                            <div className="submit__upload">
                                <button type="button" className="submit__choose" onClick={() => fileInput.current?.click()}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        <path d="M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
                                    </svg>
                                    {file ? "Change image" : "Choose image"}
                                </button>
                                {preview && <img className="submit__preview" src={preview} alt="Payment screenshot preview" />}
                            </div>
                            <span className="submit__hint">Stays in this browser only.</span>
                        </div>

                        <div className="submit__field">
                            <label htmlFor="sp-msg">Message (optional)</label>
                            <textarea id="sp-msg" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} />
                        </div>
                    </section>

                    <aside className="submit__card submit__side">
                        <div className="submit__label">Outstanding balance</div>
                        <div className="submit__balance">{inr(balance)}</div>

                        {pendingTotal > 0 && (
                            <>
                                <p className="submit__pending">{inr(pendingTotal)} already pending verification.</p>
                                <span className="submit__pill">Pending Verification</span>
                            </>
                        )}
                        <p className="submit__note">Only the storeman can approve your payment.</p>

                        <button className="submit__button" type="submit" disabled={sending}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" />
                            </svg>
                            {sending ? "Submitting…" : "Submit for verification"}
                        </button>
                        {sent && (
                            <p className="submit__success" role="status">
                                Submitted for verification. The storeman will review it soon.
                            </p>
                        )}
                    </aside>
                </form>
            </div>
        </main>
    );
}