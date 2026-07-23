import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createOutlet,
  getStates,
  getCities,
  getAreas,
} from "../../services/outletService";
import { getMerchantProfile } from "../../services/merchantService";
import "../../styles/CreateOutlet.css";

const CreateOutlet = () => {
  const navigate = useNavigate();

  const [sameAsMerchant, setSameAsMerchant] = useState(false);

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

  /* State for common timing toggle */
  const [sameTimingForAll, setSameTimingForAll] = useState(false);
  const [commonTiming, setCommonTiming] = useState({
    openingTime: "",
    closingTime: "",
  });

  const [formData, setFormData] = useState({
    outletName: "",
    merchantId: localStorage.getItem("merchantId") || "",
    cuisineType: "",
    outletPhone: "",
    outletEmail: "",
    alternateOutletPhone: "",

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

  useEffect(() => {
    loadMerchantBankDetails();
    loadStates();
  }, []);

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
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

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

  const removeOperatingTime = (index) => {
    const updated = [...formData.operatingDays];
    updated.splice(index, 1);

    setFormData({
      ...formData,
      operatingDays: updated,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let payload = {
      ...formData,

      merchantId: Number(formData.merchantId),
      stateId: Number(formData.stateId),
      cityId: Number(formData.cityId),
      areaId: Number(formData.areaId),

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

    // Remove unwanted temporary fields
    delete payload.stateName;
    delete payload.areaName;
    delete payload.uploadedBy;

    try {
      console.log("Submitting Payload:", payload);

      await createOutlet(payload);

      alert("Outlet created successfully");
      navigate("/outlets");
    } catch (error) {
      console.error(error);
      alert("Failed to create outlet");
    }
  };

  return (
    <div className="create-outlet-container">
      <div className="page-header">
        <h2>Create Outlet</h2>

        <button className="back-btn" onClick={() => navigate("/outlets")}>
          Back
        </button>
      </div>

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
            />

            <input
              name="merchantId"
              placeholder="Merchant Id"
              value={formData.merchantId}
              readOnly
            />

            <input
              name="cuisineType"
              placeholder="Cuisine Type"
              value={formData.cuisineType}
              onChange={handleChange}
            />

            <input
              name="outletPhone"
              placeholder="Phone"
              value={formData.outletPhone}
              onChange={handleChange}
            />

            <input
              name="outletEmail"
              placeholder="Email"
              value={formData.outletEmail}
              onChange={handleChange}
            />

            <input
              name="alternateOutletPhone"
              placeholder="Alternate Phone"
              value={formData.alternateOutletPhone}
              onChange={handleChange}
            />

            <input
              name="fssaiNumber"
              placeholder="FSSAI Number"
              value={formData.fssaiNumber}
              onChange={handleChange}
            />

            <input
              name="gstNumber"
              placeholder="GST Number"
              value={formData.gstNumber}
              onChange={handleChange}
            />

            <input
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
            />

            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Address */}
        <div className="form-card">
          <h3>Address</h3>

          <div className="form-grid">
            <input
              name="buildingNumber"
              placeholder="Building Number"
              value={formData.buildingNumber}
              onChange={handleChange}
            />

            <input
              name="road"
              placeholder="Road"
              value={formData.road}
              onChange={handleChange}
            />

            <input
              name="landmark"
              placeholder="Landmark"
              value={formData.landmark}
              onChange={handleChange}
            />

            {/* Cascading Location Dropdowns */}
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
            />

            <input
              name="accountNumber"
              placeholder="Account Number"
              value={formData.accountNumber}
              onChange={handleChange}
              disabled={sameAsMerchant}
            />

            <input
              name="ifscCode"
              placeholder="IFSC Code"
              value={formData.ifscCode}
              onChange={handleChange}
              disabled={sameAsMerchant}
            />

            <input
              name="bankName"
              placeholder="Bank Name"
              value={formData.bankName}
              onChange={handleChange}
              disabled={sameAsMerchant}
            />
          </div>
        </div>

        {/* Operating Hours */}
        <div className="form-card">
          <div className="bank-header">
            <h3>Operating Hours</h3>

            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
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
            <div className="form-grid">
              <div>
                <label
                  style={{
                    fontSize: "12px",
                    color: "#64748b",
                    marginBottom: "4px",
                    display: "block",
                  }}
                >
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
                <label
                  style={{
                    fontSize: "12px",
                    color: "#64748b",
                    marginBottom: "4px",
                    display: "block",
                  }}
                >
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
            formData.operatingDays.map((item, index) => (
              <div key={index} className="operating-row">
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

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => removeOperatingTime(index)}
                >
                  Delete
                </button>
              </div>
            ))
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