import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * ProtectedRoute - Guards user pages.
 * Checks localStorage for a valid user object with user_id.
 * If not found → redirects to /user/login.
 */
const ProtectedRoute = ({ children }) => {
    const location = useLocation();
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    if (!user || !user.user_id) {
        return <Navigate to="/user/login" state={{ from: location }} replace />;
    }

    return children;
};

/**
 * AdminRoute - Guards admin dashboard pages.
 * Admin login stores 'adminId' key in localStorage.
 * If not found → redirects to /admin/login.
 */
export const AdminRoute = ({ children }) => {
    const location = useLocation();
    // Admin Login.jsx stores key as 'adminId'
    const adminId = localStorage.getItem('adminId');

    if (!adminId) {
        return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }

    return children;
};

export default ProtectedRoute;
