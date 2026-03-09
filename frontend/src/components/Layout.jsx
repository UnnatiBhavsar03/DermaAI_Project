import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import { LogOut, Bell } from "lucide-react";

const Layout = () => {
  const navigate = useNavigate();
  const adminName = localStorage.getItem("adminName") || "Admin";

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-slate-400 text-xs font-bold uppercase tracking-tighter">
              System Online
            </span>
          </div>
          <div className="flex items-center gap-6">
            <button className="text-slate-400 hover:text-indigo-600 transition-colors">
              <Bell size={20} />
            </button>
            <div className="h-8 w-[1px] bg-slate-200"></div>
            <span className="text-slate-700 font-bold">
              Welcome, {adminName}
            </span>
            <button
              onClick={handleLogout}
              className="bg-indigo-50 text-indigo-600 px-5 py-2 rounded-2xl font-bold hover:bg-red-50 hover:text-red-600 transition-all flex items-center gap-2 border border-indigo-100 hover:border-red-100"
            >
              <LogOut size={18} /> Logout
            </button>
          </div>
        </header>

        {/* Content injection point */}
        <main className="p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
