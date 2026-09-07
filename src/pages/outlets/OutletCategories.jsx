import React, { useEffect, useState } from "react";
import "../styles/OutletCategories.css";

import {
  getOutletDetails,
  setCategoryUnavailable,
  restoreCategoryUnavailable,
} from "../services/outletListService";

const OutletCategories = ({ outlet }) => {
  const [categories, setCategories] = useState([]);

  const [expandedCategoryId, setExpandedCategoryId] = useState(null);

  const [unavailabilityData, setUnavailabilityData] = useState({});

  const [selectedCategory, setSelectedCategory] = useState(null);

  const [savingUnavailability, setSavingUnavailability] =
    useState(false);

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
      return;
    }

    try {
      console.log(
        "Loading categories for outlet:",
        outlet.outletId
      );

      const response = await getOutletDetails(
        Number(outlet.outletId)
      );

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
    if (!category?.categoryId) {
      console.error("Category ID not found");
      return;
    }

    // ==========================================================
    // ON → OFF
    // ==========================================================

    if (category.isToggle === true) {
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

  // ============================================================
  // EDIT EXISTING UNAVAILABILITY
  // ============================================================

  const handleEditUnavailability = (category) => {
    const categoryId = category.categoryId;

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

      const response =
        await setCategoryUnavailable(
          Number(category.categoryId),
          fromDate,
          toDate,
          reason.trim()
        );

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
        markedOn:
          response?.timestamp ||
          new Date().toISOString(),
      };

      setUnavailabilityData((prev) => {
        const updated = {
          ...prev,
          [category.categoryId]: savedData,
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
          Number(item.categoryId) ===
          Number(category.categoryId)
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
        Number(category.categoryId)
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
      if (!selectedCategory?.categoryId) {
        return;
      }

      try {
        setSavingUnavailability(true);

        const response =
          await restoreCategoryUnavailable(
            Number(selectedCategory.categoryId)
          );

        console.log(
          "CATEGORY RESTORE RESPONSE:",
          response
        );

        // ======================================================
        // TURN CATEGORY ON
        // ======================================================

        setCategories((prev) =>
          prev.map((item) =>
            Number(item.categoryId) ===
            Number(
              selectedCategory.categoryId
            )
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
            selectedCategory.categoryId
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

      <div className="jippy-category-table-container">

        <table className="jippy-category-data-table">

          <thead>
            <tr>
              <th className="jippy-category-expand-column">
                {/* Expand */}
              </th>

              <th className="jippy-category-id-column">
                Category ID
              </th>

              <th className="jippy-category-name-column">
                Category Name
              </th>

              <th className="jippy-category-available-column">
                isAvailable
              </th>

              <th className="jippy-category-toggle-column">
                isToggle
              </th>
            </tr>
          </thead>

          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  className="jippy-category-empty-cell"
                >
                  No categories found for this outlet.
                </td>
              </tr>
            ) : (
              categories.map((category) => {
                const categoryId =
                  category.categoryId;

                const isExpanded =
                  Number(expandedCategoryId) ===
                  Number(categoryId);

                const existingUnavailability =
                  unavailabilityData[
                    categoryId
                  ];

                const isUnavailable =
                  category.isToggle === false &&
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

                      <td className="jippy-category-id-cell">
                        {category.categoryId}
                      </td>

                      <td className="jippy-category-name-cell">
                        {category.categoryName}
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
                            category.isToggle
                              ? "Turn category off"
                              : "Turn category on"
                          }
                          className={
                            category.isToggle
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

                    </tr>

                    {/* ==================================================
                        EXPANDED UNAVAILABILITY DETAILS
                    ================================================== */}

                    {isExpanded &&
                      existingUnavailability && (
                        <tr className="jippy-category-details-row">

                          <td colSpan="5">

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

    </div>
  );
};

export default OutletCategories;