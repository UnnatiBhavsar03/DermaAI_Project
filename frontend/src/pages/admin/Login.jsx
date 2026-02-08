import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // Added for navigation
import { User, Lock, ShieldCheck, Loader2 } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate(); // Initialize the hook

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: email,
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store the name so the Dashboard can see it
        localStorage.setItem("adminName", data.user);

        // Redirect to the dashboard
        navigate("/dashboard");
      } else {
        alert("Login Failed: " + data.message);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      alert("Cannot reach backend. Ensure Flask is running on port 5000.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="flex flex-col items-center mb-10">
          <div className="bg-indigo-600 p-6 rounded-3xl shadow-xl mb-6">
            <ShieldCheck size={48} color="white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800">Admin Login</h1>
          <p className="text-gray-400 text-lg">Sign in to continue</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <User className="h-6 w-6 text-gray-400" />
            </div>
            <input
              type="email"
              required
              className="block w-full pl-12 pr-4 py-4 bg-white border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500 text-gray-700 text-lg"
              placeholder="Admin Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="h-6 w-6 text-gray-400" />
            </div>
            <input
              type="password"
              required
              className="block w-full pl-12 pr-4 py-4 bg-white border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500 text-gray-700 text-lg"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xl rounded-2xl shadow-lg flex justify-center items-center transition-colors"
          >
            {isLoading ? <Loader2 className="animate-spin h-6 w-6" /> : "LOGIN"}
          </button>
        </form>

        <p className="text-center text-gray-400 mt-10 font-medium">
          Authorized Admin Access Only
        </p>
      </div>
    </div>
  );
};

export default Login;
