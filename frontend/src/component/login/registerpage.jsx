import React, { useEffect, useRef, useState } from 'react'
import {
    ArrowLeft, Eye, EyeOff, UserPlus, ShieldCheck, CheckCircle2,
    UserCog, Store, ShieldAlert,
} from 'lucide-react'
import { toast } from 'react-toastify'
import './loginpage.css'     // reuses the card, field, button styles
import './registerpage.css'

const roleInfo = {
    storeman: { title: 'Storeman', Icon: UserCog },
    merchant: { title: 'Merchant', Icon: Store },
}

const OTP_LENGTH = 6
const RESEND_SECONDS = 30

const errorToast = (msg) =>
    toast.error(msg, { icon: <ShieldAlert size={20} color="#e11d48" /> })

function RegisterPage({ role = 'storeman', onBack, onLogin }) {
    const { title, Icon } = roleInfo[role]

    const [step, setStep] = useState('form')          // 'form' | 'otp' | 'done'
    const [form, setForm] = useState({ username: '', email: '', phone: '', password: '' })
    const [showPassword, setShowPassword] = useState(false)
    const [errors, setErrors] = useState({})
    const [loading, setLoading] = useState(false)

    const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''))
    const [otpError, setOtpError] = useState('')
    const [seconds, setSeconds] = useState(0)
    const inputRefs = useRef([])

    const setField = (name) => (e) => {
        const value = name === 'phone' ? e.target.value.replace(/\D/g, '').slice(0, 10) : e.target.value
        setForm((f) => ({ ...f, [name]: value }))
    }

    /* ---------------- Step 1: form ---------------- */
    const validate = () => {
        const next = {}
        if (form.username.trim().length < 3) next.username = 'Username must be at least 3 characters.'
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = 'Enter a valid email address.'
        if (!/^[6-9]\d{9}$/.test(form.phone)) next.phone = 'Enter a valid 10-digit mobile number.'
        if (form.password.length < 6) next.password = 'Password must be at least 6 characters.'
        return next
    }

    // Used for the first send AND for resend
    const requestOtp = async () => {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                username: form.username.trim(),
                email: form.email.trim().toLowerCase(),
            }),
        })
        const data = await response.json().catch(() => ({}))
        return { ok: response.ok, message: data.message }
    }

    const handleRegister = async (e) => {
        e.preventDefault()
        const next = validate()
        setErrors(next)
        if (Object.keys(next).length) return

        setLoading(true)
        try {
            const { ok, message } = await requestOtp()
            if (!ok) {
                errorToast(message || 'Could not send OTP. Try again.')
                return                                   // stay on the form
            }
            setOtp(Array(OTP_LENGTH).fill(''))
            setOtpError('')
            setSeconds(RESEND_SECONDS)
            setStep('otp')
        } catch {
            errorToast("Can't reach the server. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    /* ---------------- Step 2: OTP ---------------- */
    useEffect(() => {
        if (step === 'otp') inputRefs.current[0]?.focus()
    }, [step])

    useEffect(() => {
        if (step !== 'otp' || seconds <= 0) return
        const t = setTimeout(() => setSeconds((s) => s - 1), 1000)
        return () => clearTimeout(t)
    }, [step, seconds])

    const handleOtpChange = (i, value) => {
        const digit = value.replace(/\D/g, '').slice(-1)
        setOtp((prev) => prev.map((d, idx) => (idx === i ? digit : d)))
        setOtpError('')
        if (digit && i < OTP_LENGTH - 1) inputRefs.current[i + 1]?.focus()
    }

    const handleOtpKeyDown = (i, e) => {
        if (e.key === 'Backspace' && !otp[i] && i > 0) inputRefs.current[i - 1]?.focus()
    }

    const handleOtpPaste = (e) => {
        e.preventDefault()
        const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
        if (!digits) return
        setOtp(Array.from({ length: OTP_LENGTH }, (_, i) => digits[i] || ''))
        inputRefs.current[Math.min(digits.length, OTP_LENGTH - 1)]?.focus()
    }

    const handleVerify = async (e) => {
        e.preventDefault()
        const code = otp.join('')
        if (code.length < OTP_LENGTH) {
            setOtpError(`Enter the ${OTP_LENGTH}-digit code.`)
            return
        }
        console.log(code)
        setLoading(true)
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/registerverification`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    username: form.username.trim(),
                    email: form.email.trim().toLowerCase(),
                    phonenumber: form.phone,
                    password: form.password,
                    role,
                    otp: code,
                }),
            })
            const data = await response.json().catch(() => ({}))

            if (response.status === 201) {
                setStep('done')
                return
            }
            if (response.status === 409) {               // user already exists
                errorToast(data.message || 'User already exist')
                setStep('form')
                return
            }
            // wrong, expired or too many attempts: stay here and show the server message
            setOtp(Array(OTP_LENGTH).fill(''))
            setOtpError(data.message || 'Verification failed. Please try again.')
            inputRefs.current[0]?.focus()
        } catch {
            setOtpError("Can't reach the server. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    const handleResendOtp = async () => {
        if (seconds > 0) return
        try {
            const { ok, message } = await requestOtp()
            if (!ok) {
                errorToast(message || 'Could not resend OTP.')
                return
            }
            toast.success('A new OTP was sent to your email')
            setOtp(Array(OTP_LENGTH).fill(''))
            setOtpError('')
            setSeconds(RESEND_SECONDS)
            inputRefs.current[0]?.focus()
        } catch {
            errorToast("Can't reach the server. Please try again.")
        }
    }

    const maskedEmail = form.email

    return (
        <div className="login-container-content">
            <div className="login-box lp-card">
                {/* ============ STEP 1: FORM ============ */}
                {step === 'form' && (
                    <>
                        <div className="lp-header">
                            <span className="lp-role-icon"><Icon size={22} /></span>
                            <div>
                                <h2>Register as {title}</h2>
                                <p className="login-sub">Create your account in a minute.</p>
                            </div>
                        </div>

                        <form className="lp-form" onSubmit={handleRegister} noValidate>
                            <div className={`field ${errors.username ? 'has-error' : ''}`}>
                                <label htmlFor="username">Username</label>
                                <input id="username" type="text" autoComplete="username" placeholder="e.g. anil.mehta"
                                    value={form.username} onChange={setField('username')} />
                                {errors.username && <span className="field-error">{errors.username}</span>}
                            </div>

                            <div className={`field ${errors.email ? 'has-error' : ''}`}>
                                <label htmlFor="reg-email">Email</label>
                                <input id="reg-email" type="email" autoComplete="email" placeholder="you@example.com"
                                    value={form.email} onChange={setField('email')} />
                                {errors.email && <span className="field-error">{errors.email}</span>}
                            </div>

                            <div className={`field ${errors.phone ? 'has-error' : ''}`}>
                                <label htmlFor="phone">Phone number</label>
                                <div className="phone-wrap">
                                    <span className="phone-prefix">+91</span>
                                    <input id="phone" type="tel" inputMode="numeric" autoComplete="tel-national"
                                        placeholder="10-digit mobile number"
                                        value={form.phone} onChange={setField('phone')} />
                                </div>
                                {errors.phone && <span className="field-error">{errors.phone}</span>}
                            </div>

                            <div className={`field ${errors.password ? 'has-error' : ''}`}>
                                <label htmlFor="reg-password">Password</label>
                                <div className="password-wrap">
                                    <input id="reg-password" type={showPassword ? 'text' : 'password'}
                                        autoComplete="new-password" placeholder="At least 6 characters"
                                        value={form.password} onChange={setField('password')} />
                                    <button type="button" className="toggle-pass"
                                        onClick={() => setShowPassword((s) => !s)}
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}>
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {errors.password && <span className="field-error">{errors.password}</span>}
                            </div>

                            <button type="submit" className="continue-btn" disabled={loading}>
                                {loading ? 'Sending OTP…' : 'Register & send OTP'}
                                {!loading && <UserPlus size={18} />}
                            </button>
                        </form>

                        <div className="lp-footer">
                            <p>Already have an account?</p>
                            <button type="button" className="register-btn" onClick={onLogin}>Sign in</button>
                            <button type="button" className="back-btn" onClick={onBack}>
                                <ArrowLeft size={16} /> Change role
                            </button>
                        </div>
                    </>
                )}

                {/* ============ STEP 2: OTP ============ */}
                {step === 'otp' && (
                    <>
                        <div className="lp-header">
                            <span className="lp-role-icon"><ShieldCheck size={22} /></span>
                            <div>
                                <h2>Verify your email</h2>
                                <p className="login-sub">Enter the code sent to {maskedEmail}</p>
                            </div>
                        </div>

                        <form className="lp-form" onSubmit={handleVerify} noValidate>
                            <div className={`otp-row ${otpError ? 'has-error' : ''}`} onPaste={handleOtpPaste}>
                                {otp.map((digit, i) => (
                                    <input
                                        key={i}
                                        ref={(el) => (inputRefs.current[i] = el)}
                                        className="otp-input"
                                        type="text"
                                        inputMode="numeric"
                                        autoComplete={i === 0 ? 'one-time-code' : 'off'}
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleOtpChange(i, e.target.value)}
                                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                                        aria-label={`Digit ${i + 1} of ${OTP_LENGTH}`}
                                    />
                                ))}
                            </div>
                            {otpError && <span className="field-error otp-error">{otpError}</span>}

                            <button type="submit" className="continue-btn" disabled={loading}>
                                {loading ? 'Verifying…' : 'Verify & continue'}
                            </button>
                        </form>

                        <div className="lp-footer">
                            <p>
                                Didn&apos;t get the code?{' '}
                                {seconds > 0 ? (
                                    <strong>Resend in {seconds}s</strong>
                                ) : (
                                    <button type="button" className="link-btn" onClick={handleResendOtp}>
                                        Resend OTP
                                    </button>
                                )}
                            </p>
                            <button type="button" className="back-btn" onClick={() => setStep('form')}>
                                <ArrowLeft size={16} /> Edit details
                            </button>
                        </div>
                    </>
                )}

                {/* ============ STEP 3: DONE ============ */}
                {step === 'done' && (
                    <div className="done-box">
                        <span className="done-icon"><CheckCircle2 size={44} /></span>
                        <h2>You&apos;re all set!</h2>
                        <p className="login-sub">
                            Your {title.toLowerCase()} account has been created and your email is verified.
                        </p>
                        <button type="button" className="continue-btn" onClick={onLogin}>Go to sign in</button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default RegisterPage