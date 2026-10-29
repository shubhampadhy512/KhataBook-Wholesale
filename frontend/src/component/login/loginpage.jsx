import React, { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Eye, EyeOff, LogIn, UserPlus, UserCog, Store, ShieldAlert, CheckCircle } from 'lucide-react'
import { useNavigate } from "react-router-dom"
import { toast } from 'react-toastify';
import { useDispatch } from 'react-redux'
import { UserInfo } from "../../features/role"
import './loginpage.css'
import ErrorToastMessage from '../toastMessage/errormessage';

const roleIcons = {
    storeman: { title: 'Storeman', Icon: UserCog },
    merchant: { title: 'Merchant', Icon: Store },
}

function LoginPage({ role = 'storeman', onBack, onRegister }) {
    const { title, Icon } = roleIcons[role]

    const notify = (message) =>
        toast.error(message, {
            icon: <ShieldAlert size={20} color="#e11d48" />,
        });
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [errors, setErrors] = useState({})
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const formRef = useRef(null)

    // Press Enter anywhere on this page = click "Sign in"
    useEffect(() => {
        const handleEnter = (e) => {
            if (e.key !== 'Enter' || e.repeat) return
            if (loading) return
            if (e.target.closest('form')) return     // the form already handles Enter itself
            if (e.target.closest('button')) return   // other buttons keep their own action
            e.preventDefault()
            formRef.current?.requestSubmit()
        }

        window.addEventListener('keydown', handleEnter)
        return () => window.removeEventListener('keydown', handleEnter)
    }, [loading])

    const validate = () => {
        const next = {}
        if (!email.trim()) {
            next.email = 'Enter your email address.'
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            next.email = 'Enter a valid email address.'
        }
        if (!password) {
            next.password = 'Enter your password.'
        } else if (password.length < 6) {
            next.password = 'Password must be at least 6 characters.'
        }
        return next
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        const next = validate()
        setErrors(next)
        if (Object.keys(next).length > 0) return

        setLoading(true)

        try {
            const response = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/login`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        email,
                        password,
                        role,
                    })
                }
            );
            const data = await response.json()
            if (response.status === 200) {
                navigate(`/${role}/dashboard`)
            }
            if (response.status === 401 || response.status === 404) {
                notify(data.message)
            }

        } catch (err) {
            notify("Something went wrong")
        } finally {
            setTimeout(() => {
                setLoading(false)
            }, 100)
        }
    }

    // Sends the user to the reset password page.
    // The typed email and the role are passed along so that page can pre-fill them.
    const handleForgotPassword = () => {
        navigate('/forgot-password', { state: { email: email.trim(), role } })
    }

    return (
        <>
            <div>
                <ErrorToastMessage />
            </div>
            <div className="login-container-content">
                <div className="login-box lp-card">
                    <div className="lp-header">
                        <span className="lp-role-icon">
                            <Icon size={22} />
                        </span>
                        <div>
                            <h2>Sign in as {title}</h2>
                            <p className="login-sub">Use your email or continue with Google.</p>
                        </div>
                    </div>

                    <p className="login-sub">Use your email and password to sign in.</p>

                    <div className="divider"><span>or</span></div>

                    <form ref={formRef} className="lp-form" onSubmit={handleSubmit} noValidate>
                        <div className={`field ${errors.email ? 'has-error' : ''}`}>
                            <label htmlFor="email">Email</label>
                            <input
                                id="email"
                                type="email"
                                autoComplete="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                aria-invalid={!!errors.email}
                                aria-describedby={errors.email ? 'email-error' : undefined}
                            />
                            {errors.email && <span className="field-error" id="email-error">{errors.email}</span>}
                        </div>

                        <div className={`field ${errors.password ? 'has-error' : ''}`}>
                            <label htmlFor="password">Password</label>
                            <div className="password-wrap">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    aria-invalid={!!errors.password}
                                    aria-describedby={errors.password ? 'password-error' : undefined}
                                />
                                <button
                                    type="button"
                                    className="toggle-pass"
                                    onClick={() => setShowPassword((s) => !s)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {errors.password && <span className="field-error" id="password-error">{errors.password}</span>}
                            <button
                                type="button"
                                className="forgot-btn"
                                onClick={handleForgotPassword}
                            >
                                Forgot password?
                            </button>
                        </div>

                        <button type="submit" className="continue-btn" disabled={loading}>
                            {loading ? 'Signing in…' : 'Sign in'}
                            {!loading && <LogIn size={18} />}
                        </button>
                    </form>

                    <div className="lp-footer">
                        <p>New to KhataBook Wholesale?</p>
                        <button
                            type="button"
                            className="register-btn"
                            onClick={() => (onRegister ? onRegister(role) : console.log('Register as', role))}
                        >
                            <UserPlus size={18} />
                            Register as {title}
                        </button>

                        <button type="button" className="back-btn" onClick={onBack}>
                            <ArrowLeft size={16} />
                            Change role
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}

export default LoginPage