import React, { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import { getProductsByOutlet } from "../../services/promotionService";

import "../../styles/PlansStatus.css";

const EMPTY_COUNTS = {
  active: 0,
  scheduled: 0,
  ended: 0,
  total: 0,
};

const PlansStatus = ({
  outlets = [],
  loadingOutlets = false,
}) => {
  /* =========================================================
     OUTLET
  ========================================================= */

  const [selectedOutlet, setSelectedOutlet] = useState("");
  const [outletSearch, setOutletSearch] = useState("");
  const [showOutletDropdown, setShowOutletDropdown] =
    useState(false);

  /* =========================================================
     PLANS
  ========================================================= */

  const [plans, setPlans] = useState([]);

  const [counts, setCounts] = useState(EMPTY_COUNTS);

  const [selectedStatus, setSelectedStatus] =
    useState("ALL");

  /* =========================================================
     PAGINATION
  ========================================================= */

  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const pageSize = 10;

  /* =========================================================
     LOADING / ERROR
  ========================================================= */

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* =========================================================
     PLAN TYPES
  ========================================================= */

  const [planTypes, setPlanTypes] = useState([]);

  /* =========================================================
     EDIT
  ========================================================= */

  const [showEditModal, setShowEditModal] =
    useState(false);

  const [editingPlan, setEditingPlan] =
    useState(null);

  const [editLoading, setEditLoading] =
    useState(false);

  const [savingEdit, setSavingEdit] =
    useState(false);

  /* =========================================================
     EDIT — APPLIES ON (products / categories)

     The PUT /promotion-plans/{id} payload needs
     productIds / outletCategoryIds, and the person editing
     should see real names, not raw ids. This mirrors the
     "Applies On" logic in PromotionForm.jsx, scoped to
     whichever outlet the plan being edited actually
     belongs to.
  ========================================================= */

  const [editApplyTo, setEditApplyTo] =
    useState("ALL");

  const [editProducts, setEditProducts] =
    useState([]);

  const [editLoadingProducts, setEditLoadingProducts] =
    useState(false);

  const [editSelectedCategories, setEditSelectedCategories] =
    useState([]);

  const [editSelectedProducts, setEditSelectedProducts] =
    useState([]);

  /* =========================================================
     DELETE
  ========================================================= */

  const [deletingId, setDeletingId] =
    useState(null);

  /* =========================================================
     HELPERS
  ========================================================= */

  const getOutletId = (outlet) =>
    outlet?.outletId ??
    outlet?.id ??
    outlet?.outletID;

  const getOutletName = (outlet) =>
    outlet?.outletName ??
    outlet?.name ??
    outlet?.outlet_name ??
    `Outlet ${getOutletId(outlet)}`;

  /* Same id/name/category helpers as PromotionForm.jsx,
     used here to turn productIds/outletCategoryIds back
     into readable names for the edit modal. */

  const getItemId = (item) =>
    item?.productId ??
    item?.categoryId ??
    item?.id ??
    item?.foodId;

  const getItemName = (item) =>
    item?.productName ??
    item?.categoryName ??
    item?.foodName ??
    item?.name ??
    "Unnamed";

  const getItemCategoryName = (product) =>
    product?.categoryName ??
    product?.category?.categoryName ??
    product?.category?.name ??
    product?.category_name ??
    "Other";

  const formatDate = (date) => {
    if (!date) return "-";

    const parts = String(date).split("-");

    if (parts.length !== 3) {
      return date;
    }

    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  };

  const formatTime = (time) => {
    if (!time) return "-";

    const value = String(time);

    const parts = value.split(":");

    if (parts.length < 2) {
      return value;
    }

    let hour = Number(parts[0]);
    const minute = parts[1];

    const period = hour >= 12 ? "PM" : "AM";

    hour = hour % 12 || 12;

    return `${String(hour).padStart(
      2,
      "0"
    )}:${minute} ${period}`;
  };

  const formatAmount = (plan) => {
    if (plan?.offerAmount === null ||
        plan?.offerAmount === undefined) {
      return "-";
    }

    const type = String(
      plan?.offerType || ""
    ).toUpperCase();

    if (
      type === "% OFF" ||
      type === "PERCENTAGE" ||
      type === "PERCENT"
    ) {
      return `${plan.offerAmount}%`;
    }

    return `₹${plan.offerAmount}`;
  };

  const getPlanTypeName = (plan) => {
    if (plan?.promotionPlanType) {
      return plan.promotionPlanType;
    }

    if (plan?.promotionPlanTypeId) {
      const type = planTypes.find(
        (item) =>
          String(
            item.promotionPlanTypesId
          ) ===
          String(
            plan.promotionPlanTypeId
          )
      );

      return (
        type?.planName ||
        `Type ${plan.promotionPlanTypeId}`
      );
    }

    return "-";
  };

  /* =========================================================
     FILTERED OUTLETS
  ========================================================= */

  const filteredOutlets = useMemo(() => {
    const search = outletSearch
      .trim()
      .toLowerCase();

    if (!search) {
      return outlets;
    }

    return outlets.filter((outlet) =>
      getOutletName(outlet)
        .toLowerCase()
        .includes(search)
    );
  }, [outlets, outletSearch]);

  /* =========================================================
     FETCH PLAN TYPES
  ========================================================= */

  const fetchPlanTypes = async () => {
    try {
      const response = await api.get(
        "/api/fm/promotion-plan-types"
      );

      const data =
        response.data?.data ||
        response.data ||
        [];

      setPlanTypes(
        Array.isArray(data) ? data : []
      );
    } catch (err) {
      console.error(
        "Failed to fetch promotion plan types:",
        err
      );
    }
  };

  /* =========================================================
     FETCH AREA
  ========================================================= */

  const fetchAreaName = async (areaId) => {
    if (!areaId) {
      return "-";
    }

    try {
      const response = await api.get(
        "/api/fm/location/findAreaById",
        {
          params: {
            areaId,
          },
        }
      );

      return (
        response.data?.data ||
        response.data ||
        "-"
      );
    } catch (err) {
      console.error(
        `Failed to fetch area ${areaId}:`,
        err
      );

      return "-";
    }
  };

  /* =========================================================
     FETCH COMPLETE PLAN DETAILS
  ========================================================= */

  const fetchCompletePlan = async (plan) => {
    try {
      const [
        detailResponse,
        scheduleResponse,
      ] = await Promise.all([
        api.get(
          `/api/fm/promotion-plans/${plan.promotionPlanId}`
        ),

        api.get(
          `/api/fm/promotion-plans/${plan.promotionPlanId}/schedule-details`
        ),
      ]);

      const detail =
        detailResponse.data?.data ||
        detailResponse.data ||
        {};

      const schedule =
        scheduleResponse.data?.data ||
        scheduleResponse.data ||
        {};

      const areaName =
        await fetchAreaName(
          schedule?.areaId
        );

      return {
        ...plan,
        ...detail,
        ...schedule,
        areaName,
      };
    } catch (err) {
      console.error(
        `Failed to fetch details for plan ${plan.promotionPlanId}:`,
        err
      );

      return {
        ...plan,
        areaName: "-",
      };
    }
  };

  /* =========================================================
     FETCH PLANS + COUNTS
  ========================================================= */

  const fetchStatus = async (
    outletId,
    page = 0,
    status = selectedStatus
  ) => {
    if (!outletId) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [
        plansResponse,
        countsResponse,
      ] = await Promise.all([
        api.get(
          `/api/fm/promotion-plans/outlets/${outletId}`,
          {
            params: {
              status,
              page,
              size: pageSize,
              sortBy: "promotionPlanId",
              direction: "DESC",
            },
          }
        ),

        api.get(
          `/api/fm/promotion-plans/outlets/${outletId}/counts`
        ),
      ]);

      const plansData =
        plansResponse.data?.data ||
        plansResponse.data ||
        {};

      const basicPlans =
        plansData?.content || [];

      setTotalPages(
        plansData?.totalPages || 0
      );

      setTotalElements(
        plansData?.totalElements || 0
      );

      /*
       * The outlet listing API does not return:
       * - promotionPlanType
       * - minimumOrderValue
       * - areaId
       * - start time
       * - end time
       *
       * So fetch the complete information for
       * every displayed promotion plan.
       */

      const completePlans =
        await Promise.all(
          basicPlans.map((plan) =>
            fetchCompletePlan({
              ...plan,
              /*
               * Every plan in this list belongs to the
               * outlet we just queried, but the plan
               * object itself (and even /promotion-plans/{id})
               * doesn't reliably echo outletId back. Stamp
               * it on here so it's never lost — this is
               * what the edit payload's outletId relies on.
               */
              outletId: plan.outletId ?? outletId,
            })
          )
        );

      setPlans(completePlans);

      setCounts(
        countsResponse.data?.data ||
          countsResponse.data ||
          EMPTY_COUNTS
      );
    } catch (err) {
      console.error(err);

      setPlans([]);
      setTotalPages(0);
      setTotalElements(0);

      setError(
        err.response?.data?.message ||
          "Unable to fetch promotion status."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    fetchPlanTypes();
  }, []);

  /* =========================================================
     SET FIRST OUTLET
  ========================================================= */

  useEffect(() => {
    if (!outlets?.length) {
      setSelectedOutlet("");
      return;
    }

    const firstOutletId =
      getOutletId(outlets[0]);

    if (!selectedOutlet) {
      setSelectedOutlet(firstOutletId);
      setCurrentPage(0);
      setSelectedStatus("ALL");

      fetchStatus(
        firstOutletId,
        0,
        "ALL"
      );
    }
  }, [outlets]);

  /* =========================================================
     OUTLET SELECT
  ========================================================= */

  const handleOutletSelect = (outlet) => {
    const id = getOutletId(outlet);

    setSelectedOutlet(id);
    setOutletSearch("");
    setShowOutletDropdown(false);

    setCurrentPage(0);
    setSelectedStatus("ALL");

    fetchStatus(id, 0, "ALL");
  };

  /* =========================================================
     STATUS CARD CLICK
  ========================================================= */

  const handleStatusClick = (status) => {
    if (!selectedOutlet) {
      return;
    }

    setSelectedStatus(status);
    setCurrentPage(0);

    fetchStatus(
      selectedOutlet,
      0,
      status
    );
  };

  /* =========================================================
     PAGINATION
  ========================================================= */

  const handlePageChange = (page) => {
    if (
      page < 0 ||
      page >= totalPages ||
      page === currentPage ||
      loading
    ) {
      return;
    }

    setCurrentPage(page);

    fetchStatus(
      selectedOutlet,
      page,
      selectedStatus
    );
  };

  /*
   * Show page numbers:
   * 1 2 3 4 5
   *
   * For many pages:
   * 1 2 3 ... 10
   */

  const getPageNumbers = () => {
    const pages = [];

    if (totalPages <= 7) {
      for (
        let i = 0;
        i < totalPages;
        i++
      ) {
        pages.push(i);
      }

      return pages;
    }

    pages.push(0);

    if (currentPage > 3) {
      pages.push("left-dots");
    }

    const start = Math.max(
      1,
      currentPage - 1
    );

    const end = Math.min(
      totalPages - 2,
      currentPage + 1
    );

    for (
      let i = start;
      i <= end;
      i++
    ) {
      if (!pages.includes(i)) {
        pages.push(i);
      }
    }

    if (
      currentPage <
      totalPages - 4
    ) {
      pages.push("right-dots");
    }

    pages.push(totalPages - 1);

    return pages;
  };

  /* =========================================================
     REFRESH
  ========================================================= */

  const handleRefresh = () => {
    if (!selectedOutlet) {
      return;
    }

    fetchStatus(
      selectedOutlet,
      currentPage,
      selectedStatus
    );
  };

  /* =========================================================
     EDIT — OPEN MODAL
  ========================================================= */

  const handleEdit = async (plan) => {
    try {
      setEditLoading(true);
      setError("");

      const response = await api.get(
        `/api/fm/promotion-plans/${plan.promotionPlanId}`
      );

      const data =
        response.data?.data ||
        response.data ||
        {};

      /*
       * `plan` here is the fully-merged row from the table
       * (detail + schedule-details + outletId already
       * stamped on in fetchStatus). `data` is a fresh but
       * narrower re-fetch. Merge plan first so nothing it
       * already knew gets lost, then layer the fresh detail
       * on top so anything that changed server-side wins.
       */

      const merged = {
        ...plan,
        ...data,
        outletId:
          data.outletId ??
          plan.outletId ??
          selectedOutlet,
      };

      setEditingPlan(merged);

      const productIds =
        Array.isArray(merged.productIds) &&
        merged.productIds.length > 0
          ? merged.productIds
          : [];

      const categoryIds =
        Array.isArray(merged.outletCategoryIds) &&
        merged.outletCategoryIds.length > 0
          ? merged.outletCategoryIds
          : [];

      if (productIds.length > 0) {
        setEditApplyTo("PRODUCT");
        setEditSelectedProducts(productIds);
        setEditSelectedCategories([]);
      } else if (categoryIds.length > 0) {
        setEditApplyTo("CATEGORY");
        setEditSelectedCategories(categoryIds);
        setEditSelectedProducts([]);
      } else {
        setEditApplyTo("ALL");
        setEditSelectedProducts([]);
        setEditSelectedCategories([]);
      }

      setShowEditModal(true);
    } catch (err) {
      console.error(
        "Failed to load plan:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to load promotion plan."
      );
    } finally {
      setEditLoading(false);
    }
  };

  /* =========================================================
     EDIT — LOAD PRODUCTS/CATEGORIES FOR THE APPLIES-ON
     SECTION (scoped to the plan's own outlet)
  ========================================================= */

  useEffect(() => {
    const outletIdForEdit =
      editingPlan?.outletId ?? selectedOutlet;

    if (!showEditModal || !outletIdForEdit) {
      return;
    }

    const loadEditProducts = async () => {
      try {
        setEditLoadingProducts(true);

        const response = await getProductsByOutlet(
          outletIdForEdit
        );

        let productData = [];

        if (Array.isArray(response)) {
          productData = response;
        } else if (Array.isArray(response?.data)) {
          productData = response.data;
        } else if (Array.isArray(response?.content)) {
          productData = response.content;
        } else if (Array.isArray(response?.products)) {
          productData = response.products;
        } else if (
          Array.isArray(response?.data?.content)
        ) {
          productData = response.data.content;
        }

        setEditProducts(productData);
      } catch (err) {
        console.error(
          "Failed to load products for edit:",
          err
        );

        setEditProducts([]);
      } finally {
        setEditLoadingProducts(false);
      }
    };

    loadEditProducts();
  }, [showEditModal, editingPlan?.outletId]);

  /* =========================================================
     EDIT — CATEGORIES DERIVED FROM PRODUCTS
  ========================================================= */

  const editCategories = useMemo(() => {
    const map = new Map();

    editProducts.forEach((product) => {
      const categoryName =
        getItemCategoryName(product);

      const categoryObject =
        product?.category &&
        typeof product.category === "object"
          ? product.category
          : null;

      const categoryId =
        product?.outletCategoryId ??
        categoryObject?.outletCategoryId ??
        categoryObject?.categoryId ??
        categoryObject?.id ??
        categoryName;

      if (!map.has(String(categoryId))) {
        map.set(String(categoryId), {
          id: categoryId,
          name: categoryName,
        });
      }
    });

    return Array.from(map.values());
  }, [editProducts]);

  /* =========================================================
     EDIT — NAMES FOR CHIPS ("All Products" / "All
     Categories" when nothing specific is selected)
  ========================================================= */

  const editSelectedProductNames = useMemo(() => {
    return editSelectedProducts
      .map((id) => {
        const product = editProducts.find(
          (item) =>
            String(getItemId(item)) === String(id)
        );

        return product
          ? { id, name: getItemName(product) }
          : null;
      })
      .filter(Boolean);
  }, [editSelectedProducts, editProducts]);

  const editSelectedCategoryNames = useMemo(() => {
    return editSelectedCategories
      .map((id) => {
        const category = editCategories.find(
          (item) => String(item.id) === String(id)
        );

        return category
          ? { id, name: category.name }
          : null;
      })
      .filter(Boolean);
  }, [editSelectedCategories, editCategories]);

  /* =========================================================
     EDIT — TOGGLE CATEGORY / PRODUCT
  ========================================================= */

  const toggleEditCategory = (categoryId) => {
    setEditSelectedCategories((previous) => {
      const exists = previous.some(
        (id) => String(id) === String(categoryId)
      );

      if (exists) {
        return previous.filter(
          (id) => String(id) !== String(categoryId)
        );
      }

      return [...previous, categoryId];
    });
  };

  const toggleEditProduct = (productId) => {
    setEditSelectedProducts((previous) => {
      const exists = previous.some(
        (id) => String(id) === String(productId)
      );

      if (exists) {
        return previous.filter(
          (id) => String(id) !== String(productId)
        );
      }

      return [...previous, productId];
    });
  };

  /* =========================================================
     EDIT FIELD
  ========================================================= */

  const handleEditChange = (
    field,
    value
  ) => {
    setEditingPlan((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  /* =========================================================
     EDIT — CLOSE / RESET
  ========================================================= */

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingPlan(null);

    setEditApplyTo("ALL");
    setEditProducts([]);
    setEditSelectedCategories([]);
    setEditSelectedProducts([]);
  };

  /* =========================================================
     SAVE EDIT
  ========================================================= */

  const handleSaveEdit = async (e) => {
    e.preventDefault();

    if (!editingPlan) {
      return;
    }

    if (
      editApplyTo === "CATEGORY" &&
      editSelectedCategories.length === 0
    ) {
      alert("Please select at least one category.");
      return;
    }

    if (
      editApplyTo === "PRODUCT" &&
      editSelectedProducts.length === 0
    ) {
      alert("Please select at least one product.");
      return;
    }

    try {
      setSavingEdit(true);

      const payload = {
        outletId: Number(
          editingPlan.outletId ?? selectedOutlet
        ),

        promotionPlanTypeId: Number(
          editingPlan.promotionPlanTypeId
        ),

        planStartDate:
          editingPlan.planStartDate,

        planEndDate:
          editingPlan.planEndDate,

        planStartTime:
          editingPlan.planStartTime,

        planEndTime:
          editingPlan.planEndTime,

        offerName:
          editingPlan.offerName,

        minimumOrderValue: Number(
          editingPlan.minimumOrderValue
        ),

        offerAmount: Number(
          editingPlan.offerAmount
        ),

        offerType:
          editingPlan.offerType,

        productIds:
          editApplyTo === "PRODUCT"
            ? editSelectedProducts.map(Number)
            : [],

        outletCategoryIds:
          editApplyTo === "CATEGORY"
            ? editSelectedCategories.map(Number)
            : [],

        maxSelection: Number(
          editingPlan.maxSelection ?? -1
        ),
      };

      await api.put(
        `/api/fm/promotion-plans/${editingPlan.promotionPlanId}`,
        payload
      );

      closeEditModal();

      await fetchStatus(
        selectedOutlet,
        currentPage,
        selectedStatus
      );
    } catch (err) {
      console.error(
        "Failed to update promotion plan:",
        err
      );

      alert(
        err.response?.data?.message ||
          "Unable to update promotion plan."
      );
    } finally {
      setSavingEdit(false);
    }
  };

  /* =========================================================
     DELETE
  ========================================================= */

  const handleDelete = async (plan) => {
    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${plan.offerName}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(
        plan.promotionPlanId
      );

      await api.delete(
        `/api/fm/promotion-plans/${plan.promotionPlanId}`
      );

      /*
       * If deleting the last item on a page,
       * move to the previous page.
       */

      let nextPage = currentPage;

      if (
        plans.length === 1 &&
        currentPage > 0
      ) {
        nextPage =
          currentPage - 1;

        setCurrentPage(nextPage);
      }

      await fetchStatus(
        selectedOutlet,
        nextPage,
        selectedStatus
      );
    } catch (err) {
      console.error(
        "Failed to delete promotion plan:",
        err
      );

      alert(
        err.response?.data?.message ||
          "Unable to delete promotion plan."
      );
    } finally {
      setDeletingId(null);
    }
  };

  /* =========================================================
     SELECTED OUTLET
  ========================================================= */

  const selectedOutletObject =
    outlets.find(
      (outlet) =>
        String(
          getOutletId(outlet)
        ) ===
        String(selectedOutlet)
    );

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="plans-status-section">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="plans-status-header">

        <div>
          <h2>Plans Status</h2>

          <p>
            View and manage promotion plans
            belonging to your outlet.
          </p>
        </div>

        <button
          type="button"
          className="plans-refresh-button"
          onClick={handleRefresh}
          disabled={
            loading || !selectedOutlet
          }
        >
          {loading
            ? "Loading..."
            : "Refresh"}
        </button>

      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="plans-error">
          {error}
        </div>
      )}

      {/* =====================================================
          OUTLET DROPDOWN
      ===================================================== */}

      <div className="plans-outlet-field">

        <label>Outlet</label>

        <div className="plans-outlet-selector">

          <button
            type="button"
            className="plans-outlet-trigger"
            onClick={() =>
              setShowOutletDropdown(
                (previous) =>
                  !previous
              )
            }
            disabled={
              loadingOutlets ||
              loading
            }
          >

            <span>
              {loadingOutlets
                ? "Loading outlets..."
                : selectedOutletObject
                ? getOutletName(
                    selectedOutletObject
                  )
                : "Select Outlet"}
            </span>

            <span
              className={`plans-outlet-arrow ${
                showOutletDropdown
                  ? "open"
                  : ""
              }`}
            >
              ⌄
            </span>

          </button>

          {showOutletDropdown && (
            <div className="plans-outlet-menu">

              {/* SEARCH INSIDE DROPDOWN */}

              <div className="plans-outlet-search">

                <span>
                  🔍
                </span>

                <input
                  type="text"
                  value={outletSearch}
                  placeholder="Search outlet..."
                  onChange={(e) =>
                    setOutletSearch(
                      e.target.value
                    )
                  }
                  autoFocus
                />

              </div>

              <div className="plans-outlet-options">

                {filteredOutlets.length ===
                0 ? (
                  <div className="plans-no-outlets">
                    No outlets found
                  </div>
                ) : (
                  filteredOutlets.map(
                    (outlet) => {
                      const id =
                        getOutletId(
                          outlet
                        );

                      const name =
                        getOutletName(
                          outlet
                        );

                      const isSelected =
                        String(id) ===
                        String(
                          selectedOutlet
                        );

                      return (
                        <button
                          type="button"
                          key={id}
                          className={`plans-outlet-option ${
                            isSelected
                              ? "selected"
                              : ""
                          }`}
                          onClick={() =>
                            handleOutletSelect(
                              outlet
                            )
                          }
                        >
                          <span>
                            {name}
                          </span>

                          {isSelected && (
                            <span className="plans-check">
                              ✓
                            </span>
                          )}
                        </button>
                      );
                    }
                  )
                )}

              </div>

            </div>
          )}

        </div>

      </div>

      {/* =====================================================
          STATUS CARDS
      ===================================================== */}

      <div className="plans-counts-grid">

        <button
          type="button"
          className={`plans-count-card plans-count-active ${
            selectedStatus === "ACTIVE"
              ? "selected"
              : ""
          }`}
          onClick={() =>
            handleStatusClick("ACTIVE")
          }
        >
          <span>Active</span>
          <strong>
            {counts.active}
          </strong>
        </button>

        <button
          type="button"
          className={`plans-count-card plans-count-scheduled ${
            selectedStatus ===
            "SCHEDULED"
              ? "selected"
              : ""
          }`}
          onClick={() =>
            handleStatusClick(
              "SCHEDULED"
            )
          }
        >
          <span>Scheduled</span>
          <strong>
            {counts.scheduled}
          </strong>
        </button>

        <button
          type="button"
          className={`plans-count-card plans-count-ended ${
            selectedStatus === "ENDED"
              ? "selected"
              : ""
          }`}
          onClick={() =>
            handleStatusClick("ENDED")
          }
        >
          <span>Ended</span>
          <strong>
            {counts.ended}
          </strong>
        </button>

        <button
          type="button"
          className={`plans-count-card plans-count-total ${
            selectedStatus === "ALL"
              ? "selected"
              : ""
          }`}
          onClick={() =>
            handleStatusClick("ALL")
          }
        >
          <span>Total</span>
          <strong>
            {counts.total}
          </strong>
        </button>

      </div>

      {/* =====================================================
          TABLE TITLE
      ===================================================== */}

      <div className="plans-table-heading">

        <div>
          <h3>
            Promotion Plans
          </h3>

          <span>
            {selectedStatus ===
            "ALL"
              ? "All plans"
              : `${selectedStatus
                  .charAt(0)
                  .toUpperCase()}${selectedStatus
                  .slice(1)
                  .toLowerCase()} plans`}
          </span>
        </div>

        <strong>
          {totalElements}{" "}
          {totalElements === 1
            ? "plan"
            : "plans"}
        </strong>

      </div>

      {/* =====================================================
          TABLE
      ===================================================== */}

      {loading ? (
        <div className="plans-loading">
          <div className="plans-spinner" />
          <span>
            Loading promotion plans...
          </span>
        </div>
      ) : plans.length === 0 ? (
        <div className="plans-empty">
          <div className="plans-empty-icon">
            📋
          </div>

          <h3>
            No promotion plans found
          </h3>

          <p>
            There are no plans available
            for this outlet and status.
          </p>
        </div>
      ) : (
        <>

          <div className="plans-table-container">

            <table className="plans-table">

              <thead>

                <tr>

                  <th className="col-id">
                    ID
                  </th>

                  <th className="col-type">
                    Plan Type
                  </th>

                  <th className="col-offer">
                    Offer Name
                  </th>

                  <th className="col-area">
                    Area
                  </th>

                  <th className="col-min-order">
                    Min Order Value
                  </th>

                  <th className="col-amount">
                    Offer Amount
                  </th>

                  <th className="col-date">
                    Start Date
                  </th>

                  <th className="col-date">
                    End Date
                  </th>

                  <th className="col-time">
                    Start Time
                  </th>

                  <th className="col-time">
                    End Time
                  </th>

                  <th className="col-status">
                    Status
                  </th>

                  <th className="col-actions">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody>

                {plans.map(
                  (plan) => (
                    <tr
                      key={
                        plan.promotionPlanId
                      }
                    >

                      <td className="plan-id-cell">
                        #
                        {
                          plan.promotionPlanId
                        }
                      </td>

                      <td
                        className="plan-type-cell"
                        title={getPlanTypeName(plan)}
                      >
                        {getPlanTypeName(
                          plan
                        )}
                      </td>

                      <td className="plan-offer-cell">
                        <span
                          title={
                            plan.offerName
                          }
                        >
                          {plan.offerName ||
                            "-"}
                        </span>
                      </td>

                      <td>
                        {plan.areaName ||
                          "-"}
                      </td>

                      <td className="plan-money-cell">
                        {plan.minimumOrderValue !==
                          null &&
                        plan.minimumOrderValue !==
                          undefined
                          ? `₹${plan.minimumOrderValue}`
                          : "-"}
                      </td>

                      <td className="plan-amount-cell">
                        {formatAmount(
                          plan
                        )}
                      </td>

                      <td>
                        {formatDate(
                          plan.planStartDate
                        )}
                      </td>

                      <td>
                        {formatDate(
                          plan.planEndDate
                        )}
                      </td>

                      <td>
                        {formatTime(
                          plan.planStartTime
                        )}
                      </td>

                      <td>
                        {formatTime(
                          plan.planEndTime
                        )}
                      </td>

                      <td>
                        <span
                          className={`plans-status-badge plans-status-${String(
                            plan.status ||
                              ""
                          ).toLowerCase()}`}
                        >
                          {plan.status ||
                            "-"}
                        </span>
                      </td>

                      <td>

                        <div className="plans-actions">

                          <button
                            type="button"
                            className="plans-edit-btn"
                            onClick={() =>
                              handleEdit(
                                plan
                              )
                            }
                            disabled={
                              editLoading
                            }
                          >
                            Edit
                          </button>

                          {/* <button
                            type="button"
                            className="plans-delete-btn"
                            onClick={() =>
                              handleDelete(
                                plan
                              )
                            }
                            disabled={
                              deletingId ===
                              plan.promotionPlanId
                            }
                          >
                            {deletingId ===
                            plan.promotionPlanId
                              ? "..."
                              : "Delete"}
                          </button> */}

                        </div>

                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>

          {/* =================================================
              PAGINATION
          ================================================= */}

          {totalPages > 0 && (
            <div className="plans-pagination">

              <button
                type="button"
                className="plans-pagination-prev-next"
                disabled={
                  currentPage === 0 ||
                  loading
                }
                onClick={() =>
                  handlePageChange(
                    currentPage - 1
                  )
                }
              >
                ← Prev
              </button>

              <div className="plans-pagination-pages">

                {getPageNumbers().map(
                  (page, index) => {

                    if (
                      page ===
                      "left-dots" ||
                      page ===
                      "right-dots"
                    ) {
                      return (
                        <span
                          key={`${page}-${index}`}
                          className="plans-pagination-dots"
                        >
                          ...
                        </span>
                      );
                    }

                    return (
                      <button
                        type="button"
                        key={page}
                        className={`plans-page-number ${
                          currentPage ===
                          page
                            ? "active"
                            : ""
                        }`}
                        onClick={() =>
                          handlePageChange(
                            page
                          )
                        }
                        disabled={
                          loading
                        }
                      >
                        {page + 1}
                      </button>
                    );
                  }
                )}

              </div>

              <button
                type="button"
                className="plans-pagination-prev-next"
                disabled={
                  currentPage >=
                    totalPages - 1 ||
                  loading
                }
                onClick={() =>
                  handlePageChange(
                    currentPage + 1
                  )
                }
              >
                Next →
              </button>

            </div>
          )}

        </>
      )}

      {/* =====================================================
          EDIT MODAL
          (Styling only, below, is restyled to the colorful
          mockup — icon badges + tinted cards per field group.
          No state, handlers, or payload logic changed.)
      ===================================================== */}

      {showEditModal &&
        editingPlan && (
          <div
            className="plans-modal-overlay"
            onMouseDown={(e) => {
              if (
                e.target ===
                e.currentTarget
              ) {
                closeEditModal();
              }
            }}
          >

            <div className="plans-edit-modal">

              <div className="plans-modal-header">

                <div className="plans-modal-header-inner">

                  <div className="plans-modal-header-icon">
                    🏷️
                  </div>

                  <div>
                    <h3>
                      Edit Promotion Plan
                    </h3>

                    <p>
                      Plan #
                      {
                        editingPlan.promotionPlanId
                      }
                      {" "}· Update promotion details
                    </p>
                  </div>

                </div>

                <button
                  type="button"
                  className="plans-modal-close"
                  onClick={closeEditModal}
                >
                  ×
                </button>

              </div>

              <form
                onSubmit={
                  handleSaveEdit
                }
              >

                <div className="plans-edit-grid">

                  {/* PLAN TYPE */}

                  <div className="plans-edit-field-colored plans-edit-color-orange">

                    <div className="plans-edit-field-icon">
                      🏷️
                    </div>

                    <div className="plans-edit-field">

                      <label>
                        Plan Type
                      </label>

                      <select
                        value={
                          editingPlan.promotionPlanTypeId ||
                          ""
                        }
                        onChange={(e) =>
                          handleEditChange(
                            "promotionPlanTypeId",
                            e.target.value
                          )
                        }
                        required
                      >

                        <option value="">
                          Select Plan Type
                        </option>

                        {planTypes.map(
                          (type) => (
                            <option
                              key={
                                type.promotionPlanTypesId
                              }
                              value={
                                type.promotionPlanTypesId
                              }
                            >
                              {
                                type.planName
                              }
                            </option>
                          )
                        )}

                      </select>

                    </div>

                  </div>

                  {/* OFFER NAME */}

                  <div className="plans-edit-field-colored plans-edit-color-pink">

                    <div className="plans-edit-field-icon">
                      🎁
                    </div>

                    <div className="plans-edit-field">

                      <label>
                        Offer Name
                      </label>

                      <input
                        type="text"
                        value={
                          editingPlan.offerName ||
                          ""
                        }
                        onChange={(e) =>
                          handleEditChange(
                            "offerName",
                            e.target.value
                          )
                        }
                        required
                      />

                    </div>

                  </div>

                  {/* START DATE */}

                  <div className="plans-edit-field-colored plans-edit-color-green">

                    <div className="plans-edit-field-icon">
                      📅
                    </div>

                    <div className="plans-edit-field">

                      <label>
                        Start Date
                      </label>

                      <input
                        type="date"
                        value={
                          editingPlan.planStartDate ||
                          ""
                        }
                        onChange={(e) =>
                          handleEditChange(
                            "planStartDate",
                            e.target.value
                          )
                        }
                        required
                      />

                    </div>

                  </div>

                  {/* END DATE */}

                  <div className="plans-edit-field-colored plans-edit-color-green">

                    <div className="plans-edit-field-icon">
                      📅
                    </div>

                    <div className="plans-edit-field">

                      <label>
                        End Date
                      </label>

                      <input
                        type="date"
                        value={
                          editingPlan.planEndDate ||
                          ""
                        }
                        onChange={(e) =>
                          handleEditChange(
                            "planEndDate",
                            e.target.value
                          )
                        }
                        required
                      />

                    </div>

                  </div>

                  {/* START TIME */}

                  <div className="plans-edit-field-colored plans-edit-color-blue">

                    <div className="plans-edit-field-icon">
                      🕐
                    </div>

                    <div className="plans-edit-field">

                      <label>
                        Start Time
                      </label>

                      <input
                        type="time"
                        value={
                          editingPlan.planStartTime
                            ? String(
                                editingPlan.planStartTime
                              ).slice(
                                0,
                                5
                              )
                            : ""
                        }
                        onChange={(e) =>
                          handleEditChange(
                            "planStartTime",
                            `${e.target.value}:00`
                          )
                        }
                        required
                      />

                    </div>

                  </div>

                  {/* END TIME */}

                  <div className="plans-edit-field-colored plans-edit-color-blue">

                    <div className="plans-edit-field-icon">
                      🕐
                    </div>

                    <div className="plans-edit-field">

                      <label>
                        End Time
                      </label>

                      <input
                        type="time"
                        value={
                          editingPlan.planEndTime
                            ? String(
                                editingPlan.planEndTime
                              ).slice(
                                0,
                                5
                              )
                            : ""
                        }
                        onChange={(e) =>
                          handleEditChange(
                            "planEndTime",
                            `${e.target.value}:00`
                          )
                        }
                        required
                      />

                    </div>

                  </div>

                  {/* MIN ORDER */}

                  <div className="plans-edit-field-colored plans-edit-color-orange">

                    <div className="plans-edit-field-icon">
                      🛒
                    </div>

                    <div className="plans-edit-field">

                      <label>
                        Minimum Order Value
                      </label>

                      <input
                        type="number"
                        min="0"
                        value={
                          editingPlan.minimumOrderValue ??
                          ""
                        }
                        onChange={(e) =>
                          handleEditChange(
                            "minimumOrderValue",
                            e.target.value
                          )
                        }
                        onWheel={(e) => e.currentTarget.blur()}
                      />

                    </div>

                  </div>

                  {/* OFFER TYPE */}

                  {/* <div className="plans-edit-field-colored plans-edit-color-orange">

                    <div className="plans-edit-field-icon">
                      %
                    </div>

                    <div className="plans-edit-field">

                      <label>
                        Offer Type
                      </label>

                      <select
                        value={
                          editingPlan.offerType ||
                          ""
                        }
                        onChange={(e) =>
                          handleEditChange(
                            "offerType",
                            e.target.value
                          )
                        }
                      >

                        <option value="">
                          Select Offer Type
                        </option>

                        <option value="FLAT">
                          Flat
                        </option>

                        <option value="% OFF">
                          % Off
                        </option>

                      </select>

                    </div>

                  </div> */}


                  {/* OFFER TYPE */}

<div className="plans-edit-field-colored plans-edit-color-orange">

  <div className="plans-edit-field-icon">
    %
  </div>

  <div className="plans-edit-field">

    <label>
      Offer Type
    </label>

    <select
      value={editingPlan.offerType || ""}
      onChange={(e) =>
        handleEditChange(
          "offerType",
          e.target.value
        )
      }
    >

      <option value="">
        Select Offer Type
      </option>

      <option value="FLAT">
        Offer Amount
      </option>

      <option value="% OFF">
        % Off
      </option>

    </select>

  </div>

</div>

                  {/* OFFER AMOUNT */}

                  {/* <div className="plans-edit-field-colored plans-edit-color-purple">

                    <div className="plans-edit-field-icon">
                      ₹
                    </div>

                    <div className="plans-edit-field">

                      <label>
                        Offer Amount
                      </label>

                      <input
                        type="number"
                        min="0"
                        value={
                          editingPlan.offerAmount ??
                          ""
                        }
                        onChange={(e) =>
                          handleEditChange(
                            "offerAmount",
                            e.target.value
                          )
                        }
                        onWheel={(e) => e.currentTarget.blur()}
                      />

                    </div>

                  </div> */}


                  {/* OFFER AMOUNT */}

<div className="plans-edit-field-colored plans-edit-color-purple">

  <div className="plans-edit-field-icon">
    {editingPlan.offerType === "% OFF" ? "%" : "₹"}
  </div>

  <div className="plans-edit-field">

    <label>
      {editingPlan.offerType === "% OFF"
        ? "Percentage Off"
        : "Offer Amount"}
    </label>

    <input
      type="number"
      min="0"
      max={
        editingPlan.offerType === "% OFF"
          ? "100"
          : undefined
      }
      value={
        editingPlan.offerAmount ?? ""
      }
      onChange={(e) =>
        handleEditChange(
          "offerAmount",
          e.target.value
        )
      }
      onWheel={(e) =>
        e.currentTarget.blur()
      }
    />

  </div>

</div>

                  {/* MAX SELECTION */}

                  <div className="plans-edit-field-colored plans-edit-color-purple">

                    <div className="plans-edit-field-icon">
                      📚
                    </div>

                    <div className="plans-edit-field">

                      <label>
                        Max Selection
                      </label>

                      <input
                        type="number"
                        value={
                          editingPlan.maxSelection ??
                          -1
                        }
                        onChange={(e) =>
                          handleEditChange(
                            "maxSelection",
                            e.target.value
                          )
                        }
                        onWheel={(e) => e.currentTarget.blur()}
                      />

                    </div>

                  </div>

                  {/* =============================================
                      APPLIES ON — products / categories,
                      shown by NAME, with "All Products" shown
                      plainly instead of an empty id list
                  ============================================= */}

                  <div className="plans-edit-field-colored plans-edit-color-teal plans-edit-full plans-edit-applies-card">

                    <div className="plans-edit-applies-header">

                      <div className="plans-edit-field-icon">
                        🔲
                      </div>

                      <div>
                        <label>
                          Applies On
                        </label>

                        <p className="plans-edit-apply-subtitle">
                          Choose where this promotion will be applicable
                        </p>
                      </div>

                    </div>

                    <div className="plans-edit-apply-options">

                      <button
                        type="button"
                        className={`plans-edit-apply-btn ${
                          editApplyTo === "ALL"
                            ? "active"
                            : ""
                        }`}
                        onClick={() =>
                          setEditApplyTo("ALL")
                        }
                      >
                        All Products
                      </button>

                      <button
                        type="button"
                        className={`plans-edit-apply-btn ${
                          editApplyTo === "CATEGORY"
                            ? "active"
                            : ""
                        }`}
                        onClick={() =>
                          setEditApplyTo("CATEGORY")
                        }
                      >
                        Categories
                      </button>

                      <button
                        type="button"
                        className={`plans-edit-apply-btn ${
                          editApplyTo === "PRODUCT"
                            ? "active"
                            : ""
                        }`}
                        onClick={() =>
                          setEditApplyTo("PRODUCT")
                        }
                      >
                        Products
                      </button>

                    </div>

                    {editApplyTo === "ALL" && (
                      <div className="plans-edit-apply-summary">
                        This plan applies to all products in the outlet.
                      </div>
                    )}

                    {editApplyTo === "CATEGORY" && (
                      <div className="plans-edit-apply-picker">

                        {editSelectedCategoryNames.length > 0 && (
                          <div className="plans-edit-apply-chips">
                            {editSelectedCategoryNames.map(
                              ({ id, name }) => (
                                <span
                                  key={id}
                                  className="plans-edit-apply-chip"
                                >
                                  {name}
                                  <button
                                    type="button"
                                    className="plans-edit-apply-chip-remove"
                                    onClick={() =>
                                      toggleEditCategory(id)
                                    }
                                    aria-label={`Remove ${name}`}
                                  >
                                    ×
                                  </button>
                                </span>
                              )
                            )}
                          </div>
                        )}

                        {editLoadingProducts ? (
                          <div className="plans-edit-apply-loading">
                            Loading categories...
                          </div>
                        ) : editCategories.length === 0 ? (
                          <div className="plans-edit-apply-loading">
                            No categories found for this outlet.
                          </div>
                        ) : (
                          <div className="plans-edit-apply-checklist">
                            {editCategories.map((category) => {
                              const checked = editSelectedCategories.some(
                                (id) => String(id) === String(category.id)
                              );

                              return (
                                <label
                                  key={category.id}
                                  className={`plans-edit-apply-check-row ${
                                    checked ? "checked" : ""
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() =>
                                      toggleEditCategory(category.id)
                                    }
                                  />
                                  <span>{category.name}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {editApplyTo === "PRODUCT" && (
                      <div className="plans-edit-apply-picker">

                        {editSelectedProductNames.length > 0 && (
                          <div className="plans-edit-apply-chips">
                            {editSelectedProductNames.map(
                              ({ id, name }) => (
                                <span
                                  key={id}
                                  className="plans-edit-apply-chip"
                                >
                                  {name}
                                  <button
                                    type="button"
                                    className="plans-edit-apply-chip-remove"
                                    onClick={() =>
                                      toggleEditProduct(id)
                                    }
                                    aria-label={`Remove ${name}`}
                                  >
                                    ×
                                  </button>
                                </span>
                              )
                            )}
                          </div>
                        )}

                        {editLoadingProducts ? (
                          <div className="plans-edit-apply-loading">
                            Loading products...
                          </div>
                        ) : editProducts.length === 0 ? (
                          <div className="plans-edit-apply-loading">
                            No products found for this outlet.
                          </div>
                        ) : (
                          <div className="plans-edit-apply-checklist">
                            {editProducts.map((product) => {
                              const id = getItemId(product);

                              const checked = editSelectedProducts.some(
                                (selectedId) =>
                                  String(selectedId) === String(id)
                              );

                              return (
                                <label
                                  key={id}
                                  className={`plans-edit-apply-check-row ${
                                    checked ? "checked" : ""
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() =>
                                      toggleEditProduct(id)
                                    }
                                  />
                                  <span>{getItemName(product)}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                  </div>

                </div>

                <div className="plans-modal-actions">

                  <span className="plans-modal-actions-tagline">
                    Good Food Brings Happiness!
                  </span>

                  <div className="plans-modal-actions-buttons">

                    <button
                      type="button"
                      className="plans-cancel-btn"
                      onClick={closeEditModal}
                      disabled={
                        savingEdit
                      }
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="plans-save-btn"
                      disabled={
                        savingEdit
                      }
                    >
                      {savingEdit
                        ? "Updating..."
                        : "Update Plan"}
                    </button>

                  </div>

                </div>

              </form>

            </div>

          </div>
        )}

    </div>
  );
};

export default PlansStatus;