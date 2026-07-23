import { useEffect, useRef, useState } from "react";
import { FaBell, FaChevronDown, FaUserCircle, FaSignOutAlt, FaUserCog, FaCog } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { getMerchantProfile } from "../../services/merchantService";
import "../../styles/Navbar.css";

const Navbar = () => {
  const navigate = useNavigate();

  const dropdownRef = useRef(null);

  const [showDropdown, setShowDropdown] = useState(false);

  const [merchant, setMerchant] = useState({
    merchantId: "",
    merchantName: "Merchant",
    merchantEmail: "",
    merchantPhone: "",
    businessType: "",
    bankName: "",
    accountHolderName: "",
  });

  useEffect(() => {
    loadMerchantProfile();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () =>
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
  }, []);

  const loadMerchantProfile = async () => {
    try {
      const data = await getMerchantProfile();

      setMerchant({
        merchantId: data.merchantId,
        merchantName: data.merchantName,
        merchantEmail: data.merchantEmail,
        merchantPhone: data.merchantPhone,
        businessType: data.businessType,
        bankName: data.bankName,
        accountHolderName: data.accountHolderName,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  return (
    <div className="navbar">
      <div className="navbar-title">
        <h3>Merchant Dashboard</h3>
      </div>

      <div className="navbar-right">
        <button className="notification-btn">
          <FaBell />
          <span className="notification-dot"></span>
        </button>

        <div
          className="profile-section"
          ref={dropdownRef}
        >
          <div
            className="profile-info"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <FaUserCircle className="profile-avatar" />

            <div className="profile-details">
              <span className="merchant-name">
                {merchant.merchantName}
              </span>

              <span className="merchant-email">
                {merchant.merchantEmail}
              </span>
            </div>

            <FaChevronDown
              className={`dropdown-icon ${
                showDropdown ? "rotate" : ""
              }`}
            />
          </div>

          {showDropdown && (
            <div className="profile-dropdown">

              <div className="dropdown-header">

                <FaUserCircle className="dropdown-avatar" />

                <div>

                  <h4>{merchant.merchantName}</h4>

                  <p>{merchant.merchantEmail}</p>

                </div>

              </div>

              <hr />

              <div className="dropdown-details">

                <div>
                  <strong>Merchant ID</strong>
                  <span>{merchant.merchantId}</span>
                </div>

                <div>
                  <strong>Phone</strong>
                  <span>{merchant.merchantPhone}</span>
                </div>

                <div>
                  <strong>Business</strong>
                  <span>{merchant.businessType}</span>
                </div>

                <div>
                  <strong>Bank</strong>
                  <span>{merchant.bankName}</span>
                </div>

                <div>
                  <strong>Account Holder</strong>
                  <span>{merchant.accountHolderName}</span>
                </div>

              </div>

              <hr />

              <button className="dropdown-item">
                <FaUserCog />
                My Profile
              </button>

              <button className="dropdown-item">
                <FaCog />
                Account Settings
              </button>

              <button
                className="dropdown-item logout"
                onClick={handleLogout}
              >
                <FaSignOutAlt />
                Logout
              </button>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;