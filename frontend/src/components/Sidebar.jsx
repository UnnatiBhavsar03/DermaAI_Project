import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Users,
  CheckCircle,
  ClipboardCheck,
  LogOut,
  LayoutDashboard
} from "lucide-react";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      name: "Dashboard",
      icon: <LayoutDashboard size={20} />,
      path: "/dashboard",
    },
    {
      name: "Manage Users",
      icon: <Users size={20} />,
      path: "/dashboard/users",
    },
    {
      name: "Manage Scans",
      icon: <ClipboardCheck size={20} />,
      path: "/dashboard/scans",
    },
    {
      name: "Progress Reports",
      icon: <CheckCircle size={20} />,
      path: "/dashboard/progress-reports",
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("adminName");
    localStorage.removeItem("adminId");
    navigate("/admin/login");
  };

  return (
    <div className="w-64 bg-white min-h-screen px-4 py-6 flex flex-col fixed left-0 top-0 z-20 border-r border-gray-100 shadow-sm">
      <div className="mb-12 px-4 flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">D</div>
        <span className="text-xl font-bold text-gray-800 tracking-tight">DermaAI</span>
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.name}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 group relative overflow-hidden ${isActive
                ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                : "text-gray-500 hover:bg-gray-50 hover:text-blue-600"
                }`}
            >
              {/* Active Indicator Strip */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-white/20 rounded-r-full"></div>
              )}

              <span className={`relative z-10 transition-transform duration-300 ${isActive ? 'scale-105' : ''}`}>
                {item.icon}
              </span>
              <span className="font-medium text-sm relative z-10">{item.name}</span>
            </button>
          );
        })}
      </nav>

      <div className="space-y-2 mt-auto">


        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 text-gray-500 hover:bg-red-50 hover:text-red-500 group"
        >
          <LogOut size={20} />
          <span className="font-medium text-sm">Sign out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
