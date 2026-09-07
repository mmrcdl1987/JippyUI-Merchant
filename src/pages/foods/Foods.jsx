import "../../styles/Foods.css";
import { Fragment, useEffect, useMemo, useState } from "react";

import {
  FaSearch,
  FaStore,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaUtensils,
  FaArrowRight,
  FaArrowLeft,
  FaUniversity,
  FaClock,
  FaLayerGroup,
} from "react-icons/fa";

import {
  getOutletsByMerchant,
  getAdminOutletDetails,
  updateMerchantPrice,
} from "../../services/outletService";

const Foods = () => {
  /* =========================================================
     STATE
  ========================================================= */

  const [outlets, setOutlets] = useState([]);
  const [selectedOutlet, setSelectedOutlet] = useState(null);
  const [outletDetails, setOutletDetails] = useState(null);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Merchant price editor
  const [merchantPriceEdits, setMerchantPriceEdits] = useState({});
  const [editingMerchantPrice, setEditingMerchantPrice] = useState(null);
  const [merchantPriceInput, setMerchantPriceInput] = useState("");
  const [merchantPriceError, setMerchantPriceError] = useState("");
  const [merchantPriceSaving, setMerchantPriceSaving] = useState(false);

  /* =========================================================
     LOAD OUTLETS
  ========================================================= */

  useEffect(() => {
    fetchOutlets();
  }, []);

  const fetchOutlets = async () => {
    try {
      setLoading(true);

      const response = await getOutletsByMerchant();

      console.log("Merchant outlets response:", response);

      if (Array.isArray(response)) {
        setOutlets(response);
        return;
      }

      if (Array.isArray(response?.data)) {
        setOutlets(response.data);
        return;
      }

      if (Array.isArray(response?.data?.data)) {
        setOutlets(response.data.data);
        return;
      }

      if (Array.isArray(response?.outlets)) {
        setOutlets(response.outlets);
        return;
      }

      setOutlets([]);
    } catch (error) {
      console.error("Failed to fetch merchant outlets:", error);
      setOutlets([]);
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     GET COMPLETE OUTLET DETAILS
  ========================================================= */

  const openOutletFoods = async (outlet) => {
    if (!outlet?.outletId) {
      console.error("Outlet ID is missing:", outlet);
      return;
    }

    try {
      setDetailsLoading(true);

      setSelectedOutlet(outlet);
      setOutletDetails(null);
  
      console.log(
        "Fetching complete outlet details:",
        outlet.outletId
      );

      const response = await getAdminOutletDetails(
        outlet.outletId
      );

      console.log(
        "Complete outlet details response:",
        response
      );

      /*
       * Supports:
       *
       * response
       * response.data
       * response.data.data
       */

      const details =
        response?.data?.data ??
        response?.data ??
        response;

      setOutletDetails(details || {});
    } catch (error) {
      console.error(
        "Failed to fetch complete outlet details:",
        error
      );

      setOutletDetails(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  /* =========================================================
     BACK
  ========================================================= */

  const handleBack = () => {
    setSelectedOutlet(null);
    setOutletDetails(null);
    closeMerchantPriceEditor();
  };

  /* =========================================================
     MERCHANT PRICE EDITOR
  ========================================================= */

  const getMerchantPriceKey = (productId) => String(productId);

  const getMerchantPrice = (product, productId) => {
    const key = getMerchantPriceKey(productId);

    if (Object.prototype.hasOwnProperty.call(merchantPriceEdits, key)) {
      return merchantPriceEdits[key];
    }

    return (
      product?.merchantPrice ??
      product?.merchantProductPrice ??
      product?.price ??
      ""
    );
  };

  const openMerchantPriceEditor = (product, productId) => {
    if (!product) return;

    const currentPrice = getMerchantPrice(product, productId);

    setEditingMerchantPrice({
      productId,
      productName:
        product?.productName ??
        product?.name ??
        product?.foodName ??
        "Food",
    });
    setMerchantPriceInput(
      currentPrice === null || currentPrice === undefined
        ? ""
        : String(currentPrice)
    );
    setMerchantPriceError("");
  };

  const closeMerchantPriceEditor = () => {
    setEditingMerchantPrice(null);
    setMerchantPriceInput("");
    setMerchantPriceError("");
    setMerchantPriceSaving(false);
  };

  const saveMerchantPrice = async () => {
    if (!editingMerchantPrice?.productId) {
      setMerchantPriceError("Product ID is missing.");
      return;
    }

    const trimmedPrice = String(merchantPriceInput).trim();

    if (trimmedPrice === "") {
      setMerchantPriceError("Please enter merchant price.");
      return;
    }

    const numericPrice = Number(trimmedPrice);

    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      setMerchantPriceError("Please enter a valid price.");
      return;
    }

    try {
      setMerchantPriceSaving(true);
      setMerchantPriceError("");

      const response = await updateMerchantPrice(
        editingMerchantPrice.productId,
        numericPrice
      );

      console.log(
        "Merchant price update response:",
        response
      );

      /*
       * Backend may return success=false when a merchant
       * tries to increase the merchant price.
       */
      if (response?.success === false) {
        setMerchantPriceError(
          response?.message ||
            "Merchant price could not be updated."
        );
        return;
      }

      const updatedPrice =
        response?.updatedPrice ??
        response?.data?.updatedPrice ??
        response?.merchantPrice ??
        response?.data?.merchantPrice ??
        numericPrice;

      const key = getMerchantPriceKey(
        editingMerchantPrice.productId
      );

      setMerchantPriceEdits((current) => ({
        ...current,
        [key]: updatedPrice,
      }));

      closeMerchantPriceEditor();
    } catch (error) {
      console.error(
        "Failed to update merchant price:",
        error
      );

      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to update merchant price.";

      setMerchantPriceError(errorMessage);
    } finally {
      setMerchantPriceSaving(false);
    }
  };

  /* =========================================================
     HELPERS
  ========================================================= */

  const value = (data, fallback = "-") => {
    if (
      data === null ||
      data === undefined ||
      data === ""
    ) {
      return fallback;
    }

    return data;
  };

  const formatPrice = (price) => {
    if (
      price === null ||
      price === undefined ||
      price === ""
    ) {
      return "-";
    }

    const numericPrice = Number(price);

    if (!Number.isNaN(numericPrice)) {
      return `₹ ${numericPrice.toFixed(2)}`;
    }

    return `₹ ${price}`;
  };

  const isTrue = (data) => {
    return (
      data === true ||
      data === "true" ||
      data === "TRUE" ||
      data === "Y" ||
      data === "y" ||
      data === 1 ||
      data === "1"
    );
  };
  /* =========================================================
     GET CATEGORIES
  ========================================================= */

  const getCategories = () => {
    if (!outletDetails) {
      return [];
    }

    if (Array.isArray(outletDetails.categories)) {
      return outletDetails.categories;
    }

    if (
      Array.isArray(
        outletDetails.data?.categories
      )
    ) {
      return outletDetails.data.categories;
    }

    if (
      Array.isArray(
        outletDetails.outletCategories
      )
    ) {
      return outletDetails.outletCategories;
    }

    if (
      Array.isArray(
        outletDetails.data?.outletCategories
      )
    ) {
      return outletDetails.data.outletCategories;
    }

    return [];
  };

  /* =========================================================
     GET CUISINES
  ========================================================= */

  const getCuisines = () => {
    if (!outletDetails) {
      return [];
    }

    if (
      Array.isArray(outletDetails.cuisineTypes)
    ) {
      return outletDetails.cuisineTypes;
    }

    if (
      Array.isArray(outletDetails.cuisines)
    ) {
      return outletDetails.cuisines;
    }

    if (
      Array.isArray(
        outletDetails.data?.cuisineTypes
      )
    ) {
      return outletDetails.data.cuisineTypes;
    }

    if (
      Array.isArray(
        outletDetails.data?.cuisines
      )
    ) {
      return outletDetails.data.cuisines;
    }

    return [];
  };

  /* =========================================================
     GET TIMINGS
  ========================================================= */

  const getOutletTimings = () => {
    if (!outletDetails) {
      return [];
    }

    if (
      Array.isArray(
        outletDetails.outletTimings
      )
    ) {
      return outletDetails.outletTimings;
    }

    if (
      Array.isArray(
        outletDetails.operatingDays
      )
    ) {
      return outletDetails.operatingDays;
    }

    if (
      Array.isArray(
        outletDetails.timings
      )
    ) {
      return outletDetails.timings;
    }

    if (
      Array.isArray(
        outletDetails.data?.outletTimings
      )
    ) {
      return outletDetails.data.outletTimings;
    }

    return [];
  };

  /* =========================================================
     NORMALIZE PRODUCTS
  ========================================================= */

  const getProducts = (category) => {
    if (!category) {
      return [];
    }

    if (Array.isArray(category.products)) {
      return category.products;
    }

    if (Array.isArray(category.foods)) {
      return category.foods;
    }

    if (
      Array.isArray(
        category.productList
      )
    ) {
      return category.productList;
    }

    return [];
  };

  /* =========================================================
     FILTER OUTLETS
  ========================================================= */

  const filteredOutlets = useMemo(() => {
    const searchValue = search
      .trim()
      .toLowerCase();

    if (!searchValue) {
      return outlets;
    }

    return outlets.filter((outlet) => {
      const name =
        outlet?.outletName ??
        outlet?.name ??
        "";

      const phone =
        outlet?.outletPhone ??
        outlet?.phone ??
        "";

      return (
        String(name)
          .toLowerCase()
          .includes(searchValue) ||
        String(phone)
          .toLowerCase()
          .includes(searchValue)
      );
    });
  }, [outlets, search]);

  const categories = getCategories();
  const cuisines = getCuisines();
  const outletTimings = getOutletTimings();

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="merchant-foods-container">

      {/* =====================================================
          OUTLET LIST
      ===================================================== */}

      {!selectedOutlet ? (
        <>
          <div className="merchant-foods-header">

            <div>
              <h2 className="merchant-foods-title">
                Food Management
              </h2>

              <p className="merchant-foods-subtitle">
                Select an outlet to manage complete
                outlet configuration, categories and
                foods.
              </p>
            </div>

            <div className="merchant-foods-search">

              <FaSearch />

              <input
                type="text"
                placeholder="Search outlet..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />

            </div>

          </div>

          <div className="merchant-foods-count">
            Total Outlets : {filteredOutlets.length}
          </div>

          {loading ? (
            <div className="merchant-foods-loading">
              Loading Outlets...
            </div>
          ) : filteredOutlets.length === 0 ? (
            <div className="merchant-foods-loading">
              No outlets found for this merchant.
            </div>
          ) : (
            <div className="merchant-foods-outlets-grid">

              {filteredOutlets.map((outlet, index) => {

                const outletId =
                  outlet?.outletId ??
                  outlet?.id ??
                  index;

                const outletName =
                  outlet?.outletName ??
                  outlet?.name;

                const cuisine =
                  outlet?.cuisineType ??
                  outlet?.cuisineName;

                const phone =
                  outlet?.outletPhone ??
                  outlet?.phone;

                const building =
                  outlet?.buildingNumber;

                const road =
                  outlet?.road;

                const landmark =
                  outlet?.landmark;

                const menuCount =
                  outlet?.menuItemCount ??
                  outlet?.menuItemsCount ??
                  outlet?.productCount ??
                  0;

                const active =
                  isTrue(outlet?.isActive) ||
                  outlet?.isActive === "Y";

                return (
                  <div
                    key={outletId}
                    className="merchant-foods-outlet-card"
                  >

                    <div className="merchant-foods-outlet-icon">
                      <FaStore />
                    </div>

                    <h3 className="merchant-foods-outlet-name">
                      {value(outletName)}
                    </h3>

                    <div className="merchant-foods-info-row">
                      <FaUtensils />

                      <span>
                        <strong>
                          Cuisine :
                        </strong>{" "}
                        {value(cuisine)}
                      </span>
                    </div>

                    <div className="merchant-foods-info-row">
                      <FaPhoneAlt />

                      <span>
                        {value(phone)}
                      </span>
                    </div>

                    <div className="merchant-foods-info-row">
                      <FaMapMarkerAlt />

                      <span>
                        {value(building)},{" "}
                        {value(road)},{" "}
                        {value(landmark)}
                      </span>
                    </div>

                    <div className="merchant-foods-menu-count">
                      Menu Items : {menuCount}
                    </div>

                    <span
                      className={`merchant-foods-status ${
                        active
                          ? "active"
                          : "inactive"
                      }`}
                    >
                      {active
                        ? "Active"
                        : "Inactive"}
                    </span>

                    <button
                      type="button"
                      className="merchant-foods-open-btn"
                      onClick={() =>
                        openOutletFoods(outlet)
                      }
                    >
                      Manage Foods
                      <FaArrowRight />
                    </button>

                  </div>
                );
              })}

            </div>
          )}
        </>
      ) : (

        <div className="merchant-foods-selected-outlet">

          {/* BACK */}

          <button
            type="button"
            className="merchant-foods-back-btn"
            onClick={handleBack}
          >
            <FaArrowLeft />
            Back To Outlets
          </button>

          {/* LOADING */}

          {detailsLoading ? (
            <div className="merchant-foods-loading">
              Loading Complete Outlet Details...
            </div>
          ) : !outletDetails ? (
            <div className="merchant-foods-loading">
              Unable to load outlet details.
            </div>
          ) : (
            <>

              {/* =================================================
                  HEADER
              ================================================= */}

              <div className="complete-outlet-header">

                <div>
                  <h2 className="merchant-foods-selected-title">
                    {value(
                      outletDetails?.outletName,
                      selectedOutlet?.outletName
                    )}
                  </h2>

                  <p>
                    Outlet ID :{" "}
                    <strong>
                      {value(
                        outletDetails?.outletId,
                        selectedOutlet?.outletId
                      )}
                    </strong>
                  </p>
                </div>

                <span
                  className={`merchant-foods-status ${
                    isTrue(
                      outletDetails?.isAvailable ??
                      outletDetails?.isToggle
                    )
                      ? "active"
                      : "inactive"
                  }`}
                >
                  {isTrue(
                    outletDetails?.isAvailable ??
                    outletDetails?.isToggle
                  )
                    ? "Available"
                    : "Unavailable"}
                </span>

              </div>


              {/* =================================================
                  OUTLET DETAILS
              ================================================= */}

              <div className="outlet-details-section">

                <div className="outlet-details-section-title">
                  <FaStore />

                  <h3>
                    Outlet Details
                  </h3>
                </div>

                <div className="outlet-details-grid">

                  <div className="outlet-detail-item">
                    <label>
                      Outlet Name
                    </label>

                    <span>
                      {value(
                        outletDetails?.outletName
                      )}
                    </span>
                  </div>

                  <div className="outlet-detail-item">
                    <label>
                      Outlet ID
                    </label>

                    <span>
                      {value(
                        outletDetails?.outletId
                      )}
                    </span>
                  </div>

                  <div className="outlet-detail-item">
                    <label>
                      Email
                    </label>

                    <span>
                      {value(
                        outletDetails?.outletEmail
                      )}
                    </span>
                  </div>

                  <div className="outlet-detail-item">
                    <label>
                      Phone
                    </label>

                    <span>
                      {value(
                        outletDetails?.outletPhone
                      )}
                    </span>
                  </div>

                  <div className="outlet-detail-item">
                    <label>
                      Alternate Phone
                    </label>

                    <span>
                      {value(
                        outletDetails?.alternateOutletPhone
                      )}
                    </span>
                  </div>

                  <div className="outlet-detail-item">
                    <label>
                      GST Applied
                    </label>

                    <span>
                      {isTrue(
                        outletDetails?.isGstApplied
                      )
                        ? "Yes"
                        : "No"}
                    </span>
                  </div>

                </div>

              </div>


              {/* =================================================
                  LOCATION
              ================================================= */}

              <div className="outlet-details-section">

                <div className="outlet-details-section-title">
                  <FaMapMarkerAlt />

                  <h3>
                    Location & Address
                  </h3>
                </div>

                <div className="outlet-details-grid">

                  <div className="outlet-detail-item">
                    <label>
                      Building Number
                    </label>

                    <span>
                      {value(
                        outletDetails?.buildingNumber
                      )}
                    </span>
                  </div>

                  <div className="outlet-detail-item">
                    <label>
                      Road
                    </label>

                    <span>
                      {value(
                        outletDetails?.road
                      )}
                    </span>
                  </div>

                  <div className="outlet-detail-item">
                    <label>
                      Landmark
                    </label>

                    <span>
                      {value(
                        outletDetails?.landmark
                      )}
                    </span>
                  </div>

                  <div className="outlet-detail-item">
                    <label>
                      Area
                    </label>

                    <span>
                      {value(
                        outletDetails?.areaName
                      )}
                    </span>
                  </div>

                  <div className="outlet-detail-item">
                    <label>
                      City
                    </label>

                    <span>
                      {value(
                        outletDetails?.cityName
                      )}
                    </span>
                  </div>

                  <div className="outlet-detail-item">
                    <label>
                      State
                    </label>

                    <span>
                      {value(
                        outletDetails?.stateName
                      )}
                    </span>
                  </div>

                  <div className="outlet-detail-item">
                    <label>
                      Latitude
                    </label>

                    <span>
                      {value(
                        outletDetails?.latitude
                      )}
                    </span>
                  </div>

                  <div className="outlet-detail-item">
                    <label>
                      Longitude
                    </label>

                    <span>
                      {value(
                        outletDetails?.longitude
                      )}
                    </span>
                  </div>

                </div>

              </div>


              {/* =================================================
                  BANK DETAILS
              ================================================= */}

              <div className="outlet-details-section">

                <div className="outlet-details-section-title">
                  <FaUniversity />

                  <h3>
                    Bank Details
                  </h3>
                </div>

                <div className="outlet-details-grid">

                  <div className="outlet-detail-item">
                    <label>
                      Account Holder
                    </label>

                    <span>
                      {value(
                        outletDetails?.accountHolderName
                      )}
                    </span>
                  </div>

                  <div className="outlet-detail-item">
                    <label>
                      Account Number
                    </label>

                    <span>
                      {value(
                        outletDetails?.accountNumber
                      )}
                    </span>
                  </div>

                  <div className="outlet-detail-item">
                    <label>
                      Bank Name
                    </label>

                    <span>
                      {value(
                        outletDetails?.bankName
                      )}
                    </span>
                  </div>

                  <div className="outlet-detail-item">
                    <label>
                      IFSC Code
                    </label>

                    <span>
                      {value(
                        outletDetails?.ifscCode
                      )}
                    </span>
                  </div>

                </div>

              </div>


              {/* =================================================
                  CUISINES
              ================================================= */}

              <div className="outlet-details-section">

                <div className="outlet-details-section-title">
                  <FaUtensils />

                  <h3>
                    Cuisine Types
                  </h3>
                </div>

                <div className="cuisine-list">

                  {cuisines.length === 0 ? (
                    <span>-</span>
                  ) : (
                    cuisines.map(
                      (cuisine, index) => (
                        <span
                          className="cuisine-badge"
                          key={
                            cuisine?.cuisineTypeId ??
                            cuisine?.id ??
                            index
                          }
                        >
                          {value(
                            cuisine?.cuisineTypeName ??
                            cuisine?.name ??
                            cuisine?.cuisineName
                          )}
                        </span>
                      )
                    )
                  )}

                </div>

              </div>


              {/* =================================================
                  OUTLET TIMINGS
              ================================================= */}

              <div className="outlet-details-section">

                <div className="outlet-details-section-title">
                  <FaClock />

                  <h3>
                    Outlet Timings
                  </h3>
                </div>

                {outletTimings.length === 0 ? (
                  <div className="empty-details">
                    No outlet timings found.
                  </div>
                ) : (
                  <div className="timings-table-wrapper">

                    <table className="timings-table">

                      <thead>
                        <tr>
                          <th>
                            Day
                          </th>

                          <th>
                            Status
                          </th>

                          <th>
                            Opening Time
                          </th>

                          <th>
                            Closing Time
                          </th>
                        </tr>
                      </thead>

                      <tbody>

                        {outletTimings.map(
                          (timing, index) => {

                            const isOpen =
                              isTrue(
                                timing?.isOpen ??
                                timing?.open ??
                                timing?.isAvailable
                              );

                            return (
                              <tr
                                key={
                                  timing?.timingId ??
                                  timing?.id ??
                                  index
                                }
                              >

                                <td>
                                  {value(
                                    timing?.day ??
                                    timing?.dayOfWeek ??
                                    timing?.dayName
                                  )}
                                </td>

                                <td>

                                  <span
                                    className={`merchant-foods-pill ${
                                      isOpen
                                        ? "available"
                                        : "unavailable"
                                    }`}
                                  >
                                    {isOpen
                                      ? "Open"
                                      : "Closed"}
                                  </span>

                                </td>

                                <td>
                                  {value(
                                    timing?.openingTime ??
                                    timing?.openTime ??
                                    timing?.startTime
                                  )}
                                </td>

                                <td>
                                  {value(
                                    timing?.closingTime ??
                                    timing?.closeTime ??
                                    timing?.endTime
                                  )}
                                </td>

                              </tr>
                            );
                          }
                        )}

                      </tbody>

                    </table>

                  </div>
                )}

              </div>


              {/* =================================================
                  CATEGORIES & PRODUCTS
                  ONE FLAT TABLE
              ================================================= */}

              <div
                style={{
                  width: "100%",
                  marginTop: "18px",
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "14px",
                  overflow: "hidden",
                  boxShadow: "0 6px 20px rgba(15, 23, 42, 0.05)",
                }}
              >

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    minHeight: "54px",
                    padding: "0 18px",
                    borderBottom: "1px solid #e5eaf1",
                  }}
                >
                  <div
                    style={{
                      width: "30px",
                      height: "30px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "8px",
                      background: "#eef3ff",
                      color: "#315eea",
                      fontSize: "12px",
                    }}
                  >
                    <FaLayerGroup />
                  </div>

                  <h3
                    style={{
                      margin: 0,
                      color: "#1e293b",
                      fontSize: "14px",
                      fontWeight: 750,
                    }}
                  >
                    Categories & Products
                  </h3>
                </div>

                {categories.length === 0 ? (

                  <div
                    style={{
                      padding: "35px 20px",
                      textAlign: "center",
                      color: "#94a3b8",
                      fontSize: "12px",
                    }}
                  >
                    No categories or products found.
                  </div>

                ) : (

                  <div
                    style={{
                      width: "100%",
                      overflowX: "auto",
                    }}
                  >

                    <table
                      style={{
                        width: "100%",
                        minWidth: "1050px",
                        borderCollapse: "collapse",
                        tableLayout: "fixed",
                      }}
                    >
                      <colgroup>
                        <col style={{ width: "25%" }} />
                        <col style={{ width: "30%" }} />
                        <col style={{ width: "25%" }} />
                        <col style={{ width: "20%" }} />
                      </colgroup>

                      <thead>

                        <tr
                          style={{
                            height: "44px",
                            background: "#f7f9fc",
                            borderBottom: "1px solid #dfe6ef",
                          }}
                        >

                          {[
                            "CATEGORY",
                            "FOOD",
                            "DESCRIPTION",
                            "MERCHANT PRICE",
                          ].map((heading) => (
                            <th
                              key={heading}
                              style={{
                                padding: "0 12px",
                                color: "#64748b",
                                fontSize: "9px",
                                fontWeight: 800,
                                textAlign:
                                  heading === "CATEGORY" ||
                                  heading === "FOOD" ||
                                  heading === "DESCRIPTION"
                                    ? "left"
                                    : "center",
                                whiteSpace: "nowrap",
                                letterSpacing: "0.35px",
                              }}
                            >
                              {heading}
                            </th>
                          ))}

                        </tr>

                      </thead>

                      <tbody>

                        {categories.flatMap(
                          (category, categoryIndex) => {

                            const categoryId =
                              category?.categoryId ??
                              category?.id ??
                              `category-${categoryIndex}`;

                            const categoryName =
                              category?.categoryName ??
                              category?.name ??
                              category?.categoryTypeName ??
                              "Unnamed Category";

                            const products =
                              getProducts(category);

                            /*
                             * If a category has products, the category
                             * cell uses rowSpan so the complete result
                             * remains ONE table.
                             */

                            const rows =
                              products.length > 0
                                ? products
                                : [null];

                            return rows.map(
                              (product, productIndex) => {

                                const productId =
                                  product?.productId ??
                                  product?.id ??
                                  `${categoryId}-product-${productIndex}`;
                                const productName =
                                  product?.productName ??
                                  product?.name ??
                                  product?.foodName ??
                                  "-";

                                const description =
                                  product?.description ??
                                  product?.foodDescription ??
                                  "-";

                                const productVeg = isTrue(
                                  product?.isVeg ??
                                  product?.veg ??
                                  product?.foodType === "VEG"
                                );

                                return (
                                  <Fragment
                                    key={`${categoryId}-${productId}`}
                                  >

                                    <tr
                                      style={{
                                        minHeight: "58px",
                                        borderBottom:
                                          "1px solid #edf1f5",
                                        background:
                                          product
                                            ? "#ffffff"
                                            : "#fbfcfe",
                                      }}
                                    >

                                      {/* CATEGORY */}

                                      {productIndex === 0 && (
                                        <td
                                          rowSpan={rows.length}
                                          style={{
                                            padding: "12px",
                                            verticalAlign: "top",
                                            borderRight:
                                              "1px solid #edf1f5",
                                            background: "#f9fbff",
                                          }}
                                        >

                                          <div
                                            style={{
                                              display: "flex",
                                              alignItems: "flex-start",
                                              gap: "9px",
                                            }}
                                          >

                                            <div
                                              style={{
                                                width: "30px",
                                                height: "30px",
                                                minWidth: "30px",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                borderRadius: "8px",
                                                background:
                                                  "linear-gradient(135deg, #315eea, #4f46e5)",
                                                color: "#ffffff",
                                                fontSize: "10px",
                                              }}
                                            >
                                              <FaUtensils />
                                            </div>

                                            <div>
                                              <div
                                                style={{
                                                  color: "#1e293b",
                                                  fontSize: "10px",
                                                  fontWeight: 750,
                                                  lineHeight: 1.4,
                                                }}
                                              >
                                                {categoryName}
                                              </div>

                                              <div
                                                style={{
                                                  marginTop: "4px",
                                                  color: "#94a3b8",
                                                  fontSize: "8px",
                                                }}
                                              >
                                                {products.length}{" "}
                                                {products.length === 1
                                                  ? "Product"
                                                  : "Products"}
                                              </div>
                                            </div>

                                          </div>

                                        </td>
                                      )}

                                      {/* FOOD */}

                                      <td
                                        style={{
                                          padding: "12px",
                                          color: "#1e293b",
                                          fontSize: "10px",
                                          fontWeight: product
                                            ? 700
                                            : 500,
                                          verticalAlign: "middle",
                                        }}
                                      >
                                        {product ? (
                                          <div
                                            style={{
                                              display: "flex",
                                              alignItems: "center",
                                              gap: "7px",
                                            }}
                                          >

                                            <span
                                              style={{
                                                width: "7px",
                                                height: "7px",
                                                minWidth: "7px",
                                                borderRadius: "50%",
                                                background: productVeg
                                                  ? "#16a34a"
                                                  : "#dc2626",
                                              }}
                                            />

                                            <span>
                                              {productName}
                                            </span>

                                          </div>
                                        ) : (
                                          <span
                                            style={{
                                              color: "#94a3b8",
                                              fontStyle: "italic",
                                            }}
                                          >
                                            No products
                                          </span>
                                        )}
                                      </td>

                                      {/* DESCRIPTION */}

                                      <td
                                        style={{
                                          padding: "12px",
                                          color: "#64748b",
                                          fontSize: "9px",
                                          verticalAlign: "middle",
                                          wordBreak: "break-word",
                                        }}
                                      >
                                        {product
                                          ? description
                                          : "-"}
                                      </td>

                                      {/* MERCHANT PRICE */}

                                      <td
                                        onClick={() =>
                                          product &&
                                          openMerchantPriceEditor(
                                            product,
                                            productId
                                          )
                                        }
                                        title={
                                          product
                                            ? "Click to edit merchant price"
                                            : ""
                                        }
                                        style={{
                                          padding: "12px 8px",
                                          textAlign: "center",
                                          color: "#334155",
                                          fontSize: "9px",
                                          fontWeight: 700,
                                          verticalAlign: "middle",
                                          cursor: product
                                            ? "pointer"
                                            : "default",
                                        }}
                                      >
                                        {product
                                          ? (
                                              <span
                                                style={{
                                                  display: "inline-flex",
                                                  alignItems: "center",
                                                  justifyContent: "center",
                                                  minWidth: "70px",
                                                  minHeight: "28px",
                                                  padding: "0 8px",
                                                  borderRadius: "7px",
                                                  border: "1px solid transparent",
                                                  transition: "all 0.15s ease",
                                                }}
                                                onMouseEnter={(event) => {
                                                  event.currentTarget.style.borderColor = "#cbd5e1";
                                                  event.currentTarget.style.background = "#f8fafc";
                                                }}
                                                onMouseLeave={(event) => {
                                                  event.currentTarget.style.borderColor = "transparent";
                                                  event.currentTarget.style.background = "transparent";
                                                }}
                                              >
                                                {formatPrice(
                                                  getMerchantPrice(
                                                    product,
                                                    productId
                                                  )
                                                )}
                                              </span>
                                            )
                                          : "-"}
                                      </td>


                                    </tr>

                                  </Fragment>
                                );
                              }
                            );
                          }
                        )}

                      </tbody>

                    </table>

                  </div>
                )}

              </div>

              {/* =================================================
                  MERCHANT PRICE EDIT POPUP
              ================================================= */}

              {editingMerchantPrice && (
                <div
                  onMouseDown={(event) => {
                    if (event.target === event.currentTarget) {
                      closeMerchantPriceEditor();
                    }
                  }}
                  style={{
                    position: "fixed",
                    inset: 0,
                    zIndex: 9999,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "20px",
                    background: "rgba(15, 23, 42, 0.42)",
                  }}
                >
                  <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="merchant-price-title"
                    onMouseDown={(event) => event.stopPropagation()}
                    style={{
                      width: "100%",
                      maxWidth: "400px",
                      background: "#ffffff",
                      borderRadius: "14px",
                      boxShadow: "0 20px 60px rgba(15, 23, 42, 0.22)",
                      border: "1px solid #e2e8f0",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "16px 18px",
                        borderBottom: "1px solid #e5eaf1",
                      }}
                    >
                      <div>
                        <h3
                          id="merchant-price-title"
                          style={{
                            margin: 0,
                            color: "#1e293b",
                            fontSize: "15px",
                            fontWeight: 750,
                          }}
                        >
                          Edit Merchant Price
                        </h3>
                        <div
                          style={{
                            marginTop: "4px",
                            color: "#64748b",
                            fontSize: "10px",
                          }}
                        >
                          {editingMerchantPrice.productName}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={closeMerchantPriceEditor}
                        aria-label="Close"
                        style={{
                          width: "30px",
                          height: "30px",
                          border: "1px solid #e2e8f0",
                          borderRadius: "7px",
                          background: "#ffffff",
                          color: "#64748b",
                          fontSize: "18px",
                          lineHeight: 1,
                          cursor: "pointer",
                        }}
                      >
                        ×
                      </button>
                    </div>

                    <div style={{ padding: "18px" }}>
                      <label
                        htmlFor="merchant-price-input"
                        style={{
                          display: "block",
                          marginBottom: "7px",
                          color: "#334155",
                          fontSize: "11px",
                          fontWeight: 700,
                        }}
                      >
                        Merchant Price
                      </label>

                      <div
                        style={{
                          position: "relative",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <span
                          style={{
                            position: "absolute",
                            left: "12px",
                            color: "#64748b",
                            fontSize: "13px",
                            fontWeight: 700,
                            pointerEvents: "none",
                          }}
                        >
                          ₹
                        </span>

                        <input
                          id="merchant-price-input"
                          type="number"
                          min="0"
                          step="0.01"
                          value={merchantPriceInput}
                          onChange={(event) => {
                            setMerchantPriceInput(event.target.value);
                            setMerchantPriceError("");
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              saveMerchantPrice();
                            }
                            if (event.key === "Escape") {
                              closeMerchantPriceEditor();
                            }
                          }}
                          autoFocus
                          style={{
                            width: "100%",
                            height: "42px",
                            boxSizing: "border-box",
                            padding: "0 12px 0 30px",
                            border: merchantPriceError
                              ? "1px solid #ef4444"
                              : "1px solid #cbd5e1",
                            borderRadius: "8px",
                            outline: "none",
                            color: "#1e293b",
                            fontSize: "13px",
                            fontWeight: 700,
                          }}
                        />
                      </div>

                      {merchantPriceError && (
                        <div
                          style={{
                            marginTop: "6px",
                            color: "#dc2626",
                            fontSize: "10px",
                          }}
                        >
                          {merchantPriceError}
                        </div>
                      )}

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "flex-end",
                          gap: "8px",
                          marginTop: "18px",
                        }}
                      >
                        <button
                          type="button"
                          onClick={closeMerchantPriceEditor}
                          style={{
                            height: "36px",
                            padding: "0 14px",
                            border: "1px solid #dbe4f1",
                            borderRadius: "8px",
                            background: "#ffffff",
                            color: "#475569",
                            fontSize: "11px",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          Cancel
                        </button>

                        <button
                          type="button"
                          onClick={saveMerchantPrice}
                          disabled={merchantPriceSaving}
                          style={{
                            height: "36px",
                            padding: "0 16px",
                            border: "0",
                            borderRadius: "8px",
                            background: merchantPriceSaving
                              ? "#94a3b8"
                              : "#315eea",
                            color: "#ffffff",
                            fontSize: "11px",
                            fontWeight: 700,
                            cursor: merchantPriceSaving
                              ? "not-allowed"
                              : "pointer",
                            opacity: merchantPriceSaving ? 0.8 : 1,
                          }}
                        >
                          {merchantPriceSaving
                            ? "Saving..."
                            : "Save Price"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </>
          )}

        </div>
      )}

    </div>
  );
};

export default Foods;