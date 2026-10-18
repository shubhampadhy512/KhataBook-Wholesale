import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Bell, UserPlus, IndianRupee, MessageSquare, CheckCircle2 } from 'lucide-react'
import './notificationbell.css'
import { showSuccessToast } from "../toastMessage/SuccessToast.jsx"

const API = import.meta.env.VITE_BACKEND_URL

/* ---------- Backend shape (GET /notification) ----------
   { message: 'All unread notifications',
     info: [{ _id, senderId, sendername, receiverId, message,
              type: 'Normal' | 'Payment' | 'Invitation',
              status?: 'Pending' | 'Approved' | 'Decline',
              isRead, createdAt, updatedAt }] }

   Each backend type is configured once in TYPE_CONFIG:
     icon / iconClass -> icon shown on the left
     category         -> which tab it appears in ('payment' | 'normal')
     actionable       -> true = has a status and Approve / Decline buttons
     title            -> heading text                                         */

const TYPE_CONFIG = {
    invitation: {
        icon: UserPlus,
        iconClass: 'invitation',
        category: 'normal',
        actionable: true,
        title: () => 'Store invitation',
    },
    payment: {
        icon: IndianRupee,
        iconClass: 'payment',
        category: 'payment',
        actionable: true,
        title: () => 'Payment approval',
    },
    normal: {
        icon: MessageSquare,
        iconClass: 'message',
        category: 'normal',
        actionable: false,
        title: (n) => (n.sendername ? `Message from ${n.sendername}` : 'Notification'),
    },
}

const TABS = [
    { key: 'payment', label: 'Payment' },
    { key: 'normal', label: 'Normal' },
]

/* Status values sent to / expected by your PATCH route */
const STATUS = {
    pending: 'Pending',
    approved: 'Approved',
    declined: 'Decline',
}

/* Text shown in the top-right corner once a notification is answered */
const RESULT_LABEL = {
    [STATUS.approved]: 'Approved',
    [STATUS.declined]: 'Declined',
}

// whatever the backend sends -> 'Pending' | 'Approved' | 'Decline' (default Pending)
const toStatus = (raw) => {
    const s = String(raw || '').toLowerCase()
    if (s === 'approved') return STATUS.approved
    if (s.startsWith('decline')) return STATUS.declined
    return STATUS.pending
}

const timeAgo = (iso) => {
    const secs = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
    if (secs < 60) return 'just now'
    const mins = Math.floor(secs / 60)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
}

const normalize = (n) => {
    const key = String(n.type || '').toLowerCase()       // 'Invitation' -> 'invitation'
    const cfg = TYPE_CONFIG[key] || TYPE_CONFIG.normal   // unknown types act like Normal

    return {
        id: n._id,
        category: cfg.category,
        icon: cfg.icon,
        iconClass: cfg.iconClass,
        title: cfg.title(n),
        message: n.message,
        time: timeAgo(n.createdAt),
        status: cfg.actionable ? toStatus(n.status) : null,
        read: Boolean(n.isRead),
    }
}

function NotificationBell() {
    const [open, setOpen] = useState(false)
    const [tab, setTab] = useState('payment')
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(false)
    const [busyId, setBusyId] = useState(null)      // notification being approved / declined
    const [error, setError] = useState('')
    const rootRef = useRef(null)

    const unreadTotal = items.filter((n) => !n.read).length
    const unreadIn = (key) => items.filter((n) => n.category === key && !n.read).length
    const visible = items.filter((n) => n.category === tab)

    const loadNotifications = useCallback(async () => {
        setLoading(true)
        setError('')
        try {
            const res = await fetch(`${API}/notification`, {
                method: 'GET',
                credentials: 'include',
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`)
                console.log(data)
            setItems((data.info || []).map(normalize))
        } catch (err) {
            console.log('error loading notifications', err.message)
            setError('Could not load notifications.')
        } finally {
            setLoading(false)
        }
    }, [])

    /* Load once on mount so the badge shows without opening the panel */
    useEffect(() => {
        loadNotifications()
    }, [loadNotifications])


    const isreadnormalmessage = useCallback(async () => {
        console.log('isreadnormalmessage called');

        try {
            const res = await fetch(`${API}/handleseenmessage`, {
                method: 'PATCH',
                credentials: 'include'
            });

            console.log('Response status:', res.status)
            if (!res.ok) {
                console.log('Something went wrong in seen message section');
            }
            const data = res.json()
            setItems((data.modified || []).map(normalize))
        } catch (error) {
            console.log('Error:', error.message);
        }
    }, []);


    /* Close on outside click or Escape */
    useEffect(() => {
        if (!open) return;

        const onPointerDown = (e) => {
            if (
                rootRef.current &&
                !rootRef.current.contains(e.target)
            ) {
                setOpen(false);
                isreadnormalmessage();
            }
        };

        const onKeyDown = (e) => {
            if (e.key === 'Escape') {
                setOpen(false);
                isreadnormalmessage();
            }
        };

        document.addEventListener('mousedown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);

        return () => {
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [open, isreadnormalmessage]);

    /* Refresh the list each time the panel opens (not when it closes) */
    const toggle = () => {
        const next = !open
        setOpen(next)
        if (next) loadNotifications()
    }

    /* Marks only the tab you are looking at (local only for now) */
    const markTabRead = () =>
        setItems((prev) => prev.map((n) => (n.category === tab ? { ...n, read: true } : n)))

    /* Approve / decline: wait for the server, then swap the buttons for the result */
    const respond = async (id, status) => {
        if (busyId) return
        setBusyId(id)
        setError('')
        try {
            const res = await fetch(`${API}/updatenotification/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ status }),
            })

            const data = await res.json().catch(() => ({}))
            if (!res.ok) {
                throw new Error(data.message || `Request failed (${res.status})`)
            }

            // buttons disappear, label appears in the corner, unread dot goes away
            setItems((prev) =>
                prev.map((n) => (n.id === id ? { ...n, status, read: true } : n))
            )

            if (status === STATUS.approved) {
                showSuccessToast(data.message, { icon: <CheckCircle2 size={20} color="green" /> })
            }
        } catch (err) {
            console.log('error responding to notification', err.message)
            setError('Action failed. Please try again.')   // item stays Pending, buttons remain
        } finally {
            setBusyId(null)
        }
    }

    return (
        <div className="nbell-root" ref={rootRef}>
            <button
                type="button"
                className="dl-icon-btn"
                aria-label={`Notifications${unreadTotal ? `, ${unreadTotal} unread` : ''}`}
                aria-haspopup="true"
                aria-expanded={open}
                onClick={toggle}
            >
                <Bell size={20} />
                {unreadTotal > 0 && <span className="dl-badge">{unreadTotal}</span>}
            </button>

            {open && (
                <div className="nbell-panel" role="dialog" aria-label="Notifications">
                    <div className="nbell-head">
                        <h2>Notifications</h2>
                        <button
                            type="button"
                            className="nbell-link"
                            onClick={markTabRead}
                            disabled={unreadIn(tab) === 0}
                        >
                            Mark all read
                        </button>
                    </div>

                    <div className="nbell-tabs" role="tablist">
                        {TABS.map((t) => (
                            <button
                                key={t.key}
                                type="button"
                                role="tab"
                                aria-selected={tab === t.key}
                                className={`nbell-tab ${tab === t.key ? 'is-active' : ''}`}
                                onClick={() => setTab(t.key)}
                            >
                                {t.label}
                                {unreadIn(t.key) > 0 && (
                                    <span className="nbell-tab-count">{unreadIn(t.key)}</span>
                                )}
                            </button>
                        ))}
                    </div>

                    {error && visible.length > 0 && (
                        <p className="nbell-error" role="alert">{error}</p>
                    )}

                    <ul className="nbell-list" key={tab} role="tabpanel">
                        {visible.length === 0 && (
                            <li className="nbell-empty">
                                {loading
                                    ? 'Loading…'
                                    : error || "You're all caught up."}
                            </li>
                        )}

                        {visible.map((n) => {
                            const Icon = n.icon
                            const answered = n.status === STATUS.approved || n.status === STATUS.declined

                            return (
                                <li
                                    key={n.id}
                                    className={`nbell-item ${n.read ? '' : 'is-unread'}`}
                                >
                                    <span className={`nbell-icon nbell-icon--${n.iconClass}`}>
                                        <Icon size={18} />
                                    </span>

                                    <div className="nbell-body">
                                        <div className="nbell-title-row">
                                            <strong>{n.title}</strong>

                                            {/* right corner: result once answered, otherwise the unread dot */}
                                            {answered ? (
                                                <span
                                                    className={`nbell-result nbell-result--${n.status === STATUS.approved ? 'approved' : 'declined'}`}
                                                >
                                                    {RESULT_LABEL[n.status]}
                                                </span>
                                            ) : (
                                                !n.read && <span className="nbell-dot" aria-label="Unread" />
                                            )}
                                        </div>
                                        <p>{n.message}</p>
                                        <span className="nbell-time">{n.time}</span>

                                        {/* buttons only while still pending */}
                                        {n.status === STATUS.pending && (
                                            <div className="nbell-actions">
                                                <button
                                                    type="button"
                                                    className="nbell-btn nbell-btn--approve"
                                                    disabled={busyId === n.id}
                                                    onClick={() => respond(n.id, STATUS.approved)}
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    type="button"
                                                    className="nbell-btn nbell-btn--decline"
                                                    disabled={busyId === n.id}
                                                    onClick={() => respond(n.id, STATUS.declined)}
                                                >
                                                    Decline
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </li>
                            )
                        })}
                    </ul>
                </div>
            )}
        </div>
    )
}

export default NotificationBell