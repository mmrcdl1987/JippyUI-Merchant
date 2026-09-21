import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import "../../styles/OutletProfileDetails.css";

import {
  getAdminOutletDetails,
  getOutletStatusById,
  uploadOutletImage,
  createOutletUnavailability,
  restoreOutletAvailability,
  getOutletCategoryAvailability,
} from "../../services/outletService";
import {
  createCategory,
  getAllCategories,
} from "../../services/masterProductsService";

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
  FiX,
  FiLoader,
  FiCheckCircle,
  FiAlertCircle,
  FiFolderPlus,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";

const getOutletImageUrl = (outlet) =>
  outlet?.outletPicUrl ||
  outlet?.outletProfilePic ||
  outlet?.outletProfilePicUrl ||
  outlet?.profilePicUrl ||
  outlet?.imageUrl ||
  outlet?.outletImageUrl ||
  outlet?.image ||
  null;

const getProductVegStatus = (outlet) => {
  const products = (outlet?.categories || []).flatMap((category) =>
    Array.isArray(category?.products) ? category.products : []
  );
  const vegValues = products
    .filter((product) => product?.isVeg !== null && product?.isVeg !== undefined)
    .map((product) =>
      product.isVeg === true ||
      product.isVeg === 1 ||
      ["true", "1", "y", "yes"].includes(
        String(product.isVeg).trim().toLowerCase()
      )
    );

  return vegValues.length > 0 && vegValues.every(Boolean);
};

const isOutletActive = (outlet) =>
  outlet?.isActive === "Y" || outlet?.is_active === "Y";

const getEndOfDayDateTime = () => {
  const date = new Date();
  date.setHours(23, 59, 59, 0);
  return toLocalDateTime(date);
};

const toLocalDateTime = (date) => {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
    date.getSeconds()
  )}`;
};



/* ============================================================
   INLINE CATEGORIES COMPONENT
   ============================================================ */

function OutletCategories({ categories = [] }) {
  const [expandedCategoryId, setExpandedCategoryId] = useState(null);
  const [savingCategoryId, setSavingCategoryId] = useState(null);
  const [categoryToggleState, setCategoryToggleState] = useState({});

  const getCategoryId = (category) =>
    category?.categoryId ?? category?.category_id ?? category?.id;

  const getOutletCategoryId = (category) => {
    const visited = new Set();
    const outletCategoryKeys = new Set([
      "outletcategoryid",
      "outletcategoriesid",
      "outlet_category_id",
      "outlet_categories_id",
      "outletcategorymappingid",
      "outlet_category_mapping_id",
    ]);

    const findId = (value) => {
      if (!value || typeof value !== "object" || visited.has(value)) {
        return null;
      }
      visited.add(value);

      for (const [key, item] of Object.entries(value)) {
        const normalizedKey = key.replace(/[-\s]/g, "").toLowerCase();
        if (outletCategoryKeys.has(normalizedKey)) {
          const numericId = Number(item);
          if (Number.isInteger(numericId) && numericId > 0) {
            return numericId;
          }
        }
        if (
          (normalizedKey === "outletcategory" ||
            normalizedKey === "outletcategorymapping") &&
          item &&
          typeof item === "object"
        ) {
          const nestedObjectId = Number(item.id);
          if (Number.isInteger(nestedObjectId) && nestedObjectId > 0) {
            return nestedObjectId;
          }
        }
      }

      for (const item of Object.values(value)) {
        const nestedId = findId(item);
        if (nestedId) return nestedId;
      }

      return null;
    };

    return findId(category);
  };

  const isCategoryEnabled = (category) => {
    const categoryId = getCategoryId(category);
    if (Object.prototype.hasOwnProperty.call(categoryToggleState, categoryId)) {
      return categoryToggleState[categoryId];
    }

    const value = category?.isToggle ?? category?.is_toggle;
    if (value !== undefined && value !== null) {
      return value === true || value === "true" || value === "Y" || value === 1;
    }
    return category?.isAvailable !== false;
  };

  useEffect(() => {
    let mounted = true;

    const loadAvailability = async () => {
      const entries = await Promise.all(
        categories.map(async (category) => {
          const categoryId = getCategoryId(category);
          const outletCategoryId = Number(getOutletCategoryId(category));
          if (!categoryId || !outletCategoryId) return null;

          try {
            const response = await getOutletCategoryAvailability(
              outletCategoryId
            );
            const data = response?.data ?? response;
            return [categoryId, data?.available === true];
          } catch (error) {
            console.error(
              `Failed to load availability for outlet category ${outletCategoryId}:`,
              error
            );
            return null;
          }
        })
      );

      if (!mounted) return;

      setCategoryToggleState(
        Object.fromEntries(entries.filter(Boolean))
      );
    };

    if (categories.length > 0) {
      loadAvailability();
    } else {
      setCategoryToggleState({});
    }

    return () => {
      mounted = false;
    };
  }, [categories]);

  const handleCategoryToggle = async (category) => {
    const categoryId = getCategoryId(category);
    const outletCategoryId = Number(getOutletCategoryId(category));
    if (!categoryId || !outletCategoryId || savingCategoryId !== null) return;

    const enabled = isCategoryEnabled(category);
    setSavingCategoryId(categoryId);

    try {
      let availabilityResponse;
      if (enabled) {
        await createOutletUnavailability({
          type: "OUTLET_CATEGORY",
          unavailabilityId: outletCategoryId,
          unavailabilityFromDate: toLocalDateTime(new Date()),
          unavailabilityToDate: getEndOfDayDateTime(),
          reason: "Disabled from UI",
        });
      } else {
        await restoreOutletAvailability({
          type: "OUTLET_CATEGORY",
          unavailabilityId: outletCategoryId,
        });
      }

      availabilityResponse = await getOutletCategoryAvailability(
        outletCategoryId
      );
      const availabilityData =
        availabilityResponse?.data ?? availabilityResponse;
      setCategoryToggleState((previous) => ({
        ...previous,
        [categoryId]: availabilityData?.available === true,
      }));
    } catch (error) {
      console.error("Failed to toggle outlet category:", error);
      alert(
        error?.response?.data?.message ||
          "Failed to update category availability."
      );
    } finally {
      setSavingCategoryId(null);
    }
  };

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
            <th className="category-toggle-column">Toggle</th>
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

            const isToggle = isCategoryEnabled(category);
            const isAvailable = isToggle;
            const outletCategoryId = Number(getOutletCategoryId(category));
            const categoryId =
              category?.categoryId ?? category?.id ?? index;
            const isExpanded = String(expandedCategoryId) === String(categoryId);

            return (
              <React.Fragment key={categoryId}>
                <tr>
                <td className="category-number-column">
                  {index + 1}
                </td>

                <td className="category-name-column">
                  <button
                    type="button"
                    className="jippy-category-expand-button"
                    onClick={() =>
                      setExpandedCategoryId(isExpanded ? null : categoryId)
                    }
                  >
                    {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                    <strong>{categoryName}</strong>
                  </button>
                </td>

                <td className="category-products-column">
                  <button
                    type="button"
                    className="jippy-category-food-count"
                    onClick={() =>
                      setExpandedCategoryId(isExpanded ? null : categoryId)
                    }
                  >
                    {productCount} foods
                  </button>
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

                <td className="category-toggle-column">
                  <button
                    type="button"
                    className={`jippy-outlet-category-toggle ${
                      isToggle
                        ? "jippy-outlet-category-toggle-on"
                        : "jippy-outlet-category-toggle-off"
                    }`}
                    onClick={() => handleCategoryToggle(category)}
                    disabled={
                      savingCategoryId === categoryId ||
                      !outletCategoryId
                    }
                    aria-label={isToggle ? "Disable category" : "Enable category"}
                    title={
                      !outletCategoryId
                        ? "Outlet category mapping ID is unavailable"
                        : savingCategoryId === categoryId
                        ? "Updating category availability"
                        : isToggle
                        ? "Category enabled"
                        : "Category disabled"
                    }
                  >
                    {savingCategoryId === categoryId ? (
                      <FiLoader className="jippy-outlet-category-toggle-loader" />
                    ) : (
                      <span />
                    )}
                  </button>
                </td>
                </tr>
                {isExpanded && (
                  <tr className="jippy-category-foods-row">
                    <td colSpan="5">
                      {products.length > 0 ? (
                        <div className="jippy-category-food-list">
                          {products.map((product, productIndex) => {
                            const isVeg =
                              product?.isVeg === true ||
                              product?.isVeg === 1 ||
                              ["true", "1", "y", "yes"].includes(
                                String(product?.isVeg).trim().toLowerCase()
                              );
                            return (
                              <div
                                className="jippy-category-food-item"
                                key={product?.productId ?? productIndex}
                              >
                                <span
                                  className={`jippy-food-veg-icon ${
                                    isVeg
                                      ? "jippy-food-veg"
                                      : "jippy-food-nonveg"
                                  }`}
                                  title={isVeg ? "Vegetarian" : "Non-vegetarian"}
                                  aria-label={isVeg ? "Vegetarian" : "Non-vegetarian"}
                                >
                                </span>
                                <span>
                                  {product?.productName ||
                                    product?.name ||
                                    `Food ${productIndex + 1}`}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="jippy-category-no-foods">
                          No foods available in this category.
                        </span>
                      )}
                    </td>
                  </tr>
                )}
              </React.Fragment>
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
  const [uploadingImage, setUploadingImage] = useState(false);

  const [coordinateLocation, setCoordinateLocation] =
    useState("");

  // Create Category state
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [masterCategories, setMasterCategories] = useState([]);
  const [loadingMasterCategories, setLoadingMasterCategories] = useState(false);
  const [selectedMasterCatId, setSelectedMasterCatId] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [createCategoryError, setCreateCategoryError] = useState("");
  const [createCategorySuccess, setCreateCategorySuccess] = useState("");

  const fetchMasterCategories = async () => {
    try {
      setLoadingMasterCategories(true);
      const res = await getAllCategories("ALL");
      const list = res.data?.data || res.data || [];
      setMasterCategories(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Failed to fetch master categories:", err);
    } finally {
      setLoadingMasterCategories(false);
    }
  };

  const openCreateCategoryModal = () => {
    setCreateCategoryError("");
    setCreateCategorySuccess("");
    setNewCategoryName("");
    setSelectedMasterCatId("");
    setShowCreateCategoryModal(true);
    fetchMasterCategories();
  };

  const handleCreateCategory = async (e) => {
    if (e) e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      setCreateCategoryError("Please enter or select a category name.");
      return;
    }

    try {
      setCreatingCategory(true);
      setCreateCategoryError("");
      const res = await createCategory(trimmed);
      console.log("Create category response:", res);

      setCreateCategorySuccess(`Category "${trimmed}" created successfully!`);

      // Refresh outlet details and master categories
      const id = getCurrentOutletId();
      if (id) {
        const refreshed = await getAdminOutletDetails(id);
        const data = refreshed?.data?.data || refreshed?.data || refreshed;
        setOutlet(data);
      }
      await fetchMasterCategories();

      setTimeout(() => {
        setCreateCategorySuccess("");
        setShowCreateCategoryModal(false);
        setNewCategoryName("");
        setSelectedMasterCatId("");
      }, 1000);
    } catch (err) {
      console.error("Error creating category:", err);
      setCreateCategoryError(
        err?.response?.data?.message || err?.message || "Failed to create category. Please try again."
      );
    } finally {
      setCreatingCategory(false);
    }
  };


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
              details?.outletCategories ??
              storedOutlet?.categories ??
              storedOutlet?.outletCategories ??
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

        try {
          const statusResponse = await getOutletStatusById(outletId);
          const statusData =
            statusResponse?.data?.data ??
            statusResponse?.data ??
            statusResponse;
          details = {
            ...details,
            isActive:
              statusData?.isActive ?? statusData?.is_active ?? details.isActive,
            isToggle:
              statusData?.isToggle ?? statusData?.is_toggle ?? details.isToggle,
            isApproved:
              statusData?.isApproved ??
              statusData?.is_approved ??
              details.isApproved,
          };
        } catch (statusError) {
          console.error("Failed to fetch outlet active status:", statusError);
        }

        setOutlet({
          ...details,
          isVegOutlet: getProductVegStatus(details),
        });


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

  const handleOutletImageChange = async (event) => {
    const imageFile = event.target.files?.[0];
    event.target.value = "";

    if (!imageFile) {
      return;
    }

    if (!imageFile.type.startsWith("image/")) {
      setErrorMessage("Please select a valid image file.");
      return;
    }

    const outletId = getCurrentOutletId();
    if (!outletId) {
      setErrorMessage("Outlet ID not found.");
      return;
    }

    try {
      setUploadingImage(true);
      setErrorMessage("");

      const response = await uploadOutletImage(outletId, imageFile);
      const responseData =
        response?.data?.data ||
        response?.data ||
        response;
      const outletPicUrl =
        responseData?.outletPicUrl ||
        responseData?.outlet?.outletPicUrl;

      if (!outletPicUrl) {
        throw new Error("Image uploaded, but no image URL was returned.");
      }

      setOutlet((previousOutlet) => {
        const updatedOutlet = {
          ...previousOutlet,
          outletPicUrl,
        };
        sessionStorage.setItem(
          "selectedOutlet",
          JSON.stringify(updatedOutlet)
        );
        return updatedOutlet;
      });
    } catch (error) {
      console.error("Failed to upload outlet image:", error);
      setErrorMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to upload outlet image."
      );
    } finally {
      setUploadingImage(false);
    }
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
      <div className={`jippy-outlet-profile-page ${
        isOutletActive(outlet) ? "" : "jippy-outlet-profile-inactive"
      }`}>

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

            <label
              className={`jippy-outlet-profile-title-image ${
                uploadingImage ? "jippy-outlet-profile-title-image-disabled" : ""
              }`}
              title="Replace outlet image"
            >
              {getOutletImageUrl(outlet) && (
                <img
                  src={getOutletImageUrl(outlet)}
                  alt=""
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                    event.currentTarget.nextElementSibling.style.display = "flex";
                  }}
                />
              )}
              <span
                className="jippy-outlet-profile-title-image-placeholder"
                style={{
                  display: getOutletImageUrl(outlet) ? "none" : "flex",
                }}
              >
                {(outlet?.outletName || "O").charAt(0).toUpperCase()}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleOutletImageChange}
                disabled={uploadingImage}
              />
            </label>

            <h1>
              {displayValue(
                outlet?.outletName,
                "Outlet Profile"
              )}
            </h1>

          </div>

          {outlet.isApproved !== true && (
            <div className="jippy-outlet-profile-approval-notice">
              Outlet has not approved yet
            </div>
          )}

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
                    isOutletActive(outlet)
                      ? "jippy-status-success"
                      : "jippy-status-danger"
                  }
                >
                  {isOutletActive(outlet) ? "Active" : "Inactive"}
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

              {/* <div>
                <span>
                  Email
                </span>

                <strong>
                  {displayValue(
                    outlet?.outletEmail
                  )}
                </strong>
              </div> */}


              {/* PHONE */}

              {/* <div>
                <span>
                  Phone
                </span>

                <strong>
                  {displayValue(
                    outlet?.outletPhone
                  )}
                </strong>
              </div> */}


              {/* ALTERNATE PHONE */}

              {/* <div>
                <span>
                  Alternate Phone
                </span>

                <strong>
                  {displayValue(
                    outlet?.alternateOutletPhone
                  )}
                </strong>
              </div> */}


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

              {/* <div>
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
              </div> */}


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


             {/* <div>
                  <span>
                    City
                  </span>

                  <strong>
                    {displayValue(
                      outlet?.cityName
                    )}
                  </strong>
                </div> */}

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


                {/* <div>
                  <span>
                    Area ID
                  </span>

                  <strong>
                    {displayValue(
                      outlet?.areaId
                    )}
                  </strong>
                </div> */}


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


                {/* <div>
                  <span>
                    City ID
                  </span>

                  <strong>
                    {displayValue(
                      outlet?.cityId
                    )}
                  </strong>
                </div> */}


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


                {/* <div>
                  <span>
                    State ID
                  </span>

                  <strong>
                    {displayValue(
                      outlet?.stateId
                    )}
                  </strong>
                </div> */}


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

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <FiShoppingBag />
              <span>Outlet Categories</span>
            </div>
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

      {/* ======================================================
          CREATE CATEGORY MODAL
          ====================================================== */}
      {showCreateCategoryModal && (
        <div
          className="jippy-profile-modal-backdrop"
          onClick={() => !creatingCategory && setShowCreateCategoryModal(false)}
        >
          <div
            className="jippy-profile-create-cat-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="jippy-profile-cat-modal-header">
              <div className="jippy-profile-cat-modal-title">
                <FiFolderPlus className="jippy-profile-cat-modal-icon" />
                <h3>Create New Category</h3>
              </div>
              <button
                type="button"
                className="jippy-profile-cat-modal-close"
                onClick={() => setShowCreateCategoryModal(false)}
                disabled={creatingCategory}
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleCreateCategory}>
              <div className="jippy-profile-cat-modal-body">
                {createCategoryError && (
                  <div className="jippy-profile-cat-alert-error">
                    <FiAlertCircle />
                    <span>{createCategoryError}</span>
                  </div>
                )}
                {createCategorySuccess && (
                  <div className="jippy-profile-cat-alert-success">
                    <FiCheckCircle />
                    <span>{createCategorySuccess}</span>
                  </div>
                )}

                {/* Dropdown to pick existing categories from getAllCategories */}
                <div className="jippy-profile-cat-form-group">
                  <label>Select from Existing Categories</label>
                  <select
                    className="jippy-profile-cat-input"
                    value={selectedMasterCatId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedMasterCatId(val);
                      if (val) {
                        const matched = masterCategories.find(
                          (c) => String(c.id || c.categoryId) === String(val)
                        );
                        if (matched) {
                          setNewCategoryName(matched.categoryName || matched.name || "");
                        }
                      }
                    }}
                    disabled={creatingCategory || loadingMasterCategories}
                  >
                    <option value="">
                      {loadingMasterCategories
                        ? "Loading categories from getAllCategories..."
                        : "-- Choose an existing Category or type below --"}
                    </option>
                    {masterCategories.map((cat) => (
                      <option
                        key={cat.id || cat.categoryId}
                        value={cat.id || cat.categoryId}
                      >
                        {cat.categoryName || cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="jippy-profile-cat-form-group">
                  <label>
                    Category Name <span className="jippy-required">*</span>
                  </label>
                  <input
                    type="text"
                    className="jippy-profile-cat-input"
                    placeholder="e.g. Beverages, Starters, Desserts"
                    value={newCategoryName}
                    onChange={(e) => {
                      setNewCategoryName(e.target.value);
                      setSelectedMasterCatId("");
                    }}
                    autoFocus
                    disabled={creatingCategory}
                  />
                  <small className="jippy-profile-cat-hint">
                    Select an existing category from above or enter a new category name.
                  </small>
                </div>
              </div>

              <div className="jippy-profile-cat-modal-footer">
                <button
                  type="button"
                  className="jippy-profile-cat-btn-cancel"
                  onClick={() => setShowCreateCategoryModal(false)}
                  disabled={creatingCategory}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="jippy-profile-cat-btn-submit"
                  disabled={creatingCategory || !newCategoryName.trim()}
                >
                  {creatingCategory ? (
                    <>
                      <FiLoader className="jippy-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <FiPlus />
                      <span>Create Category</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default OutletProfileDetails;