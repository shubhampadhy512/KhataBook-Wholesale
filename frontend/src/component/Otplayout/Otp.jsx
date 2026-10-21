import React, { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ShieldCheck, } from 'lucide-react'
import './Otp.css'
import { showSuccessToast } from "../toastMessage/SuccessToast.jsx"

const OTP_LENGTH = 6
const RESEND_SECONDS = 30
const BACKEND = import.meta.env.VITE_BACKEND_URL

/**
 * Props
 *  - form            { username, email, phone, password, address } from the register step
 *                    (forgot password only needs { email })
 *  - role            'storeman' | 'merchant'
 *  - onVerified      called on success. Receives the response data: onVerified(data)
 *  - onEditDetails   called when the user wants to go back (edit form / change email)
 *  - onError         (message) => void, parent shows the error
 *
 * Optional props (all default to the REGISTRATION behaviour, so register keeps working unchanged)
 *  - verifyUrl        default '/registerverification'
 *  - buildVerifyBody  (code) => object     default: the registration body
 *  - successStatus    default 201          (forgot password verify returns 200)
 *  - resendUrl        default '/resendOtp'
 *  - buildResendBody  () => object         default: { email, username }
 *  - title, subtitle, submitLabel, backLabel   text overrides
 */
function OtpVerification({
    form,
    role,
    onVerified,
    onEditDetails,
    onError,
    verifyUrl = '/registerverification',
    buildVerifyBody,
    successStatus = 201,
    resendUrl = '/resendOtp',
    buildResendBody,
    title = 'Verify your email',
    subtitle,
    submitLabel = 'Verify & continue',
    backLabel = 'Edit details',
}) {
    const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''))
    const [otpError, setOtpError] = useState('')
    const [seconds, setSeconds] = useState(RESEND_SECONDS)   // timer starts when this step opens
    const [loading, setLoading] = useState(false)
    const inputRefs = useRef([])

    useEffect(() => {
        inputRefs.current[0]?.focus()
    }, [])

    useEffect(() => {
        if (seconds <= 0) return
        const t = setTimeout(() => setSeconds((s) => s - 1), 1000)
        return () => clearTimeout(t)
    }, [seconds])

    const resetOtp = () => {
        setOtp(Array(OTP_LENGTH).fill(''))
        setOtpError('')
        inputRefs.current[0]?.focus()
    }

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

    // registration body (unchanged) unless the parent passes its own
    const defaultVerifyBody = (code) => ({
        username: form.username.trim(),
        email: form.email.trim().toLowerCase(),
        phonenumber: form.phone,
        password: form.password,
        addresses: form.address,
        role,
        otp: String(code).trim(),
    })

    const handleVerify = async (e) => {
        e.preventDefault()
        const code = otp.join('')
        if (code.length < OTP_LENGTH) {
            setOtpError(`Enter the ${OTP_LENGTH}-digit code.`)
            return
        }

        setLoading(true)
        try {
            const response = await fetch(`${BACKEND}${verifyUrl}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(buildVerifyBody ? buildVerifyBody(code) : defaultVerifyBody(code)),
            })
            const data = await response.json().catch(() => ({}))

            if (response.status === successStatus) {
                onVerified(data)
                return
            }
            if (response.status === 409) {               // user already exists
                onError(data.message || 'User already exist')
                onEditDetails()
                return
            }
            if (response.status === 400 || response.status === 429) {
                onError(data.message)
                onEditDetails()
                return
            }

            if (response.status === 405) {
                resetOtp()
                setOtpError(data.message || 'Invalid OTP. Please try again.')
                return
            }
            // wrong, expired or too many attempts: stay here and show the server message
            resetOtp()
            setOtpError(data.message || 'Verification failed. Please try again.')
        } catch {
            setOtpError("Can't reach the server. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    const handleResendOtp = async () => {
        if (seconds > 0) return
        try {
            const res = await fetch(`${BACKEND}${resendUrl}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(
                    buildResendBody
                        ? buildResendBody()
                        : { email: form.email, username: form.username }
                )
            })

            if (!res.ok) {
                // was `message || ...` with `message` never defined -> ReferenceError
                const data = await res.json().catch(() => ({}))
                onError(data.message || 'Could not resend OTP.')
                return
            }
            showSuccessToast('A new OTP was sent to your email')
            resetOtp()
            setSeconds(RESEND_SECONDS)
        } catch (error) {
            console.log(error.message)
            onError("Can't reach the server. Please try again.")
        }
    }

    return (
        <>
            <div className="lp-header">
                <span className="lp-role-icon"><ShieldCheck size={22} /></span>
                <div>
                    <h2>{title}</h2>
                    <p className="login-sub">{subtitle || `Enter the code sent to ${form.email}`}</p>
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
                    {loading ? 'Verifying…' : submitLabel}
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
                <button type="button" className="back-btn" onClick={onEditDetails}>
                    <ArrowLeft size={16} /> {backLabel}
                </button>
            </div>
        </>
    )
}

export default OtpVerification