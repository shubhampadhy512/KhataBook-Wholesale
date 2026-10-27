import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, MessageSquare, Clock, User, Copy, Check } from 'lucide-react';
import './StoreDetails.css';

const API = import.meta.env.VITE_BACKEND_URL;

const EMPTY_MERCHANT = {
    store: '',
    name: '',
    phonenumber: '',
    addresses: '',
    category: '',
    since: '',
};

/* Open every day, 7:00 am to 12:00 am (midnight) */
const OPEN_MIN = 7 * 60;
const CLOSE_MIN = 24 * 60;

const initials = (name = '') =>
    name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join('');

const mapsHref = (addresses) =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addresses)}`;

function CopyButton({ text, label }) {
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            /* clipboard blocked: ignore */
        }
    };

    return (
        <button type="button" className="sd-copy" onClick={copy} aria-label={label}>
            {copied ? <Check size={15} /> : <Copy size={15} />}
            {copied ? 'Copied' : 'Copy'}
        </button>
    );
}

export default function StoreDetails({ chatPath = '/merchant/chat' }) {
    // starts empty; every empty field shows "-"
    const [merchant, setMerchant] = useState(EMPTY_MERCHANT);

    useEffect(() => {
        const controller = new AbortController();

        const fetchStore = async () => {
            try {
                const res = await fetch(`${API}/getdashboarddetails`, {
                    method: 'GET',
                    credentials: 'include',
                    signal: controller.signal,
                });

                const data = await res.json().catch(() => ({}));
                console.log(data)
                if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);

                setMerchant({ ...EMPTY_MERCHANT, ...(data.body?.merchant || {}) });
            } catch (err) {
                // on any failure, keep the empty values ("-")
                if (err.name !== 'AbortError') {
                    console.log('error loading store details', err.message);
                }
            }
        };

        fetchStore();
        return () => controller.abort();
    }, []);

    const now = new Date();
    const minutesNow = now.getHours() * 60 + now.getMinutes();
    const isOpen = minutesNow >= OPEN_MIN && minutesNow < CLOSE_MIN;

    const storeName = merchant.store || '-';
    const subtitle = [
        merchant.category,
        merchant.since ? `Serving since ${merchant.since}` : '',
    ]
        .filter(Boolean)
        .join('. ');

    return (
        <main className="sd-main">
            <div className="sd-inner">
                <header className="sd-hero sd-card">
                    <span className="sd-avatar" aria-hidden="true">
                        {initials(storeName)}
                    </span>
                    <div className="sd-hero-text">
                        <h1 className="sd-name">{storeName}</h1>
                        {subtitle && <p className="sd-category">{subtitle}.</p>}
                    </div>
                    <span className={`sd-status ${isOpen ? 'is-open' : 'is-closed'}`}>
                        <span className="sd-status-dot" aria-hidden="true" />
                        {isOpen ? 'Open until 12:00 am' : 'Closed. Opens 7:00 am'}
                    </span>
                </header>

                <div className="sd-grid">
                    <section className="sd-card sd-section">
                        <h2 className="sd-h2">Contact</h2>

                        <div className="sd-person">
                            <span className="sd-person-icon" aria-hidden="true">
                                <User size={20} />
                            </span>
                            <div className="sd-person-text">
                                <span className="sd-person-name">{merchant.name || '-'}</span>
                                <span className="sd-muted">{merchant.phonenumber || '-'}</span>
                            </div>
                            {merchant.phonenumber && (
                                <a
                                    className="sd-icon-btn"
                                    href={`tel:${merchant.phonenumber}`}
                                    aria-label={`Call ${merchant.name || 'store'}`}
                                >
                                    <Phone size={18} />
                                </a>
                            )}
                        </div>

                        <Link to={chatPath} className="sd-primary">
                            <MessageSquare size={18} />
                            Message the storeman
                        </Link>
                    </section>

                    <section className="sd-card sd-section">
                        <h2 className="sd-h2">
                            <Clock size={18} /> Opening hours
                        </h2>
                        <p className="sd-hours-big">7:00 am to 12:00 am</p>
                        <p className="sd-muted">Open every day of the week.</p>
                    </section>

                    <section className="sd-card sd-section sd-wide">
                        <h2 className="sd-h2">
                            <MapPin size={18} /> addresses
                        </h2>
                        <p className="sd-addresses">{merchant.addresses || '-'}</p>
                        {merchant.addresses && (
                            <span className="sd-links">
                                <a href={mapsHref(merchant.addresses)} target="_blank" rel="noreferrer">
                                    Open in Maps
                                </a>
                                <CopyButton text={merchant.addresses} label="Copy addresses" />
                            </span>
                        )}
                    </section>
                </div>
            </div>
        </main>
    );
}