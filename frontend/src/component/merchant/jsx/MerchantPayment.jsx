import { useState } from 'react';
import { Smartphone, Banknote, FileText, Landmark, Check, ChevronRight } from 'lucide-react';
import '../cssfile/SubmitPayment.css';

const METHODS = [
    { id: 'UPI', label: 'UPI', note: 'GPay, PhonePe, Paytm', Icon: Smartphone, ref: 'UPI ref / UTR number' },
    { id: 'Cash', label: 'Cash', note: 'Handed to the storeman', Icon: Banknote, ref: 'Receipt no. (if any)' },
    { id: 'Cheque', label: 'Cheque', note: 'Cheque deposited', Icon: FileText, ref: 'Cheque number' },
    { id: 'Bank transfer', label: 'Bank transfer', note: 'NEFT / IMPS / RTGS', Icon: Landmark, ref: 'Bank reference number' },
];

const formatINR = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const today = () => new Date().toISOString().slice(0, 10);

/*
 * Props (same as before):
 *  balance   - outstanding balance (number)
 *  pending   - amount already pending verification (number)
 *  targets   - [{ value, label, amount }] for "Pay towards"
 *  onSubmit  - async (formData) => void   (throw an Error to show a message)
 */
export default function SubmitPayment({
    balance = 0,
    pending = 0,
    targets = [{ value: 'balance', label: 'Account balance', amount: balance }],
    onSubmit,
}) {
    const [target, setTarget] = useState(targets[0]?.value ?? '');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(today());
    const [method, setMethod] = useState('UPI');
    const [reference, setReference] = useState('');
    const [error, setError] = useState('');
    const [done, setDone] = useState(false);
    const [busy, setBusy] = useState(false);

    const current = targets.find((t) => t.value === target);
    const due = current?.amount ?? balance;
    const picked = METHODS.find((m) => m.id === method);
    const entered = Number(amount) || 0;
    const left = Math.max(due - entered, 0);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setDone(false);

        if (!(entered > 0)) return setError('Enter the amount you paid.');
        if (!reference.trim()) return setError('Add the transaction reference so the storeman can match it.');

        const body = new FormData();
        body.append('target', target);
        body.append('amount', amount);
        body.append('date', date);
        body.append('method', method);
        body.append('reference', reference.trim());

        try {
            setBusy(true);
            await onSubmit?.(body);
            setDone(true);
            setAmount('');
            setReference('');
        } catch (err) {
            setError(err.message || 'Could not send the payment. Try again.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <main className="pay">
            <form className="pay-form" onSubmit={handleSubmit} noValidate>
                <section className="pay-hero">
                    <h1 className="pay-title">Submit payment</h1>

                    {targets.length > 1 && (
                        <select
                            className="pay-target"
                            aria-label="Pay towards"
                            value={target}
                            onChange={(e) => setTarget(e.target.value)}
                        >
                            {targets.map((t) => (
                                <option key={t.value} value={t.value}>
                                    {t.label} ({formatINR(t.amount)})
                                </option>
                            ))}
                        </select>
                    )}

                    <label htmlFor="pay-amount" className="pay-hero-label">
                        Amount paid
                    </label>
                    <div className="pay-amount-row">
                        <span className="pay-rupee" aria-hidden="true">₹</span>
                        <input
                            id="pay-amount"
                            className="pay-amount"
                            type="number"
                            inputMode="decimal"
                            min="0"
                            placeholder="0"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                    </div>

                    <div className="pay-due">
                        <span>
                            You owe <strong>{formatINR(due)}</strong>
                        </span>
                        {due > 0 && (
                            <button type="button" className="pay-fill" onClick={() => setAmount(String(due))}>
                                Pay full amount
                            </button>
                        )}
                    </div>
                    {pending > 0 && <p className="pay-pending">{formatINR(pending)} is waiting for approval</p>}
                </section>

                <section className="pay-sheet">
                    {done && (
                        <div className="pay-note is-ok" role="status">
                            <Check size={18} />
                            <span>Sent. Your balance updates once the storeman verifies it.</span>
                        </div>
                    )}
                    {error && (
                        <div className="pay-note is-err" role="alert">
                            {error}
                        </div>
                    )}

                    <fieldset className="pay-group">
                        <legend className="pay-legend">How did you pay?</legend>
                        <div className="pay-methods" role="radiogroup">
                            {METHODS.map(({ id, label, note, Icon }) => (
                                <button
                                    key={id}
                                    type="button"
                                    role="radio"
                                    aria-checked={method === id}
                                    className={`pay-method ${method === id ? 'is-on' : ''}`}
                                    onClick={() => setMethod(id)}
                                >
                                    <span className="pay-method-icon">
                                        <Icon size={20} />
                                    </span>
                                    <span className="pay-method-text">
                                        <strong>{label}</strong>
                                        <small>{note}</small>
                                    </span>
                                    <span className="pay-dot" aria-hidden="true" />
                                </button>
                            ))}
                        </div>
                    </fieldset>

                    <div className="pay-fields">
                        <label className="pay-field">
                            <span className="pay-legend">Reference</span>
                            <input
                                className="pay-input"
                                type="text"
                                placeholder={picked.ref}
                                value={reference}
                                onChange={(e) => setReference(e.target.value)}
                            />
                        </label>
                        <label className="pay-field">
                            <span className="pay-legend">Paid on</span>
                            <input
                                className="pay-input"
                                type="date"
                                max={today()}
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                            />
                        </label>
                    </div>

                    <div className="pay-summary" aria-live="polite">
                        {entered > 0 ? (
                            <>
                                <span>
                                    {formatINR(entered)} by {method}
                                </span>
                                <span>{left > 0 ? `${formatINR(left)} will remain` : 'Clears your balance'}</span>
                            </>
                        ) : (
                            <span>Enter the amount to see what remains</span>
                        )}
                    </div>

                    <button type="submit" className="pay-submit" disabled={busy}>
                        {busy ? 'Sending…' : 'Send to storeman'}
                        {!busy && <ChevronRight size={20} />}
                    </button>
                </section>
            </form>
        </main>
    );
}