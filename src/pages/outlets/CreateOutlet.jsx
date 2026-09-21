import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createOutlet,
  getStates,
  getCities,
  getAreas,
  getCuisineTypes,
} from "../../services/outletService";
import { getMerchantProfile } from "../../services/merchantService";
import "../../styles/CreateOutlet.css";

const CreateOutlet = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const [sameAsMerchant, setSameAsMerchant] = useState(false);
  
  /* State for UI Error Handling (supports array of errors) */
  const [errorDetails, setErrorDetails] = useState({
    message: "",
    errors: [],
  });

  const [merchantBank, setMerchantBank] = useState({
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    bankName: "",
  });

  /* State for cascading location dropdowns */
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [areas, setAreas] = useState([]);
  const [cuisineTypes, setCuisineTypes] = useState([]);
  const [cuisineMenuOpen, setCuisineMenuOpen] = useState(false);

  /* State for common timing toggle */
  const [sameTimingForAll, setSameTimingForAll] = useState(false);
  const [commonTiming, setCommonTiming] = useState({
    openingTime: "",
    closingTime: "",
  });

  const [formData, setFormData] = useState({
    outletName: "",
    outletType: "Restaurant",
    customOutletType: "",
    merchantId: localStorage.getItem("merchantId") || "",
    cuisineType: [],
    outletPhone: "",
    outletEmail: "",
    outletPicUrl: "",
    alternateOutletPhone: "",

    isVegOutlet: false,
    isGstApplied: false,
    aadharNumber: "",
    panNumber: "",
    fssaiNumber: "",
    gstNumber: "",

    username: "",
    password: "",

    accountNumber: "",
    ifscCode: "",
    bankName: "",
    accountHolderName: "",

    buildingNumber: "",
    road: "",
    landmark: "",
    description: "", // Example textarea field with a limit

    stateId: "",
    cityId: "",
    areaId: "",
    areaName: "",
    stateName: "",

    latitude: "",
    longitude: "",

    updatedBy: 101,
    uploadedBy: "",
    isActive: "Y",

    operatingDays: [],
  });

  const addOperatingTime = () => {
    setFormData((prev) => ({
      ...prev,
      operatingDays: [
        ...prev.operatingDays,
        {
          dayOfWeekId: "",
          isOpen: true,
          openingTime: "",
          closingTime: "",
        },
      ],
    }));
  };

  const addTimingForDay = (dayOfWeekId) => {
    setFormData((prev) => {
      const lastIndex = prev.operatingDays.reduce(
        (index, item, currentIndex) =>
          item.dayOfWeekId === dayOfWeekId ? currentIndex : index,
        -1
      );
      const timing = {
        dayOfWeekId,
        isOpen: true,
        openingTime: "",
        closingTime: "",
      };
      const operatingDays = [...prev.operatingDays];
      operatingDays.splice(lastIndex + 1, 0, timing);
      return { ...prev, operatingDays };
    });
  };

  const removeOperatingTime = (index) => {
    setFormData((previous) => ({
      ...previous,
      operatingDays: previous.operatingDays.filter(
        (_, timingIndex) => timingIndex !== index
      ),
    }));
  };

  useEffect(() => {
    loadMerchantBankDetails();
    loadStates();
    loadCuisineTypes();
  }, []);

  const loadCuisineTypes = async () => {
    try {
      const response = await getCuisineTypes();
      const list =
        response?.data?.data ||
        response?.data ||
        response ||
        [];
      setCuisineTypes(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error("Failed to load cuisine types:", error);
      setErrorDetails({
        message: "Unable to load cuisine types",
        errors: ["Please refresh and try again."],
      });
    }
  };

  const loadMerchantBankDetails = async () => {
    try {
      const data = await getMerchantProfile();
      setMerchantBank({
        accountHolderName: data.accountHolderName || "",
        accountNumber: data.accountNumber || "",
        ifscCode: data.ifscCode || "",
        bankName: data.bankName || "",
      });
    } catch (error) {
      console.error("Failed to fetch merchant profile:", error);
    }
  };

  const loadStates = async () => {
    try {
      const data = await getStates();
      setStates(data || []);
    } catch (err) {
      console.error("Failed to load states:", err);
    }
  };

  const handleStateChange = async (e) => {
    const stateId = e.target.value;
    const state = states.find((item) => String(item.stateId) === stateId);

    setFormData((prev) => ({
      ...prev,
      stateId,
      stateName: state?.stateName || "",
      cityId: "",
      areaId: "",
      areaName: "",
    }));

    setCities([]);
    setAreas([]);

    if (stateId) {
      try {
        const data = await getCities(stateId);
        setCities(data || []);
      } catch (err) {
        console.error("Failed to load cities:", err);
      }
    }
  };

  const handleCityChange = async (e) => {
    const cityId = e.target.value;
    setFormData((prev) => ({
      ...prev,
      cityId,
      areaId: "",
      areaName: "",
    }));

    setAreas([]);

    if (cityId) {
      try {
        const data = await getAreas(cityId);
        setAreas(data || []);
      } catch (err) {
        console.error("Failed to load areas:", err);
      }
    }
  };

  const handleAreaChange = (e) => {
    const areaId = e.target.value;
    const area = areas.find((item) => String(item.areaId) === areaId);

    setFormData((prev) => ({
      ...prev,
      areaId,
      areaName: area?.areaName || "",
    }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const toggleCuisine = (cuisineId) => {
    setFormData((prev) => ({
      ...prev,
      cuisineType: prev.cuisineType.includes(cuisineId)
        ? prev.cuisineType.filter((id) => id !== cuisineId)
        : [...prev.cuisineType, cuisineId],
    }));
  };

  const getCuisineName = (cuisineId) =>
    cuisineTypes.find((cuisine) =>
      Number(
        cuisine.cuisineTypesId ??
          cuisine.cuisineTypeId ??
          cuisine.id
      ) === cuisineId
    )?.cuisineTypesName ||
    cuisineTypes.find((cuisine) =>
      Number(
        cuisine.cuisineTypesId ??
          cuisine.cuisineTypeId ??
          cuisine.id
      ) === cuisineId
    )?.cuisineTypeName ||
    "Selected";

  const handleSameBank = (e) => {
    const checked = e.target.checked;
    setSameAsMerchant(checked);

    if (checked) {
      setFormData((prev) => ({
        ...prev,
        accountHolderName: merchantBank.accountHolderName,
        accountNumber: merchantBank.accountNumber,
        ifscCode: merchantBank.ifscCode,
        bankName: merchantBank.bankName,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        accountHolderName: "",
        accountNumber: "",
        ifscCode: "",
        bankName: "",
      }));
    }
  };

  const handleOperatingTimeChange = (index, field, value) => {
    const updated = [...formData.operatingDays];
    updated[index][field] = value;
    setFormData({
      ...formData,
      operatingDays: updated,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorDetails({ message: "", errors: [] }); // Reset errors

    let payload = {
      ...formData,
      merchantId: Number(formData.merchantId),
      stateId: formData.stateId ? Number(formData.stateId) : null,
      cityId: formData.cityId ? Number(formData.cityId) : null,
      areaId: formData.areaId ? Number(formData.areaId) : null,
      isActive: "Y",
      operatingDays: sameTimingForAll
        ? [1, 2, 3, 4, 5, 6, 7].map((day) => ({
            dayOfWeekId: day,
            isOpen: true,
            openingTime: commonTiming.openingTime,
            closingTime: commonTiming.closingTime,
            slotType: "FULL_DAY",
          }))
        : formData.operatingDays.map((day) => ({
            ...day,
            dayOfWeekId: Number(day.dayOfWeekId),
            isOpen: true,
            slotType: "FULL_DAY",
          })),
    };

    delete payload.stateName;
    delete payload.areaName;
    if (payload.outletType === "Other") {
      payload.outletType = payload.customOutletType.trim();
    }
    delete payload.customOutletType;
    payload.uploadedBy = "Admin";

    try {
      console.log("Submitting Payload:", payload);
      await createOutlet(payload);

      alert("Outlet created successfully");
      navigate("/outlets");
    } catch (error) {
      console.error(error);
      
      const responseData = error.response?.data;

      // Extract main message and list of validation errors safely
      setErrorDetails({
        message: responseData?.message || "Validation failed",
        errors: Array.isArray(responseData?.errors) 
          ? responseData.errors 
          : [responseData?.message || error.message || "Failed to create outlet."],
      });
    }
  };

  return (
    <div className="create-outlet-container">
      <div className="page-header">
        <h2>Create Outlet</h2>
        <div className="create-outlet-header-actions">
          <button className="back-btn" onClick={() => navigate("/outlets")}>
            Back
          </button>
        </div>
      </div>

      {/* Enhanced Multi-Error UI Banner */}
      {errorDetails.errors.length > 0 && (
        <div style={{
          backgroundColor: "#f8d7da",
          color: "#721c24",
          padding: "14px 18px",
          borderRadius: "6px",
          marginBottom: "20px",
          border: "1px solid #f5c6cb"
        }}>
          <strong>{errorDetails.message}:</strong>
          <ul style={{ margin: "8px 0 0 20px", padding: 0 }}>
            {errorDetails.errors.map((err, index) => (
              <li key={index} style={{ fontSize: "14px", marginBottom: "4px" }}>
                {err}
              </li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="outlet-form">
        {/* Outlet Details */}
        <div className="form-card">
          <h3>Outlet Information</h3>

          <div className="form-grid">
            <input
              name="outletName"
              placeholder="Outlet Name"
              value={formData.outletName}
              onChange={handleChange}
              maxLength={100}
              required
            />

            <select
              name="outletType"
              value={formData.outletType}
              onChange={handleChange}
            >
              <option value="">Select Outlet Type</option>
              <option value="Restaurant">Restaurant</option>
              <option value="Take Away Point">Take Away Point</option>
              <option value="Cloud Kitchen">Cloud Kitchen</option>
              <option value="Hotel">Hotel</option>
              <option value="Other">Other</option>
            </select>
            {formData.outletType === "Other" && (
              <input
                name="customOutletType"
                value={formData.customOutletType}
                onChange={handleChange}
                placeholder="Enter Outlet Type"
                required
              />
            )}

            <div className="create-outlet-field-label create-outlet-cuisine-field">
              <div className="create-outlet-cuisine-select">
                <button
                  type="button"
                  className="create-outlet-cuisine-trigger"
                  onClick={() => setCuisineMenuOpen((open) => !open)}
                  aria-expanded={cuisineMenuOpen}
                >
                  {formData.cuisineType.length > 0
                    ? formData.cuisineType.map(getCuisineName).join(", ")
                    : "Select cuisines"}
                  <span>▾</span>
                </button>
                {cuisineMenuOpen && (
                  <div className="create-outlet-cuisine-menu">
                    {cuisineTypes.length > 0 ? (
                      cuisineTypes.map((cuisine) => {
                        const id = Number(
                          cuisine.cuisineTypesId ??
                            cuisine.cuisineTypeId ??
                            cuisine.id
                        );
                        const selected = formData.cuisineType.includes(id);
                        return (
                          <button
                            type="button"
                            key={id}
                            className={`create-outlet-cuisine-option ${
                              selected ? "selected" : ""
                            }`}
                            onClick={() => toggleCuisine(id)}
                          >
                            <span>{cuisine.cuisineTypesName || cuisine.cuisineTypeName || cuisine.name}</span>
                            {selected && <strong>✓</strong>}
                          </button>
                        );
                      })
                    ) : (
                      <span className="create-outlet-cuisine-empty">
                        No cuisines available
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <input
              name="outletPhone"
              placeholder="Phone"
              value={formData.outletPhone}
              onChange={handleChange}
              maxLength={15}
              required
            />

            <input
              name="outletEmail"
              placeholder="Email"
              value={formData.outletEmail}
              onChange={handleChange}
              required
            />

            <input
              name="alternateOutletPhone"
              placeholder="Alternate Phone"
              value={formData.alternateOutletPhone}
              onChange={handleChange}
              maxLength={15}
            />

            <div className="create-outlet-checkbox-group">
              <label className="create-outlet-checkbox">
                <input
                  type="checkbox"
                  name="isVegOutlet"
                  checked={formData.isVegOutlet}
                  onChange={handleChange}
                />
                Vegetarian Outlet
              </label>

              <label className="create-outlet-checkbox">
                <input
                  type="checkbox"
                  name="isGstApplied"
                  checked={formData.isGstApplied}
                  onChange={handleChange}
                />
                GST Applied
              </label>
            </div>


            <input
              name="panNumber"
              placeholder="PAN Number"
              value={formData.panNumber}
              onChange={handleChange}
              maxLength={10}
            />

            <input
              name="fssaiNumber"
              placeholder="FSSAI Number (14 digits)"
              value={formData.fssaiNumber}
              onChange={handleChange}
              maxLength={14}
            />

            <input
              name="gstNumber"
              placeholder="GST Number (15 chars)"
              value={formData.gstNumber}
              onChange={handleChange}
              maxLength={15}
            />

            <input
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              required
            />

            <div className="create-outlet-password-field">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="create-outlet-password-toggle"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>
        </div>

        {/* Address with Textarea Example */}
        <div className="form-card">
          <h3>Address & Details</h3>

          <div className="form-grid">
            <input
              name="buildingNumber"
              placeholder="Building Number"
              value={formData.buildingNumber}
              onChange={handleChange}
              required
            />

            <input
              name="road"
              placeholder="Road"
              value={formData.road}
              onChange={handleChange}
              required
            />

            <input
              name="landmark"
              placeholder="Landmark"
              value={formData.landmark}
              onChange={handleChange}
            />

            <select value={formData.stateId} onChange={handleStateChange}>
              <option value="">Select State</option>
              {states.map((state) => (
                <option key={state.stateId} value={state.stateId}>
                  {state.stateName}
                </option>
              ))}
            </select>

            <select
              value={formData.cityId}
              onChange={handleCityChange}
              disabled={!formData.stateId}
            >
              <option value="">Select City</option>
              {cities.map((city) => (
                <option key={city.cityId} value={city.cityId}>
                  {city.cityName}
                </option>
              ))}
            </select>

            <select
              value={formData.areaId}
              onChange={handleAreaChange}
              disabled={!formData.cityId}
            >
              <option value="">Select Area</option>
              {areas.map((area) => (
                <option key={area.areaId} value={area.areaId}>
                  {area.areaName}
                </option>
              ))}
            </select>

            <input
              name="latitude"
              placeholder="Latitude"
              value={formData.latitude}
              onChange={handleChange}
            />

            <input
              name="longitude"
              placeholder="Longitude"
              value={formData.longitude}
              onChange={handleChange}
            />
          </div>

          {/* Textarea field with character limit */}
          <div style={{ marginTop: "16px" }}>
            <label style={{ fontSize: "12px", color: "#64748b", display: "block", marginBottom: "4px" }}>
              Outlet Description / Notes (Max 250 characters)
            </label>
            <textarea
              name="description"
              placeholder="Provide brief details about the outlet..."
              value={formData.description || ""}
              onChange={handleChange}
              maxLength={250}
              rows={3}
              style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #cbd5e1" }}
            />
            <div style={{ fontSize: "11px", color: "#94a3b8", textAlign: "right", marginTop: "2px" }}>
              {(formData.description || "").length} / 250
            </div>
          </div>
        </div>

        {/* Bank Details */}
        <div className="form-card">
          <div className="bank-header">
            <h3>Bank Details</h3>

            <label className="same-bank">
              <input
                type="checkbox"
                checked={sameAsMerchant}
                onChange={handleSameBank}
              />
              Same as Merchant Bank Details
            </label>
          </div>

          <div className="form-grid">
            <input
              name="accountHolderName"
              placeholder="Account Holder Name"
              value={formData.accountHolderName}
              onChange={handleChange}
              disabled={sameAsMerchant}
              required
            />

            <input
              name="accountNumber"
              placeholder="Account Number"
              value={formData.accountNumber}
              onChange={handleChange}
              disabled={sameAsMerchant}
              required
            />

            <input
              name="ifscCode"
              placeholder="IFSC Code"
              value={formData.ifscCode}
              onChange={handleChange}
              disabled={sameAsMerchant}
              maxLength={11}
              required
            />

            <input
              name="bankName"
              placeholder="Bank Name"
              value={formData.bankName}
              onChange={handleChange}
              disabled={sameAsMerchant}
              required
            />
          </div>
        </div>

        {/* Operating Hours */}
        <div className="form-card">
          <div className="bank-header operating-hours-header">
            <h3>Operating Hours</h3>

            <div className="operating-hours-controls">
              <label className="same-bank">
                <input
                  type="checkbox"
                  checked={sameTimingForAll}
                  onChange={(e) => setSameTimingForAll(e.target.checked)}
                />
                Same timing for all days
              </label>

              {!sameTimingForAll && (
                <button
                  type="button"
                  className="save-btn"
                  onClick={addOperatingTime}
                >
                  + Add Timing
                </button>
              )}
            </div>
          </div>

          {sameTimingForAll ? (
            <div className="form-grid operating-hours-common">
              <div>
                <label style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px", display: "block" }}>
                  Opening Time
                </label>
                <input
                  type="time"
                  value={commonTiming.openingTime}
                  onChange={(e) =>
                    setCommonTiming({
                      ...commonTiming,
                      openingTime: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px", display: "block" }}>
                  Closing Time
                </label>
                <input
                  type="time"
                  value={commonTiming.closingTime}
                  onChange={(e) =>
                    setCommonTiming({
                      ...commonTiming,
                      closingTime: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          ) : (
            <div className="operating-hours-list">
              {formData.operatingDays.map((item, index) => (
              <div key={index} className="operating-row">
                <span className="operating-row-label">Timing {index + 1}</span>
                <select
                  value={item.dayOfWeekId}
                  onChange={(e) =>
                    handleOperatingTimeChange(
                      index,
                      "dayOfWeekId",
                      Number(e.target.value)
                    )
                  }
                >
                  <option value="">Select Day</option>
                  <option value="1">Monday</option>
                  <option value="2">Tuesday</option>
                  <option value="3">Wednesday</option>
                  <option value="4">Thursday</option>
                  <option value="5">Friday</option>
                  <option value="6">Saturday</option>
                  <option value="7">Sunday</option>
                </select>

                <input
                  type="time"
                  value={item.openingTime}
                  onChange={(e) =>
                    handleOperatingTimeChange(
                      index,
                      "openingTime",
                      e.target.value
                    )
                  }
                />

                <input
                  type="time"
                  value={item.closingTime}
                  onChange={(e) =>
                    handleOperatingTimeChange(
                      index,
                      "closingTime",
                      e.target.value
                    )
                  }
                />

                {item.dayOfWeekId && (
                  <div className="timing-actions">
                    <button
                      type="button"
                      className="timing-add-hours-btn"
                      onClick={() => addTimingForDay(item.dayOfWeekId)}
                    >
                      + Add Hours
                    </button>
                    <button
                      type="button"
                      className="timing-remove-btn"
                      onClick={() => removeOperatingTime(index)}
                      aria-label="Remove timing"
                      title="Remove timing"
                    >
                      x
                    </button>
                  </div>
                )}
              </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="cancel-btn"
            onClick={() => navigate("/outlets")}
          >
            Cancel
          </button>

          <button type="submit" className="save-btn">
            Create Outlet
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateOutlet;