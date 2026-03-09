import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Calendar, Activity, Clock, Check, Eye } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const AdminUserDetail = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [user, setUser] = useState(null);
    const [scans, setScans] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch User Details - reusing fetchUsers since we don't have single user endpoint yet or filtering client side
                // Optimally we'd have /api/admin/user/:id, but logic in ManageUsers was different.
                // Let's assume we can GET user detail or specific list. 
                // Wait, ManageUsers fetches ALL and filtered. 
                // Implementation Plan didn't specify READ user ID endpoint, but `update_user` exists.
                // I'll cheat and fetch all users and find, OR add a GET endpoint.
                // Actually, let's just fetch all users for now to be safe with existing backend.
                // UPDATE: I can add a simple GET point or use the list. 
                // Let's just use the list for now to avoid modifying backend again if not strictly needed, 
                // BUT `get_user_scans_admin` was just added.

                const userResponse = await fetch('http://localhost:5001/api/admin/users');
                const userData = await userResponse.json();

                if (userData.status === 'success') {
                    const foundUser = userData.users.find(u => u.user_id === parseInt(userId));
                    if (foundUser) {
                        setUser(foundUser);

                        // Fetch Scans
                        const scanResponse = await fetch(`http://localhost:5001/api/admin/user/${userId}/scans`);
                        const scanData = await scanResponse.json();
                        if (scanData.status === 'success') {
                            setScans(scanData.scans);
                        }
                    } else {
                        addToast('User not found', 'error');
                        navigate('/dashboard/users');
                    }
                }
            } catch (error) {
                console.error("Error fetching data:", error);
                addToast('Error loading user data', 'error');
            } finally {
                setLoading(false);
            }
        };

        if (userId) fetchData();
    }, [userId, navigate, addToast]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mint-600"></div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="space-y-8 animate-fade-in-up">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link to="/dashboard/users" className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500">
                    <ArrowLeft size={24} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">User Profile: {user.name}</h1>
                    <p className="text-gray-500 text-sm">Manage user details and view skin analysis history.</p>
                </div>
            </div>

            {/* User Info Card */}
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-mint-100 flex flex-col md:flex-row gap-8 items-start md:items-center">
                <div className="flex-shrink-0">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-mint-400 to-mint-600 p-1">
                        <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                            <div className="text-3xl font-bold text-mint-600">{user.name.charAt(0).toUpperCase()}</div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email</label>
                        <div className="flex items-center gap-2 font-medium text-[#0f172a]">
                            <Mail size={16} className="text-mint-500" /> {user.email}
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Skin Type</label>
                        <div className="flex items-center gap-2 font-medium text-[#0f172a]">
                            <Activity size={16} className="text-mint-500" />
                            <span className={`px-2 py-0.5 rounded-lg text-sm ${user.skin_type ? 'bg-mint-50 text-mint-700' : 'bg-slate-100 text-slate-500'}`}>
                                {user.skin_type || 'Unknown'}
                            </span>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Joined</label>
                        <div className="flex items-center gap-2 font-medium text-[#0f172a]">
                            <Calendar size={16} className="text-mint-500" /> {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Scans</label>
                        <div className="flex items-center gap-2 font-bold text-2xl text-[#0f172a]">
                            {scans.length}
                        </div>
                    </div>
                </div>
            </div>

            {/* Scans History */}
            <div>
                <h2 className="text-xl font-bold text-[#0f172a] mb-6">Scan History</h2>

                {scans.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center text-slate-400 border border-dashed border-mint-200">
                        <Activity size={48} className="mx-auto mb-4 opacity-50 text-mint-300" />
                        <p className="font-medium">No skin analysis history available.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {scans.map(scan => (
                            <div key={scan.analysis_id} className="bg-white rounded-3xl p-5 shadow-sm border border-mint-100 hover:shadow-md transition-all group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold shadow-md ${scan.detected_issue === 'No Issues' ? 'bg-mint-500 shadow-mint-200' : 'bg-amber-500 shadow-amber-200'
                                            }`}>
                                            {(scan.confidence_score * 100).toFixed(0)}%
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-[#0f172a]">{scan.detected_issue}</h3>
                                            <p className="text-xs text-slate-400 flex items-center gap-1">
                                                <Clock size={12} /> {new Date(scan.analysis_date).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    {scan.is_reviewed && (
                                        <div className="bg-mint-100 text-mint-700 p-1.5 rounded-full" title="Verified by Expert">
                                            <Check size={14} strokeWidth={3} />
                                        </div>
                                    )}
                                </div>

                                <div className="h-32 bg-slate-100 rounded-2xl overflow-hidden mb-4 relative">
                                    {scan.image_path ? (
                                        <img
                                            src={`http://localhost:5001/uploads/${scan.image_path.split("/").pop()}`}
                                            alt="Scan"
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300">No Image</div>
                                    )}
                                </div>

                                <button onClick={() => navigate(`/dashboard/verification/${scan.analysis_id}`)} className="w-full py-2.5 rounded-xl bg-slate-50 text-slate-600 font-bold text-sm hover:bg-mint-50 hover:text-mint-600 transition-colors flex items-center justify-center gap-2">
                                    <Eye size={16} /> View Analysis
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminUserDetail;
