import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout"; // This holds the sidebar
import Login from "./pages/admin/Login";
import Dashboard from "./pages/admin/Dashboard";
import ManageScans from "./pages/admin/ManageScans";
import ScanVerification from "./pages/admin/ScanVerification";

function App() {
  return (
    <Router>
      <Routes>
        {/* No Sidebar on Login Page */}
        <Route path="/" element={<Login />} />

        {/* SIDEBAR APPLIED HERE: These routes are wrapped by Layout */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/verification/:analysisId" element={<ScanVerification />} />
          <Route path="/dashboard/manage-scans" element={<ManageScans />} />
          {/* Any other pages you add here will also show the sidebar */}
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
