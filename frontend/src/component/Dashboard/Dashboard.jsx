import React, { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Bell, Search } from 'lucide-react'
import './dashboardlayout.css'
import { Navbar } from '../../FileAddresses'

/* ---------- Replace with the logged-in user (redux / API) ---------- */
const user = { name: 'Rajesh Kumar', store: 'Raj Grocery Store' }
const notificationCount = 0

const getInitials = (name) =>
    name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0].toUpperCase())
        .join('')

function DashboardLayout() {
    const { pathname } = useLocation()
    const role = pathname.startsWith('/storeman') ? 'storeman' : 'merchant'
    console.log(role);

    const [query, setQuery] = useState('')

    const handleSearch = (e) => {
        e.preventDefault()
        // TODO: run your search (navigate with ?q=, call an API, etc.)
        console.log('Search:', query.trim())
    }

    return (
        <div className="dl-shell">
            <Navbar role={role} />
            <div className="dl-main">
                <header className="dl-topbar">
                    <form className="dl-search" role="search" onSubmit={handleSearch}>
                        <Search size={18} aria-hidden="true" />
                        <input
                            type="search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={
                                role === 'storeman'
                                    ? 'Search merchants, entries…'
                                    : 'Search ledger, payments…'
                            }
                            aria-label="Search"
                        />
                    </form>

                    <div className="dl-actions">
                        <button
                            type="button"
                            className="dl-icon-btn"
                            aria-label={`Notifications${notificationCount ? `, ${notificationCount} unread` : ''}`}
                        >
                            <Bell size={20} />
                            {notificationCount > 0 && (
                                <span className="dl-badge">{notificationCount}</span>
                            )}
                        </button>

                        <span className="dl-divider" aria-hidden="true" />

                        <div className="dl-user">
                            <span className="dl-avatar">{getInitials(user.name)}</span>
                            <div className="dl-user-text">
                                <strong>{user.name}</strong>
                                <span>{role === 'storeman' ? 'Storeman' : user.store}</span>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="dl-content">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}

export default DashboardLayout