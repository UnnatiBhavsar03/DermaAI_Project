import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, Save, Camera, ShieldCheck } from 'lucide-react';

const AdminProfile = () => {
    const [admin, setAdmin] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        photo: localStorage.getItem('adminPhoto') || null
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        // Get admin ID from local storage (saved during login)
        const adminId = localStorage.getItem('adminId') || 1; // Default to 1 for dev if not set
        fetchAdminProfile(adminId);
    }, []);

    const fetchAdminProfile = async (id) => {
        try {
            const response = await fetch(`http://localhost:5001/api/admin/${id}`);
            const data = await response.json();
            if (data.status === 'success') {
                setAdmin(prev => ({
                    ...prev,
                    name: data.admin.name,
                    email: data.admin.email
                }));
            }
        } catch (error) {
            console.error("Error loading profile:", error);
        }
    };

    const handleChange = (e) => {
        setAdmin({ ...admin, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);

        if (admin.password && admin.password !== admin.confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match!' });
            return;
        }

        setLoading(true);
        const adminId = localStorage.getItem('adminId') || 1;

        try {
            const payload = {
                name: admin.name,
                email: admin.email,
                ...(admin.password && { password: admin.password }) // Only send password if changed
            };

            const response = await fetch(`http://localhost:5001/api/admin/${adminId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (data.status === 'success') {
                setMessage({ type: 'success', text: 'Profile updated successfully!' });
                // Update local storage name if changed
                localStorage.setItem('adminName', admin.name);
                // Clear password fields
                setAdmin(prev => ({ ...prev, password: '', confirmPassword: '' }));
            } else {
                setMessage({ type: 'error', text: data.message });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to update profile.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-[#0f172a]">Admin Profile</h1>
                <p className="text-slate-500 text-sm mt-1">Manage your account settings and security.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column - Profile Card */}
                <div className="md:col-span-1">
                    <div className="bg-white rounded-2xl shadow-sm border border-mint-100 p-6 flex flex-col items-center text-center">
                        <div className="relative mb-4 group cursor-pointer">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-mint-400 to-mint-600 p-1">
                                <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                                    {admin.photo ? (
                                        <img src={admin.photo} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={40} className="text-mint-600" />
                                    )}
                                </div>
                            </div>
                            <label className="absolute bottom-0 right-0 bg-white p-1.5 rounded-full shadow-md border border-mint-200 text-slate-400 hover:text-mint-600 transition-colors cursor-pointer">
                                <Camera size={16} />
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                                const base64String = reader.result;
                                                setAdmin(prev => ({ ...prev, photo: base64String }));
                                                localStorage.setItem('adminPhoto', base64String);
                                            };
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                />
                            </label>
                        </div>
                        <h2 className="text-xl font-bold text-[#0f172a]">{admin.name || 'Admin'}</h2>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-mint-50 text-mint-600 text-xs font-semibold mt-2">
                            <ShieldCheck size={12} />
                            Super Admin
                        </span>

                        <div className="w-full mt-6 pt-6 border-t border-mint-100 text-left space-y-3">
                            <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Account Info</div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Role</span>
                                <span className="font-medium text-[#0f172a]">Administrator</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Status</span>
                                <span className="font-medium text-mint-600">Active</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Joined</span>
                                <span className="font-medium text-[#0f172a]">Oct 2023</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Edit Form */}
                <div className="md:col-span-2">
                    <div className="bg-white rounded-2xl shadow-sm border border-mint-100 p-6">
                        <div className="mb-6 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-[#0f172a]">Edit Profile</h3>
                            {message && (
                                <span className={`text-sm px-3 py-1 rounded-full ${message.type === 'success' ? 'bg-mint-50 text-mint-600' : 'bg-red-50 text-red-600'}`}>
                                    {message.text}
                                </span>
                            )}
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Full Name</label>
                                    <div className="relative">
                                        <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            name="name"
                                            value={admin.name}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-mint-500/20 focus:border-mint-500 transition-all outline-none"
                                            placeholder="Admin Name"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Email Address</label>
                                    <div className="relative">
                                        <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="email"
                                            name="email"
                                            value={admin.email}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-mint-500/20 focus:border-mint-500 transition-all outline-none"
                                            placeholder="admin@example.com"
                                        />
                                    </div>
                                </div>
                            </div>

                            <hr className="border-mint-100" />

                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-[#0f172a]">Security</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">New Password</label>
                                        <div className="relative">
                                            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="password"
                                                name="password"
                                                value={admin.password}
                                                onChange={handleChange}
                                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-mint-500/20 focus:border-mint-500 transition-all outline-none"
                                                placeholder="Leave blank to keep current"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Confirm Password</label>
                                        <div className="relative">
                                            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="password"
                                                name="confirmPassword"
                                                value={admin.confirmPassword}
                                                onChange={handleChange}
                                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-mint-500/20 focus:border-mint-500 transition-all outline-none"
                                                placeholder="Confirm new password"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-[#0f172a] text-white font-medium rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <><span>Saving...</span></>
                                    ) : (
                                        <><Save size={18} /> <span>Save Changes</span></>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminProfile;
