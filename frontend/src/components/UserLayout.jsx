import React from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut, Scan, History, UserCircle, ChevronRight, Menu, X } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const UserLayout = () => {
    const navigate = useNavigate();
    const [user, setUser] = React.useState(JSON.parse(localStorage.getItem('user') || '{}'));
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
    const { addToast } = useToast();

    // Listen for updates to user data (like profile image changes)
    React.useEffect(() => {
        const handleStorageChange = () => {
            setUser(JSON.parse(localStorage.getItem('user') || '{}'));
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const handleLogout = async () => {
        try {
            await fetch('http://localhost:5001/api/user/logout', {
                method: 'POST',
                credentials: 'include', // sends the session_token cookie
            });
        } catch (e) {
            // If the request fails, still log out locally
        }
        localStorage.removeItem('user');
        addToast('Logged out successfully', 'success');
        navigate('/user/login');
    };

    // Breadcrumbs Logic
    const path = window.location.pathname;
    // Remove empty segments and 'user' base path from display
    const pathSegments = path.split('/').filter(segment => segment && segment !== 'user');

    // If we are at /user or /user/dashboard, show Dashboard as root
    // If proper breadcrumbs needed: Dashboard > New Analysis etc.

    const getBreadcrumbName = (segment) => {
        const names = {
            'dashboard': 'Dashboard',
            'profile': 'Profile',
            'analysis': 'New Analysis',
            'progress-report': 'Progress Report',
            'scan': 'Scan Details'
        };
        return names[segment] || segment;
    };

    return (
        <div className="min-h-screen bg-mint-50 flex font-sans">
            {/* Sidebar - Desktop */}
            <aside className="w-64 bg-white/80 backdrop-blur-xl border-r border-white/50 h-screen sticky top-0 hidden md:flex flex-col z-40 shadow-sm">
                <div className="h-20 flex items-center px-8 border-b border-white/40">
                    <Link to="/" className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-mint-600 font-cursive cursor-pointer hover:scale-105 transition-transform">
                        Derma Ai
                    </Link>
                </div>

                <div className="flex-1 py-8 px-4 space-y-2">
                    <NavLink
                        to="/user/dashboard"
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all duration-300 group ${isActive
                                ? 'bg-gradient-to-r from-teal-500 to-mint-500 text-white shadow-lg shadow-mint-200/50'
                                : 'text-gray-500 hover:text-teal-600 hover:bg-white/50'
                            }`
                        }
                    >
                        <LayoutDashboard size={20} />
                        <span>Dashboard</span>
                    </NavLink>

                    <NavLink
                        to="/user/analysis"
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all duration-300 group ${isActive
                                ? 'bg-gradient-to-r from-teal-500 to-mint-500 text-white shadow-lg shadow-mint-200/50'
                                : 'text-gray-500 hover:text-teal-600 hover:bg-white/50'
                            }`
                        }
                    >
                        <Scan size={20} />
                        <span>New Analysis</span>
                    </NavLink>

                    <NavLink
                        to="/user/progress-report"
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all duration-300 group ${isActive
                                ? 'bg-gradient-to-r from-teal-500 to-mint-500 text-white shadow-lg shadow-mint-200/50'
                                : 'text-gray-500 hover:text-teal-600 hover:bg-white/50'
                            }`
                        }
                    >
                        <History size={20} />
                        <span>Progress Report</span>
                    </NavLink>

                    <NavLink
                        to="/user/profile"
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all duration-300 group ${isActive
                                ? 'bg-gradient-to-r from-teal-500 to-mint-500 text-white shadow-lg shadow-mint-200/50'
                                : 'text-gray-500 hover:text-teal-600 hover:bg-white/50'
                            }`
                        }
                    >
                        <UserCircle size={20} />
                        <span>Profile</span>
                    </NavLink>
                </div>

                <div className="p-4 border-t border-white/40">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 w-full rounded-xl font-bold text-gray-500 hover:text-red-500 hover:bg-red-50 transition-all group"
                    >
                        <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
                        <span>Log Out</span>
                    </button>
                </div>
            </aside>

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
                    <div className="w-64 h-full bg-white shadow-2xl p-4 flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-8">
                            <Link to="/" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-mint-600 font-cursive">
                                Derma Ai
                            </Link>
                            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-gray-500">
                                <X size={24} />
                            </button>
                        </div>
                        <nav className="space-y-2 flex-1">
                            <NavLink to="/user/dashboard" onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl font-bold ${isActive ? 'bg-teal-50 text-teal-600' : 'text-gray-500'}`}>
                                <LayoutDashboard size={20} /> Dashboard
                            </NavLink>
                            <NavLink to="/user/analysis" onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl font-bold ${isActive ? 'bg-teal-50 text-teal-600' : 'text-gray-500'}`}>
                                <Scan size={20} /> New Analysis
                            </NavLink>
                            <NavLink to="/user/progress-report" onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl font-bold ${isActive ? 'bg-teal-50 text-teal-600' : 'text-gray-500'}`}>
                                <History size={20} /> Progress Report
                            </NavLink>
                            <NavLink to="/user/profile" onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl font-bold ${isActive ? 'bg-teal-50 text-teal-600' : 'text-gray-500'}`}>
                                <UserCircle size={20} /> Profile
                            </NavLink>
                        </nav>
                        <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-red-500 bg-red-50 mt-auto">
                            <LogOut size={20} /> Log Out
                        </button>
                    </div>
                </div>
            )}

            {/* Main Content Wrapper */}
            <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
                {/* Top Header */}
                <header className="bg-white/60 backdrop-blur-xl border-b border-white/40 sticky top-0 z-30 h-20 px-6 flex items-center justify-between shadow-sm">

                    <div className="flex items-center gap-4">
                        <button className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg" onClick={() => setIsMobileMenuOpen(true)}>
                            <Menu size={24} />
                        </button>

                        {/* Breadcrumbs */}
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                            {pathSegments.length === 0 || (pathSegments.length === 1 && pathSegments[0] === 'dashboard') ? (
                                <span className="flex items-center gap-2 text-teal-600 font-bold px-3 py-1 bg-teal-50 rounded-lg">
                                    <LayoutDashboard size={16} /> Dashboard
                                </span>
                            ) : (
                                <>
                                    <Link to="/user/dashboard" className="hover:text-teal-600 transition-colors flex items-center gap-1">
                                        <LayoutDashboard size={16} /> Dashboard
                                    </Link>

                                    {pathSegments.map((segment, index) => {
                                        // Skip dashboard segment if redundant or logic handled above
                                        if (segment === 'dashboard') return null;

                                        const isLast = index === pathSegments.length - 1;
                                        const name = getBreadcrumbName(segment);
                                        // Construct path carefully. If segment is 'profile', path is /user/profile
                                        // Since we stripped 'user' from segments, we need to add it back for links
                                        const to = `/user/${pathSegments.slice(0, index + 1).join('/')}`;

                                        return (
                                            <React.Fragment key={index}>
                                                <ChevronRight size={14} className="text-gray-300" />
                                                <Link
                                                    to={to}
                                                    className={`${isLast ? 'text-teal-600 font-bold bg-teal-50 px-2 py-0.5 rounded-md pointer-events-none' : 'hover:text-teal-600 transition-colors'}`}
                                                >
                                                    {name}
                                                </Link>
                                            </React.Fragment>
                                        );
                                    })}
                                </>
                            )}
                        </div>
                    </div>

                    {/* User Profile Pill */}
                    <div className="flex items-center gap-4">
                        <Link
                            to="/user/profile"
                            className="flex items-center gap-3 pl-1 pr-4 py-1.5 bg-white/40 backdrop-blur-md border border-white/50 rounded-full shadow-sm hover:shadow-md hover:bg-white/60 transition-all group"
                        >
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-teal-400 to-mint-400 p-0.5 shadow-sm group-hover:scale-105 transition-transform">
                                <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                                    {user.profile_image ? (
                                        <img src={user.profile_image} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="font-bold text-teal-600 text-sm">
                                            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="text-sm hidden sm:block">
                                <p className="font-bold text-gray-700 leading-none">{user.name || 'User'}</p>
                                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mt-0.5">Member</p>
                            </div>
                        </Link>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-6 md:p-8 overflow-y-auto scroll-smooth">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default UserLayout;
