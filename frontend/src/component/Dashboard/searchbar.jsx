import React, { useEffect, useState } from 'react'
import { Search, UserPlus, UserCheck, Clock, UserCog, Store, User, CheckCircle2 } from 'lucide-react'
import './searchbar.css'
import { showSuccessToast } from "../toastMessage/SuccessToast.jsx"

const SEARCH_URL = `${import.meta.env.VITE_BACKEND_URL}/rolebased-suggestion`

const ROLE_LOGO = { merchant: UserCog, storeman: Store }

/* Backend sends one status per user: 'Pending' | 'Approved' | 'Decline' | null
   null / missing = no invitation exists.
     icon      -> symbol on the button
     label     -> tooltip / screen-reader text
     clickable -> false = disabled button */
const STATUS_UI = {
    none: { icon: UserPlus, label: 'Send invitation', clickable: true },
    Pending: { icon: Clock, label: 'Invitation pending', clickable: false },
    Approved: { icon: UserCheck, label: 'Connected', clickable: false },
    Decline: { icon: UserPlus, label: 'Declined. Send again', clickable: true },
}

// null / undefined / unknown -> 'none' (never 'Pending')
const toStatus = (raw) => {
    const s = String(raw || '').toLowerCase()
    if (s === 'pending') return 'Pending'
    if (s === 'approved') return 'Approved'
    if (s.startsWith('decline')) return 'Decline'
    return 'none'
}

// CSS class for the button, from the status
const buttonClass = (status, clickable) => {
    if (!clickable) return ` is-${status.toLowerCase()}`   // is-pending / is-approved
    if (status === 'Decline') return ' is-decline'          // optional red style
    return ''                                               // plain +
}

function RoleLogo({ role }) {
    const Icon = ROLE_LOGO[role] || User
    return (
        <span className={`sb-logo is-${role || 'other'}`} title={role}>
            <Icon size={18} />
        </span>
    )
}

function SearchBar() {
    const [query, setQuery] = useState('')
    const [focused, setFocused] = useState(false)
    const [searcheds, setsearcheds] = useState([])
    const [searchDone, setSearchDone] = useState(false)
    const [sending, setSending] = useState(false)

    // status returned right after sending, keyed by that user's _id only
    const [sentStatus, setSentStatus] = useState({})

    const text = query.trim()
    const open = focused && text.length >= 2
    const notFound = open && searchDone && searcheds.length === 0

    // each row: just-sent status for THIS user, else the status the backend gave THIS user
    const statusOf = (searched) => toStatus(sentStatus[searched._id] ?? searched.status)

    // call the backend 600ms after the user stops typing
    useEffect(() => {
        setSearchDone(false)
        if (!open) {
            setsearcheds([])
            return
        }
        let cancelled = false
        const timer = setTimeout(async () => {
            try {
                const res = await fetch(`${SEARCH_URL}?searched=${encodeURIComponent(text)}`, {
                    credentials: 'include',
                })
                const data = await res.json().catch(() => ({}))
                if (cancelled) return
                setsearcheds(res.ok ? data.info || [] : [])
                setSentStatus({})   // fresh backend statuses are the source of truth
            } catch {
                if (cancelled) return
                setsearcheds([])
            } finally {
                if (!cancelled) setSearchDone(true)
            }
        }, 600)
        return () => {
            cancelled = true
            clearTimeout(timer)
        }
    }, [text, open])

    // + clicked: send the invitation
    const handleAdd = async (searched) => {
        if (!searched._id) return
        if (sending || !STATUS_UI[statusOf(searched)].clickable) return
        setSending(true)

        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/invitation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(searched),
            })

            const data = await res.json().catch(() => ({}))
            if (!res.ok) {
                throw new Error(data.message || `Request failed (${res.status})`)
            }

            // update only the user who was invited
            const status = data.invitation?.status || 'Pending'
            setSentStatus((prev) => ({ ...prev, [searched._id]: status }))

            showSuccessToast(data.message, { icon: <CheckCircle2 size={20} color="green" /> })
        } catch (error) {
            console.log('error in send invitation', error.message)
        } finally {
            setSending(false)
        }
    }

    // row clicked: fill the box and close
    const handleSelect = (searched) => {
        setQuery(searched.username)
        document.activeElement.blur()
    }

    return (
        <div
            className={`sb-wrap${focused ? ' is-focused' : ''}`}
            onFocus={() => setFocused(true)}
            onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false)
            }}
        >
            <div className="sb">
                <Search size={18} className="sb-icon" />
                <input
                    type="search"
                    autoComplete="off"
                    placeholder="Search…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </div>

            {open && (searcheds.length > 0 || notFound) && (
                <div className="sb-panel" onMouseDown={(e) => e.preventDefault()}>
                    {notFound ? (
                        <div className="sb-empty">User not found</div>
                    ) : (
                        <ul className="sb-list">
                            {searcheds.map((searched) => {
                                const status = statusOf(searched)
                                const { icon: StatusIcon, label, clickable } = STATUS_UI[status]

                                return (
                                    <li key={searched._id} className="sb-option" onClick={() => handleSelect(searched)}>
                                        <RoleLogo role={searched.role} />
                                        <div className="sb-option-main">
                                            <span className="sb-option-title">{searched.username}</span>
                                            <span className="sb-option-sub">{searched.addresses}</span>
                                        </div>
                                        <button
                                            type="button"
                                            className={`sb-add${buttonClass(status, clickable)}`}
                                            title={label}
                                            aria-label={`${label}: ${searched.username}`}
                                            disabled={!clickable || sending}
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleAdd(searched)
                                            }}
                                        >
                                            <StatusIcon size={16} />
                                        </button>
                                    </li>
                                )
                            })}
                        </ul>
                    )}
                </div>
            )}
        </div>
    )
}

export default SearchBar