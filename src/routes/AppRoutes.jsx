import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import ForgotPassword from "../pages/ForgotPassword";

import EditOutlet from "../pages/outlets/EditOutlet";
import OutletProfileDetails from "../pages/outlets/OutletProfileDetails";

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

        {/* =====================================================
            ROOT
            ===================================================== */}

        <Route
          path="/"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />


        {/* =====================================================
            PUBLIC ROUTES
            ===================================================== */}

        {/* LOGIN */}

        <Route
          path="/login"
          element={<Login />}
        />


        {/* REGISTER */}

        <Route
          path="/register"
          element={<Register />}
        />


        {/* FORGOT PASSWORD */}

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />


        {/* =====================================================
            PROTECTED ROUTES
            ===================================================== */}

        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >

          {/* ===================================================
              DASHBOARD
              =================================================== */}

          <Route
            path="/dashboard"
            element={<Dashboard />}
          />


          {/* ===================================================
              OUTLETS LIST
              =================================================== */}

          <Route
            path="/outlets"
            element={<Outlets />}
          />


          {/* ===================================================
              CREATE OUTLET
              =================================================== */}

          <Route
            path="/outlets/create"
            element={<CreateOutlet />}
          />


          {/* ===================================================
              OUTLET PROFILE DETAILS
              
              IMPORTANT:
              
              /outlets/view/187
              
              will render OutletProfileDetails.
              
              OutletProfileDetails gets:
              
              const { outletId } = useParams();
              
              and calls:
              
              getAdminOutletDetails(outletId)
              
              =================================================== */}

          <Route
            path="/outlets/view/:outletId"
            element={
              <OutletProfileDetails />
            }
          />


          {/* ===================================================
              EDIT OUTLET
              =================================================== */}

          <Route
            path="/outlets/edit/:id"
            element={<EditOutlet />}
          />


          {/* ===================================================
              FOODS
              =================================================== */}

          <Route
            path="/foods"
            element={<Foods />}
          />


          {/* ===================================================
              ORDERS
              =================================================== */}

          <Route
            path="/orders"
            element={<Orders />}
          />


          {/* ===================================================
              PROMOTIONS
              =================================================== */}

          <Route
            path="/promotions"
            element={<Promotions />}
          />


          {/* ===================================================
              PAYMENTS
              =================================================== */}

          <Route
            path="/payments"
            element={<Payments />}
          />


          {/* ===================================================
              SUBSCRIPTION
              =================================================== */}

          <Route
            path="/subscription"
            element={<Subscription />}
          />


          {/* ===================================================
              ADD SUBSCRIPTION
              =================================================== */}

          <Route
            path="/add-subscription"
            element={<AddSubscription />}
          />

        </Route>


        {/* =====================================================
            PAGE NOT FOUND
            ===================================================== */}

        <Route
          path="*"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

      </Routes>

    </BrowserRouter>
  );
};


export default AppRoutes;