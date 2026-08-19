import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { createMerchant } from "../../services/merchantService";

import "../../styles/Register.css";

const Register = () => {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);

  const initialFormState = {
    firstName: "",
    lastName: "",
    dob: "",
    email: "",
    phone: "",
    username: "",
    password: "",
    outletType: "",
    pan: "",
    adhar: "", 
    fssai: "",
    gstNumber: "",
    accountNumber: "",
    ifscCode: "",
    bankLocation: "",
    nameInBankAccount: "",
  };

  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // Strong Form Validation
  const validate = () => {
    if (!formData.firstName.trim()) return "First Name is required.";
    if (!formData.lastName.trim()) return "Last Name is required.";

    if (
      formData.email &&
      !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)
    ) {
      return "Enter a valid Email.";
    }

    if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      return "Enter a valid 10-digit Mobile Number.";
    }

    if (!formData.username.trim()) return "Username is required.";

    if (formData.password.length < 8) {
      return "Password must be at least 8 characters.";
    }
    if (!/[A-Z]/.test(formData.password)) {
      return "Password must contain one uppercase letter.";
    }
    if (!/[a-z]/.test(formData.password)) {
      return "Password must contain one lowercase letter.";
    }
    if (!/[0-9]/.test(formData.password)) {
      return "Password must contain one number.";
    }
    if (!/[!@#$%^&*]/.test(formData.password)) {
      return "Password must contain one special character.";
    }

    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan)) {
      return "Invalid PAN Number.";
    }

    if (!/^\d{12}$/.test(formData.adhar)) {
      return "Aadhaar must contain 12 digits.";
    }

    if (!/^\d{14}$/.test(formData.fssai)) {
      return "FSSAI Number must contain 14 digits.";
    }

    if (
      formData.gstNumber &&
      !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{3}$/.test(formData.gstNumber)
    ) {
      return "Invalid GST Number.";
    }

    if (
      formData.ifscCode &&
      !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifscCode)
    ) {
      return "Invalid IFSC Code.";
    }

    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("========== REGISTER CLICKED ==========");

    setError("");
    setSuccess("");

    // Validate Form
    const validationError = validate();
    if (validationError) {
      console.log("Validation Error:", validationError);
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const currentUserId = localStorage.getItem("userId");

      // Build Payload matching backend expectations
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        dob: formData.dob,
        email: formData.email,
        phone: formData.phone,
        username: formData.username,
        password: formData.password,
        outletType: formData.outletType,
        uploadedBy: currentUserId || "Admin",
        pan: formData.pan,
        adhar: formData.adhar,
        fssai: formData.fssai,
        gstNumber: formData.gstNumber,
        accountNumber: formData.accountNumber,
        ifscCode: formData.ifscCode,
        bankLocation: formData.bankLocation,
        nameInBankAccount: formData.nameInBankAccount,
      };

      console.log("========== REQUEST PAYLOAD ==========");
      console.log(payload);

      console.log("Calling Create Merchant API...");

      const response = await createMerchant(payload);

      console.log("========== API SUCCESS ==========");
      console.log(response);

      // Successfully handles response matching your backend structure
      if (response && (response.success === true || response.message)) {
        setSuccess(response.message || "Merchant Registered Successfully.");
        setFormData(initialFormState);

        if (response.data && response.data.merchantId) {
          localStorage.setItem("merchantId", response.data.merchantId);
        }

        setTimeout(() => {
          navigate("/login");
        }, 1500);
      } else {
        setError("Registration failed unexpectedly.");
      }
    } catch (err) {
      console.log("========== API FAILED ==========");
      console.error(err);

      if (err.response) {
        console.log("Status:", err.response.status);
        console.log("Response:", err.response.data);

        setError(
          err.response.data?.message ||
            JSON.stringify(err.response.data) ||
            "Registration Failed"
        );
      } else if (err.request) {
        console.log("No Response Received");
        setError("Unable to reach server.");
      } else {
        console.log("Unknown Error:", err.message);
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-card">
        <div className="register-header">
          <h2>Merchant Registration</h2>
          <p>Create your Merchant Portal Account</p>
        </div>

        {error && <div className="error-box">{error}</div>}
        {success && <div className="success-box">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="grid">
            {/* 1. Personal Information */}
            <div className="form-section">
              <h3>Personal Information</h3>
            </div>

            <div className="input-group">
              <label>First Name *</label>
              <input
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
              />
            </div>

            <div className="input-group">
              <label>Last Name *</label>
              <input
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
              />
            </div>

            <div className="input-group">
              <label>Date Of Birth</label>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
              />
            </div>

            <div className="input-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="input-group">
              <label>Phone *</label>
              <input
                name="phone"
                maxLength={10}
                value={formData.phone}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    phone: e.target.value.replace(/\D/g, ""),
                  })
                }
              />
            </div>

            <div className="input-group">
              <label>Username *</label>
              <input
                name="username"
                value={formData.username}
                onChange={handleChange}
              />
            </div>

            <div className="input-group password-group">
              <label>Password *</label>
              <div className="password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                />
                <span
                  className="eye-icon"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
            </div>

            {/* 2. Business Information */}
            <div className="form-section">
              <h3>Business Information</h3>
            </div>

            <div className="input-group">
              <label>
                Outlet Type <span className="required">*</span>
              </label>

              <select
                name="outletType"
                value={formData.outletType}
                onChange={handleChange}
                className="select-field"
              >
                <option value="">Select Outlet Type</option>
                <option value="Restaurant">Restaurant</option>
                <option value="Grocery">Grocery</option>
                <option value="Pharmacy">Pharmacy</option>
                <option value="Bakery">Bakery</option>
                <option value="Meat">Meat</option>
                <option value="Vegetables">Vegetables</option>
                <option value="Flowers">Flowers</option>
                <option value="Electronics">Electronics</option>
              </select>
            </div>

            <div className="input-group">
              <label>PAN Number *</label>
              <input
                name="pan"
                maxLength={10}
                value={formData.pan}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    pan: e.target.value.toUpperCase(),
                  })
                }
              />
            </div>

            <div className="input-group">
              <label>Aadhaar Number *</label>
              <input
                name="adhar"
                maxLength={12}
                value={formData.adhar}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    adhar: e.target.value.replace(/\D/g, ""),
                  })
                }
              />
            </div>

            <div className="input-group">
              <label>FSSAI Number *</label>
              <input
                name="fssai"
                maxLength={14}
                value={formData.fssai}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    fssai: e.target.value.replace(/\D/g, ""),
                  })
                }
              />
            </div>

            <div className="input-group">
              <label>GST Number</label>
              <input
                name="gstNumber"
                value={formData.gstNumber}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    gstNumber: e.target.value.toUpperCase(),
                  })
                }
              />
            </div>

            {/* 3. Bank Information */}
            <div className="form-section">
              <h3>Bank Information</h3>
            </div>

            <div className="input-group">
              <label>Account Number</label>
              <input
                name="accountNumber"
                value={formData.accountNumber}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    accountNumber: e.target.value.replace(/\D/g, ""),
                  })
                }
              />
            </div>

            <div className="input-group">
              <label>IFSC Code</label>
              <input
                name="ifscCode"
                maxLength={11}
                value={formData.ifscCode}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    ifscCode: e.target.value.toUpperCase(),
                  })
                }
              />
            </div>

            <div className="input-group">
              <label>Bank Location</label>
              <input
                name="bankLocation"
                value={formData.bankLocation}
                onChange={handleChange}
              />
            </div>

            <div className="input-group">
              <label>Name In Bank Account</label>
              <input
                name="nameInBankAccount"
                value={formData.nameInBankAccount}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="button-row">
            <button
              type="button"
              className="cancel-btn"
              onClick={() => navigate("/login")}
            >
              Back To Login
            </button>

            <button
              type="submit"
              className="register-btn"
              disabled={loading}
            >
              {loading ? "Creating Merchant..." : "Register"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;