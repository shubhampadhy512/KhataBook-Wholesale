import React, { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'react-toastify'
import { Bell, UserPlus, IndianRupee, MessageSquare, CheckCircle2, XCircle } from 'lucide-react'
import './notificationbell.css'
import { showSuccessToast } from "../toastMessage/SuccessToast.jsx"
import ErrorToastMessage from "../toastMessage/errormessage.jsx"

const API = import.meta.env.VITE_BACKEND_URL

const showErrorToast = (message, options = {}) => toast.error(message, options)

/* ---------- Backend shape (GET /notification) ----------
   { message: 'All unread notifications',
     info: [{ _id, senderId, sendername, receiverId, message,
              type: 'Normal' | 'Payment' | 'Invitation',
              status?: 'Pending' | 'Approved' | 'Decline',
              isRead, createdAt, updatedAt }] }                                */

const TYPE_CONFIG = {
    invitation: {
        icon: UserPlus,
        iconClass: 'invitation',
        actionable: true,
        title: () => 'Store invitation',
    },
    payment: {
        icon: IndianRupee,
        iconClass: 'payment',
        actionable: true,
        title: () => 'Payment approval',
    },
    normal: {
        icon: MessageSquare,
        iconClass: 'message',
        actionable: false,
        title: (n) => (n.sendername ? `Message from ${n.sendername}` : 'Notification'),
    },
}

const STATUS = {
    pending: 'Pending',
    approved: 'Approved',
    declined: 'Decline',
}

const RESULT_LABEL = {
    [STATUS.approved]: 'Approved',
    [STATUS.declined]: 'Declined',
}

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
    const key = String(n.type || '').toLowerCase()
    const cfg = TYPE_CONFIG[key] || TYPE_CONFIG.normal

    return {
        id: n._id,
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
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(false)
    const [busyId, setBusyId] = useState(null)
    const [error, setError] = useState('')
    const rootRef = useRef(null)

    const unreadTotal = items.filter((n) => !n.read).length

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

    useEffect(() => {
        loadNotifications()
    }, [loadNotifications])

    const isreadnormalmessage = useCallback(async () => {
        try {
            const res = await fetch(`${API}/handleseenmessage`, {
                method: 'PATCH',
                credentials: 'include',
            })

            if (!res.ok) {
                console.log('Something went wrong in seen message section')
                return
            }

            loadNotifications()
        } catch (err) {
            console.log('Error:', err.message)
        }
    }, [loadNotifications])

    useEffect(() => {
        if (!open) return

        const onPointerDown = (e) => {
            if (rootRef.current && !rootRef.current.contains(e.target)) {
                setOpen(false)
                isreadnormalmessage()
            }
        }

        const onKeyDown = (e) => {
            if (e.key === 'Escape') {
                setOpen(false)
                isreadnormalmessage()
            }
        }

        document.addEventListener('mousedown', onPointerDown)
        document.addEventListener('keydown', onKeyDown)

        return () => {
            document.removeEventListener('mousedown', onPointerDown)
            document.removeEventListener('keydown', onKeyDown)
        }
    }, [open, isreadnormalmessage])

    const toggle = () => {
        const next = !open
        setOpen(next)
        if (next) loadNotifications()
    }

    /* Marks every notification as read (local only for now) */
    const markAllRead = () =>
        setItems((prev) => prev.map((n) => ({ ...n, read: true })))

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

            // 409 (conflict): show the backend message in the error toast
            if (res.status === 409) {
                showErrorToast(data.message, { icon: <XCircle size={20} color="red" /> })
                loadNotifications()
                return
            }

            if (!res.ok) {
                throw new Error(data.message || `Request failed (${res.status})`)
            }

            setItems((prev) =>
                prev.map((n) => (n.id === id ? { ...n, status, read: true } : n))
            )

            if (status === STATUS.approved) {
                showSuccessToast(data.message, { icon: <CheckCircle2 size={20} color="green" /> })
            }
        } catch (err) {
            console.log('error responding to notification', err.message)
            setError('Action failed. Please try again.')
        } finally {
            setBusyId(null)
        }
    }

    return (
        <div className="nbell-root" ref={rootRef}>
            {/* error toast container, imported as a component */}
            <ErrorToastMessage />

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
                            onClick={markAllRead}
                            disabled={unreadTotal === 0}
                        >
                            Mark all read
                        </button>
                    </div>

                    {error && items.length > 0 && (
                        <p className="nbell-error" role="alert">{error}</p>
                    )}

                    <ul className="nbell-list">
                        {items.length === 0 && (
                            <li className="nbell-empty">
                                {loading ? 'Loading…' : error || "You're all caught up."}
                            </li>
                        )}

                        {items.map((n) => {
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