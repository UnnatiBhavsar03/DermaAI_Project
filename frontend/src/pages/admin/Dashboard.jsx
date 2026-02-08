import React, { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { CheckCircle, PieChart as PieIcon, BarChart3 } from "lucide-react";

const Dashboard = () => {
  const [stats, setStats] = useState({
    total_users: 0,
    pending_reviews: 0,
    total_scans: 0,
  });
  const [chartData, setChartData] = useState({ skinTypes: [], skinIssues: [] });

  const COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  useEffect(() => {
    fetch("http://localhost:5000/api/admin/dashboard-data")
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          setStats(data.stats);
          setChartData(data.charts);
        }
      })
      .catch((err) => console.error("Error:", err));
  }, []);

  const cards = [
    {
      label: "Total Users",
      value: stats.total_users,
      color: "border-blue-500",
      text: "text-blue-600",
    },
    {
      label: "Pending Reviews",
      value: stats.pending_reviews,
      color: "border-amber-500",
      text: "text-amber-600",
    },
    {
      label: "Total Scans",
      value: stats.total_scans,
      // This adds a nice small label showing today's progress
      subValue: `${stats.todays_scans || 0} scans today`,
      color: "border-green-500",
      text: "text-green-600",
    },
  ];

  return (
    <div className="animate-in fade-in duration-500">
      <h2 className="text-4xl font-black text-slate-900 mb-2">Dashboard</h2>
      <p className="text-slate-400 mb-10 font-medium">Live Data Overview</p>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {cards.map((c) => (
          <div
            key={c.label}
            className={`bg-white p-8 rounded-[2rem] shadow-sm border-l-8 ${c.color}`}
          >
            <p className="text-slate-400 text-xs font-black uppercase tracking-widest">
              {c.label}
            </p>
            <h3 className={`text-5xl font-black mt-2 ${c.text}`}>{c.value}</h3>
            {c.subValue && (
              <p className="text-sm font-bold text-slate-400 mt-1">
                {c.subValue}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pie Chart */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-center">
          <div className="flex items-center gap-3 mb-6 w-full">
            <PieIcon className="text-indigo-600" />
            <h3 className="text-xl font-bold text-slate-800">Skin Types</h3>
          </div>
          <PieChart width={350} height={300}>
            <Pie
              data={chartData.skinTypes}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              isAnimationActive={false} // Required for React 19
            >
              {chartData.skinTypes.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </div>

        {/* Bar Chart */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-center">
          <div className="flex items-center gap-3 mb-6 w-full">
            <BarChart3 className="text-indigo-600" />
            <h3 className="text-xl font-bold text-slate-800">Skin Issues</h3>
          </div>
          <BarChart width={350} height={300} data={chartData.skinIssues}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar
              dataKey="count"
              fill="#4f46e5"
              isAnimationActive={false}
              radius={[5, 5, 0, 0]}
            />
          </BarChart>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
