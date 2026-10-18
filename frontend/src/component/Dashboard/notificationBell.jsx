import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Bell, UserPlus, IndianRupee, MessageSquare } from 'lucide-react'
import './notificationbell.css'

const API = import.meta.env.VITE_BACKEND_URL

/* ---------- Backend shape (GET /notification) ----------
   { message: 'All unread notifications',
     info: [{ _id, senderId, sendername, receiverId, message,
              type: 'Invitation', isRead, createdAt, updatedAt }] }

   The UI needs a few extra fields, so every item is converted by
   normalize() below:
     category -> which tab:  'payment' | 'normal'
     status   -> 'pending' shows Approve / Decline, null = info only      */

const ICONS = {
    invitation: UserPlus,
    payment: IndianRupee,
    message: MessageSquare,
}

const TABS = [
    { key: 'payment', label: 'Payment' },
    { key: 'normal', label: 'Normal' },
]

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
    const type = String(n.type || '').toLowerCase()      // 'Invitation' -> 'invitation'
    const known = type in ICONS ? type : 'message'
    const needsAction = type === 'invitation' || type === 'payment'

    const titles = {
        invitation: 'Store invitation',
        payment: 'Payment approval',
        message: n.sendername ? `Message from ${n.sendername}` : 'Notification',
    }

    return {
        id: n._id,
        category: type === 'payment' ? 'payment' : 'normal',
        type: known,
        title: titles[known],
        message: n.message,
        time: timeAgo(n.createdAt),
        status: needsAction ? 'pending' : null,
        read: Boolean(n.isRead),
    }
}

function NotificationBell() {
    const [open, setOpen] = useState(false)
    const [tab, setTab] = useState('payment')
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(false)
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

    /* Close on outside click or Escape */
    useEffect(() => {
        if (!open) return

        const onPointerDown = (e) => {
            if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
        }
        const onKeyDown = (e) => {
            if (e.key === 'Escape') setOpen(false)
        }

        document.addEventListener('mousedown', onPointerDown)
        document.addEventListener('keydown', onKeyDown)
        return () => {
            document.removeEventListener('mousedown', onPointerDown)
            document.removeEventListener('keydown', onKeyDown)
        }
    }, [open])

    /* Refresh the list each time the panel opens (not when it closes) */
    const toggle = () => {
        const next = !open
        setOpen(next)
        if (next) loadNotifications()
    }

    /* Marks only the tab you are looking at (local only for now) */
    const markTabRead = () =>
        setItems((prev) => prev.map((n) => (n.category === tab ? { ...n, read: true } : n)))

    /* Approve / decline: update UI right away, roll back if the server says no */
    const respond = async (id, status) => {
        setItems((prev) =>
            prev.map((n) => (n.id === id ? { ...n, status, read: true } : n))
        )
        try {
            const res = await fetch(`${API}/notification/${id}/${status}`, {
                method: 'POST',
                credentials: 'include',
            })
            if (!res.ok) throw new Error(`Request failed (${res.status})`)
        } catch (err) {
            console.log('error responding to notification', err.message)
            setItems((prev) =>
                prev.map((n) => (n.id === id ? { ...n, status: 'pending' } : n))
            )
            setError('Action failed. Please try again.')
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

                    <ul className="nbell-list" key={tab} role="tabpanel">
                        {visible.length === 0 && (
                            <li className="nbell-empty">
                                {loading
                                    ? 'Loading…'
                                    : error || "You're all caught up."}
                            </li>
                        )}

                        {visible.map((n) => {
                            const Icon = ICONS[n.type]
                            return (
                                <li
                                    key={n.id}
                                    className={`nbell-item ${n.read ? '' : 'is-unread'}`}
                                >
                                    <span className={`nbell-icon nbell-icon--${n.type}`}>
                                        <Icon size={18} />
                                    </span>

                                    <div className="nbell-body">
                                        <div className="nbell-title-row">
                                            <strong>{n.title}</strong>
                                            {!n.read && <span className="nbell-dot" aria-label="Unread" />}
                                        </div>
                                        <p>{n.message}</p>
                                        <span className="nbell-time">{n.time}</span>

                                        {n.status === 'pending' && (
                                            <div className="nbell-actions">
                                                <button
                                                    type="button"
                                                    className="nbell-btn nbell-btn--approve"
                                                    onClick={() => respond(n.id, 'approved')}
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    type="button"
                                                    className="nbell-btn nbell-btn--decline"
                                                    onClick={() => respond(n.id, 'declined')}
                                                >
                                                    Decline
                                                </button>
                                            </div>
                                        )}

                                        {(n.status === 'approved' || n.status === 'declined') && (
                                            <span className={`nbell-result nbell-result--${n.status}`}>
                                                {n.status === 'approved' ? 'Approved' : 'Declined'}
                                            </span>
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