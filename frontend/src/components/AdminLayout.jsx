
import React, { useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, User, LogOut, Menu, X, ClipboardList, Shield, Activity, FileText, ChevronRight } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const AdminLayout = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { addToast } = useToast();

    const handleLogout = () => {
        // Logic to clear admin session
        // For now just navigate
        addToast('Admin logged out', 'success');
        navigate('/admin/login');
    };

    return (
        <div className="min-h-screen bg-mint-50/50 flex font-sans">
            {/* Sidebar - Desktop */}
            <aside className="w-64 bg-white/80 backdrop-blur-xl border-r border-slate-200 h-screen sticky top-0 hidden md:flex flex-col z-40 shadow-xl shadow-slate-200/50">
                <div className="h-20 flex items-center px-8 border-b border-slate-100">
                    <Link to="/dashboard" className="text-2xl font-black tracking-tight text-slate-800 flex items-center gap-2">
                        <Shield className="text-mint-500" /> Derma <span className="text-mint-500">Admin</span>
                    </Link>
                </div>

                <div className="flex-1 py-8 px-4 space-y-2">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest px-4 mb-2">Overview</div>
                    <NavLink to="/dashboard" end className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${isActive ? 'bg-mint-500 text-white shadow-lg shadow-mint-500/30' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'} `}>
                        <LayoutDashboard size={20} /> Dashboard
                    </NavLink>

                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest px-4 mb-2 mt-6">Management</div>
                    <NavLink to="/dashboard/users" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${isActive ? 'bg-mint-500 text-white shadow-lg shadow-mint-500/30' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'} `}>
                        <Users size={20} /> Users
                    </NavLink>
                    <NavLink to="/dashboard/scans" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${isActive ? 'bg-mint-500 text-white shadow-lg shadow-mint-500/30' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'} `}>
                        <ClipboardList size={20} /> Scans
                    </NavLink>
                    <NavLink to="/dashboard/progress-reports" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${isActive ? 'bg-mint-500 text-white shadow-lg shadow-mint-500/30' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'} `}>
                        <Activity size={20} /> Progress
                    </NavLink>

                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest px-4 mb-2 mt-6">Settings</div>
                    <NavLink to="/dashboard/profile" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${isActive ? 'bg-mint-500 text-white shadow-lg shadow-mint-500/30' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'} `}>
                        <User size={20} /> Admin Profile
                    </NavLink>
                </div>

                <div className="p-4 border-t border-slate-100">
                    <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full rounded-xl font-bold text-slate-500 hover:text-red-500 hover:bg-red-50 transition-all">
                        <LogOut size={20} /> Log Out
                    </button>
                </div>
            </aside>

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
                    <div className="w-64 h-full bg-[#0f172a] text-white shadow-2xl p-4 flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-8">
                            <div className="text-xl font-bold flex items-center gap-2"><Shield className="text-mint-400" /> Admin</div>
                            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-400"><X size={24} /></button>
                        </div>
                        <nav className="space-y-2 flex-1">
                            <NavLink to="/dashboard" end onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `flex items - center gap - 3 px - 4 py - 3 rounded - xl font - bold ${isActive ? 'bg-mint-500 text-white' : 'text-slate-400'} `}>
                                <LayoutDashboard size={20} /> Dashboard
                            </NavLink>
                            <NavLink to="/dashboard/users" onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `flex items - center gap - 3 px - 4 py - 3 rounded - xl font - bold ${isActive ? 'bg-mint-500 text-white' : 'text-slate-400'} `}>
                                <Users size={20} /> Users
                            </NavLink>
                            <NavLink to="/dashboard/scans" onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `flex items - center gap - 3 px - 4 py - 3 rounded - xl font - bold ${isActive ? 'bg-mint-500 text-white' : 'text-slate-400'} `}>
                                <ClipboardList size={20} /> Scans
                            </NavLink>
                        </nav>
                        <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-red-400 mt-auto">
                            <LogOut size={20} /> Log Out
                        </button>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                {/* Header */}
                <header className="bg-white/80 backdrop-blur-xl border-b border-mint-100 h-20 px-8 flex items-center justify-between shadow-sm flex-shrink-0 z-20">
                    <div className="flex items-center gap-4">
                        <button className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg" onClick={() => setIsMobileMenuOpen(true)}>
                            <Menu size={24} />
                        </button>

                        {/* Breadcrumbs */}
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <Link to="/dashboard" className="text-slate-400 hover:text-mint-600 transition-colors">Dashboard</Link>
                            {location.pathname !== '/dashboard' && location.pathname.split('/').filter(Boolean).slice(1).map((segment, index, array) => {
                                const path = `/dashboard/${array.slice(0, index + 1).join('/')}`;
                                const isLast = index === array.length - 1;
                                return (
                                    <React.Fragment key={path}>
                                        <ChevronRight size={16} className="text-slate-300" />
                                        {isLast ? (
                                            <span className="text-slate-800 capitalize">
                                                {segment.replace('-', ' ')}
                                            </span>
                                        ) : (
                                            <Link to={path} className="text-slate-400 hover:text-mint-600 transition-colors capitalize">
                                                {segment.replace('-', ' ')}
                                            </Link>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 pl-4 border-l border-mint-100">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold text-slate-800">Administrator</p>
                                <p className="text-xs text-slate-500">Super User</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-mint-100 flex items-center justify-center text-mint-600 font-bold border border-mint-200">
                                A
                            </div>
                        </div>
                    </div>
                </header>

                {/* Scrollable Content Area */}
                <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-mint-50/30 scroll-smooth">
                    <div className="max-w-7xl mx-auto pb-10">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
