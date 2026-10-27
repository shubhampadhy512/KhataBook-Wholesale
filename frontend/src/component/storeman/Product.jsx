import { useEffect, useState, useCallback } from "react";
import {
    Search, Plus, Pencil, Trash2, X, CheckCircle2, PackageOpen,
} from "lucide-react";
import "./ProductManager.css";

/* ─── Config ────────────────────────────────────────────────── */
const BACKEND = import.meta.env.VITE_BACKEND_URL;

const ROUTES = {
    list: "/getproducts",
    add: "/addproduct",
    update: (id) => `/updateproduct/${id}`,
    remove: (id) => `/deleteproduct/${id}`,
};

const UNITS = ["kg", "litre", "packet", "bag", "piece", "box"];

/* ─── Helpers ───────────────────────────────────────────────── */
const inr = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");

const request = async (path, method = "GET", body) => {
    const res = await fetch(`${BACKEND}${path}`, {
        method,
        credentials: "include",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
    return data;
};

const toProduct = (p) => ({
    id: String(p._id ?? p.id),
    name: p.name ?? "",
    category: p.category ?? "",
    unit: p.unit ?? "kg",
    price: Number(p.price) || 0,
    emoji: p.emoji ?? "",
});

/* ═══════════════════════════════════════════════════════════════
   Main component
═══════════════════════════════════════════════════════════════ */
export default function ProductManager() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("All");
    const [editor, setEditor] = useState(null);   // null | { product: null | {...} }
    const [deleting, setDeleting] = useState(null);   // null | product
    const [toast, setToast] = useState("");

    /* ── Data loading ─────────────────────────────────────────── */
    const loadProducts = useCallback(async () => {
        try {
            const data = await request(ROUTES.list);
            const list = data.body || data.info || data.products || [];
            setProducts(Array.isArray(list) ? list.map(toProduct) : []);
            setLoadError("");
        } catch (err) {
            setLoadError(err.message || "Can't reach the server. Please try again.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadProducts(); }, [loadProducts]);

    /* ── Toast ────────────────────────────────────────────────── */
    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(""), 3000);
    };

    /* ── Derived data ─────────────────────────────────────────── */
    const categories = ["All", ...new Set(products.map((p) => p.category).filter(Boolean))];

    const visible = products.filter(
        (p) =>
            (category === "All" || p.category === category) &&
            p.name.toLowerCase().includes(search.trim().toLowerCase()),
    );

    /* ── Save (add / update) ──────────────────────────────────── */
    const handleSave = async (values, existing) => {
        const clash = products.find(
            (p) =>
                p.id !== existing?.id &&
                p.name.toLowerCase() === values.name.toLowerCase() &&
                p.unit === values.unit,
        );
        if (clash) throw new Error(`"${clash.name}" per ${clash.unit} already exists.`);

        if (existing) {
            await request(ROUTES.update(existing.id), "PUT", values);
        } else {
            await request(ROUTES.add, "POST", values);
        }
        await loadProducts();
        setEditor(null);
        showToast(existing ? `${values.name} updated` : `${values.name} added`);
    };

    /* ── Delete ───────────────────────────────────────────────── */
    const handleDelete = async () => {
        await request(ROUTES.remove(deleting.id), "DELETE");
        await loadProducts();
        showToast(`${deleting.name} deleted`);
        setDeleting(null);
    };

    /* ── Render ───────────────────────────────────────────────── */
    return (
        <main className="pm-main">
            <div className="pm-inner">

                {/* Header */}
                <header className="pm-head">
                    <div>
                        <h1 className="pm-title">Manage products</h1>
                        <p className="pm-sub">Add, edit or remove the products you supply.</p>
                    </div>
                    <button
                        type="button"
                        className="pm-primary"
                        onClick={() => setEditor({ product: null })}
                    >
                        <Plus size={18} /> Add product
                    </button>
                </header>

                {/* Card */}
                <div className="pm-card">

                    {/* Toolbar */}
                    <div className="pm-toolbar">
                        <div className="pm-search">
                            <Search size={16} />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search products"
                                aria-label="Search products"
                            />
                        </div>
                        <span className="pm-count">
                            {visible.length} of {products.length} product{products.length !== 1 ? "s" : ""}
                        </span>
                    </div>

                    {/* Category chips — only when 3+ categories exist */}
                    {categories.length > 2 && (
                        <div className="pm-chips">
                            {categories.map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    className={`pm-chip${category === c ? " is-on" : ""}`}
                                    onClick={() => setCategory(c)}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Table */}
                    {loading ? (
                        <div className="pm-empty">
                            <p>Loading products…</p>
                        </div>
                    ) : loadError ? (
                        <div className="pm-empty">
                            <p style={{ color: "var(--red)" }}>{loadError}</p>
                        </div>
                    ) : visible.length === 0 ? (
                        <div className="pm-empty">
                            <PackageOpen size={28} />
                            <p>
                                {products.length === 0
                                    ? "No products yet. Add your first one."
                                    : "No product matches your search."}
                            </p>
                        </div>
                    ) : (
                        <ul className="pm-list" role="list">
                            <li className="pm-row pm-row-head" aria-hidden="true">
                                <span>Product</span>
                                <span>Category</span>
                                <span>Price</span>
                                <span />
                            </li>
                            {visible.map((p) => (
                                <li key={p.id} className="pm-row">
                                    <div className="pm-product">
                                        <span className="pm-emoji" aria-hidden="true">
                                            {p.emoji || p.name.charAt(0).toUpperCase() || "—"}
                                        </span>
                                        <span className="pm-name">{p.name || "—"}</span>
                                    </div>
                                    <span className="pm-muted">{p.category || "—"}</span>
                                    <span className="pm-price">
                                        {inr(p.price)}
                                        <span className="pm-price-unit"> / {p.unit}</span>
                                    </span>
                                    <div className="pm-actions">
                                        <button
                                            type="button"
                                            className="pm-icon-btn"
                                            onClick={() => setEditor({ product: p })}
                                            aria-label={`Edit ${p.name}`}
                                        >
                                            <Pencil size={15} />
                                        </button>
                                        <button
                                            type="button"
                                            className="pm-icon-btn is-danger"
                                            onClick={() => setDeleting(p)}
                                            aria-label={`Delete ${p.name}`}
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* Add / Edit modal */}
            {editor && (
                <ProductModal
                    product={editor.product}
                    categories={categories.filter((c) => c !== "All")}
                    onClose={() => setEditor(null)}
                    onSave={handleSave}
                />
            )}

            {/* Delete confirm modal */}
            {deleting && (
                <ConfirmModal
                    product={deleting}
                    onClose={() => setDeleting(null)}
                    onConfirm={handleDelete}
                />
            )}

            {/* Toast */}
            {toast && (
                <div className="pm-toast" role="status">
                    <CheckCircle2 size={18} /> {toast}
                </div>
            )}
        </main>
    );
}

/* ═══════════════════════════════════════════════════════════════
   Add / Edit modal
═══════════════════════════════════════════════════════════════ */
function ProductModal({ product, categories, onClose, onSave }) {
    const [form, setForm] = useState({
        name: product?.name ?? "",
        category: product?.category ?? "",
        unit: product?.unit ?? "kg",
        price: product?.price ?? "",
        emoji: product?.emoji ?? "",
    });
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

    /* Close on Escape */
    useEffect(() => {
        const handler = (e) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [onClose]);

    const submit = async (e) => {
        e.preventDefault();
        setError("");

        const values = {
            name: form.name.trim(),
            category: form.category.trim(),
            unit: form.unit,
            price: Number(form.price),
            emoji: form.emoji.trim(),
        };

        if (values.name.length < 2) return setError("Enter the product name (at least 2 characters).");
        if (!values.category) return setError("Enter a category, e.g. Pulses.");
        if (!(values.price > 0)) return setError("Enter a price greater than 0.");

        try {
            setBusy(true);
            await onSave(values, product);
        } catch (err) {
            setError(err.message || "Could not save. Try again.");
            setBusy(false);
        }
    };

    return (
        <div className="pm-overlay" onClick={onClose}>
            <form
                className="pm-modal"
                onClick={(e) => e.stopPropagation()}
                onSubmit={submit}
                noValidate
            >
                <div className="pm-modal-head">
                    <h2>{product ? "Edit product" : "Add product"}</h2>
                    <button type="button" className="pm-icon-btn" onClick={onClose} aria-label="Close">
                        <X size={18} />
                    </button>
                </div>

                <div className="pm-modal-body">
                    <label className="pm-field">
                        <span>Product name</span>
                        <input
                            autoFocus
                            value={form.name}
                            onChange={set("name")}
                            placeholder="e.g. Basmati Rice"
                        />
                    </label>

                    <div className="pm-two">
                        <label className="pm-field">
                            <span>Category</span>
                            <input
                                list="pm-cat-list"
                                value={form.category}
                                onChange={set("category")}
                                placeholder="e.g. Pulses"
                            />
                            <datalist id="pm-cat-list">
                                {categories.map((c) => <option key={c} value={c} />)}
                            </datalist>
                        </label>
                        <label className="pm-field">
                            <span>Emoji <em>optional</em></span>
                            <input
                                value={form.emoji}
                                onChange={set("emoji")}
                                maxLength={4}
                                placeholder="🍚"
                            />
                        </label>
                    </div>

                    <div className="pm-two">
                        <label className="pm-field">
                            <span>Unit</span>
                            <select value={form.unit} onChange={set("unit")}>
                                {UNITS.map((u) => <option key={u}>{u}</option>)}
                            </select>
                        </label>
                        <label className="pm-field">
                            <span>Price per unit (₹)</span>
                            <input
                                type="number"
                                min="0"
                                step="any"
                                inputMode="decimal"
                                value={form.price}
                                onChange={set("price")}
                                placeholder="0"
                            />
                        </label>
                    </div>

                    {error && <p className="pm-error" role="alert">{error}</p>}
                </div>

                <div className="pm-modal-foot">
                    <button type="button" className="pm-ghost" onClick={onClose}>Cancel</button>
                    <button type="submit" className="pm-primary" disabled={busy}>
                        {busy ? "Saving…" : product ? "Save changes" : "Add product"}
                    </button>
                </div>
            </form>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════
   Delete confirm modal
═══════════════════════════════════════════════════════════════ */
function ConfirmModal({ product, onClose, onConfirm }) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const handler = (e) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [onClose]);

    const confirm = async () => {
        try {
            setBusy(true);
            await onConfirm();
        } catch (err) {
            setError(err.message || "Could not delete. Try again.");
            setBusy(false);
        }
    };

    return (
        <div className="pm-overlay" onClick={onClose}>
            <div
                className="pm-modal pm-modal-sm"
                onClick={(e) => e.stopPropagation()}
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="del-heading"
            >
                <div className="pm-modal-body" style={{ paddingTop: 22 }}>
                    <h2 id="del-heading" style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 4 }}>
                        Delete this product?
                    </h2>
                    <p>
                        <strong>{product.name}</strong> will be removed from your product list.
                        Past credit entries are not affected.
                    </p>
                    {error && <p className="pm-error" role="alert">{error}</p>}
                </div>
                <div className="pm-modal-foot">
                    <button type="button" className="pm-ghost" onClick={onClose}>Cancel</button>
                    <button type="button" className="pm-danger" onClick={confirm} disabled={busy}>
                        {busy ? "Deleting…" : "Delete"}
                    </button>
                </div>
            </div>
        </div>
    );
}