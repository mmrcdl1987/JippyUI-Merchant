import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import api from "../../services/api";

import {
  getOutletsByMerchant,
} from "../../services/outletService";

import {
  getProductsByOutlet,
} from "../../services/promotionService";

import "../../styles/SlotBooking.css";


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
    width="18"
    height="18"
    viewBox="0 0 24 24"
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
    <circle
      cx="7.5"
      cy="7.5"
      r="1"
    />
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
    style={{
      transform: open
        ? "rotate(180deg)"
        : "rotate(0deg)",
      transition: "transform 0.2s ease",
    }}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);


/* =========================================================
   HELPERS
========================================================= */

const getProductId = (product) =>
  product?.id ??
  product?.productId ??
  product?.foodId;


const getProductName = (product) =>
  product?.name ??
  product?.productName ??
  product?.foodName ??
  "Unnamed Product";


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

const SlotBooking = ({ onCancel }) => {

  const PROMOTION_PLAN_TYPE_ID = 4;


  /* =======================================================
     REFS
  ======================================================= */

  const outletDropdownRef =
    useRef(null);

  const categoryDropdownRef =
    useRef(null);

  const productDropdownRef =
    useRef(null);

  const startDateRef =
    useRef(null);

  const endDateRef =
    useRef(null);

  const startTimeRef =
    useRef(null);

  const endTimeRef =
    useRef(null);


  /* =======================================================
     FORM DATA
  ======================================================= */

  const [formData, setFormData] =
    useState({
      outletId: "",
      offerName: "",
      offerType: "% OFF",
      offerAmount: "",
      minimumOrderValue: "",
      startDate: "",
      endDate: "",
      startTime: "",
      endTime: "",
      maximumSelection: -1,
    });


  /* =======================================================
     OUTLETS
  ======================================================= */

  const [outlets, setOutlets] =
    useState([]);

  const [loadingOutlets, setLoadingOutlets] =
    useState(false);

  const [outletDropdownOpen, setOutletDropdownOpen] =
    useState(false);

  const [outletSearch, setOutletSearch] =
    useState("");


  /* =======================================================
     PRODUCTS
  ======================================================= */

  const [products, setProducts] =
    useState([]);

  const [loadingProducts, setLoadingProducts] =
    useState(false);


  /* =======================================================
     SELECTIONS
  ======================================================= */

  const [selectedCategories, setSelectedCategories] =
    useState([]);

  const [selectedProducts, setSelectedProducts] =
    useState([]);


  /* =======================================================
     APPLY TO
  ======================================================= */

  const [applyTo, setApplyTo] =
    useState("ALL");


  /* =======================================================
     DROPDOWNS
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
     SUBMIT / MESSAGES
  ======================================================= */

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");


  /* =======================================================
     FETCH OUTLETS
  ======================================================= */

  useEffect(() => {

    const fetchMerchantOutlets =
      async () => {

        try {

          setLoadingOutlets(true);
          setError("");

          const response =
            await getOutletsByMerchant();

          console.log(
            "SLOT BOOKING OUTLETS:",
            response
          );

          let outletList = [];

          if (Array.isArray(response)) {

            outletList = response;

          } else if (
            Array.isArray(response?.data)
          ) {

            outletList =
              response.data;

          } else if (
            Array.isArray(response?.content)
          ) {

            outletList =
              response.content;

          } else if (
            Array.isArray(response?.outlets)
          ) {

            outletList =
              response.outlets;

          }

          setOutlets(outletList);

          if (outletList.length > 0) {

            const firstOutletId =
              outletList[0]?.outletId ??
              outletList[0]?.id;

            if (
              firstOutletId !==
              undefined &&
              firstOutletId !== null
            ) {

              setFormData(
                (previous) => ({
                  ...previous,
                  outletId:
                    String(
                      firstOutletId
                    ),
                })
              );

            }

          }

        } catch (err) {

          console.error(
            "Error loading merchant outlets:",
            err
          );

          setError(
            err?.response?.data?.message ||
            "Unable to load your outlets."
          );

        } finally {

          setLoadingOutlets(false);

        }

      };


    fetchMerchantOutlets();

  }, []);


  /* =======================================================
     LOAD PRODUCTS
     
     IMPORTANT:
     Same approach as BOGO.
     Categories are derived from the
     products returned for the outlet.
  ======================================================= */

  useEffect(() => {

    const loadProducts =
      async () => {

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
              Number(
                formData.outletId
              )
            );

          console.log(
            "SLOT BOOKING PRODUCTS:",
            response
          );

          let productData = [];

          if (
            Array.isArray(response)
          ) {

            productData =
              response;

          } else if (
            Array.isArray(
              response?.data
            )
          ) {

            productData =
              response.data;

          } else if (
            Array.isArray(
              response?.content
            )
          ) {

            productData =
              response.content;

          } else if (
            Array.isArray(
              response?.products
            )
          ) {

            productData =
              response.products;

          } else if (
            Array.isArray(
              response?.data?.content
            )
          ) {

            productData =
              response.data.content;

          }

          console.log(
            "NORMALIZED SLOT PRODUCTS:",
            productData
          );

          setProducts(
            productData
          );

          setSelectedCategories([]);
          setSelectedProducts([]);

        } catch (err) {

          console.error(
            "Failed to load Slot Booking products:",
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
     DERIVE CATEGORIES FROM PRODUCTS
     
     THIS IS THE SAME LOGIC USED BY BOGO.
  ======================================================= */

  const categories = useMemo(() => {

    const map = new Map();

    products.forEach(
      (product) => {

        const categoryName =
          getCategoryName(
            product
          );

        const categoryObject =
          product?.category &&
          typeof product.category ===
            "object"
            ? product.category
            : null;

        const categoryId =
          categoryObject?.id ??
          categoryObject?.categoryId ??
          product?.outletCategoryId ??
          product?.categoryId;

        if (
          categoryId ===
            undefined ||
          categoryId === null
        ) {
          return;
        }

        const normalizedId =
          String(categoryId);

        if (
          !map.has(
            normalizedId
          )
        ) {

          map.set(
            normalizedId,
            {
              id: normalizedId,
              name: categoryName,
            }
          );

        }

      }
    );

    const categoryList =
      Array.from(
        map.values()
      );

    console.log(
      "SLOT BOOKING CATEGORIES:",
      categoryList
    );

    return categoryList;

  }, [products]);


  /* =======================================================
     FILTER OUTLETS
  ======================================================= */

  const filteredOutlets =
    useMemo(() => {

      const search =
        outletSearch
          .trim()
          .toLowerCase();

      if (!search) {

        return outlets;

      }

      return outlets.filter(
        (outlet) => {

          const name =
            String(
              outlet?.outletName ??
              outlet?.name ??
              ""
            ).toLowerCase();

          const id =
            String(
              outlet?.outletId ??
              outlet?.id ??
              ""
            ).toLowerCase();

          return (
            name.includes(search) ||
            id.includes(search)
          );

        }
      );

    }, [
      outlets,
      outletSearch,
    ]);


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
          String(
            category.name
          )
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
            getProductName(
              product
            ).toLowerCase();

          const categoryName =
            getCategoryName(
              product
            ).toLowerCase();

          return (
            productName.includes(
              search
            ) ||
            categoryName.includes(
              search
            )
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

      if (!formData.outletId) {

        return null;

      }

      return outlets.find(
        (outlet) =>
          String(
            outlet?.outletId ??
            outlet?.id
          ) ===
          String(
            formData.outletId
          )
      );

    }, [
      outlets,
      formData.outletId,
    ]);


  /* =======================================================
     OUTLET NAME
  ======================================================= */

  const getOutletName =
    (outlet) =>
      outlet?.outletName ??
      outlet?.name ??
      outlet?.outlet?.outletName ??
      `Outlet ${
        outlet?.outletId ??
        outlet?.id ??
        ""
      }`;


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

          setOutletDropdownOpen(
            false
          );

        }

        if (
          categoryDropdownRef.current &&
          !categoryDropdownRef.current.contains(
            event.target
          )
        ) {

          setCategoryDropdownOpen(
            false
          );

        }

        if (
          productDropdownRef.current &&
          !productDropdownRef.current.contains(
            event.target
          )
        ) {

          setProductDropdownOpen(
            false
          );

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

  const handleChange =
    (event) => {

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

  const selectOutlet =
    (outlet) => {

      const outletId =
        outlet?.outletId ??
        outlet?.id;

      setFormData(
        (previous) => ({
          ...previous,
          outletId:
            String(outletId),
        })
      );

      setOutletSearch("");

      setOutletDropdownOpen(
        false
      );

      setSelectedCategories([]);
      setSelectedProducts([]);

      setCategorySearch("");
      setProductSearch("");

      setCategoryDropdownOpen(
        false
      );

      setProductDropdownOpen(
        false
      );

    };


  /* =======================================================
     CATEGORY CHECKBOX
  ======================================================= */

  const toggleCategory =
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

  const toggleProduct =
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

  const selectAllCategories =
    () => {

      setSelectedCategories(
        filteredCategories.map(
          (category) =>
            String(
              category.id
            )
        )
      );

    };


  /* =======================================================
     CLEAR CATEGORIES
  ======================================================= */

  const clearCategories =
    () => {

      setSelectedCategories([]);

    };


  /* =======================================================
     SELECT ALL PRODUCTS
  ======================================================= */

  const selectAllProducts =
    () => {

      setSelectedProducts(
        filteredProducts
          .map(
            (product) =>
              getProductId(
                product
              )
          )
          .filter(
            (id) =>
              id !== undefined &&
              id !== null
          )
          .map(
            (id) =>
              String(id)
          )
      );

    };


  /* =======================================================
     CLEAR PRODUCTS
  ======================================================= */

  const clearProducts =
    () => {

      setSelectedProducts([]);

    };


  /* =======================================================
     DROPDOWN LABELS
  ======================================================= */

  const categoryDropdownLabel =
    useMemo(() => {

      if (
        selectedCategories.length ===
        0
      ) {

        return "Select categories";

      }

      return `${selectedCategories.length} categor${
        selectedCategories.length ===
        1
          ? "y"
          : "ies"
      } selected`;

    }, [
      selectedCategories,
    ]);


  const productDropdownLabel =
    useMemo(() => {

      if (
        selectedProducts.length ===
        0
      ) {

        return "Select products";

      }

      return `${selectedProducts.length} product${
        selectedProducts.length ===
        1
          ? ""
          : "s"
      } selected`;

    }, [
      selectedProducts,
    ]);


  /* =======================================================
     DATE / TIME PICKERS
  ======================================================= */

  const openPicker =
    (ref) => {

      if (!ref.current) {
        return;
      }

      if (
        typeof ref.current
          .showPicker ===
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

  const validateForm =
    () => {

      if (!formData.outletId) {

        return "Please select an outlet.";

      }

      if (
        !formData.offerName.trim()
      ) {

        return "Please enter offer name.";

      }

      if (
        !formData.offerAmount
      ) {

        return "Please enter offer amount.";

      }

      const offerAmount =
        Number(
          formData.offerAmount
        );

      if (
        offerAmount <= 0
      ) {

        return "Offer amount must be greater than 0.";

      }

      if (
        formData.offerType ===
          "% OFF" &&
        offerAmount > 100
      ) {

        return "Percentage offer cannot be more than 100%.";

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

      if (
        !formData.startDate
      ) {

        return "Please select start date.";

      }

      if (
        !formData.endDate
      ) {

        return "Please select end date.";

      }

      if (
        formData.endDate <
        formData.startDate
      ) {

        return "End date cannot be before start date.";

      }

      if (
        !formData.startTime
      ) {

        return "Please select start time.";

      }

      if (
        !formData.endTime
      ) {

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
        selectedCategories.length ===
          0
      ) {

        return "Please select at least one category.";

      }

      if (
        applyTo === "PRODUCT" &&
        selectedProducts.length ===
          0
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
            formData.offerType,

          productIds:
            applyTo === "PRODUCT"
              ? selectedProducts
                  .map(Number)
                  .filter(
                    (id) =>
                      Number.isInteger(
                        id
                      )
                  )
              : [],

          outletCategoryIds:
            applyTo === "CATEGORY"
              ? selectedCategories
                  .map(Number)
                  .filter(
                    (id) =>
                      Number.isInteger(
                        id
                      )
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
          "CREATE SLOT BOOKING PAYLOAD:"
        );

        console.log(
          payload
        );

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


        await api.post(
          "/api/fm/promotion-plans",
          payload
        );


        setSuccess(
          "Slot Booking created successfully."
        );


        setFormData({
          outletId:
            formData.outletId,
          offerName: "",
          offerType: "% OFF",
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

        setCategorySearch("");
        setProductSearch("");

        setCategoryDropdownOpen(
          false
        );

        setProductDropdownOpen(
          false
        );


        if (onCancel) {

          setTimeout(() => {

            onCancel();

          }, 800);

        }

      } catch (err) {

        console.error(
          "Create Slot Booking failed:",
          err
        );

        console.error(
          "Backend response:",
          err?.response?.data
        );

        setError(
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to create Slot Booking."
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
     RETURN
  ======================================================= */

  return (
    <div className="merchant-slot-booking-main-container">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="merchant-slot-booking-header">

        <div className="merchant-slot-booking-title-wrapper">

          <div className="merchant-slot-booking-title-icon">
            <TagIcon />
          </div>

          <div>

            <h2 className="merchant-slot-booking-title">
              Slot Booking
            </h2>

            <p className="merchant-slot-booking-description">
              Create a slot-based promotional offer
              for your outlet.
            </p>

          </div>

        </div>

        <div className="merchant-slot-booking-badge">
          SLOT OFFER
        </div>

      </div>


      {/* =================================================
          SUCCESS
      ================================================= */}

      {success && (
        <div className="merchant-slot-booking-success">
          ✓ {success}
        </div>
      )}


      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="merchant-slot-booking-error">
          ⚠ {error}
        </div>
      )}


      <form
        className="merchant-slot-booking-form-container"
        onSubmit={handleSubmit}
      >

        {/* =================================================
            OUTLET
        ================================================= */}

        <div
          className="merchant-slot-booking-form-group"
          ref={outletDropdownRef}
        >

          <label className="merchant-slot-booking-label">
            Outlet <span>*</span>
          </label>


          <button
            type="button"
            className={`merchant-slot-booking-dropdown-trigger ${
              outletDropdownOpen
                ? "is-open"
                : ""
            }`}
            onClick={() =>
              setOutletDropdownOpen(
                (previous) =>
                  !previous
              )
            }
            disabled={
              loadingOutlets
            }
          >

            <span>

              {loadingOutlets
                ? "Loading outlets..."
                : selectedOutlet
                ? getOutletName(
                    selectedOutlet
                  )
                : "Select outlet"}

            </span>


            <ChevronIcon
              open={
                outletDropdownOpen
              }
            />

          </button>


          {outletDropdownOpen && (
            <div className="merchant-slot-booking-dropdown-menu">

              <div className="merchant-slot-booking-search-wrapper">

                <SearchIcon />

                <input
                  type="text"
                  value={
                    outletSearch
                  }
                  onChange={(event) =>
                    setOutletSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search outlet..."
                  onClick={(event) =>
                    event.stopPropagation()
                  }
                  autoFocus
                />

              </div>


              <div className="merchant-slot-booking-dropdown-list">

                {filteredOutlets.length ===
                0 ? (

                  <div className="merchant-slot-booking-empty">
                    No outlets found
                  </div>

                ) : (

                  filteredOutlets.map(
                    (outlet) => {

                      const outletId =
                        outlet?.outletId ??
                        outlet?.id;

                      const selected =
                        String(
                          outletId
                        ) ===
                        String(
                          formData.outletId
                        );

                      return (

                        <button
                          type="button"
                          key={outletId}
                          className={`merchant-slot-booking-dropdown-option ${
                            selected
                              ? "selected"
                              : ""
                          }`}
                          onClick={() =>
                            selectOutlet(
                              outlet
                            )
                          }
                        >

                          <span>
                            {getOutletName(
                              outlet
                            )}
                          </span>

                          {selected && (
                            <span>
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


          <small>
            Only outlets belonging to your
            merchant account are shown.
          </small>

        </div>


        {/* =================================================
            PLAN TYPE + OFFER NAME
        ================================================= */}

        <div className="merchant-slot-booking-two-column">

          <div className="merchant-slot-booking-form-group">

            <label className="merchant-slot-booking-label">
              Plan Type
            </label>

            <input
              className="merchant-slot-booking-input"
              value="Slot Booking"
              disabled
            />

            <small>
              Promotion Plan Type ID: 4
            </small>

          </div>


          <div className="merchant-slot-booking-form-group">

            <label className="merchant-slot-booking-label">
              Offer Name <span>*</span>
            </label>

            <input
              className="merchant-slot-booking-input"
              type="text"
              name="offerName"
              value={
                formData.offerName
              }
              onChange={
                handleChange
              }
              placeholder="Enter offer name"
              required
            />

          </div>

        </div>


        {/* =================================================
            OFFER TYPE + OFFER AMOUNT
        ================================================= */}

        <div className="merchant-slot-booking-two-column">

          <div className="merchant-slot-booking-form-group">

            <label className="merchant-slot-booking-label">
              Offer Type <span>*</span>
            </label>

            <select
              className="merchant-slot-booking-input"
              name="offerType"
              value={
                formData.offerType
              }
              onChange={
                handleChange
              }
              required
            >

              <option value="% OFF">
                % OFF
              </option>

              <option value="FLAT">
                Flat
              </option>

            </select>

          </div>


          <div className="merchant-slot-booking-form-group">

            <label className="merchant-slot-booking-label">

              {formData.offerType ===
              "FLAT"
                ? "Offer Amount (₹)"
                : "Offer Amount (%)"}

              <span>*</span>

            </label>


            <div className="merchant-slot-booking-amount-wrapper">

              <span className="merchant-slot-booking-amount-symbol">

                {formData.offerType ===
                "FLAT"
                  ? "₹"
                  : "%"}

              </span>


              <input
                className="merchant-slot-booking-input merchant-slot-booking-amount-input"
                type="number"
                name="offerAmount"
                value={
                  formData.offerAmount
                }
                onChange={
                  handleChange
                }
                placeholder={
                  formData.offerType ===
                  "FLAT"
                    ? "e.g. 100"
                    : "e.g. 20"
                }
                min="0"
                max={
                  formData.offerType ===
                  "% OFF"
                    ? "100"
                    : undefined
                }
                step="0.01"
                required
              />

            </div>

          </div>

        </div>


        {/* =================================================
            MINIMUM ORDER
        ================================================= */}

        <div className="merchant-slot-booking-form-group">

          <label className="merchant-slot-booking-label">
            Minimum Order Value (₹)
            <span>*</span>
          </label>


          <div className="merchant-slot-booking-amount-wrapper">

            <span className="merchant-slot-booking-amount-symbol">
              ₹
            </span>


            <input
              className="merchant-slot-booking-input merchant-slot-booking-amount-input"
              type="number"
              name="minimumOrderValue"
              value={
                formData.minimumOrderValue
              }
              onChange={
                handleChange
              }
              placeholder="e.g. 499"
              min="0"
              step="0.01"
              required
            />

          </div>

        </div>


        {/* =================================================
            DATES
        ================================================= */}

        <div className="merchant-slot-booking-two-column">

          <div className="merchant-slot-booking-form-group">

            <label className="merchant-slot-booking-label">
              Start Date <span>*</span>
            </label>


            <div
              className="merchant-slot-booking-picker-wrapper"
              onClick={() =>
                openPicker(
                  startDateRef
                )
              }
            >

              <input
                ref={
                  startDateRef
                }
                className="merchant-slot-booking-input merchant-slot-booking-picker-input"
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

              <span className="merchant-slot-booking-picker-icon">
                <CalendarIcon />
              </span>

            </div>

          </div>


          <div className="merchant-slot-booking-form-group">

            <label className="merchant-slot-booking-label">
              End Date <span>*</span>
            </label>


            <div
              className="merchant-slot-booking-picker-wrapper"
              onClick={() =>
                openPicker(
                  endDateRef
                )
              }
            >

              <input
                ref={
                  endDateRef
                }
                className="merchant-slot-booking-input merchant-slot-booking-picker-input"
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

              <span className="merchant-slot-booking-picker-icon">
                <CalendarIcon />
              </span>

            </div>

          </div>

        </div>


        {/* =================================================
            TIME
        ================================================= */}

        <div className="merchant-slot-booking-two-column">

          <div className="merchant-slot-booking-form-group">

            <label className="merchant-slot-booking-label">
              Start Time <span>*</span>
            </label>


            <div
              className="merchant-slot-booking-picker-wrapper"
              onClick={() =>
                openPicker(
                  startTimeRef
                )
              }
            >

              <input
                ref={
                  startTimeRef
                }
                className="merchant-slot-booking-input merchant-slot-booking-picker-input"
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

              <span className="merchant-slot-booking-picker-icon">
                <ClockIcon />
              </span>

            </div>

          </div>


          <div className="merchant-slot-booking-form-group">

            <label className="merchant-slot-booking-label">
              End Time <span>*</span>
            </label>


            <div
              className="merchant-slot-booking-picker-wrapper"
              onClick={() =>
                openPicker(
                  endTimeRef
                )
              }
            >

              <input
                ref={
                  endTimeRef
                }
                className="merchant-slot-booking-input merchant-slot-booking-picker-input"
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

              <span className="merchant-slot-booking-picker-icon">
                <ClockIcon />
              </span>

            </div>

          </div>

        </div>


        {/* =================================================
            APPLIES ON
        ================================================= */}

        <div className="merchant-slot-booking-form-group">

          <label className="merchant-slot-booking-label merchant-slot-booking-center-label">
            Applies On
          </label>


          <div
            className="merchant-slot-booking-radio-container"
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(3, 1fr)",
              gap: "12px",
              alignItems: "stretch",
            }}
          >

            {/* ALL PRODUCTS */}

            <label
              style={{
                position: "relative",
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                padding: "16px",
                border:
                  applyTo === "ALL"
                    ? "1px solid #14b8a6"
                    : "1px solid #dbe4ee",
                borderRadius: "10px",
                background:
                  applyTo === "ALL"
                    ? "#ecfdf5"
                    : "#ffffff",
                cursor: "pointer",
                boxShadow:
                  applyTo === "ALL"
                    ? "0 0 0 1px #14b8a6"
                    : "none",
                transition:
                  "all 0.2s ease",
              }}
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
                style={{
                  position:
                    "absolute",
                  opacity: 0,
                  pointerEvents:
                    "none",
                }}
              />


              <span
                style={{
                  width: "16px",
                  height: "16px",
                  minWidth: "16px",
                  border:
                    applyTo === "ALL"
                      ? "1.5px solid #14b8a6"
                      : "1.5px solid #94a3b8",
                  borderRadius:
                    "50%",
                  display: "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                  marginTop: "2px",
                }}
              >

                {applyTo ===
                  "ALL" && (
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius:
                        "50%",
                      background:
                        "#14b8a6",
                    }}
                  />
                )}

              </span>


              <div>

                <strong
                  style={{
                    display:
                      "block",
                    marginBottom:
                      "5px",
                    color:
                      "#334155",
                    fontSize:
                      "14px",
                  }}
                >
                  All Products
                </strong>

                <small
                  style={{
                    display:
                      "block",
                    margin: 0,
                    color:
                      "#94a3b8",
                    fontSize:
                      "11px",
                    lineHeight:
                      "1.4",
                  }}
                >
                  Apply the offer to all
                  products in this outlet.
                </small>

              </div>

            </label>


            {/* CATEGORIES */}

            <label
              style={{
                position: "relative",
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                padding: "16px",
                border:
                  applyTo ===
                  "CATEGORY"
                    ? "1px solid #14b8a6"
                    : "1px solid #dbe4ee",
                borderRadius: "10px",
                background:
                  applyTo ===
                  "CATEGORY"
                    ? "#ecfdf5"
                    : "#ffffff",
                cursor: "pointer",
                boxShadow:
                  applyTo ===
                  "CATEGORY"
                    ? "0 0 0 1px #14b8a6"
                    : "none",
                transition:
                  "all 0.2s ease",
              }}
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
                style={{
                  position:
                    "absolute",
                  opacity: 0,
                  pointerEvents:
                    "none",
                }}
              />


              <span
                style={{
                  width: "16px",
                  height: "16px",
                  minWidth: "16px",
                  border:
                    applyTo ===
                    "CATEGORY"
                      ? "1.5px solid #14b8a6"
                      : "1.5px solid #94a3b8",
                  borderRadius:
                    "50%",
                  display: "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                  marginTop: "2px",
                }}
              >

                {applyTo ===
                  "CATEGORY" && (
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius:
                        "50%",
                      background:
                        "#14b8a6",
                    }}
                  />
                )}

              </span>


              <div>

                <strong
                  style={{
                    display:
                      "block",
                    marginBottom:
                      "5px",
                    color:
                      "#334155",
                    fontSize:
                      "14px",
                  }}
                >
                  Selected Categories
                </strong>

                <small
                  style={{
                    display:
                      "block",
                    margin: 0,
                    color:
                      "#94a3b8",
                    fontSize:
                      "11px",
                    lineHeight:
                      "1.4",
                  }}
                >
                  Apply the offer to selected
                  categories.
                </small>

              </div>

            </label>


            {/* PRODUCTS */}

            <label
              style={{
                position: "relative",
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                padding: "16px",
                border:
                  applyTo ===
                  "PRODUCT"
                    ? "1px solid #14b8a6"
                    : "1px solid #dbe4ee",
                borderRadius: "10px",
                background:
                  applyTo ===
                  "PRODUCT"
                    ? "#ecfdf5"
                    : "#ffffff",
                cursor: "pointer",
                boxShadow:
                  applyTo ===
                  "PRODUCT"
                    ? "0 0 0 1px #14b8a6"
                    : "none",
                transition:
                  "all 0.2s ease",
              }}
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
                style={{
                  position:
                    "absolute",
                  opacity: 0,
                  pointerEvents:
                    "none",
                }}
              />


              <span
                style={{
                  width: "16px",
                  height: "16px",
                  minWidth: "16px",
                  border:
                    applyTo ===
                    "PRODUCT"
                      ? "1.5px solid #14b8a6"
                      : "1.5px solid #94a3b8",
                  borderRadius:
                    "50%",
                  display: "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                  marginTop: "2px",
                }}
              >

                {applyTo ===
                  "PRODUCT" && (
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius:
                        "50%",
                      background:
                        "#14b8a6",
                    }}
                  />
                )}

              </span>


              <div>

                <strong
                  style={{
                    display:
                      "block",
                    marginBottom:
                      "5px",
                    color:
                      "#334155",
                    fontSize:
                      "14px",
                  }}
                >
                  Selected Products
                </strong>

                <small
                  style={{
                    display:
                      "block",
                    margin: 0,
                    color:
                      "#94a3b8",
                    fontSize:
                      "11px",
                    lineHeight:
                      "1.4",
                  }}
                >
                  Apply the offer to selected
                  products.
                </small>

              </div>

            </label>

          </div>

        </div>


        {/* =================================================
            CATEGORY DROPDOWN
            SAME STYLE/BEHAVIOUR AS BOGO
        ================================================= */}

        {applyTo ===
          "CATEGORY" && (

          <div
            className="merchant-slot-booking-form-group"
            ref={
              categoryDropdownRef
            }
          >

            <div
              style={{
                display:
                  "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
                marginBottom:
                  "8px",
              }}
            >

              <label className="merchant-slot-booking-label">
                Categories{" "}
                <span>*</span>
              </label>

              <span
                style={{
                  color:
                    "#94a3b8",
                  fontSize:
                    "12px",
                }}
              >
                {
                  selectedCategories.length
                }{" "}
                selected
              </span>

            </div>


            <button
              type="button"
              className={`merchant-slot-booking-dropdown-trigger ${
                categoryDropdownOpen
                  ? "is-open"
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


            {categoryDropdownOpen && (

              <div className="merchant-slot-booking-dropdown-menu">

                {/* SEARCH */}

                <div className="merchant-slot-booking-search-wrapper">

                  <SearchIcon />

                  <input
                    type="text"
                    value={
                      categorySearch
                    }
                    onChange={(
                      event
                    ) =>
                      setCategorySearch(
                        event.target.value
                      )
                    }
                    placeholder="Search categories..."
                    autoFocus
                  />

                </div>


                {/* ACTIONS */}

                <div
                  style={{
                    display:
                      "flex",
                    justifyContent:
                      "space-between",
                    alignItems:
                      "center",
                    padding:
                      "4px 10px 7px",
                  }}
                >

                  <button
                    type="button"
                    onClick={
                      selectAllCategories
                    }
                    style={{
                      border:
                        "none",
                      background:
                        "transparent",
                      color:
                        "#0f9f91",
                      fontSize:
                        "12px",
                      fontWeight:
                        "700",
                      cursor:
                        "pointer",
                    }}
                  >
                    Select All
                  </button>


                  <button
                    type="button"
                    onClick={
                      clearCategories
                    }
                    style={{
                      border:
                        "none",
                      background:
                        "transparent",
                      color:
                        "#0f9f91",
                      fontSize:
                        "12px",
                      fontWeight:
                        "700",
                      cursor:
                        "pointer",
                    }}
                  >
                    Clear
                  </button>

                </div>


                {/* COUNT */}

                <div
                  style={{
                    textAlign:
                      "center",
                    color:
                      "#94a3b8",
                    fontSize:
                      "11px",
                    marginBottom:
                      "5px",
                  }}
                >
                  {
                    filteredCategories.length
                  }{" "}
                  categories
                </div>


                {/* LIST */}

                <div className="merchant-slot-booking-dropdown-list">

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
                              ) ===
                              id
                          );

                        return (

                          <label
                            key={id}
                            className="merchant-slot-booking-checkbox-option"
                            style={{
                              background:
                                checked
                                  ? "#f0fdfa"
                                  : undefined,
                            }}
                          >

                            <input
                              type="checkbox"
                              checked={
                                checked
                              }
                              onChange={() =>
                                toggleCategory(
                                  id
                                )
                              }
                            />


                            <span className="merchant-slot-booking-custom-checkbox">
                              {checked
                                ? "✓"
                                : ""}
                            </span>


                            <span>
                              {
                                category.name
                              }
                            </span>

                          </label>

                        );

                      }
                    )

                  ) : (

                    <div className="merchant-slot-booking-empty">

                      {loadingProducts
                        ? "Loading categories..."
                        : "No categories found"}

                    </div>

                  )}

                </div>

              </div>

            )}


            {/* SELECTED CHIPS */}

            {selectedCategories.length >
              0 && (

              <div
                style={{
                  display:
                    "flex",
                  flexWrap:
                    "wrap",
                  gap:
                    "6px",
                  marginTop:
                    "9px",
                }}
              >

                {selectedCategories
                  .slice(0, 3)
                  .map(
                    (id) => {

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
                          style={{
                            display:
                              "inline-flex",
                            alignItems:
                              "center",
                            padding:
                              "4px 9px",
                            minHeight:
                              "25px",
                            borderRadius:
                              "14px",
                            background:
                              "#ecfdf5",
                            border:
                              "1px solid #b7eee2",
                            color:
                              "#0f766e",
                            fontSize:
                              "11px",
                            fontWeight:
                              "600",
                          }}
                        >
                          {
                            category?.name ??
                            `Category ${id}`
                          }
                        </span>

                      );

                    }
                  )}


                {selectedCategories.length >
                  3 && (

                  <span
                    style={{
                      display:
                        "inline-flex",
                      alignItems:
                        "center",
                      padding:
                        "4px 9px",
                      minHeight:
                        "25px",
                      borderRadius:
                        "14px",
                      background:
                        "#f1f5f9",
                      border:
                        "1px solid #e2e8f0",
                      color:
                        "#64748b",
                      fontSize:
                        "11px",
                      fontWeight:
                        "600",
                    }}
                  >
                    +
                    {
                      selectedCategories.length -
                      3
                    }{" "}
                    more
                  </span>

                )}

              </div>

            )}

          </div>

        )}


        {/* =================================================
            PRODUCT DROPDOWN
            SAME STYLE/BEHAVIOUR AS BOGO
        ================================================= */}

        {applyTo ===
          "PRODUCT" && (

          <div
            className="merchant-slot-booking-form-group"
            ref={
              productDropdownRef
            }
          >

            <div
              style={{
                display:
                  "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
                marginBottom:
                  "8px",
              }}
            >

              <label className="merchant-slot-booking-label">
                Products{" "}
                <span>*</span>
              </label>

              <span
                style={{
                  color:
                    "#94a3b8",
                  fontSize:
                    "12px",
                }}
              >
                {
                  selectedProducts.length
                }{" "}
                selected
              </span>

            </div>


            <button
              type="button"
              className={`merchant-slot-booking-dropdown-trigger ${
                productDropdownOpen
                  ? "is-open"
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


            {productDropdownOpen && (

              <div className="merchant-slot-booking-dropdown-menu">

                {/* SEARCH */}

                <div className="merchant-slot-booking-search-wrapper">

                  <SearchIcon />

                  <input
                    type="text"
                    value={
                      productSearch
                    }
                    onChange={(
                      event
                    ) =>
                      setProductSearch(
                        event.target.value
                      )
                    }
                    placeholder="Search products..."
                    autoFocus
                  />

                </div>


                {/* ACTIONS */}

                <div
                  style={{
                    display:
                      "flex",
                    justifyContent:
                      "space-between",
                    alignItems:
                      "center",
                    padding:
                      "4px 10px 7px",
                  }}
                >

                  <button
                    type="button"
                    onClick={
                      selectAllProducts
                    }
                    style={{
                      border:
                        "none",
                      background:
                        "transparent",
                      color:
                        "#0f9f91",
                      fontSize:
                        "12px",
                      fontWeight:
                        "700",
                      cursor:
                        "pointer",
                    }}
                  >
                    Select All
                  </button>


                  <button
                    type="button"
                    onClick={
                      clearProducts
                    }
                    style={{
                      border:
                        "none",
                      background:
                        "transparent",
                      color:
                        "#0f9f91",
                      fontSize:
                        "12px",
                      fontWeight:
                        "700",
                      cursor:
                        "pointer",
                    }}
                  >
                    Clear
                  </button>

                </div>


                {/* COUNT */}

                <div
                  style={{
                    textAlign:
                      "center",
                    color:
                      "#94a3b8",
                    fontSize:
                      "11px",
                    marginBottom:
                      "5px",
                  }}
                >
                  {
                    filteredProducts.length
                  }{" "}
                  products
                </div>


                {/* LIST */}

                <div className="merchant-slot-booking-dropdown-list">

                  {filteredProducts.length >
                  0 ? (

                    filteredProducts.map(
                      (product) => {

                        const productId =
                          getProductId(
                            product
                          );

                        if (
                          productId ===
                            undefined ||
                          productId ===
                            null
                        ) {

                          return null;

                        }

                        const id =
                          String(
                            productId
                          );

                        const checked =
                          selectedProducts.some(
                            (item) =>
                              String(
                                item
                              ) ===
                              id
                          );

                        return (

                          <label
                            key={id}
                            className="merchant-slot-booking-checkbox-option"
                            style={{
                              background:
                                checked
                                  ? "#f0fdfa"
                                  : undefined,
                              alignItems:
                                "flex-start",
                            }}
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


                            <span className="merchant-slot-booking-custom-checkbox">
                              {checked
                                ? "✓"
                                : ""}
                            </span>


                            <span
                              style={{
                                display:
                                  "flex",
                                flexDirection:
                                  "column",
                                gap:
                                  "3px",
                              }}
                            >

                              <span>
                                {
                                  getProductName(
                                    product
                                  )
                                }
                              </span>


                              <small
                                style={{
                                  margin: 0,
                                  color:
                                    "#94a3b8",
                                  fontSize:
                                    "11px",
                                }}
                              >
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

                    <div className="merchant-slot-booking-empty">

                      {loadingProducts
                        ? "Loading products..."
                        : "No products found"}

                    </div>

                  )}

                </div>

              </div>

            )}


            {/* SELECTED CHIPS */}

            {selectedProducts.length >
              0 && (

              <div
                style={{
                  display:
                    "flex",
                  flexWrap:
                    "wrap",
                  gap:
                    "6px",
                  marginTop:
                    "9px",
                }}
              >

                {selectedProducts
                  .slice(0, 3)
                  .map(
                    (id) => {

                      const product =
                        products.find(
                          (item) =>
                            String(
                              getProductId(
                                item
                              )
                            ) ===
                            String(id)
                        );

                      return (

                        <span
                          key={id}
                          style={{
                            display:
                              "inline-flex",
                            alignItems:
                              "center",
                            padding:
                              "4px 9px",
                            minHeight:
                              "25px",
                            borderRadius:
                              "14px",
                            background:
                              "#ecfdf5",
                            border:
                              "1px solid #b7eee2",
                            color:
                              "#0f766e",
                            fontSize:
                              "11px",
                            fontWeight:
                              "600",
                          }}
                        >
                          {
                            getProductName(
                              product
                            )
                          }
                        </span>

                      );

                    }
                  )}


                {selectedProducts.length >
                  3 && (

                  <span
                    style={{
                      display:
                        "inline-flex",
                      alignItems:
                        "center",
                      padding:
                        "4px 9px",
                      minHeight:
                        "25px",
                      borderRadius:
                        "14px",
                      background:
                        "#f1f5f9",
                      border:
                        "1px solid #e2e8f0",
                      color:
                        "#64748b",
                      fontSize:
                        "11px",
                      fontWeight:
                        "600",
                    }}
                  >
                    +
                    {
                      selectedProducts.length -
                      3
                    }{" "}
                    more
                  </span>

                )}

              </div>

            )}

          </div>

        )}


        {/* =================================================
            MAXIMUM SELECTION
        ================================================= */}

        <div className="merchant-slot-booking-form-group">

          <label className="merchant-slot-booking-label">
            Maximum Selection
          </label>


          <input
            className="merchant-slot-booking-input"
            type="number"
            name="maximumSelection"
            value={
              formData.maximumSelection
            }
            onChange={
              handleChange
            }
            min="-1"
            placeholder="-1"
          />


          <small>
            Enter -1 for unlimited selection.
          </small>

        </div>


        {/* =================================================
            BUTTON
        ================================================= */}

        {/* <div className="merchant-slot-booking-submit-container">


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
            className="merchant-slot-booking-submit-button"
            disabled={
              submitting ||
              loadingOutlets ||
              loadingProducts
            }
          >

            {submitting
              ? "Creating..."
              : "Create Slot Booking"}

          </button>

        </div> */}
<div className="merchant-slot-booking-actions">
  <button
    type="button"
    className="merchant-slot-booking-reset-button"
    onClick={handleReset}
    disabled={submitting}
  >
    Reset
  </button>

  <button
    type="submit"
    className="merchant-slot-booking-submit-button"
    disabled={submitting}
  >
    {submitting ? "Creating..." : "Create Slot Booking"}
  </button>
</div>
      </form>

    </div>
  );
};


export default SlotBooking;