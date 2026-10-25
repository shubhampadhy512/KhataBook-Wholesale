import React, { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import './dashboardlayout.css'
import { Navbar } from '../../FileAddresses'
import SearchBar from './searchbar.jsx'
import NotificationBell from './notificationBell.jsx'
import SuccessToast from '../toastMessage/SuccessToast.jsx'

const API_URL = import.meta.env.VITE_BACKEND_URL

const getInitials = (name) =>
    name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0].toUpperCase())
        .join('')

const capitalize = (str = '') => str.charAt(0).toUpperCase() + str.slice(1)

function DashboardLayout() {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const controller = new AbortController()

        const fetchUser = async () => {
            try {
                const res = await fetch(`${API_URL}/user`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    signal: controller.signal,
                })

                if (!res.ok) throw new Error(`Request failed: ${res.status}`)

                const data = await res.json()
                setUser(data.body) // response shape: { message, body: { ...user } }
            } catch (err) {
                if (err.name !== 'AbortError') setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchUser()
        return () => controller.abort()
    }, [])

    if (loading) return <div className="dl-shell">Loading...</div>
    if (error || !user) return <div className="dl-shell">Failed to load user: {error}</div>

    const role = user.role === 'storeman' ? 'storeman' : 'merchant'
    const displayName = capitalize(user.username || 'User')

    return (
        <div className="dl-shell">
            <SuccessToast />
            <Navbar role={role} />
            <div className="dl-main">
                <header className="dl-topbar">
                    {/* Only the storeman gets the search bar */}
                    {role === 'storeman' && <SearchBar />}

                    <div className="dl-actions">
                        <NotificationBell />

                        <span className="dl-divider" aria-hidden="true" />

                        <div className="dl-user">
                            <span className="dl-avatar">{getInitials(displayName)}</span>
                            <div className="dl-user-text">
                                <strong>{displayName}</strong>
                                <span>{capitalize(role)}</span>
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