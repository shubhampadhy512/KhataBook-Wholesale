import React, { useState } from 'react'
import { BookOpen, UserCog, Store, ArrowRight, ShieldCheck } from 'lucide-react'
import './login.css'
import Logo from '/logo.png'
import LoginPage from './loginpage'
import RegisterPage from './registerpage'

const roles = [
    {
        id: 'storeman',
        title: 'Storeman',
        desc: 'Anil Mehta · records credit and verifies payments',
        Icon: UserCog,
    },
    {
        id: 'merchant',
        title: 'Merchant',
        desc: 'Views ledger, submits payments for verification',
        Icon: Store,
    },
]

const stats = [
    { value: '5', label: 'Merchants' },
    { value: '₹2.1L', label: 'Credit tracked' },
    { value: '2-step', label: 'Verification' },
]

function Login() {
    const [selected, setSelected] = useState('storeman')
    const [loginpage, setLoginpage] = useState(false);
    const [registering, setRegistering] = useState(false)
    const activeRole = roles.find((r) => r.id === selected)

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
                                Data is saved only in this browser.
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