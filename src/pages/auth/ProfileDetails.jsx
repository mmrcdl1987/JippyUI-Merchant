import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUserCircle,
  FaUpload,
  FaSave,
  FaRedo,
  FaHashtag,
  FaUser,
  FaEnvelope,
  FaPhoneAlt,
  FaBuilding,
  FaUsers,
  FaHome,
  FaRoad,
  FaMapMarkerAlt,
  FaUniversity,
  FaCreditCard,
  FaCode,
  FaIdCard,
  FaFileAlt,
  FaCheckCircle,
  FaClock,
  FaStore,
  FaChevronRight,
  FaChevronDown,
  FaInfoCircle,
} from "react-icons/fa";
import {
  getMerchantProfile,
  updateMerchantProfile,
  uploadMerchantDocuments,
  fetchStates,
  fetchCitiesByState,
  fetchAreasByCity,
} from "../../services/merchantService";
import "../../styles/ProfileDetails.css";

const PATTERNS = {
  merchantName: /^[A-Za-z ]+$/,
  merchantEmail: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  merchantPhone: /^[6-9]\d{9}$/,
  accountNumber: /^[0-9]{9,18}$/,
  ifscCode: /^[A-Z]{4}0[A-Z0-9]{6}$/,
  aadharNumber: /^[2-9][0-9]{11}$/,
  panNumber: /^[A-Z]{5}[0-9]{4}[A-Z]$/,
};

const USER_TYPES = ["MERCHANT", "SUB_MERCHANT", "STAFF"];

const EMPTY_MERCHANT = {
  merchantId: "",
  merchantName: "",
  merchantEmail: "",
  merchantPhone: "",
  businessType: "",
  isApproved: false,

  buildingNumber: "",
  road: "",
  landmark: "",

  stateId: "",
  cityId: "",
  areaId: "",

  bankId: "",
  recipientId: "",
  accountNumber: "",
  ifscCode: "",
  bankName: "",
  accountHolderName: "",

  userType: "",

  aadharNumber: "",
  panNumber: "",

  aadhaarNumberUrl: "",
  panNumberUrl: "",

  fssaiNumberUrl: "",
  fssaiNumber: "",
};

const DOCUMENT_ENTITY_TYPE = "MERCHANT";

const extractDocumentUrl = (response, candidateKeys) => {
  if (!response || typeof response !== "object") return null;

  const sources = [response, response.data].filter(Boolean);
  for (const source of sources) {
    for (const key of candidateKeys) {
      if (source[key]) return source[key];
    }
  }
  return null;
};

const warnIfMissing = (data, field, humanLabel) => {
  if (data[field] === undefined || data[field] === null || data[field] === "") {
    console.warn(
      `[ProfileDetails] Backend GET response has no "${field}" (${humanLabel}). ` +
        "The field name matches the DTO, so this means the server is not " +
        "persisting/returning it — this is a backend bug, not a frontend one."
    );
    return false;
  }
  return true;
};

const mapProfileToState = (data) => {
  console.log("[ProfileDetails] Raw profile response:", data);

  const aadharOk = warnIfMissing(data, "aadharNumber", "Aadhaar number");
  const panOk = warnIfMissing(data, "panNumber", "PAN number");
  const urlPresent = !!data.aadhaarNumberUrl;

  console.log("[ProfileDetails] Field presence check:", {
    aadharNumberPresent: aadharOk,
    panNumberPresent: panOk,
    aadhaarNumberUrlPresent: urlPresent,
    aadhaarNumberUrl: data.aadhaarNumberUrl ?? null,
  });

  if (urlPresent) {
    console.log(
      "[ProfileDetails] aadhaarNumberUrl returned by server — open this exact " +
        "URL yourself and confirm it's the file you actually uploaded. If it " +
        "shows something else, the backend's upload/storage logic is writing " +
        "to the wrong key or returning a stale/unrelated URL:",
      data.aadhaarNumberUrl
    );
  }

  return {
    merchantId: data.merchantId ?? "",
    merchantName: data.merchantName ?? "",
    merchantEmail: data.merchantEmail ?? "",
    merchantPhone: data.merchantPhone ?? "",
    businessType: data.businessType ?? "",
    isApproved: data.isApproved ?? false,

    buildingNumber: data.buildingNumber ?? "",
    road: data.road ?? "",
    landmark: data.landmark ?? "",

    stateId: data.stateId ?? "",
    cityId: data.cityId ?? "",
    areaId: data.areaId ?? "",

    bankId: data.bankId ?? "",
    recipientId: data.recipientId ?? "",
    accountNumber: data.accountNumber ?? "",
    ifscCode: data.ifscCode ?? "",
    bankName: data.bankName ?? "",
    accountHolderName: data.accountHolderName ?? "",

    userType: data.userType ?? "",

    aadharNumber: data.aadharNumber ?? "",
    panNumber: data.panNumber ?? "",

    aadhaarNumberUrl: data.aadhaarNumberUrl ?? "",
    panNumberUrl: data.panNumberUrl ?? "",

    fssaiNumber: "",
  };
};

const Required = () => <span className="required-mark">*</span>;

const ErrorText = ({ message }) =>
  message ? <span className="field-error">{message}</span> : null;

const Field = ({ label, required, icon, error, children }) => (
  <div className="profile-field">
    <label>
      {label}
      {required && <Required />}
    </label>

    <div className={`field-input ${error ? "field-input--error" : ""}`}>
      <span className="field-icon">{icon}</span>
      {children}
    </div>

    <ErrorText message={error} />
  </div>
);

const ProfileDetails = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [aadhaarFile, setAadhaarFile] = useState(null);
  const [fssaiFile, setFssaiFile] = useState(null);

  const [panFile, setPanFile] = useState(null);
  const [uploadingPan, setUploadingPan] = useState(false);
  const [showPanRemoveConfirm, setShowPanRemoveConfirm] = useState(false);
  const [showPanRemoveSuccess, setShowPanRemoveSuccess] = useState(false);

  const [errors, setErrors] = useState({});

  const [merchant, setMerchant] = useState(EMPTY_MERCHANT);
  const initialSnapshot = useRef(EMPTY_MERCHANT);

  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingAreas, setLoadingAreas] = useState(false);

  const [uploadingAadhaar, setUploadingAadhaar] = useState(false);
  const [uploadingFssai, setUploadingFssai] = useState(false);

  const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

  // ---------------------------------------------------------------------
  // PAN — now mirrors the Aadhaar flow: pick a file -> upload immediately
  // via uploadMerchantDocuments -> store the returned URL on
  // merchant.panNumberUrl. Previously this only called setPanFile(file)
  // and never uploaded anything, so merchant.panNumberUrl was never set,
  // the preview crashed on reload (panFile.name on a null panFile), and
  // there was nothing real for Save/Remove to act on.
  // ---------------------------------------------------------------------
  const handlePanUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      alert("Please upload a valid PAN image (JPG, JPEG, PNG or WEBP).");
      e.target.value = "";
      return;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      alert("PAN card image must be less than 5 MB.");
      e.target.value = "";
      return;
    }

    setUploadingPan(true);
    try {
      const result = await uploadMerchantDocuments(
        merchant.merchantId,
        DOCUMENT_ENTITY_TYPE,
        { panFile: file }
      );
      const url = extractDocumentUrl(result, ["panFileUrl", "panNumberUrl", "panUrl"]);

      if (!url) {
        console.warn(
          "[ProfileDetails] PAN upload succeeded but no recognizable URL was " +
            "found in the response. Check the raw response logged above and " +
            "add the correct key name to extractDocumentUrl()."
        );
      }

      setPanFile(file);
      setMerchant((prev) => ({ ...prev, panNumberUrl: url || prev.panNumberUrl }));
      setErrors((prev) => ({ ...prev, panFile: undefined }));
    } catch (error) {
      console.error("PAN document upload failed:", error);
      alert("Could not upload the PAN document. Please try again.");
    } finally {
      setUploadingPan(false);
      e.target.value = "";
    }
  };

  const handleConfirmPanRemove = async () => {
    const previousUrl = merchant.panNumberUrl;

    try {
      setShowPanRemoveConfirm(false);

      const payload = {
        merchantId: Number(merchant.merchantId),

        merchantName: merchant.merchantName.trim(),
        merchantEmail: merchant.merchantEmail.trim(),
        merchantPhone: merchant.merchantPhone.trim(),
        businessType: merchant.businessType.trim(),
        isApproved: merchant.isApproved,

        buildingNumber: merchant.buildingNumber || null,
        road: merchant.road || null,
        landmark: merchant.landmark || null,

        stateId: merchant.stateId ? Number(merchant.stateId) : null,
        cityId: merchant.cityId ? Number(merchant.cityId) : null,
        areaId: merchant.areaId ? Number(merchant.areaId) : null,

        bankId: merchant.bankId ? Number(merchant.bankId) : null,
        recipientId: merchant.recipientId ? Number(merchant.recipientId) : null,

        accountNumber: merchant.accountNumber.trim(),
        ifscCode: merchant.ifscCode.trim(),
        bankName: merchant.bankName.trim(),
        accountHolderName: merchant.accountHolderName.trim(),

        userType: merchant.userType.trim(),

        aadharNumber: merchant.aadharNumber.trim(),
        panNumber: merchant.panNumber.trim(),

        aadhaarNumberUrl: merchant.aadhaarNumberUrl || null,

        // IMPORTANT
        panNumberUrl: null,
      };

      console.log("[ProfileDetails] Removing PAN image:", payload);

      await updateMerchantProfile(payload);

      // Verify server state
      const fresh = await getMerchantProfile();

      console.log("[ProfileDetails] Profile after PAN removal:", fresh);

      if (fresh.panNumberUrl) {
        console.error("Backend did not clear panNumberUrl:", fresh.panNumberUrl);

        setMerchant((prev) => ({
          ...prev,
          panNumberUrl: fresh.panNumberUrl,
        }));

        alert("The PAN image was not removed from the server. Please contact the backend team.");
        return;
      }

      // Server confirmed removal
      setPanFile(null);

      setMerchant((prev) => ({
        ...prev,
        panNumberUrl: "",
      }));

      setShowPanRemoveSuccess(true);

      setTimeout(() => {
        setShowPanRemoveSuccess(false);
        navigate(-1);
      }, 1500);
    } catch (error) {
      console.error("Failed to remove PAN document:", error);

      setMerchant((prev) => ({
        ...prev,
        panNumberUrl: previousUrl,
      }));

      setShowPanRemoveConfirm(false);

      alert("Could not remove the PAN card. Please try again.");
    }
  };

  const loadCitiesForState = useCallback(async (stateId) => {
    if (!stateId) {
      setCities([]);
      return;
    }
    setLoadingCities(true);
    try {
      const data = await fetchCitiesByState(stateId);
      setCities(data ?? []);
    } catch (error) {
      console.error("Failed to load cities:", error);
      setCities([]);
    } finally {
      setLoadingCities(false);
    }
  }, []);

  const loadAreasForCity = useCallback(async (cityId) => {
    if (!cityId) {
      setAreas([]);
      return;
    }
    setLoadingAreas(true);
    try {
      const data = await fetchAreasByCity(cityId);
      setAreas(data ?? []);
    } catch (error) {
      console.error("Failed to load areas:", error);
      setAreas([]);
    } finally {
      setLoadingAreas(false);
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [profileData, statesData] = await Promise.all([
        getMerchantProfile(),
        fetchStates().catch((error) => {
          console.error("Failed to load states:", error);
          return [];
        }),
      ]);

      console.log("[ProfileDetails] getMerchantProfile raw response:", profileData);

      const normalized = mapProfileToState(profileData);

      console.log("[ProfileDetails] Loaded aadharNumber/panNumber:", {
        aadharNumber: normalized.aadharNumber,
        panNumber: normalized.panNumber,
        aadhaarNumberUrlLength: normalized.aadhaarNumberUrl ? normalized.aadhaarNumberUrl.length : 0,
      });

      setMerchant(normalized);
      initialSnapshot.current = normalized;
      setStates(statesData ?? []);
      setAadhaarFile(null);
      setFssaiFile(null);
      setPanFile(null);
      setErrors({});

      if (normalized.stateId) {
        await loadCitiesForState(normalized.stateId);
      } else {
        setCities([]);
      }
      if (normalized.cityId) {
        await loadAreasForCity(normalized.cityId);
      } else {
        setAreas([]);
      }
    } catch (error) {
      console.error("Failed to load merchant profile:", error);
      alert("Failed to load profile details.");
    } finally {
      setLoading(false);
    }
  }, [loadCitiesForState, loadAreasForCity]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Force-uppercase fields the backend expects in uppercase
    const nextValue = name === "ifscCode" || name === "panNumber" ? value.toUpperCase() : value;

    setMerchant((prev) => ({
      ...prev,
      [name]: nextValue,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleStateChange = async (e) => {
    const stateId = e.target.value;
    setMerchant((prev) => ({ ...prev, stateId, cityId: "", areaId: "" }));
    setAreas([]);
    await loadCitiesForState(stateId);
  };

  const handleCityChange = async (e) => {
    const cityId = e.target.value;
    setMerchant((prev) => ({ ...prev, cityId, areaId: "" }));
    await loadAreasForCity(cityId);
  };

  const handleAreaChange = (e) => {
    setMerchant((prev) => ({ ...prev, areaId: e.target.value }));
  };

  const handleAadhaarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > MAX_UPLOAD_BYTES) {
      alert("Please choose a file under 5MB.");
      e.target.value = "";
      return;
    }

    setUploadingAadhaar(true);
    try {
      const result = await uploadMerchantDocuments(merchant.merchantId, DOCUMENT_ENTITY_TYPE, {
        aadharFile: file,
      });
      const url = extractDocumentUrl(result, [
        "aadharFileUrl",
        "aadhaarFileUrl",
        "aadhaarNumberUrl",
        "aadharNumberUrl",
      ]);

      if (!url) {
        console.warn(
          "[ProfileDetails] saveOrUpdateDocuments succeeded but no recognizable " +
            "Aadhaar URL was found in the response. Check the raw response logged " +
            "above and add the correct key name to extractDocumentUrl()."
        );
      }

      setAadhaarFile(file);
      setMerchant((prev) => ({ ...prev, aadhaarNumberUrl: url || prev.aadhaarNumberUrl }));
      setErrors((prev) => ({ ...prev, aadhaarFile: undefined }));
    } catch (error) {
      console.error("Aadhaar document upload failed:", error);
      alert("Could not upload the Aadhaar document. Please try again.");
    } finally {
      setUploadingAadhaar(false);
      e.target.value = "";
    }
  };

  const handleRemoveAadhaarUpload = async () => {
    if (!window.confirm("Remove the uploaded Aadhaar document?")) return;

    const previousUrl = merchant.aadhaarNumberUrl;

    setAadhaarFile(null);
    setMerchant((prev) => ({ ...prev, aadhaarNumberUrl: "" }));

    try {
      const payload = {
        merchantId: Number(merchant.merchantId),
        merchantName: merchant.merchantName.trim(),
        merchantEmail: merchant.merchantEmail.trim(),
        merchantPhone: merchant.merchantPhone.trim(),
        businessType: merchant.businessType.trim(),
        isApproved: merchant.isApproved,
        buildingNumber: merchant.buildingNumber || null,
        road: merchant.road || null,
        landmark: merchant.landmark || null,
        stateId: merchant.stateId ? Number(merchant.stateId) : null,
        cityId: merchant.cityId ? Number(merchant.cityId) : null,
        areaId: merchant.areaId ? Number(merchant.areaId) : null,
        bankId: merchant.bankId ? Number(merchant.bankId) : null,
        recipientId: merchant.recipientId ? Number(merchant.recipientId) : null,
        accountNumber: merchant.accountNumber.trim(),
        ifscCode: merchant.ifscCode.trim(),
        bankName: merchant.bankName.trim(),
        accountHolderName: merchant.accountHolderName.trim(),
        userType: merchant.userType.trim(),
        aadharNumber: merchant.aadharNumber.trim(),
        panNumber: merchant.panNumber.trim(),
        aadhaarNumberUrl: null,
        panNumberUrl: merchant.panNumberUrl || null,
      };

      console.log("[ProfileDetails] Removing Aadhaar image, sending payload:", payload);
      const saveResult = await updateMerchantProfile(payload);
      console.log("[ProfileDetails] Remove-Aadhaar save response:", saveResult);

      const fresh = await getMerchantProfile();
      console.log("[ProfileDetails] Profile re-fetched after removal:", fresh);

      if (fresh.aadhaarNumberUrl) {
        console.warn(
          "[ProfileDetails] BACKEND BUG CONFIRMED: sent aadhaarNumberUrl: null, " +
            "but the very next GET still returns a non-null aadhaarNumberUrl " +
            `("${fresh.aadhaarNumberUrl}"). The update endpoint is silently ` +
            "ignoring the null instead of clearing the field — flag this to " +
            "the backend team directly, it's not fixable from this side."
        );
        setMerchant((prev) => ({ ...prev, aadhaarNumberUrl: fresh.aadhaarNumberUrl }));
        alert(
          "The server did not actually remove the Aadhaar image (this is a " +
            "backend issue — the update endpoint is ignoring the null value). " +
            "It has been restored in this view to match what's really saved."
        );
      }
    } catch (error) {
      console.error("Failed to remove Aadhaar document:", error);
      alert("Could not remove the Aadhaar document. Please try again.");
      setMerchant((prev) => ({ ...prev, aadhaarNumberUrl: previousUrl }));
    }
  };

  const handleFssaiUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > MAX_UPLOAD_BYTES) {
      alert("Please choose a file under 5MB.");
      e.target.value = "";
      return;
    }

    setUploadingFssai(true);
    try {
      const result = await uploadMerchantDocuments(merchant.merchantId, DOCUMENT_ENTITY_TYPE, {
        fssaiFile: file,
      });
      const url = extractDocumentUrl(result, ["fssaiFileUrl", "fssaiNumberUrl", "fssaiUrl"]);

      if (!url) {
        console.warn(
          "[ProfileDetails] saveOrUpdateDocuments succeeded but no recognizable " +
            "FSSAI URL was found in the response. Check the raw response logged " +
            "above and add the correct key name to extractDocumentUrl()."
        );
      }

      setFssaiFile(file);
      setMerchant((prev) => ({ ...prev, fssaiNumberUrl: url || prev.fssaiNumberUrl }));
    } catch (error) {
      console.error("FSSAI document upload failed:", error);
      alert("Could not upload the FSSAI document. Please try again.");
    } finally {
      setUploadingFssai(false);
      e.target.value = "";
    }
  };

  const handleRemoveFssaiUpload = () => {
    setFssaiFile(null);
    setMerchant((prev) => ({ ...prev, fssaiNumberUrl: "" }));
  };

  const handleReset = () => {
    const snapshot = initialSnapshot.current;
    setMerchant(snapshot);
    setAadhaarFile(null);
    setFssaiFile(null);
    setPanFile(null);
    setErrors({});
    if (snapshot.stateId) loadCitiesForState(snapshot.stateId);
    else setCities([]);
    if (snapshot.cityId) loadAreasForCity(snapshot.cityId);
    else setAreas([]);
  };

  const validate = () => {
    const next = {};

    if (!merchant.merchantName.trim()) {
      next.merchantName = "Merchant name is required.";
    } else if (merchant.merchantName.trim().length < 3 || merchant.merchantName.length > 100) {
      next.merchantName = "Merchant name must be between 3 and 100 characters.";
    } else if (!PATTERNS.merchantName.test(merchant.merchantName)) {
      next.merchantName = "Merchant name can contain only letters and spaces.";
    }

    if (!merchant.merchantEmail.trim()) {
      next.merchantEmail = "Email is required.";
    } else if (!PATTERNS.merchantEmail.test(merchant.merchantEmail)) {
      next.merchantEmail = "Enter a valid email address.";
    }

    if (!merchant.merchantPhone.trim()) {
      next.merchantPhone = "Phone number is required.";
    } else if (!/^\d+$/.test(merchant.merchantPhone)) {
      next.merchantPhone = "Phone number must contain only digits.";
    } else if (merchant.merchantPhone.length !== 10) {
      next.merchantPhone = "Phone number must be exactly 10 digits.";
    } else if (!PATTERNS.merchantPhone.test(merchant.merchantPhone)) {
      next.merchantPhone = "Phone number must start with 6, 7, 8, or 9.";
    }

    if (!merchant.businessType.trim()) {
      next.businessType = "Business type is required.";
    }

    if (!merchant.userType.trim()) {
      next.userType = "User type is required.";
    }

    if (!merchant.accountNumber.trim()) {
      next.accountNumber = "Account number is required.";
    } else if (!PATTERNS.accountNumber.test(merchant.accountNumber)) {
      next.accountNumber = "Account number must be 9 to 18 digits.";
    }

    if (!merchant.ifscCode.trim()) {
      next.ifscCode = "IFSC code is required.";
    } else if (!PATTERNS.ifscCode.test(merchant.ifscCode)) {
      next.ifscCode = "Invalid IFSC code format (e.g. HDFC0001234).";
    }

    if (!merchant.bankName.trim()) {
      next.bankName = "Bank name is required.";
    }

    if (!merchant.accountHolderName.trim()) {
      next.accountHolderName = "Account holder name is required.";
    }

    if (!merchant.aadharNumber.trim()) {
      next.aadharNumber = "Aadhaar number is required.";
    } else if (!/^\d+$/.test(merchant.aadharNumber)) {
      next.aadharNumber = "Aadhaar number must contain only digits.";
    } else if (merchant.aadharNumber.length !== 12) {
      next.aadharNumber = "Aadhaar number must be exactly 12 digits.";
    } else if (!PATTERNS.aadharNumber.test(merchant.aadharNumber)) {
      next.aadharNumber = "Aadhaar number cannot start with 0 or 1.";
    }

    if (!merchant.panNumber.trim()) {
      next.panNumber = "PAN number is required.";
    } else if (!PATTERNS.panNumber.test(merchant.panNumber)) {
      next.panNumber = "Invalid PAN format (e.g. ABCDE1234F).";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      alert("Please fix the highlighted fields before saving.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        merchantId: Number(merchant.merchantId),
        merchantName: merchant.merchantName.trim(),
        merchantEmail: merchant.merchantEmail.trim(),
        merchantPhone: merchant.merchantPhone.trim(),
        businessType: merchant.businessType.trim(),
        isApproved: merchant.isApproved,

        buildingNumber: merchant.buildingNumber || null,
        road: merchant.road || null,
        landmark: merchant.landmark || null,

        stateId: merchant.stateId ? Number(merchant.stateId) : null,
        cityId: merchant.cityId ? Number(merchant.cityId) : null,
        areaId: merchant.areaId ? Number(merchant.areaId) : null,

        bankId: merchant.bankId ? Number(merchant.bankId) : null,
        recipientId: merchant.recipientId ? Number(merchant.recipientId) : null,

        accountNumber: merchant.accountNumber.trim(),
        ifscCode: merchant.ifscCode.trim(),
        bankName: merchant.bankName.trim(),
        accountHolderName: merchant.accountHolderName.trim(),

        userType: merchant.userType.trim(),

        aadharNumber: merchant.aadharNumber.trim(),
        panNumber: merchant.panNumber.trim(),

        aadhaarNumberUrl: merchant.aadhaarNumberUrl || null,
        panNumberUrl: merchant.panNumberUrl || null,
      };

      console.log("[ProfileDetails] Saving payload:", payload);

      const saveResult = await updateMerchantProfile(payload);
      console.log("[ProfileDetails] updateMerchantProfile response:", saveResult);

      if (saveResult && typeof saveResult === "object") {
        if (saveResult.aadharNumber == null || saveResult.panNumber == null) {
          console.warn(
            "[ProfileDetails] Save response did NOT echo back aadharNumber/panNumber. " +
              "That means the backend's update endpoint isn't setting these on the " +
              "entity before persisting — flag this to the backend team directly."
          );
        }
      }

      alert("Profile updated successfully!");
      initialSnapshot.current = merchant;

      await loadAll();
    } catch (error) {
      console.error("Profile update failed:", error);
      alert("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="profile-loading">Loading profile...</div>;
  }

  return (
    <div className="profile-details-page">
      <div className="page-blob" aria-hidden="true" />

      {/* BREADCRUMB */}
      <div className="profile-breadcrumb">
        <span>Dashboard</span>
        <FaChevronRight />
        <span className="profile-breadcrumb-current">Profile</span>
      </div>

      {/* PAGE HEADER */}
      <div className="profile-page-header">
        <div className="profile-page-header-left">
          <div className="profile-header-icon">
            <FaUserCircle />
          </div>
          <div>
            <h1>Merchant Profile</h1>
            <p>Manage your business and banking details</p>
          </div>
        </div>

        <div className="profile-banner">
          <div className="profile-banner-icon">
            <FaStore />
          </div>
          <div>
            <strong>Keep your profile updated</strong>
            <p>Accurate details help us serve you better</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {/* BASIC INFORMATION */}
        <div className="profile-card">
          <div className="profile-card-header">
            <div className="profile-card-header-left">
              <span className="card-icon">
                <FaUser />
              </span>
              <div>
                <h2>Basic Information</h2>
                <p>Your business and contact details</p>
              </div>
            </div>

            {merchant.isApproved ? (
              <span className="status-badge status-badge--approved">
                <FaCheckCircle /> Approved
              </span>
            ) : (
              <span className="status-badge status-badge--pending">
                <FaClock /> Pending Approval
              </span>
            )}
          </div>

          <div className="profile-grid">
            <Field label="Merchant ID" icon={<FaHashtag />}>
              <input type="text" value={merchant.merchantId} disabled />
            </Field>

            <Field label="Merchant Name" required icon={<FaUser />} error={errors.merchantName}>
              <input
                type="text"
                name="merchantName"
                value={merchant.merchantName}
                onChange={handleChange}
                maxLength={100}
              />
            </Field>

            <Field label="Merchant Email" required icon={<FaEnvelope />} error={errors.merchantEmail}>
              <input type="email" name="merchantEmail" value={merchant.merchantEmail} onChange={handleChange} />
            </Field>

            <Field label="Merchant Phone" required icon={<FaPhoneAlt />} error={errors.merchantPhone}>
              <input
                type="text"
                name="merchantPhone"
                value={merchant.merchantPhone}
                onChange={handleChange}
                maxLength={10}
                placeholder="10-digit number starting with 6-9"
              />
            </Field>

            <Field label="Business Type" required icon={<FaBuilding />} error={errors.businessType}>
              <input
                type="text"
                name="businessType"
                value={merchant.businessType}
                onChange={handleChange}
                placeholder="e.g. 5 star Restaurant"
              />
            </Field>

            <Field label="User Type" required icon={<FaUsers />} error={errors.userType}>
              <div className="select-wrap">
                <select name="userType" value={merchant.userType} onChange={handleChange}>
                  <option value="">Select user type</option>
                  {USER_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <FaChevronDown className="select-chevron" />
              </div>
            </Field>
          </div>
        </div>

        {/* BUSINESS ADDRESS */}
        <div className="profile-card">
          <div className="profile-card-header">
            <div className="profile-card-header-left">
              <span className="card-icon">
                <FaMapMarkerAlt />
              </span>
              <div>
                <h2>Business Address</h2>
                <p>Your registered business address</p>
              </div>
            </div>
          </div>

          <div className="profile-grid">
            <Field label="Building Number" icon={<FaHome />}>
              <input type="text" name="buildingNumber" value={merchant.buildingNumber} onChange={handleChange} />
            </Field>

            <Field label="Road" icon={<FaRoad />}>
              <input type="text" name="road" value={merchant.road} onChange={handleChange} />
            </Field>

            <Field label="Landmark" icon={<FaMapMarkerAlt />}>
              <input type="text" name="landmark" value={merchant.landmark} onChange={handleChange} />
            </Field>

            <Field label="State" icon={<FaUniversity />}>
              <div className="select-wrap">
                <select name="stateId" value={merchant.stateId} onChange={handleStateChange}>
                  <option value="">Select state</option>
                  {states.map((state) => (
                    <option key={state.stateId} value={state.stateId}>
                      {state.stateName}
                    </option>
                  ))}
                </select>
                <FaChevronDown className="select-chevron" />
              </div>
            </Field>

            <Field label="City" icon={<FaUniversity />}>
              <div className="select-wrap">
                <select name="cityId" value={merchant.cityId} onChange={handleCityChange} disabled={!merchant.stateId || loadingCities}>
                  <option value="">{loadingCities ? "Loading cities..." : "Select city"}</option>
                  {cities.map((city) => (
                    <option key={city.cityId} value={city.cityId}>
                      {city.cityName}
                    </option>
                  ))}
                </select>
                <FaChevronDown className="select-chevron" />
              </div>
            </Field>

            <Field label="Area" icon={<FaUniversity />}>
              <div className="select-wrap">
                <select name="areaId" value={merchant.areaId} onChange={handleAreaChange} disabled={!merchant.cityId || loadingAreas}>
                  <option value="">{loadingAreas ? "Loading areas..." : "Select area"}</option>
                  {areas.map((area) => (
                    <option key={area.areaId} value={area.areaId}>
                      {area.areaName}
                    </option>
                  ))}
                </select>
                <FaChevronDown className="select-chevron" />
              </div>
            </Field>
          </div>
        </div>

        {/* BANK DETAILS */}
        <div className="profile-card">
          <div className="profile-card-header">
            <div className="profile-card-header-left">
              <span className="card-icon">
                <FaUniversity />
              </span>
              <div>
                <h2>Bank Details</h2>
                <p>Your bank account information for payments</p>
              </div>
            </div>
          </div>

          <div className="profile-grid">
            <Field label="Bank ID" icon={<FaUniversity />}>
              <input type="number" name="bankId" value={merchant.bankId} onChange={handleChange} />
            </Field>

            <Field label="Recipient ID" icon={<FaUser />}>
              <input type="number" name="recipientId" value={merchant.recipientId} onChange={handleChange} />
            </Field>

            <Field label="Account Number" required icon={<FaCreditCard />} error={errors.accountNumber}>
              <input
                type="text"
                name="accountNumber"
                value={merchant.accountNumber}
                onChange={handleChange}
                maxLength={18}
                placeholder="9 to 18 digits"
              />
            </Field>

            <Field label="IFSC Code" required icon={<FaCode />} error={errors.ifscCode}>
              <input
                type="text"
                name="ifscCode"
                value={merchant.ifscCode}
                onChange={handleChange}
                maxLength={11}
                placeholder="e.g. HDFC0001234"
              />
            </Field>

            <Field label="Bank Name" required icon={<FaUniversity />} error={errors.bankName}>
              <input type="text" name="bankName" value={merchant.bankName} onChange={handleChange} />
            </Field>

            <Field label="Account Holder Name" required icon={<FaUser />} error={errors.accountHolderName}>
              <input type="text" name="accountHolderName" value={merchant.accountHolderName} onChange={handleChange} />
            </Field>
          </div>
        </div>

        {/* IMPORTANT DOCUMENTS */}
        <div className="profile-card">
          <div className="profile-card-header">
            <div className="profile-card-header-left">
              <span className="card-icon">
                <FaFileAlt />
              </span>
              <div>
                <h2>Important Documents</h2>
                <p>Upload your Aadhaar and PAN documents</p>
              </div>
            </div>
          </div>

          <div className="profile-grid">
            <Field label="Aadhaar Details" required icon={<FaIdCard />} error={errors.aadharNumber}>
              <input
                type="text"
                name="aadharNumber"
                value={merchant.aadharNumber}
                onChange={handleChange}
                maxLength={12}
                placeholder="12-digit Aadhaar number"
              />
            </Field>

            <Field label="FSSAI Details" icon={<FaFileAlt />}>
              <input
                type="text"
                name="fssaiNumber"
                value={merchant.fssaiNumber}
                onChange={handleChange}
                placeholder="FSSAI license number"
              />
            </Field>

            <Field label="PAN Number" required icon={<FaIdCard />} error={errors.panNumber}>
              <input
                type="text"
                name="panNumber"
                value={merchant.panNumber}
                onChange={handleChange}
                maxLength={10}
                placeholder="e.g. ABCDE1234F"
              />
            </Field>
          </div>

          <div className="document-upload-grid">
            {/* AADHAAR — uploads immediately via uploadMerchantDocuments */}
            <div className="document-upload-box">
              {uploadingAadhaar ? (
                <>
                  <div className="upload-icon-circle upload-icon-circle--aadhaar">
                    <FaUpload />
                  </div>
                  <h3>Uploading...</h3>
                  <p>Please wait</p>
                </>
              ) : merchant.aadhaarNumberUrl ? (
                <>
                  <img
                    src={merchant.aadhaarNumberUrl}
                    alt="Uploaded Aadhaar document"
                    className="upload-preview-img"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                  <h3>Aadhaar Document Saved</h3>
                  <p>{aadhaarFile ? aadhaarFile.name : "Uploaded previously"}</p>

                  <div className="upload-preview-actions">
                    <a href={merchant.aadhaarNumberUrl} target="_blank" rel="noreferrer" className="upload-link">
                      View
                    </a>
                    <label className="upload-button upload-button--aadhaar">
                      Replace
                      <input type="file" accept="image/*,.pdf" onChange={handleAadhaarUpload} />
                    </label>
                    <button type="button" className="upload-remove-btn" onClick={handleRemoveAadhaarUpload}>
                      Remove
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="upload-icon-circle upload-icon-circle--aadhaar">
                    <FaUpload />
                  </div>
                  <h3>Upload Aadhaar Image</h3>
                  <p>Optional — upload a clear image of your Aadhaar card</p>
                  <span className="upload-hint">JPG, PNG or PDF (Max 5MB)</span>

                  <label className="upload-button upload-button--aadhaar">
                    Choose File
                    <input type="file" accept="image/*,.pdf" onChange={handleAadhaarUpload} />
                  </label>
                </>
              )}
              <ErrorText message={errors.aadhaarFile} />
            </div>

            {/* PAN — now mirrors Aadhaar exactly: uploads immediately, and the
                thumbnail is driven by merchant.panNumberUrl so it's visible
                without clicking View, survives reload, and never crashes on
                a null panFile. */}
            <div className="document-upload-box">
              {uploadingPan ? (
                <>
                  <div className="upload-icon-circle upload-icon-circle--pan">
                    <FaUpload />
                  </div>
                  <h3>Uploading...</h3>
                  <p>Please wait</p>
                </>
              ) : merchant.panNumberUrl ? (
                <>
                  <img
                    src={merchant.panNumberUrl}
                    alt="Uploaded PAN document"
                    className="upload-preview-img"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                  <h3>PAN Card Saved</h3>
                  <p>{panFile ? panFile.name : "Uploaded previously"}</p>

                  <div className="upload-preview-actions">
                    <a href={merchant.panNumberUrl} target="_blank" rel="noreferrer" className="upload-link">
                      View
                    </a>
                    <label className="upload-button upload-button--pan">
                      Replace
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/jpg,image/webp"
                        onChange={handlePanUpload}
                      />
                    </label>
                    <button
                      type="button"
                      className="upload-remove-btn"
                      onClick={() => setShowPanRemoveConfirm(true)}
                    >
                      Remove
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="upload-icon-circle upload-icon-circle--pan">
                    <FaIdCard />
                  </div>
                  <h3>Upload PAN Card Image</h3>    
                  <p>Upload a clear image of your PAN card</p>
                  <span className="upload-hint">JPG, JPEG, PNG or WEBP (Max 5MB)</span>

                  <label className="upload-button upload-button--pan">
                    <FaUpload style={{ marginRight: "7px" }} />
                    Choose PAN Image
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/jpg,image/webp"
                      onChange={handlePanUpload}
                    />
                  </label>
                </>
              )}
              <ErrorText message={errors.panFile} />
            </div>
          </div>
        </div>

        {/* FOOTER BAR */}
        <div className="profile-footer-bar">
          <div className="profile-footer-note">
            <FaInfoCircle />
            <span>
              Please ensure all information is correct before saving. Fields marked with{" "}
              <span className="required-mark">*</span> are mandatory.
            </span>
          </div>

          <div className="profile-footer-actions">
            {/* <button type="button" className="reset-btn" onClick={handleReset} disabled={saving}>
              <FaRedo /> Reset
            </button> */}
            <button type="submit" className="save-profile-btn" disabled={saving}>
              <FaSave />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        {/* PAN REMOVE CONFIRMATION */}
        {showPanRemoveConfirm && (
          <div className="remove-confirm-overlay">
            <div className="remove-confirm-modal">
              <div className="remove-confirm-icon">
                <FaIdCard />
              </div>

              <h3>Remove PAN Card?</h3>
              <p>Are you sure you want to remove the PAN card image?</p>

              <div className="remove-confirm-actions">
                <button type="button" className="remove-cancel-btn" onClick={() => setShowPanRemoveConfirm(false)}>
                  Cancel
                </button>
                <button type="button" className="remove-confirm-btn" onClick={handleConfirmPanRemove}>
                  Remove
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PAN REMOVE SUCCESS — rendered independently, not nested inside
            showPanRemoveConfirm (that block unmounts before this would
            have shown, in the original code). */}
        {showPanRemoveSuccess && (
          <div className="remove-confirm-overlay">
            <div className="remove-confirm-modal success-modal">
              <div className="remove-success-icon">✓</div>
              <h3>PAN Card Removed Successfully</h3>
              <p>Your PAN card image has been removed successfully.</p>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default ProfileDetails;