import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";

// Update the import path below to match your actual styles folder location:
// - Use "../styles/OutletFoods.css" if styles is located at src/pages/styles/
// - Use "../../styles/OutletFoods.css" if styles is located at src/styles/
import "../../styles/OutletFoods.css";

import { getAdminOutletDetails } from "../../services/outletService";
import {
  getProductDetailById,
  getCompleteProductDetails,
  getOutletProducts,
} from "../../services/productDetailService";
import { toggleProductActiveByType } from "../../services/masterProductsService";
import AddToOutletProducts from "./AddToOutletProducts";
import AddSingleProduct from "./AddSingleProduct";
import EditOutletProduct from "./EditOutletProduct";

import {
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiShoppingBag,
  FiLayers,
  FiX,
  FiEdit2,
  FiPlus,
} from "react-icons/fi";

function OutletFoods({
  outlet: outletFromParent,
  categories: categoriesFromParent,
  setActivePage,
}) {
  // ============================================================
  // STATE
  // ============================================================

  const [savingFoodAvailability, setSavingFoodAvailability] =
    useState(false);

  const [outlet, setOutlet] = useState(
    outletFromParent || null
  );
  const [directProducts, setDirectProducts] = useState([]);

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

  const [showAddSingleProduct, setShowAddSingleProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [variantProduct, setVariantProduct] = useState(null);
  const [variantLoading, setVariantLoading] = useState(false);
  const [variantError, setVariantError] = useState("");
  const [foodForVariants, setFoodForVariants] = useState(null);
  const [preparingVariantForm, setPreparingVariantForm] = useState(false);
  const [completeProductDetailsMap, setCompleteProductDetailsMap] = useState({});

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

  const loadFoods = useCallback(async () => {
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

      const outletData =
        response?.data?.data?.outletId != null
          ? response.data.data
          : response?.data?.outletId != null
          ? response.data
          : response?.outletId != null
          ? response
          : response?.data?.data || response?.data || response;

      // Display outlet products via GET /api/fm/products/outlet/{outletId}
      // Note: Backend endpoint filters p.is_active = 'Y' (returns only active products)
      let activeProdList = [];
      try {
        const outletProductsRes = await getOutletProducts(outletId);
        const prodData =
          outletProductsRes?.data?.data ||
          outletProductsRes?.data ||
          outletProductsRes ||
          [];
        if (Array.isArray(prodData)) {
          activeProdList = prodData;
        }
      } catch (prodErr) {
        console.warn("getOutletProducts notice:", prodErr);
      }

      const activeIdSet = new Set(
        activeProdList
          .map((p) => Number(p?.productId ?? p?.id))
          .filter(Boolean)
      );

      // Initialize direct active products
      const initializedDirect = activeProdList.map((prod) => ({
        ...prod,
        isActive: "Y",
        isToggle: true,
      }));
      setDirectProducts(initializedDirect);

      // Update outlet categories: tag products as active ('Y') if present in activeIdSet, otherwise inactive ('N')
      if (outletData && Array.isArray(outletData.categories)) {
        const updatedCategories = outletData.categories.map((cat) => ({
          ...cat,
          products: Array.isArray(cat.products)
            ? cat.products.map((prod) => {
                const pId = Number(prod?.productId ?? prod?.id);
                const isActive =
                  activeProdList.length > 0
                    ? activeIdSet.has(pId)
                    : isTrue(prod?.isActive ?? prod?.isToggle);
                return {
                  ...prod,
                  isActive: isActive ? "Y" : "N",
                  isToggle: isActive,
                };
              })
            : [],
        }));
        setOutlet({
          ...outletData,
          categories: updatedCategories,
        });
      } else if (outletData) {
        setOutlet(outletData);
      }

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
  }, [outletFromParent?.outletId]);

  useEffect(() => {
    loadFoods();
  }, [loadFoods]);

  // Helper to determine boolean state from diverse truthy values
  const isTrue = (value) => {
    return (
      value === true ||
      value === "true" ||
      value === "TRUE" ||
      value === "Y" ||
      value === "y" ||
      value === "Yes" ||
      value === "YES" ||
      value === 1 ||
      value === "1"
    );
  };

  // Helper to check if a product is active based on all possible DB/API fields
  const isProductActive = (foodItem, details) => {
    const val =
      foodItem?.isActive !== undefined && foodItem?.isActive !== null
        ? foodItem.isActive
        : foodItem?.isToggle !== undefined && foodItem?.isToggle !== null
        ? foodItem.isToggle
        : foodItem?.active !== undefined && foodItem?.active !== null
        ? foodItem.active
        : foodItem?.productIsActive !== undefined && foodItem?.productIsActive !== null
        ? foodItem.productIsActive
        : details?.isActive !== undefined && details?.isActive !== null
        ? details.isActive
        : details?.isToggle !== undefined && details?.isToggle !== null
        ? details.isToggle
        : details?.active !== undefined && details?.active !== null
        ? details.active
        : details?.productIsActive;

    if (val !== undefined && val !== null) {
      return isTrue(val);
    }

    // If active status is not specified, check presence in directProducts
    const pId = Number(foodItem?.productId ?? foodItem?.id);
    if (pId && Array.isArray(directProducts) && directProducts.length > 0) {
      return directProducts.some((dp) => Number(dp?.productId ?? dp?.id) === pId);
    }

    return false;
  };

  const handleFoodAvailabilityToggle = async (food) => {
    const productId = Number(food?.productId ?? food?.id);
    if (!productId) {
      return;
    }

    const details = (food?.productId && completeProductDetailsMap[food.productId]) || {};
    const currentActive = isProductActive(food, details);
    const newActiveState = !currentActive;
    const newIsActiveStr = newActiveState ? "Y" : "N";

    // Optimistically update UI
    setOutlet((previous) => ({
      ...previous,
      categories: previous?.categories?.map((category) => ({
        ...category,
        products: category.products?.map((product) =>
          Number(product.productId ?? product.id) === productId
            ? {
                ...product,
                isActive: newIsActiveStr,
                isToggle: newActiveState,
              }
            : product
        ),
      })),
    }));

    setDirectProducts((previous) =>
      previous.map((product) =>
        Number(product.productId ?? product.id) === productId
          ? { ...product, isActive: newIsActiveStr, isToggle: newActiveState }
          : product
      )
    );

    setCompleteProductDetailsMap((prev) => {
      if (!prev[productId]) return prev;
      return {
        ...prev,
        [productId]: {
          ...prev[productId],
          isActive: newIsActiveStr,
          isToggle: newActiveState,
        },
      };
    });

    try {
      setSavingFoodAvailability(true);
      await toggleProductActiveByType({
        productId,
        isActive: newIsActiveStr,
        productType: food?.productType === "MASTERPRODUCT" ? "MASTERPRODUCT" : "PRODUCT",
      });
    } catch (error) {
      console.warn("Toggle API call notice:", error);
      // Revert optimistic update on failure
      const revertIsActiveStr = currentActive ? "Y" : "N";
      setOutlet((previous) => ({
        ...previous,
        categories: previous?.categories?.map((category) => ({
          ...category,
          products: category.products?.map((product) =>
            Number(product.productId ?? product.id) === productId
              ? {
                  ...product,
                  isActive: revertIsActiveStr,
                  isToggle: currentActive,
                }
              : product
          ),
        })),
      }));

      setDirectProducts((previous) =>
        previous.map((product) =>
          Number(product.productId ?? product.id) === productId
            ? { ...product, isActive: revertIsActiveStr, isToggle: currentActive }
            : product
        )
      );

      setCompleteProductDetailsMap((prev) => {
        if (!prev[productId]) return prev;
        return {
          ...prev,
          [productId]: {
            ...prev[productId],
            isActive: revertIsActiveStr,
            isToggle: currentActive,
          },
        };
      });
    } finally {
      setSavingFoodAvailability(false);
    }
  };

  // ============================================================
  // FLATTEN CATEGORIES -> PRODUCTS (INCLUDES INACTIVE & ACTIVE)
  // ============================================================

  const allFoods = useMemo(() => {
    if (!outlet && (!directProducts || directProducts.length === 0)) {
      return [];
    }

    const categories =
      Array.isArray(outlet?.categories)
        ? outlet.categories
        : Array.isArray(categoriesFromParent)
        ? categoriesFromParent
        : [];

    const categoryFoods = categories.flatMap((category) => {
      const products =
        Array.isArray(category?.products)
          ? category.products
          : [];

      return products.map((product) => ({
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
      }));
    });

    // Map category foods by product ID (preserves both active and inactive foods)
    const foodMap = new Map();
    categoryFoods.forEach((prod) => {
      const pId = Number(prod?.productId ?? prod?.id);
      if (pId) {
        foodMap.set(pId, prod);
      }
    });

    // Merge any direct products from GET /api/fm/products/outlet/{outletId}
    (directProducts || []).forEach((prod) => {
      const pId = Number(prod?.productId ?? prod?.id);
      if (pId) {
        if (foodMap.has(pId)) {
          const existing = foodMap.get(pId);
          foodMap.set(pId, {
            ...existing,
            ...prod,
            categoryId: prod?.categoryId ?? existing?.categoryId,
            categoryName: prod?.categoryName ?? existing?.categoryName,
            outletCategoryId: prod?.outletCategoryId ?? existing?.outletCategoryId,
            isActive: existing?.isActive ?? prod?.isActive ?? "Y",
            isToggle: existing?.isToggle ?? prod?.isToggle ?? true,
          });
        } else {
          foodMap.set(pId, {
            ...prod,
            isActive: prod?.isActive ?? "Y",
            isToggle: prod?.isToggle ?? true,
          });
        }
      }
    });

    return Array.from(foodMap.values());
  }, [
    directProducts,
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
  // FETCH COMPLETE PRODUCT DETAILS FOR DISPLAYED FOODS
  // GET /api/fm/products/getCompleteProductDetails/{productId}
  // ============================================================

  useEffect(() => {
    if (!displayedFoods || displayedFoods.length === 0) return;

    let isMounted = true;
    const fetchMissingDetails = async () => {
      const missingList = displayedFoods.filter((food) => {
        const pId = Number(food?.productId ?? food?.id);
        return pId && !completeProductDetailsMap[pId];
      });

      if (missingList.length === 0) return;

      const promises = missingList.map(async (food) => {
        const pId = Number(food?.productId ?? food?.id);
        try {
          const res = await getCompleteProductDetails(pId);
          const data = res?.data?.data || res?.data || res || {};
          return { pId, data };
        } catch (err) {
          console.warn(`[OutletFoods] Failed to fetch complete details for product ${pId}:`, err);
          return { pId, data: null };
        }
      });

      const results = await Promise.all(promises);
      if (!isMounted) return;

      const newMap = {};
      results.forEach(({ pId, data }) => {
        if (data && pId) {
          newMap[pId] = data;
        }
      });

      if (Object.keys(newMap).length > 0) {
        setCompleteProductDetailsMap((prev) => ({ ...prev, ...newMap }));
      }
    };

    fetchMissingDetails();

    return () => {
      isMounted = false;
    };
  }, [displayedFoods]);

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
  // PRODUCT TIMINGS
  // ============================================================

  const DAY_NAMES = {
    1: "Mon",
    2: "Tue",
    3: "Wed",
    4: "Thu",
    5: "Fri",
    6: "Sat",
    7: "Sun",
  };

  const getDayLabel = (timing) => {
    if (timing?.day) return timing.day;
    if (timing?.dayName) return timing.dayName;
    if (timing?.dayOfWeek) return timing.dayOfWeek;
    const dayId = Number(timing?.dayOfWeekId || timing?.dayId);
    if (dayId >= 1 && dayId <= 7) return DAY_NAMES[dayId];
    return "Day";
  };

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
              key={`${getDayLabel(timing)}-${index}`}
              className="jippy-outlet-foods-timing-row"
            >
              <strong>
                {getDayLabel(timing)}
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
        productId,
        id: productId,
        masterProductId:
          detail.masterProductId ??
          food.masterProductId ??
          food.master_product_id ??
          productId,
        productName: detail.productName ?? food.productName,
        categoryId: detail.categoryId ?? food.categoryId,
        outletCategoryId: food.outletCategoryId ?? detail.outletCategoryId ?? null,
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
  // FULL PAGE: ADD SINGLE PRODUCT
  // ============================================================

  if (showAddSingleProduct) {
    return (
      <AddSingleProduct
        isOpen={showAddSingleProduct}
        onClose={() => setShowAddSingleProduct(false)}
        outlet={outlet || outletFromParent}
        outletCategories={outlet?.categories || categoriesFromParent || []}
        onProductAdded={loadFoods}
      />
    );
  }

  // ============================================================
  // FULL PAGE: EDIT OUTLET PRODUCT
  // ============================================================

  if (editingProduct) {
    return (
      <EditOutletProduct
        product={editingProduct}
        outlet={outlet || outletFromParent}
        outletCategories={outlet?.categories || categoriesFromParent || []}
        onClose={() => setEditingProduct(null)}
        onProductUpdated={() => {
          setEditingProduct(null);
          loadFoods();
        }}
      />
    );
  }

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

        {/* ACTIONS: ADD PRODUCT + P/PV TOGGLE + FOOD COUNT */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            type="button"
            onClick={() => setShowAddSingleProduct(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              backgroundColor: "#ff5722",
              color: "#fff",
              border: "none",
              padding: "7px 14px",
              borderRadius: "8px",
              fontWeight: "600",
              fontSize: "13px",
              cursor: "pointer",
              boxShadow: "0 2px 4px rgba(255, 87, 34, 0.2)",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#e64a19")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#ff5722")}
          >
            <FiPlus size={15} />
            Add Product
          </button>

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
                <th>Product ID</th>
                <th>Food Name</th>
                <th>Category</th>
                <th className="jippy-outlet-foods-description-column">
                  Description
                </th>
                <th>Merchant Price</th>
                <th>Veg</th>
                <th>Prouct Variants</th>
                <th>isToggle</th>
                <th>Product Timings</th>
                <th>Product Type</th>
                <th>Edit</th>
              </tr>
            </thead>

            <tbody>
              {displayedFoods.length > 0 ? (
                displayedFoods.map((food, index) => {
                  const productId = food?.productId ?? food?.id ?? index;
                  const details = (food?.productId && completeProductDetailsMap[food.productId]) || {};

                  const foodName = food?.productName || details?.productName || "-";
                  const categoryName = food?.categoryName || details?.categoryName || "-";
                  const description = food?.description || details?.description || "-";
                  const price =
                    (food?.merchantPrice !== undefined && food?.merchantPrice !== null && food?.merchantPrice !== "")
                      ? food.merchantPrice
                      : details?.merchantPrice;
                  const isVegVal = food?.isVeg !== undefined ? food.isVeg : details?.isVeg;
                  const productTypeVal = food?.productType || details?.productType || "-";
                  const isActiveVal = isProductActive(food, details);
                  const timingsVal =
                    (Array.isArray(details?.timings) && details.timings.length > 0)
                      ? details.timings
                      : (Array.isArray(details?.productTimings) && details.productTimings.length > 0)
                      ? details.productTimings
                      : (Array.isArray(food?.timings) && food.timings.length > 0)
                      ? food.timings
                      : food?.productTimings;

                  return (
                    <React.Fragment key={productId}>
                      <tr>
                        {/* PRODUCT ID */}
                        <td>
                          <span className="jippy-food-product-id">
                            {food?.productId ?? "-"}
                          </span>
                        </td>

                        {/* FOOD NAME */}
                        <td>
                          <strong
                            className="jippy-food-name jippy-food-name-clickable"
                            onClick={() => setEditingProduct({ ...food, ...details })}
                            title="Click to edit product details"
                          >
                            {foodName}
                          </strong>
                        </td>

                        {/* CATEGORY */}
                        <td>
                          <span className="jippy-food-category">
                            {categoryName}
                          </span>
                        </td>

                        {/* DESCRIPTION */}
                        <td className="jippy-outlet-foods-description">
                          {description}
                        </td>

                        {/* MERCHANT PRICE */}
                        <td>
                          <span className="jippy-food-price">
                            {formatPrice(price)}
                          </span>
                        </td>

                        {/* VEG */}
                        <td>
                          {isTrue(isVegVal) ? (
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
                              onClick={() => handleViewVariants({ ...food, ...details })}
                              disabled={variantLoading}
                            >
                              <FiLayers />
                              View variants
                            </button>
                          </div>
                        </td>

                        {/* AVAILABLE / STATUS */}
                        <td>
                          <button
                            type="button"
                            className={`jippy-food-availability-toggle ${
                              isActiveVal
                                ? "jippy-food-toggle-on"
                                : "jippy-food-toggle-off"
                            }`}
                            onClick={() =>
                              handleFoodAvailabilityToggle(food)
                            }
                            disabled={savingFoodAvailability}
                            aria-label={
                              isActiveVal
                                ? "Mark product inactive"
                                : "Mark product active"
                            }
                            title={
                              isActiveVal
                                ? "Active (Click to deactivate)"
                                : "Inactive (Click to activate)"
                            }
                          >
                            <span className="jippy-food-toggle-knob" />
                          </button>
                        </td>

                        {/* PRODUCT TIMINGS */}
                        <td>
                          {renderProductTimings(timingsVal)}
                        </td>

                        {/* PRODUCT TYPE */}
                        <td>
                          <span className="jippy-food-product-type">
                            {productTypeVal}
                          </span>
                        </td>

                        {/* EDIT PRODUCT / VARIANTS */}
                        <td>
                          <button
                            type="button"
                            className="jippy-food-add-variants-btn"
                            onClick={() => setEditingProduct({ ...food, ...details })}
                            title="Edit product details & variants"
                            aria-label="Edit product details & variants"
                          >
                            <FiEdit2 />
                          </button>
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={11} className="jippy-outlet-foods-empty">
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
          setShowOutletPopup={() => {
            setFoodForVariants(null);
            loadFoods();
          }}
        />
      )}



      <div className="jippy-outlet-foods-bottom"></div>
    </div>
  );
}

export default OutletFoods;