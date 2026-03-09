import React, { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import {
  Users,
  ClipboardList,
  Activity,
  TrendingUp,
  Calendar,
  MoreHorizontal
} from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const [stats, setStats] = useState({
    total_users: 0,
    pending_reviews: 0,
    total_scans: 0,
  });
  const [chartData, setChartData] = useState({ skinTypes: [], userGrowth: [] });
  const [recentUsers, setRecentUsers] = useState([]);
  const [timeRange, setTimeRange] = useState('week'); // week, month, year

  const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  useEffect(() => {
    fetch(`http://localhost:5001/api/admin/dashboard-data?range=${timeRange}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          setStats(data.stats);
          setChartData(data.charts);
          setRecentUsers(data.recent_users || []);
        }
      })
      .catch((err) => console.error("Error:", err));
  }, [timeRange]);

  const cards = [
    {
      label: "Total Users",
      value: stats.total_users,
      icon: <Users size={24} className="text-white" />,
      gradient: "from-blue-500 to-indigo-600",
      trend: "+12.5%",
    },
    {
      label: "Pending Reviews",
      value: stats.pending_reviews,
      icon: <ClipboardList size={24} className="text-white" />,
      gradient: "from-amber-400 to-orange-500",
      trend: "+2 new",
    },
    {
      label: "Total Scans",
      value: stats.total_scans,
      subValue: `${stats.todays_scans || 0} today`,
      icon: <Activity size={24} className="text-white" />,
      gradient: "from-mint-400 to-teal-500",
      trend: "+5.2%",
    },
  ];

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-[#0f172a]">Dashboard Overview</h2>
        <p className="text-slate-500 mt-1">Welcome back, here's what's happening today.</p>
      </div>

      {/* Stats Cards - Clean & Professional */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((c) => (
          <div
            key={c.label}
            className="relative overflow-hidden rounded-2xl p-6 shadow-sm border border-mint-100 bg-white hover:shadow-md transition-all duration-300 group"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-mint-50 to-mint-100 rounded-bl-full -mr-4 -mt-4 opacity-50 group-hover:scale-110 transition-transform"></div>

            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-slate-500 text-sm font-medium mb-1">{c.label}</p>
                <h3 className="text-3xl font-bold text-slate-800">{c.value}</h3>
                {c.subValue && <p className="text-slate-400 text-xs mt-1 font-medium">{c.subValue}</p>}
              </div>
              <div className={`p-3 rounded-xl bg-gradient-to-br ${c.gradient} shadow-lg shadow-mint-100 text-white transform group-hover:rotate-6 transition-all duration-300`}>
                {c.icon}
              </div>
            </div>

            {/* Trend Indicator */}
            <div className="mt-4 flex items-center gap-2">
              <span className="bg-green-50 text-green-600 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <TrendingUp size={10} />
                {c.trend}
              </span>
              <span className="text-gray-300 text-xs">vs last month</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Graph 1: Skin Type Distribution */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 lg:col-span-1 flex flex-col">
          <h3 className="text-lg font-bold text-gray-800 mb-2">Skin Type Analysis</h3>
          <p className="text-gray-400 text-sm mb-6">User distribution by skin type</p>

          <div className="flex-1 flex items-center justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData.skinTypes}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} dy={10} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 6, 6]} barSize={30} isAnimationActive={true}>
                  {chartData.skinTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graph 2: User Growth with Filters */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-800">User Growth</h3>
              <div className="flex items-center gap-2 mt-1">
                <TrendingUp size={16} className="text-green-500" />
                <p className="text-gray-400 text-sm">New registrations over time</p>
              </div>
            </div>

            {/* Time Range Filter */}
            <div className="bg-gray-100 p-1 rounded-xl flex items-center self-start sm:self-auto">
              {['week', 'month', 'year'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${timeRange === range
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData.userGrowth}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Line
                type="monotone"
                dataKey="users"
                stroke="#3b82f6"
                strokeWidth={4}
                dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
                isAnimationActive={true}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Users Section */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-800">Recent Users</h3>
          <Link to="/dashboard/users" className="text-indigo-600 text-sm font-bold hover:bg-indigo-50 px-3 py-1 rounded-lg transition-colors">
            View All
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-400 text-xs uppercase tracking-wider border-b border-gray-100">
                <th className="pb-3 pl-2">User</th>
                <th className="pb-3">Skin Type</th>
                <th className="pb-3">Joined Date</th>
                <th className="pb-3 text-right pr-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentUsers.length > 0 ? (
                recentUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 pl-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-100 to-blue-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-700">{user.name}</div>
                          <div className="text-xs text-gray-400">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-bold ${user.skin_type ? 'bg-teal-50 text-teal-600' : 'bg-gray-100 text-gray-500'
                        }`}>
                        {user.skin_type || 'Pending'}
                      </span>
                    </td>
                    <td className="py-3 text-sm text-gray-500 font-medium">{user.joined}</td>
                    <td className="py-3 text-right pr-2">
                      <Link to={`/dashboard/user/${user.id}`} className="text-gray-400 hover:text-indigo-600 transition-colors inline-block">
                        <MoreHorizontal size={18} />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="py-6 text-center text-gray-400 text-sm">No recent users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
