import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getOutletById,
  getStates,
  getCities,
  getAreas,
  getCuisineTypes,
  getOutletImage,
  getOutletStatusById,
  uploadOutletImage,
  updateOutlet,
} from "../../services/outletService";
import { getMerchantProfile } from "../../services/merchantService";
import "../../styles/CreateOutlet.css";

const DAYS_OF_WEEK = [
  { id: 1, name: "Monday" },
  { id: 2, name: "Tuesday" },
  { id: 3, name: "Wednesday" },
  { id: 4, name: "Thursday" },
  { id: 5, name: "Friday" },
  { id: 6, name: "Saturday" },
  { id: 7, name: "Sunday" },
];

const STANDARD_OUTLET_TYPES = [
  "Restaurant",
  "Take Away Point",
  "Cloud Kitchen",
  "Hotel",
];

const emptyTiming = (dayOfWeekId) => ({
  dayOfWeekId,
  isOpen: true,
  openingTime: "09:00",
  closingTime: "22:00",
});

const getValue = (value, fallback = "") =>
  value === null || value === undefined ? fallback : value;

const extractOutletDetails = (response) => {
  const data = response?.data?.data ?? response?.data ?? response ?? {};
  return (
    data?.outletDetails ??
    data?.outlet ??
    data?.merchantResponse ??
    data?.customerResponse ??
    data
  );
};

const extractBooleanField = (response, fieldNames) => {
  const data = response?.data?.data ?? response?.data ?? response ?? {};
  const candidates = [
    data,
    data?.outletDetails,
    data?.outlet,
    data?.merchantResponse,
    data?.customerResponse,
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    for (const fieldName of fieldNames) {
      if (candidate[fieldName] !== null && candidate[fieldName] !== undefined) {
        return toBoolean(candidate[fieldName]);
      }
    }
  }

  return undefined;
};

const extractProductVegValue = (response) => {
  const data = response?.data?.data ?? response?.data ?? response ?? {};
  const candidates = [
    data,
    data?.outletDetails,
    data?.outlet,
    data?.merchantResponse,
    data?.customerResponse,
  ];
  const productValues = candidates.flatMap((candidate) =>
    Array.isArray(candidate?.categories)
      ? candidate.categories.flatMap((category) =>
          Array.isArray(category?.products)
            ? category.products
                .filter(
                  (product) =>
                    product?.isVeg !== null &&
                    product?.isVeg !== undefined
                )
                .map((product) => toBoolean(product.isVeg))
            : []
        )
      : []
  );

  if (productValues.length === 0) return undefined;
  return productValues.every(Boolean);
};

const getOutletImageUrl = (outlet) =>
  outlet?.outletPicUrl ||
  outlet?.outletProfilePic ||
  outlet?.outletProfilePicUrl ||
  outlet?.profilePicUrl ||
  outlet?.imageUrl ||
  outlet?.outletImageUrl ||
  outlet?.image ||
  "";

const extractImageResponse = (response) => {
  const data = response?.data?.data || response?.data || response;
  return (
    getOutletImageUrl(data) ||
    getOutletImageUrl(data?.outlet) ||
    getOutletImageUrl(data?.outletDetails) ||
    (typeof data === "string" ? data : "")
  );
};

const toBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  return ["true", "1", "y", "yes", "active", "enabled"].includes(
    String(value || "").trim().toLowerCase()
  );
};

const toTime = (value, fallback) => {
  if (!value) return fallback;
  if (typeof value === "string") return value.substring(0, 5);
  if (typeof value === "object" && value.hour !== undefined) {
    return `${String(value.hour).padStart(2, "0")}:${String(
      value.minute || 0
    ).padStart(2, "0")}`;
  }
  return fallback;
};

const normalizeCuisines = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) =>
      Number(item?.cuisineTypesId ?? item?.cuisineTypeId ?? item?.id ?? item)
    ).filter(Boolean);
  }
  if (typeof value === "number") return [value];
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => Number(item.trim()))
      .filter(Boolean);
  }
  return [];
};

const normalizeTimings = (outlet) => {
  const source =
    outlet?.operatingDays ||
    outlet?.outletTimings ||
    outlet?.timings ||
    [];
  const byDay = new Map();

  if (Array.isArray(source)) {
    source.forEach((item) => {
      const dayOfWeekId = Number(
        item?.dayOfWeekId ??
          item?.dayId ??
          item?.dayOfWeek ??
          DAYS_OF_WEEK.find(
            (day) => day.name.toLowerCase() === String(item?.day).toLowerCase()
          )?.id
      );
      if (dayOfWeekId >= 1 && dayOfWeekId <= 7) {
        const timing = {
          dayOfWeekId,
          isOpen: item.isOpen !== false && item.isAvailable !== false,
          openingTime: toTime(
            item.openingTime ?? item.startTime,
            "09:00"
          ),
          closingTime: toTime(
            item.closingTime ?? item.endTime,
            "22:00"
          ),
        };
        byDay.set(dayOfWeekId, [...(byDay.get(dayOfWeekId) || []), timing]);
      }
    });
  }

  return DAYS_OF_WEEK.flatMap((day) =>
    byDay.get(day.id) || [emptyTiming(day.id)]
  );
};

const EditOutlet = () => {
  const { outletId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorList, setErrorList] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [areas, setAreas] = useState([]);
  const [cuisineTypes, setCuisineTypes] = useState([]);
  const [cuisineMenuOpen, setCuisineMenuOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [sameAsMerchant, setSameAsMerchant] = useState(false);
  const [merchantBank, setMerchantBank] = useState({
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    bankName: "",
  });
  const [formData, setFormData] = useState({
    outletName: "",
    merchantId: "",
    cuisineType: [],
    outletEmail: "",
    outletPhone: "",
    alternateOutletPhone: "",
    outletType: "",
    customOutletType: "",
    outletPicUrl: "",
    isVegOutlet: false,
    isGstApplied: false,
    description: "",
    username: "",
    password: "",
    accountNumber: "",
    ifscCode: "",
    bankName: "",
    accountHolderName: "",
    aadharNumber: "",
    panNumber: "",
    fssaiNumber: "",
    gstNumber: "",
    buildingNumber: "",
    road: "",
    landmark: "",
    stateId: "",
    cityId: "",
    areaId: "",
    latitude: "",
    longitude: "",
    isActive: "Y",
    operatingDays: DAYS_OF_WEEK.map((day) => emptyTiming(day.id)),
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setErrorList([]);
        const [
          outletResponse,
          statusResponse,
          statesResponse,
          cuisineResponse,
        ] =
          await Promise.all([
            getOutletById(outletId),
            getOutletStatusById(outletId),
            getStates(),
            getCuisineTypes(),
          ]);
        const outlet = extractOutletDetails(outletResponse);
        const statusData =
          statusResponse?.data?.data ?? statusResponse?.data ?? statusResponse;
        const statusIsVegOutlet = extractBooleanField(statusResponse, [
          "isVegOutlet",
          "is_veg_outlet",
          "isVeg",
          "is_veg",
        ]);
        const productIsVegOutlet = extractProductVegValue(outletResponse);
        const statusIsGstApplied = extractBooleanField(statusResponse, [
          "isGstApplied",
          "is_gst_applied",
          "gstApplied",
          "gst_applied",
        ]);
        let outletImageUrl = getOutletImageUrl(outlet);
        if (!outletImageUrl) {
          try {
            outletImageUrl = extractImageResponse(await getOutletImage(outletId));
          } catch (imageError) {
            console.error("Error loading outlet image:", imageError);
          }
        }
        setStates(statesResponse || []);
        const cuisineList =
          cuisineResponse?.data?.data ||
          cuisineResponse?.data ||
          cuisineResponse ||
          [];
        setCuisineTypes(Array.isArray(cuisineList) ? cuisineList : []);
        setFormData((previous) => ({
          ...previous,
          ...outlet,
          outletType: STANDARD_OUTLET_TYPES.includes(outlet.outletType)
            ? outlet.outletType
            : outlet.outletType
              ? "Other"
              : "",
          customOutletType: STANDARD_OUTLET_TYPES.includes(outlet.outletType)
            ? ""
            : getValue(outlet.outletType),
          outletPicUrl: outletImageUrl,
          outletName: getValue(outlet.outletName),
          merchantId: getValue(
            outlet.merchantId,
            localStorage.getItem("merchantId") || ""
          ),
          cuisineType: normalizeCuisines(
            outlet.cuisineType ?? outlet.cuisineTypes
          ),
          outletEmail: getValue(outlet.outletEmail).replace(/\s+/g, ""),
          alternateOutletPhone: getValue(outlet.alternateOutletPhone),
          buildingNumber: getValue(
            outlet.buildingNumber ?? outlet.buildingNo
          ),
          road: getValue(outlet.road ?? outlet.streetName),
          stateId: getValue(outlet.stateId),
          cityId: getValue(outlet.cityId),
          areaId: getValue(outlet.areaId),
          panNumber: getValue(
            outlet.panNumber ?? outlet.panNo ?? outlet.pan ?? outlet.outletPanNumber
          ),
          fssaiNumber: getValue(
            outlet.fssaiNumber ??
              outlet.fssaiNo ??
              outlet.fssai ??
              outlet.outletFssaiNumber
          ),
          gstNumber: getValue(
            outlet.gstNumber ?? outlet.gstNo ?? outlet.gst ?? outlet.outletGstNumber
          ),
          isVegOutlet:
            productIsVegOutlet ??
            statusIsVegOutlet ??
            extractBooleanField(outlet, [
              "isVegOutlet",
              "is_veg_outlet",
              "isVeg",
              "is_veg",
            ]) ??
            false,
          isGstApplied:
            statusIsGstApplied ??
            extractBooleanField(outlet, [
              "isGstApplied",
              "is_gst_applied",
              "gstApplied",
              "gst_applied",
            ]) ??
            false,
          isActive:
            statusData?.isActive === "Y" ||
            statusData?.is_active === "Y"
              ? "Y"
              : statusData?.isActive === "N" ||
                statusData?.is_active === "N"
                ? "N"
                : toBoolean(outlet.isActive ?? outlet.isAvailable)
                  ? "Y"
                  : "N",
          operatingDays: normalizeTimings(outlet),
        }));
        if (outlet.stateId) {
          setCities((await getCities(outlet.stateId)) || []);
        }
        if (outlet.cityId) {
          setAreas((await getAreas(outlet.cityId)) || []);
        }
      } catch (error) {
        console.error("Error loading outlet details:", error);
        setErrorList([
          error?.response?.data?.message ||
            error?.message ||
            "Failed to load outlet details.",
        ]);
      } finally {
        setLoading(false);
      }
    };
    if (outletId) load();
  }, [outletId]);

  useEffect(() => {
    const loadMerchantBankDetails = async () => {
      try {
        const data = await getMerchantProfile();
        setMerchantBank({
          accountHolderName: data?.accountHolderName || "",
          accountNumber: data?.accountNumber || "",
          ifscCode: data?.ifscCode || "",
          bankName: data?.bankName || "",
        });
      } catch (error) {
        console.error("Failed to fetch merchant bank details:", error);
      }
    };

    loadMerchantBankDetails();
  }, []);

  const cuisineNames = useMemo(
    () =>
      formData.cuisineType
        .map((id) => {
          const item = cuisineTypes.find(
            (cuisine) =>
              Number(
                cuisine.cuisineTypesId ??
                  cuisine.cuisineTypeId ??
                  cuisine.id
              ) === Number(id)
          );
          return item?.cuisineTypesName || item?.cuisineTypeName || item?.name;
        })
        .filter(Boolean)
        .join(", "),
    [cuisineTypes, formData.cuisineType]
  );

  const updateField = (name, value) =>
    setFormData((previous) => ({ ...previous, [name]: value }));

  const handleSameBank = (event) => {
    const checked = event.target.checked;
    setSameAsMerchant(checked);

    setFormData((previous) => ({
      ...previous,
      ...(checked
        ? merchantBank
        : {
            accountHolderName: "",
            accountNumber: "",
            ifscCode: "",
            bankName: "",
          }),
    }));
  };

  const handleImageChange = async (event) => {
    const imageFile = event.target.files?.[0];
    event.target.value = "";
    if (!imageFile) return;
    if (!imageFile.type.startsWith("image/")) {
      setErrorList(["Please select a valid image file."]);
      return;
    }

    try {
      setUploadingImage(true);
      setErrorList([]);
      const response = await uploadOutletImage(outletId, imageFile);
      const imageUrl = extractImageResponse(response);
      if (!imageUrl) {
        throw new Error("Image uploaded, but no image URL was returned.");
      }
      updateField("outletPicUrl", imageUrl);
    } catch (error) {
      console.error("Error uploading outlet image:", error);
      setErrorList([
        error?.response?.data?.message ||
          error?.message ||
          "Failed to upload outlet image.",
      ]);
    } finally {
      setUploadingImage(false);
    }
  };

  const toggleCuisine = (id) =>
    updateField(
      "cuisineType",
      formData.cuisineType.includes(id)
        ? formData.cuisineType.filter((item) => item !== id)
        : [...formData.cuisineType, id]
    );

  const handleStateChange = async (event) => {
    const stateId = event.target.value;
    updateField("stateId", stateId);
    updateField("cityId", "");
    updateField("areaId", "");
    setCities(stateId ? (await getCities(stateId)) || [] : []);
    setAreas([]);
  };

  const handleCityChange = async (event) => {
    const cityId = event.target.value;
    updateField("cityId", cityId);
    updateField("areaId", "");
    setAreas(cityId ? (await getAreas(cityId)) || [] : []);
  };

  const updateTiming = (index, field, value) => {
    setFormData((previous) => ({
      ...previous,
      operatingDays: previous.operatingDays.map((timing, timingIndex) =>
        timingIndex === index ? { ...timing, [field]: value } : timing
      ),
    }));
  };

  const addTimingForDay = (index) => {
    setFormData((previous) => {
      const source = previous.operatingDays[index];
      const timing = {
        ...emptyTiming(source.dayOfWeekId),
        openingTime: "",
        closingTime: "",
      };
      const operatingDays = [...previous.operatingDays];
      operatingDays.splice(index + 1, 0, timing);
      return { ...previous, operatingDays };
    });
  };

  const removeTiming = (index) => {
    setFormData((previous) => ({
      ...previous,
      operatingDays: previous.operatingDays.filter(
        (_, timingIndex) => timingIndex !== index
      ),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      setErrorList([]);
      const merchantId = Number(
        formData.merchantId || localStorage.getItem("merchantId")
      );
      const payload = {
        outletName: formData.outletName,
        merchantId,
        cuisineType: formData.cuisineType,
        isActive: formData.isActive,
        outletEmail: formData.outletEmail,
        outletPhone: formData.outletPhone,
        alternateOutletPhone: formData.alternateOutletPhone,
        outletType:
          formData.outletType === "Other"
            ? formData.customOutletType.trim()
            : formData.outletType,
        outletPicUrl: formData.outletPicUrl,
        isVegOutlet: formData.isVegOutlet,
        isGstApplied: formData.isGstApplied,
        description: formData.description,
        username: formData.username,
        password: formData.password,
        accountNumber: formData.accountNumber,
        ifscCode: formData.ifscCode,
        bankName: formData.bankName,
        accountHolderName: formData.accountHolderName,
        aadharNumber: formData.aadharNumber,
        panNumber: formData.panNumber,
        fssaiNumber: formData.fssaiNumber,
        gstNumber: formData.gstNumber,
        buildingNumber: formData.buildingNumber,
        road: formData.road,
        landmark: formData.landmark,
        stateId: Number(formData.stateId),
        cityId: Number(formData.cityId),
        areaId: Number(formData.areaId),
        latitude: String(formData.latitude),
        longitude: String(formData.longitude),
        operatingDays: formData.operatingDays.map((timing) => ({
          ...timing,
          dayOfWeekId: Number(timing.dayOfWeekId),
        })),
        updatedBy: 101,
      };
      await updateOutlet(outletId, payload);
      alert("Outlet updated successfully.");
      navigate("/outlets");
    } catch (error) {
      console.error("Error updating outlet:", error);
      const response = error.response?.data;
      setErrorList(
        Array.isArray(response?.errors)
          ? response.errors
          : [response?.message || error.message || "Failed to update outlet."]
      );
    } finally {
      setSaving(false);
    }
  };

  const hasValue = (value) =>
    value !== null && value !== undefined && String(value).trim() !== "";

  const readOnlyProps = { readOnly: true, disabled: true };

  const getFieldProps = (name) => {
    if (hasValue(formData[name])) {
      return { readOnly: true, disabled: true };
    }
    return {
      value: formData[name],
      onChange: (event) => updateField(name, event.target.value),
    };
  };

  const getBooleanFieldProps = (name) =>
    formData[name]
      ? { disabled: true, className: "create-outlet-locked-checkbox" }
      : {
          onChange: (event) => updateField(name, event.target.checked),
        };

  if (loading) {
    return <div className="loading-spinner">Loading Outlet Details...</div>;
  }

  return (
    <div className="create-outlet-container">
      <div className="page-header">
        <h2>Update Outlet</h2>
        <div className="create-outlet-header-actions">
          <button className="back-btn" type="button" onClick={() => navigate("/outlets")}>
            Back
          </button>
        </div>
      </div>

      {errorList.length > 0 && (
        <div className="error-banner">
          <strong>Unable to update outlet</strong>
          <ul>
            {errorList.map((error, index) => <li key={index}>{error}</li>)}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="outlet-form">
        <div className="form-card">
          <div className="outlet-image-editor">
            <label className="outlet-image-picker">
              <div className="outlet-image-preview">
                {formData.outletPicUrl ? (
                  <img src={formData.outletPicUrl} alt="Outlet" />
                ) : (
                  <span>No outlet image</span>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={uploadingImage}
                aria-label="Change outlet image"
              />
            </label>
          </div>
          <div className="form-grid">
            <input {...getFieldProps("outletName")} value={formData.outletName} placeholder="Outlet Name" />
            <select
              name="outletType"
              value={formData.outletType}
              onChange={(event) => {
                updateField("outletType", event.target.value);
                if (event.target.value !== "Other") {
                  updateField("customOutletType", "");
                }
              }}
            >
              <option value="">Select Outlet Type</option>
              {STANDARD_OUTLET_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
              <option value="Other">Other</option>
            </select>
            {formData.outletType === "Other" && (
              <input
                name="customOutletType"
                value={formData.customOutletType}
                onChange={(event) => updateField("customOutletType", event.target.value)}
                placeholder="Enter Outlet Type"
                required
              />
            )}
            <div className="create-outlet-field-label create-outlet-cuisine-field">
              <span className="edit-outlet-cuisine-label">Cuisine Type</span>
              <div className="create-outlet-cuisine-select">
                <button
                  type="button"
                  className="create-outlet-cuisine-trigger"
                  onClick={() => setCuisineMenuOpen((open) => !open)}
                >
                  <span className="edit-outlet-cuisine-indicator">
                    <span className="edit-outlet-cuisine-dot" aria-hidden="true" />
                    <span>{cuisineNames || "No cuisine selected"}</span>
                  </span>
                  <span aria-hidden="true">▾</span>
                </button>
                {cuisineMenuOpen && (
                  <div className="create-outlet-cuisine-menu">
                    {cuisineTypes.map((cuisine) => {
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
                          className={`create-outlet-cuisine-option ${selected ? "selected" : ""}`}
                          onClick={() => toggleCuisine(id)}
                        >
                          <span>{cuisine.cuisineTypesName || cuisine.cuisineTypeName || cuisine.name}</span>
                          {selected && <strong>✓</strong>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            <input {...getFieldProps("outletPhone")} value={formData.outletPhone} placeholder="Phone" />
            <input {...getFieldProps("outletEmail")} value={formData.outletEmail} placeholder="Email" />
            <input
              name="alternateOutletPhone"
              value={formData.alternateOutletPhone}
              onChange={(event) => updateField("alternateOutletPhone", event.target.value)}
              placeholder="Alternate Phone"
            />
            <div className="create-outlet-checkbox-group edit-outlet-checkbox-group">
              <label className={`create-outlet-checkbox ${formData.isGstApplied ? "create-outlet-checkbox-selected" : ""}`}>
                <input
                  type="checkbox"
                  checked={formData.isGstApplied}
                  {...getBooleanFieldProps("isGstApplied")}
                />
                GST Applied
              </label>
              <label className="create-outlet-checkbox">
                <input
                  type="checkbox"
                  checked={formData.isActive === "Y"}
                  onChange={(event) =>
                    updateField("isActive", event.target.checked ? "Y" : "N")
                  }
                />
                Active
              </label>
            </div>
          </div>
        </div>

        <div className="form-card">
          <h3>Address & Details</h3>
          <div className="form-grid">
            <input {...getFieldProps("buildingNumber")} value={formData.buildingNumber} placeholder="Building Number" />
            <input {...getFieldProps("road")} value={formData.road} placeholder="Road" />
            <input {...getFieldProps("landmark")} value={formData.landmark} placeholder="Landmark" />
            <select
              {...(hasValue(formData.stateId)
                ? { disabled: true }
                : { onChange: handleStateChange })}
              value={formData.stateId}
            >
              <option value="">State</option>
              {states.map((state) => <option key={state.stateId} value={state.stateId}>{state.stateName}</option>)}
            </select>
            <select
              {...(hasValue(formData.cityId)
                ? { disabled: true }
                : { onChange: handleCityChange })}
              value={formData.cityId}
            >
              <option value="">City</option>
              {cities.map((city) => <option key={city.cityId} value={city.cityId}>{city.cityName}</option>)}
            </select>
            <select
              {...(hasValue(formData.areaId)
                ? { disabled: true }
                : { onChange: (event) => updateField("areaId", event.target.value) })}
              value={formData.areaId}
            >
              <option value="">Area</option>
              {areas.map((area) => <option key={area.areaId} value={area.areaId}>{area.areaName}</option>)}
            </select>
            <input {...getFieldProps("latitude")} value={formData.latitude} placeholder="Latitude" />
            <input {...getFieldProps("longitude")} value={formData.longitude} placeholder="Longitude" />
          </div>
          <label className="create-outlet-field-label" style={{ marginTop: "16px" }}>
            Outlet Description / Notes
            <textarea
              value={formData.description}
              onChange={(event) => updateField("description", event.target.value)}
              placeholder="Outlet Description / Notes"
              rows={3}
            />
          </label>
        </div>

        <div className="form-card">
          <div className="bank-header">
            <h3>Bank & Verification Details</h3>
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
            {[
              ["accountHolderName", "Account Holder Name"],
              ["accountNumber", "Account Number"],
              ["ifscCode", "IFSC Code"],
              ["bankName", "Bank Name"],
              // ["panNumber", "PAN Number"],
              // ["fssaiNumber", "FSSAI Number"],
              // ["gstNumber", "GST Number"],
            ].map(([name, placeholder]) => (
              <input
                key={name}
                {...getFieldProps(name)}
                value={formData[name]}
                placeholder={placeholder}
                onChange={(event) => updateField(name, event.target.value)}
                disabled={sameAsMerchant}
              />
            ))}
          </div>
        </div>

        <div className="form-card">
          <div className="bank-header operating-hours-header">
            <h3>Operating Hours</h3>
            <span className="operating-hours-hint">Add multiple time slots for the same day</span>
          </div>
          <div className="timings-table-wrapper">
            <table className="timings-table operating-hours-table">
              <thead><tr><th>Day</th><th>Open</th><th>Opening Time</th><th>Closing Time</th><th>Actions</th></tr></thead>
              <tbody>
                {formData.operatingDays.map((timing, index) => (
                  <tr key={`${timing.dayOfWeekId}-${index}`}>
                    <td>{DAYS_OF_WEEK.find((day) => day.id === Number(timing.dayOfWeekId))?.name || "Day"}</td>
                    <td>
                      <input
                        type="checkbox"
                        checked={timing.isOpen}
                        onChange={(event) => updateTiming(index, "isOpen", event.target.checked)}
                      />
                    </td>
                    <td>
                      <input
                        type="time"
                        value={timing.openingTime}
                        disabled={!timing.isOpen}
                        onChange={(event) => updateTiming(index, "openingTime", event.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="time"
                        value={timing.closingTime}
                        disabled={!timing.isOpen}
                        onChange={(event) => updateTiming(index, "closingTime", event.target.value)}
                      />
                    </td>
                    <td className="timing-actions">
                      <button
                        type="button"
                        className="timing-add-hours-btn"
                        onClick={() => addTimingForDay(index)}
                      >
                        + Add Hours
                      </button>
                      <button
                        type="button"
                        className="timing-remove-btn"
                        onClick={() => removeTiming(index)}
                        aria-label="Remove timing"
                        title="Remove timing"
                      >
                        x
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="cancel-btn" onClick={() => navigate("/outlets")}>Cancel</button>
          <button type="submit" className="save-btn" disabled={saving}>
            {saving ? "Updating..." : "Update Outlet"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditOutlet;
