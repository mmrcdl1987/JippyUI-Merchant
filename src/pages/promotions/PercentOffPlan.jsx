import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import "../../styles/PercentOffPlan.css";

import {
  createPromotionPlan,
  getProductsByOutlet,
} from "../../services/promotionService";

/* =========================================================
   ICONS
========================================================= */

const CalendarIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="18"
    height="18"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="4" width="18" height="17" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const ClockIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="18"
    height="18"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="9" />
    <polyline points="12 7 12 12 15 14" />
  </svg>
);

const StoreIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="18"
    height="18"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 9l2-5h14l2 5" />
    <path d="M5 9v10h14V9" />
    <path d="M3 9h18" />
    <path d="M8 19v-5h8v5" />
  </svg>
);

const SearchIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="17"
    height="17"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="7" />
    <line x1="16.5" y1="16.5" x2="21" y2="21" />
  </svg>
);

const TagIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="23"
    height="23"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20.59 13.41 11 3.83V3H4v7h.83l9.58 9.59a2 2 0 0 0 2.83 0l3.35-3.35a2 2 0 0 0 0-2.83Z" />
    <circle cx="7.5" cy="7.5" r="1" />
  </svg>
);

const PercentIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="18"
    height="18"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="19" y1="5" x2="5" y2="19" />
    <circle cx="6.5" cy="6.5" r="2.5" />
    <circle cx="17.5" cy="17.5" r="2.5" />
  </svg>
);

const RupeeIcon = () => (
  <span className="percent-off-plan-rupee-icon">
    ₹
  </span>
);

const ChevronIcon = ({ open }) => (
  <svg
    className={`percent-off-plan-chevron ${
      open ? "open" : ""
    }`}
    viewBox="0 0 24 24"
    width="18"
    height="18"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const CheckIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="14"
    height="14"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="5 12 10 17 19 7" />
  </svg>
);

/* =========================================================
   HELPERS
========================================================= */

const getId = (item) =>
  item?.outletId ??
  item?.productId ??
  item?.categoryId ??
  item?.id ??
  item?.foodId;

const getName = (item) =>
  item?.outletName ??
  item?.productName ??
  item?.categoryName ??
  item?.foodName ??
  item?.name ??
  "Unnamed";

const getCategoryName = (product) =>
  product?.categoryName ??
  product?.category?.categoryName ??
  product?.category?.name ??
  product?.category_name ??
  "Other";

/* =========================================================
   COMPONENT
========================================================= */

const PercentOffPlan = ({ outlets = [] }) => {
  /* =======================================================
     REFS
  ======================================================= */

  const outletDropdownRef = useRef(null);
  const categoryDropdownRef = useRef(null);
  const productDropdownRef = useRef(null);

  const startDateRef = useRef(null);
  const endDateRef = useRef(null);
  const startTimeRef = useRef(null);
  const endTimeRef = useRef(null);

  /* =======================================================
     FORM
  ======================================================= */

  const initialFormData = {
    outletId: "",
    offerName: "",
    offerType: "PERCENTAGE",
    offerAmount: "",
    minimumOrderValue: "",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    maximumSelection: "-1",
  };

  const [formData, setFormData] = useState(
    initialFormData
  );

  /* =======================================================
     OUTLETS
  ======================================================= */

  const [outletDropdownOpen, setOutletDropdownOpen] =
    useState(false);

  const [outletSearch, setOutletSearch] = useState("");

  /* =======================================================
     PRODUCTS / CATEGORIES
  ======================================================= */

  const [products, setProducts] = useState([]);

  const [loadingProducts, setLoadingProducts] =
    useState(false);

  const [selectedCategories, setSelectedCategories] =
    useState([]);

  const [selectedProducts, setSelectedProducts] =
    useState([]);

  /* =======================================================
     APPLY TYPE
  ======================================================= */

  const [applyTo, setApplyTo] = useState("ALL");

  /* =======================================================
     CATEGORY / PRODUCT DROPDOWNS
  ======================================================= */

  const [categoryDropdownOpen, setCategoryDropdownOpen] =
    useState(false);

  const [productDropdownOpen, setProductDropdownOpen] =
    useState(false);

  const [categorySearch, setCategorySearch] = useState("");

  const [productSearch, setProductSearch] = useState("");

  /* =======================================================
     UI
  ======================================================= */

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  /* =======================================================
     NORMALIZE OUTLETS
  ======================================================= */

  const outletList = useMemo(() => {
    if (Array.isArray(outlets)) {
      return outlets;
    }

    if (Array.isArray(outlets?.data)) {
      return outlets.data;
    }

    if (Array.isArray(outlets?.content)) {
      return outlets.content;
    }

    return [];
  }, [outlets]);

  /* =======================================================
     FILTER OUTLETS
  ======================================================= */

  const filteredOutlets = useMemo(() => {
    const search = outletSearch
      .trim()
      .toLowerCase();

    if (!search) {
      return outletList;
    }

    return outletList.filter((outlet) => {
      const name = String(
        getName(outlet)
      ).toLowerCase();

      const id = String(
        getId(outlet)
      ).toLowerCase();

      return (
        name.includes(search) ||
        id.includes(search)
      );
    });
  }, [outletList, outletSearch]);

  /* =======================================================
     SELECTED OUTLET
  ======================================================= */

  const selectedOutlet = useMemo(() => {
    return outletList.find(
      (outlet) =>
        String(getId(outlet)) ===
        String(formData.outletId)
    );
  }, [
    outletList,
    formData.outletId,
  ]);

  /* =======================================================
     LOAD PRODUCTS WHEN OUTLET CHANGES
  ======================================================= */

  useEffect(() => {
    const loadProducts = async () => {
      if (!formData.outletId) {
        setProducts([]);
        setSelectedCategories([]);
        setSelectedProducts([]);
        return;
      }

      try {
        setLoadingProducts(true);
        setError("");

        const response =
          await getProductsByOutlet(
            formData.outletId
          );

        console.log(
          "Products API response:",
          response
        );

        let productData = [];

        if (Array.isArray(response)) {
          productData = response;
        } else if (
          Array.isArray(response?.data)
        ) {
          productData = response.data;
        } else if (
          Array.isArray(response?.content)
        ) {
          productData = response.content;
        } else if (
          Array.isArray(response?.products)
        ) {
          productData = response.products;
        } else if (
          Array.isArray(
            response?.data?.content
          )
        ) {
          productData =
            response.data.content;
        }

        setProducts(productData);

        setSelectedCategories([]);
        setSelectedProducts([]);

      } catch (err) {
        console.error(
          "Products loading failed:",
          err
        );

        setProducts([]);

        setError(
          err?.response?.data?.message ||
            "Unable to load products for this outlet."
        );
      } finally {
        setLoadingProducts(false);
      }
    };

    loadProducts();
  }, [formData.outletId]);

  /* =======================================================
     UNIQUE CATEGORIES
  ======================================================= */

  const categories = useMemo(() => {
    const map = new Map();

    products.forEach((product) => {
      const categoryName =
        getCategoryName(product);

      const categoryObject =
        product?.category &&
        typeof product.category ===
          "object"
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
  }, [products]);

  /* =======================================================
     FILTER CATEGORIES
  ======================================================= */

  const filteredCategories = useMemo(() => {
    const search = categorySearch
      .trim()
      .toLowerCase();

    if (!search) {
      return categories;
    }

    return categories.filter(
      (category) =>
        category.name
          .toLowerCase()
          .includes(search)
    );
  }, [
    categories,
    categorySearch,
  ]);

  /* =======================================================
     FILTER PRODUCTS
  ======================================================= */

  const filteredProducts = useMemo(() => {
    const search = productSearch
      .trim()
      .toLowerCase();

    if (!search) {
      return products;
    }

    return products.filter((product) => {
      const name = getName(product)
        .toLowerCase();

      const category =
        getCategoryName(product)
          .toLowerCase();

      return (
        name.includes(search) ||
        category.includes(search)
      );
    });
  }, [
    products,
    productSearch,
  ]);

  /* =======================================================
     CLOSE DROPDOWNS WHEN CLICKING OUTSIDE
  ======================================================= */

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        outletDropdownRef.current &&
        !outletDropdownRef.current.contains(
          event.target
        )
      ) {
        setOutletDropdownOpen(false);
      }

      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(
          event.target
        )
      ) {
        setCategoryDropdownOpen(false);
      }

      if (
        productDropdownRef.current &&
        !productDropdownRef.current.contains(
          event.target
        )
      ) {
        setProductDropdownOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  /* =======================================================
     INPUT CHANGE
  ======================================================= */

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  /* =======================================================
     OUTLET SELECT
  ======================================================= */

  const handleOutletSelect = (outlet) => {
    const id = getId(outlet);

    setFormData((previous) => ({
      ...previous,
      outletId: id,
    }));

    setSelectedCategories([]);
    setSelectedProducts([]);

    setOutletDropdownOpen(false);
    setOutletSearch("");

    setCategoryDropdownOpen(false);
    setProductDropdownOpen(false);

    setError("");
    setSuccess("");
  };

  /* =======================================================
     CATEGORY TOGGLE
  ======================================================= */

  const toggleCategory = (categoryId) => {
    setSelectedCategories((previous) => {
      const exists = previous.some(
        (id) =>
          String(id) ===
          String(categoryId)
      );

      if (exists) {
        return previous.filter(
          (id) =>
            String(id) !==
            String(categoryId)
        );
      }

      return [
        ...previous,
        categoryId,
      ];
    });

    setError("");
  };

  /* =======================================================
     PRODUCT TOGGLE
  ======================================================= */

  const toggleProduct = (productId) => {
    setSelectedProducts((previous) => {
      const exists = previous.some(
        (id) =>
          String(id) ===
          String(productId)
      );

      if (exists) {
        return previous.filter(
          (id) =>
            String(id) !==
            String(productId)
        );
      }

      return [
        ...previous,
        productId,
      ];
    });

    setError("");
  };

  /* =======================================================
     SELECT ALL CATEGORIES
  ======================================================= */

  const selectAllCategories = () => {
    setSelectedCategories(
      filteredCategories.map(
        (category) => category.id
      )
    );
  };

  /* =======================================================
     CLEAR CATEGORIES
  ======================================================= */

  const clearCategories = () => {
    setSelectedCategories([]);
  };

  /* =======================================================
     SELECT ALL PRODUCTS
  ======================================================= */

  const selectAllProducts = () => {
    setSelectedProducts(
      filteredProducts.map((product) =>
        getId(product)
      )
    );
  };

  /* =======================================================
     CLEAR PRODUCTS
  ======================================================= */

  const clearProducts = () => {
    setSelectedProducts([]);
  };

  /* =======================================================
     DROPDOWN LABELS
  ======================================================= */

  const categoryDropdownLabel = useMemo(() => {
    if (selectedCategories.length === 0) {
      return "Select categories";
    }

    if (
      selectedCategories.length ===
      categories.length
    ) {
      return "All categories selected";
    }

    return `${selectedCategories.length} ${
      selectedCategories.length === 1
        ? "category"
        : "categories"
    } selected`;
  }, [
    selectedCategories,
    categories,
  ]);

  const productDropdownLabel = useMemo(() => {
    if (selectedProducts.length === 0) {
      return "Select products";
    }

    if (
      selectedProducts.length ===
      products.length
    ) {
      return "All products selected";
    }

    return `${selectedProducts.length} ${
      selectedProducts.length === 1
        ? "product"
        : "products"
    } selected`;
  }, [
    selectedProducts,
    products,
  ]);

  /* =======================================================
     OPEN DATE PICKER
  ======================================================= */

  const openDatePicker = (ref) => {
    if (ref.current) {
      if (
        typeof ref.current.showPicker ===
        "function"
      ) {
        ref.current.showPicker();
      } else {
        ref.current.focus();
      }
    }
  };

  /* =======================================================
     OPEN TIME PICKER
  ======================================================= */

  const openTimePicker = (ref) => {
    if (ref.current) {
      if (
        typeof ref.current.showPicker ===
        "function"
      ) {
        ref.current.showPicker();
      } else {
        ref.current.focus();
      }
    }
  };

  /* =======================================================
     VALIDATION
  ======================================================= */

  const validateForm = () => {
    if (!formData.outletId) {
      return "Please select an outlet.";
    }

    if (!formData.offerName.trim()) {
      return "Please enter offer name.";
    }

    if (!formData.offerAmount) {
      return "Please enter offer amount.";
    }

    const offerAmount =
      Number(formData.offerAmount);

    if (offerAmount <= 0) {
      return "Offer amount must be greater than 0.";
    }

    if (
      formData.offerType ===
        "PERCENTAGE" &&
      offerAmount > 100
    ) {
      return "Percentage offer must be between 1 and 100.";
    }

    if (!formData.minimumOrderValue) {
      return "Please enter minimum order value.";
    }

    if (
      Number(formData.minimumOrderValue) < 0
    ) {
      return "Minimum order value cannot be negative.";
    }

    if (!formData.startDate) {
      return "Please select start date.";
    }

    if (!formData.endDate) {
      return "Please select end date.";
    }

    if (
      formData.endDate <
      formData.startDate
    ) {
      return "End date cannot be before start date.";
    }

    if (!formData.startTime) {
      return "Please select start time.";
    }

    if (!formData.endTime) {
      return "Please select end time.";
    }

    if (
      formData.startDate ===
        formData.endDate &&
      formData.endTime <=
        formData.startTime
    ) {
      return "End time must be after start time.";
    }

    if (
      applyTo === "CATEGORY" &&
      selectedCategories.length === 0
    ) {
      return "Please select at least one category.";
    }

    if (
      applyTo === "PRODUCT" &&
      selectedProducts.length === 0
    ) {
      return "Please select at least one product.";
    }

    return "";
  };

  /* =======================================================
     SUBMIT
  ======================================================= */

const handleSubmit = async (event) => {
  event.preventDefault();

  setError("");
  setSuccess("");

  const validationError = validateForm();

  if (validationError) {
    setError(validationError);
    return;
  }

  try {
    setSubmitting(true);

const payload = {
  outletId: Number(formData.outletId),

  promotionPlanTypeId: 2,

  planStartDate: formData.startDate,
  planEndDate: formData.endDate,

  // LocalTime → String
  planStartTime: `${formData.startTime}:00`,
  planEndTime: `${formData.endTime}:00`,

  offerName: formData.offerName.trim(),

  minimumOrderValue: Number(formData.minimumOrderValue),

  offerAmount: Number(formData.offerAmount),

  offerType:
    formData.offerType === "FLAT_AMOUNT"
      ? "FLAT"
      : "% OFF",

  productIds: (formData.productIds || []).map(Number),

  outletCategoryIds: (formData.categoryIds || []).map(Number),

  maxSelection:
    formData.maximumSelection === ""
      ? null
      : Number(formData.maximumSelection),
};
    console.log(
      "CREATE PROMOTION PAYLOAD:",
      payload
    );

    await createPromotionPlan(payload);

    setSuccess(
      "Promotion plan created successfully."
    );

  } catch (err) {
    console.error(
      "Create promotion failed:",
      err
    );

    console.error(
      "Backend response:",
      err?.response?.data
    );

    setError(
      err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to create promotion plan."
    );

  } finally {
    setSubmitting(false);
  }
};
  /* =======================================================
     RESET
  ======================================================= */

  const handleReset = () => {
    setFormData({
      ...initialFormData,
    });

    setApplyTo("ALL");

    setSelectedCategories([]);

    setSelectedProducts([]);

    setProducts([]);

    setOutletSearch("");

    setCategorySearch("");

    setProductSearch("");

    setOutletDropdownOpen(false);

    setCategoryDropdownOpen(false);

    setProductDropdownOpen(false);

    setError("");

    setSuccess("");
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="percent-off-plan">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="percent-off-plan-header">

        <div className="percent-off-plan-title-wrapper">

          <div className="percent-off-plan-title-icon">
            <TagIcon />
          </div>

          <div>
            <h2>
              Percentage OFF Plan
            </h2>

            <p>
              Create a percentage based
              promotional offer for your
              outlet
            </p>
          </div>

        </div>

        <div className="percent-off-plan-header-badge">
          <PercentIcon />
          <span>% OFF</span>
        </div>

      </div>

      {/* =================================================
          MESSAGES
      ================================================= */}

      {success && (
        <div className="percent-off-plan-success">
          <span>✓</span>
          {success}
        </div>
      )}

      {error && (
        <div className="percent-off-plan-error">
          <span>!</span>
          {error}
        </div>
      )}

      <form
        className="percent-off-plan-form"
        onSubmit={handleSubmit}
      >

        {/* =================================================
            PLAN DETAILS
        ================================================= */}

        <div className="percent-off-plan-section">

          <div className="percent-off-plan-section-heading">
            <span />
            <h3>
              Plan Details
            </h3>
          </div>

          <div className="percent-off-plan-form-grid">

            {/* =================================================
                OUTLET
            ================================================= */}

            <div
              className="percent-off-plan-field"
              ref={outletDropdownRef}
            >

              <label>
                Outlet
                <span className="required">
                  *
                </span>
              </label>

              <div className="percent-off-plan-custom-dropdown">

                {/* TRIGGER */}

                <button
                  type="button"
                  className={`percent-off-plan-dropdown-trigger ${
                    outletDropdownOpen
                      ? "open"
                      : ""
                  }`}
                  onClick={() =>
                    setOutletDropdownOpen(
                      (previous) =>
                        !previous
                    )
                  }
                >

                  <span className="percent-off-plan-dropdown-trigger-left">

                    <span className="percent-off-plan-dropdown-store-icon">
                      <StoreIcon />
                    </span>

                    <span
                      className={
                        formData.outletId
                          ? "selected"
                          : "placeholder"
                      }
                    >
                      {selectedOutlet
                        ? `${getName(
                            selectedOutlet
                          )} (ID: ${getId(
                            selectedOutlet
                          )})`
                        : "Select outlet"}
                    </span>

                  </span>

                  <ChevronIcon
                    open={
                      outletDropdownOpen
                    }
                  />

                </button>

                {/* OUTLET MENU */}

                {outletDropdownOpen && (
                  <div className="percent-off-plan-outlet-menu">

                    {/* SEARCH */}

                    <div className="percent-off-plan-dropdown-search">

                      <SearchIcon />

                      <input
                        type="text"
                        value={
                          outletSearch
                        }
                        onChange={(event) =>
                          setOutletSearch(
                            event.target
                              .value
                          )
                        }
                        placeholder="Search outlet by name or ID..."
                        autoFocus
                      />

                    </div>

                    {/* COUNT */}

                    <div className="percent-off-plan-dropdown-count">
                      <span>
                        {filteredOutlets.length}
                      </span>

                      {filteredOutlets.length ===
                      1
                        ? " outlet"
                        : " outlets"}
                    </div>

                    {/* LIST */}

                    <div className="percent-off-plan-outlet-list">

                      {filteredOutlets.length ===
                      0 ? (
                        <div className="percent-off-plan-dropdown-empty">
                          No outlets found.
                        </div>
                      ) : (
                        filteredOutlets.map(
                          (outlet) => {

                            const outletId =
                              getId(
                                outlet
                              );

                            const isSelected =
                              String(
                                formData.outletId
                              ) ===
                              String(
                                outletId
                              );

                            return (
                              <button
                                key={
                                  outletId
                                }
                                type="button"
                                className={`percent-off-plan-outlet-option ${
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

                                <span
                                  className={`percent-off-plan-checkbox ${
                                    isSelected
                                      ? "checked"
                                      : ""
                                  }`}
                                >
                                  {isSelected && (
                                    <CheckIcon />
                                  )}
                                </span>

                                <span className="percent-off-plan-outlet-option-content">

                                  <span className="percent-off-plan-outlet-name">
                                    {getName(
                                      outlet
                                    )}
                                  </span>

                                  <span className="percent-off-plan-outlet-id">
                                    Outlet ID:{" "}
                                    {
                                      outletId
                                    }
                                  </span>

                                </span>

                              </button>
                            );
                          }
                        )
                      )}

                    </div>

                  </div>
                )}

              </div>

              <small className="percent-off-plan-help">
                Products and categories will
                be loaded for the selected
                outlet.
              </small>

            </div>

            {/* =================================================
                PLAN TYPE
            ================================================= */}

            <div className="percent-off-plan-field">

              <label>
                Plan Type
              </label>

              <div className="percent-off-plan-readonly-field">

                <PercentIcon />

                <span>
                  % OFF Plan
                </span>

              </div>

              <small className="percent-off-plan-help">
                Promotion Plan Type ID: 1
              </small>

            </div>

            {/* =================================================
                OFFER NAME
            ================================================= */}

            <div className="percent-off-plan-field">

              <label htmlFor="offerName">
                Offer Name
                <span className="required">
                  *
                </span>
              </label>

              <input
                id="offerName"
                type="text"
                name="offerName"
                value={
                  formData.offerName
                }
                onChange={handleChange}
                placeholder="Enter offer name"
                required
              />

            </div>

            {/* =================================================
                OFFER TYPE
            ================================================= */}

            <div className="percent-off-plan-field">

              <label htmlFor="offerType">
                Offer Type
                <span className="required">
                  *
                </span>
              </label>

              <select
                id="offerType"
                name="offerType"
                value={
                  formData.offerType
                }
                onChange={handleChange}
                required
              >

                <option value="FLAT">Flat Amount</option>
<option value="% OFF">Percentage Off</option>

              </select>

            </div>

            {/* =================================================
                OFFER AMOUNT
            ================================================= */}

            <div className="percent-off-plan-field">

              <label htmlFor="offerAmount">

                {formData.offerType ===
                "FLAT_AMOUNT"
                  ? "Offer Amount (₹)"
                  : "Offer Amount (%)"}

                <span className="required">
                  *
                </span>

              </label>

              <div className="percent-off-plan-input-wrapper">

                <span className="percent-off-plan-input-symbol">

                  {formData.offerType ===
                  "FLAT_AMOUNT" ? (
                    <RupeeIcon />
                  ) : (
                    "%"
                  )}

                </span>

                <input
                  id="offerAmount"
                  type="number"
                  name="offerAmount"
                  value={
                    formData.offerAmount
                  }
                  onChange={handleChange}
                  placeholder={
                    formData.offerType ===
                    "FLAT_AMOUNT"
                      ? "e.g. 100"
                      : "e.g. 20"
                  }
                  min="0"
                  max={
                    formData.offerType ===
                    "PERCENTAGE"
                      ? "100"
                      : undefined
                  }
                  step="0.01"
                  required
                />

              </div>

              <small className="percent-off-plan-help">

                {formData.offerType ===
                "FLAT_AMOUNT"
                  ? "Enter the discount amount in rupees."
                  : "Enter a percentage between 1 and 100."}

              </small>

            </div>

            {/* =================================================
                MINIMUM ORDER VALUE
            ================================================= */}

            <div className="percent-off-plan-field">

              <label htmlFor="minimumOrderValue">
                Minimum Order Value (₹)
                <span className="required">
                  *
                </span>
              </label>

              <div className="percent-off-plan-input-wrapper">

                <span className="percent-off-plan-input-symbol">
                  <RupeeIcon />
                </span>

                <input
                  id="minimumOrderValue"
                  type="number"
                  name="minimumOrderValue"
                  value={
                    formData.minimumOrderValue
                  }
                  onChange={handleChange}
                  placeholder="e.g. 499"
                  min="0"
                  step="0.01"
                  required
                />

              </div>

            </div>

          </div>

        </div>

        {/* =================================================
            APPLIES ON
        ================================================= */}

        <div className="percent-off-plan-section percent-off-plan-selection">

          <div className="percent-off-plan-section-heading">
            <span />
            <h3>
              Applies On
            </h3>
          </div>

          <div className="percent-off-plan-apply-grid">

            {/* =================================================
                ALL CATEGORIES
            ================================================= */}

            <label
              className={`percent-off-plan-apply-card ${
                applyTo === "ALL"
                  ? "active"
                  : ""
              }`}
            >

              <input
                type="radio"
                name="applyTo"
                value="ALL"
                checked={
                  applyTo === "ALL"
                }
                onChange={() => {
                  setApplyTo("ALL");
                  setSelectedCategories(
                    []
                  );
                  setSelectedProducts([]);
                  setCategoryDropdownOpen(
                    false
                  );
                  setProductDropdownOpen(
                    false
                  );
                }}
              />

              <span className="percent-off-plan-radio-custom">
                <span />
              </span>

              <span className="percent-off-plan-apply-content">

                <strong>
                  All Categories
                </strong>

                <small>
                  Applies to all categories
                  and all products in this
                  outlet
                </small>

              </span>

            </label>

            {/* =================================================
                CATEGORY
            ================================================= */}

            <div
              ref={categoryDropdownRef}
              className={`percent-off-plan-selection-dropdown ${
                applyTo ===
                "CATEGORY"
                  ? "active"
                  : ""
              }`}
            >

              <label className="percent-off-plan-apply-card">

                <input
                  type="radio"
                  name="applyTo"
                  value="CATEGORY"
                  checked={
                    applyTo ===
                    "CATEGORY"
                  }
                  onChange={() => {
                    setApplyTo(
                      "CATEGORY"
                    );
                    setProductDropdownOpen(
                      false
                    );
                  }}
                />

                <span className="percent-off-plan-radio-custom">
                  <span />
                </span>

                <span className="percent-off-plan-apply-content">

                  <strong>
                    Selected Categories
                  </strong>

                  <small>
                    Select one or more
                    categories
                  </small>

                </span>

              </label>

              {applyTo ===
                "CATEGORY" && (
                <button
                  type="button"
                  className={`percent-off-plan-dropdown-trigger ${
                    categoryDropdownOpen
                      ? "open"
                      : ""
                  }`}
                  onClick={() =>
                    setCategoryDropdownOpen(
                      (previous) =>
                        !previous
                    )
                  }
                >

                  <span>
                    {
                      categoryDropdownLabel
                    }
                  </span>

                  <ChevronIcon
                    open={
                      categoryDropdownOpen
                    }
                  />

                </button>
              )}

              {categoryDropdownOpen &&
                applyTo ===
                  "CATEGORY" && (
                  <div className="percent-off-plan-selection-menu">

                    <div className="percent-off-plan-dropdown-search">

                      <SearchIcon />

                      <input
                        type="text"
                        value={
                          categorySearch
                        }
                        onChange={(event) =>
                          setCategorySearch(
                            event.target
                              .value
                          )
                        }
                        placeholder="Search categories..."
                      />

                    </div>

                    <div className="percent-off-plan-menu-toolbar">

                      <span>
                        {categories.length}{" "}
                        categories
                      </span>

                      <div>

                        <button
                          type="button"
                          onClick={
                            selectAllCategories
                          }
                        >
                          Select All
                        </button>

                        <button
                          type="button"
                          onClick={
                            clearCategories
                          }
                        >
                          Clear
                        </button>

                      </div>

                    </div>

                    <div className="percent-off-plan-selection-list">

                      {loadingProducts ? (
                        <div className="percent-off-plan-dropdown-empty">
                          Loading categories...
                        </div>
                      ) : filteredCategories.length ===
                        0 ? (
                        <div className="percent-off-plan-dropdown-empty">
                          No categories found.
                        </div>
                      ) : (
                        filteredCategories.map(
                          (category) => {

                            const checked =
                              selectedCategories.some(
                                (id) =>
                                  String(
                                    id
                                  ) ===
                                  String(
                                    category.id
                                  )
                              );

                            return (
                              <label
                                key={
                                  category.id
                                }
                                className={`percent-off-plan-check-row ${
                                  checked
                                    ? "checked"
                                    : ""
                                }`}
                              >

                                <input
                                  type="checkbox"
                                  checked={
                                    checked
                                  }
                                  onChange={() =>
                                    toggleCategory(
                                      category.id
                                    )
                                  }
                                />

                                <span className="percent-off-plan-checkbox">
                                  {checked && (
                                    <CheckIcon />
                                  )}
                                </span>

                                <span className="percent-off-plan-check-name">
                                  {
                                    category.name
                                  }
                                </span>

                              </label>
                            );
                          }
                        )
                      )}

                    </div>

                  </div>
                )}

              {selectedCategories.length >
                0 && (
                <div className="percent-off-plan-selected-summary">

                  <span className="percent-off-plan-summary-label">
                    Selected:
                  </span>

                  {selectedCategories
                    .slice(0, 6)
                    .map(
                      (categoryId) => {

                        const category =
                          categories.find(
                            (item) =>
                              String(
                                item.id
                              ) ===
                              String(
                                categoryId
                              )
                          );

                        return (
                          <span
                            key={
                              categoryId
                            }
                            className="percent-off-plan-chip"
                          >
                            {
                              category?.name
                            }
                          </span>
                        );
                      }
                    )}

                  {selectedCategories.length >
                    6 && (
                    <span className="percent-off-plan-chip more">
                      +
                      {selectedCategories.length -
                        6}{" "}
                      more
                    </span>
                  )}

                </div>
              )}

            </div>

            {/* =================================================
                PRODUCTS
            ================================================= */}

            <div
              ref={productDropdownRef}
              className={`percent-off-plan-selection-dropdown ${
                applyTo ===
                "PRODUCT"
                  ? "active"
                  : ""
              }`}
            >

              <label className="percent-off-plan-apply-card">

                <input
                  type="radio"
                  name="applyTo"
                  value="PRODUCT"
                  checked={
                    applyTo ===
                    "PRODUCT"
                  }
                  onChange={() => {
                    setApplyTo(
                      "PRODUCT"
                    );
                    setCategoryDropdownOpen(
                      false
                    );
                  }}
                />

                <span className="percent-off-plan-radio-custom">
                  <span />
                </span>

                <span className="percent-off-plan-apply-content">

                  <strong>
                    Selected Products
                  </strong>

                  <small>
                    Select specific products
                    from the list
                  </small>

                </span>

              </label>

              {applyTo ===
                "PRODUCT" && (
                <button
                  type="button"
                  className={`percent-off-plan-dropdown-trigger ${
                    productDropdownOpen
                      ? "open"
                      : ""
                  }`}
                  onClick={() =>
                    setProductDropdownOpen(
                      (previous) =>
                        !previous
                    )
                  }
                >

                  <span>
                    {
                      productDropdownLabel
                    }
                  </span>

                  <ChevronIcon
                    open={
                      productDropdownOpen
                    }
                  />

                </button>
              )}

              {productDropdownOpen &&
                applyTo ===
                  "PRODUCT" && (
                  <div className="percent-off-plan-selection-menu">

                    <div className="percent-off-plan-dropdown-search">

                      <SearchIcon />

                      <input
                        type="text"
                        value={
                          productSearch
                        }
                        onChange={(event) =>
                          setProductSearch(
                            event.target
                              .value
                          )
                        }
                        placeholder="Search products..."
                      />

                    </div>

                    <div className="percent-off-plan-menu-toolbar">

                      <span>
                        {products.length}{" "}
                        products
                      </span>

                      <div>

                        <button
                          type="button"
                          onClick={
                            selectAllProducts
                          }
                        >
                          Select All
                        </button>

                        <button
                          type="button"
                          onClick={
                            clearProducts
                          }
                        >
                          Clear
                        </button>

                      </div>

                    </div>

                    <div className="percent-off-plan-selection-list">

                      {loadingProducts ? (
                        <div className="percent-off-plan-dropdown-empty">
                          Loading products...
                        </div>
                      ) : filteredProducts.length ===
                        0 ? (
                        <div className="percent-off-plan-dropdown-empty">
                          No products found for
                          this outlet.
                        </div>
                      ) : (
                        filteredProducts.map(
                          (product) => {

                            const productId =
                              getId(
                                product
                              );

                            const checked =
                              selectedProducts.some(
                                (id) =>
                                  String(
                                    id
                                  ) ===
                                  String(
                                    productId
                                  )
                              );

                            return (
                              <label
                                key={
                                  productId
                                }
                                className={`percent-off-plan-check-row ${
                                  checked
                                    ? "checked"
                                    : ""
                                }`}
                              >

                                <input
                                  type="checkbox"
                                  checked={
                                    checked
                                  }
                                  onChange={() =>
                                    toggleProduct(
                                      productId
                                    )
                                  }
                                />

                                <span className="percent-off-plan-checkbox">
                                  {checked && (
                                    <CheckIcon />
                                  )}
                                </span>

                                <span className="percent-off-plan-product-details">

                                  <strong>
                                    {getName(
                                      product
                                    )}
                                  </strong>

                                  <small>
                                    {getCategoryName(
                                      product
                                    )}
                                  </small>

                                </span>

                              </label>
                            );
                          }
                        )
                      )}

                    </div>

                  </div>
                )}

              {selectedProducts.length >
                0 && (
                <div className="percent-off-plan-selected-summary">

                  <span className="percent-off-plan-summary-label">
                    Selected:
                  </span>

                  {selectedProducts
                    .slice(0, 6)
                    .map(
                      (productId) => {

                        const product =
                          products.find(
                            (item) =>
                              String(
                                getId(item)
                              ) ===
                              String(
                                productId
                              )
                          );

                        return (
                          <span
                            key={
                              productId
                            }
                            className="percent-off-plan-chip"
                          >
                            {getName(
                              product
                            )}
                          </span>
                        );
                      }
                    )}

                  {selectedProducts.length >
                    6 && (
                    <span className="percent-off-plan-chip more">
                      +
                      {selectedProducts.length -
                        6}{" "}
                      more
                    </span>
                  )}

                </div>
              )}

            </div>

          </div>

        </div>

        {/* =================================================
            PLAN SCHEDULE
        ================================================= */}

        <div className="percent-off-plan-section percent-off-plan-schedule">

          <div className="percent-off-plan-section-heading">
            <span />
            <h3>
              Plan Schedule
            </h3>
          </div>

          <div className="percent-off-plan-form-grid">

            {/* =================================================
                START DATE
            ================================================= */}

            <div className="percent-off-plan-field">

              <label htmlFor="startDate">
                Start Date
                <span className="required">
                  *
                </span>
              </label>

              <div
                className="percent-off-plan-date-time-wrapper"
                onClick={() =>
                  openDatePicker(
                    startDateRef
                  )
                }
              >

                <span className="percent-off-plan-date-time-icon">
                  <CalendarIcon />
                </span>

                <input
                  ref={startDateRef}
                  id="startDate"
                  type="date"
                  name="startDate"
                  value={
                    formData.startDate
                  }
                  onChange={
                    handleChange
                  }
                  required
                />

              </div>

            </div>

            {/* =================================================
                END DATE
            ================================================= */}

            <div className="percent-off-plan-field">

              <label htmlFor="endDate">
                End Date
                <span className="required">
                  *
                </span>
              </label>

              <div
                className="percent-off-plan-date-time-wrapper"
                onClick={() =>
                  openDatePicker(
                    endDateRef
                  )
                }
              >

                <span className="percent-off-plan-date-time-icon">
                  <CalendarIcon />
                </span>

                <input
                  ref={endDateRef}
                  id="endDate"
                  type="date"
                  name="endDate"
                  value={
                    formData.endDate
                  }
                  onChange={
                    handleChange
                  }
                  required
                />

              </div>

            </div>

            {/* =================================================
                START TIME
            ================================================= */}

            <div className="percent-off-plan-field">

              <label htmlFor="startTime">
                Start Time
                <span className="required">
                  *
                </span>
              </label>

              <div
                className="percent-off-plan-date-time-wrapper"
                onClick={() =>
                  openTimePicker(
                    startTimeRef
                  )
                }
              >

                <span className="percent-off-plan-date-time-icon">
                  <ClockIcon />
                </span>

                <input
                  ref={startTimeRef}
                  id="startTime"
                  type="time"
                  name="startTime"
                  value={
                    formData.startTime
                  }
                  onChange={
                    handleChange
                  }
                  required
                />

              </div>

            </div>

            {/* =================================================
                END TIME
            ================================================= */}

            <div className="percent-off-plan-field">

              <label htmlFor="endTime">
                End Time
                <span className="required">
                  *
                </span>
              </label>

              <div
                className="percent-off-plan-date-time-wrapper"
                onClick={() =>
                  openTimePicker(
                    endTimeRef
                  )
                }
              >

                <span className="percent-off-plan-date-time-icon">
                  <ClockIcon />
                </span>

                <input
                  ref={endTimeRef}
                  id="endTime"
                  type="time"
                  name="endTime"
                  value={
                    formData.endTime
                  }
                  onChange={
                    handleChange
                  }
                  required
                />

              </div>

            </div>

            {/* =================================================
                MAXIMUM SELECTION
            ================================================= */}

            <div className="percent-off-plan-field percent-off-plan-max-selection">

              <label htmlFor="maximumSelection">
                Maximum Selection
              </label>

              <input
                id="maximumSelection"
                type="number"
                name="maximumSelection"
                value={
                  formData.maximumSelection
                }
                onChange={
                  handleChange
                }
                placeholder="-1"
                min="-1"
              />

              <small className="percent-off-plan-help">
                Enter -1 for unlimited
                selection.
              </small>

            </div>

          </div>

        </div>

        {/* =================================================
            ACTIONS
        ================================================= */}

        <div className="percent-off-plan-actions">

          <button
            type="button"
            className="percent-off-plan-reset"
            onClick={handleReset}
            disabled={submitting}
          >
            Reset
          </button>

          <button
            type="submit"
            className="percent-off-plan-submit"
            disabled={submitting}
          >
            {submitting
              ? "Creating..."
              : "Create % OFF Plan"}
          </button>

        </div>

      </form>

    </div>
  );
};

export default PercentOffPlan;