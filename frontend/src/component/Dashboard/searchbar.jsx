import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Search, UserPlus, UserCheck, Clock, UserCog, Store, User, CheckCircle2 } from 'lucide-react'
import './searchbar.css'
import { showSuccessToast } from "../toastMessage/SuccessToast.jsx"

const SEARCH_URL = `${import.meta.env.VITE_BACKEND_URL}/rolebased-suggestion`

// logo shown on the left of each suggestion, picked from the role the backend sends
const ROLE_LOGO = { merchant: UserCog, storeman: Store }

/* ---------- Invitation status ----------
   The backend sends one status per person: 'Pending' | 'Approved' | 'Decline'
   (no status = never invited). Everything the button does comes from this table:
     icon      -> symbol shown on the button
     label     -> tooltip / screen-reader text
     clickable -> false = disabled button
   After a decline the plus comes back so the invitation can be sent again. */
const STATUS_UI = {
    none: { icon: UserPlus, label: 'Send invitation', clickable: true },
    Pending: { icon: Clock, label: 'Invitation pending', clickable: false },
    Approved: { icon: UserCheck, label: 'Connected', clickable: false },
    Decline: { icon: UserPlus, label: 'Declined. Send again', clickable: true },
}

// turns whatever the backend sent into one of the keys above
const toStatus = (raw) => {
    const s = String(raw || '').toLowerCase()
    if (s === 'pending') return 'Pending'
    if (s === 'approved') return 'Approved'
    if (s.startsWith('decline')) return 'Decline'     // 'Decline' or 'Declined'
    return 'none'
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
    const [sending, setSending] = useState(false)

    // statuses of invitations sent from this screen: { [userId]: 'Pending' | ... }
    // kept separately so they survive a new search replacing the list
    const [sentStatus, setSentStatus] = useState({})

    const text = query.trim()
    const open = focused && text.length >= 2

    // a status we just got from the send call wins over the one from the search
    const statusOf = (searched) => toStatus(sentStatus[searched._id] ?? searched.status)

    // call the backend 600ms after the user stops typing
    useEffect(() => {
        if (!open) {
            setsearcheds([])
            return
        }
        const timer = setTimeout(async () => {
            try {
                const res = await fetch(`${SEARCH_URL}?searched=${encodeURIComponent(text)}`, {
                    credentials: 'include',
                })
                const data = await res.json()
                setsearcheds(data.info || [])
            } catch {
                setsearcheds([])
            }
        }, 600)
        return () => clearTimeout(timer)
    }, [text, open])

    // + icon clicked: send the invitation
    const handleAdd = async (searched) => {
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
            console.log(data)
            if (!res.ok) {
                throw new Error(data.message || `Request failed (${res.status})`)
            }

            // backend replies { message, invitation: { status: 'Pending', ... } }
            const status = data.invitation?.status || 'Pending'
            setSentStatus((prev) => ({ ...prev, [searched._id]: status }))

            showSuccessToast(data.message, { icon: <CheckCircle2 size={20} color="green" /> })
        } catch (error) {
            console.log('error in send invitation', error.message)
            // show the error to the user here
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

            {open && searcheds.length > 0 && (
                <div className="sb-panel" onMouseDown={(e) => e.preventDefault()}>
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
                                        className={`sb-add${!clickable ? ` is-${status.toLowerCase()}` : ''}`}
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
                </div>
            )}

            {/* blurred page behind the search (portal, so the top bar's blur doesn't trap it) */}
            {focused && createPortal(<div className="sb-overlay" />, document.body)}
        </div>
    )
}

export default SearchBar