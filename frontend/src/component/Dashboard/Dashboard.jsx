import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Bell } from 'lucide-react'
import './dashboardlayout.css'
import { Navbar } from '../../FileAddresses'
import SearchBar from './searchbar.jsx'
import NotificationBell from "./notificationBell.jsx"


/* ---------- Replace with the logged-in user (redux / API) ---------- */
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
    const user = { username: "Subham Padhy" }

    return (
        <div className="dl-shell">
            <Navbar role={role} />
            <div className="dl-main">
                <header className="dl-topbar">
                    <SearchBar />

                    <div className="dl-actions">
                        <NotificationBell />

                        <span className="dl-divider" aria-hidden="true" />

                        <div className="dl-user">
                            <span className="dl-avatar">{getInitials(user.username || 'User')}</span>
                            <div className="dl-user-text">
                                <strong>{user.username || 'User'}</strong>
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