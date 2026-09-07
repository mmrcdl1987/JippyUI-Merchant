import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "../styles/Login.css";
import api from "../services/api";

const ForgotPassword = () => {
  const navigate = useNavigate();

  /* =========================================================
     STATE
     ========================================================= */

  const [step, setStep] = useState(1);

  // User can enter either username or email
  const [identifier, setIdentifier] = useState("");

  // Keep Merchant fixed
  const userType = "MERCHANT";

  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  /* =========================================================
     ERROR MESSAGE
     ========================================================= */

  const getErrorMessage = (error, defaultMessage) => {
    return (
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      (typeof error?.response?.data === "string"
        ? error.response.data
        : null) ||
      defaultMessage
    );
  };

  /* =========================================================
     CHECK WHETHER VALUE IS EMAIL
     ========================================================= */

  const isEmail = (value) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      value.trim()
    );
  };

  /* =========================================================
     STEP 1 - SEND OTP
     ========================================================= */

  const handleSendOtp = async (e) => {
    e.preventDefault();

    const value = identifier.trim();

    if (!value) {
      alert("Please enter your username or email.");
      return;
    }

    try {
      setLoading(true);

      /*
       * If user entered an email:
       *     email = entered value
       *
       * If user entered a username:
       *     username = entered value
       *
       * MERCHANT is always sent as userType.
       */

      const requestData = {
        userType: "MERCHANT",
      };

      if (isEmail(value)) {
        requestData.email = value;
      } else {
        requestData.username = value;
      }

      console.log(
        "Forgot Password Request:",
        requestData
      );

      const response = await api.post(
        "/api/fm/forgetPasswordForUserTypeBySendingOtpToMail",
        requestData
      );

      console.log(
        "Send OTP Response:",
        response.data
      );

      alert(
        "OTP sent successfully to your registered email."
      );

      setStep(2);
    } catch (error) {
      console.error(
        "Send OTP Error:",
        error
      );

      alert(
        getErrorMessage(
          error,
          "Failed to send OTP. Please check your username or email."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     STEP 2 - VALIDATE OTP
     ========================================================= */

  const handleValidateOtp = async (e) => {
    e.preventDefault();

    const value = identifier.trim();

    if (!otp.trim()) {
      alert("Please enter the OTP.");
      return;
    }

    if (otp.trim().length !== 6) {
      alert("Please enter a valid 6-digit OTP.");
      return;
    }

    try {
      setLoading(true);

      const requestData = {
        userType: "MERCHANT",
        otp: otp.trim(),
      };

      /*
       * Send the same identifier type that was used
       * while requesting the OTP.
       */

      if (isEmail(value)) {
        requestData.email = value;
      } else {
        requestData.username = value;
      }

      console.log(
        "Validate OTP Request:",
        requestData
      );

      const response = await api.post(
        "/api/fm/validateForgotPasswordOTP",
        requestData
      );

      console.log(
        "Validate OTP Response:",
        response.data
      );

      alert("OTP validated successfully!");

      setStep(3);
    } catch (error) {
      console.error(
        "Validate OTP Error:",
        error
      );

      alert(
        getErrorMessage(
          error,
          "Invalid OTP. Please try again."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     STEP 3 - RESET PASSWORD
     ========================================================= */

  const handleResetPassword = async (e) => {
    e.preventDefault();

    const value = identifier.trim();

    if (!newPassword.trim()) {
      alert("Please enter a new password.");
      return;
    }

    if (newPassword.trim().length < 6) {
      alert(
        "Password must be at least 6 characters."
      );
      return;
    }

    try {
      setLoading(true);

      const requestData = {
        userType: "MERCHANT",
        newPassword: newPassword.trim(),
      };

      /*
       * Use the same username/email identifier.
       */

      if (isEmail(value)) {
        requestData.email = value;
      } else {
        requestData.username = value;
      }

      console.log(
        "Reset Password Request:",
        requestData
      );

      const response = await api.post(
        "/api/fm/updateForgotPassword",
        requestData
      );

      console.log(
        "Update Password Response:",
        response.data
      );

      alert(
        "Password updated successfully! Please login with your new password."
      );

      navigate("/login", {
        replace: true,
      });
    } catch (error) {
      console.error(
        "Update Password Error:",
        error
      );

      alert(
        getErrorMessage(
          error,
          "Failed to update password. Please try again."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     CHANGE USERNAME / EMAIL
     ========================================================= */

  const handleChangeIdentifier = () => {
    if (loading) {
      return;
    }

    setOtp("");
    setStep(1);
  };

  /* =========================================================
     GET TITLE
     ========================================================= */

  const getTitle = () => {
    if (step === 1) {
      return "Forgot Password?";
    }

    if (step === 2) {
      return "Verify OTP";
    }

    return "Create New Password";
  };

  /* =========================================================
     GET DESCRIPTION
     ========================================================= */

  const getDescription = () => {
    if (step === 1) {
      return (
        <>
          Don't worry! Enter your registered username
          <br />
          or email and we'll send you a verification code.
        </>
      );
    }

    if (step === 2) {
      return (
        <>
          Enter the 6-digit verification code sent to
          <br />
          <strong>{identifier}</strong>
        </>
      );
    }

    return (
      <>
        Create a new secure password for
        <br />
        <strong>{identifier}</strong>
      </>
    );
  };

  /* =========================================================
     PAGE
     ========================================================= */

  return (
    <div className="forgot-page">

      {/* =====================================================
          BACKGROUND DECORATIONS
          ===================================================== */}

      <div className="forgot-bg-circle circle-one"></div>

      <div className="forgot-bg-circle circle-two"></div>


      {/* =====================================================
          MAIN CARD
          ===================================================== */}

      <div className="forgot-card">

        {/* ===================================================
            LOGO
            =================================================== */}

        <div className="forgot-logo">

          <span className="logo-jippy">
            JIPPY
          </span>

          <span className="logo-subtitle">
            Merchant Portal
          </span>

        </div>


        {/* ===================================================
            LOCK ICON
            =================================================== */}

        <div className="lock-icon">
          🔐
        </div>


        {/* ===================================================
            HEADER
            =================================================== */}

        <div className="forgot-header">

          <h1>
            {getTitle()}
          </h1>

          <p>
            {getDescription()}
          </p>

        </div>


        {/* ===================================================
            STEP INDICATOR
            =================================================== */}

        <div className="forgot-steps">

          {/* STEP 1 */}

          <div
            className={`forgot-step ${
              step >= 1 ? "active" : ""
            }`}
          >

            <div className="step-circle">
              {step > 1 ? "✓" : "1"}
            </div>

            <span>
              Email
            </span>

          </div>


          {/* LINE */}

          <div
            className={`step-line ${
              step >= 2 ? "active" : ""
            }`}
          ></div>


          {/* STEP 2 */}

          <div
            className={`forgot-step ${
              step >= 2 ? "active" : ""
            }`}
          >

            <div className="step-circle">
              {step > 2 ? "✓" : "2"}
            </div>

            <span>
              Verify
            </span>

          </div>


          {/* LINE */}

          <div
            className={`step-line ${
              step >= 3 ? "active" : ""
            }`}
          ></div>


          {/* STEP 3 */}

          <div
            className={`forgot-step ${
              step >= 3 ? "active" : ""
            }`}
          >

            <div className="step-circle">
              3
            </div>

            <span>
              Password
            </span>

          </div>

        </div>


        {/* =====================================================
            STEP 1 - USERNAME / EMAIL + MERCHANT
            ===================================================== */}

        {step === 1 && (

          <form
            onSubmit={handleSendOtp}
            className="forgot-form"
          >

            {/* USERNAME / EMAIL */}

            <div className="forgot-input-group">

              <label>
                Username or Email Address
              </label>

              <div className="forgot-input-wrapper">

                <span className="input-icon">
                  ✉
                </span>

                <input
                  type="text"
                  placeholder="Enter your username or email"
                  value={identifier}
                  onChange={(e) =>
                    setIdentifier(e.target.value)
                  }
                  disabled={loading}
                  autoComplete="username"
                  required
                />

              </div>

            </div>


            {/* USER TYPE */}

            <div className="forgot-input-group">

              <label>
                User Type
              </label>

              <div className="forgot-input-wrapper">

                <span className="input-icon">
                  👤
                </span>

                <input
                  type="text"
                  value="MERCHANT"
                  disabled
                  readOnly
                />

              </div>

            </div>


            {/* SEND OTP BUTTON */}

            <button
              type="submit"
              className="forgot-primary-btn"
              disabled={loading}
            >

              {loading ? (
                <>
                  <span className="button-spinner"></span>
                  Sending OTP...
                </>
              ) : (
                <>
                  Send Verification Code

                  <span>
                    →
                  </span>
                </>
              )}

            </button>

          </form>

        )}


        {/* =====================================================
            STEP 2 - OTP
            ===================================================== */}

        {step === 2 && (

          <form
            onSubmit={handleValidateOtp}
            className="forgot-form"
          >

            {/* INFO BOX */}

            <div className="otp-info-box">

              <span>
                ✉
              </span>

              <div>

                <strong>
                  Check your email
                </strong>

                <p>
                  We've sent a verification
                  code to your registered
                  email address.
                </p>

              </div>

            </div>


            {/* OTP INPUT */}

            <div className="forgot-input-group">

              <label>
                Verification Code
              </label>

              <div className="forgot-input-wrapper otp-wrapper">

                <span className="input-icon">
                  🔢
                </span>

                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) =>
                    setOtp(
                      e.target.value.replace(
                        /\D/g,
                        ""
                      )
                    )
                  }
                  disabled={loading}
                  autoComplete="one-time-code"
                  required
                />

              </div>

            </div>


            {/* VERIFY OTP BUTTON */}

            <button
              type="submit"
              className="forgot-primary-btn"
              disabled={loading}
            >

              {loading ? (
                <>
                  <span className="button-spinner"></span>
                  Verifying...
                </>
              ) : (
                <>
                  Verify OTP

                  <span>
                    ✓
                  </span>
                </>
              )}

            </button>


            {/* CHANGE USERNAME / EMAIL */}

            <button
              type="button"
              className="forgot-secondary-btn"
              onClick={handleChangeIdentifier}
              disabled={loading}
            >
              ← Change Username / Email
            </button>

          </form>

        )}


        {/* =====================================================
            STEP 3 - RESET PASSWORD
            ===================================================== */}

        {step === 3 && (

          <form
            onSubmit={handleResetPassword}
            className="forgot-form"
          >

            {/* NEW PASSWORD */}

            <div className="forgot-input-group">

              <label>
                New Password
              </label>

              <div className="forgot-input-wrapper">

                <span className="input-icon">
                  🔒
                </span>

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Enter your new password"
                  value={newPassword}
                  onChange={(e) =>
                    setNewPassword(
                      e.target.value
                    )
                  }
                  disabled={loading}
                  autoComplete="new-password"
                  required
                />


                {/* PASSWORD VISIBILITY */}

                <button
                  type="button"
                  className="password-eye"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                  disabled={loading}
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >

                  {showPassword ? (
                    <FaEyeSlash />
                  ) : (
                    <FaEye />
                  )}

                </button>

              </div>

            </div>


            {/* PASSWORD HINT */}

            <div className="password-hint">

              <span>
                ✓
              </span>

              Choose a strong password
              that you haven't used before.

            </div>


            {/* RESET PASSWORD */}

            <button
              type="submit"
              className="forgot-primary-btn"
              disabled={loading}
            >

              {loading ? (
                <>
                  <span className="button-spinner"></span>
                  Resetting Password...
                </>
              ) : (
                <>
                  Reset Password

                  <span>
                    ✓
                  </span>
                </>
              )}

            </button>

          </form>

        )}


        {/* =====================================================
            BACK TO LOGIN
            ===================================================== */}

        <div className="back-login-section">

          <button
            type="button"
            onClick={() =>
              !loading &&
              navigate("/login")
            }
            disabled={loading}
          >
            ← Back to Login
          </button>

        </div>


        {/* =====================================================
            FOOTER
            ===================================================== */}

        <div className="forgot-footer">

          <span>
            © {new Date().getFullYear()} JIPPY
          </span>

          <span>
            •
          </span>

          <span>
            Secure Account Recovery
          </span>

        </div>

      </div>

    </div>
  );
};

export default ForgotPassword;