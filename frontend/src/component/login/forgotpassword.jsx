import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Mail, ShieldCheck, KeyRound, Eye, EyeOff, ArrowLeft, ArrowRight, CheckCircle2, EqualApproximatelyNotIcon } from "lucide-react";
import OtpVerification from "../Otplayout/Otp.jsx";   // must be the updated OTP component (verifyUrl, buildVerifyBody, successStatus props)
import "./forgotpassword.css";
import { useLocation } from 'react-router-dom';


const API = import.meta.env.VITE_BACKEND_URL;
const LOGIN_PATH = "/";          // change to your login route

const STEPS = [
    { id: 1, label: "Email", icon: Mail },
    { id: 2, label: "Verify OTP", icon: ShieldCheck },
    { id: 3, label: "New password", icon: KeyRound },
];

export default function ForgotPassword() {
    const location = useLocation();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);        // 1 email | 2 otp | 3 reset | 4 done
    const [email, setEmail] = useState("");
    const [resetToken, setResetToken] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const { role } = location.state || {};

    // after success, go to login
    useEffect(() => {
        if (step !== 4) return;
        const t = setTimeout(() => navigate('/'), 2500);
        return () => clearTimeout(t);
    }, [step, navigate]);

    /* Step 1: check the email on the backend, backend creates + sends the OTP, then show the OTP component */
    const sendOtp = async (e) => {
        e.preventDefault();
        if (loading) return;

        const value = email.trim().toLowerCase();
        if (!/^\S+@\S+\.\S+$/.test(value)) {
            setError("Enter a valid email address.");
            return;
        }

        setError("");
        setLoading(true);
        try {
            const response = await fetch(`${API}/forgot-password/send-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ email: value, role: role }),
            });
            const data = await response.json();

            if (!response.ok) {
                setError(data.message || "Could not send the OTP. Try again.");   // e.g. "No account found with this email"
                return;
            }

            setEmail(value);
            setStep(2);          // OTP component renders now
        } catch (error) {
            console.log("error in send otp", error.message);
            setError("Can't reach the server. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    /* Step 3: save the new password */
    const resetPassword = async (e) => {
        e.preventDefault();
        if (loading) return;

        if (newPassword.length < 8) return setError("Password must be at least 8 characters.");
        if (!/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) return setError("Use at least one letter and one number.");
        if (newPassword !== confirmPassword) return setError("Passwords do not match.");

        setError("");
        setLoading(true);
        try {
            const response = await fetch(`${API}/forgot-password/reset`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ email, newPassword, confirmPassword }),
            });
            const data = await response.json();

            if (!response.ok) {
                setError(data.message || "Could not reset the password. Try again.");
                return;
            }

            setStep(4);          // success screen, then redirects to login
        } catch (error) {
            console.log("error in reset password", error.message);
            setError("Can't reach the server. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const goBack = () => {
        setError("");
        if (step === 1) navigate(LOGIN_PATH);
        else if(step===3) setStep(1)
        else setStep(step - 1);
    };

    const mismatch = confirmPassword && newPassword !== confirmPassword;

    return (
        <div className="fp-page">
            <aside className="fp-brand">
                <div className="fp-logo"><BookOpen size={26} /></div>
                <div>
                    <div className="fp-brand-name">KhataBook Wholesale</div>
                    <div className="fp-brand-sub">Grocery credit ledger</div>
                </div>
                <h2>Locked out? <span>We’ll get you back in.</span></h2>
                <p>Verify your email with a one-time code, then choose a new password.</p>
            </aside>

            <main className="fp-main">
                <div className="fp-card">
                    {step < 4 && (
                        <ol className="fp-steps" aria-label="Progress">
                            {STEPS.map((s) => (
                                <li key={s.id} className={step === s.id ? "is-current" : step > s.id ? "is-done" : ""}>
                                    <span className="fp-step-dot">{step > s.id ? <CheckCircle2 size={16} /> : <s.icon size={16} />}</span>
                                    <span className="fp-step-label">{s.label}</span>
                                </li>
                            ))}
                        </ol>
                    )}

                    {/* Step 1: email */}
                    {step === 1 && (
                        <form onSubmit={sendOtp} noValidate>
                            <h1>Forgot password?</h1>
                            <p className="fp-sub">Enter the email linked to your account and we’ll send you a one-time code.</p>
                            <label className="fp-label" htmlFor="fp-email">Email</label>
                            <input id="fp-email" type="email" autoComplete="email" autoFocus className="fp-input"
                                value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                            {error && <p role="alert" className="fp-error">{error}</p>}
                            <button className="fp-btn" disabled={loading}>{loading ? "Sending…" : <>Send OTP <ArrowRight size={16} /></>}</button>
                        </form>
                    )}

                    {/* Step 2: your existing OTP component, in forgot-password mode */}
                    {step === 2 && (
                        <>
                            <OtpVerification
                                form={{ email }}
                                verifyUrl="/forgot-password/verify-otp"
                                buildVerifyBody={(code) => ({ email, otp: code })}
                                successStatus={200}
                                resendUrl="/forgot-password/send-otp"
                                buildResendBody={() => ({ email })}
                                title="Enter the OTP"
                                submitLabel="Verify OTP"
                                backLabel="Change email"
                                onVerified={(data) => { setError(""); setResetToken(data.resetToken); setStep(3); }}
                                onEditDetails={() => setStep(1)}
                                onError={(message) => setError(message || "Something went wrong.")}
                            />
                            {error && <p role="alert" className="fp-error">{error}</p>}
                        </>
                    )}

                    {/* Step 3: new password + confirm password */}
                    {step === 3 && (
                        <form onSubmit={resetPassword} noValidate>
                            <h1>Set a new password</h1>
                            <p className="fp-sub">Use at least 8 characters with a letter and a number.</p>

                            <label className="fp-label" htmlFor="fp-new">New password</label>
                            <div className="fp-pw">
                                <input id="fp-new" type={showPw ? "text" : "password"} autoComplete="new-password" autoFocus className="fp-input"
                                    value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                                <button type="button" onClick={() => setShowPw((s) => !s)} aria-label={showPw ? "Hide password" : "Show password"}>
                                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>

                            <label className="fp-label" htmlFor="fp-confirm">Confirm password</label>
                            <input id="fp-confirm" type={showPw ? "text" : "password"} autoComplete="new-password"
                                className={`fp-input${mismatch ? " is-invalid" : ""}`}
                                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                            {mismatch && <p className="fp-hint-error">Passwords do not match.</p>}

                            {error && <p role="alert" className="fp-error">{error}</p>}
                            <button className="fp-btn" disabled={loading}>{loading ? "Saving…" : "Reset password"}</button>
                        </form>
                    )}

                    {/* Step 4: done */}
                    {step === 4 && (
                        <div className="fp-done">
                            <CheckCircle2 size={48} />
                            <h1>Password updated</h1>
                            <p className="fp-sub">You can now sign in with your new password. Taking you to the login page…</p>
                            <button className="fp-btn" onClick={() => navigate(LOGIN_PATH)}>Go to sign in</button>
                        </div>
                    )}

                    {(step === 1 || step === 3) && (
                        <button type="button" className="fp-back" onClick={goBack}>
                            <ArrowLeft size={16} /> {step === 1 ? "Back to sign in" : "Back"}
                        </button>
                    )}
                </div>
            </main>
        </div>
    );
}