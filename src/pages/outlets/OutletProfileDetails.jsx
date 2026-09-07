import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import "../../styles/OutletProfileDetails.css";

import {
  getAdminOutletDetails,
} from "../../services/outletService";

import OutletFoods from "./OutletFoods";

import {
  FiHome,
  FiArrowLeft,
  FiPlus,
  FiMapPin,
  FiCreditCard,
  FiClock,
  FiShoppingBag,
  FiStar,
  FiUser,
} from "react-icons/fi";



/* ============================================================
   INLINE CATEGORIES COMPONENT
   ============================================================ */

function OutletCategories({ categories = [] }) {
  if (!Array.isArray(categories) || categories.length === 0) {
    return (
      <div className="jippy-outlet-profile-empty-tab">
        <FiShoppingBag />
        <h3>No Categories Found</h3>
        <p>No categories are available for this outlet.</p>
      </div>
    );
  }

  return (
    <div className="jippy-outlet-profile-category-table-wrapper">
      <table className="jippy-outlet-profile-category-table">
        <thead>
          <tr>
            <th className="category-number-column">#</th>
            <th>Category</th>
            <th className="category-products-column">Products</th>
            <th className="category-status-column">Availability</th>
          </tr>
        </thead>

        <tbody>
          {categories.map((category, index) => {
            const products = Array.isArray(category?.products)
              ? category.products
              : [];

            const categoryName =
              category?.categoryName ??
              category?.name ??
              category?.category ??
              category?.categoryId ??
              `Category ${index + 1}`;

            const productCount =
              category?.productCount ??
              category?.productsCount ??
              category?.totalProducts ??
              products.length;

            const isAvailable =
              category?.isAvailable !== false;

            return (
              <tr
                key={
                  category?.categoryId ??
                  category?.id ??
                  index
                }
              >
                <td className="category-number-column">
                  {index + 1}
                </td>

                <td className="category-name-column">
                  <strong>{categoryName}</strong>
                </td>

                <td className="category-products-column">
                  {productCount}
                </td>

                <td className="category-status-column">
                  <span
                    className={
                      isAvailable
                        ? "jippy-category-status-available"
                        : "jippy-category-status-unavailable"
                    }
                  >
                    {isAvailable
                      ? "Available"
                      : "Unavailable"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ============================================================
   INLINE SUBSCRIPTION HISTORY COMPONENT
   ============================================================ */

function OutletSubscriptionHistory({ outlet }) {
  const history =
    outlet?.subscriptionHistory ||
    outlet?.subscriptions ||
    outlet?.subscriptionHistories ||
    [];

  if (!Array.isArray(history) || history.length === 0) {
    return (
      <div className="jippy-outlet-subscription-empty">
        No subscription history available.
      </div>
    );
  }

  return (
    <div className="jippy-outlet-subscription-wrapper">
      {history.map((item, index) => (
        <div
          className="jippy-subscription-history-item"
          key={item?.subscriptionId ?? item?.id ?? index}
        >
          <div className="jippy-subscription-history-title">
            Subscription {index + 1}
          </div>

          <div className="jippy-subscription-summary">
            <div>
              <span>Plan</span>
              <strong>
                {item?.planName ?? item?.subscriptionName ?? item?.plan ?? "-"}
              </strong>
            </div>
            <div>
              <span>Status</span>
              <strong>
                {item?.status ?? item?.subscriptionStatus ?? "-"}
              </strong>
            </div>
            <div>
              <span>Start Date</span>
              <strong>
                {item?.startDate ?? item?.subscriptionStartDate ?? "-"}
              </strong>
            </div>
            <div>
              <span>End Date</span>
              <strong>
                {item?.endDate ?? item?.subscriptionEndDate ?? "-"}
              </strong>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function OutletProfileDetails({ setActivePage }) {
  /* ============================================================
     ROUTE PARAMETER
     ============================================================ */

  const { outletId: routeOutletId } = useParams();


  /* ============================================================
     STATE
     ============================================================ */

  const [outlet, setOutlet] = useState(null);

  const [activeTab, setActiveTab] = useState("Basic");

  const [loading, setLoading] = useState(true);

  const [errorMessage, setErrorMessage] = useState("");

  const [coordinateLocation, setCoordinateLocation] =
    useState("");


  /* ============================================================
     GET CURRENT OUTLET ID
     
     Priority:
     1. URL /outlets/view/:outletId
     2. sessionStorage selectedOutlet
     ============================================================ */

  const getCurrentOutletId = () => {
    // URL ID has highest priority.
    if (routeOutletId) {
      return routeOutletId;
    }

    // Backward-compatible sessionStorage fallback.
    try {
      const storedOutlet =
        sessionStorage.getItem("selectedOutlet");

      if (!storedOutlet) {
        return null;
      }

      const selectedOutlet =
        JSON.parse(storedOutlet);

      return (
        selectedOutlet?.outletId ||
        selectedOutlet?.id ||
        null
      );
    } catch (error) {
      console.error(
        "Failed to read selectedOutlet:",
        error
      );

      return null;
    }
  };


  /* ============================================================
     REVERSE GEOCODING
     ============================================================ */

  useEffect(() => {
    const getCoordinateLocation = async () => {
      if (
        outlet?.latitude == null ||
        outlet?.longitude == null
      ) {
        setCoordinateLocation("");
        return;
      }

      try {
        const apiKey =
          import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

        if (!apiKey) {
          console.warn(
            "VITE_GOOGLE_MAPS_API_KEY is not configured."
          );

          setCoordinateLocation("");
          return;
        }

        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${outlet.latitude},${outlet.longitude}&key=${apiKey}`
        );

        const data = await response.json();

        console.log(
          "REVERSE GEOCODING RESPONSE:",
          data
        );

        if (
          data.status === "OK" &&
          data.results?.length > 0
        ) {
          setCoordinateLocation(
            data.results[0].formatted_address
          );
        } else {
          setCoordinateLocation("");

          console.warn(
            "Reverse geocoding failed:",
            data.status
          );
        }
      } catch (error) {
        console.error(
          "Failed to get location from coordinates:",
          error
        );

        setCoordinateLocation("");
      }
    };

    getCoordinateLocation();
  }, [
    outlet?.latitude,
    outlet?.longitude,
  ]);


  /* ============================================================
     LOAD OUTLET DETAILS
     
     MAIN API:
     
     GET /api/fm/outlets/admin/outlet-details
     
     ?outletId={outletId}
     ============================================================ */

  useEffect(() => {
    const loadOutletData = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const outletId =
          getCurrentOutletId();

        if (!outletId) {
          setErrorMessage(
            "Outlet ID not found."
          );

          setOutlet(null);
          return;
        }

        console.log(
          "========================================"
        );

        console.log(
          "LOADING OUTLET PROFILE"
        );

        console.log(
          "Outlet ID:",
          outletId
        );

        console.log(
          "========================================"
        );


        /* ======================================================
           READ SESSION STORAGE
           ====================================================== */

        let storedOutlet = null;

        try {
          const stored =
            sessionStorage.getItem(
              "selectedOutlet"
            );

          if (stored) {
            storedOutlet =
              JSON.parse(stored);
          }
        } catch (storageError) {
          console.warn(
            "Unable to read selectedOutlet:",
            storageError
          );

          storedOutlet = null;
        }


        /* ======================================================
           ADMIN COMPLETE OUTLET DETAILS API
           
           /api/fm/outlets/admin/outlet-details
           
           This is the API you showed in Swagger.
           ====================================================== */

        let details = null;

        try {
          console.log(
            "Calling ADMIN OUTLET DETAILS API..."
          );

          console.log(
            "Outlet ID:",
            outletId
          );

          const adminResponse =
            await getAdminOutletDetails(
              outletId
            );

          console.log(
            "ADMIN OUTLET DETAILS RESPONSE:",
            adminResponse
          );


          /* ----------------------------------------------------
             Support possible response formats:

             response
             response.data
             response.outlet
             response.outletDetails
             ---------------------------------------------------- */

          details =
            adminResponse?.data?.data ??
            adminResponse?.data ??
            adminResponse?.outletDetails ??
            adminResponse?.outlet ??
            adminResponse ??
            null;


          /* ----------------------------------------------------
             Handle success:false
             ---------------------------------------------------- */

          if (
            details &&
            details.success === false
          ) {
            console.warn(
              "Admin API returned success:false:",
              details.message
            );

            details = null;
          }

        } catch (adminError) {
          console.error(
            "ADMIN OUTLET DETAILS API FAILED:",
            adminError
          );

          console.error(
            "Admin API status:",
            adminError?.response?.status
          );

          console.error(
            "Admin API response:",
            adminError?.response?.data
          );

          throw adminError;
        }


        /* ======================================================
           MERGE SESSION DATA IF AVAILABLE
           
           This helps preserve fields if the list API contains
           something that the Admin response does not contain.
           ====================================================== */

        if (storedOutlet) {
          details = {
            ...storedOutlet,
            ...(details || {}),

            outletId:
              details?.outletId ??
              storedOutlet?.outletId ??
              storedOutlet?.id ??
              outletId,

            categories:
              details?.categories ??
              storedOutlet?.categories ??
              [],
          };
        }


        /* ======================================================
           NO DETAILS
           ====================================================== */

        if (!details) {
          setErrorMessage(
            "No outlet details found."
          );

          setOutlet(null);
          return;
        }


        /* ======================================================
           SET ADMIN OUTLET DETAILS
           ====================================================== */

        console.log(
          "FINAL OUTLET DETAILS:",
          details
        );

        setOutlet(details);


      } catch (error) {
        console.error(
          "FAILED TO LOAD OUTLET DETAILS:",
          error
        );

        setErrorMessage(
          error?.response?.data?.message ||
          error?.message ||
          "Failed to load outlet details."
        );

        setOutlet(null);

      } finally {
        setLoading(false);
      }
    };


    loadOutletData();

  }, [routeOutletId]);


  /* ============================================================
     BACK BUTTON
     ============================================================ */

  const handleBack = () => {
    if (setActivePage) {
      setActivePage(
        "allOutletsList"
      );
      return;
    }

    window.history.back();
  };


  /* ============================================================
     FORMAT TIME
     ============================================================ */

  const formatTime = (time) => {
    if (!time) {
      return "-";
    }

    return String(time).substring(
      0,
      5
    );
  };


  /* ============================================================
     FORMAT DATE
     ============================================================ */

  const formatDate = (value) => {
    if (!value) {
      return "-";
    }

    try {
      const date =
        new Date(value);

      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        return String(value);
      }

      return date.toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      );
    } catch {
      return String(value);
    }
  };


  /* ============================================================
     DISPLAY VALUE
     ============================================================ */

  const displayValue = (
    value,
    fallback = "-"
  ) => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return fallback;
    }

    if (
      typeof value === "boolean"
    ) {
      return value
        ? "Yes"
        : "No";
    }

    return String(value);
  };


  /* ============================================================
     CUISINE
     ============================================================ */

  const getCuisine = () => {
    if (
      Array.isArray(
        outlet?.cuisineTypes
      )
    ) {
      const cuisine =
        outlet.cuisineTypes
          .map((item) => {
            if (
              typeof item === "string"
            ) {
              return item;
            }

            return (
              item?.cuisineTypeName ??
              item?.cuisineType ??
              item?.name ??
              item?.cuisineTypeId ??
              null
            );
          })
          .filter(Boolean)
          .join(", ");

      return cuisine || "-";
    }


    if (
      Array.isArray(
        outlet?.cuisineType
      )
    ) {
      return (
        outlet.cuisineType.join(
          ", "
        ) || "-"
      );
    }


    return (
      outlet?.cuisineType ||
      "-"
    );
  };


  /* ============================================================
     TOTAL PRODUCTS
     ============================================================ */

  const getProductsCount = () => {
    if (
      !Array.isArray(
        outlet?.categories
      )
    ) {
      return 0;
    }

    return outlet.categories.reduce(
      (total, category) => {
        const products =
          Array.isArray(
            category?.products
          )
            ? category.products.length
            : 0;

        return total + products;
      },
      0
    );
  };


  /* ============================================================
     TOTAL CATEGORIES
     ============================================================ */

  const getCategoriesCount = () => {
    if (
      !Array.isArray(
        outlet?.categories
      )
    ) {
      return 0;
    }

    return outlet.categories.length;
  };


  /* ============================================================
     ACTIVE PRODUCTS
     ============================================================ */

  const getActiveProductsCount = () => {
    if (
      !Array.isArray(
        outlet?.categories
      )
    ) {
      return 0;
    }

    return outlet.categories.reduce(
      (total, category) => {
        if (
          !Array.isArray(
            category?.products
          )
        ) {
          return total;
        }

        const active =
          category.products.filter(
            (product) =>
              product?.isAvailable === true
          ).length;

        return total + active;
      },
      0
    );
  };


  /* ============================================================
     FULL ADDRESS
     ============================================================ */

  const getFullAddress = () => {
    const addressParts = [
      outlet?.buildingNumber,
      outlet?.road,
      outlet?.landmark,
      outlet?.areaName,
      outlet?.cityName,
      outlet?.stateName,
    ].filter(Boolean);

    if (
      addressParts.length === 0
    ) {
      return "-";
    }

    return addressParts.join(
      ", "
    );
  };


  /* ============================================================
     WORKING DAYS
     ============================================================ */

  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];


  /* ============================================================
     FIND TIMING
     ============================================================ */

  const getTimingForDay = (day) => {
    if (
      !Array.isArray(
        outlet?.outletTimings
      )
    ) {
      return null;
    }

    return outlet.outletTimings.find(
      (timing) =>
        String(
          timing?.day
        ).toLowerCase() ===
        day.toLowerCase()
    );
  };


  /* ============================================================
     GOOGLE MAP URL
     ============================================================ */

  const getMapUrl = () => {
    if (
      outlet?.latitude == null ||
      outlet?.longitude == null
    ) {
      return null;
    }

    return (
      `https://www.google.com/maps?q=` +
      `${outlet.latitude},${outlet.longitude}` +
      `&z=15&output=embed`
    );
  };


  /* ============================================================
     TABS
     ============================================================ */

  const tabs = [
    "Basic",
    "Categories",
    "Foods",
    "Orders",
    "Promos",
    "Payouts",
    "Subscription History",
  ];


  /* ============================================================
     LOADING
     ============================================================ */

  if (loading) {
    return (
      <div className="jippy-outlet-profile-page">

        <div className="jippy-outlet-profile-loading">

          <FiHome />

          <span>
            Loading outlet details...
          </span>

        </div>

      </div>
    );
  }


  /* ============================================================
     ERROR / EMPTY
     ============================================================ */

  if (!outlet) {
    return (
      <div className="jippy-outlet-profile-page">

        <div className="jippy-outlet-profile-empty-tab">

          <FiHome />

          <h3>
            Outlet Details Not Found
          </h3>

          <p>
            {errorMessage ||
              "Unable to load outlet information."}
          </p>

          <button
            className="jippy-outlet-profile-back-btn"
            onClick={handleBack}
          >
            <FiArrowLeft />

            Back to Outlets
          </button>

        </div>

      </div>
    );
  }


  /* ============================================================
     MAIN UI
     ============================================================ */

  return (
    <div className="jippy-outlet-profile-page">

      {/* ======================================================
          HEADER
          ====================================================== */}

      <div className="jippy-outlet-profile-header">

        <div className="jippy-outlet-profile-header-left">

          <div className="jippy-outlet-profile-title-row">

            <FiHome />

            <h1>
              {displayValue(
                outlet?.outletName,
                "Outlet Profile"
              )}
            </h1>

          </div>

          <div className="jippy-outlet-profile-breadcrumb">

            <span>
              Outlets
            </span>

            <span>
              /
            </span>

            <strong>
              {displayValue(
                outlet?.outletName
              )}
            </strong>

          </div>

        </div>


        <button
          className="jippy-outlet-profile-orange-btn"
          onClick={handleBack}
        >
          <FiArrowLeft />

          Back to Outlets
        </button>

      </div>


      {/* ======================================================
          TABS
          ====================================================== */}

      <div className="jippy-outlet-profile-tabs">

        {tabs.map((tab) => (
          <button
            key={tab}
            className={`jippy-outlet-profile-tab ${
              activeTab === tab
                ? "jippy-outlet-profile-tab-active"
                : ""
            }`}
            onClick={() =>
              setActiveTab(tab)
            }
          >
            {tab}
          </button>
        ))}

      </div>


      {/* ======================================================
          BASIC TAB
          ====================================================== */}

      {activeTab === "Basic" && (
        <>

          {/* ==================================================
              SUMMARY CARDS
              ================================================== */}

          <div className="jippy-outlet-profile-summary-grid">

            {/* PRODUCTS */}

            <div className="jippy-outlet-profile-summary-card jippy-summary-blue">

              <div className="jippy-summary-content">

                <strong>
                  {getProductsCount()}
                </strong>

                <span>
                  Total Foods
                </span>

              </div>

              <div className="jippy-summary-icon">
                <FiShoppingBag />
              </div>

            </div>


            {/* CATEGORIES */}

            <div className="jippy-outlet-profile-summary-card jippy-summary-green">

              <div className="jippy-summary-content">

                <strong>
                  {getCategoriesCount()}
                </strong>

                <span>
                  Categories
                </span>

              </div>

              <div className="jippy-summary-icon">
                <FiPlus />
              </div>

            </div>


            {/* AVAILABLE */}

            <div className="jippy-outlet-profile-summary-card jippy-summary-pink">

              <div className="jippy-summary-content">

                <strong>
                  {getActiveProductsCount()}
                </strong>

                <span>
                  Available Foods
                </span>

              </div>

              <div className="jippy-summary-icon">
                <FiStar />
              </div>

            </div>


            {/* STATUS */}

            <div className="jippy-outlet-profile-summary-card jippy-summary-yellow">

              <div className="jippy-summary-content">

                <strong
                  className={
                    outlet?.isAvailable === false
                      ? "jippy-status-danger"
                      : "jippy-status-success"
                  }
                >
                  {outlet?.isAvailable === false
                    ? "Closed"
                    : "Open"}
                </strong>

                <span>
                  Outlet Status
                </span>

              </div>

              <div className="jippy-summary-icon">
                <FiClock />
              </div>

            </div>

          </div>


          {/* ==================================================
              OUTLET INFORMATION
              ================================================== */}

          <div className="jippy-outlet-profile-main-card">

            <div className="jippy-outlet-profile-card-heading">

              <FiHome />

              <span>
                Outlet Information
              </span>

            </div>


            <div className="jippy-outlet-profile-details-grid">

              {/* OUTLET ID */}

              <div>
                <span>
                  Outlet ID
                </span>

                <strong>
                  {displayValue(
                    outlet?.outletId
                  )}
                </strong>
              </div>


              {/* OUTLET NAME */}

              <div>
                <span>
                  Outlet Name
                </span>

                <strong>
                  {displayValue(
                    outlet?.outletName
                  )}
                </strong>
              </div>


              {/* EMAIL */}

              <div>
                <span>
                  Email
                </span>

                <strong>
                  {displayValue(
                    outlet?.outletEmail
                  )}
                </strong>
              </div>


              {/* PHONE */}

              <div>
                <span>
                  Phone
                </span>

                <strong>
                  {displayValue(
                    outlet?.outletPhone
                  )}
                </strong>
              </div>


              {/* ALTERNATE PHONE */}

              <div>
                <span>
                  Alternate Phone
                </span>

                <strong>
                  {displayValue(
                    outlet?.alternateOutletPhone
                  )}
                </strong>
              </div>


              {/* CUISINE */}

              <div>
                <span>
                  Cuisine Types
                </span>

                <strong>
                  {getCuisine()}
                </strong>
              </div>


              {/* FAVOURITE */}

              <div>
                <span>
                  Favourite
                </span>

                <strong
                  className={
                    outlet?.isFavourite === true
                      ? "jippy-status-success"
                      : "jippy-status-neutral"
                  }
                >
                  {outlet?.isFavourite === true
                    ? "Yes"
                    : "No"}
                </strong>
              </div>


              {/* AVAILABILITY */}

              <div>
                <span>
                  Availability
                </span>

                <strong
                  className={
                    outlet?.isAvailable === false
                      ? "jippy-status-danger"
                      : "jippy-status-success"
                  }
                >
                  {outlet?.isAvailable === false
                    ? "Unavailable"
                    : "Available"}
                </strong>
              </div>


              {/* ADDRESS */}

              <div className="jippy-outlet-profile-address-full">

                <span>
                  Full Address
                </span>

                <strong>
                  {getFullAddress()}
                </strong>

              </div>

            </div>

          </div>


          {/* ==================================================
              CONTACT DETAILS
              ================================================== */}

          <div className="jippy-outlet-profile-main-card">

            <div className="jippy-outlet-profile-card-heading">

              <FiUser />

              <span>
                Contact & Account Details
              </span>

            </div>


            <div className="jippy-outlet-profile-details-grid">

              <div>
                <span>
                  Email
                </span>

                <strong>
                  {displayValue(
                    outlet?.outletEmail
                  )}
                </strong>
              </div>


              <div>
                <span>
                  Phone Number
                </span>

                <strong>
                  {displayValue(
                    outlet?.outletPhone
                  )}
                </strong>
              </div>


              <div>
                <span>
                  Alternate Phone
                </span>

                <strong>
                  {displayValue(
                    outlet?.alternateOutletPhone
                  )}
                </strong>
              </div>


              <div>
                <span>
                  Account Number
                </span>

                <strong>
                  {displayValue(
                    outlet?.accountNumber
                  )}
                </strong>
              </div>


              <div>
                <span>
                  Account Holder
                </span>

                <strong>
                  {displayValue(
                    outlet?.accountHolderName
                  )}
                </strong>
              </div>


              <div>
                <span>
                  Bank Name
                </span>

                <strong>
                  {displayValue(
                    outlet?.bankName
                  )}
                </strong>
              </div>


              <div>
                <span>
                  IFSC Code
                </span>

                <strong>
                  {displayValue(
                    outlet?.ifscCode
                  )}
                </strong>
              </div>


              <div>
                <span>
                  City ID
                </span>

                <strong>
                  {displayValue(
                    outlet?.cityId
                  )}
                </strong>
              </div>

            </div>

          </div>


          {/* ==================================================
              LOCATION + MAP
              ================================================== */}

          <div className="jippy-outlet-profile-location-layout">

            {/* LOCATION */}

            <div className="jippy-outlet-profile-main-card jippy-location-details-card">

              <div className="jippy-outlet-profile-card-heading">

                <FiMapPin />

                <span>
                  Location Details
                </span>

              </div>


              <div className="jippy-outlet-profile-details-grid">

                <div>
                  <span>
                    Building Number
                  </span>

                  <strong>
                    {displayValue(
                      outlet?.buildingNumber
                    )}
                  </strong>
                </div>


                <div>
                  <span>
                    Road
                  </span>

                  <strong>
                    {displayValue(
                      outlet?.road
                    )}
                  </strong>
                </div>


                <div>
                  <span>
                    Landmark
                  </span>

                  <strong>
                    {displayValue(
                      outlet?.landmark
                    )}
                  </strong>
                </div>


                <div>
                  <span>
                    Area
                  </span>

                  <strong>
                    {displayValue(
                      outlet?.areaName
                    )}
                  </strong>
                </div>


                <div>
                  <span>
                    Area ID
                  </span>

                  <strong>
                    {displayValue(
                      outlet?.areaId
                    )}
                  </strong>
                </div>


                <div>
                  <span>
                    City
                  </span>

                  <strong>
                    {displayValue(
                      outlet?.cityName
                    )}
                  </strong>
                </div>


                <div>
                  <span>
                    City ID
                  </span>

                  <strong>
                    {displayValue(
                      outlet?.cityId
                    )}
                  </strong>
                </div>


                <div>
                  <span>
                    State
                  </span>

                  <strong>
                    {displayValue(
                      outlet?.stateName
                    )}
                  </strong>
                </div>


                <div>
                  <span>
                    State ID
                  </span>

                  <strong>
                    {displayValue(
                      outlet?.stateId
                    )}
                  </strong>
                </div>


                <div>
                  <span>
                    Latitude
                  </span>

                  <strong>
                    {displayValue(
                      outlet?.latitude
                    )}
                  </strong>
                </div>


                <div>
                  <span>
                    Longitude
                  </span>

                  <strong>
                    {displayValue(
                      outlet?.longitude
                    )}
                  </strong>
                </div>

              </div>

            </div>


            {/* MAP */}

            <div className="jippy-outlet-profile-map-card">

              <div className="jippy-outlet-profile-map-header">

                <span>
                  Location Map
                </span>

                {coordinateLocation ? (
                  <span className="jippy-outlet-profile-map-location">
                    <FiMapPin />

                    {coordinateLocation}
                  </span>
                ) : null}

              </div>


              <div className="jippy-outlet-profile-map">

                {getMapUrl() ? (

                  <iframe
                    title="Outlet Location"
                    src={getMapUrl()}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                  />

                ) : (

                  <div className="jippy-outlet-profile-map-empty">

                    <FiMapPin />

                    <span>
                      Location coordinates
                      are not available
                    </span>

                  </div>

                )}

              </div>

            </div>

          </div>


          {/* ==================================================
              WORKING HOURS
              ================================================== */}

          <div className="jippy-outlet-profile-main-card">

            <div className="jippy-outlet-profile-card-heading">

              <FiClock />

              <span>
                Working Hours
              </span>

            </div>


            <div className="jippy-outlet-profile-hours-grid">

              {days.map((day) => {
                const timing =
                  getTimingForDay(day);

                return (
                  <div key={day}>

                    <strong>
                      {day}
                    </strong>

                    {timing ? (

                      <span
                        className={
                          timing?.isOpen === false
                            ? "jippy-status-danger"
                            : "jippy-status-success"
                        }
                      >

                        {timing?.isOpen === false
                          ? "Closed"
                          : `${formatTime(
                              timing?.openingTime
                            )} - ${formatTime(
                              timing?.closingTime
                            )}`}

                      </span>

                    ) : (

                      <span>
                        Not configured
                      </span>

                    )}

                  </div>
                );
              })}

            </div>

          </div>

        </>
      )}


      {/* ======================================================
          CATEGORIES TAB
          ====================================================== */}

      {activeTab === "Categories" && (
        <div className="jippy-outlet-profile-main-card">

          <div className="jippy-outlet-profile-card-heading">

            <FiShoppingBag />

            <span>
              Outlet Categories
            </span>

          </div>


          <OutletCategories
            categories={
              Array.isArray(
                outlet?.categories
              )
                ? outlet.categories
                : []
            }
            outlet={outlet}
          />

        </div>
      )}


      {/* ======================================================
          FOODS TAB
          ====================================================== */}

      {activeTab === "Foods" && (
        <div className="jippy-outlet-profile-main-card">

          <div className="jippy-outlet-profile-card-heading">

            <FiShoppingBag />

            <span>
              Outlet Foods
            </span>

          </div>


          <OutletFoods
            categories={
              Array.isArray(
                outlet?.categories
              )
                ? outlet.categories
                : []
            }
            outlet={outlet}
          />

        </div>
      )}


      {/* ======================================================
          ORDERS TAB
          ====================================================== */}

      {activeTab === "Orders" && (
        <div className="jippy-outlet-profile-empty-tab">

          <FiShoppingBag />

          <h3>
            Orders
          </h3>

          <p>
            Order information will be
            displayed here.
          </p>

        </div>
      )}


      {/* ======================================================
          PROMOS TAB
          ====================================================== */}

      {activeTab === "Promos" && (
        <div className="jippy-outlet-profile-empty-tab">

          <FiStar />

          <h3>
            Promotions
          </h3>

          <p>
            Promotion information will be
            displayed here.
          </p>

        </div>
      )}


      {/* ======================================================
          PAYOUTS TAB
          ====================================================== */}

      {activeTab === "Payouts" && (
        <div className="jippy-outlet-profile-empty-tab">

          <FiCreditCard />

          <h3>
            Payouts
          </h3>

          <p>
            Payout information will be
            displayed here.
          </p>

        </div>
      )}


      {/* ======================================================
          SUBSCRIPTION HISTORY
          ====================================================== */}

      {activeTab === "Subscription History" && (
        <div className="jippy-outlet-profile-main-card">

          <div className="jippy-outlet-profile-card-heading">

            <FiCreditCard />

            <span>
              Subscription History
            </span>

          </div>


          <OutletSubscriptionHistory
            outletId={
              outlet?.outletId ||
              getCurrentOutletId()
            }
            outlet={outlet}
          />

        </div>
      )}


      {/* ======================================================
          BOTTOM ACTIONS
          ====================================================== */}

      <div className="jippy-outlet-profile-bottom-actions">
      </div>

    </div>
  );
}


export default OutletProfileDetails;