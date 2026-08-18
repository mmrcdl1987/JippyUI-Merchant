import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import ViewOutlet from "../pages/outlets/ViewOutlet";
import EditOutlet from "../pages/outlets/EditOutlet";

import ProtectedRoute from "./ProtectedRoute";
import DashboardLayout from "../layouts/DashboardLayout";

import Dashboard from "../pages/dashboard/Dashboard";
import Outlets from "../pages/outlets/Outlets";
import CreateOutlet from "../pages/outlets/CreateOutlet";
import Foods from "../pages/foods/Foods";
import Orders from "../pages/orders/Orders";
import Promotions from "../pages/promotions/Promotions";
import Payments from "../pages/payments/Payments";
import Subscription from "../pages/subscription/Subscription";
import AddSubscription from "../pages/subscription/AddSubscription";


const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect Root */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Outlets */}
          <Route path="/outlets" element={<Outlets />} />
          <Route path="/outlets/create" element={<CreateOutlet />} />
          <Route path="/outlets/view/:id" element={<ViewOutlet />} />
          <Route path="/outlets/edit/:id" element={<EditOutlet />} />

          {/* Other Modules */}
          <Route path="/foods" element={<Foods />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/promotions" element={<Promotions />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/subscription" element={<Subscription />} />
          <Route
  path="/add-subscription"
  element={<AddSubscription />}
/>
        </Route>

        {/* Page Not Found */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;