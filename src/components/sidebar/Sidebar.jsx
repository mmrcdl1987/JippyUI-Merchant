import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  FaChevronDown,
  FaChevronUp,
  FaSignOutAlt,
} from "react-icons/fa";

import { menuData } from "../../constants/menuData";
import "../../styles/Sidebar.css";

const Sidebar = () => {
  const [openMenu, setOpenMenu] = useState("");
  const navigate = useNavigate();

  const toggleMenu = (menuName) => {
    setOpenMenu((prev) => (prev === menuName ? "" : menuName));
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <h2>JIPPY</h2>
      </div>

      {/* Scrollable Menu */}
      <div className="sidebar-menu">
        {menuData.map((menu) => (
          <div key={menu.name}>
            {menu.children ? (
              <>
                <div
                  className={`menu-item ${
                    openMenu === menu.name ? "active" : ""
                  }`}
                  onClick={() => toggleMenu(menu.name)}
                >
                  <div className="menu-left">
                    <span className="menu-icon">{menu.icon}</span>
                    <span>{menu.name}</span>
                  </div>

                  <span className="menu-arrow">
                    {openMenu === menu.name ? (
                      <FaChevronUp />
                    ) : (
                      <FaChevronDown />
                    )}
                  </span>
                </div>

                {openMenu === menu.name && (
                  <div className="submenu">
                    {menu.children.map((child) => (
                      <NavLink
                        key={child.name}
                        to={child.path}
                        className={({ isActive }) =>
                          isActive
                            ? "submenu-item active"
                            : "submenu-item"
                        }
                      >
                        {child.name}
                      </NavLink>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <NavLink
                to={menu.path}
                className={({ isActive }) =>
                  isActive ? "menu-item active" : "menu-item"
                }
              >
                <div className="menu-left">
                  <span className="menu-icon">{menu.icon}</span>
                  <span>{menu.name}</span>
                </div>
              </NavLink>
            )}
          </div>
        ))}
      </div>

      {/* Fixed Logout */}
      <div className="logout-section">
        <div className="menu-item logout-btn" onClick={handleLogout}>
          <div className="menu-left">
            <span className="menu-icon">
              <FaSignOutAlt />
            </span>

            <span>Logout</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;