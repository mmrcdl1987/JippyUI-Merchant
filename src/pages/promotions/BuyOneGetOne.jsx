import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import "../../styles/BuyOneGetOne.css";

import {
  createPromotionPlan,
  getProductsByOutlet,
} from "../../services/promotionService";

/* =========================================================
   ICONS
========================================================= */

const CalendarIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
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
    width="18"
    height="18"
    viewBox="0 0 24 24"
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

const TagIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
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

const StoreIcon = () => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
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
    width="16"
    height="16"
    viewBox="0 0 24 24"
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

const ChevronIcon = ({ open = false }) => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={
      open
        ? "bogo-chevron-open"
        : ""
    }
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

/* =========================================================
   HELPERS
========================================================= */

const getId = (item) =>
  item?.id ??
  item?.productId ??
  item?.categoryId ??
  item?.outletId ??
  item?.foodId;

const getName = (item) =>
  item?.name ??
  item?.productName ??
  item?.categoryName ??
  item?.outletName ??
  item?.foodName ??
  "Unnamed";

const getCategoryName = (product) =>
  product?.categoryName ??
  product?.category?.name ??
  product?.category?.categoryName ??
  product?.category?.category_name ??
  product?.category_name ??
  (typeof product?.category === "string"
    ? product.category
    : "Other");

/* =========================================================
   COMPONENT
========================================================= */

const BuyOneGetOne = ({
  outlets = [],
  onCancel,
}) => {

  /* =======================================================
     CONSTANT
  ======================================================= */

  const PROMOTION_PLAN_TYPE_ID = 3;

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
     OUTLET DROPDOWN
  ======================================================= */

  const [outletDropdownOpen, setOutletDropdownOpen] =
    useState(false);

  const [outletSearch, setOutletSearch] =
    useState("");

  /* =======================================================
     FORM DATA
  ======================================================= */

  const [formData, setFormData] = useState({
    outletId: "",
    offerName: "",
    offerType: "FLAT_AMOUNT",
    offerAmount: "",
    minimumOrderValue: "",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    maximumSelection: -1,
  });

  /* =======================================================
     APPLY TO
  ======================================================= */

  const [applyTo, setApplyTo] =
    useState("ALL");

  const [selectedCategories, setSelectedCategories] =
    useState([]);

  const [selectedProducts, setSelectedProducts] =
    useState([]);

  /* =======================================================
     PRODUCTS
  ======================================================= */

  const [products, setProducts] =
    useState([]);

  const [loadingProducts, setLoadingProducts] =
    useState(false);

  /* =======================================================
     SUBMIT / MESSAGES
  ======================================================= */

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  /* =======================================================
     CATEGORY / PRODUCT DROPDOWNS
  ======================================================= */

  const [categoryDropdownOpen, setCategoryDropdownOpen] =
    useState(false);

  const [productDropdownOpen, setProductDropdownOpen] =
    useState(false);

  const [categorySearch, setCategorySearch] =
    useState("");

  const [productSearch, setProductSearch] =
    useState("");

  /* =======================================================
     NORMALIZE OUTLETS
  ======================================================= */

  const outletList = useMemo(() => {

    if (Array.isArray(outlets)) {
      return outlets;
    }

    if (Array.isArray(outlets?.content)) {
      return outlets.content;
    }

    if (Array.isArray(outlets?.data)) {
      return outlets.data;
    }

    return [];

  }, [outlets]);

  /* =======================================================
     FILTER OUTLETS
  ======================================================= */

  const filteredOutlets = useMemo(() => {

    const search =
      outletSearch
        .trim()
        .toLowerCase();

    if (!search) {
      return outletList;
    }

    return outletList.filter((outlet) => {

      const outletName =
        String(
          outlet?.outletName ?? ""
        ).toLowerCase();

      const outletId =
        String(
          outlet?.outletId ??
          outlet?.id ??
          ""
        ).toLowerCase();

      return (
        outletName.includes(search) ||
        outletId.includes(search)
      );
    });

  }, [outletList, outletSearch]);

  /* =======================================================
     SELECTED OUTLET
  ======================================================= */

  const selectedOutlet = useMemo(() => {

    if (!formData.outletId) {
      return null;
    }

    return outletList.find(
      (outlet) =>
        Number(
          outlet?.outletId ??
          outlet?.id
        ) ===
        Number(formData.outletId)
    );

  }, [
    outletList,
    formData.outletId,
  ]);

  /* =======================================================
     LOAD PRODUCTS
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
            Number(formData.outletId)
          );

        console.log(
          "BOGO PRODUCTS:",
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
          Array.isArray(response?.data?.content)
        ) {
          productData =
            response.data.content;
        }

        setProducts(productData);

        setSelectedCategories([]);
        setSelectedProducts([]);

      } catch (err) {

        console.error(
          "Failed to load BOGO products:",
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
     CATEGORIES
  ======================================================= */

 const categories = useMemo(() => {
  const map = new Map();

  products.forEach((product) => {
    const categoryName = getCategoryName(product);

    const categoryObject =
      product?.category &&
      typeof product.category === "object"
        ? product.category
        : null;

    const categoryId =
      categoryObject?.id ??
      categoryObject?.categoryId ??
      product?.outletCategoryId ??
      product?.categoryId;

    if (
      categoryId === undefined ||
      categoryId === null
    ) {
      return;
    }

    const normalizedId = String(categoryId);

    if (!map.has(normalizedId)) {
      map.set(normalizedId, {
        id: normalizedId,
        name: categoryName,
      });
    }
  });

  return Array.from(map.values());
}, [products]);
  

  /* =======================================================
     FILTER CATEGORIES
  ======================================================= */

  const filteredCategories =
    useMemo(() => {

      const search =
        categorySearch
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

  const filteredProducts =
    useMemo(() => {

      const search =
        productSearch
          .trim()
          .toLowerCase();

      if (!search) {
        return products;
      }

      return products.filter(
        (product) => {

          const productName =
            getName(product)
              .toLowerCase();

          const categoryName =
            getCategoryName(product)
              .toLowerCase();

          return (
            productName.includes(search) ||
            categoryName.includes(search)
          );
        }
      );

    }, [
      products,
      productSearch,
    ]);

  /* =======================================================
     OUTSIDE CLICK
  ======================================================= */

  useEffect(() => {

    const handleOutsideClick =
      (event) => {

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
     FORM CHANGE
  ======================================================= */

  const handleChange = (event) => {

    const {
      name,
      value,
    } = event.target;

    if (name === "offerType") {

      setFormData((previous) => ({
        ...previous,
        offerType: value,
        offerAmount: "",
      }));

      return;
    }

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

  };

  /* =======================================================
     OUTLET SELECT
  ======================================================= */

  const handleOutletSelect =
    (outletId) => {

      setFormData((previous) => ({
        ...previous,
        outletId: String(outletId),
      }));

      setOutletDropdownOpen(false);
      setOutletSearch("");

      setSelectedCategories([]);
      setSelectedProducts([]);

      setCategoryDropdownOpen(false);
      setProductDropdownOpen(false);
    };

  /* =======================================================
     CATEGORY CHECKBOX
  ======================================================= */

  const handleCategoryChange =
    (categoryId) => {

      const id =
        String(categoryId);

      setSelectedCategories(
        (previous) => {

          const exists =
            previous.some(
              (item) =>
                String(item) === id
            );

          if (exists) {

            return previous.filter(
              (item) =>
                String(item) !== id
            );

          }

          return [
            ...previous,
            id,
          ];
        }
      );

    };

  /* =======================================================
     PRODUCT CHECKBOX
  ======================================================= */

  const handleProductChange =
    (productId) => {

      const id =
        String(productId);

      setSelectedProducts(
        (previous) => {

          const exists =
            previous.some(
              (item) =>
                String(item) === id
            );

          if (exists) {

            return previous.filter(
              (item) =>
                String(item) !== id
            );

          }

          return [
            ...previous,
            id,
          ];
        }
      );

    };

  /* =======================================================
     SELECT ALL CATEGORIES
  ======================================================= */

  const selectAllCategories = () => {

    setSelectedCategories(
      filteredCategories
        .map(
          (category) =>
            String(category.id)
        )
    );

  };

  const clearCategories = () => {
    setSelectedCategories([]);
  };

  /* =======================================================
     SELECT ALL PRODUCTS
  ======================================================= */

  const selectAllProducts = () => {

    setSelectedProducts(
      filteredProducts
        .map((product) =>
          getId(product)
        )
        .filter(
          (id) =>
            id !== undefined &&
            id !== null
        )
        .map((id) =>
          String(id)
        )
    );

  };

  const clearProducts = () => {
    setSelectedProducts([]);
  };

  /* =======================================================
     DROPDOWN LABELS
  ======================================================= */

  const categoryDropdownLabel =
    useMemo(() => {

      if (
        selectedCategories.length === 0
      ) {
        return "Select categories";
      }

      return `${selectedCategories.length} categor${
        selectedCategories.length === 1
          ? "y"
          : "ies"
      } selected`;

    }, [selectedCategories]);

  const productDropdownLabel =
    useMemo(() => {

      if (
        selectedProducts.length === 0
      ) {
        return "Select products";
      }

      return `${selectedProducts.length} product${
        selectedProducts.length === 1
          ? ""
          : "s"
      } selected`;

    }, [selectedProducts]);

  /* =======================================================
     DATE / TIME PICKERS
  ======================================================= */

  const openDatePicker = (ref) => {

    if (!ref.current) {
      return;
    }

    if (
      typeof ref.current.showPicker ===
      "function"
    ) {
      ref.current.showPicker();
    } else {
      ref.current.focus();
    }
  };

  const openTimePicker = (ref) => {

    if (!ref.current) {
      return;
    }

    if (
      typeof ref.current.showPicker ===
      "function"
    ) {
      ref.current.showPicker();
    } else {
      ref.current.focus();
    }
  };

  /* =======================================================
     VALIDATION
  ======================================================= */

  const validateForm = () => {

    if (!formData.outletId) {
      return "Please select an outlet.";
    }

    if (
      !formData.offerName.trim()
    ) {
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

    if (
      !formData.minimumOrderValue
    ) {
      return "Please enter minimum order value.";
    }

    if (
      Number(
        formData.minimumOrderValue
      ) < 0
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

  const handleSubmit =
    async (event) => {

      event.preventDefault();

      setError("");
      setSuccess("");

      const validationError =
        validateForm();

      if (validationError) {

        setError(
          validationError
        );

        return;
      }

      try {

        setSubmitting(true);

        /*
         * Backend DTO expects LocalTime.
         * Send HH:mm:ss.
         */

        const payload = {

          outletId:
            Number(
              formData.outletId
            ),

          promotionPlanTypeId:
            PROMOTION_PLAN_TYPE_ID,

          planStartDate:
            formData.startDate,

          planEndDate:
            formData.endDate,

          planStartTime:
            `${formData.startTime}:00`,

          planEndTime:
            `${formData.endTime}:00`,

          offerName:
            formData.offerName.trim(),

          minimumOrderValue:
            Number(
              formData.minimumOrderValue
            ),

          offerAmount:
            Number(
              formData.offerAmount
            ),

          offerType:
            formData.offerType ===
            "FLAT_AMOUNT"
              ? "FLAT"
              : "% OFF",

          productIds:
            applyTo === "PRODUCT"
              ? selectedProducts
                  .map(Number)
                  .filter(
                    (id) =>
                      Number.isInteger(id)
                  )
              : [],

          outletCategoryIds:
            applyTo === "CATEGORY"
              ? selectedCategories
                  .map(Number)
                  .filter(
                    (id) =>
                      Number.isInteger(id)
                  )
              : [],

          maxSelection:
            formData.maximumSelection ===
              "" ||
            formData.maximumSelection ===
              null
              ? -1
              : Number(
                  formData.maximumSelection
                ),
        };

        console.log(
          "================================"
        );

        console.log(
          "CREATE BOGO PAYLOAD:"
        );

        console.log(payload);

        console.log(
          JSON.stringify(
            payload,
            null,
            2
          )
        );

        console.log(
          "================================"
        );

        await createPromotionPlan(
          payload
        );

        setSuccess(
          "Buy One Get One offer created successfully."
        );

        if (onCancel) {

          setTimeout(() => {
            onCancel();
          }, 800);

        }

      } catch (err) {

        console.error(
          "Create BOGO failed:",
          err
        );

        console.error(
          "Backend response:",
          err?.response?.data
        );

        setError(
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to create Buy One Get One offer."
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
      outletId: "",
      offerName: "",
      offerType: "FLAT_AMOUNT",
      offerAmount: "",
      minimumOrderValue: "",
      startDate: "",
      endDate: "",
      startTime: "",
      endTime: "",
      maximumSelection: -1,
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
     JSX
  ======================================================= */

  return (
    <div className="bogo-plan">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="bogo-header">

        <div className="bogo-title-wrapper">

          <div className="bogo-title-icon">
            <TagIcon />
          </div>

          <div>

            <h2>
              Buy One Get One
            </h2>

            <p>
              Create attractive Buy One
              Get One promotional offers
              for your outlet
            </p>

          </div>

        </div>

        <div className="bogo-badge">
          1 + 1 OFFER
        </div>

      </div>

      {/* =================================================
          MESSAGES
      ================================================= */}

      {success && (
        <div className="bogo-success">
          ✓ {success}
        </div>
      )}

      {error && (
        <div className="bogo-error">
          ⚠ {error}
        </div>
      )}

      <form
        className="bogo-form"
        onSubmit={handleSubmit}
      >

        {/* =================================================
            PLAN DETAILS
        ================================================= */}

        <div className="bogo-section">

          <div className="bogo-section-heading">
            <span />
            <h3>
              Plan Details
            </h3>
          </div>

          <div className="bogo-grid">

            {/* =================================================
                OUTLET
            ================================================= */}

            <div className="bogo-field">

              <label>
                Outlet{" "}
                <span>*</span>
              </label>

              <div
                className="bogo-outlet-dropdown"
                ref={outletDropdownRef}
              >

                <button
                  type="button"
                  className={`bogo-outlet-trigger ${
                    outletDropdownOpen
                      ? "bogo-outlet-trigger-open"
                      : ""
                  }`}
                  onClick={() => {

                    setOutletDropdownOpen(
                      (previous) =>
                        !previous
                    );

                    setCategoryDropdownOpen(
                      false
                    );

                    setProductDropdownOpen(
                      false
                    );

                  }}
                >

                  <span className="bogo-outlet-trigger-left">

                    <StoreIcon />

                    <span>

                      {selectedOutlet
                        ? (
                          selectedOutlet.outletName ||
                          selectedOutlet.name ||
                          `Outlet ${
                            selectedOutlet.outletId ||
                            selectedOutlet.id
                          }`
                        )
                        : "Select outlet"}

                    </span>

                  </span>

                  <ChevronIcon
                    open={
                      outletDropdownOpen
                    }
                  />

                </button>

                {outletDropdownOpen && (

                  <div className="bogo-outlet-menu">

                    <div className="bogo-search">

                      <SearchIcon />

                      <input
                        type="text"
                        value={outletSearch}
                        onChange={(e) =>
                          setOutletSearch(
                            e.target.value
                          )
                        }
                        placeholder="Search outlet..."
                        autoFocus
                      />

                    </div>

                    <div className="bogo-outlet-list">

                      {filteredOutlets.length >
                      0 ? (

                        filteredOutlets.map(
                          (outlet) => {

                            const outletId =
                              outlet?.outletId ??
                              outlet?.id;

                            const isSelected =
                              String(
                                formData.outletId
                              ) ===
                              String(
                                outletId
                              );

                            return (

                              <label
                                key={
                                  outletId
                                }
                                className={`bogo-outlet-row ${
                                  isSelected
                                    ? "checked"
                                    : ""
                                }`}
                              >

                                <input
                                  type="checkbox"
                                  checked={
                                    isSelected
                                  }
                                  onChange={() =>
                                    handleOutletSelect(
                                      outletId
                                    )
                                  }
                                />

                                <span className="bogo-custom-checkbox">
                                  {isSelected
                                    ? "✓"
                                    : ""}
                                </span>

                                <span className="bogo-outlet-details">

                                  <span className="bogo-outlet-name">

                                    {outlet?.outletName ||
                                      outlet?.name ||
                                      `Outlet ${
                                        outletId
                                      }`}

                                  </span>

                                  <span className="bogo-outlet-id">

                                    Outlet ID:{" "}
                                    {outletId}

                                  </span>

                                </span>

                              </label>
                            );
                          }
                        )

                      ) : (

                        <div className="bogo-dropdown-empty">
                          No outlets found
                        </div>

                      )}

                    </div>

                  </div>

                )}

              </div>

              <small>
                Products and categories
                will be loaded for the
                selected outlet.
              </small>

            </div>

            {/* =================================================
                PLAN TYPE
            ================================================= */}

            <div className="bogo-field">

              <label>
                Plan Type
              </label>

              <input
                type="text"
                value="1+1 Offer"
                readOnly
                className="bogo-readonly"
              />

              <small>
                Promotion Plan Type ID: 3
              </small>

            </div>

            {/* =================================================
                OFFER NAME
            ================================================= */}

            <div className="bogo-field">

              <label>
                Offer Name{" "}
                <span>*</span>
              </label>

              <input
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

            <div className="bogo-field">

              <label
                htmlFor="bogo-offer-type"
              >
                Offer Type{" "}
                <span>*</span>
              </label>

              <select
                id="bogo-offer-type"
                name="offerType"
                value={
                  formData.offerType
                }
                onChange={handleChange}
                required
              >

                <option value="">
                  Select Offer Type
                </option>

                <option value="FLAT_AMOUNT">
                  Flat Amount
                </option>

                <option value="PERCENTAGE">
                  Percentage
                </option>

              </select>

            </div>

            {/* =================================================
                OFFER AMOUNT
            ================================================= */}

            <div className="bogo-field">

              <label
                htmlFor="bogo-offer-amount"
              >

                {formData.offerType ===
                "PERCENTAGE"
                  ? "Offer Amount (%)"
                  : "Offer Amount (₹)"}

                <span>
                  {" "}*
                </span>

              </label>

              <div className="bogo-input-icon">

                <span className="bogo-currency">

                  {formData.offerType ===
                  "PERCENTAGE"
                    ? "%"
                    : "₹"}

                </span>

                <input
                  id="bogo-offer-amount"
                  type="number"
                  name="offerAmount"
                  value={
                    formData.offerAmount
                  }
                  onChange={handleChange}
                  placeholder={
                    formData.offerType ===
                    "PERCENTAGE"
                      ? "e.g. 20"
                      : "e.g. 100"
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

            </div>

            {/* =================================================
                MINIMUM ORDER
            ================================================= */}

            <div className="bogo-field">

              <label>
                Minimum Order Value (₹){" "}
                <span>*</span>
              </label>

              <div className="bogo-input-icon">

                <span className="bogo-currency">
                  ₹
                </span>

                <input
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

            {/* =================================================
                MAXIMUM SELECTION
            ================================================= */}

            <div className="bogo-field">

              <label>
                Maximum Selection
              </label>

              <input
                type="number"
                name="maximumSelection"
                value={
                  formData.maximumSelection
                }
                onChange={handleChange}
                min="-1"
                placeholder="-1 for unlimited"
              />

              <small>
                Use -1 for unlimited selection.
              </small>

            </div>

          </div>

        </div>

        {/* =================================================
            APPLIES ON
        ================================================= */}

        <div className="bogo-section">

          <div className="bogo-section-heading">
            <span />
            <h3>
              Applies On
            </h3>
          </div>

          <div className="bogo-apply-grid">

            {/* ALL */}

            <label
              className={`bogo-apply-card ${
                applyTo === "ALL"
                  ? "active"
                  : ""
              }`}
            >

              <input
                type="radio"
                name="bogoApplyTo"
                value="ALL"
                checked={
                  applyTo === "ALL"
                }
                onChange={() =>
                  setApplyTo("ALL")
                }
              />

              <span className="bogo-radio-circle">
                {applyTo === "ALL" && (
                  <span />
                )}
              </span>

              <div>

                <strong>
                  All Categories
                </strong>

                <small>
                  Applies to all products
                  in this outlet.
                </small>

              </div>

            </label>

            {/* CATEGORY */}

            <label
              className={`bogo-apply-card ${
                applyTo === "CATEGORY"
                  ? "active"
                  : ""
              }`}
            >

              <input
                type="radio"
                name="bogoApplyTo"
                value="CATEGORY"
                checked={
                  applyTo === "CATEGORY"
                }
                onChange={() =>
                  setApplyTo("CATEGORY")
                }
              />

              <span className="bogo-radio-circle">
                {applyTo === "CATEGORY" && (
                  <span />
                )}
              </span>

              <div>

                <strong>
                  Selected Categories
                </strong>

                <small>
                  Apply the offer to
                  selected categories.
                </small>

              </div>

            </label>

            {/* PRODUCT */}

            <label
              className={`bogo-apply-card ${
                applyTo === "PRODUCT"
                  ? "active"
                  : ""
              }`}
            >

              <input
                type="radio"
                name="bogoApplyTo"
                value="PRODUCT"
                checked={
                  applyTo === "PRODUCT"
                }
                onChange={() =>
                  setApplyTo("PRODUCT")
                }
              />

              <span className="bogo-radio-circle">
                {applyTo === "PRODUCT" && (
                  <span />
                )}
              </span>

              <div>

                <strong>
                  Selected Products
                </strong>

                <small>
                  Apply the offer to
                  selected products.
                </small>

              </div>

            </label>

          </div>

          {/* =================================================
              CATEGORY DROPDOWN
          ================================================= */}

          {applyTo === "CATEGORY" && (

            <div
              className="bogo-dropdown-wrapper"
              ref={categoryDropdownRef}
            >

              <div className="bogo-dropdown-label-row">

                <label>
                  Categories
                </label>

                <span>
                  {selectedCategories.length} selected
                </span>

              </div>

              <button
                type="button"
                className={`bogo-dropdown-trigger ${
                  categoryDropdownOpen
                    ? "open"
                    : ""
                }`}
                onClick={() => {

                  setCategoryDropdownOpen(
                    (previous) =>
                      !previous
                  );

                  setProductDropdownOpen(
                    false
                  );

                  setOutletDropdownOpen(
                    false
                  );

                }}
              >

                <span>
                  {categoryDropdownLabel}
                </span>

                <ChevronIcon
                  open={
                    categoryDropdownOpen
                  }
                />

              </button>

              {categoryDropdownOpen && (

                <div className="bogo-dropdown-menu">

                  <div className="bogo-search">

                    <SearchIcon />

                    <input
                      type="text"
                      value={
                        categorySearch
                      }
                      onChange={(e) =>
                        setCategorySearch(
                          e.target.value
                        )
                      }
                      placeholder="Search categories..."
                      autoFocus
                    />

                  </div>

                  <div className="bogo-dropdown-actions">

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

                  <div className="bogo-dropdown-count">
                    {filteredCategories.length} categories
                  </div>

                  <div className="bogo-dropdown-list">

                    {filteredCategories.length >
                    0 ? (

                      filteredCategories.map(
                        (category) => {

                          const id =
                            String(
                              category.id
                            );

                          const checked =
                            selectedCategories.some(
                              (item) =>
                                String(
                                  item
                                ) === id
                            );

                          return (

                            <label
                              key={id}
                              className={`bogo-checkbox-row ${
                                checked
                                  ? "checked"
                                  : ""
                              }`}
                            >

                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() =>
                                  handleCategoryChange(
                                    id
                                  )
                                }
                              />

                              <span className="bogo-custom-checkbox">
                                {checked
                                  ? "✓"
                                  : ""}
                              </span>

                              <span className="bogo-product-info">

                                <span>
                                  {category.name}
                                </span>

                              </span>

                            </label>

                          );

                        }
                      )

                    ) : (

                      <div className="bogo-dropdown-empty">
                        No categories found
                      </div>

                    )}

                  </div>

                </div>

              )}

              {selectedCategories.length >
                0 && (

                <div className="bogo-selected-chips">

                  {selectedCategories
                    .slice(0, 3)
                    .map((id) => {

                      const category =
                        categories.find(
                          (item) =>
                            String(
                              item.id
                            ) ===
                            String(id)
                        );

                      return (
                        <span
                          key={id}
                          className="bogo-chip"
                        >
                          {category?.name ||
                            `Category ${id}`}
                        </span>
                      );

                    })}

                  {selectedCategories.length >
                    3 && (

                    <span className="bogo-chip more">
                      +
                      {selectedCategories.length -
                        3}
                      more
                    </span>

                  )}

                </div>

              )}

            </div>

          )}

          {/* =================================================
              PRODUCT DROPDOWN
          ================================================= */}

          {applyTo === "PRODUCT" && (

            <div
              className="bogo-dropdown-wrapper"
              ref={productDropdownRef}
            >

              <div className="bogo-dropdown-label-row">

                <label>
                  Products
                </label>

                <span>
                  {selectedProducts.length} selected
                </span>

              </div>

              <button
                type="button"
                className={`bogo-dropdown-trigger ${
                  productDropdownOpen
                    ? "open"
                    : ""
                }`}
                onClick={() => {

                  setProductDropdownOpen(
                    (previous) =>
                      !previous
                  );

                  setCategoryDropdownOpen(
                    false
                  );

                  setOutletDropdownOpen(
                    false
                  );

                }}
              >

                <span>
                  {productDropdownLabel}
                </span>

                <ChevronIcon
                  open={
                    productDropdownOpen
                  }
                />

              </button>

              {productDropdownOpen && (

                <div className="bogo-dropdown-menu">

                  <div className="bogo-search">

                    <SearchIcon />

                    <input
                      type="text"
                      value={
                        productSearch
                      }
                      onChange={(e) =>
                        setProductSearch(
                          e.target.value
                        )
                      }
                      placeholder="Search products..."
                      autoFocus
                    />

                  </div>

                  <div className="bogo-dropdown-actions">

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

                  <div className="bogo-dropdown-count">
                    {filteredProducts.length} products
                  </div>

                  <div className="bogo-dropdown-list">

                    {filteredProducts.length >
                    0 ? (

                      filteredProducts.map(
                        (product) => {

                          const id =
                            getId(product);

                          if (
                            id === undefined ||
                            id === null
                          ) {
                            return null;
                          }

                          const checked =
                            selectedProducts.some(
                              (item) =>
                                String(
                                  item
                                ) ===
                                String(id)
                            );

                          return (

                            <label
                              key={
                                String(id)
                              }
                              className={`bogo-checkbox-row ${
                                checked
                                  ? "checked"
                                  : ""
                              }`}
                            >

                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() =>
                                  handleProductChange(
                                    id
                                  )
                                }
                              />

                              <span className="bogo-custom-checkbox">
                                {checked
                                  ? "✓"
                                  : ""}
                              </span>

                              <span className="bogo-product-info">

                                <span>
                                  {getName(
                                    product
                                  )}
                                </span>

                                <small>
                                  {
                                    getCategoryName(
                                      product
                                    )
                                  }
                                </small>

                              </span>

                            </label>

                          );

                        }
                      )

                    ) : (

                      <div className="bogo-dropdown-empty">

                        {loadingProducts
                          ? "Loading products..."
                          : "No products found"}

                      </div>

                    )}

                  </div>

                </div>

              )}

              {selectedProducts.length >
                0 && (

                <div className="bogo-selected-chips">

                  {selectedProducts
                    .slice(0, 3)
                    .map((id) => {

                      const product =
                        products.find(
                          (item) =>
                            String(
                              getId(item)
                            ) ===
                            String(id)
                        );

                      return (
                        <span
                          key={id}
                          className="bogo-chip"
                        >
                          {getName(
                            product
                          )}
                        </span>
                      );

                    })}

                  {selectedProducts.length >
                    3 && (

                    <span className="bogo-chip more">

                      +
                      {selectedProducts.length -
                        3}
                      more

                    </span>

                  )}

                </div>

              )}

            </div>

          )}

        </div>

        {/* =================================================
            DATE & TIME
        ================================================= */}

        <div className="bogo-section">

          <div className="bogo-section-heading">
            <span />
            <h3>
              Promotion Schedule
            </h3>
          </div>

          <div className="bogo-grid">

            {/* START DATE */}

            <div className="bogo-field">

              <label>
                Start Date{" "}
                <span>*</span>
              </label>

              <div
                className="bogo-date-wrapper"
                onClick={() =>
                  openDatePicker(
                    startDateRef
                  )
                }
              >

                <CalendarIcon />

                <input
                  ref={startDateRef}
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

            {/* END DATE */}

            <div className="bogo-field">

              <label>
                End Date{" "}
                <span>*</span>
              </label>

              <div
                className="bogo-date-wrapper"
                onClick={() =>
                  openDatePicker(
                    endDateRef
                  )
                }
              >

                <CalendarIcon />

                <input
                  ref={endDateRef}
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

            {/* START TIME */}

            <div className="bogo-field">

              <label>
                Start Time{" "}
                <span>*</span>
              </label>

              <div
                className="bogo-date-wrapper"
                onClick={() =>
                  openTimePicker(
                    startTimeRef
                  )
                }
              >

                <ClockIcon />

                <input
                  ref={startTimeRef}
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

            {/* END TIME */}

            <div className="bogo-field">

              <label>
                End Time{" "}
                <span>*</span>
              </label>

              <div
                className="bogo-date-wrapper"
                onClick={() =>
                  openTimePicker(
                    endTimeRef
                  )
                }
              >

                <ClockIcon />

                <input
                  ref={endTimeRef}
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

          </div>

        </div>

        {/* =================================================
            ACTIONS
        ================================================= */}

        <div className="bogo-actions">

          <button
            type="button"
            className="bogo-reset"
            onClick={handleReset}
            disabled={submitting}
          >
            Reset
          </button>

          <button
            type="submit"
            className="bogo-submit"
            disabled={submitting}
          >

            {submitting
              ? "Creating..."
              : "Create 1+1 Offer"}

          </button>

        </div>

      </form>

    </div>
  );
};

export default BuyOneGetOne;