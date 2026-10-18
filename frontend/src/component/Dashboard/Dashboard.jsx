import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import './dashboardlayout.css'
import { Navbar } from '../../FileAddresses'
import SearchBar from './searchbar.jsx'
import NotificationBell from './notificationBell.jsx'
import SuccessToast from '../toastMessage/SuccessToast.jsx'


/* ---------- Replace with the logged-in user (redux / API) ---------- */
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
    const user = { username: 'Subham Padhy' }

    return (
        <div className="dl-shell">
            <SuccessToast />
            <Navbar role={role} />
            <div className="dl-main">
                <header className="dl-topbar">
                    {/* Only the storeman gets the search bar */}
                    {role === 'storeman' && <SearchBar />}

                    {/* margin-left: auto (in the CSS) keeps this block in the
                        right corner even when there is no search bar */}
                    <div className="dl-actions">
                        <NotificationBell />

                        <span className="dl-divider" aria-hidden="true" />

                        <div className="dl-user">
                            <span className="dl-avatar">{getInitials(user.username || 'User')}</span>
                            <div className="dl-user-text">
                                <strong>{user.username || 'User'}</strong>
                                <span>{role === 'storeman' ? 'Storeman' : user.store || 'Merchant'}</span>
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