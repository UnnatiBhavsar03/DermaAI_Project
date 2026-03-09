import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Lock, Mail, AlertTriangle } from "lucide-react";
import UserAuthLayout from "../../components/UserAuthLayout";
import { useToast } from "../../context/ToastContext";

const UserLogin = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { addToast } = useToast();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch("http://localhost:5001/api/user/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem("user", JSON.stringify(data.user));
                addToast(`Welcome back, ${data.user.name}!`, 'success');
                navigate("/user/dashboard");
            } else {
                addToast(data.message || "Invalid credentials", 'error');
            }
        } catch (err) {
            addToast("Server error. Please try again later.", 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <UserAuthLayout
            title="Welcome Back"
            subtitle="Log in to access your personalized skin analysis."
        >
            <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 ml-1 uppercase tracking-wide">Email Address</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Mail className="w-4 h-4 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
                        </div>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400 font-medium text-gray-800 text-sm"
                            placeholder="name@example.com"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <div className="flex justify-between items-center ml-1">
                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Password</label>
                        <Link to="/user/forgot-password" className="text-xs font-semibold text-teal-600 hover:text-teal-800 transition">Forgot password?</Link>
                    </div>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Lock className="w-4 h-4 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
                        </div>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400 font-medium text-gray-800 text-sm"
                            placeholder="Enter your password"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 mt-2 bg-gradient-to-r from-teal-600 to-mint-600 text-white rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-mint-200/50 transition-all transform hover:-translate-y-0.5 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed group"
                >
                    {loading ? "Logging in..." : "Log In"}
                    {!loading && <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                </button>
            </form>

            <div className="mt-8 flex justify-center">
                <div className="bg-mint-50/50 backdrop-blur-sm border border-mint-100 px-6 py-3 rounded-full flex items-center gap-3 shadow-sm hover:bg-mint-50 transition-colors cursor-default group">
                    <span className="text-gray-500 text-sm font-medium">New to Derma Ai?</span>
                    <Link to="/user/register" className="text-teal-600 font-bold text-sm hover:text-teal-700 transition-colors flex items-center gap-1">
                        Create account <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                </div>
            </div>
        </UserAuthLayout>
    );
};

export default UserLogin;
