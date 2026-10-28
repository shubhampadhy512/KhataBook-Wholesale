import React, { useEffect, useState } from "react";
import {
    Search, Plus, Minus, Trash2, ClipboardList,
    X, ChevronDown, CheckCircle2, PackagePlus,
} from "lucide-react";
import "./addHistory.css";

const BACKEND = import.meta.env.VITE_BACKEND_URL;

/* ─── Static data ───────────────────────────────────────────── */
const UNITS = ["kg", "litre", "packet", "bag", "piece", "box"];
const QUICK_NOTES = ["Paid in cash", "Paid by UPI", "Pay on due date", "Urgent delivery", "Bulk order"];

/* ─── Helpers ───────────────────────────────────────────────── */
const cap = (t) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : "-");
const inr = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");
const todayISO = () => new Date().toISOString().slice(0, 10);

const dueDateOf = (iso) => {
    if (!iso) return "";
    const d = new Date(iso + "T00:00:00");
    const next = new Date(d.getFullYear(), d.getMonth() + 1, 10);
    const mm = String(next.getMonth() + 1).padStart(2, "0");
    return `${next.getFullYear()}-${mm}-10`;
};

const fmtDate = (iso) =>
    iso
        ? new Date(iso + "T00:00:00").toLocaleDateString("en-GB", {
            day: "2-digit", month: "short", year: "numeric",
        })
        : "-";

const toMerchant = (m) => ({
    _id: m._id,
    merchantId: m.merchantId,
    username: m.shopName ?? m.username ?? "",
    owner: m.ownerName ?? m.owner ?? "",
    phone: m.phonenumber ?? m.phone ?? "",
});

/*
 * toProduct — normalises backend record.
 * NOTE: id is kept ONLY for React's key prop inside this component.
 * It is never sent to the backend.
 */
const toProduct = (p) => ({
    id: String(p._id ?? p.id),          // React key + sent as Productid
    name: p.productname ?? p.name ?? "",  // backend sends "productname"
    unit: p.unit ?? "kg",
    price: Number(p.price) || 0,
    category: p.category ?? "Other",
    emoji: p.emoji ?? "",
});

// Same product + unit + price = same row in the item list
const keyOf = (name, unit, price) => `${name.toLowerCase()}|${unit}|${price}`;

/* ═══════════════════════════════════════════════════════════════
   Main component
═══════════════════════════════════════════════════════════════ */
export default function AddHistory() {

    /* ── Merchants ────────────────────────────────────────────── */
    const [merchants, setMerchants] = useState([]);
    const [merchantsLoading, setMerchantsLoading] = useState(true);
    const [merchantsError, setMerchantsError] = useState("");
    const [merchant, setMerchant] = useState(null);
    const [merchantOpen, setMerchantOpen] = useState(false);
    const [merchantQuery, setMerchantQuery] = useState("");

    /* ── Products ─────────────────────────────────────────────── */
    const [catalogue, setCatalogue] = useState([]);
    const [catalogueLoading, setCatalogueLoading] = useState(true);
    const [catalogueError, setCatalogueError] = useState("");

    /* ── Product filters ──────────────────────────────────────── */
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("All");
    const [customOpen, setCustomOpen] = useState(false);

    /* ── Credit entry ─────────────────────────────────────────── */
    const [items, setItems] = useState([]);
    const [entryDate, setEntryDate] = useState(todayISO());
    const [notes, setNotes] = useState("");
    const [paid, setPaid] = useState("");

    /* ── UI ───────────────────────────────────────────────────── */
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [toast, setToast] = useState("");

    /* ── Fetch merchants ──────────────────────────────────────── */
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch(`${BACKEND}/merchantsdetails`, {
                    method: "GET", credentials: "include",
                });
                const data = await res.json();
                if (!res.ok) {
                    if (!cancelled) setMerchantsError(data.message || "Could not load merchants.");
                    return;
                }
                if (!cancelled)
                    setMerchants((data.body || data.info || data.merchants || []).map(toMerchant));
            } catch (err) {
                if (!cancelled) setMerchantsError("Can't reach the server. Please try again.");
            } finally {
                if (!cancelled) setMerchantsLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    /* ── Fetch products ───────────────────────────────────────── */
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch(`${BACKEND}/getallproducts`, {
                    method: "GET", credentials: "include",
                });
                const data = await res.json();
                if (!res.ok) {
                    if (!cancelled) setCatalogueError(data.message || "Could not load products.");
                    return;
                }
                const list = data.body || data.info || data.products || [];
                if (!cancelled)
                    setCatalogue(Array.isArray(list) ? list.map(toProduct) : []);
            } catch (err) {
                if (!cancelled) setCatalogueError("Can't reach the server. Please try again.");
            } finally {
                if (!cancelled) setCatalogueLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    /* ── Derived ──────────────────────────────────────────────── */
    const dueDate = dueDateOf(entryDate);
    const total = items.reduce((sum, i) => sum + i.price * (Number(i.qty) || 0), 0);
    const categories = ["All", ...new Set(catalogue.map((p) => p.category).filter(Boolean))];

    const filteredMerchants = merchants.filter((m) =>
        `${m.username} ${m.owner} ${m.phone}`
            .toLowerCase()
            .includes(merchantQuery.toLowerCase())
    );

    const products = catalogue.filter(
        (p) =>
            (category === "All" || p.category === category) &&
            p.name.toLowerCase().includes(search.trim().toLowerCase())
    );

    /* ── Merchant actions ─────────────────────────────────────── */
    const pickMerchant = (m) => {
        setMerchant(m);
        setMerchantOpen(false);
        setMerchantQuery("");
        setError("");
    };

    /* ── Item list actions ────────────────────────────────────── */
    const addItem = (item, qty = 1) => {
        if (!merchant) return setError("Select a merchant before adding products.");
        setError("");
        const key = keyOf(item.name, item.unit, item.price);
        setItems((prev) => {
            const exists = prev.some((l) => l.key === key);
            if (exists)
                return prev.map((l) =>
                    l.key === key ? { ...l, qty: (Number(l.qty) || 0) + qty } : l
                );
            return [...prev, {
                key,
                productId: item.id ?? null,  // backend field: Productid (null for custom items)
                name: item.name,
                unit: item.unit,
                price: item.price,
                qty,
                custom: !!item.custom,
            }];
        });
    };

    const updateItem = (key, changes) =>
        setItems((prev) => prev.map((l) => (l.key === key ? { ...l, ...changes } : l)));

    const changeQty = (key, delta) => {
        const row = items.find((l) => l.key === key);
        updateItem(key, { qty: Math.max(1, (Number(row.qty) || 0) + delta) });
    };

    const typeQty = (key, value) =>
        updateItem(key, { qty: value === "" ? "" : Number(value) });

    const fixQty = (key) => {
        const row = items.find((l) => l.key === key);
        if (!(Number(row.qty) > 0)) updateItem(key, { qty: 1 });
    };

    const removeItem = (key) => setItems((prev) => prev.filter((l) => l.key !== key));

    const openCustomModal = () => {
        if (!merchant) return setError("Select a merchant before adding products.");
        setCustomOpen(true);
    };

    const addQuickNote = (text) =>
        setNotes((prev) => {
            if (prev.split(", ").includes(text)) return prev;
            return prev.trim() ? `${prev.trim()}, ${text}` : text;
        });

    /* ── Save ─────────────────────────────────────────────────── */
    const handleSave = async () => {
        if (saving) return;
        if (!merchant) return setError("Select a merchant first.");
        if (items.length === 0) return setError("Add at least one item to the list.");

        const bad = items.find(
            (l) => !l.name.trim() || !l.unit || !(l.price > 0) || !(Number(l.qty) > 0)
        );
        if (bad)
            return setError(`Check "${bad.name || "unnamed"}": name, unit, price and quantity are required.`);

        if (!entryDate) return setError("Enter a valid entry date.");
        if (Number(paid) < 0) return setError("Paid amount can't be negative.");

        /*
         * Payload — product id is deliberately excluded.
         * Only name, unit, quantity and line total are sent.
         */
        const payload = {
            merchantId: merchant.merchantId,
            items: items.map((l) => ({
                Productid: l.productId,              // required by Mongoose schema
                name: l.name.trim(),
                unit: l.unit,
                quantity: l.qty,
                price: l.price * Number(l.qty),  // line total
            })),
            amount: total,
            notes: notes.trim(),
            paidamount: Number(paid) || 0,
        };

        setError("");
        setSaving(true);
        try {
            const res = await fetch(`${BACKEND}/addtransactionpurchase`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.message || "Could not save the credit entry. Try again.");
                return;
            }

            setItems([]);
            setNotes("");
            setPaid("");
            setToast(`Credit of ${inr(total)} saved for ${cap(merchant.username)}`);
            setTimeout(() => setToast(""), 3500);
        } catch (err) {
            setError("Can't reach the server. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    /* ── Render ───────────────────────────────────────────────── */
    return (
        <div className="ce-page">
            <header className="ce-head">
                <h1 className="ce-title">Add Credit Entry</h1>
                <p className="ce-subtitle">
                    Pick a merchant, add the groceries supplied, and the total is calculated for you.
                </p>
            </header>

            {/* 1. Merchant selector */}
            <div className="ce-card ce-merchant">
                <label className="ce-label">Merchant</label>
                <button type="button" className="ce-select" onClick={() => setMerchantOpen(!merchantOpen)}>
                    {merchant ? (
                        <span>
                            <strong>{cap(merchant.username)}</strong>
                            <span className="ce-muted"> {merchant.phone || "-"}</span>
                        </span>
                    ) : (
                        <span className="ce-placeholder">Search and select a merchant…</span>
                    )}
                    <ChevronDown size={16} />
                </button>

                {merchantOpen && (
                    <div className="ce-dropdown">
                        <div className="ce-dropdown-search">
                            <Search size={16} />
                            <input
                                autoFocus
                                value={merchantQuery}
                                onChange={(e) => setMerchantQuery(e.target.value)}
                                placeholder="Search merchants…"
                            />
                        </div>
                        <ul>
                            {merchantsLoading && (
                                <li className="ce-dropdown-empty">Loading merchants…</li>
                            )}
                            {!merchantsLoading && merchantsError && (
                                <li className="ce-dropdown-empty">{merchantsError}</li>
                            )}
                            {!merchantsLoading && !merchantsError && filteredMerchants.length === 0 && (
                                <li className="ce-dropdown-empty">
                                    {merchants.length === 0 ? "No merchants yet" : "No merchant found"}
                                </li>
                            )}
                            {filteredMerchants.map((m) => (
                                <li key={m._id}>
                                    <button type="button" onClick={() => pickMerchant(m)}>
                                        <strong>{cap(m.username)}</strong>
                                        <span>{m.phone || "-"}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            <div className="ce-grid">
                {/* 2. LEFT: products */}
                <section>
                    <div className="ce-toolbar">
                        <div className="ce-search">
                            <Search size={16} />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search products (rice, dal, oil…)"
                            />
                        </div>
                        <button type="button" className="ce-btn-dashed" onClick={openCustomModal}>
                            <PackagePlus size={16} /> Add Custom Item
                        </button>
                    </div>

                    <div className="ce-chips">
                        {categories.map((c) => (
                            <button
                                key={c}
                                type="button"
                                className={`ce-chip${category === c ? " is-active" : ""}`}
                                onClick={() => setCategory(c)}
                            >
                                {c}
                            </button>
                        ))}
                    </div>

                    {catalogueLoading ? (
                        <p className="ce-empty-box">Loading products…</p>
                    ) : catalogueError ? (
                        <p className="ce-empty-box" style={{ color: "var(--red)" }}>{catalogueError}</p>
                    ) : products.length === 0 ? (
                        <p className="ce-empty-box">
                            No product matches. Use "Add Custom Item" to add it yourself.
                        </p>
                    ) : (
                        <div className="ce-products">
                            {products.map((p) => {
                                const inList = items.find((l) => l.key === keyOf(p.name, p.unit, p.price));
                                return (
                                    <div key={p.id} className="ce-product">
                                        <div className="ce-product-img">
                                            {p.emoji || p.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="ce-product-name">{p.name}</div>
                                        <div className="ce-muted ce-small">{p.category}</div>
                                        <div className="ce-price">
                                            {inr(p.price)}
                                            <span> / {p.unit}</span>
                                        </div>
                                        <button
                                            type="button"
                                            className="ce-btn-primary"
                                            onClick={() => addItem(p)}
                                        >
                                            <Plus size={14} />
                                            {inList ? `Add more (${inList.qty})` : "Add to List"}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* 3. RIGHT: item list + credit terms + total */}
                <aside className="ce-card ce-side">
                    <div className="ce-side-head">
                        <h2><ClipboardList size={18} /> Items added</h2>
                        <span className="ce-badge">
                            {items.length} item{items.length === 1 ? "" : "s"}
                        </span>
                    </div>

                    {items.length === 0 ? (
                        <p className="ce-empty-box">No items added yet. Pick products from the left.</p>
                    ) : (
                        <ul className="ce-items">
                            {items.map((l) => (
                                <li key={l.key}>
                                    <div className="ce-item-top">
                                        <div>
                                            <div className="ce-item-name">{l.name}</div>
                                            <div className="ce-muted ce-small">
                                                {inr(l.price)} / {l.unit}
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            className="ce-icon-btn ce-danger"
                                            onClick={() => removeItem(l.key)}
                                            aria-label={`Remove ${l.name}`}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    <div className="ce-item-bottom">
                                        <div className="ce-qty">
                                            <button type="button" onClick={() => changeQty(l.key, -1)} aria-label="Decrease">
                                                <Minus size={14} />
                                            </button>
                                            <input
                                                type="number"
                                                min="0.1"
                                                step="any"
                                                inputMode="decimal"
                                                value={l.qty}
                                                onChange={(e) => typeQty(l.key, e.target.value)}
                                                onBlur={() => fixQty(l.key)}
                                                aria-label={`Quantity of ${l.name}`}
                                            />
                                            <span className="ce-qty-unit">{l.unit}</span>
                                            <button type="button" onClick={() => changeQty(l.key, 1)} aria-label="Increase">
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                        <strong>{inr(l.price * (Number(l.qty) || 0))}</strong>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}

                    <div className="ce-terms">
                        <label>
                            <span className="ce-label-sm">Entry date</span>
                            <input
                                type="date"
                                value={entryDate}
                                onChange={(e) => setEntryDate(e.target.value)}
                            />
                        </label>

                        <div className="ce-due">
                            <span>Due date (10th of next month)</span>
                            <strong>{fmtDate(dueDate)}</strong>
                        </div>

                        <label>
                            <span className="ce-label-sm">Amount paid (₹)</span>
                            <input
                                type="number"
                                min="0"
                                step="any"
                                inputMode="decimal"
                                value={paid}
                                onChange={(e) => setPaid(e.target.value)}
                                placeholder="0"
                            />
                        </label>

                        <label>
                            <span className="ce-label-sm">Notes</span>
                            <textarea
                                rows={2}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Notes"
                            />
                        </label>

                        <div className="ce-quick-notes">
                            {QUICK_NOTES.map((n) => (
                                <button
                                    key={n}
                                    type="button"
                                    className="ce-quick-note"
                                    onClick={() => addQuickNote(n)}
                                >
                                    {n}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="ce-total">
                        <div className="ce-row">
                            <span>Merchant</span>
                            <strong>{merchant ? cap(merchant.username) : "Not selected"}</strong>
                        </div>
                        <div className="ce-row ce-row-end">
                            <span>Total credit amount</span>
                            <span className="ce-total-amount">{inr(total)}</span>
                        </div>
                    </div>

                    {error && <p role="alert" className="ce-error">{error}</p>}

                    <button
                        type="button"
                        className="ce-save"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? "Saving…" : "Save Credit Entry"}
                    </button>
                </aside>
            </div>

            {customOpen && (
                <CustomItemModal
                    onClose={() => setCustomOpen(false)}
                    onAdd={(item, qty) => {
                        addItem({ ...item, custom: true }, qty);
                        setCustomOpen(false);
                    }}
                />
            )}

            {toast && (
                <div className="ce-toast">
                    <CheckCircle2 size={18} /> {toast}
                </div>
            )}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════
   Custom item modal
═══════════════════════════════════════════════════════════════ */
function CustomItemModal({ onClose, onAdd }) {
    const [name, setName] = useState("");
    const [unit, setUnit] = useState("kg");
    const [price, setPrice] = useState("");
    const [qty, setQty] = useState(1);
    const [err, setErr] = useState("");

    useEffect(() => {
        const handler = (e) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [onClose]);

    const submit = () => {
        if (!name.trim()) return setErr("Enter the product name.");
        if (!(Number(price) > 0)) return setErr("Enter a price greater than 0.");
        if (!(Number(qty) > 0)) return setErr("Enter a quantity greater than 0.");
        onAdd({ name: name.trim(), unit, price: Number(price) }, Number(qty));
    };

    return (
        <div className="ce-overlay" onClick={onClose}>
            <div className="ce-modal" onClick={(e) => e.stopPropagation()}>
                <div className="ce-modal-head">
                    <h3>Add custom item</h3>
                    <button type="button" className="ce-icon-btn" onClick={onClose} aria-label="Close">
                        <X size={18} />
                    </button>
                </div>
                <div className="ce-modal-body">
                    <input
                        autoFocus
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Product name"
                    />
                    <div className="ce-two">
                        <select value={unit} onChange={(e) => setUnit(e.target.value)}>
                            {UNITS.map((u) => <option key={u}>{u}</option>)}
                        </select>
                        <input
                            type="number"
                            min="0"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="Price / unit (₹)"
                        />
                    </div>
                    <input
                        type="number"
                        min="0.1"
                        step="any"
                        value={qty}
                        onChange={(e) => setQty(e.target.value)}
                        placeholder="Quantity"
                    />
                    {err && <p className="ce-error">{err}</p>}
                    <button type="button" className="ce-save" onClick={submit}>
                        Add to list
                    </button>
                </div>
            </div>
        </div>
    );
}