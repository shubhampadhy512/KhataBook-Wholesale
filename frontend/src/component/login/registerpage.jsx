import React, { useState } from 'react'
import {
    ArrowLeft, ArrowRight, Eye, EyeOff, UserPlus, CheckCircle2,
    UserCog, Store, ShieldAlert,
} from 'lucide-react'
import { toast } from 'react-toastify'
import './loginpage.css'     // reuses the card, field, button styles
import './registerpage.css'
import ErrorToastMessage from '../toastMessage/errormessage'
import OtpVerification from '../Otplayout/Otp.jsx'
import { showSuccessToast } from '../toastMessage/SuccessToast.jsx'

const roleInfo = {
    storeman: { title: 'Storeman', Icon: UserCog },
    merchant: { title: 'Merchant', Icon: Store },
}

const errorToast = (msg) =>
    toast.error(msg, { icon: <ShieldAlert size={20} color="#e11d48" /> })

/* ---------- Validation rules ----------
   One function per field: returns an error message, or '' when the value is fine.
   Used on submit AND live while the user is fixing a field. */
const validators = {
    username: (v) =>
        v.trim().length < 3 ? 'Username must be at least 3 characters.' : '',

    email: (v) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Enter a valid email address.',

    phone: (v) =>
        /^[6-9]\d{9}$/.test(v) ? '' : 'Enter a valid 10-digit mobile number.',

    flat: (v) =>
        /\d/.test(v) && v.trim().length <= 30
            ? ''
            : 'Enter your room / flat number, e.g. B-203.',

    society: (v) =>
        v.trim().length < 3 ? 'Enter your society / building name.' : '',

    area: (v) =>
        v.trim().length < 3 ? 'Enter your street / area / landmark.' : '',

    city: (v) =>
        /^[A-Za-z][A-Za-z .'-]{1,}$/.test(v.trim()) ? '' : 'Enter a valid city name.',

    pincode: (v) =>
        /^[1-9]\d{5}$/.test(v) ? '' : 'Enter a valid 6-digit pincode.',

    password: (v) => {
        if (v.length < 6) return 'Password must be at least 6 characters.'
        if (!/[^A-Za-z0-9\s]/.test(v)) {
            return 'Add one special character, e.g. @ # $ !'
        }
        return ''
    },
}

// fields that only allow digits, and how long they can be
const DIGITS_ONLY = { phone: 10, pincode: 6 }

const EMPTY_FORM = {
    username: '',
    email: '',
    phone: '',
    flat: '',
    society: '',
    area: '',
    city: '',
    pincode: '',
    password: '',
}

// the separate address parts -> one address string for the backend
const buildAddress = (f) =>
    `${f.flat.trim()}, ${f.society.trim()}, ${f.area.trim()}, ${f.city.trim()} - ${f.pincode}`


function RegisterPage({ role = 'storeman', onBack, onLogin }) {
    const { title, Icon } = roleInfo[role]

    const [step, setStep] = useState('form')          // 'form' | 'otp' | 'done'
    const [form, setForm] = useState(EMPTY_FORM)
    const [showPassword, setShowPassword] = useState(false)
    const [errors, setErrors] = useState({})
    const [loading, setLoading] = useState(false)

    const setField = (name) => (e) => {
        let value = e.target.value
        if (name in DIGITS_ONLY) value = value.replace(/\D/g, '').slice(0, DIGITS_ONLY[name])

        setForm((f) => ({ ...f, [name]: value }))

        // As soon as the user types in a field, hide that field's error.
        // (It comes back on blur or on submit if the value is still invalid.)
        setErrors((prev) => {
            if (!prev[name]) return prev
            const { [name]: _hidden, ...rest } = prev
            return rest
        })
    }

    // Leaving a field with an invalid value shows its error right below it.
    // Empty fields are reported when Register is pressed, not while tabbing past.
    const showErrorOnBlur = (name) => () => {
        if (!form[name]) return
        const message = validators[name](form[name])
        if (message) setErrors((prev) => ({ ...prev, [name]: message }))
    }

    /* ---------------- Step 1: form ---------------- */
    const validate = () => {
        const next = {}
        Object.keys(validators).forEach((name) => {
            const message = validators[name](form[name])
            if (message) next[name] = message
        })
        return next
    }

    // Used for the first send AND passed to the OTP step for resend
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
            setStep('otp')
        } catch {
            errorToast("Can't reach the server. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    const afterVerified = () => {
        setStep("done")
        showSuccessToast("User registered successfully!!!", { icon: <CheckCircle2 color="green" size={24} /> })
    }

    /* A plain text input with its label and error line.
       `span` = how many of the 12 grid columns it takes (see registerpage.css) */
    const textField = ({ name, id, label, placeholder, autoComplete, inputMode, span = 6 }) => (
        <div className={`field col-${span} ${errors[name] ? 'has-error' : ''}`}>
            <label htmlFor={id}>{label}</label>
            <input
                id={id}
                type="text"
                inputMode={inputMode}
                autoComplete={autoComplete}
                placeholder={placeholder}
                value={form[name]}
                onChange={setField(name)}
                onBlur={showErrorOnBlur(name)}
            />
            {errors[name] && <span className="field-error">{errors[name]}</span>}
        </div>
    )

    return (
        <>
            <ErrorToastMessage />
            <div className={`login-container-content${step === 'form' ? ' register-page' : ''}`}>
                <div className={`login-box lp-card${step === 'form' ? ' register-card' : ''}`}>
                    {/* ============ STEP 1: FORM ============ */}
                    {step === 'form' && (
                        <>
                            <header className="reg-head">
                                <h1>Create your account</h1>
                                <span className="reg-pill"><Icon size={14} />{title}</span>
                            </header>

                            {/* 12-column grid: fields get different widths (see registerpage.css) */}
                            <form className="reg-form" onSubmit={handleRegister} noValidate>
                                <h3 className="reg-section">Account details</h3>

                                {textField({
                                    name: 'username', id: 'username', label: 'Username',
                                    placeholder: 'e.g. anil.mehta', autoComplete: 'username', span: 6,
                                })}

                                <div className={`field col-6 ${errors.email ? 'has-error' : ''}`}>
                                    <label htmlFor="reg-email">Email</label>
                                    <input id="reg-email" type="email" autoComplete="email" placeholder="you@example.com"
                                        value={form.email} onChange={setField('email')}
                                        onBlur={showErrorOnBlur('email')} />
                                    {errors.email && <span className="field-error">{errors.email}</span>}
                                </div>

                                <div className={`field col-6 ${errors.phone ? 'has-error' : ''}`}>
                                    <label htmlFor="phone">Phone number</label>
                                    <div className="phone-wrap">
                                        <span className="phone-prefix">+91</span>
                                        <input id="phone" type="tel" inputMode="numeric" autoComplete="tel-national"
                                            placeholder="10-digit mobile number"
                                            value={form.phone} onChange={setField('phone')}
                                            onBlur={showErrorOnBlur('phone')} />
                                    </div>
                                    {errors.phone && <span className="field-error">{errors.phone}</span>}
                                </div>

                                <div className={`field col-6 ${errors.password ? 'has-error' : ''}`}>
                                    <label htmlFor="reg-password">Password</label>
                                    <div className="password-wrap">
                                        <input id="reg-password" type={showPassword ? 'text' : 'password'}
                                            autoComplete="new-password" placeholder="6+ chars, 1 special"
                                            value={form.password} onChange={setField('password')}
                                            onBlur={showErrorOnBlur('password')} />
                                        <button type="button" className="toggle-pass"
                                            onClick={() => setShowPassword((s) => !s)}
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}>
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                    {errors.password
                                        ? <span className="field-error">{errors.password}</span>
                                        : <span className="field-hint">At least 6 characters, including one special character.</span>}
                                </div>

                                <h3 className="reg-section">Address</h3>

                                {textField({
                                    name: 'flat', id: 'flat', label: 'Room / flat no.',
                                    placeholder: 'B-203', autoComplete: 'address-line1', span: 4,
                                })}
                                {textField({
                                    name: 'society', id: 'society', label: 'Society / building name',
                                    placeholder: 'e.g. Sai Krupa Society', autoComplete: 'address-line2', span: 8,
                                })}
                                {textField({
                                    name: 'area', id: 'area', label: 'Street / area / landmark',
                                    placeholder: 'e.g. Lokhandwala Road', autoComplete: 'address-level3', span: 12,
                                })}
                                {textField({
                                    name: 'city', id: 'city', label: 'City',
                                    placeholder: 'e.g. Mumbai', autoComplete: 'address-level2', span: 6,
                                })}
                                {textField({
                                    name: 'pincode', id: 'pincode', label: 'Pincode',
                                    placeholder: '6-digit pincode', autoComplete: 'postal-code',
                                    inputMode: 'numeric', span: 6,
                                })}

                                <button type="submit" className="continue-btn" disabled={loading}>
                                    {!loading && <UserPlus size={18} />}
                                    {loading ? 'Sending OTP…' : 'Register & Send OTP'}
                                    {!loading && <ArrowRight size={18} />}
                                </button>
                            </form>

                            <footer className="reg-footer">
                                <p>
                                    Already have an account?{' '}
                                    <button type="button" className="reg-link reg-link--bold" onClick={onLogin}>Sign in</button>
                                </p>
                                <button type="button" className="reg-link" onClick={onBack}>
                                    <ArrowLeft size={15} /> Change role
                                </button>
                            </footer>
                        </>
                    )}

                    {/* ============ STEP 2: OTP ============ */}
                    {step === 'otp' && (
                        <OtpVerification
                            form={{ ...form, address: buildAddress(form) }}
                            role={role}
                            onRequestOtp={requestOtp}
                            onVerified={afterVerified}
                            onEditDetails={() => setStep('form')}
                            onError={errorToast}
                        />
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
        </>
    )
}

export default RegisterPage