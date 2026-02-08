import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout"; // This holds the sidebar
import Login from "./pages/admin/Login";
import Dashboard from "./pages/admin/Dashboard";
import ManageScans from "./pages/admin/ManageScans";

function App() {
  return (
    <Router>
      <Routes>
        {/* No Sidebar on Login Page */}
        <Route path="/" element={<Login />} />

        {/* SIDEBAR APPLIED HERE: These routes are wrapped by Layout */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          {/* Any other pages you add here will also show the sidebar */}
        </Route>
        <Route path="/dashboard/manage-scans" element={<ManageScans />} />
      </Routes>
    </Router>
  );
}

export default App;
