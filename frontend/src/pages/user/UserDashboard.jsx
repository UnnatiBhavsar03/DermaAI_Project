import React, { useState, useEffect } from 'react';
import { ArrowRight, Scan, Clock, Activity, Plus, Sparkles, TrendingUp, Calendar, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const UserDashboard = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [scans, setScans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        issues_detected: 0
    });

    useEffect(() => {
        if (user.user_id) {
            fetch(`http://localhost:5001/api/user/scans/${user.user_id}`)
                .then(res => res.json())
                .then(data => {
                    if (data.status === 'success') {
                        const sortedScans = data.scans || [];
                        setScans(sortedScans);

                        // Calculate Stats
                        const pendingCount = sortedScans.filter(s => !s.is_reviewed).length;
                        const issueCount = sortedScans.filter(s => s.detected_issue && s.detected_issue !== 'No Issue').length;

                        setStats({
                            total: sortedScans.length,
                            pending: pendingCount,
                            issues_detected: issueCount
                        });
                    }
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setLoading(false);
                });
        }
    }, [user.user_id]);

    const getTimeGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    const handleDeleteScan = async (e, analysis_id) => {
        e.preventDefault();
        e.stopPropagation();

        if (!window.confirm("Are you sure you want to delete this pending scan?")) return;

        try {
            const res = await fetch(`http://localhost:5001/api/user/scan/${analysis_id}?user_id=${user.user_id}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.status === 'success') {
                const deletedScan = scans.find(s => s.analysis_id === analysis_id);
                setScans(prev => prev.filter(s => s.analysis_id !== analysis_id));
                setStats(prev => ({
                    ...prev,
                    total: prev.total - 1,
                    pending: prev.pending - 1,
                    issues_detected: deletedScan && deletedScan.detected_issue !== 'No Issue' ? prev.issues_detected - 1 : prev.issues_detected
                }));
            } else {
                alert(data.message || "Failed to delete scan");
            }
        } catch (err) {
            console.error("Delete error:", err);
            alert("Network error while trying to delete.");
        }
    };

    return (
        <div className="animate-fade-in-up max-w-7xl mx-auto space-y-8 pb-12">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                        {getTimeGreeting()}, <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-mint-500">{user.name?.split(' ')[0] || 'Friend'}</span>! 👋
                    </h1>
                    <p className="text-gray-500 mt-2 text-lg font-medium">Your personalized skin health command center.</p>
                </div>
                <div className="text-sm font-bold px-5 py-2.5 bg-white border border-gray-100 rounded-full text-gray-500 shadow-sm flex items-center gap-2">
                    <Calendar size={16} className="text-teal-500" />
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </div>
            </div>

            {/* Main Action Card */}
            <div className="bg-gradient-to-br from-teal-600 to-mint-600 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl shadow-mint-200/50 relative overflow-hidden group">
                <div className="relative z-10 max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-xs font-bold uppercase tracking-wider mb-6 shadow-sm">
                        <Sparkles size={12} className="text-yellow-300 fill-yellow-300 animate-pulse" />
                        AI Powered Analysis
                    </div>
                    <h2 className="text-3xl md:text-5xl font-black mb-6 font-serif leading-tight">
                        Check Your Skin Health
                    </h2>
                    <p className="text-teal-50 text-lg mb-8 max-w-lg leading-relaxed font-medium">
                        Using advanced AI to analyze your skin condition. Get instant results and personalized recommendations in seconds.
                    </p>
                    <Link to="/user/analysis" className="bg-white text-teal-700 font-bold px-8 py-4 rounded-2xl inline-flex items-center gap-3 hover:bg-teal-50 transition-all shadow-lg hover:shadow-xl hover:shadow-white/20 transform hover:-translate-y-1">
                        Start New Analysis <ArrowRight size={20} />
                    </Link>
                </div>

                {/* Decorative Elements */}
                <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-1/4 translate-y-1/4 group-hover:scale-105 transition-transform duration-1000">
                    <Scan size={450} strokeWidth={1} />
                </div>
                <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-900/20 rounded-full blur-2xl -ml-16 -mb-16"></div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Scans Card */}
                <div className="bg-white/80 backdrop-blur-xl border border-white/60 p-6 rounded-[2rem] shadow-sm hover:shadow-lg transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110">
                        <Scan size={80} className="text-teal-600" />
                    </div>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="p-3.5 bg-teal-50 text-teal-600 rounded-2xl group-hover:scale-110 transition-transform shadow-sm">
                            <Clock size={24} />
                        </div>
                    </div>
                    <div className="relative z-10">
                        <div className="text-sm text-gray-500 font-bold uppercase tracking-wide mb-1">Total Scans</div>
                        <div className="text-3xl font-black text-gray-900">{stats.total}</div>
                    </div>
                </div>

                {/* Skin Type Card */}
                <Link to="/user/profile" className="bg-white/80 backdrop-blur-xl border border-white/60 p-6 rounded-[2rem] shadow-sm hover:shadow-lg transition-all group relative overflow-hidden cursor-pointer">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110">
                        <Activity size={80} className="text-purple-600" />
                    </div>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="p-3.5 bg-purple-50 text-purple-600 rounded-2xl group-hover:scale-110 transition-transform shadow-sm">
                            <Activity size={24} />
                        </div>
                        <div className="px-2 py-1 bg-gray-100 rounded-lg text-[10px] font-bold text-gray-500 uppercase">Edit</div>
                    </div>
                    <div className="relative z-10">
                        <div className="text-sm text-gray-500 font-bold uppercase tracking-wide mb-1">Skin Type</div>
                        <div className="text-2xl font-black text-gray-900 truncate">
                            {user.skin_type || <span className="text-gray-400 text-lg">Set Profile</span>}
                        </div>
                    </div>
                </Link>

                {/* Progress Report Card */}
                <Link to="/user/progress-report" className="bg-white/80 backdrop-blur-xl border border-white/60 p-6 rounded-[2rem] shadow-sm hover:shadow-lg transition-all group relative overflow-hidden cursor-pointer">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110">
                        <TrendingUp size={80} className="text-indigo-600" />
                    </div>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:scale-110 transition-transform shadow-sm">
                            <TrendingUp size={24} />
                        </div>
                        <div className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-bold uppercase">New</div>
                    </div>
                    <div className="relative z-10">
                        <div className="text-sm text-gray-500 font-bold uppercase tracking-wide mb-1">Progress</div>
                        <div className="text-xl font-black text-gray-900 leading-tight">Compare Scans</div>
                    </div>
                </Link>

                {/* Start New Card - Different Style */}
                <Link to="/user/analysis" className="bg-white/50 border-2 border-dashed border-gray-200 p-6 rounded-[2rem] hover:bg-white hover:border-teal-200 transition-all flex flex-col items-center justify-center cursor-pointer group text-center h-full">
                    <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-gray-400 shadow-sm mb-3 group-hover:text-teal-600 group-hover:scale-110 group-hover:rotate-90 transition-all duration-300">
                        <Plus size={28} />
                    </div>
                    <span className="text-sm font-bold text-gray-500 group-hover:text-teal-700 transition-colors">Start New Analysis</span>
                </Link>
            </div>

            {/* Recent Activity Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-2xl font-bold text-gray-900">Recent Activity</h3>
                    <div className="flex items-center gap-3">
                        {scans.length > 0 && (
                            <span className="text-sm font-bold text-gray-400 hidden md:inline">{scans.length} Total Scans</span>
                        )}
                        <Link to="/user/analysis" className="p-2 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-all shadow-md group">
                            <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                        </Link>
                    </div>
                </div>

                {loading ? (
                    <div className="grid md:grid-cols-2 gap-4">
                        {[1, 2].map(i => (
                            <div key={i} className="h-32 bg-gray-100 rounded-3xl animate-pulse"></div>
                        ))}
                    </div>
                ) : scans.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {scans.map((scan) => (
                            <Link
                                to={`/user/scan/${scan.analysis_id}`}
                                key={scan.analysis_id}
                                className="bg-white p-5 rounded-[2rem] flex flex-col gap-4 border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all group"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-50 shadow-inner">
                                            <img
                                                src={`http://localhost:5001/uploads/${scan.image_path.split('/').pop()}`}
                                                alt="Scan"
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                onError={(e) => e.target.src = "https://via.placeholder.com/150?text=No+Img"}
                                            />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 text-lg group-hover:text-teal-700 transition-colors line-clamp-1">
                                                {scan.detected_issue}
                                            </h4>
                                            <p className="text-xs font-medium text-gray-400 flex items-center gap-1 mt-1">
                                                <Calendar size={10} /> {new Date(scan.analysis_date).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 relative z-20">
                                        <button
                                            onClick={(e) => handleDeleteScan(e, scan.analysis_id)}
                                            className="p-2 rounded-full bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 transition-colors shadow-sm"
                                            title="Delete Scan"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                        <div className={`p-2 rounded-full ${scan.is_reviewed ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                                            {scan.is_reviewed ? <Activity size={16} /> : <Clock size={16} />}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${scan.is_reviewed ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                                        {scan.is_reviewed ? 'Verified by AI' : 'Pending Review'}
                                    </span>
                                    <div className="flex items-center gap-1 text-sm font-bold text-teal-600 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0">
                                        Details <ArrowRight size={16} />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    /* Empty State */
                    <div className="bg-white/60 border-2 border-dashed border-gray-200 rounded-[2.5rem] p-16 text-center flex flex-col items-center">
                        <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center text-teal-300 mb-6 group">
                            <Scan size={40} />
                        </div>
                        <h4 className="text-xl font-bold text-gray-900 mb-2">No history yet</h4>
                        <p className="text-gray-500 text-base max-w-sm mx-auto mb-8">
                            Your skin analysis journey begins here. Take your first scan to receive personalized insights.
                        </p>
                        <Link to="/user/analysis" className="bg-gray-900 text-white font-bold px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200">
                            Start First Scan
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserDashboard;
