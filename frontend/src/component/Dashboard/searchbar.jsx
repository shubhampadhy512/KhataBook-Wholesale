import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Search, UserPlus, UserCog, Store, User } from 'lucide-react'
import './searchbar.css'

const SEARCH_URL = `${import.meta.env.VITE_BACKEND_URL}/rolebased-suggestion`

// logo shown on the left of each suggestion, picked from the role the backend sends
const ROLE_LOGO = { merchant: UserCog, storeman: Store }

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

    const text = query.trim()
    const open = focused && text.length >= 2

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

    // + icon clicked: put your add / invite logic here
    const [sending, setSending] = useState(false)

    const handleAdd = async (searched) => {
        if (sending) return            // stop double-clicks sending twice
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

            // success: show a toast, close the search dropdown, etc.
            console.log('Invitation sent', data)
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
                <Search size={18} />
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
                        {searcheds.map((searched) => (
                            <li key={searched._id} className="sb-option" onClick={() => handleSelect(searched)}>
                                <RoleLogo role={searched.role} />
                                <div className="sb-option-main">
                                    <span className="sb-option-title">{searched.username}</span>
                                    <span className="sb-option-sub">{searched.addresses}</span>
                                </div>
                                <button
                                    type="button"
                                    className="sb-add"
                                    title="Add"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleAdd(searched)
                                    }}
                                >
                                    <UserPlus size={16} />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* blurred page behind the search (portal, so the top bar's blur doesn't trap it) */}
            {focused && createPortal(<div className="sb-overlay" />, document.body)}
        </div>
    )
}

export default SearchBar