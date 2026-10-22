import React, { useEffect, useMemo, useState } from "react";
import { Search, UserPlus, Eye, BookOpen, MessageSquare, Pencil } from "lucide-react";
import "./merchantsdetials.css";

const BACKEND = import.meta.env.VITE_BACKEND_URL;

const STATUS_OPTIONS = ["All statuses", "Paid", "Overdue", "Pending"];
const AVATAR_TONES = ["green", "orange", "pink", "slate", "rose"];
const STATUS_CLASS = { Paid: "is-paid", Overdue: "is-overdue", Pending: "is-pending" };

const inr = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");
const money = (n) => (n === null || n === undefined ? "-" : inr(n));   // missing amount -> "-"
const show = (v) => (v ? v : "-");                                      // missing text -> "-"
const num = (v) => (v === undefined || v === null || v === "" ? null : Number(v));
const fmtDate = (iso) =>
    new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
const initials = (name = "") =>
    name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
const toneOf = (name = "") => AVATAR_TONES[[...name].reduce((s, c) => s + c.charCodeAt(0), 0) % AVATAR_TONES.length];

// accepts 'paid' | 'Paid' | 'overdue' | 'pending' from the backend
const normalizeStatus = (raw) => {
    const s = String(raw || "").toLowerCase();
    if (s === "paid") return "Paid";
    if (s === "overdue") return "Overdue";
    if (s === "pending") return "Pending";
    return null;
};

// Paid    -> nothing left to pay
// Overdue -> something is left and the due date has passed
// Pending -> something is left and the due date has not come yet
function statusOf(outstanding, nextDue) {
    if (outstanding <= 0) return "Paid";
    if (!nextDue) return "Pending";
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return new Date(nextDue + "T00:00:00") < today ? "Overdue" : "Pending";
}

// the backend sends { message, body: [ { _id, merchantId, storemanID, username, phonenumber, ...later: payment fields } ] }
// Rename the right-hand side when you add the payment fields. Anything missing becomes null and shows "-".
const toRow = (m) => ({
    _id: m._id,
    merchantId: m.merchantId,                       // use this id for ledger / chat / edit
    shop: m.shopName ?? m.username ?? "",
    owner: m.ownerName ?? m.owner ?? "",
    phone: m.phonenumber ?? m.phone ?? "",
    totalCredit: num(m.totalCredit),
    totalPaid: num(m.totalPaid),
    nextDue: m.nextDue ? String(m.nextDue).slice(0, 10) : null,   // 'YYYY-MM-DD'
    status: m.status,                                              // optional
});

/* Props (data is fetched inside the component):
     onView    : (merchant) => void
     onLedger  : (merchant) => void
     onChat    : (merchant) => void
     onEdit    : (merchant) => void */
export default function MerchantsDetails({ onView, onLedger, onChat, onEdit }) {
    const [query, setQuery] = useState("");
    const [status, setStatus] = useState("All statuses");
    const [merchants, setMerchants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");

    // GET all merchants once, when the page opens
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

                if (!cancelled) setMerchants((data.body || data.info || data.merchants || []).map(toRow));
            } catch (error) {
                console.log("error in get merchants", error.message);
                if (!cancelled) setLoadError("Can't reach the server. Please try again.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        getMerchants();
        return () => { cancelled = true; };   // ignore the answer if the page closed first
    }, []);

    // "Add Merchant" -> put the cursor in the top search bar (the input inside .sb-wrap in the layout)
    const onAdd = () => {
        const input = document.querySelector(".sb-wrap .sb input");
        input?.focus();
        input?.select();
    };

    const rows = useMemo(() => {
        const q = query.trim().toLowerCase();
        return merchants
            .map((m) => {
                const hasCredit = m.totalCredit !== null;
                const outstanding = hasCredit ? m.totalCredit - (m.totalPaid || 0) : null;
                const computed = hasCredit ? statusOf(outstanding, m.nextDue) : null;
                return { ...m, outstanding, status: normalizeStatus(m.status) || computed };   // null = no payment details yet
            })
            .filter((m) => status === "All statuses" || m.status === status)
            .filter((m) => !q || [m.shop, m.owner, m.phone].some((v) => (v || "").toLowerCase().includes(q)));
    }, [merchants, query, status]);

    const emptyText = loading
        ? "Loading merchants…"
        : loadError
            ? loadError
            : merchants.length === 0
                ? "No merchants yet. Click “Add Merchant” to add one."
                : "No merchants match your search.";

    return (
        <div className="mc-page">
            <div className="mc-head">
                <div>
                    <h1>Merchants</h1>
                    <p>{merchants.length} merchant{merchants.length === 1 ? "" : "s"} on credit</p>
                </div>
                <button type="button" className="mc-add" onClick={onAdd}>
                    <UserPlus size={18} /> Add Merchant
                </button>
            </div>

            <div className="mc-card">
                <div className="mc-filters">
                    <div className="mc-search">
                        <Search size={18} />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search name, shop or phone"
                            aria-label="Search merchants"
                        />
                    </div>
                    <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
                        {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                    </select>
                </div>

                <div className="mc-scroll">
                    <table className="mc-table">
                        <colgroup>
                            <col />
                            <col className="c-phone" />
                            <col className="c-money" />
                            <col className="c-money" />
                            <col className="c-money" />
                            <col className="c-due" />
                            <col className="c-status" />
                            <col className="c-actions" />
                        </colgroup>
                        <thead>
                            <tr>
                                <th>Merchant</th>
                                <th>Phone</th>
                                <th className="num">Total Amount</th>
                                <th className="num">Total paid</th>
                                <th className="num">Current</th>
                                <th>Next due</th>
                                <th>Status</th>
                                <th className="actions">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 && (
                                <tr><td colSpan={8} className="mc-empty">{emptyText}</td></tr>
                            )}
                            {rows.map((m) => (
                                <tr key={m._id}>
                                    <td>
                                        <div className="mc-merchant">
                                            <span className={`mc-avatar is-${toneOf(m.shop)}`}>{initials(m.shop)}</span>
                                            <div>
                                                <div className="mc-shop" title={m.shop}>{show(m.shop)}</div>
                                                {m.owner && <div className="mc-owner">{m.owner}</div>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className={`mc-phone${m.phone ? "" : " is-empty"}`}>{show(m.phone)}</td>
                                    <td className={`num${m.totalCredit === null ? " is-empty" : ""}`}>{money(m.totalCredit)}</td>
                                    <td className={`num ${m.totalPaid === null ? "is-empty" : "paid"}`}>{money(m.totalPaid)}</td>
                                    <td className={`num ${m.outstanding === null ? "is-empty" : "outstanding"}${m.outstanding > 0 && m.status === "Overdue" ? " is-overdue" : ""}`}>
                                        {money(m.outstanding)}
                                    </td>
                                    <td className={`mc-due${m.nextDue && m.outstanding > 0 ? "" : " is-empty"}`}>
                                        {m.nextDue && m.outstanding > 0 ? fmtDate(m.nextDue) : "-"}
                                    </td>
                                    <td>
                                        {m.status
                                            ? <span className={`mc-pill ${STATUS_CLASS[m.status]}`}><i />{m.status}</span>
                                            : <span className="mc-dash">-</span>}
                                    </td>
                                    <td className="actions">
                                        <div className="mc-actions">
                                            <button type="button" title="View details" aria-label={`View ${m.shop}`} onClick={() => onView?.(m)}><Eye size={18} /></button>
                                            <button type="button" title="Customer ledger" aria-label={`Ledger of ${m.shop}`} onClick={() => onLedger?.(m)}><BookOpen size={18} /></button>
                                            <button type="button" title="Chat" aria-label={`Chat with ${m.shop}`} onClick={() => onChat?.(m)}><MessageSquare size={18} /></button>
                                            <button type="button" title="Edit" aria-label={`Edit ${m.shop}`} onClick={() => onEdit?.(m)}><Pencil size={18} /></button>
                                        </div>
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