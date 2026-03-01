import React from 'react';
import { Routes, Route, BrowserRouter, Navigate } from 'react-router-dom';
import Login from './public/Login/Login';
import Settings from './private/Settings/Settings';
import Dashboard from './private/Dashboard/Dashboard';
import Orders from './private/Orders/Orders';
import Monitors from './private/Monitors/Monitors';
import Automations from './private/Automations/Automations';
import OrderTemplates from './private/OrderTemplates/OrderTemplates';
import Reports from './private/Reports/Reports';

function PrivateRoute({ children }) {
    return localStorage.getItem('token') ? children : <Navigate to="/" replace />;
}

function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
                <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                <Route path="/monitors" element={<PrivateRoute><Monitors /></PrivateRoute>} />
                <Route path="/automations" element={<PrivateRoute><Automations /></PrivateRoute>} />
                <Route path="/orders/:symbol?" element={<PrivateRoute><Orders /></PrivateRoute>} />
                <Route path="/reports/:symbol?" element={<PrivateRoute><Reports /></PrivateRoute>} />
                <Route path="/orderTemplates/:symbol?" element={<PrivateRoute><OrderTemplates /></PrivateRoute>} />
            </Routes>
        </BrowserRouter>
    );
}

export default AppRoutes;
