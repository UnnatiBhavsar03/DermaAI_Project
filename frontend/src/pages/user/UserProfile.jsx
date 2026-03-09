import React, { useState, useEffect } from 'react';
import { User, Mail, Calendar, Smile, Shield, Save, X, Camera, Edit3, Check, Trash2, Lock, LogOut } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useNavigate } from 'react-router-dom';

const UserProfile = () => {
    const navigate = useNavigate();
    const { addToast } = useToast();

    // Initialize user state from localStorage
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Modals
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showDeactivateModal, setShowDeactivateModal] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        skin_type: '',
        email: ''
    });

    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: ''
    });

    useEffect(() => {
        setFormData({
            name: user.name || '',
            skin_type: user.skin_type || '',
            email: user.email || ''
        });
    }, [user]);

    const handleSaveProfile = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`http://localhost:5001/api/admin/user/${user.user_id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await response.json();

            if (data.status === 'success') {
                const updatedUser = { ...user, ...formData };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                setUser(updatedUser);
                setIsEditing(false);
                window.dispatchEvent(new Event('storage'));
                addToast('Profile updated successfully!', 'success');
            } else {
                addToast(data.message || 'Failed to update profile', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            addToast('Network error. Please try again.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (passwordData.new_password !== passwordData.confirm_password) {
            addToast("New passwords don't match", 'error');
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`http://localhost:5001/api/user/${user.user_id}/change-password`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(passwordData),
            });
            const data = await response.json();

            if (data.status === 'success') {
                addToast('Password changed successfully', 'success');
                setShowPasswordModal(false);
                setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
            } else {
                addToast(data.message || 'Failed to change password', 'error');
            }
        } catch (error) {
            addToast('Network error', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeactivateAccount = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`http://localhost:5001/api/user/${user.user_id}/deactivate`, {
                method: 'POST',
            });
            const data = await response.json();

            if (data.status === 'success') {
                addToast('Account deactivated. Goodbye!', 'success');
                localStorage.removeItem('user');
                navigate('/user/login');
            } else {
                addToast(data.message || 'Failed to deactivate', 'error');
            }
        } catch (error) {
            addToast('Network error', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result;
                const updatedUser = { ...user, profile_image: base64String };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                setUser(updatedUser);
                window.dispatchEvent(new Event('storage'));
                addToast('Profile photo updated!', 'success');
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="animate-fade-in-up max-w-5xl mx-auto pb-12">

            {/* Header / Cover */}
            <div className="relative mb-32 md:mb-24 z-0 group">
                <div className="h-36 md:h-64 bg-gradient-to-r from-teal-500 to-mint-500 rounded-[2rem] md:rounded-[3rem] shadow-2xl shadow-mint-200/50 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 transform group-hover:scale-110 transition-transform duration-1000"></div>
                    <div className="absolute bottom-0 left-0 w-72 h-72 bg-teal-900/10 rounded-full blur-3xl -ml-20 -mb-20"></div>
                    {/* Pattern Overlay */}
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]"></div>
                </div>

                {/* Profile Card Overlay */}
                <div className="absolute -bottom-20 left-0 right-0 px-4 md:px-12 flex flex-col md:flex-row items-end md:items-end justify-between gap-4 md:gap-6 z-10">
                    <div className="flex items-end gap-8">
                        {/* Avatar */}
                        <div className="w-28 h-28 md:w-40 md:h-40 rounded-full p-2 bg-white shadow-2xl relative z-10 group/avatar cursor-pointer">
                            <div className="w-full h-full rounded-full bg-gradient-to-tr from-gray-100 to-gray-200 flex items-center justify-center text-gray-400 overflow-hidden relative shadow-inner">
                                {user.profile_image ? (
                                    <img src={user.profile_image} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    user.name ? (
                                        <span className="text-5xl font-bold text-gray-500">{user.name.charAt(0).toUpperCase()}</span>
                                    ) : (
                                        <User size={64} />
                                    )
                                )}

                                {/* Hover Overlay for Upload */}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center rounded-full backdrop-blur-[2px]">
                                    <Camera className="text-white drop-shadow-lg" size={32} />
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                    title="Change Profile Photo"
                                />
                            </div>
                            <div className="absolute bottom-2 right-2 w-10 h-10 bg-blue-500 border-[3px] border-white rounded-full flex items-center justify-center text-white shadow-md pointer-events-none z-30" title="Verified User">
                                <Shield size={16} fill="currentColor" />
                            </div>
                        </div>

                        {/* Name & Email (Desktop) */}
                        <div className="mb-4 hidden md:block">
                            {isEditing ? (
                                <div className="space-y-2">
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="text-4xl font-bold text-gray-900 bg-white/50 backdrop-blur-sm border-b-2 border-teal-500 focus:outline-none px-2 py-1 min-w-[300px]"
                                        placeholder="Your Name"
                                        autoFocus
                                    />
                                    <input
                                        type="text"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="block text-gray-600 bg-white/50 backdrop-blur-sm border-b-2 border-gray-300 focus:border-teal-400 focus:outline-none px-2 py-1 text-sm font-medium w-full"
                                        placeholder="Your Email"
                                    />
                                </div>
                            ) : (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">{user.name || 'User Name'}</h1>
                                    <p className="text-gray-500 font-medium text-lg flex items-center gap-2 mt-1">
                                        <Mail size={16} className="text-teal-500" /> {user.email || 'email@example.com'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mb-4 flex gap-3">
                        {/* Edit/Save Buttons */}
                        {isEditing ? (
                            <>
                                <button
                                    onClick={handleSaveProfile}
                                    disabled={isLoading}
                                    className="px-8 py-3 bg-teal-600 text-white rounded-2xl font-bold shadow-lg shadow-teal-200 hover:bg-teal-700 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2 z-20 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    ) : (
                                        <> <Save size={20} /> Save Changes </>
                                    )}
                                </button>
                                <button
                                    onClick={() => {
                                        setIsEditing(false);
                                        setFormData({
                                            name: user.name || '',
                                            skin_type: user.skin_type || '',
                                            email: user.email || ''
                                        });
                                    }}
                                    disabled={isLoading}
                                    className="px-5 py-3 bg-white border border-gray-200 text-gray-500 rounded-2xl font-bold hover:bg-gray-50 hover:text-gray-700 transition-all z-20 shadow-sm"
                                >
                                    <X size={20} />
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="px-8 py-3 bg-white border border-gray-200 rounded-2xl font-bold text-gray-700 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer z-20"
                            >
                                <Edit3 size={18} /> Edit Profile
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Name (Below Header) */}
            <div className="md:hidden px-4 mb-8 text-center">
                {isEditing ? (
                    <div className="space-y-3">
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="text-3xl font-bold text-center text-gray-900 bg-white border border-gray-200 rounded-xl px-4 py-2 w-full"
                            placeholder="Your Name"
                        />
                        <input
                            type="text"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="text-center text-gray-600 bg-white border border-gray-200 rounded-xl px-4 py-2 w-full"
                            placeholder="Your Email"
                        />
                    </div>
                ) : (
                    <>
                        <h1 className="text-3xl font-black text-gray-900">{user.name || 'User Name'}</h1>
                        <p className="text-gray-500">{user.email || 'email@example.com'}</p>
                    </>
                )}
            </div>

            {/* Content Grid */}
            <div className="grid md:grid-cols-2 gap-8 px-4 h-full">
                {/* Personal Information */}
                <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-[2.5rem] p-8 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                            <span className="p-3 bg-teal-50 text-teal-600 rounded-2xl"><User size={24} /></span>
                            Personal Details
                        </h2>

                        <div className="space-y-6">
                            {/* Skin Type Field */}
                            <div className="group">
                                <div className="flex items-center justify-between pointer-events-none">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block pl-1">Skin Type</label>
                                </div>
                                <div className={`relative flex items-center p-4 bg-gray-50 rounded-2xl border-2 transition-all ${isEditing ? 'border-teal-100 bg-white' : 'border-transparent'}`}>
                                    <div className="p-2.5 bg-white rounded-xl text-teal-400 shadow-sm mr-4">
                                        <Smile size={20} />
                                    </div>
                                    <div className="flex-1">
                                        {isEditing ? (
                                            <select
                                                value={formData.skin_type}
                                                onChange={(e) => setFormData({ ...formData, skin_type: e.target.value })}
                                                className="block w-full bg-transparent text-gray-900 font-bold focus:outline-none appearance-none cursor-pointer"
                                            >
                                                <option value="">Select Skin Type</option>
                                                <option value="Oily">Oily</option>
                                                <option value="Dry">Dry</option>
                                                <option value="Combination">Combination</option>
                                                <option value="Normal">Normal</option>
                                                <option value="Sensitive">Sensitive</option>
                                            </select>
                                        ) : (
                                            <div className="font-bold text-xl text-gray-900">{user.skin_type || 'Take the quiz'}</div>
                                        )}
                                    </div>
                                    {isEditing && <span className="absolute right-4 text-gray-400 pointer-events-none">▼</span>}
                                </div>
                            </div>

                            {/* Email Details (Static View in List) */}
                            <div className="flex items-center p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                                <div className="p-2.5 bg-white rounded-xl text-gray-400 shadow-sm mr-4">
                                    <Mail size={20} />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wide">Email Address</div>
                                    <div className="font-bold text-gray-900">{user.email || 'Not verified'}</div>
                                </div>
                            </div>

                            {/* Join Date */}
                            <div className="flex items-center p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                                <div className="p-2.5 bg-white rounded-xl text-gray-400 shadow-sm mr-4">
                                    <Calendar size={20} />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wide">Member Since</div>
                                    <div className="font-bold text-gray-900">{user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Unknown'}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Account Settings */}
                <div className="space-y-6">
                    <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-[2.5rem] p-8 shadow-sm h-full">
                        <h2 className="text-xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                            <span className="p-3 bg-purple-50 text-purple-600 rounded-2xl"><Shield size={24} /></span>
                            Security & Account
                        </h2>

                        <div className="space-y-4">
                            <button onClick={() => setShowPasswordModal(true)} className="w-full flex items-center justify-between p-5 rounded-2xl border border-gray-100 hover:border-teal-200 hover:shadow-md transition-all text-left group bg-white">
                                <span className="font-bold text-gray-700 group-hover:text-teal-800 transition-colors">Change Password</span>
                                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-teal-50 group-hover:text-teal-600 transition-all">
                                    <Shield size={18} />
                                </div>
                            </button>

                            <button onClick={() => setShowDeactivateModal(true)} className="w-full flex items-center justify-between p-5 rounded-2xl border border-gray-100 hover:border-red-200 hover:shadow-md transition-all text-left group bg-white">
                                <span className="font-bold text-red-600/80 group-hover:text-red-600 transition-colors">Deactivate Account</span>
                                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-300 group-hover:bg-red-100 group-hover:text-red-500 transition-all">
                                    <X size={18} />
                                </div>
                            </button>
                        </div>

                        <div className="mt-8 p-6 bg-gradient-to-br from-teal-50 to-mint-50 rounded-3xl border border-teal-100/50">
                            <h4 className="font-bold text-teal-900 mb-2 flex items-center gap-2">
                                <Shield size={16} className="text-teal-600" /> Privacy Note
                            </h4>
                            <p className="text-sm text-teal-800/70 leading-relaxed">
                                Your data is encrypted and securely stored. We only share insights with your explicit consent.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Password Modal */}
            {
                showPasswordModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
                        <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl animate-fade-in-up">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                                    <Lock className="text-teal-500" /> Change Password
                                </h3>
                                <button onClick={() => setShowPasswordModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Current Password</label>
                                    <input
                                        type="password"
                                        value={passwordData.current_password}
                                        onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">New Password</label>
                                    <input
                                        type="password"
                                        value={passwordData.new_password}
                                        onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Confirm Password</label>
                                    <input
                                        type="password"
                                        value={passwordData.confirm_password}
                                        onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                                    />
                                </div>
                                <button
                                    onClick={handleChangePassword}
                                    disabled={isLoading || !passwordData.current_password || !passwordData.new_password}
                                    className="w-full mt-4 py-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-lg shadow-teal-200 hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? 'Updating...' : 'Update Password'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Deactivate Modal */}
            {
                showDeactivateModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md px-4">
                        <div className="bg-white rounded-3xl w-full max-w-sm p-8 shadow-2xl text-center animate-fade-in">
                            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <LogOut size={32} />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 mb-2">Deactivate Account?</h3>
                            <p className="text-gray-500 mb-8">
                                This action is permanent and cannot be undone. All your data will be permanently removed.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeactivateModal(false)}
                                    className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeactivateAccount}
                                    disabled={isLoading}
                                    className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-200 hover:bg-red-600 transition-colors disabled:opacity-70"
                                >
                                    {isLoading ? 'Deleting...' : 'Yes, Deactivate'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default UserProfile;
