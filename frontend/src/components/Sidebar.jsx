import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  Users,
  Camera,
  CheckCircle,
  Settings,
  ClipboardCheck,
} from "lucide-react";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      name: "Overview",
      icon: <Home size={20} />,
      path: "/dashboard",
      table: "Stats",
    },
    {
      name: "Users",
      icon: <Users size={20} />,
      path: "/dashboard/users",
      table: "users",
    },
    {
      name: "Manage Scans", // New Management Page
      icon: <ClipboardCheck size={20} />,
      path: "/dashboard/manage-scans",
      table: "Verification",
    },
    {
      name: "Scan History",
      icon: <Camera size={20} />,
      path: "/dashboard/scans",
      table: "skin_analysis",
    },
    {
      name: "Verify Advice",
      icon: <CheckCircle size={20} />,
      path: "/dashboard/verify",
      table: "recommendations",
    },
    {
      name: "Settings",
      icon: <Settings size={20} />,
      path: "/dashboard/settings",
      table: "admin",
    },
  ];

  return (
    <div className="w-64 bg-indigo-900 text-white min-h-screen p-4 flex flex-col fixed left-0 top-0 z-20 shadow-2xl">
      <div className="text-2xl font-black mb-10 px-4 tracking-tighter italic">
        DERMA AI
      </div>
      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.name}
            onClick={() => navigate(item.path)}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 ${
              location.pathname === item.path
                ? "bg-white text-indigo-900 shadow-lg scale-105"
                : "hover:bg-indigo-800 text-indigo-100"
            }`}
          >
            {item.icon}
            <div className="flex flex-col items-start leading-tight">
              <span className="font-bold">{item.name}</span>
              <span
                className={`text-[9px] uppercase tracking-widest ${
                  location.pathname === item.path
                    ? "text-indigo-500"
                    : "text-indigo-400"
                }`}
              >
                {item.table}
              </span>
            </div>
          </button>
        ))}
      </nav>

      {/* Logout button at the bottom looks more professional */}
      <button
        onClick={() => navigate("/admin-login")}
        className="mt-auto w-full p-4 text-sm text-indigo-300 hover:text-white font-bold transition-colors"
      >
        Sign Out
      </button>
    </div>
  );
};

export default Sidebar;
