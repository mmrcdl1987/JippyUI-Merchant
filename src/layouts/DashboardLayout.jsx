import Sidebar from "../components/sidebar/Sidebar";
import Navbar from "../components/navbar/Navbar";
import { Outlet } from "react-router-dom";

import "../styles/DashboardLayout.css";

const DashboardLayout = () => {
  return (
    <div className="layout">

      <Sidebar />

      <div className="layout-content">

        <Navbar />

        <div className="page-content">

          <Outlet />

        </div>

      </div>

    </div>
  );
};

export default DashboardLayout;