import React, { useState } from 'react'
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

function GoogleIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
        </svg>
    )
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
            console.log(data.user);
            const { username, addresses, phonenumber } = data.user;
            if (response.status === 200) {
                dispatch(
                    UserInfo({
                        email,
                        role,
                        username,
                        phone: phonenumber,
                        addresses
                    })
                )
                navigate(`/${role}/dashboard`)
            } else if (response.status === 401 || response.status === 404) {
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

    const handleGoogle = () => {
        // TODO: hook up Google sign-in (e.g. Firebase signInWithPopup)
        console.log('Google sign-in as', role)
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

                    <button type="button" className="google-btn" onClick={handleGoogle}>
                        <GoogleIcon />
                        Continue with Google
                    </button>

                    <div className="divider"><span>or</span></div>

                    <form className="lp-form" onSubmit={handleSubmit} noValidate>
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