import React, { useEffect, useState } from "react";
import { Search, Plus, Minus, Trash2, ClipboardList, X, ChevronDown, CheckCircle2, PackagePlus } from "lucide-react";
import "./addHistory.css";

const BACKEND = import.meta.env.VITE_BACKEND_URL;

/* ---------- Static data ---------- */
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
const CATEGORIES = ["All", ...new Set(CATALOGUE.map((p) => p.category))];
const UNITS = ["kg", "litre", "packet", "bag", "piece", "box"];

// Quick notes: click one and it is added to the Notes box
const QUICK_NOTES = ["Paid in cash", "Paid by UPI", "Pay on due date", "Urgent delivery", "Bulk order"];

/* ---------- Small helpers ---------- */
const cap = (text) => (text ? text.charAt(0).toUpperCase() + text.slice(1) : "-");
const inr = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");
const todayISO = () => new Date().toISOString().slice(0, 10);

// Due date is always the 10th of the month after the entry date
const dueDateOf = (iso) => {
    if (!iso) return "";
    const d = new Date(iso + "T00:00:00");
    const next = new Date(d.getFullYear(), d.getMonth() + 1, 10);
    const mm = String(next.getMonth() + 1).padStart(2, "0");
    return `${next.getFullYear()}-${mm}-10`;
};

const fmtDate = (iso) =>
    iso
        ? new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
        : "-";

// Turn one backend merchant into the shape this page uses
const toMerchant = (m) => ({
    _id: m._id,
    merchantId: m.merchantId,
    username: m.shopName ?? m.username ?? "",
    owner: m.ownerName ?? m.owner ?? "",
    phone: m.phonenumber ?? m.phone ?? "",
});

// Same product + unit + price = same row in the list
const keyOf = (name, unit, price) => `${name.toLowerCase()}|${unit}|${price}`;

export default function AddHistory() {
    /* ---------- State ---------- */
    // merchants
    const [merchants, setMerchants] = useState([]);
    const [merchantsLoading, setMerchantsLoading] = useState(true);
    const [merchantsError, setMerchantsError] = useState("");
    const [merchant, setMerchant] = useState(null);
    const [merchantOpen, setMerchantOpen] = useState(false);
    const [merchantQuery, setMerchantQuery] = useState("");

    // products
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("All");
    const [customOpen, setCustomOpen] = useState(false);

    // credit entry
    const [items, setItems] = useState([]);
    const [entryDate, setEntryDate] = useState(todayISO());
    const [notes, setNotes] = useState("");
    const [paid, setPaid] = useState("");

    // messages
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [toast, setToast] = useState("");

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
                    if (!cancelled) setMerchantsError(data.message || "Could not load merchants.");
                    return;
                }
                if (!cancelled) setMerchants((data.body || data.info || data.merchants || []).map(toMerchant));
            } catch (err) {
                console.log("error in get merchants", err.message);
                if (!cancelled) setMerchantsError("Can't reach the server. Please try again.");
            } finally {
                if (!cancelled) setMerchantsLoading(false);
            }
        };

        getMerchants();
        return () => { cancelled = true; };
    }, []);

    /* ---------- Calculated values ---------- */
    const dueDate = dueDateOf(entryDate);
    const total = items.reduce((sum, i) => sum + i.price * (Number(i.qty) || 0), 0);

    const filteredMerchants = merchants.filter((m) =>
        `${m.username} ${m.owner} ${m.phone}`.toLowerCase().includes(merchantQuery.toLowerCase())
    );

    const products = CATALOGUE.filter(
        (p) =>
            (category === "All" || p.category === category) &&
            p.name.toLowerCase().includes(search.trim().toLowerCase())
    );

    /* ---------- Merchant actions ---------- */
    const pickMerchant = (m) => {
        setMerchant(m);
        setMerchantOpen(false);
        setMerchantQuery("");
        setError("");
    };

    /* ---------- Item list actions ---------- */
    const addItem = (item, qty = 1) => {
        if (!merchant) return setError("Select a merchant before adding products.");
        setError("");

        const key = keyOf(item.name, item.unit, item.price);
        setItems((prev) => {
            const exists = prev.some((l) => l.key === key);
            if (exists) {
                return prev.map((l) => (l.key === key ? { ...l, qty: (Number(l.qty) || 0) + qty } : l));
            }
            return [...prev, { key, name: item.name, unit: item.unit, price: item.price, qty, custom: !!item.custom }];
        });
    };

    // helper: change one row
    const updateItem = (key, changes) =>
        setItems((prev) => prev.map((l) => (l.key === key ? { ...l, ...changes } : l)));

    const changeQty = (key, delta) => {
        const row = items.find((l) => l.key === key);
        updateItem(key, { qty: Math.max(1, (Number(row.qty) || 0) + delta) });
    };

    // typed quantity: empty is allowed while typing, decimals like 2.5 are fine
    const typeQty = (key, value) => updateItem(key, { qty: value === "" ? "" : Number(value) });

    // when the box loses focus, an empty/zero quantity goes back to 1
    const fixQty = (key) => {
        const row = items.find((l) => l.key === key);
        if (!(Number(row.qty) > 0)) updateItem(key, { qty: 1 });
    };

    const removeItem = (key) => setItems((prev) => prev.filter((l) => l.key !== key));

    const openCustomModal = () => {
        if (!merchant) return setError("Select a merchant before adding products.");
        setCustomOpen(true);
    };

    // quick note button: add its text to the Notes box (no repeats)
    const addQuickNote = (text) =>
        setNotes((prev) => {
            if (prev.split(", ").includes(text)) return prev;
            return prev.trim() ? `${prev.trim()}, ${text}` : text;
        });

    /* ---------- Save ---------- */
    const handleSave = async () => {
        if (saving) return;

        // checks (the "paid more than total" check is done by the backend)
        if (!merchant) return setError("Select a merchant first.");
        if (items.length === 0) return setError("Add at least one item to the list.");

        const bad = items.find((l) => !l.name.trim() || !l.unit || !(l.price > 0) || !(Number(l.qty) > 0));
        if (bad) return setError(`Check "${bad.name || "unnamed"}": name, unit, price and quantity are required.`);

        if (!entryDate) return setError("Enter a valid entry date.");
        if (Number(paid) < 0) return setError("Paid amount can't be negative.");

        // data sent to the backend
        const payload = {
            merchantId: merchant.merchantId,
            items: items.map((l) => ({
                name: l.name.trim(),
                unit: l.unit,
                quantity: l.qty,
                price: l.price * Number(l.qty),
            })),
            amount: total,
            notes: notes.trim(),
            paidamount: Number(paid) || 0,
        };

        setError("");
        setSaving(true);
        try {
            const response = await fetch(`${BACKEND}/addtransactionpurchase`, { // change to your save route
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await response.json();

            if (!response.ok) {
                setError(data.message || "Could not save the credit entry. Try again.");
                return;
            }

            // clear only after success
            setItems([]);
            setNotes("");
            setPaid("");
            setToast(`Credit of ${inr(total)} saved for ${cap(merchant.username)}`);
            setTimeout(() => setToast(""), 3500);
        } catch (err) {
            console.log("error in save credit", err.message);
            setError("Can't reach the server. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    /* ---------- Screen ---------- */
    return (
        <div className="ce-page">
            <header className="ce-head">
                <h1 className="ce-title">Add Credit Entry</h1>
                <p className="ce-subtitle">Pick a merchant, add the groceries supplied, and the total is calculated for you.</p>
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
                            {merchantsLoading && <li className="ce-dropdown-empty">Loading merchants…</li>}

                            {!merchantsLoading && merchantsError && <li className="ce-dropdown-empty">{merchantsError}</li>}

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
                        {CATEGORIES.map((c) => (
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
                                        <div className="ce-price">
                                            {inr(p.price)}
                                            <span> / {p.unit}</span>
                                        </div>
                                        <button type="button" className="ce-btn-primary" onClick={() => addItem(p)}>
                                            <Plus size={14} /> {inList ? `Add more (${inList.qty})` : "Add to List"}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* 3. RIGHT: item list, credit terms, total */}
                <aside className="ce-card ce-side">
                    <div className="ce-side-head">
                        <h2><ClipboardList size={18} /> Items added</h2>
                        <span className="ce-badge">{items.length} item{items.length === 1 ? "" : "s"}</span>
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
                            <input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
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
                            <span className="ce-label-sm">Notes </span>
                            <textarea
                                rows={2}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Notes"
                            />
                        </label>

                        <div className="ce-quick-notes">
                            {QUICK_NOTES.map((n) => (
                                <button key={n} type="button" className="ce-quick-note" onClick={() => addQuickNote(n)}>
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

                    <button type="button" className="ce-save" onClick={handleSave} disabled={saving}>
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
                <div className="ce-toast"><CheckCircle2 size={18} /> {toast}</div>
            )}
        </div>
    );
}

/* ---------- Custom item popup ---------- */
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
                    <button type="button" className="ce-icon-btn" onClick={onClose} aria-label="Close">
                        <X size={18} />
                    </button>
                </div>

                <div className="ce-modal-body">
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Product name" />

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

                    <button type="button" className="ce-save" onClick={submit}>Add to list</button>
                </div>
            </div>
        </div>
    );
}