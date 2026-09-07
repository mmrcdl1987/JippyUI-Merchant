import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "../../styles/Login.css";
import api from "../../services/api";

const Login = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* =========================================================
     LOAD REMEMBERED USERNAME
     ========================================================= */
  useEffect(() => {
    const rememberedUser = localStorage.getItem("rememberUsername");

    if (rememberedUser) {
      setUsername(rememberedUser);
      setRememberMe(true);
    }
  }, []);

  /* =========================================================
     LOGIN
     ========================================================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await api.post("/api/fm/auth/login", {
        username,
        password,
      });

      console.log("Login Response:", response.data);

      const { jwt, userId, userType, roles } = response.data;

      /* -------------------------------------------------------
         Validate token
         ------------------------------------------------------- */
      if (!jwt) {
        setError("Token not received from server.");
        return;
      }

      /* -------------------------------------------------------
         Validate Merchant access
         ------------------------------------------------------- */
      const hasMerchantRole =
        userType === "MERCHANT" ||
        (Array.isArray(roles) &&
          (roles.includes("ROLE_MERCHANT") ||
            roles.includes("MERCHANT")));

      if (!hasMerchantRole) {
        setError(
          "Only Merchant users can access the Merchant Portal."
        );
        return;
      }

      /* -------------------------------------------------------
         Save login details
         ------------------------------------------------------- */
      localStorage.setItem("token", jwt);
      localStorage.setItem("merchantId", String(userId));
      localStorage.setItem("userId", String(userId));
      localStorage.setItem("userType", userType);
      localStorage.setItem("roles", JSON.stringify(roles));
      localStorage.setItem(
        "user",
        JSON.stringify(response.data)
      );

      /* -------------------------------------------------------
         Remember username
         ------------------------------------------------------- */
      if (rememberMe) {
        localStorage.setItem(
          "rememberUsername",
          username
        );
      } else {
        localStorage.removeItem("rememberUsername");
      }

      console.log("Merchant Login Successful");

      navigate("/dashboard", {
        replace: true,
      });
    } catch (err) {
      console.error("Login Error:", err);

      setError(
        err.response?.data?.message ||
          "Invalid username or password."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     REGISTER
     ========================================================= */
  const handleRegister = () => {
    navigate("/register");
  };

  /* =========================================================
     FORGOT PASSWORD
     ========================================================= */
  const handleForgotPassword = () => {
    navigate("/forgot-password");
  };

  return (
    <div className="login-page">

      {/* =====================================================
          BACKGROUND SHAPES
          ===================================================== */}
      <div className="shape shape1"></div>
      <div className="shape shape2"></div>
      <div className="shape shape3"></div>

      {/* =====================================================
          LOGIN CARD
          ===================================================== */}
      <div className="login-card">

        {/* ===================================================
            LOGO
            =================================================== */}
        <div className="logo">
          <h3>JIPPY</h3>
          <span>Merchant Portal</span>
        </div>

        {/* ===================================================
            TITLE
            =================================================== */}
        <h2>Welcome Back</h2>

        <p className="subtitle">
          Sign in to continue to your account
        </p>

        {/* ===================================================
            ERROR MESSAGE
            =================================================== */}
        {error && (
          <div
            style={{
              color: "red",
              marginBottom: "15px",
              textAlign: "center",
              fontWeight: "600",
            }}
          >
            {error}
          </div>
        )}

        {/* ===================================================
            LOGIN FORM
            =================================================== */}
        <form onSubmit={handleSubmit}>

          {/* USERNAME */}
          <div className="input-group">
            <label>Username</label>

            <input
              type="text"
              placeholder="Enter Username"
              value={username}
              onChange={(e) =>
                setUsername(e.target.value)
              }
              required
            />
          </div>

          {/* PASSWORD */}
          <div className="input-group">
            <label>Password</label>

            <div className="password-field">

              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                placeholder="Enter Password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                required
              />

              <span
                className="eye-icon"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
              >
                {showPassword ? (
                  <FaEyeSlash />
                ) : (
                  <FaEye />
                )}
              </span>

            </div>
          </div>

          {/* =================================================
              REMEMBER ME / FORGOT PASSWORD
              ================================================= */}
          <div className="login-options">

            <label className="remember">

              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) =>
                  setRememberMe(e.target.checked)
                }
              />

              <span>Remember Me</span>

            </label>

            <button
              type="button"
              className="forgot-password-link"
              onClick={handleForgotPassword}
            >
              Forgot Password?
            </button>

          </div>

          {/* =================================================
              BUTTONS
              ================================================= */}
          <div className="button-group">

            <button
              type="submit"
              className="login-btn"
              disabled={loading}
            >
              {loading
                ? "Logging in..."
                : "Login"}
            </button>

            <button
              type="button"
              className="register-btn"
              onClick={handleRegister}
            >
              Register
            </button>

          </div>

        </form>
      </div>
    </div>
  );
};

export default Login;