import React, { useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { LogOut, Bell, User, ChevronRight, Home } from 'lucide-react';

const AdminNavbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const adminName = localStorage.getItem('adminName') || 'Admin';

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminName');
        navigate('/admin/login');
    };

    // Breadcrumb Logic
    const breadcrumbs = useMemo(() => {
        const pathnames = location.pathname.split('/').filter((x) => x);
        return pathnames.map((value, index) => {
            const to = `/${pathnames.slice(0, index + 1).join('/')}`;
            // Format labels: "manage-users" -> "Manage Users"
            const label = value.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            return { label, to };
        });
    }, [location.pathname]);

    return (
        <nav className="bg-white/70 backdrop-blur-md border-b border-gray-100/50 px-6 py-4 flex justify-between items-center sticky top-0 z-40 transition-all duration-300">
            <div className="flex items-center gap-4">
                {/* Breadcrumbs */}
                <div className="flex items-center text-sm text-gray-500 font-medium bg-gray-50/50 px-3 py-1.5 rounded-xl border border-gray-100/50">
                    <Link to="/dashboard" className="flex items-center hover:text-indigo-600 transition-colors">
                        <Home size={16} />
                    </Link>
                    {breadcrumbs.map((crumb, index) => {
                        // Skip showing "Dashboard" text if we have the home icon, or handle logic as preferred
                        if (crumb.label === "Dashboard") return null;

                        const isLast = index === breadcrumbs.length - 1;
                        return (
                            <React.Fragment key={crumb.to}>
                                <ChevronRight size={14} className="mx-1 text-gray-300" />
                                {isLast ? (
                                    <span className="text-gray-800 font-semibold">{crumb.label}</span>
                                ) : (
                                    <Link to={crumb.to} className="hover:text-indigo-600 transition-colors">
                                        {crumb.label}
                                    </Link>
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>

            <div className="flex items-center gap-6">
                {/* Notifications */}
                <button className="relative p-2.5 text-gray-500 hover:text-indigo-600 transition-all rounded-full hover:bg-white/50 hover:shadow-sm group">
                    <Bell size={20} />
                    <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>

                    {/* Glassy Notification Toast (Hover/Mock) */}
                    <div className="absolute right-0 top-12 w-80 bg-white/80 backdrop-blur-xl border border-white/40 p-4 rounded-2xl shadow-xl invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-300 z-50 transform origin-top-right">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                                <Bell size={14} />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-gray-800">New User Registered</h4>
                                <p className="text-xs text-gray-500 mt-1 leading-relaxed">Anna Smith joined just now. Check the dashboard for details.</p>
                                <span className="text-[10px] text-gray-400 font-medium mt-2 block">2 mins ago</span>
                            </div>
                        </div>
                    </div>
                </button>

                {/* Profile Section */}
                <div className="flex items-center gap-3 pl-6 border-l border-gray-200/60">
                    <div className="text-right hidden md:block">
                        <div className="text-sm font-bold text-gray-800">{adminName}</div>
                        <div className="text-xs text-gray-500 font-medium">Administrator</div>
                    </div>

                    <div className="relative group">
                        <div
                            onClick={() => navigate('/dashboard/profile')}
                            className="w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-200 cursor-pointer overflow-hidden hover:scale-105 transition-transform"
                        >
                            <User size={20} />
                        </div>

                        {/* Dropdown Menu */}
                        <div className="absolute right-0 mt-3 w-52 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 py-2 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-300 transform origin-top-right z-50 translate-y-2 group-hover:translate-y-0">
                            <div className="px-4 py-2 border-b border-gray-100">
                                <p className="text-sm font-bold text-gray-800">Signed in as</p>
                                <p className="text-xs text-gray-500 truncate">{adminName}</p>
                            </div>
                            <button
                                onClick={() => navigate('/dashboard/profile')}
                                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-indigo-600 flex items-center gap-2 transition-colors"
                            >
                                <User size={16} />
                                Profile Settings
                            </button>
                            <button
                                onClick={handleLogout}
                                className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors rounded-b-xl"
                            >
                                <LogOut size={16} />
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default AdminNavbar;
