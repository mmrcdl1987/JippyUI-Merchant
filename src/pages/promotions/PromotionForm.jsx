import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  FaTags,
  FaChartLine,
} from "react-icons/fa";

import {
  createPromotionPlan,
  getProductsByOutlet,
} from "../../services/promotionService";

import "../../styles/PromotionForm.css";


/* =========================================================
   ICONS
========================================================= */

const CalendarIcon = () => (
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
    <rect
      x="3"
      y="4"
      width="18"
      height="17"
      rx="2"
    />

    <line
      x1="16"
      y1="2"
      x2="16"
      y2="6"
    />

    <line
      x1="8"
      y1="2"
      x2="8"
      y2="6"
    />

    <line
      x1="3"
      y1="10"
      x2="21"
      y2="10"
    />
  </svg>
);


const ClockIcon = () => (
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
    <circle
      cx="12"
      cy="12"
      r="9"
    />

    <polyline
      points="12 7 12 12 15 14"
    />
  </svg>
);


const StoreIcon = () => (
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
    <path d="M3 9l2-5h14l2 5" />
    <path d="M5 9v10h14V9" />
    <path d="M3 9h18" />
    <path d="M8 19v-5h8v5" />
  </svg>
);


const SearchIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle
      cx="11"
      cy="11"
      r="7"
    />

    <line
      x1="16.5"
      y1="16.5"
      x2="21"
      y2="21"
    />
  </svg>
);


const CheckIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="13"
    height="13"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="5 12 10 17 19 7" />
  </svg>
);


const ChevronIcon = ({ open }) => (
  <svg
    className={
      open
        ? "promotion-form-chevron open"
        : "promotion-form-chevron"
    }
    viewBox="0 0 24 24"
    width="17"
    height="17"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="6 9 12 15 18 9" />
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

const PromotionForm = ({
  promotionTypeId,
  promotionTypeName,
  outlets = [],
  loadingOutlets = false,
  outletError = "",
}) => {

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
     INITIAL FORM
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


  const [formData, setFormData] =
    useState(initialFormData);


  /* =======================================================
     OUTLET DROPDOWN
  ======================================================= */

  const [
    outletDropdownOpen,
    setOutletDropdownOpen,
  ] = useState(false);

  const [
    outletSearch,
    setOutletSearch,
  ] = useState("");


  /* =======================================================
     PRODUCTS
  ======================================================= */

  const [
    products,
    setProducts,
  ] = useState([]);

  const [
    loadingProducts,
    setLoadingProducts,
  ] = useState(false);


  /* =======================================================
     SELECTED ITEMS
  ======================================================= */

  const [
    selectedCategories,
    setSelectedCategories,
  ] = useState([]);

  const [
    selectedProducts,
    setSelectedProducts,
  ] = useState([]);


  /* =======================================================
     APPLY TO
  ======================================================= */

  const [
    applyTo,
    setApplyTo,
  ] = useState("ALL");


  /* =======================================================
     CATEGORY DROPDOWN
  ======================================================= */

  const [
    categoryDropdownOpen,
    setCategoryDropdownOpen,
  ] = useState(false);

  const [
    categorySearch,
    setCategorySearch,
  ] = useState("");


  /* =======================================================
     PRODUCT DROPDOWN
  ======================================================= */

  const [
    productDropdownOpen,
    setProductDropdownOpen,
  ] = useState(false);

  const [
    productSearch,
    setProductSearch,
  ] = useState("");


  /* =======================================================
     UI STATE
  ======================================================= */

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");


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

    if (Array.isArray(outlets?.data?.content)) {
      return outlets.data.content;
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

      const name =
        String(getName(outlet))
          .toLowerCase();

      const id =
        String(getId(outlet))
          .toLowerCase();

      return (
        name.includes(search) ||
        id.includes(search)
      );

    });

  }, [
    outletList,
    outletSearch,
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

          productData =
            response.data;

        } else if (
          Array.isArray(response?.content)
        ) {

          productData =
            response.content;

        } else if (
          Array.isArray(response?.products)
        ) {

          productData =
            response.products;

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
     CREATE UNIQUE CATEGORIES FROM PRODUCTS
  ======================================================= */

  const categories = useMemo(() => {

    const map = new Map();

    products.forEach((product) => {

      const categoryName =
        getCategoryName(product);

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

      if (
        !map.has(
          String(categoryId)
        )
      ) {

        map.set(
          String(categoryId),
          {
            id: categoryId,
            name: categoryName,
          }
        );

      }

    });

    return Array.from(
      map.values()
    );

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

          const name =
            getName(product)
              .toLowerCase();

          const category =
            getCategoryName(product)
              .toLowerCase();

          return (
            name.includes(search) ||
            category.includes(search)
          );

        }
      );

    }, [
      products,
      productSearch,
    ]);


  /* =======================================================
     SELECTED OUTLET
  ======================================================= */

  const selectedOutlet =
    useMemo(() => {

      return outletList.find(
        (outlet) =>
          String(
            getId(outlet)
          ) ===
          String(
            formData.outletId
          )
      );

    }, [
      outletList,
      formData.outletId,
    ]);


  /* =======================================================
     SELECTED PRODUCT NAMES
     
     IMPORTANT:
     State still contains IDs.
     UI displays names.
  ======================================================= */

  const selectedProductNames =
    useMemo(() => {

      return selectedProducts
        .map((selectedId) => {

          const product =
            products.find(
              (item) =>
                String(
                  getId(item)
                ) ===
                String(selectedId)
            );

          return product
            ? getName(product)
            : null;

        })
        .filter(Boolean);

    }, [
      selectedProducts,
      products,
    ]);


  /* =======================================================
     SELECTED CATEGORY NAMES
  ======================================================= */

  const selectedCategoryNames =
    useMemo(() => {

      return selectedCategories
        .map((selectedId) => {

          const category =
            categories.find(
              (item) =>
                String(item.id) ===
                String(selectedId)
            );

          return category
            ? category.name
            : null;

        })
        .filter(Boolean);

    }, [
      selectedCategories,
      categories,
    ]);


  /* =======================================================
     DROPDOWN LABELS

     Instead of:
     "2 products selected"

     show:
     "Chicken Biryani, Veg Biryani"
  ======================================================= */

  const categoryDropdownLabel =
    useMemo(() => {

      if (
        selectedCategoryNames.length === 0
      ) {
        return "Select categories";
      }

      return selectedCategoryNames.join(
        ", "
      );

    }, [
      selectedCategoryNames,
    ]);


  const productDropdownLabel =
    useMemo(() => {

      if (
        selectedProductNames.length === 0
      ) {
        return "Select products";
      }

      return selectedProductNames.join(
        ", "
      );

    }, [
      selectedProductNames,
    ]);


  /* =======================================================
     CLOSE DROPDOWNS ON OUTSIDE CLICK
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
     HANDLE INPUT
  ======================================================= */

  const handleChange = (event) => {

    const {
      name,
      value,
    } = event.target;

    setFormData(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );

    setError("");
    setSuccess("");

  };


  /* =======================================================
     SELECT OUTLET
  ======================================================= */

  const handleOutletSelect =
    (outlet) => {

      const id =
        getId(outlet);

      setFormData(
        (previous) => ({
          ...previous,
          outletId: id,
        })
      );

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
     TOGGLE CATEGORY
  ======================================================= */

  const toggleCategory =
    (categoryId) => {

      setSelectedCategories(
        (previous) => {

          const exists =
            previous.some(
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

        }
      );

      setError("");
      setSuccess("");

    };


  /* =======================================================
     TOGGLE PRODUCT
  ======================================================= */

  const toggleProduct =
    (productId) => {

      setSelectedProducts(
        (previous) => {

          const exists =
            previous.some(
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

        }
      );

      setError("");
      setSuccess("");

    };


  /* =======================================================
     SELECT ALL CATEGORIES
  ======================================================= */

  const selectAllCategories =
    () => {

      setSelectedCategories(
        filteredCategories.map(
          (category) =>
            category.id
        )
      );

      setError("");

    };


  /* =======================================================
     CLEAR CATEGORIES
  ======================================================= */

  const clearCategories = () => {

    setSelectedCategories([]);
    setError("");

  };


  /* =======================================================
     SELECT ALL PRODUCTS
  ======================================================= */

  const selectAllProducts = () => {

    setSelectedProducts(
      filteredProducts.map(
        (product) =>
          getId(product)
      )
    );

    setError("");

  };


  /* =======================================================
     CLEAR PRODUCTS
  ======================================================= */

  const clearProducts = () => {

    setSelectedProducts([]);
    setError("");

  };


  /* =======================================================
     DATE PICKER
  ======================================================= */

  const openDatePicker =
    (ref) => {

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
     TIME PICKER
  ======================================================= */

  const openTimePicker =
    (ref) => {

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
      Number(
        formData.offerAmount
      );


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


        const payload = {

          outletId:
            Number(
              formData.outletId
            ),

          /*
           * Dynamic promotion type.
           * Comes from the selected card
           * in Promotions.jsx.
           */
          promotionPlanTypeId:
            Number(
              promotionTypeId
            ),

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

          /*
           * Keep backend values.
           */
          offerType:
            formData.offerType ===
            "FLAT_AMOUNT"
              ? "FLAT"
              : "% OFF",

          /*
           * Only send product IDs
           * when Products is selected.
           */
          productIds:
            applyTo === "PRODUCT"
              ? selectedProducts.map(
                  Number
                )
              : [],

          /*
           * Only send category IDs
           * when Categories is selected.
           */
          outletCategoryIds:
            applyTo === "CATEGORY"
              ? selectedCategories.map(
                  Number
                )
              : [],

          maxSelection:
            formData.maximumSelection ===
            ""
              ? null
              : Number(
                  formData.maximumSelection
                ),

        };


        console.log(
          "CREATE PROMOTION PAYLOAD:",
          payload
        );


        await createPromotionPlan(
          payload
        );


        setSuccess(
          "Promotion plan created successfully."
        );


        /*
         * Reset after successful creation.
         */
        setFormData(
          initialFormData
        );

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

    <div className="promotion-form">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="promotion-form-header">

        <div className="promotion-form-title-wrapper">

          <div className="promotion-form-title-icon">
            <FaTags />
          </div>

          <div>

            <h2>
              {promotionTypeName}
            </h2>

            <p>
              Create a {promotionTypeName}
              promotion plan for your outlet.
            </p>

          </div>

        </div>


        <div className="promotion-form-header-badge">

          <FaTags />

          <span>
            {promotionTypeName}
          </span>

        </div>

      </div>


      <form
        className="promotion-form-body"
        onSubmit={handleSubmit}
      >

        {/* =================================================
            ERROR / SUCCESS
        ================================================= */}

        {error && (

          <div className="promotion-form-message error">

            <span className="promotion-message-icon">
              !
            </span>

            {error}

          </div>

        )}


        {success && (

          <div className="promotion-form-message success">

            <span className="promotion-message-icon">
              ✓
            </span>

            {success}

          </div>

        )}


        {/* =================================================
            BASIC INFORMATION
        ================================================= */}

        <section className="promotion-form-section">

          <div className="promotion-form-section-heading">

            <span />

            <h3>
              Basic Information
            </h3>

          </div>


          <div className="promotion-form-grid">

            {/* OUTLET */}

            <div className="promotion-form-field">

              <label>
                Outlet
                <span className="required">
                  *
                </span>
              </label>


              <div
                className="promotion-form-custom-dropdown"
                ref={outletDropdownRef}
              >

                <button
                  type="button"
                  className={
                    outletDropdownOpen
                      ? "promotion-form-dropdown-trigger open"
                      : "promotion-form-dropdown-trigger"
                  }
                  onClick={() =>
                    setOutletDropdownOpen(
                      (previous) =>
                        !previous
                    )
                  }
                  disabled={loadingOutlets}
                >

                  <span className="promotion-form-dropdown-trigger-left">

                    <span className="promotion-form-store-icon">
                      <StoreIcon />
                    </span>

                    <span
                      className={
                        selectedOutlet
                          ? "selected"
                          : "placeholder"
                      }
                    >

                      {loadingOutlets
                        ? "Loading outlets..."
                        : selectedOutlet
                          ? getName(
                              selectedOutlet
                            )
                          : "Select outlet"
                      }

                    </span>

                  </span>


                  <ChevronIcon
                    open={
                      outletDropdownOpen
                    }
                  />

                </button>


                {outletDropdownOpen && (

                  <div className="promotion-form-dropdown-menu">

                    <div className="promotion-form-dropdown-search">

                      <SearchIcon />

                      <input
                        type="text"
                        placeholder="Search outlets..."
                        value={
                          outletSearch
                        }
                        onChange={(e) =>
                          setOutletSearch(
                            e.target.value
                          )
                        }
                      />

                    </div>


                    <div className="promotion-form-dropdown-count">

                      <strong>
                        {filteredOutlets.length}
                      </strong>

                      {" "}outlets available

                    </div>


                    <div className="promotion-form-dropdown-list">

                      {filteredOutlets.length === 0 ? (

                        <div className="promotion-form-dropdown-empty">
                          No outlets found.
                        </div>

                      ) : (

                        filteredOutlets.map(
                          (outlet) => {

                            const id =
                              getId(outlet);

                            const selected =
                              String(
                                formData.outletId
                              ) ===
                              String(id);


                            return (

                              <button
                                key={id}
                                type="button"
                                className={
                                  selected
                                    ? "promotion-form-outlet-option selected"
                                    : "promotion-form-outlet-option"
                                }
                                onClick={() =>
                                  handleOutletSelect(
                                    outlet
                                  )
                                }
                              >

                                <span
                                  className={
                                    selected
                                      ? "promotion-form-checkbox checked"
                                      : "promotion-form-checkbox"
                                  }
                                >

                                  {selected && (
                                    <CheckIcon />
                                  )}

                                </span>


                                <span className="promotion-form-outlet-content">

                                  <span className="promotion-form-outlet-name">
                                    {getName(
                                      outlet
                                    )}
                                  </span>

                                  <span className="promotion-form-outlet-id">
                                    Outlet ID: {id}
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

            </div>


            {/* PLAN TYPE */}

            <div className="promotion-form-field">

              <label>
                Plan Type
              </label>

              <div className="promotion-form-readonly">

                <FaTags />

                <span>
                  {promotionTypeName}
                </span>

              </div>

            </div>


            {/* OFFER NAME */}

            <div className="promotion-form-field">

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
                onChange={
                  handleChange
                }
                placeholder="Example: Diwali Special Offer"
                required
              />

            </div>


            {/* MINIMUM ORDER VALUE */}

            <div className="promotion-form-field">

              <label htmlFor="minimumOrderValue">

                Minimum Order Value

                <span className="required">
                  *
                </span>

              </label>


              <div className="promotion-form-input-wrapper">

                <span className="promotion-form-input-symbol">
                  ₹
                </span>

                {/* <input
                  id="minimumOrderValue"
                  type="number"
                  name="minimumOrderValue"
                  value={
                    formData.minimumOrderValue
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Enter minimum order value"
                  min="0"
                  required
                /> */}

                <input
  id="minimumOrderValue"
  type="number"
  name="minimumOrderValue"
  value={formData.minimumOrderValue}
  onChange={handleChange}
  onWheel={(e) => e.currentTarget.blur()}
  placeholder="Enter minimum order value"
  min="0"
  required
/>

              </div>

            </div>

          </div>

        </section>


        {/* =================================================
            OFFER DETAILS
        ================================================= */}

        <section className="promotion-form-section">

          <div className="promotion-form-section-heading">

            <span />

            <h3>
              Offer Details
            </h3>

          </div>


          <div className="promotion-form-grid">

            {/* OFFER TYPE */}

            <div className="promotion-form-field">

              <label htmlFor="offerType">

                Offer Type

                <span className="required">
                  *
                </span>

              </label>


              <div className="promotion-form-select-wrapper">

                <select
                  id="offerType"
                  name="offerType"
                  value={
                    formData.offerType
                  }
                  onChange={
                    handleChange
                  }
                >

                  <option value="PERCENTAGE">
                    Percentage Off
                  </option>

                  <option value="FLAT_AMOUNT">
                    Offer Amount
                  </option>

                </select>

              </div>

            </div>


            {/* OFFER AMOUNT */}

            <div className="promotion-form-field">

              <label htmlFor="offerAmount">

                {formData.offerType ===
                "PERCENTAGE"
                  ? "Percentage Off"
                  : "Offer Amount"
                }

                <span className="required">
                  *
                </span>

              </label>


              <div className="promotion-form-input-wrapper">

                <span className="promotion-form-input-symbol">

                  {formData.offerType ===
                  "PERCENTAGE"
                    ? "%"
                    : "₹"
                  }

                </span>




                <input
  id="offerAmount"
  type="number"
  name="offerAmount"
  value={formData.offerAmount}
  onChange={handleChange}
  onWheel={(e) => e.currentTarget.blur()}
  placeholder={
    formData.offerType === "PERCENTAGE"
      ? "Enter percentage"
      : "Enter offer amount"
  }
  min="0"
  max={
    formData.offerType === "PERCENTAGE"
      ? "100"
      : undefined
  }
  required
/>

              </div>

            </div>

          </div>

        </section>


        {/* =================================================
            SCHEDULE
        ================================================= */}

        <section className="promotion-form-section">

          <div className="promotion-form-section-heading">

            <span />

            <h3>
              Promotion Schedule
            </h3>

          </div>


          <div className="promotion-form-grid">

            {/* START DATE */}

            <div className="promotion-form-field">

              <label htmlFor="startDate">

                Start Date

                <span className="required">
                  *
                </span>

              </label>


              <div
                className="promotion-form-date-wrapper"
                onClick={() =>
                  openDatePicker(
                    startDateRef
                  )
                }
              >

                <input
                  ref={
                    startDateRef
                  }
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

                <span className="promotion-form-date-icon">
                  <CalendarIcon />
                </span>

              </div>

            </div>


            {/* END DATE */}

            <div className="promotion-form-field">

              <label htmlFor="endDate">

                End Date

                <span className="required">
                  *
                </span>

              </label>


              <div
                className="promotion-form-date-wrapper"
                onClick={() =>
                  openDatePicker(
                    endDateRef
                  )
                }
              >

                <input
                  ref={
                    endDateRef
                  }
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

                <span className="promotion-form-date-icon">
                  <CalendarIcon />
                </span>

              </div>

            </div>


            {/* START TIME */}

            <div className="promotion-form-field">

              <label htmlFor="startTime">

                Start Time

                <span className="required">
                  *
                </span>

              </label>


              <div
                className="promotion-form-date-wrapper"
                onClick={() =>
                  openTimePicker(
                    startTimeRef
                  )
                }
              >

                <input
                  ref={
                    startTimeRef
                  }
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

                <span className="promotion-form-date-icon">
                  <ClockIcon />
                </span>

              </div>

            </div>


            {/* END TIME */}

            <div className="promotion-form-field">

              <label htmlFor="endTime">

                End Time

                <span className="required">
                  *
                </span>

              </label>


              <div
                className="promotion-form-date-wrapper"
                onClick={() =>
                  openTimePicker(
                    endTimeRef
                  )
                }
              >

                <input
                  ref={
                    endTimeRef
                  }
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

                <span className="promotion-form-date-icon">
                  <ClockIcon />
                </span>

              </div>

            </div>

          </div>

        </section>


        {/* =================================================
            APPLIES ON
        ================================================= */}

        <section className="promotion-form-section">

          <div className="promotion-form-section-heading">

            <span />

            <h3>
              Applies On
            </h3>

          </div>


          <div className="promotion-form-selection">

            <div className="promotion-form-apply-grid">

              {/* ALL PRODUCTS */}

              <label
                className={
                  applyTo === "ALL"
                    ? "promotion-form-apply-card active"
                    : "promotion-form-apply-card"
                }
              >

                <input
                  type="radio"
                  name="applyTo"
                  value="ALL"
                  checked={
                    applyTo === "ALL"
                  }
                  onChange={() =>
                    setApplyTo("ALL")
                  }
                />

                <span className="promotion-form-radio-custom">
                  <span />
                </span>


                <span className="promotion-form-apply-content">

                  <strong>
                    All Products
                  </strong>

                  <small>
                    Apply this promotion
                    to all products
                    in the outlet.
                  </small>

                </span>

              </label>


              {/* CATEGORIES */}

              <label
                className={
                  applyTo === "CATEGORY"
                    ? "promotion-form-apply-card active"
                    : "promotion-form-apply-card"
                }
              >

                <input
                  type="radio"
                  name="applyTo"
                  value="CATEGORY"
                  checked={
                    applyTo ===
                    "CATEGORY"
                  }
                  onChange={() =>
                    setApplyTo(
                      "CATEGORY"
                    )
                  }
                />

                <span className="promotion-form-radio-custom">
                  <span />
                </span>


                <span className="promotion-form-apply-content">

                  <strong>
                    Categories
                  </strong>

                  <small>
                    Apply to one or
                    multiple categories.
                  </small>

                </span>

              </label>


              {/* PRODUCTS */}

              <label
                className={
                  applyTo === "PRODUCT"
                    ? "promotion-form-apply-card active"
                    : "promotion-form-apply-card"
                }
              >

                <input
                  type="radio"
                  name="applyTo"
                  value="PRODUCT"
                  checked={
                    applyTo ===
                    "PRODUCT"
                  }
                  onChange={() =>
                    setApplyTo(
                      "PRODUCT"
                    )
                  }
                />

                <span className="promotion-form-radio-custom">
                  <span />
                </span>


                <span className="promotion-form-apply-content">

                  <strong>
                    Products
                  </strong>

                  <small>
                    Apply to one or
                    multiple products.
                  </small>

                </span>

              </label>

            </div>


            {/* =================================================
                CATEGORY DROPDOWN
            ================================================= */}

            {applyTo === "CATEGORY" && (

              <div
                className="promotion-form-dropdown-wrapper"
                ref={
                  categoryDropdownRef
                }
              >

                <div className="promotion-form-dropdown-label-row">

                  <label>
                    Select Categories
                  </label>

                  <span>
                    {categories.length} available
                  </span>

                </div>


                <button
                  type="button"
                  className={
                    categoryDropdownOpen
                      ? "promotion-form-dropdown-trigger open"
                      : "promotion-form-dropdown-trigger"
                  }
                  onClick={() =>
                    setCategoryDropdownOpen(
                      (previous) =>
                        !previous
                    )
                  }
                  disabled={
                    !formData.outletId ||
                    loadingProducts
                  }
                >

                  <span
                    className={
                      selectedCategoryNames.length
                        ? "promotion-form-selection-label selected"
                        : "promotion-form-selection-label placeholder"
                    }
                    title={
                      categoryDropdownLabel
                    }
                  >

                    {loadingProducts
                      ? "Loading categories..."
                      : categoryDropdownLabel
                    }

                  </span>


                  <ChevronIcon
                    open={
                      categoryDropdownOpen
                    }
                  />

                </button>


                {/* SELECTED CATEGORY NAMES */}

                {selectedCategoryNames.length > 0 && (

                  <div className="promotion-form-selected-items">

                    {selectedCategoryNames.map(
                      (name, index) => (

                        <span
                          key={`${name}-${index}`}
                          className="promotion-form-selected-chip"
                        >

                          {name}

                          <button
                            type="button"
                            aria-label={`Remove ${name}`}
                            onClick={() => {

                              const category =
                                categories.find(
                                  (item) =>
                                    item.name ===
                                    name
                                );

                              if (category) {
                                toggleCategory(
                                  category.id
                                );
                              }

                            }}
                          >
                            ×
                          </button>

                        </span>

                      )
                    )}

                  </div>

                )}


                {categoryDropdownOpen && (

                  <div className="promotion-form-dropdown-menu">

                    <div className="promotion-form-dropdown-search">

                      <SearchIcon />

                      <input
                        type="text"
                        placeholder="Search categories..."
                        value={
                          categorySearch
                        }
                        onChange={(e) =>
                          setCategorySearch(
                            e.target.value
                          )
                        }
                      />

                    </div>


                    <div className="promotion-form-dropdown-actions">

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


                    <div className="promotion-form-dropdown-list">

                      {filteredCategories.length === 0 ? (

                        <div className="promotion-form-dropdown-empty">
                          No categories found.
                        </div>

                      ) : (

                        filteredCategories.map(
                          (category) => {

                            const checked =
                              selectedCategories.some(
                                (id) =>
                                  String(id) ===
                                  String(
                                    category.id
                                  )
                              );


                            return (

                              <label
                                key={
                                  category.id
                                }
                                className={
                                  checked
                                    ? "promotion-form-checkbox-row checked"
                                    : "promotion-form-checkbox-row"
                                }
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

                                <span className="promotion-form-custom-checkbox">

                                  {checked && (
                                    <CheckIcon />
                                  )}

                                </span>


                                <span className="promotion-form-item-info">

                                  <span>
                                    {
                                      category.name
                                    }
                                  </span>

                                  <small>
                                    Category ID:{" "}
                                    {
                                      category.id
                                    }
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

              </div>

            )}


            {/* =================================================
                PRODUCT DROPDOWN
            ================================================= */}

            {applyTo === "PRODUCT" && (

              <div
                className="promotion-form-dropdown-wrapper"
                ref={
                  productDropdownRef
                }
              >

                <div className="promotion-form-dropdown-label-row">

                  <label>
                    Select Products
                  </label>

                  <span>
                    {products.length} available
                  </span>

                </div>


                <button
                  type="button"
                  className={
                    productDropdownOpen
                      ? "promotion-form-dropdown-trigger open"
                      : "promotion-form-dropdown-trigger"
                  }
                  onClick={() =>
                    setProductDropdownOpen(
                      (previous) =>
                        !previous
                    )
                  }
                  disabled={
                    !formData.outletId ||
                    loadingProducts
                  }
                >

                  <span
                    className={
                      selectedProductNames.length
                        ? "promotion-form-selection-label selected"
                        : "promotion-form-selection-label placeholder"
                    }
                    title={
                      productDropdownLabel
                    }
                  >

                    {loadingProducts
                      ? "Loading products..."
                      : productDropdownLabel
                    }

                  </span>


                  <ChevronIcon
                    open={
                      productDropdownOpen
                    }
                  />

                </button>


                {/* SELECTED PRODUCT NAMES */}

                {selectedProductNames.length > 0 && (

                  <div className="promotion-form-selected-items">

                    {selectedProductNames.map(
                      (name, index) => {

                        const product =
                          products.find(
                            (item) =>
                              getName(item) ===
                              name
                          );

                        return (

                          <span
                            key={`${name}-${index}`}
                            className="promotion-form-selected-chip"
                          >

                            {name}

                            <button
                              type="button"
                              aria-label={`Remove ${name}`}
                              onClick={() => {

                                if (product) {

                                  toggleProduct(
                                    getId(product)
                                  );

                                }

                              }}
                            >
                              ×
                            </button>

                          </span>

                        );

                      }
                    )}

                  </div>

                )}


                {productDropdownOpen && (

                  <div className="promotion-form-dropdown-menu">

                    <div className="promotion-form-dropdown-search">

                      <SearchIcon />

                      <input
                        type="text"
                        placeholder="Search products..."
                        value={
                          productSearch
                        }
                        onChange={(e) =>
                          setProductSearch(
                            e.target.value
                          )
                        }
                      />

                    </div>


                    <div className="promotion-form-dropdown-actions">

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


                    <div className="promotion-form-dropdown-list">

                      {filteredProducts.length === 0 ? (

                        <div className="promotion-form-dropdown-empty">
                          No products found.
                        </div>

                      ) : (

                        filteredProducts.map(
                          (product) => {

                            const id =
                              getId(
                                product
                              );

                            const checked =
                              selectedProducts.some(
                                (selectedId) =>
                                  String(
                                    selectedId
                                  ) ===
                                  String(id)
                              );


                            return (

                              <label
                                key={id}
                                className={
                                  checked
                                    ? "promotion-form-checkbox-row checked"
                                    : "promotion-form-checkbox-row"
                                }
                              >

                                <input
                                  type="checkbox"
                                  checked={
                                    checked
                                  }
                                  onChange={() =>
                                    toggleProduct(
                                      id
                                    )
                                  }
                                />

                                <span className="promotion-form-custom-checkbox">

                                  {checked && (
                                    <CheckIcon />
                                  )}

                                </span>


                                <span className="promotion-form-item-info">

                                  <span>
                                    {getName(
                                      product
                                    )}
                                  </span>

                                  <small>
                                    Product ID:{" "}
                                    {id}
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

              </div>

            )}

          </div>

        </section>


        {/* =================================================
            MAXIMUM SELECTION
        ================================================= */}

        <section className="promotion-form-section">

          <div className="promotion-form-section-heading">

            <span />

            <h3>
              Selection Settings
            </h3>

          </div>


          <div className="promotion-form-grid">

            <div className="promotion-form-field">

              <label htmlFor="maximumSelection">
                Maximum Selection
              </label>


              {/* <input
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
              /> */}
<input
  id="maximumSelection"
  type="number"
  name="maximumSelection"
  value={formData.maximumSelection}
  onChange={handleChange}
  onWheel={(e) => e.currentTarget.blur()}
  placeholder="-1"
  min="-1"
/>

              <small className="promotion-form-help">
                Enter -1 for unlimited selection.
              </small>

            </div>

          </div>

        </section>


        {/* =================================================
            ACTIONS
        ================================================= */}

        <div className="promotion-form-actions">

          <button
            type="button"
            className="promotion-form-reset"
            onClick={
              handleReset
            }
            disabled={
              submitting
            }
          >
            Reset
          </button>


          <button
            type="submit"
            className="promotion-form-submit"
            disabled={
              submitting
            }
          >

            {submitting
              ? "Creating..."
              : `Create ${promotionTypeName}`
            }

          </button>

        </div>

      </form>

    </div>

  );

};


export default PromotionForm;