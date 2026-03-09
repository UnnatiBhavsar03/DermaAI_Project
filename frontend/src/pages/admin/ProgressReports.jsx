
import React, { useState, useEffect } from "react";
import {
    Calendar,
    Trash2,
    TrendingUp,
    AlertTriangle,
} from "lucide-react";

const ProgressReports = () => {
    const [scans, setScans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('users'); // 'users' or 'reports'
    const [selectedUser, setSelectedUser] = useState(null);
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        scanId: null
    });

    const fetchScans = () => {
        fetch("http://localhost:5001/api/admin/all-scans")
            .then((res) => res.json())
            .then((data) => {
                if (data.status === "success") {
                    // Filter for Progress Reports
                    const progressScans = data.scans.filter(s => s.scan_type === "Progress Report");
                    setScans(progressScans);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    useEffect(() => {
        fetchScans();
    }, []);

    const initiateDelete = (id) => {
        setConfirmModal({ isOpen: true, scanId: id });
    };

    const confirmDelete = () => {
        const id = confirmModal.scanId;
        fetch(`http://localhost:5001/api/admin/delete-scan/${id}`, {
            method: "DELETE",
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.status === "success") {
                    setScans(scans.filter((s) => s.analysis_id !== id));
                }
            })
            .finally(() => setConfirmModal({ isOpen: false, scanId: null }));
    };

    // Group scans by user
    const userGroups = scans.reduce((acc, scan) => {
        if (!acc[scan.user_id]) {
            acc[scan.user_id] = {
                user_id: scan.user_id,
                name: scan.user_name,
                email: scan.user_email,
                count: 0,
                last_scan: scan.analysis_date
            };
        }
        acc[scan.user_id].count++;
        return acc;
    }, {});

    const users = Object.values(userGroups);

    const handleUserClick = (user) => {
        setSelectedUser(user);
        setView('reports');
    };

    return (
        <div className="p-8 min-h-screen bg-slate-50/50">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <p className="text-slate-400 font-medium">
                        Monitor patient progress and AI comparison results.
                    </p>
                </div>
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                            <TrendingUp className="text-mint-600" size={32} />
                            {view === 'users' ? 'User Progress Reports' : `${selectedUser?.name}'s Progress`}
                        </h2>
                        <p className="text-slate-400 font-medium mt-1">
                            {view === 'users' ? 'Select a user to view their progress history.' : 'Detailed view of patient progress over time.'}
                        </p>
                    </div>
                    {view === 'reports' && (
                        <button
                            onClick={() => { setView('users'); setSelectedUser(null); }}
                            className="px-4 py-2 bg-white text-slate-600 font-bold rounded-xl shadow-sm border border-slate-200 hover:bg-slate-50 transition-all"
                        >
                            Back to Users
                        </button>
                    )}
                </div>

                <div className="space-y-6">
                    {loading ? (
                        <div className="text-center py-20 text-slate-400">Loading reports...</div>
                    ) : view === 'users' ? (
                        /* USERS LIST VIEW */
                        users.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-[2rem] border border-slate-100 shadow-sm text-slate-400 font-bold">
                                No progress reports found.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {users.map(user => (
                                    <div
                                        key={user.user_id}
                                        onClick={() => handleUserClick(user)}
                                        className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 cursor-pointer hover:shadow-lg hover:border-mint-200 transition-all group"
                                    >
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-12 h-12 rounded-full bg-mint-100 flex items-center justify-center text-mint-600 font-bold text-xl group-hover:bg-mint-500 group-hover:text-white transition-colors">
                                                {user.name ? user.name[0].toUpperCase() : 'U'}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-800 group-hover:text-mint-600 transition-colors">{user.name}</h3>
                                                <p className="text-xs text-slate-400">{user.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center text-sm font-medium pt-4 border-t border-slate-50">
                                            <span className="text-slate-500">{user.count} Reports</span>
                                            <span className="text-mint-600">View Details →</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    ) : (
                        /* USER REPORTS DETAILED VIEW */
                        scans.filter(s => s.user_id === selectedUser.user_id).map((scan) => (
                            <div key={scan.analysis_id} className="bg-white rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 border border-mint-100 flex flex-col md:flex-row gap-6 items-start">
                                {/* Image Section */}
                                <div className="w-full md:w-64 shrink-0">
                                    <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 relative group">
                                        <img
                                            src={`http://localhost:5001/uploads/${scan.image_path.split('/').pop()}`}
                                            alt="Progress Scan"
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                                        <span className="absolute top-3 left-3 bg-mint-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                                            Current
                                        </span>
                                    </div>
                                </div>

                                <div className="flex-1 space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="text-xl font-black text-slate-800 mb-1">
                                                {scan.detected_issue}
                                            </h3>
                                            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
                                                <Calendar size={14} />
                                                {new Date(scan.analysis_date).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => initiateDelete(scan.analysis_id)}
                                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                            title="Delete Report"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>

                                    <div className="bg-mint-50/50 p-5 rounded-2xl border border-mint-100">
                                        <p className="text-slate-600 leading-relaxed font-medium">
                                            {scan.summary || "No summary available."}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                {/* Confirmation Modal */}
                {confirmModal.isOpen && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in text-center">
                        <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl max-w-sm w-full border border-white/50 overflow-hidden p-8">
                            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4 text-red-500">
                                <AlertTriangle size={32} />
                            </div>
                            <h3 className="text-xl font-black text-gray-800 mb-2">Delete Report?</h3>
                            <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                                Are you sure you want to delete this progress report? This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setConfirmModal({ isOpen: false, scanId: null })}
                                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 shadow-lg shadow-red-200 transition-all hover:scale-[1.02]"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProgressReports;
