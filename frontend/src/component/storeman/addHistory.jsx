import React, { useMemo, useState } from "react";
import { Search, Plus, Minus, Trash2, ClipboardList, X, ChevronDown, CheckCircle2, PackagePlus } from "lucide-react";
import "./addHistory.css";

/* ---------- Mock data (used only when no props are passed) ---------- */
const MOCK_MERCHANTS = [
    { _id: "m1", username: "Raj Grocery Store", owner: "Rajesh Kumar", phone: "+91 98765 43210", outstanding: 8000 },
    { _id: "m2", username: "Shree Kirana", owner: "Suresh Patel", phone: "+91 98220 11223", outstanding: 0 },
    { _id: "m3", username: "Anand Provision", owner: "Anand Shah", phone: "+91 99870 55667", outstanding: 15250 },
];

const CATALOGUE = [
    { id: "p1", name: "Basmati Rice", unit: "kg", price: 95, category: "Rice & Grains", emoji: "🍚" },
    { id: "p2", name: "Wheat Flour (Atta)", unit: "kg", price: 42, category: "Rice & Grains", emoji: "🌾" },
    { id: "p3", name: "Sugar", unit: "kg", price: 46, category: "Essentials", emoji: "🧂" },
    { id: "p4", name: "Toor Dal", unit: "kg", price: 150, category: "Pulses", emoji: "🫘" },
    { id: "p5", name: "Moong Dal", unit: "kg", price: 128, category: "Pulses", emoji: "🫛" },
    { id: "p6", name: "Sunflower Oil", unit: "litre", price: 135, category: "Oils", emoji: "🌻" },
    { id: "p7", name: "Groundnut Oil", unit: "litre", price: 190, category: "Oils", emoji: "🥜" },
    { id: "p8", name: "Tea Powder", unit: "packet", price: 260, category: "Essentials", emoji: "🍵" },
    { id: "p9", name: "Iodised Salt", unit: "packet", price: 24, category: "Essentials", emoji: "🧂" },
    { id: "p10", name: "Poha", unit: "kg", price: 58, category: "Rice & Grains", emoji: "🍛" },
    { id: "p11", name: "Chana Dal", unit: "bag", price: 1450, category: "Pulses", emoji: "🫘" },
    { id: "p12", name: "Mustard Oil", unit: "litre", price: 165, category: "Oils", emoji: "🛢️" },
];
const CATEGORIES = ["All", ...Array.from(new Set(CATALOGUE.map((p) => p.category)))];
const UNITS = ["kg", "litre", "packet", "bag", "piece", "box"];

const inr = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");
const todayISO = () => new Date().toISOString().slice(0, 10);
const addDays = (iso, days) => {
    const d = new Date(iso + "T00:00:00");
    d.setDate(d.getDate() + Number(days || 0));
    return d.toISOString().slice(0, 10);
};
const fmtDate = (iso) =>
    iso ? new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "-";

/* Props (all optional):
     merchants : [{ _id, username, owner, phone, outstanding }]  -> from your API / store
     onSave    : async (payload) => void  -> POST the credit entry; throw to signal failure */
export default function AddHistory({ merchants = MOCK_MERCHANTS, onSave }) {
    const [merchant, setMerchant] = useState(null);
    const [merchantOpen, setMerchantOpen] = useState(false);
    const [merchantQuery, setMerchantQuery] = useState("");

    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("All");

    const [items, setItems] = useState([]); // [{ key, name, unit, price, qty, custom }]
    const [customOpen, setCustomOpen] = useState(false);

    const [entryDate, setEntryDate] = useState(todayISO());
    const [creditDays, setCreditDays] = useState(30);
    const [notes, setNotes] = useState("");

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [toast, setToast] = useState("");

    const dueDate = addDays(entryDate, creditDays);
    const total = useMemo(() => items.reduce((s, i) => s + i.price * (Number(i.qty) || 0), 0), [items]);
    const itemCount = items.length;

    const filteredMerchants = merchants.filter((m) =>
        (m.username + " " + (m.owner || "")).toLowerCase().includes(merchantQuery.toLowerCase())
    );
    const products = CATALOGUE.filter(
        (p) =>
            (category === "All" || p.category === category) &&
            p.name.toLowerCase().includes(search.trim().toLowerCase())
    );

    const keyOf = (name, unit, price) => `${name.toLowerCase()}|${unit}|${price}`;

    /* ---------- Item list ---------- */
    const addItem = (item, qty = 1) => {
        if (!merchant) return setError("Select a merchant before adding products.");
        setError("");
        setItems((prev) => {
            const key = keyOf(item.name, item.unit, item.price);
            const found = prev.find((l) => l.key === key);
            if (found) return prev.map((l) => (l.key === key ? { ...l, qty: (Number(l.qty) || 0) + qty } : l));
            return [...prev, { key, name: item.name, unit: item.unit, price: item.price, qty, custom: !!item.custom }];
        });
    };
    const changeQty = (key, delta) =>
        setItems((prev) => prev.map((l) => (l.key === key ? { ...l, qty: Math.max(1, (Number(l.qty) || 0) + delta) } : l)));
    // typed quantity: empty allowed while typing, decimals like 2.5 are fine
    const setQtyValue = (key, value) =>
        setItems((prev) => prev.map((l) => (l.key === key ? { ...l, qty: value === "" ? "" : Number(value) } : l)));
    const fixQty = (key) =>
        setItems((prev) => prev.map((l) => (l.key === key && !(Number(l.qty) > 0) ? { ...l, qty: 1 } : l)));
    const removeItem = (key) => setItems((prev) => prev.filter((l) => l.key !== key));

    /* ---------- Save ---------- */
    const handleSave = async () => {
        if (saving) return;
        if (!merchant) return setError("Select a merchant first.");
        if (items.length === 0) return setError("Add at least one item to the list.");
        const bad = items.find((l) => !l.name.trim() || !l.unit || !(l.price > 0) || !(Number(l.qty) > 0));
        if (bad) return setError(`Check "${bad.name || "unnamed"}": name, unit, price and quantity are required.`);
        if (!entryDate || !(Number(creditDays) >= 0)) return setError("Enter a valid entry date and credit period.");

        const payload = {
            merchantId: merchant._id,
            items: items.map((l) => ({
                name: l.name.trim(), unit: l.unit, unitPrice: l.price, quantity: Number(l.qty), subtotal: l.price * Number(l.qty),
            })),
            totalAmount: total,
            entryDate,
            creditPeriodDays: Number(creditDays),
            dueDate,
            notes: notes.trim(),
        };

        setError("");
        setSaving(true);
        try {
            if (onSave) await onSave(payload);
            else await new Promise((r) => setTimeout(r, 600)); // prototype mode
            setItems([]); // cleared only after success
            setNotes("");
            setToast(`Credit of ${inr(total)} saved for ${merchant.username}`);
            setTimeout(() => setToast(""), 3500);
        } catch (e) {
            setError(e?.message || "Could not save the credit entry. Try again.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="ce-page">
            <h1 className="ce-title">Add Credit Entry</h1>
            <p className="ce-subtitle">Pick a merchant, add the groceries supplied, and the total is calculated for you.</p>

            {/* Merchant selector */}
            <div className="ce-card ce-merchant">
                <label className="ce-label">Merchant</label>
                <button type="button" className="ce-select" onClick={() => setMerchantOpen((o) => !o)}>
                    {merchant ? (
                        <span>
                            <strong>{merchant.username}</strong>
                            <span className="ce-muted"> {merchant.owner} · {merchant.phone} · Outstanding {inr(merchant.outstanding)}</span>
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
                            <input autoFocus value={merchantQuery} onChange={(e) => setMerchantQuery(e.target.value)} placeholder="Search merchants…" />
                        </div>
                        <ul>
                            {filteredMerchants.length === 0 && <li className="ce-dropdown-empty">No merchant found</li>}
                            {filteredMerchants.map((m) => (
                                <li key={m._id}>
                                    <button
                                        type="button"
                                        onClick={() => { setMerchant(m); setMerchantOpen(false); setMerchantQuery(""); setError(""); }}
                                    >
                                        <strong>{m.username}</strong>
                                        <span>{m.owner} · {m.phone}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            <div className="ce-grid">
                {/* LEFT: product catalogue */}
                <section>
                    <div className="ce-toolbar">
                        <div className="ce-search">
                            <Search size={16} />
                            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products (rice, dal, oil…)" />
                        </div>
                        <button
                            type="button"
                            className="ce-btn-dashed"
                            onClick={() => (merchant ? setCustomOpen(true) : setError("Select a merchant before adding products."))}
                        >
                            <PackagePlus size={16} /> Add Custom Item
                        </button>
                    </div>

                    <div className="ce-chips">
                        {CATEGORIES.map((c) => (
                            <button key={c} type="button" className={`ce-chip${category === c ? " is-active" : ""}`} onClick={() => setCategory(c)}>
                                {c}
                            </button>
                        ))}
                    </div>

                    {products.length === 0 ? (
                        <p className="ce-empty-box">No product matches. Use “Add Custom Item” to add it yourself.</p>
                    ) : (
                        <div className="ce-products">
                            {products.map((p) => {
                                const inList = items.find((l) => l.key === keyOf(p.name, p.unit, p.price));
                                return (
                                    <div key={p.id} className="ce-product">
                                        <div className="ce-product-img">{p.emoji}</div>
                                        <div className="ce-product-name">{p.name}</div>
                                        <div className="ce-muted ce-small">{p.category}</div>
                                        <div className="ce-price">{inr(p.price)}<span> / {p.unit}</span></div>
                                        <button type="button" className="ce-btn-primary" onClick={() => addItem(p)}>
                                            <Plus size={14} /> {inList ? `Add more (${inList.qty})` : "Add to List"}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* RIGHT: item list + credit details */}
                <aside className="ce-card ce-side">
                    <div className="ce-side-head">
                        <h2><ClipboardList size={18} /> Items added</h2>
                        <span className="ce-badge">{itemCount} item{itemCount === 1 ? "" : "s"}</span>
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
                                            <div className="ce-muted ce-small">{inr(l.price)} / {l.unit}</div>
                                        </div>
                                        <button type="button" className="ce-icon-btn ce-danger" onClick={() => removeItem(l.key)} aria-label={`Remove ${l.name}`}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    <div className="ce-item-bottom">
                                        <div className="ce-qty">
                                            <button type="button" onClick={() => changeQty(l.key, -1)} aria-label="Decrease"><Minus size={14} /></button>
                                            <input
                                                type="number" min="0.1" step="any" inputMode="decimal"
                                                value={l.qty}
                                                onChange={(e) => setQtyValue(l.key, e.target.value)}
                                                onBlur={() => fixQty(l.key)}
                                                aria-label={`Quantity of ${l.name}`}
                                            />
                                            <span className="ce-qty-unit">{l.unit}</span>
                                            <button type="button" onClick={() => changeQty(l.key, 1)} aria-label="Increase"><Plus size={14} /></button>
                                        </div>
                                        <strong>{inr(l.price * (Number(l.qty) || 0))}</strong>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}

                    <div className="ce-terms">
                        <div className="ce-two">
                            <label>
                                <span className="ce-label-sm">Entry date</span>
                                <input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
                            </label>
                            <label>
                                <span className="ce-label-sm">Credit period (days)</span>
                                <input type="number" min="0" value={creditDays} onChange={(e) => setCreditDays(e.target.value)} />
                            </label>
                        </div>
                        <div className="ce-due"><span>Due date</span><strong>{fmtDate(dueDate)}</strong></div>
                        <label>
                            <span className="ce-label-sm">Notes (optional)</span>
                            <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" />
                        </label>
                    </div>

                    <div className="ce-total">
                        <div className="ce-row"><span>Merchant</span><strong>{merchant?.username || "Not selected"}</strong></div>
                        <div className="ce-row ce-row-end">
                            <span>Total credit amount</span>
                            <span className="ce-total-amount">{inr(total)}</span>
                        </div>
                    </div>

                    {error && <p role="alert" className="ce-error">{error}</p>}

                    <button type="button" className="ce-save" onClick={handleSave} disabled={saving}>
                        {saving ? "Saving…" : "Save Credit Entry"}
                    </button>
                </aside>
            </div>

            {customOpen && (
                <CustomItemModal
                    onClose={() => setCustomOpen(false)}
                    onAdd={(item, qty) => { addItem({ ...item, custom: true }, qty); setCustomOpen(false); }}
                />
            )}

            {toast && (
                <div className="ce-toast"><CheckCircle2 size={18} /> {toast}</div>
            )}
        </div>
    );
}

/* ---------- Custom item modal ---------- */
function CustomItemModal({ onClose, onAdd }) {
    const [name, setName] = useState("");
    const [unit, setUnit] = useState("kg");
    const [price, setPrice] = useState("");
    const [qty, setQty] = useState(1);
    const [err, setErr] = useState("");

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
                    <button type="button" className="ce-icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button>
                </div>
                <div className="ce-modal-body">
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Product name" />
                    <div className="ce-two">
                        <select value={unit} onChange={(e) => setUnit(e.target.value)}>
                            {UNITS.map((u) => <option key={u}>{u}</option>)}
                        </select>
                        <input type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Price / unit (₹)" />
                    </div>
                    <input type="number" min="0.1" step="any" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="Quantity" />
                    {err && <p className="ce-error">{err}</p>}
                    <button type="button" className="ce-save" onClick={submit}>Add to list</button>
                </div>
            </div>
        </div>
    );
}