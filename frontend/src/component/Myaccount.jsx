import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Mail, Phone, MapPin, User, Store, UserCog, Send,
    BookOpen, ClipboardList, Package, LogOut, Pencil, X, CheckCircle2,
} from 'lucide-react';
import './MyAccount.css';

const API = import.meta.env.VITE_BACKEND_URL;
const PROFILE_ROUTE = '/user';
const UPDATE_ROUTE = '/updateuserdetails';

const ROLES = {
    merchant: {
        title: 'Merchant',
        Icon: Store,
        showStoreName: false,
        links: [
            { to: '/merchant/submit-payment', label: 'Submit payment', icon: Send },
            { to: '/merchant/daily-history', label: 'View ledger', icon: BookOpen },
        ],
    },
    storeman: {
        title: 'Storeman',
        Icon: UserCog,
        showStoreName: true,
        links: [
            { to: '/storeman/addrecord-payment', label: 'Add credit entry', icon: ClipboardList },
            { to: '/storeman/getallproducts', label: 'Manage products', icon: Package },
        ],
    },
};

const EMPTY_PROFILE = {
    username: '',
    email: '',
    phone: '',
    address: '',
    storename: '',
    role: '',
};

const initials = (name = '') =>
    name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');

const capitalize = (str = '') => str.charAt(0).toUpperCase() + str.slice(1);

const toProfile = (p = {}) => ({
    username: (p.username ?? p.name ?? '').trim(),
    email: p.email ?? '',
    phone: p.phonenumber ?? p.phone ?? '',
    address: p.addresses ?? p.address ?? '',
    storename: (p.storename ?? p.storeName ?? p.store ?? '').trim(),
    role: (p.role ?? '').toLowerCase(),
});

/*
 * Props:
 *  role      - optional fallback ('merchant' | 'storeman'); the role from the backend wins
 *  onLogout  - optional; shows a Sign out button when given
 */
export default function MyAccount({ role = 'merchant', onLogout }) {
    const [profile, setProfile] = useState(EMPTY_PROFILE);
    const [editing, setEditing] = useState(false);
    const [toast, setToast] = useState('');

    // backend role first, then prop, then merchant
    const activeRole = ROLES[profile.role] ? profile.role : ROLES[role] ? role : 'merchant';
    const { title, Icon, showStoreName, links } = ROLES[activeRole];

    useEffect(() => {
        const controller = new AbortController();

        const fetchProfile = async () => {
            try {
                const res = await fetch(`${API}${PROFILE_ROUTE}`, {
                    method: 'GET',
                    credentials: 'include',
                    signal: controller.signal,
                });

                const data = await res.json().catch(() => ({}));
                if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);

                const body = data.body || {};
                setProfile(toProfile(body.user || body.profile || body.merchant || body));
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.log('error loading account', err.message);
                }
            }
        };

        fetchProfile();
        return () => controller.abort();
    }, []);

    const handleSave = async (values) => {
        const res = await fetch(`${API}${UPDATE_ROUTE}`, {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: values.username,
                phonenumber: values.phone,   // backend field name
                addresses: values.address,
                ...(showStoreName ? { storename: values.storename } : {}),
            }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);

        setProfile((prev) => ({ ...prev, ...values }));
        setEditing(false);
        setToast('Profile updated');
        setTimeout(() => setToast(''), 3000);
    };

    const details = [
        { label: 'Username', value: profile.username, icon: User },
        { label: 'Email', value: profile.email, icon: Mail },
        { label: 'Phone number', value: profile.phone ? `+91 ${profile.phone}` : '', icon: Phone },
        { label: 'Address', value: profile.address, icon: MapPin },
    ];

    return (
        <main className="ma-main">
            <div className="ma-inner">
                <header className="ma-hero ma-card">
                    <span className="ma-avatar" aria-hidden="true">
                        {initials(profile.username) || '-'}
                    </span>
                    <div className="ma-hero-text">
                        <h1 className="ma-name">{profile.username ? capitalize(profile.username) : '-'}</h1>
                        <p className="ma-email">{profile.email || '-'}</p>
                    </div>
                    <span className="ma-role">
                        <Icon size={15} /> {title}
                    </span>
                </header>

                <div className="ma-grid">
                    <section className="ma-card ma-section">
                        <div className="ma-section-head">
                            <h2 className="ma-h2">Personal details</h2>
                            <button type="button" className="ma-edit-btn" onClick={() => setEditing(true)}>
                                <Pencil size={15} /> Edit
                            </button>
                        </div>
                        <dl className="ma-facts">
                            {details.map(({ label, value, icon: FactIcon }) => (
                                <div key={label} className="ma-fact">
                                    <dt>
                                        <FactIcon size={16} /> {label}
                                    </dt>
                                    <dd>{value || '-'}</dd>
                                </div>
                            ))}
                        </dl>
                    </section>

                    <div className="ma-col">
                        {showStoreName && (
                            <section className="ma-card ma-section">
                                <h2 className="ma-h2">Your store</h2>
                                <div className="ma-store">
                                    <span className="ma-store-icon" aria-hidden="true">
                                        <Store size={20} />
                                    </span>
                                    <strong>{profile.storename || '-'}</strong>
                                </div>
                            </section>
                        )}

                        <section className="ma-card ma-section">
                            <h2 className="ma-h2">Shortcuts</h2>
                            <div className="ma-links">
                                {links.map(({ to, label, icon: LinkIcon }) => (
                                    <Link key={label} to={to} className="ma-link">
                                        <span className="ma-link-icon" aria-hidden="true">
                                            <LinkIcon size={18} />
                                        </span>
                                        {label}
                                    </Link>
                                ))}
                            </div>
                        </section>

                        {onLogout && (
                            <button type="button" className="ma-logout" onClick={onLogout}>
                                <LogOut size={18} /> Sign out
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {editing && (
                <EditModal
                    profile={profile}
                    showStoreName={showStoreName}
                    onClose={() => setEditing(false)}
                    onSave={handleSave}
                />
            )}

            {toast && (
                <div className="ma-toast" role="status">
                    <CheckCircle2 size={18} /> {toast}
                </div>
            )}
        </main>
    );
}

/* ---------- Edit popup ---------- */
function EditModal({ profile, showStoreName, onClose, onSave }) {
    const [form, setForm] = useState({
        username: profile.username,
        phone: profile.phone,
        address: profile.address,
        storename: profile.storename,
    });
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    const set = (key) => (e) => {
        let value = e.target.value;
        if (key === 'phone') value = value.replace(/\D/g, '').slice(0, 10);
        setForm((f) => ({ ...f, [key]: value }));
    };

    const submit = async (e) => {
        e.preventDefault();
        setError('');

        let storename = form.storename.trim();

        // make sure the store name ends with "Store"
        if (showStoreName && storename && !/store$/i.test(storename)) {
            storename = `${storename} Store`;
        }

        const values = {
            username: form.username.trim(),
            phone: form.phone,
            address: form.address.trim(),
            storename,
        };

        if (!values.username) return setError('Username is required.');
        if (!/^[6-9]\d{9}$/.test(values.phone)) return setError('Enter a valid 10-digit mobile number.');
        if (values.address.length < 5) return setError('Enter your full address.');
        if (showStoreName && !values.storename) {
            return setError('Store name is required.');
        }

        try {
            setBusy(true);
            await onSave(values);
        } catch (err) {
            setError(err.message || 'Could not save. Try again.');
            setBusy(false);
        }
    };

    return (
        <div className="ma-overlay" onClick={onClose}>
            <form className="ma-modal" onClick={(e) => e.stopPropagation()} onSubmit={submit} noValidate>
                <div className="ma-modal-head">
                    <h2>Edit profile</h2>
                    <button type="button" className="ma-icon-btn" onClick={onClose} aria-label="Close">
                        <X size={18} />
                    </button>
                </div>

                <div className="ma-modal-body">
                    <label className="ma-field">
                        <span>Username</span>
                        <input autoFocus value={form.username} onChange={set('username')} />
                    </label>

                    <label className="ma-field">
                        <span>
                            Email <em>cannot be changed</em>
                        </span>
                        <input value={profile.email} disabled />
                    </label>

                    <label className="ma-field">
                        <span>Phone number</span>
                        <input type="tel" inputMode="numeric" value={form.phone} onChange={set('phone')} />
                    </label>

                    {showStoreName && (
                        <label className="ma-field">
                            <span>Store name</span>
                            <input value={form.storename} onChange={set('storename')} />
                        </label>
                    )}

                    <label className="ma-field">
                        <span>Address</span>
                        <textarea rows={3} value={form.address} onChange={set('address')} />
                    </label>

                    {error && (
                        <p className="ma-error" role="alert">
                            {error}
                        </p>
                    )}
                </div>

                <div className="ma-modal-foot">
                    <button type="button" className="ma-ghost" onClick={onClose}>
                        Cancel
                    </button>
                    <button type="submit" className="ma-save" disabled={busy}>
                        {busy ? 'Saving…' : 'Save changes'}
                    </button>
                </div>
            </form>
        </div>
    );
}