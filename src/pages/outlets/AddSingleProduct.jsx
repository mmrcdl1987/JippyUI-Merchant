import React, { useState, useEffect, useMemo } from "react";
import "../../styles/AddSingleProduct.css";
import {
  getAllCategories,
  getMasterProductsByCategory,
  mapProductsFromMaster,
} from "../../services/masterProductsService";
import {
  FiSearch,
  FiX,
  FiCheck,
  FiPlus,
  FiLoader,
  FiArrowLeft,
  FiPackage,
  FiClock,
  FiCalendar,
  FiDollarSign,
  FiFolder,
  FiCheckCircle,
} from "react-icons/fi";

const DAYS_OF_WEEK = [
  { id: 1, name: "Monday", short: "Mon" },
  { id: 2, name: "Tuesday", short: "Tue" },
  { id: 3, name: "Wednesday", short: "Wed" },
  { id: 4, name: "Thursday", short: "Thu" },
  { id: 5, name: "Friday", short: "Fri" },
  { id: 6, name: "Saturday", short: "Sat" },
  { id: 7, name: "Sunday", short: "Sun" },
];

const createTimeSlot = (startTime = "09:00", endTime = "22:00") => ({
  startTime,
  endTime,
});

const createDayTiming = (
  enabled = true,
  timeSlots = [createTimeSlot()]
) => ({
  enabled,
  timeSlots,
});

function AddSingleProduct({
  isOpen,
  onClose,
  outlet,
  outletCategories = [],
  onProductAdded,
}) {
  // Categories State
  const [categories, setCategories] = useState([]);
  const [categorySearch, setCategorySearch] = useState("");
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");



  // Master Products State
  const [productSearch, setProductSearch] = useState("");
  const [masterProducts, setMasterProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Configuration fields for selected product
  const [merchantPrice, setMerchantPrice] = useState("");
  const [productType, setProductType] = useState("FOOD");
  const [isVeg, setIsVeg] = useState(true);

  // Timings: Days & Hours State (supports different hours for different days)
  const [daySpecificTimings, setDaySpecificTimings] = useState({
    1: createDayTiming(),
    2: createDayTiming(),
    3: createDayTiming(),
    4: createDayTiming(),
    5: createDayTiming(),
    6: createDayTiming(),
    7: createDayTiming(),
  });
  const [bulkStartTime, setBulkStartTime] = useState("09:00");
  const [bulkEndTime, setBulkEndTime] = useState("22:00");

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const outletId = outlet?.outletId ?? outlet?.id;
  const outletName = outlet?.outletName ?? outlet?.name ?? "Outlet";

  // 1. Fetch categories on mount
  useEffect(() => {
    if (!isOpen) return;

    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        setErrorMessage("");
        const res = await getAllCategories("ALL");
        const list = res.data?.data || res.data || [];
        const validList = Array.isArray(list) ? list : [];
        setCategories(validList);

        if (validList.length > 0) {
          const firstCatId = validList[0].id || validList[0].categoryId;
          setSelectedCategoryId(String(firstCatId));
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
        setErrorMessage("Failed to load categories. Please try again.");
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, [isOpen]);

  // Filtered categories based on search input
  const filteredCategories = useMemo(() => {
    if (!categorySearch.trim()) return categories;
    const term = categorySearch.toLowerCase().trim();
    return categories.filter((cat) => {
      const name = (cat.categoryName || cat.name || "").toLowerCase();
      return name.includes(term);
    });
  }, [categories, categorySearch]);

  // 2. Fetch master products when selectedCategoryId or productSearch changes
  useEffect(() => {
    if (!isOpen || !selectedCategoryId) return;

    const timeoutId = setTimeout(async () => {
      try {
        setLoadingProducts(true);
        setErrorMessage("");
        const res = await getMasterProductsByCategory(selectedCategoryId, productSearch.trim());
        const data = res.data?.data || res.data || [];
        setMasterProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching master products:", err);
        setMasterProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [isOpen, selectedCategoryId, productSearch]);

  // 3. Reset product configuration when product selection changes
  const handleSelectProduct = (prod) => {
    setSelectedProduct(prod);
    const defaultPrice =
      prod.merchantPrice ??
      prod.xlsMerchantPrice ??
      prod.csvMerchantPrice ??
      prod.price ??
      "";
    setMerchantPrice(defaultPrice ? String(defaultPrice) : "");

    const isVegVal =
      prod.isVeg !== undefined
        ? prod.isVeg
        : prod.veg !== undefined
        ? Number(prod.veg) === 1
        : true;
    setIsVeg(Boolean(isVegVal));
    setProductType(prod.productType || "FOOD");
  };

  // Toggle Day Selection
  const toggleDayEnabled = (dayId) => {
    setDaySpecificTimings((prev) => ({
      ...prev,
      [dayId]: {
        ...prev[dayId],
        enabled: !prev[dayId]?.enabled,
      },
    }));
  };

  // Handle Time Change per Day
  const handleDayTimeChange = (dayId, field, value) => {
    const [slotIndex, slotField] = field.split(".");
    setDaySpecificTimings((prev) => ({
      ...prev,
      [dayId]: {
        ...prev[dayId],
        timeSlots: prev[dayId].timeSlots.map((slot, index) =>
          index === Number(slotIndex)
            ? { ...slot, [slotField]: value }
            : slot
        ),
      },
    }));
  };

  const addTimeSlot = (dayId) => {
    setDaySpecificTimings((prev) => ({
      ...prev,
      [dayId]: {
        ...prev[dayId],
        timeSlots: [...prev[dayId].timeSlots, createTimeSlot()],
      },
    }));
  };

  const removeTimeSlot = (dayId, slotIndex) => {
    setDaySpecificTimings((prev) => {
      const timeSlots = prev[dayId].timeSlots.filter(
        (_, index) => index !== slotIndex
      );
      return {
        ...prev,
        [dayId]: {
          ...prev[dayId],
          timeSlots: timeSlots.length > 0 ? timeSlots : [createTimeSlot()],
        },
      };
    });
  };

  // Bulk Apply to All Active Days
  const handleApplyBulkTimeToAll = () => {
    setDaySpecificTimings((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((dayId) => {
        if (updated[dayId].enabled) {
          updated[dayId] = {
            ...updated[dayId],
            timeSlots: [
              createTimeSlot(bulkStartTime, bulkEndTime),
            ],
          };
        }
      });
      return updated;
    });
  };

  // Preset Handlers for Timings
  const handleApplyPreset = (presetType) => {
    if (presetType === "ALL_DAYS") {
      const updated = {};
      for (let i = 1; i <= 7; i++) {
        updated[i] = createDayTiming();
      }
      setDaySpecificTimings(updated);
      setBulkStartTime("09:00");
      setBulkEndTime("22:00");
    } else if (presetType === "FULL_DAY") {
      const updated = {};
      for (let i = 1; i <= 7; i++) {
        updated[i] = createDayTiming(true, [createTimeSlot("00:00", "23:59")]);
      }
      setDaySpecificTimings(updated);
      setBulkStartTime("00:00");
      setBulkEndTime("23:59");
    } else if (presetType === "WEEKDAYS") {
      const updated = {};
      for (let i = 1; i <= 5; i++) {
        updated[i] = createDayTiming();
      }
      for (let i = 6; i <= 7; i++) {
        updated[i] = createDayTiming(false);
      }
      setDaySpecificTimings(updated);
    } else if (presetType === "WEEKENDS") {
      const updated = {};
      for (let i = 1; i <= 5; i++) {
        updated[i] = createDayTiming(false);
      }
      for (let i = 6; i <= 7; i++) {
        updated[i] = createDayTiming(true, [createTimeSlot("10:00", "23:00")]);
      }
      setDaySpecificTimings(updated);
    }
  };

  // 4. Save product
  const handleSave = async () => {
    if (!outletId) {
      setErrorMessage("Outlet ID is missing.");
      return;
    }

    if (!selectedProduct) {
      setErrorMessage("Please select a master product to add.");
      return;
    }

    if (!merchantPrice || Number(merchantPrice) <= 0 || isNaN(Number(merchantPrice))) {
      setErrorMessage("Please enter a valid Merchant Price greater than 0.");
      return;
    }

    const enabledDays = Object.entries(daySpecificTimings).filter(([_, t]) => t.enabled);
    if (enabledDays.length === 0) {
      setErrorMessage("Please enable at least one operating day.");
      return;
    }

    try {
      setSaving(true);
      setErrorMessage("");

      const masterProductId = Number(
        selectedProduct.masterProductId || selectedProduct.productId || selectedProduct.id
      );

      const selectedCategoryObj = categories.find(
        (c) => String(c.id || c.categoryId) === String(selectedCategoryId)
      );

      // Build timing objects by Days and Hours (different hours per day)
      const timingsList = enabledDays.flatMap(([dayId, timing]) =>
        timing.timeSlots.map((slot) => ({
          dayOfWeekId: Number(dayId),
          startTime: slot.startTime || "09:00",
          endTime: slot.endTime || "22:00",
        }))
      );

      const payload = {
        outletId: Number(outletId),
        products: [
          {
            masterProductId,
            productName:
              selectedProduct.productName ||
              selectedProduct.name ||
              selectedProduct.masterProductName ||
              "",
            description: selectedProduct.description || "",
            categoryId: Number(selectedCategoryId),
            categoryName:
              selectedCategoryObj?.categoryName ||
              selectedCategoryObj?.name ||
              selectedProduct.categoryName ||
              selectedProduct.category ||
              "",
            productType: productType || selectedProduct.productType || "FOOD",
            isVeg: Boolean(isVeg),
            merchantPrice: Number(merchantPrice),
            hasProductVariants: false,
            imageLink:
              selectedProduct.imageLink ||
              selectedProduct.image ||
              selectedProduct.photos ||
              "",
            timings: timingsList,
            variantGroups: [],
          },
        ],
      };

      console.log("[AddSingleProduct] Submitting payload to mapProductsFromMaster:", payload);
      await mapProductsFromMaster(payload);

      alert(`Product "${selectedProduct.productName || selectedProduct.masterProductName}" added to ${outletName} successfully!`);
      
      if (onProductAdded) {
        onProductAdded();
      }
      onClose();
    } catch (err) {
      console.error("[AddSingleProduct] Error adding product:", err);
      const backendMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to add product to outlet.";
      setErrorMessage(backendMsg);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="asp-fullpage">
      {/* Sticky Header */}
      <div className="asp-fullpage-header">
        <div className="asp-fullpage-header-left">
          <button
            type="button"
            className="asp-back-btn"
            onClick={onClose}
            title="Back to Foods"
          >
            <FiArrowLeft />
          </button>
          <div className="asp-fullpage-header-text">
            <h2>
              <FiPlus className="asp-header-icon" /> Add Product to Outlet
            </h2>
            <p>
              Adding items from master catalog to <strong>{outletName}</strong>
            </p>
          </div>
        </div>

        <div className="asp-fullpage-header-actions">
          <button
            type="button"
            className="asp-btn-cancel"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="button"
            className="asp-btn-submit"
            onClick={handleSave}
            disabled={saving || !selectedProduct}
          >
            {saving ? (
              <>
                <FiLoader className="spin" /> Saving...
              </>
            ) : (
              <>
                <FiPlus /> Add Product
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Sequential Scroll Container */}
      <div className="asp-scroll-container">
        {errorMessage && (
          <div className="asp-error-banner">{errorMessage}</div>
        )}

        {/* STEP 1: MASTER CATEGORY (COMPACT) */}
        <div className="asp-step-card asp-step-card-compact">
          <div className="asp-step-header asp-step-header-compact">
            <div className="asp-step-header-left">
              <div className="asp-step-badge">1</div>
              <div className="asp-step-title-wrap">
                <h3>Select Master Category</h3>
                <p>Choose a category to browse products</p>
              </div>
            </div>

            {/* Category Search Filter */}
            <div className="asp-category-search-bar-inline">
              <input
                type="text"
                className="asp-category-search-input-sm asp-no-icon"
                placeholder="Search category..."
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                disabled={saving || loadingCategories}
              />
              {categorySearch && (
                <button
                  type="button"
                  className="asp-clear-search-btn-sm"
                  onClick={() => setCategorySearch("")}
                >
                  <FiX />
                </button>
              )}
            </div>
          </div>

          <div className="asp-step-body asp-step-body-compact">
            {/* Categories Chips / List (Folder icon removed) */}
            <div className="asp-categories-grid-compact">
              {loadingCategories ? (
                <div className="asp-state-message-compact">
                  <FiLoader className="spin" style={{ marginRight: 6 }} /> Loading categories...
                </div>
              ) : filteredCategories.length === 0 ? (
                <div className="asp-state-message-compact">
                  No categories found matching "{categorySearch}".
                </div>
              ) : (
                filteredCategories.map((cat) => {
                  const catId = String(cat.id || cat.categoryId);
                  const isSelected = selectedCategoryId === catId;
                  const catName = cat.categoryName || cat.name || "Category";

                  return (
                    <button
                      key={catId}
                      type="button"
                      className={`asp-category-chip-compact ${isSelected ? "selected" : ""}`}
                      onClick={() => {
                        setSelectedCategoryId(catId);
                        setSelectedProduct(null);
                      }}
                    >
                      <span className="asp-cat-chip-name">{catName}</span>
                      {isSelected && <FiCheck className="asp-cat-chip-check" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* STEP 2: SELECT MASTER PRODUCT */}
        <div className="asp-step-card">
          <div className="asp-step-header">
            <div className="asp-step-badge">2</div>
            <div className="asp-step-title-wrap">
              <h3>Choose Product from Catalog</h3>
              <p>
                {masterProducts.length} product(s) available in selected category (displayed side by side)
              </p>
            </div>
          </div>

          <div className="asp-step-body">
            {/* Product Search Input (Search icon removed) */}
            <div className="asp-search-input-wrapper" style={{ marginBottom: 16 }}>
              <input
                type="text"
                className="asp-input"
                placeholder="Search products in this category..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                disabled={saving || !selectedCategoryId}
              />
              {productSearch && (
                <button
                  type="button"
                  className="asp-clear-search-btn"
                  onClick={() => setProductSearch("")}
                >
                  <FiX />
                </button>
              )}
            </div>

            {/* Master Products List (Side-by-side Grid) */}
            <div className="asp-products-scroll-list">
              {loadingProducts ? (
                <div className="asp-state-message" style={{ gridColumn: "1 / -1" }}>
                  <FiLoader className="spin" style={{ marginRight: 6 }} /> Loading products...
                </div>
              ) : masterProducts.length === 0 ? (
                <div className="asp-state-message" style={{ gridColumn: "1 / -1" }}>
                  No products found for the selected category.
                </div>
              ) : (
                masterProducts.map((prod) => {
                  const pid = prod.masterProductId || prod.productId || prod.id;
                  const isSelected =
                    selectedProduct &&
                    (selectedProduct.masterProductId ||
                      selectedProduct.productId ||
                      selectedProduct.id) === pid;

                  const prodIsVeg =
                    prod.isVeg !== undefined
                      ? prod.isVeg
                      : prod.veg !== undefined
                      ? Number(prod.veg) === 1
                      : true;

                  const priceDisplay =
                    prod.merchantPrice ??
                    prod.xlsMerchantPrice ??
                    prod.csvMerchantPrice ??
                    prod.price;

                  return (
                    <div
                      key={pid}
                      className={`asp-product-card-item ${isSelected ? "selected" : ""}`}
                      onClick={() => handleSelectProduct(prod)}
                    >
                      <div className="asp-product-card-left">
                        <div className="asp-product-card-title-row">
                          <span
                            className={`asp-veg-indicator ${prodIsVeg ? "veg" : "non-veg"}`}
                            title={prodIsVeg ? "Veg" : "Non-Veg"}
                          >
                            <span className="asp-veg-circle" />
                          </span>
                          <span className="asp-product-name">
                            {prod.productName || prod.name || prod.masterProductName || "Unnamed Product"}
                          </span>
                        </div>
                        {prod.description && (
                          <div className="asp-product-card-desc">
                            {prod.description}
                          </div>
                        )}
                        {priceDisplay && (
                          <div className="asp-product-price-tag">
                            ₹{priceDisplay}
                          </div>
                        )}
                      </div>

                      <div className="asp-product-card-right">
                        <div className={`asp-select-circle ${isSelected ? "checked" : ""}`}>
                          {isSelected && <FiCheck />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* STEP 3: CONFIGURE PRODUCT DETAILS */}
        {selectedProduct ? (
          <div className="asp-step-card">
            <div className="asp-step-header">
              <div className="asp-step-badge">3</div>
              <div className="asp-step-title-wrap">
                <h3>Product Pricing & Classification</h3>
                <p>Configure price and view food classification</p>
              </div>
              <div className="asp-selected-preview-pill" title={selectedProduct.productName || selectedProduct.name || selectedProduct.masterProductName}>
                <FiCheckCircle style={{ color: "#16a34a" }} />
                <span>{selectedProduct.productName || selectedProduct.name || selectedProduct.masterProductName}</span>
              </div>
            </div>

            <div className="asp-step-body">
              <div className="asp-form-row-2">
                {/* Merchant Price */}
                <div className="asp-form-group asp-pricing-field">
                  <label>
                    Merchant Price (₹) <span className="required">*</span>
                  </label>
                  <div className="asp-input-with-icon">
                    <span className="asp-input-icon">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="asp-input asp-input-padded"
                      placeholder="e.g. 150.00"
                      value={merchantPrice}
                      onChange={(e) => setMerchantPrice(e.target.value)}
                      disabled={saving}
                    />
                  </div>
                </div>

                {/* Food Type (READ ONLY) */}
                <div className="asp-form-group asp-classification-field">
                  <label>Food Classification</label>
                  <div className="asp-readonly-type-badge-wrap">
                    <div className={`asp-readonly-type-badge ${isVeg ? "veg" : "non-veg"}`}>
                      <span className={`asp-veg-circle ${isVeg ? "veg" : "non-veg"}`} />
                      <span>{isVeg ? "Vegetarian (Veg)" : "Non-Vegetarian (Non-Veg)"}</span>
                    </div>
                    <span className="asp-readonly-tag">
                      {productType || selectedProduct?.productType || "FOOD"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="asp-step-card asp-step-disabled">
            <div className="asp-step-header">
              <div className="asp-step-badge disabled">3</div>
              <div className="asp-step-title-wrap">
                <h3>Product Pricing & Classification</h3>
                <p>Select a product above to configure pricing</p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: OPERATING DAYS & HOURS (TIMINGS PER DAY) */}
        {selectedProduct ? (
          <div className="asp-step-card">
            <div className="asp-step-header">
              <div className="asp-step-badge">4</div>
              <div className="asp-step-title-wrap">
                <h3>Product Operating Timings (Days & Hours)</h3>
                <p>Configure custom operating hours for different days of the week</p>
              </div>
            </div>

            <div className="asp-step-body">
              {/* Quick Presets */}
              <div className="asp-timings-presets">
                <span className="asp-presets-label">Quick Presets:</span>
                <button
                  type="button"
                  className="asp-preset-btn"
                  onClick={() => handleApplyPreset("ALL_DAYS")}
                >
                  All Days (09:00 - 22:00)
                </button>
                <button
                  type="button"
                  className="asp-preset-btn"
                  onClick={() => handleApplyPreset("FULL_DAY")}
                >
                  24/7 Full Time
                </button>
                <button
                  type="button"
                  className="asp-preset-btn"
                  onClick={() => handleApplyPreset("WEEKDAYS")}
                >
                  Weekdays (Mon - Fri)
                </button>
                <button
                  type="button"
                  className="asp-preset-btn"
                  onClick={() => handleApplyPreset("WEEKENDS")}
                >
                  Weekends (Sat - Sun)
                </button>
              </div>

              {/* Bulk Time Apply Tool */}
              <div className="asp-bulk-time-bar">
                <span className="asp-bulk-time-label">Bulk Apply Time to Active Days:</span>
                <div className="asp-bulk-time-inputs">
                  <input
                    type="time"
                    className="asp-input asp-bulk-time-input"
                    value={bulkStartTime}
                    onChange={(e) => setBulkStartTime(e.target.value)}
                  />
                  <span>to</span>
                  <input
                    type="time"
                    className="asp-input asp-bulk-time-input"
                    value={bulkEndTime}
                    onChange={(e) => setBulkEndTime(e.target.value)}
                  />
                  <button
                    type="button"
                    className="asp-btn-apply-bulk"
                    onClick={handleApplyBulkTimeToAll}
                  >
                    Apply to Active Days
                  </button>
                </div>
              </div>

              {/* Per-Day Schedule (Different Hours for Different Days) */}
              <div className="asp-per-day-schedule">
                <div className="asp-schedule-header-row">
                  <span>Day of Week</span>
                  <span>Operating Hours (Start - End)</span>
                  <span>Status</span>
                </div>
                {DAYS_OF_WEEK.map((day) => {
                  const dayConfig = daySpecificTimings[day.id] || {
                    enabled: true,
                    timeSlots: [createTimeSlot()],
                  };
                  return (
                    <div
                      key={day.id}
                      className={`asp-day-schedule-row ${dayConfig.enabled ? "active" : "disabled"}`}
                    >
                      <div className="asp-day-schedule-left">
                        <label className="asp-day-checkbox-label">
                          <input
                            type="checkbox"
                            className="asp-day-checkbox"
                            checked={dayConfig.enabled}
                            onChange={() => toggleDayEnabled(day.id)}
                            disabled={saving}
                          />
                          <span className="asp-day-schedule-name">{day.name}</span>
                          <span className="asp-day-schedule-short">({day.short})</span>
                        </label>
                      </div>

                      <div className="asp-day-schedule-middle">
                        {dayConfig.enabled ? (
                          <div className="asp-day-time-slots">
                            {dayConfig.timeSlots.map((slot, slotIndex) => (
                              <div className="asp-day-time-inputs" key={`${day.id}-${slotIndex}`}>
                                <div className="asp-time-field-wrap">
                                  <span className="asp-sub-time-label">Opens</span>
                                  <input
                                    type="time"
                                    className="asp-input asp-day-time-input"
                                    value={slot.startTime}
                                    onChange={(e) =>
                                      handleDayTimeChange(day.id, `${slotIndex}.startTime`, e.target.value)
                                    }
                                    disabled={saving}
                                  />
                                </div>
                                <span className="asp-time-sep">-</span>
                                <div className="asp-time-field-wrap">
                                  <span className="asp-sub-time-label">Closes</span>
                                  <input
                                    type="time"
                                    className="asp-input asp-day-time-input"
                                    value={slot.endTime}
                                    onChange={(e) =>
                                      handleDayTimeChange(day.id, `${slotIndex}.endTime`, e.target.value)
                                    }
                                    disabled={saving}
                                  />
                                </div>
                                {dayConfig.timeSlots.length > 1 && (
                                  <button
                                    type="button"
                                    className="asp-remove-time-slot"
                                    onClick={() => removeTimeSlot(day.id, slotIndex)}
                                    disabled={saving}
                                    aria-label={`Remove ${day.name} time slot ${slotIndex + 1}`}
                                  >
                                    <FiX />
                                  </button>
                                )}
                                {slotIndex === 0 && (
                                  <button
                                    type="button"
                                    className="asp-add-time-slot"
                                    onClick={() => addTimeSlot(day.id)}
                                    disabled={saving}
                                  >
                                    <FiPlus /> Add hours
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="asp-day-disabled-text">Closed on this day</span>
                        )}
                      </div>

                      <div className="asp-day-schedule-right">
                        {dayConfig.enabled ? (
                          <span className="asp-day-active-pill">
                            Active ({dayConfig.timeSlots.length} time slot{dayConfig.timeSlots.length === 1 ? "" : "s"})
                          </span>
                        ) : (
                          <span className="asp-day-off-pill">Closed</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="asp-step-card asp-step-disabled">
            <div className="asp-step-header">
              <div className="asp-step-badge disabled">4</div>
              <div className="asp-step-title-wrap">
                <h3>Product Operating Timings (Days & Hours)</h3>
                <p>Select a product above to configure operating timings</p>
              </div>
            </div>
          </div>
        )}

        {/* BOTTOM ACTION BAR */}
        <div className="asp-bottom-actions-card">
          <button
            type="button"
            className="asp-btn-cancel-large"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="button"
            className="asp-btn-submit-large"
            onClick={handleSave}
            disabled={saving || !selectedProduct}
          >
            {saving ? (
              <>
                <FiLoader className="spin" /> Adding Product to Outlet...
              </>
            ) : (
              <>
                <FiPlus /> Add "{selectedProduct?.productName || selectedProduct?.name || selectedProduct?.masterProductName || "Product"}" to Outlet
              </>
            )}
          </button>
        </div>
      </div>


    </div>
  );
}

export default AddSingleProduct;
