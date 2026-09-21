import React, { useEffect, useState } from "react";
import "../../styles/OutletCategories.css";

import {
  getOutletById,
  getAdminOutletDetails,
  addCategoryToOutlet,
  createOutletUnavailability,
  restoreOutletAvailability,
} from "../../services/outletService";
import {
  getAllCategories,
  mapFromMasterCategory,
} from "../../services/masterProductsService";
import {
  FiFolderPlus,
  FiPlus,
  FiX,
  FiLoader,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";

const getCategoryId = (category) =>
  category?.categoryId ?? category?.category_id ?? category?.id;

const getOutletCategoryId = (category) =>
  category?.outletCategoryId ??
  category?.outlet_category_id;

const isCategoryEnabled = (category) => {
  const value = category?.isToggle ?? category?.is_toggle;
  if (value !== undefined && value !== null) {
    return value === true || value === "true" || value === "Y" || value === 1;
  }
  return category?.isAvailable !== false;
};

const OutletCategories = ({ outlet }) => {
  const [categories, setCategories] = useState([]);

  const [expandedCategoryId, setExpandedCategoryId] = useState(null);

  const [unavailabilityData, setUnavailabilityData] = useState({});

  const [selectedCategory, setSelectedCategory] = useState(null);

  const [savingUnavailability, setSavingUnavailability] =
    useState(false);
  const [mappingCategoryId, setMappingCategoryId] = useState(null);
  const [mappedCategoryIds, setMappedCategoryIds] = useState({});

  // Create Category state
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [masterCategories, setMasterCategories] = useState([]);
  const [loadingMasterCategories, setLoadingMasterCategories] = useState(false);
  const [selectedMasterCatId, setSelectedMasterCatId] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [createCategoryError, setCreateCategoryError] = useState("");
  const [createCategorySuccess, setCreateCategorySuccess] = useState("");

  const [unavailabilityForm, setUnavailabilityForm] = useState({
    fromDate: "",
    toDate: "",
    reason: "",
  });

  const [unavailabilityModal, setUnavailabilityModal] = useState({
    open: false,
    category: null,
    mode: "create",
  });

  // ============================================================
  // LOAD CATEGORIES
  // ============================================================

  useEffect(() => {
    loadCategories();
  }, [outlet]);

  // ============================================================
  // LOAD CATEGORY DATA FROM OUTLET DETAILS API
  // ============================================================

  const loadCategories = async () => {
    if (!outlet?.outletId) {
      setCategories([]);
      setMappedCategoryIds({});
      return;
    }

    try {
      setMappedCategoryIds({});
      console.log(
        "Loading categories for outlet:",
        outlet.outletId
      );

      let response;
      try {
        response = await getOutletById(Number(outlet.outletId));
      } catch (err) {
        response = await getAdminOutletDetails(Number(outlet.outletId));
      }

      console.log(
        "CATEGORY OUTLET DETAILS RESPONSE:",
        response
      );

      const outletData =
        response?.data?.outletId != null
          ? response.data
          : response?.outletId != null
          ? response
          : response?.data?.data?.outletId != null
          ? response.data.data
          : response?.data?.data || response?.data || response;

      const categoryList = Array.isArray(
        outletData?.categories
      )
        ? outletData.categories
        : [];

      console.log(
        "CATEGORIES FROM OUTLET:",
        categoryList
      );

      setCategories(categoryList);

      // ----------------------------------------------------------
      // Load previously stored unavailability information
      // ----------------------------------------------------------

      const stored =
        localStorage.getItem(
          "jippy_category_unavailability"
        );

      if (stored) {
        try {
          setUnavailabilityData(JSON.parse(stored));
        } catch (error) {
          console.error(
            "Failed to parse category unavailability:",
            error
          );
        }
      }
    } catch (error) {
      console.error(
        "Failed to load outlet categories:",
        error
      );

      // Fallback to categories already present in outlet prop
      if (Array.isArray(outlet?.categories)) {
        setCategories(outlet.categories);
      } else {
        setCategories([]);
      }
    }
  };

  // ============================================================
  // EXPAND / COLLAPSE CATEGORY
  // ============================================================

  const handleExpandCategory = (categoryId) => {
    setExpandedCategoryId((prev) =>
      Number(prev) === Number(categoryId)
        ? null
        : categoryId
    );
  };

  // ============================================================
  // FORMAT DATE
  // ============================================================

  const formatUnavailabilityDate = (dateValue) => {
    if (!dateValue) return "-";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return dateValue;
    }

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // ============================================================
  // OPEN CREATE / RESTORE MODAL
  // ============================================================

  const handleCategoryToggle = (category) => {
    if (!getOutletCategoryId(category)) {
      console.error("Category ID not found");
      return;
    }

    // ==========================================================
    // ON → OFF
    // ==========================================================

    if (isCategoryEnabled(category)) {
      setSelectedCategory(category);

      setUnavailabilityForm({
        fromDate: "",
        toDate: "",
        reason: "",
      });

      setUnavailabilityModal({
        open: true,
        category: category,
        mode: "create",
      });

      return;
    }

    // ==========================================================
    // OFF → ON
    // ==========================================================

    setSelectedCategory(category);

    setUnavailabilityModal({
      open: true,
      category: category,
      mode: "restore",
    });
  };

  const handleMapProductsToggle = async (category) => {
    const outletCategoryId = Number(getOutletCategoryId(category));

    if (!outletCategoryId || mappingCategoryId !== null) {
      return;
    }

    setMappingCategoryId(outletCategoryId);

    try {
      const response = await mapFromMasterCategory(outletCategoryId);
      console.log(
        "[CATEGORY-MAP] map-from-master-category response:",
        response
      );
      setMappedCategoryIds((previous) => ({
        ...previous,
        [outletCategoryId]: true,
      }));
    } catch (error) {
      console.error(
        "[CATEGORY-MAP] map-from-master-category error:",
        error
      );
      alert(
        error?.response?.data?.message ||
          "Failed to map master products to this category."
      );
    } finally {
      setMappingCategoryId(null);
    }
  };

  // ============================================================
  // EDIT EXISTING UNAVAILABILITY
  // ============================================================

  const handleEditUnavailability = (category) => {
    const categoryId = getCategoryId(category);

    const existing =
      unavailabilityData[categoryId];

    if (!existing) {
      console.warn(
        "No category unavailability data found:",
        categoryId
      );
      return;
    }

    setSelectedCategory(category);

    setUnavailabilityForm({
      fromDate: existing.fromDate || "",
      toDate: existing.toDate || "",
      reason: existing.reason || "",
    });

    setUnavailabilityModal({
      open: true,
      category: category,
      mode: "edit",
    });
  };

  // ============================================================
  // FORM INPUT CHANGE
  // ============================================================

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setUnavailabilityForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ============================================================
  // SAVE CATEGORY UNAVAILABILITY
  // CREATE / EDIT
  // ============================================================

  const handleConfirmUnavailability = async () => {
    const category =
      unavailabilityModal.category;

    if (!category) {
      console.error("No category selected");
      return;
    }

    const {
      fromDate,
      toDate,
      reason,
    } = unavailabilityForm;

    // ==========================================================
    // VALIDATION
    // ==========================================================

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
      new Date(fromDate) >=
      new Date(toDate)
    ) {
      alert(
        "To Date & Time must be after From Date & Time."
      );
      return;
    }

    try {
      setSavingUnavailability(true);

      // ========================================================
      // POST CATEGORY UNAVAILABILITY
      // ========================================================

      const response = await createOutletUnavailability({
        type: "OUTLET_CATEGORY",
        unavailabilityId: Number(getOutletCategoryId(category)),
        unavailabilityFromDate: fromDate,
        unavailabilityToDate: toDate,
        reason: reason.trim(),
      });

      console.log(
        "CATEGORY UNAVAILABILITY RESPONSE:",
        response
      );

      // ========================================================
      // SAVE LOCAL UI DATA
      // ========================================================

      const savedData = {
        fromDate,
        toDate,
        reason: reason.trim(),
        markedOn: new Date().toISOString(),
      };

      setUnavailabilityData((prev) => {
        const updated = {
          ...prev,
          [getCategoryId(category)]: savedData,
        };

        localStorage.setItem(
          "jippy_category_unavailability",
          JSON.stringify(updated)
        );

        return updated;
      });

      // ========================================================
      // UPDATE CATEGORY TOGGLE
      // ========================================================

      setCategories((prev) =>
        prev.map((item) =>
          Number(getCategoryId(item)) ===
          Number(getCategoryId(category))
            ? {
                ...item,
                isToggle: false,
                isAvailable: false,
              }
            : item
        )
      );

      // ========================================================
      // CLOSE MODAL
      // ========================================================

      setUnavailabilityModal({
        open: false,
        category: null,
        mode: "create",
      });

      setSelectedCategory(null);

      setUnavailabilityForm({
        fromDate: "",
        toDate: "",
        reason: "",
      });

      // Keep expanded
      setExpandedCategoryId(
        Number(getCategoryId(category))
      );
    } catch (error) {
      console.error(
        "Failed to mark category unavailable:",
        error
      );

      alert(
        error?.response?.data?.message ||
          "Failed to mark category unavailable."
      );
    } finally {
      setSavingUnavailability(false);
    }
  };

  // ============================================================
  // RESTORE CATEGORY
  // OFF → ON
  // ============================================================

  const handleConfirmCategoryRestore =
    async () => {
      if (!getOutletCategoryId(selectedCategory)) {
        return;
      }

      try {
        setSavingUnavailability(true);

        const response = await restoreOutletAvailability({
          type: "OUTLET_CATEGORY",
          unavailabilityId: Number(getOutletCategoryId(selectedCategory)),
        });

        console.log(
          "CATEGORY RESTORE RESPONSE:",
          response
        );

        // ======================================================
        // TURN CATEGORY ON
        // ======================================================

        setCategories((prev) =>
          prev.map((item) =>
            Number(getCategoryId(item)) ===
            Number(getCategoryId(selectedCategory))
              ? {
                  ...item,
                  isToggle: true,
                  isAvailable: true,
                }
              : item
          )
        );

        // ======================================================
        // REMOVE STORED UNAVAILABILITY
        // ======================================================

        setUnavailabilityData((prev) => {
          const updated = {
            ...prev,
          };

          delete updated[
            getCategoryId(selectedCategory)
          ];

          localStorage.setItem(
            "jippy_category_unavailability",
            JSON.stringify(updated)
          );

          return updated;
        });

        // ======================================================
        // CLOSE MODAL
        // ======================================================

        setUnavailabilityModal({
          open: false,
          category: null,
          mode: "create",
        });

        setSelectedCategory(null);

        setUnavailabilityForm({
          fromDate: "",
          toDate: "",
          reason: "",
        });

        setExpandedCategoryId(null);
      } catch (error) {
        console.error(
          "CATEGORY RESTORE ERROR:",
          error
        );

        alert(
          error?.response?.data?.message ||
            "Failed to restore category availability."
        );
      } finally {
        setSavingUnavailability(false);
      }
    };

  // ============================================================
  // FETCH MASTER CATEGORIES FROM getAllCategories
  // ============================================================

  const fetchMasterCategories = async () => {
    try {
      setLoadingMasterCategories(true);
      const res = await getAllCategories("ALL");
      const list = res.data?.data || res.data || [];
      setMasterCategories(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Error fetching master categories from getAllCategories:", err);
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

  // ============================================================
  // CREATE CATEGORY
  // ============================================================

  const handleCreateCategory = async (e) => {
    if (e) e.preventDefault();

    if (!selectedMasterCatId) {
      setCreateCategoryError("Please select a category from the list.");
      return;
    }

    if (!outlet?.outletId) {
      setCreateCategoryError("No outlet selected. Cannot add category.");
      return;
    }

    try {
      setCreatingCategory(true);
      setCreateCategoryError("");

      const res = await addCategoryToOutlet(
        outlet.outletId,
        selectedMasterCatId
      );
      console.log("Add category to outlet response:", res);

      const catName = newCategoryName || `Category #${selectedMasterCatId}`;
      setCreateCategorySuccess(`Category "${catName}" added to outlet successfully!`);

      // Refresh categories list & master categories list
      await Promise.all([loadCategories(), fetchMasterCategories()]);

      setTimeout(() => {
        setCreateCategorySuccess("");
        setShowCreateCategoryModal(false);
        setNewCategoryName("");
        setSelectedMasterCatId("");
      }, 1000);
    } catch (err) {
      console.error("Error adding category to outlet:", err);
      setCreateCategoryError(
        err?.response?.data?.message || err?.message || "Failed to add category to outlet. Please try again."
      );
    } finally {
      setCreatingCategory(false);
    }
  };

  // ============================================================
  // CLOSE MODAL
  // ============================================================

  const closeUnavailabilityModal = () => {
    if (savingUnavailability) return;

    setUnavailabilityModal({
      open: false,
      category: null,
      mode: "create",
    });

    setSelectedCategory(null);

    setUnavailabilityForm({
      fromDate: "",
      toDate: "",
      reason: "",
    });
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="jippy-category-screen">

      {/* Top Header / Action Toolbar */}
      <div className="jippy-categories-toolbar">
        <div className="jippy-categories-toolbar-left">
          <div className="jippy-categories-badge">
            <FiFolderPlus size={16} />
            <span>
              {categories.length} {categories.length === 1 ? "Category" : "Categories"}
            </span>
          </div>
        </div>
      </div>

      <div className="jippy-category-table-container">

        <table className="jippy-category-data-table">

          <thead>
            <tr>
              <th className="jippy-category-expand-column">
                #
              </th>

              <th className="jippy-category-name-column">
                Category
              </th>

              <th className="jippy-category-products-column">
                Products
              </th>

              <th className="jippy-category-available-column">
                Availability
              </th>

              <th className="jippy-category-toggle-column">
                Toggle
              </th>

              <th className="jippy-category-map-column">
                Map Products
              </th>
            </tr>
          </thead>

          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  className="jippy-category-empty-cell"
                >
                  No categories found for this outlet.
                </td>
              </tr>
            ) : (
              categories.map((category) => {
                const categoryId = getCategoryId(category);
                const categoryEnabled = isCategoryEnabled(category);
                const outletCategoryId = Number(
                  getOutletCategoryId(category)
                );

                const isExpanded =
                  Number(expandedCategoryId) ===
                  Number(categoryId);

                const existingUnavailability =
                  unavailabilityData[
                    categoryId
                  ];

                const isUnavailable =
                  !categoryEnabled &&
                  existingUnavailability;

                return (
                  <React.Fragment
                    key={categoryId}
                  >

                    {/* ==================================================
                        CATEGORY ROW
                    ================================================== */}

                    <tr
                      className={
                        isUnavailable
                          ? "jippy-category-unavailable-row"
                          : ""
                      }
                    >

                      <td className="jippy-category-expand-cell">

                        <button
                          type="button"
                          className="jippy-category-expand-button"
                          onClick={() =>
                            handleExpandCategory(
                              categoryId
                            )
                          }
                        >
                          {isExpanded
                            ? "−"
                            : "+"}
                        </button>

                      </td>

                      <td className="jippy-category-name-cell">
                        {category.categoryName || "-"}
                      </td>

                      <td className="jippy-category-products-cell">
                        {category.productCount ??
                          category.productsCount ??
                          category.totalProducts ??
                          (Array.isArray(category.products)
                            ? category.products.length
                            : Array.isArray(category.items)
                            ? category.items.length
                            : 0)}
                      </td>

                      <td className="jippy-category-available-cell">

                        <span
                          className={
                            category.isAvailable
                              ? "jippy-category-available-badge"
                              : "jippy-category-unavailable-badge"
                          }
                        >
                          {category.isAvailable
                            ? "Available"
                            : "Unavailable"}
                        </span>

                      </td>

                      <td className="jippy-category-toggle-cell">

                        <button
                          type="button"
                          aria-label={
                            categoryEnabled
                              ? "Turn category off"
                              : "Turn category on"
                          }
                          className={
                            categoryEnabled
                              ? "jippy-category-switch jippy-category-switch-on"
                              : "jippy-category-switch jippy-category-switch-off"
                          }
                          onClick={() =>
                            handleCategoryToggle(
                              category
                            )
                          }
                        >
                          <span></span>
                        </button>

                      </td>

                      <td className="jippy-category-map-cell">
                        <button
                          type="button"
                          aria-label={
                            mappedCategoryIds[
                              outletCategoryId
                            ]
                              ? "Master products mapped"
                              : "Map master products"
                          }
                          className={
                            mappedCategoryIds[
                              outletCategoryId
                            ]
                              ? "jippy-category-switch jippy-category-switch-on"
                              : "jippy-category-switch jippy-category-switch-off"
                          }
                          onClick={() => handleMapProductsToggle(category)}
                          disabled={
                            mappingCategoryId !== null ||
                            Boolean(
                              mappedCategoryIds[
                                outletCategoryId
                              ]
                            )
                          }
                        >
                          <span></span>
                        </button>
                        {mappingCategoryId ===
                          outletCategoryId && (
                          <FiLoader
                            className="jippy-category-map-loader"
                            aria-label="Mapping products"
                          />
                        )}
                      </td>

                    </tr>

                    {/* ==================================================
                        EXPANDED UNAVAILABILITY DETAILS
                    ================================================== */}

                    {isExpanded &&
                      existingUnavailability && (
                        <tr className="jippy-category-details-row">

                          <td colSpan="6">

                            <div className="jippy-category-unavailability-panel">

                              <div className="jippy-category-unavailability-header">

                                <div>
                                  <strong>
                                    Category Unavailability
                                  </strong>

                                  <span>
                                    {" "}
                                    (Currently
                                    Unavailable)
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  className="jippy-category-edit-button"
                                  onClick={() =>
                                    handleEditUnavailability(
                                      category
                                    )
                                  }
                                >
                                  Edit Unavailability
                                </button>

                              </div>

                              <div className="jippy-category-unavailability-grid">

                                <div>
                                  <label>
                                    From Date &amp;
                                    Time
                                  </label>

                                  <strong>
                                    {formatUnavailabilityDate(
                                      existingUnavailability.fromDate
                                    )}
                                  </strong>
                                </div>

                                <div>
                                  <label>
                                    To Date &amp;
                                    Time
                                  </label>

                                  <strong>
                                    {formatUnavailabilityDate(
                                      existingUnavailability.toDate
                                    )}
                                  </strong>
                                </div>

                                <div>
                                  <label>
                                    Reason
                                  </label>

                                  <strong>
                                    {
                                      existingUnavailability.reason
                                    }
                                  </strong>
                                </div>

                                <div>
                                  <label>
                                    Marked On
                                  </label>

                                  <strong>
                                    {formatUnavailabilityDate(
                                      existingUnavailability.markedOn
                                    )}
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
            )}
          </tbody>

        </table>

      </div>

      {/* ============================================================
          CREATE / EDIT UNAVAILABILITY MODAL
      ============================================================ */}

      {unavailabilityModal.open &&
        (unavailabilityModal.mode ===
          "create" ||
          unavailabilityModal.mode ===
            "edit") && (

          <div className="jippy-category-modal-overlay">

            <div className="jippy-category-unavailability-modal">

              <div className="jippy-category-modal-header">

                <div>
                  <h2>
                    {unavailabilityModal.mode ===
                    "edit"
                      ? "Edit Category Unavailability"
                      : "Mark Category as Unavailable"}
                  </h2>

                  <p>
                    {
                      unavailabilityModal
                        .category
                        ?.categoryName
                    }
                  </p>
                </div>

                <button
                  type="button"
                  className="jippy-category-modal-close"
                  onClick={
                    closeUnavailabilityModal
                  }
                >
                  ×
                </button>

              </div>

              <div className="jippy-category-modal-info">
                Please select the unavailability
                period and reason. This category
                will be unavailable during this
                time.
              </div>

              <div className="jippy-category-form-row">

                <div className="jippy-category-form-group">

                  <label>
                    From Date &amp; Time *
                  </label>

                  <input
                    type="datetime-local"
                    name="fromDate"
                    value={
                      unavailabilityForm.fromDate
                    }
                    onChange={handleFormChange}
                  />

                </div>

                <div className="jippy-category-form-group">

                  <label>
                    To Date &amp; Time *
                  </label>

                  <input
                    type="datetime-local"
                    name="toDate"
                    value={
                      unavailabilityForm.toDate
                    }
                    onChange={handleFormChange}
                  />

                </div>

              </div>

              <div className="jippy-category-form-group">

                <label>
                  Reason *
                </label>

                <textarea
                  name="reason"
                  value={
                    unavailabilityForm.reason
                  }
                  onChange={handleFormChange}
                  placeholder="Enter reason for category unavailability"
                  rows="4"
                />

              </div>

              <div className="jippy-category-modal-actions">

                <button
                  type="button"
                  className="jippy-category-cancel-button"
                  onClick={
                    closeUnavailabilityModal
                  }
                  disabled={savingUnavailability}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="jippy-category-confirm-button"
                  onClick={
                    handleConfirmUnavailability
                  }
                  disabled={savingUnavailability}
                >
                  {savingUnavailability
                    ? "Saving..."
                    : unavailabilityModal.mode ===
                      "edit"
                    ? "Update & Turn Off"
                    : "Confirm & Turn Off"}
                </button>

              </div>

            </div>

          </div>
        )}

      {/* ============================================================
          RESTORE MODAL
      ============================================================ */}

      {unavailabilityModal.open &&
        unavailabilityModal.mode ===
          "restore" && (

          <div className="jippy-category-modal-overlay">

            <div className="jippy-category-restore-modal">

              <div className="jippy-category-modal-header">

                <div>
                  <h2>
                    Make Category Available
                  </h2>

                  <p>
                    {
                      unavailabilityModal
                        .category
                        ?.categoryName
                    }
                  </p>
                </div>

                <button
                  type="button"
                  className="jippy-category-modal-close"
                  onClick={
                    closeUnavailabilityModal
                  }
                >
                  ×
                </button>

              </div>

              <div className="jippy-category-modal-info">
                This category is currently
                unavailable. Do you want to make
                this category available again?
              </div>

              <div className="jippy-category-restore-actions">

                <button
                  type="button"
                  className="jippy-category-cancel-button"
                  onClick={
                    closeUnavailabilityModal
                  }
                  disabled={savingUnavailability}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="jippy-category-confirm-button"
                  onClick={
                    handleConfirmCategoryRestore
                  }
                  disabled={savingUnavailability}
                >
                  {savingUnavailability
                    ? "Restoring..."
                    : "Confirm & Turn ON"}
                </button>

              </div>

            </div>

          </div>
        )}

      {/* ======================================================
          CREATE CATEGORY MODAL
          ====================================================== */}
      {showCreateCategoryModal && (
        <div
          className="jippy-category-modal-backdrop"
          onClick={() => !creatingCategory && setShowCreateCategoryModal(false)}
        >
          <div
            className="jippy-create-category-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="jippy-create-category-header">
              <div className="jippy-create-category-title">
                <FiFolderPlus className="jippy-create-category-icon" />
                <h3>Create New Category</h3>
              </div>
              <button
                type="button"
                className="jippy-category-modal-close"
                onClick={() => setShowCreateCategoryModal(false)}
                disabled={creatingCategory}
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleCreateCategory}>
              <div className="jippy-create-category-body">
                {createCategoryError && (
                  <div className="jippy-cat-alert-error">
                    <FiAlertCircle />
                    <span>{createCategoryError}</span>
                  </div>
                )}
                {createCategorySuccess && (
                  <div className="jippy-cat-alert-success">
                    <FiCheckCircle />
                    <span>{createCategorySuccess}</span>
                  </div>
                )}

                {/* Dropdown to pick existing categories from getAllCategories */}
                <div className="jippy-create-category-field">
                  <label>Select from Existing Categories</label>
                  <select
                    className="jippy-create-category-input"
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

                <div className="jippy-create-category-field">
                  <label>
                    Category Name <span className="jippy-required">*</span>
                  </label>
                  <input
                    type="text"
                    className="jippy-create-category-input"
                    placeholder="e.g. Beverages, Starters, Desserts"
                    value={newCategoryName}
                    onChange={(e) => {
                      setNewCategoryName(e.target.value);
                      setSelectedMasterCatId("");
                    }}
                    autoFocus
                    disabled={creatingCategory}
                  />
                  <small className="jippy-field-hint">
                    This name is auto-filled when you select a category above.
                  </small>
                </div>
              </div>

              <div className="jippy-create-category-footer">
                <button
                  type="button"
                  className="jippy-category-cancel-button"
                  onClick={() => setShowCreateCategoryModal(false)}
                  disabled={creatingCategory}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="jippy-category-submit-button"
                  disabled={creatingCategory || !selectedMasterCatId}
                >
                  {creatingCategory ? (
                    <>
                      <FiLoader className="jippy-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <FiPlus />
                      <span>Add to Outlet</span>
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
};

export default OutletCategories;