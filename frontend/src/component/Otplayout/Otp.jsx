import React, { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { showSuccessToast } from '../toastMessage/SuccessToast.jsx'
import './Otp.css'

const OTP_LENGTH = 6
const RESEND_SECONDS = 30

/**
 * Props
 *  - form          { username, email, phone, password } from the register step
 *  - role          'storeman' | 'merchant'
 *  - onRequestOtp  async () => ({ ok, message })   used for "Resend OTP"
 *  - onVerified    called when the account is created (HTTP 201)
 *  - onEditDetails called when the user wants to go back to the form
 *  - onError       (message) => void, parent shows the error toast
 */
function OtpVerification({ form, role, onRequestOtp, onVerified, onEditDetails, onError }) {
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

    const handleVerify = async (e) => {
        e.preventDefault()
        const code = otp.join('')
        if (code.length < OTP_LENGTH) {
            setOtpError(`Enter the ${OTP_LENGTH}-digit code.`)
            return
        }

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
                    otp: String(code).trim()
                }),
            })
            const data = await response.json()

            if (response.status === 201) {
                onVerified()
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
            const { ok, message } = await onRequestOtp()
            if (!ok) {
                onError(message || 'Could not resend OTP.')
                return
            }
            showSuccessToast('A new OTP was sent to your email')
            resetOtp()
            setSeconds(RESEND_SECONDS)
        } catch {
            onError("Can't reach the server. Please try again.")
        }
    }

    return (
        <>
            <div className="lp-header">
                <span className="lp-role-icon"><ShieldCheck size={22} /></span>
                <div>
                    <h2>Verify your email</h2>
                    <p className="login-sub">Enter the code sent to {form.email}</p>
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
                <button type="button" className="back-btn" onClick={onEditDetails}>
                    <ArrowLeft size={16} /> Edit details
                </button>
            </div>
        </>
    )
}

export default OtpVerification