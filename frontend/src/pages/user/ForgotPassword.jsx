import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Key, CheckCircle, AlertTriangle } from "lucide-react";

const ForgotPassword = () => {
    const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [messsage, setMessage] = useState("");
    const navigate = useNavigate();

    // Step 1: Send OTP
    const handleSendOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setMessage("");

        try {
            const res = await fetch("http://localhost:5001/api/user/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();

            if (res.ok) {
                setStep(2);
                setMessage("OTP sent to your email.");
            } else {
                setError(data.message || "Failed to send OTP");
            }
        } catch (err) {
            setError("Server error. Try again.");
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify OTP
    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("http://localhost:5001/api/user/verify-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp }),
            });
            const data = await res.json();

            if (res.ok) {
                setStep(3);
                setMessage("OTP Verified. Create new password.");
            } else {
                setError(data.message || "Invalid OTP");
            }
        } catch (err) {
            setError("Server error. Try again.");
        } finally {
            setLoading(false);
        }
    };

    // Step 3: Reset Password
    const handleResetPassword = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const res = await fetch("http://localhost:5001/api/user/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp, password }),
            });
            const data = await res.json();

            if (res.ok) {
                setMessage("Password reset successful! Redirecting...");
                setTimeout(() => navigate("/user/login"), 2000);
            } else {
                setError(data.message || "Failed to reset password");
            }
        } catch (err) {
            setError("Server error. Try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-white selection:bg-teal-100 selection:text-teal-900 overflow-hidden relative">
            {/* Background Shapes */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-teal-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/3"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-fuchsia-50 rounded-full blur-3xl opacity-50 translate-y-1/3 -translate-x-1/3"></div>

            <div className="w-full max-w-md p-8 bg-white rounded-3xl shadow-2xl border border-gray-100 relative z-10 animate-fade-in-up">

                <div className="text-center mb-8">
                    <Link to="/" className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-600 to-pink-600 font-cursive inline-block mb-3">
                        Derma Ai
                    </Link>
                    <h2 className="text-2xl font-bold text-gray-900">
                        {step === 1 && "Forgot Password"}
                        {step === 2 && "Enter OTP"}
                        {step === 3 && "Reset Password"}
                    </h2>
                    <p className="text-gray-500 mt-2 text-sm">
                        {step === 1 && "Enter your email to receive a recovery code."}
                        {step === 2 && `Code sent to ${email}`}
                        {step === 3 && "Create a secure new password."}
                    </p>
                </div>

                {error && (
                    <div className="mb-6 flex items-center bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100 animate-shake">
                        <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0" />
                        {error}
                    </div>
                )}

                {messsage && !error && (
                    <div className="mb-6 flex items-center bg-green-50 text-green-600 p-4 rounded-xl text-sm border border-green-100">
                        <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                        {messsage}
                    </div>
                )}

                {/* STEP 1: EMAIL */}
                {step === 1 && (
                    <form onSubmit={handleSendOtp} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 ml-1">Email Address</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className="w-5 h-5 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                                    placeholder="Enter your email"
                                />
                            </div>
                        </div>
                        <button type="submit" disabled={loading} className="w-full py-4 bg-black text-white rounded-xl font-bold text-lg hover:bg-gray-800 transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed">
                            {loading ? "Sending..." : "Send OTP"}
                        </button>
                    </form>
                )}

                {/* STEP 2: OTP */}
                {step === 2 && (
                    <form onSubmit={handleVerifyOtp} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 ml-1">6-Digit Code</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Key className="w-5 h-5 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    maxLength="6"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all tracking-widest font-mono text-lg"
                                    placeholder="000000"
                                />
                            </div>
                        </div>
                        <button type="submit" disabled={loading} className="w-full py-4 bg-black text-white rounded-xl font-bold text-lg hover:bg-gray-800 transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed">
                            {loading ? "Verifying..." : "Verify OTP"}
                        </button>
                    </form>
                )}

                {/* STEP 3: RESET PASS */}
                {step === 3 && (
                    <form onSubmit={handleResetPassword} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 ml-1">New Password</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="w-5 h-5 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                                    placeholder="Min. 8 characters"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 ml-1">Confirm Password</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="w-5 h-5 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                                    placeholder="Retype password"
                                />
                            </div>
                        </div>

                        <button type="submit" disabled={loading} className="w-full py-4 bg-black text-white rounded-xl font-bold text-lg hover:bg-gray-800 transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed">
                            {loading ? "Resetting..." : "Reset Password"}
                        </button>
                    </form>
                )}

                <div className="mt-8 text-center text-sm text-gray-600">
                    <Link to="/user/login" className="font-bold text-teal-600 hover:text-teal-800 hover:underline transition">
                        Back to Login
                    </Link>
                </div>

            </div>
        </div>
    );
};

export default ForgotPassword;
