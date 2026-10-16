import { useMemo } from "react";
import "../cssfile/MerchantPayments.css"

const PAYMENTS = [
    {
        id: "PR-1007",
        amount: 8000,
        method: "UPI",
        reference: "adsfasdf",
        submittedAt: "2026-10-17T01:34:00",
        status: "pending",
    },
    {
        id: "PR-1006",
        amount: 8000,
        method: "UPI",
        reference: "asdfasdf",
        submittedAt: "2026-10-16T22:17:00",
        status: "pending",
    },
    {
        id: "PR-1001",
        amount: 12000,
        method: "UPI",
        reference: "UPI123456",
        submittedAt: "2026-10-10T00:44:00",
        status: "verified",
        verifiedAt: "2026-10-10T10:00:00",
    },
];

const STATUS = {
    pending: { label: "Pending Verification", className: "is-pending" },
    verified: { label: "Verified — Successful", className: "is-verified" },
};

const inr = (n) => "₹" + n.toLocaleString("en-IN");

const formatDay = (d) =>
    d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });

const formatTime = (d) =>
    d
        .toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })
        .toLowerCase();

const formatFullDate = (d) =>
    d
        .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
        .replace("Sep ", "Sept ");

export default function MerchantPayments({ payments = PAYMENTS }) {
    // Newest submission first
    const submitted = useMemo(
        () => [...payments].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)),
        [payments]
    );

    const confirmed = useMemo(
        () =>
            payments
                .filter((p) => p.status === "verified")
                .sort((a, b) => (b.verifiedAt || "").localeCompare(a.verifiedAt || "")),
        [payments]
    );

    return (
        <main className="payments">
            <div className="payments__wrap">
                <h1 className="payments__title">My Payments</h1>

                <section className="payments__card">
                    <h2 className="payments__heading">Submitted for verification</h2>
                    {submitted.length === 0 ? (
                        <p className="payments__empty">No payments submitted yet.</p>
                    ) : (
                        <ul className="payments__list">
                            {submitted.map((p) => {
                                const when = new Date(p.submittedAt);
                                const s = STATUS[p.status];
                                return (
                                    <li key={p.id} className="payments__row">
                                        <div>
                                            <div className="payments__line">
                                                <b className="payments__amount">{inr(p.amount)}</b>
                                                <span className="payments__ref">
                                                    {p.id} · {p.method} · {p.reference}
                                                </span>
                                            </div>
                                            <div className="payments__sub">
                                                Submitted {formatDay(when)}, {formatTime(when)}
                                            </div>
                                        </div>
                                        <span className={`payments__pill ${s.className}`}>{s.label}</span>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </section>

                <section className="payments__card">
                    <h2 className="payments__heading">Confirmed payment history</h2>
                    {confirmed.length === 0 ? (
                        <p className="payments__empty">Verified payments will show up here.</p>
                    ) : (
                        <ul className="payments__list">
                            {confirmed.map((p) => (
                                <li key={p.id} className="payments__row">
                                    <div>
                                        <div className="payments__desc">Payment verified ({p.id})</div>
                                        <div className="payments__sub">
                                            {p.method} · {p.reference} · {formatFullDate(new Date(p.verifiedAt))}
                                        </div>
                                    </div>
                                    <b className="payments__paid">{inr(p.amount)}</b>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </main>
    );
}