import React, { useState, useEffect } from 'react'
import { BookOpen, UserCog, Store, ArrowRight, ShieldCheck } from 'lucide-react'
import './login.css'
import Logo from '/logo.png'
import LoginPage from './loginpage'
import RegisterPage from './registerpage'

const roles = [
    {
        id: 'storeman',
        title: 'Storeman',
        desc: 'Record credit, verify payments and manage every merchant',
        Icon: UserCog,
    },
    {
        id: 'merchant',
        title: 'Merchant',
        desc: 'View your ledger and submit payments for verification',
        Icon: Store,
    },
]

const stats = [
    { value: 'Real-time', label: 'Ledger updates' },
    { value: 'One tap', label: 'Payment verification' },
    { value: '24/7', label: 'Access anywhere' },
]

function Login() {
    const [selected, setSelected] = useState('storeman')
    const [loginpage, setLoginpage] = useState(false);
    const [registering, setRegistering] = useState(false)
    const activeRole = roles.find((r) => r.id === selected)

    // Press Enter on the role screen = click "Continue"
    // Press Enter on the role screen = click "Continue"
    useEffect(() => {
        if (loginpage) return   // only on the role selection screen

        const handleEnter = (e) => {
            if (e.key !== 'Enter') return
            if (e.repeat) return                                   // ignore holding the key down
            if (e.target.closest('.continue-btn')) return          // Continue button already handles Enter itself
            e.preventDefault()                                     // stops the focused role card from re-clicking
            setLoginpage(true)
        }

        window.addEventListener('keydown', handleEnter)
        return () => window.removeEventListener('keydown', handleEnter)
    }, [loginpage])

    return (
        <div className="login-container">
            {/* ---------- LEFT ---------- */}
            <div className="login-container-image">
                <div className="label-container">
                    <div className="login-label-container">
                        {Logo ? (
                            <img src={Logo} alt="Logo" />
                        ) : (
                            <span className="logo-fallback"><BookOpen size={26} /></span>
                        )}
                        <div>
                            <h1>KhataBook Wholesale</h1>
                            <p>Grocery credit ledger</p>
                        </div>
                    </div>
                </div>

                <div className="hero">
                    <h2>
                        Every rupee of credit,
                        <span> tracked and verified.</span>
                    </h2>
                    <p>
                        Record grocery credit, verify merchant payments with one tap,
                        and keep every ledger in sync — from the counter to the shop.
                    </p>

                    <div className="stats">
                        {stats.map((s) => (
                            <div className="stat-card" key={s.label}>
                                <strong>{s.value}</strong>
                                <span>{s.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ---------- RIGHT ---------- */}
            {!loginpage ? (
                <div className="login-container-content">
                    <div className="login-box">
                        <div className="role-grid">
                            {roles.map(({ id, title, desc, Icon }) => (
                                <button
                                    key={id}
                                    type="button"
                                    className={`role-card ${selected === id ? 'active' : ''}`}
                                    onClick={() => setSelected(id)}
                                >
                                    <span className="role-icon">
                                        <Icon size={20} />
                                    </span>
                                    <h3>{title}</h3>
                                    <p>{desc}</p>
                                </button>
                            ))}
                        </div>

                        <button className="continue-btn" onClick={() => setLoginpage(true)}>
                            Continue as {activeRole.title}
                            <ArrowRight size={18} />
                        </button>

                        <div className="login-note">
                            <span>
                                <ShieldCheck size={16} />
                                Secure, simple and always in sync.
                            </span>
                        </div>
                    </div>
                </div>
            ) : registering ? (
                <RegisterPage
                    role={selected}
                    onBack={() => { setLoginpage(false); setRegistering(false) }}
                    onLogin={() => setRegistering(false)}
                />
            ) : (
                <LoginPage
                    role={selected}
                    onBack={() => setLoginpage(false)}
                    onRegister={() => setRegistering(true)}
                />
            )}
        </div>
    )
}

export default Login