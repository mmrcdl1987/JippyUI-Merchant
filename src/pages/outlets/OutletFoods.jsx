import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

// Update the import path below to match your actual styles folder location:
// - Use "../styles/OutletFoods.css" if styles is located at src/pages/styles/
// - Use "../../styles/OutletFoods.css" if styles is located at src/styles/
import "../../styles/OutletFoods.css";

import { getAdminOutletDetails } from "../../services/outletService";
import { getProductDetailById } from "../../services/productDetailService";
import AddToOutletProducts from "./AddToOutletProducts";

/* =========================================================
   FOOD AVAILABILITY HELPERS
   =========================================================
   outletService.js currently does not export the old
   setProductUnavailable / restoreProductUnavailable methods.
   Keep the UI working by persisting the availability action
   locally until the backend availability endpoints are added.
*/
const setProductUnavailable = async (productId, fromDate, toDate, reason) => {
  if (!productId) throw new Error("Product ID is required.");
  return {
    productId,
    fromDate,
    toDate,
    reason,
    timestamp: new Date().toISOString(),
  };
};

const restoreProductUnavailable = async (productId, reason = "stock restored") => {
  if (!productId) throw new Error("Product ID is required.");
  return {
    productId,
    reason,
    timestamp: new Date().toISOString(),
  };
};

import {
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiShoppingBag,
  FiLayers,
  FiX,
  FiEdit2,
} from "react-icons/fi";

function OutletFoods({
  outlet: outletFromParent,
  categories: categoriesFromParent,
  setActivePage,
}) {
  // ============================================================
  // STATE
  // ============================================================

  const [selectedFood, setSelectedFood] = useState(null);

  const [foodAvailabilityMode, setFoodAvailabilityMode] =
    useState("create");

  const [foodAvailabilityModal, setFoodAvailabilityModal] =
    useState(false);

  const [foodUnavailabilityForm, setFoodUnavailabilityForm] =
    useState({
      fromDate: "",
      toDate: "",
      reason: "",
    });

  const [savingFoodAvailability, setSavingFoodAvailability] =
    useState(false);

  const [foodUnavailabilityData, setFoodUnavailabilityData] =
    useState({});

  const [expandedFoodId, setExpandedFoodId] = useState(null);

  const [outlet, setOutlet] = useState(
    outletFromParent || null
  );

  const [loading, setLoading] = useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [foodSearch, setFoodSearch] =
    useState("");

  const [foodEntries, setFoodEntries] =
    useState(10);

  const [foodPage, setFoodPage] =
    useState(1);

  // P/PV toggle: false = P (all products), true = PV (products with variants)
  const [isPvToggle, setIsPvToggle] = useState(false);

  const [variantProduct, setVariantProduct] = useState(null);
  const [variantLoading, setVariantLoading] = useState(false);
  const [variantError, setVariantError] = useState("");
  const [foodForVariants, setFoodForVariants] = useState(null);
  const [preparingVariantForm, setPreparingVariantForm] = useState(false);

  // ============================================================
  // GET SELECTED OUTLET ID
  // ============================================================

  const getCurrentOutletId = () => {
    try {
      const storedOutlet =
        sessionStorage.getItem(
          "selectedOutlet"
        );

      if (!storedOutlet) {
        console.error(
          "No selectedOutlet found in sessionStorage"
        );

        return null;
      }

      const selectedOutlet =
        JSON.parse(storedOutlet);

      const outletId =
        selectedOutlet?.outletId ??
        selectedOutlet?.id;

      console.log(
        "OutletFoods - Selected Outlet:",
        selectedOutlet
      );

      console.log(
        "OutletFoods - Outlet ID:",
        outletId
      );

      return outletId
        ? Number(outletId)
        : null;
    } catch (error) {
      console.error(
        "Failed to read selected outlet:",
        error
      );

      return null;
    }
  };

  // ============================================================
  // LOAD OUTLET DETAILS + FOODS
  // ============================================================

  useEffect(() => {
    const loadFoods = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const outletId =
          Number(
            outletFromParent?.outletId ??
              getCurrentOutletId()
          ) || getCurrentOutletId();

        if (!outletId) {
          setErrorMessage(
            "Outlet ID not found. Please select an outlet again."
          );

          return;
        }

        console.log(
          "=========================================="
        );

        console.log(
          "OutletFoods - Fetching food details"
        );

        console.log(
          "Outlet ID:",
          outletId
        );

        console.log(
          "User Type: merchant"
        );

        console.log(
          "Endpoint:",
          "/api/fm/outlets/admin/outlet-details"
        );

        console.log(
          "=========================================="
        );

        const response =
          await getAdminOutletDetails(
            outletId,
            "merchant"
          );

        console.log(
          "OutletFoods - Complete API Response:",
          response
        );

        if (!response) {
          setErrorMessage(
            "No outlet data received from server."
          );

          return;
        }

        // ============================================================
        // RESTORE SAVED FOOD UNAVAILABILITY AFTER REFRESH
        // ============================================================

        const savedFoodUnavailability =
          JSON.parse(
            localStorage.getItem(
              "jippy_food_unavailability"
            ) || "{}"
          );

        setFoodUnavailabilityData(
          savedFoodUnavailability
        );

        const restoredResponse = {
          ...response,

          categories:
            response.categories?.map(
              (category) => ({
                ...category,

                products:
                  category.products?.map(
                    (product) => {
                      const saved =
                        savedFoodUnavailability[
                          product?.productId
                        ];

                      if (saved) {
                        return {
                          ...product,
                          isToggle: false,
                        };
                      }

                      return product;
                    }
                  ),
              })
            ),
        };

        setOutlet(
          restoredResponse
        );

      } catch (error) {
        console.error(
          "OutletFoods - Failed to load foods:",
          error
        );

        const status =
          error?.response?.status;

        if (status === 401) {
          setErrorMessage(
            "Unauthorized. Please login again."
          );
        } else if (status === 404) {
          setErrorMessage(
            "Outlet details were not found."
          );
        } else {
          setErrorMessage(
            "Failed to load outlet foods."
          );
        }
      } finally {
        setLoading(false);
      }
    };

    loadFoods();
  }, [
    outletFromParent?.outletId,
  ]);

  // ============================================================
  // FOOD AVAILABILITY TOGGLE
  // ============================================================

  const handleFoodAvailabilityToggle = (food) => {
    if (!food?.productId) {
      return;
    }

    // ON → OFF
    if (isTrue(food?.isToggle)) {
      setSelectedFood(food);

      setFoodAvailabilityMode("create");

      setFoodUnavailabilityForm({
        fromDate: "",
        toDate: "",
        reason: "",
      });

      setFoodAvailabilityModal(true);

      return;
    }

    // OFF → ON
    setSelectedFood(food);

    setFoodAvailabilityMode("restore");

    setFoodAvailabilityModal(true);
  };

  // ============================================================
  // CONFIRM FOOD RESTORE
  // OFF → ON
  // ============================================================

  const handleConfirmFoodRestore = async () => {
    if (!selectedFood?.productId) {
      return;
    }

    try {
      setSavingFoodAvailability(true);

      console.log(
        "RESTORING FOOD:",
        selectedFood.productId
      );

      const response = await restoreProductUnavailable(
        selectedFood.productId,
        "stock restored"
      );

      console.log(
        "FOOD RESTORE RESPONSE:",
        response
      );

      setOutlet((previous) => ({
        ...previous,

        categories:
          previous.categories?.map(
            (category) => ({
              ...category,

              products:
                category.products?.map(
                  (product) =>
                    Number(product.productId) ===
                    Number(selectedFood.productId)
                      ? {
                          ...product,
                          isToggle: true,
                        }
                      : product
                ),
            })
          ),
      }));

      setFoodUnavailabilityData(
        (previous) => {
          const updated = {
            ...previous,
          };

          delete updated[
            selectedFood.productId
          ];

          localStorage.setItem(
            "jippy_food_unavailability",
            JSON.stringify(updated)
          );

          return updated;
        }
      );

      setFoodAvailabilityModal(false);

      setSelectedFood(null);

      setExpandedFoodId(null);

    } catch (error) {
      console.error(
        "Failed to restore food availability:",
        error
      );

      alert(
        error?.response?.data?.message ||
          "Failed to restore food availability."
      );
    } finally {
      setSavingFoodAvailability(false);
    }
  };

  // ============================================================
  // CONFIRM FOOD UNAVAILABILITY
  // ============================================================

  const handleConfirmFoodUnavailability =
    async () => {
      if (!selectedFood?.productId) return;

      const {
        fromDate,
        toDate,
        reason,
      } = foodUnavailabilityForm;

      if (
        !fromDate ||
        !toDate ||
        !reason.trim()
      ) {
        alert(
          "Please select From Date, To Date and Reason."
        );

        return;
      }

      if (
        new Date(toDate) <=
        new Date(fromDate)
      ) {
        alert(
          "To Date & Time must be after From Date & Time."
        );

        return;
      }

      try {
        setSavingFoodAvailability(
          true
        );

        const response =
          await setProductUnavailable(
            selectedFood.productId,
            fromDate,
            toDate,
            reason.trim()
          );

        console.log(
          "PRODUCT UNAVAILABILITY RESPONSE:",
          response
        );

        const newUnavailability = {
          productId:
            selectedFood.productId,

          fromDate,

          toDate,

          reason:
            reason.trim(),

          markedOn:
            response?.timestamp ||
            new Date().toISOString(),
        };

        setFoodUnavailabilityData(
          (previous) => {
            const updated = {
              ...previous,

              [selectedFood.productId]:
                newUnavailability,
            };

            localStorage.setItem(
              "jippy_food_unavailability",
              JSON.stringify(
                updated
              )
            );

            return updated;
          }
        );

        setOutlet((previous) => ({
          ...previous,

          categories:
            previous.categories?.map(
              (category) => ({
                ...category,

                products:
                  category.products?.map(
                    (product) =>
                      Number(
                        product.productId
                      ) ===
                      Number(
                        selectedFood.productId
                      )
                        ? {
                            ...product,
                            isToggle:
                              false,
                          }
                        : product
                  ),
              })
            ),
        }));

        setExpandedFoodId(
          Number(
            selectedFood.productId
          )
        );

        setFoodAvailabilityModal(
          false
        );

        setSelectedFood(null);

      } catch (error) {
        console.error(
          "Failed to mark food unavailable:",
          error
        );

        alert(
          error?.response?.data
            ?.message ||
            "Failed to mark food unavailable."
        );
      } finally {
        setSavingFoodAvailability(
          false
        );
      }
    };

  // ============================================================
  // FLATTEN CATEGORIES -> PRODUCTS
  // ============================================================

  const allFoods = useMemo(() => {
    if (!outlet) {
      return [];
    }

    const categories =
      Array.isArray(
        outlet.categories
      )
        ? outlet.categories
        : Array.isArray(
            categoriesFromParent
          )
        ? categoriesFromParent
        : [];

    if (categories.length === 0) {
      return [];
    }

    return categories.flatMap(
      (category) => {
        const products =
          Array.isArray(
            category?.products
          )
            ? category.products
            : [];

        return products.map(
          (product) => ({
            ...product,

            categoryId:
              product?.categoryId ??
              category?.categoryId ??
              null,

            categoryName:
              product?.categoryName ??
              category?.categoryName ??
              "-",

            outletCategoryId:
              product?.outletCategoryId ??
              category?.outletCategoryId ??
              null,
          })
        );
      }
    );
  }, [
    outlet,
    categoriesFromParent,
  ]);

  // ============================================================
  // SEARCH / FILTER
  // ============================================================

  const filteredFoods = useMemo(() => {
    let result = allFoods;

    if (isPvToggle) {
      result = result.filter(
        (food) =>
          food?.hasProductVariants === true ||
          food?.hasProductVariants === "true" ||
          (Array.isArray(food?.variants) && food.variants.length > 0)
      );
    }

    const search =
      foodSearch
        .trim()
        .toLowerCase();

    if (!search) {
      return result;
    }

    return result.filter(
      (food) => {
        const productId =
          String(
            food?.productId ?? ""
          ).toLowerCase();

        const productName =
          String(
            food?.productName ?? ""
          ).toLowerCase();

        const description =
          String(
            food?.description ?? ""
          ).toLowerCase();

        const categoryName =
          String(
            food?.categoryName ?? ""
          ).toLowerCase();

        return (
          productId.includes(
            search
          ) ||
          productName.includes(
            search
          ) ||
          description.includes(
            search
          ) ||
          categoryName.includes(
            search
          )
        );
      }
    );
  }, [
    allFoods,
    foodSearch,
    isPvToggle,
  ]);

  // ============================================================
  // PAGINATION
  // ============================================================

  const totalFoods =
    filteredFoods.length;

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        totalFoods /
          foodEntries
      )
    );

  const safePage =
    Math.min(
      foodPage,
      totalPages
    );

  const startIndex =
    (safePage - 1) *
    foodEntries;

  const displayedFoods =
    filteredFoods.slice(
      startIndex,
      startIndex +
        foodEntries
    );

  // ============================================================
  // RESET PAGE
  // ============================================================

  useEffect(() => {
    setFoodPage(1);
  }, [
    foodSearch,
    foodEntries,
    isPvToggle,
  ]);

  // ============================================================
  // FORMAT PRICE
  // ============================================================

  const formatPrice = (
    value
  ) => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "-";
    }

    const number =
      Number(value);

    if (
      Number.isNaN(number)
    ) {
      return String(value);
    }

    return `₹${number.toFixed(
      2
    )}`;
  };

  // ============================================================
  // FORMAT TIME
  // ============================================================

  const formatTime = (
    time
  ) => {
    if (!time) {
      return "-";
    }

    return String(time)
      .substring(0, 5);
  };

  // ============================================================
  // BOOLEAN FORMAT
  // ============================================================

  const isTrue = (
    value
  ) => {
    return (
      value === true ||
      value === "true" ||
      value === "TRUE" ||
      value === "Y" ||
      value === "Yes" ||
      value === 1
    );
  };

  // ============================================================
  // PRODUCT TIMINGS
  // ============================================================

  const renderProductTimings = (
    productTimings
  ) => {
    if (
      !Array.isArray(
        productTimings
      ) ||
      productTimings.length === 0
    ) {
      return (
        <span className="jippy-outlet-foods-no-timing">
          No timings
        </span>
      );
    }

    return (
      <div className="jippy-outlet-foods-timings">
        {productTimings.map(
          (
            timing,
            index
          ) => (
            <div
              key={`${timing?.day || "day"}-${index}`}
              className="jippy-outlet-foods-timing-row"
            >
              <strong>
                {timing?.day ||
                  "-"}
              </strong>

              <span>
                {formatTime(
                  timing?.startTime
                )}
                {" - "}
                {formatTime(
                  timing?.endTime
                )}
              </span>
            </div>
          )
        )}
      </div>
    );
  };

  // ============================================================
  // VARIANTS
  // ============================================================

  const renderVariants = (
    food
  ) => {
    const variants =
      Array.isArray(
        food?.variants
      )
        ? food.variants
        : [];
  };

  const handleViewVariants = async (food) => {
    const productId = Number(food?.productId ?? food?.id);
    if (!productId) {
      setVariantError("This food item does not have a valid product ID.");
      return;
    }

    setVariantProduct(null);
    setVariantError("");
    setVariantLoading(true);

    try {
      const response = await getProductDetailById(productId);
      const product = response?.data ?? response;
      setVariantProduct(product);
    } catch (error) {
      setVariantError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to load product variants."
      );
    } finally {
      setVariantLoading(false);
    }
  };

  const handleAddVariants = async (food) => {
    const productId = Number(food?.productId ?? food?.id);
    if (!productId) {
      setVariantError("This food item does not have a valid product ID.");
      return;
    }

    setPreparingVariantForm(true);
    setVariantError("");
    try {
      const response = await getProductDetailById(productId);
      const detail = response?.data ?? response ?? {};
      setFoodForVariants({
        ...food,
        ...detail,
        masterProductId:
          detail.masterProductId ??
          food.masterProductId ??
          food.master_product_id ??
          productId,
        productName: detail.productName ?? food.productName,
        categoryId: detail.categoryId ?? food.categoryId,
        timings: detail.timings ?? food.productTimings ?? [],
        variantGroups: detail.variantGroups ?? food.variantGroups ?? [],
      });
    } catch (error) {
      setVariantError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to load this food item for variant mapping."
      );
    } finally {
      setPreparingVariantForm(false);
    }
  };

  // ============================================================
  // BACK
  // ============================================================

  const handleBack = () => {
    if (setActivePage) {
      setActivePage(
        "allOutletsList"
      );
    }
  };

  // ============================================================
  // PREVIOUS PAGE
  // ============================================================

  const handlePrevious = () => {
    setFoodPage(
      (previous) =>
        Math.max(
          1,
          previous - 1
        )
    );
  };

  // ============================================================
  // NEXT PAGE
  // ============================================================

  const handleNext = () => {
    setFoodPage(
      (previous) =>
        Math.min(
          totalPages,
          previous + 1
        )
    );
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="jippy-outlet-foods-page">
        <div className="jippy-outlet-foods-loading">
          <div className="jippy-outlet-foods-loader" />
          <p>Loading foods...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // ERROR
  // ============================================================

  if (errorMessage) {
    return (
      <div className="jippy-outlet-foods-page">
        <div className="jippy-outlet-foods-error">
          <h3>Unable to load foods</h3>
          <p>{errorMessage}</p>
          <button
            type="button"
            onClick={handleBack}
            className="jippy-outlet-foods-back-btn"
          >
            <FiChevronLeft />
            Back to Outlets
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="jippy-outlet-foods-page">
      {/* PAGE HEADER */}
      <div className="jippy-outlet-foods-page-header">
        <div>
          <h2>Foods</h2>
          <p>Food items available in this outlet</p>
        </div>

        {/* P/PV TOGGLE + FOOD COUNT */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                fontSize: "12px",
                fontWeight: "600",
                color: "#555",
              }}
            >
              P/PV
            </span>

            <label
              style={{
                position: "relative",
                display: "inline-block",
                width: "36px",
                height: "20px",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={isPvToggle}
                onChange={() => setIsPvToggle((previous) => !previous)}
                style={{
                  opacity: 0,
                  width: 0,
                  height: 0,
                }}
              />

              <span
                style={{
                  position: "absolute",
                  cursor: "pointer",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: isPvToggle ? "#ff5722" : "#ccc",
                  transition: ".4s",
                  borderRadius: "20px",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    height: "14px",
                    width: "14px",
                    left: "3px",
                    bottom: "3px",
                    backgroundColor: "white",
                    transition: ".4s",
                    borderRadius: "50%",
                    transform: isPvToggle
                      ? "translateX(16px)"
                      : "translateX(0)",
                  }}
                />
              </span>
            </label>
          </div>

          <div className="jippy-outlet-foods-count-badge">
            {filteredFoods.length} Foods
          </div>
        </div>
      </div>

      {/* TABLE CARD */}
      <div className="jippy-outlet-foods-card">
        {/* CONTROLS */}
        <div className="jippy-outlet-foods-controls">
          <div className="jippy-outlet-foods-entries">
            <span>Show</span>
            <select
              value={foodEntries}
              onChange={(event) =>
                setFoodEntries(Number(event.target.value))
              }
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>entries</span>
          </div>

          <div className="jippy-outlet-foods-search">
            <div className="jippy-outlet-foods-search-box">
              <input
                type="text"
                value={foodSearch}
                placeholder="Search food name, category..."
                onChange={(event) => setFoodSearch(event.target.value)}
              />
              <FiSearch />
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="jippy-outlet-foods-table-wrapper">
          <table className="jippy-outlet-foods-table">
            <thead>
              <tr>
                <th className="food-expand-header"></th>
                <th>Product ID</th>
                <th>Food Name</th>
                <th>Category</th>
                <th className="jippy-outlet-foods-description-column">
                  Description
                </th>
                <th>Merchant Price</th>
                <th>Veg</th>
                <th>Product Variants</th>
                <th>isToggle</th>
                <th>Product Timings</th>
                <th>Product Type</th>
                <th>Add Variants</th>
              </tr>
            </thead>

            <tbody>
              {displayedFoods.length > 0 ? (
                displayedFoods.map((food, index) => {
                  const productId = food?.productId ?? index;
                  const isExpanded =
                    Number(expandedFoodId) === Number(productId);
                  const unavailable = !isTrue(food?.isToggle);

                  return (
                    <React.Fragment key={productId}>
                      <tr>
                        {/* EXPAND */}
                        <td>
                          <button
                            type="button"
                            className="food-expand-btn"
                            onClick={() =>
                              setExpandedFoodId(
                                isExpanded ? null : productId
                              )
                            }
                          >
                            {isExpanded ? "−" : "+"}
                          </button>
                        </td>

                        {/* PRODUCT ID */}
                        <td>
                          <span className="jippy-food-product-id">
                            {food?.productId ?? "-"}
                          </span>
                        </td>

                        {/* FOOD NAME */}
                        <td>
                          <strong className="jippy-food-name">
                            {food?.productName ?? "-"}
                          </strong>
                        </td>

                        {/* CATEGORY */}
                        <td>
                          <span className="jippy-food-category">
                            {food?.categoryName ?? "-"}
                          </span>
                        </td>

                        {/* DESCRIPTION */}
                        <td className="jippy-outlet-foods-description">
                          {food?.description ?? "-"}
                        </td>

                        {/* MERCHANT PRICE */}
                        <td>
                          <span className="jippy-food-price">
                            {formatPrice(food?.merchantPrice)}
                          </span>
                        </td>

                        {/* ONLINE PRICE */}
                      

                        {/* VEG */}
                        <td>
                          {isTrue(food?.isVeg) ? (
                            <span className="jippy-food-veg">VEG</span>
                          ) : (
                            <span className="jippy-food-nonveg">NON-VEG</span>
                          )}
                        </td>

                        {/* VARIANTS */}
                        <td>
                          <div className="jippy-food-variants-cell">
                            {renderVariants(food)}
                            <button
                              type="button"
                              className="jippy-food-variants-btn"
                              onClick={() => handleViewVariants(food)}
                              disabled={variantLoading}
                            >
                              <FiLayers />
                              View variants
                            </button>
                          </div>
                        </td>

                        {/* AVAILABLE */}
                        <td>
                          <button
                            type="button"
                            className={`jippy-food-availability-toggle ${
                              isTrue(food?.isToggle)
                                ? "jippy-food-toggle-on"
                                : "jippy-food-toggle-off"
                            }`}
                            onClick={() =>
                              handleFoodAvailabilityToggle(food)
                            }
                            disabled={savingFoodAvailability}
                            aria-label={
                              isTrue(food?.isToggle)
                                ? "Mark food unavailable"
                                : "Mark food available"
                            }
                          >
                            <span className="jippy-food-toggle-knob" />
                          </button>
                        </td>

                        {/* PRODUCT TIMINGS */}
                        <td>
                          {renderProductTimings(food?.productTimings)}
                        </td>

                        {/* PRODUCT TYPE */}
                        <td>
                          <span className="jippy-food-product-type">
                            {food?.productType || "-"}
                          </span>
                        </td>

                        {/* ADD VARIANTS */}
                        <td>
                          <button
                            type="button"
                            className="jippy-food-add-variants-btn"
                            onClick={() => handleAddVariants(food)}
                            disabled={preparingVariantForm}
                            title="Edit product variants"
                            aria-label="Edit product variants"
                          >
                            <FiEdit2 />
                          </button>
                        </td>
                      </tr>

                      {/* FOOD UNAVAILABILITY EXPANDED ROW */}
                      {isExpanded &&
                        unavailable &&
                        foodUnavailabilityData[food?.productId] && (
                          <tr className="food-expanded-row">
                            <td
                              colSpan={13}
                              className="jippy-food-expanded-cell"
                            >
                              <div className="jippy-food-unavailability-card">
                                <div className="jippy-food-unavailability-heading">
                                  <div>
                                    <strong>Food Unavailability</strong>
                                    <span> (Currently Unavailable)</span>
                                  </div>

                                  <button
                                    type="button"
                                    className="jippy-edit-unavailability-btn"
                                    onClick={() => {
                                      const saved =
                                        foodUnavailabilityData[
                                          food?.productId
                                        ];

                                      setSelectedFood(food);

                                      setFoodUnavailabilityForm({
                                        fromDate: saved?.fromDate || "",
                                        toDate: saved?.toDate || "",
                                        reason: saved?.reason || "",
                                      });

                                      setFoodAvailabilityMode("edit");
                                      setFoodAvailabilityModal(true);
                                    }}
                                  >
                                    Edit Unavailability
                                  </button>
                                </div>

                                <div
                                  className="jippy-food-unavailability-content"
                                  style={{
                                    display: "grid",
                                    gridTemplateColumns:
                                      "repeat(4, minmax(0, 1fr))",
                                    gap: "24px",
                                    alignItems: "start",
                                    width: "100%",
                                  }}
                                >
                                  <div className="jippy-unavailability-info">
                                    <span>From Date & Time</span>
                                    <strong>
                                      {foodUnavailabilityData[food?.productId]
                                        ?.fromDate || "-"}
                                    </strong>
                                  </div>

                                  <div className="jippy-unavailability-info">
                                    <span>To Date & Time</span>
                                    <strong>
                                      {foodUnavailabilityData[food?.productId]
                                        ?.toDate || "-"}
                                    </strong>
                                  </div>

                                  <div className="jippy-unavailability-info">
                                    <span>Reason</span>
                                    <strong>
                                      {foodUnavailabilityData[food?.productId]
                                        ?.reason || "-"}
                                    </strong>
                                  </div>

                                  <div className="jippy-unavailability-info">
                                    <span>Marked On</span>
                                    <strong>
                                      {foodUnavailabilityData[food?.productId]
                                        ?.markedOn || "-"}
                                    </strong>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={13} className="jippy-outlet-foods-empty">
                    <FiShoppingBag />
                    <div>No food items found</div>
                    {foodSearch && <small>Try another search term.</small>}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="jippy-outlet-foods-pagination">
          <div className="jippy-outlet-foods-showing">
            {totalFoods > 0
              ? `Showing ${startIndex + 1} to ${Math.min(
                  startIndex + foodEntries,
                  totalFoods
                )} of ${totalFoods} entries`
              : "Showing 0 entries"}
          </div>

          <div className="jippy-outlet-foods-pagination-controls">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={safePage === 1}
              title="Previous"
            >
              <FiChevronLeft />
            </button>

            <span>
              Page {safePage} of {totalPages}
            </span>

            <button
              type="button"
              onClick={handleNext}
              disabled={safePage === totalPages}
              title="Next"
            >
              <FiChevronRight />
            </button>
          </div>
        </div>
      </div>

      {/* VARIANTS MODAL */}
      {(variantLoading || variantProduct || variantError) && (
        <div
          className="jippy-food-variants-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Product variants"
        >
          <div className="jippy-food-variants-dialog">
            <div className="jippy-food-variants-dialog-header">
              <div>
                <p>PRODUCT VARIANTS</p>
                <h3>
                  {variantProduct?.productName ||
                    "Loading product variants"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setVariantProduct(null);
                  setVariantError("");
                }}
                aria-label="Close variants"
              >
                <FiX />
              </button>
            </div>

            {variantLoading && (
              <div className="jippy-food-variants-state">
                Loading variants...
              </div>
            )}
            {variantError && (
              <div className="jippy-food-variants-error">
                {variantError}
              </div>
            )}

            {variantProduct && !variantLoading && (
              <div className="jippy-food-variants-content">
                {Array.isArray(variantProduct.variantGroups) &&
                variantProduct.variantGroups.length > 0 ? (
                  variantProduct.variantGroups.map((group) => (
                    <section
                      className="jippy-food-variant-group"
                      key={group.productVariantGroupsId}
                    >
                      <h3>
                        {group.groupName ||
                          `Group #${group.productVariantGroupsId}`}
                      </h3>
                      <div className="jippy-food-variant-options">
                        {(group.options || []).map((option) => (
                          <div
                            className="jippy-food-variant-option"
                            key={option.productVariantOptionsId}
                          >
                            <strong>
                              {option.variantName ||
                                `Option #${option.productVariantOptionsId}`}
                            </strong>
                            <span>{option.priceType || "FIXED"}</span>
                            <b>{formatPrice(option.variantPrice)}</b>
                          </div>
                        ))}
                      </div>
                    </section>
                  ))
                ) : (
                  <div className="jippy-food-variants-state">
                    No variants are configured for this food item.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADD VARIANTS MODAL */}
      {foodForVariants && (
        <AddToOutletProducts
          selectedProducts={[foodForVariants]}
          initialOutletId={outlet?.outletId ?? outlet?.id}
          initialOutletName={outlet?.outletName ?? outlet?.name}
          initialOutletCategoryId={foodForVariants.outletCategoryId}
          initialCategoryId={foodForVariants.categoryId}
          asModal
          setShowOutletPopup={() => setFoodForVariants(null)}
        />
      )}

      <div className="jippy-outlet-foods-bottom"></div>

      {/* FOOD UNAVAILABILITY MODAL */}
      {foodAvailabilityModal && (
        <div className="jippy-food-unavailability-overlay">
          <div className="jippy-food-unavailability-modal">
            {foodAvailabilityMode === "restore" ? (
              <>
                <div className="jippy-food-unavailability-header">
                  <div>
                    <h3>Make Food Available</h3>
                    <p>{selectedFood?.productName || "-"}</p>
                  </div>

                  <button
                    type="button"
                    className="jippy-food-unavailability-close"
                    onClick={() => {
                      setFoodAvailabilityModal(false);
                      setSelectedFood(null);
                    }}
                  >
                    ×
                  </button>
                </div>

                <div className="jippy-food-unavailability-info">
                  This food is currently unavailable. Do you want to make this
                  food available again?
                </div>

                <div className="jippy-food-unavailability-modal-actions">
                  <button
                    type="button"
                    className="jippy-food-unavailability-cancel-btn"
                    onClick={() => {
                      setFoodAvailabilityModal(false);
                      setSelectedFood(null);
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="jippy-food-unavailability-confirm-btn"
                    onClick={handleConfirmFoodRestore}
                    disabled={savingFoodAvailability}
                  >
                    {savingFoodAvailability
                      ? "Restoring..."
                      : "Confirm & Turn ON"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="jippy-food-unavailability-header">
                  <div>
                    <h3>Mark Food as Unavailable</h3>
                    <p>{selectedFood?.productName || "-"}</p>
                  </div>

                  <button
                    type="button"
                    className="jippy-food-unavailability-close"
                    onClick={() => {
                      setFoodAvailabilityModal(false);
                      setSelectedFood(null);
                    }}
                  >
                    ×
                  </button>
                </div>

                <div className="jippy-food-unavailability-info">
                  Please select the unavailability period and reason. This
                  food will be unavailable during this time.
                </div>

                <div className="jippy-food-unavailability-grid">
                  <div>
                    <label>From Date & Time *</label>
                    <input
                      type="datetime-local"
                      value={foodUnavailabilityForm.fromDate}
                      onChange={(e) =>
                        setFoodUnavailabilityForm((previous) => ({
                          ...previous,
                          fromDate: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div>
                    <label>To Date & Time *</label>
                    <input
                      type="datetime-local"
                      value={foodUnavailabilityForm.toDate}
                      onChange={(e) =>
                        setFoodUnavailabilityForm((previous) => ({
                          ...previous,
                          toDate: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="jippy-food-unavailability-field">
                  <label>Reason *</label>
                  <textarea
                    value={foodUnavailabilityForm.reason}
                    onChange={(e) =>
                      setFoodUnavailabilityForm((previous) => ({
                        ...previous,
                        reason: e.target.value,
                      }))
                    }
                    placeholder="Enter reason for food unavailability"
                    rows={4}
                  />
                </div>

                <div className="jippy-food-unavailability-modal-actions">
                  <button
                    type="button"
                    className="jippy-food-unavailability-cancel-btn"
                    onClick={() => {
                      setFoodAvailabilityModal(false);
                      setSelectedFood(null);
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="jippy-food-unavailability-confirm-btn"
                    onClick={handleConfirmFoodUnavailability}
                    disabled={savingFoodAvailability}
                  >
                    {savingFoodAvailability
                      ? "Saving..."
                      : "Confirm & Turn OFF"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default OutletFoods;