import "../../styles/AddToOutletProducts.css";
import { useState, useEffect } from "react";

import {
  getAllOutlets,
  getAllMasterProducts,
  mapProductsFromMaster,
} from "../../services/masterProductsService";

import { getAdminOutletDetails } from "../../services/outletService";
import { updateProductDetails } from "../../services/productDetailService";

import {
  getAllVariantGroups,
  getVariantGroupValues,
} from "../../services/productVariantGroupService";

import Select from "react-select";

const getPriceTypeForGroup = (group, availableGroups = []) => {
  let groupName = group?.groupName || group?.name || group?.group_name || "";
  if (!groupName && group?.productVariantGroupsId && Array.isArray(availableGroups)) {
    const matched = availableGroups.find(
      (g) => String(g.productVariantGroupsId || g.groupId || g.id) === String(group.productVariantGroupsId)
    );
    groupName = matched?.groupName || matched?.name || matched?.group_name || "";
  }
  const norm = (groupName || "").trim().toLowerCase();
  if (
    norm === "add-ons" ||
    norm === "add-on" ||
    norm === "addons" ||
    norm === "addon" ||
    norm === "add ons" ||
    norm === "add on" ||
    norm.includes("add-on") ||
    norm.includes("addon")
  ) {
    return "ADD";
  }
  return "MAIN";
};

function AddToOutletProducts({
  setShowOutletPopup,
  selectedProducts,
  setActivePage,
  initialOutletId,
  initialOutletCategoryId,
  initialCategoryId,
  initialOutletName,
  asModal = false,
}) {
  // ============================================================
  // STATE
  // ============================================================

  const [outlet, setOutlet] = useState(initialOutletId ? String(initialOutletId) : "");
  const [outletCategoryId, setOutletCategoryId] = useState(initialOutletCategoryId ? String(initialOutletCategoryId) : "");
  const [categoryId, setCategoryId] = useState(initialCategoryId ? String(initialCategoryId) : "");
  const [outlets, setOutlets] = useState([]);
  const [masterProducts, setMasterProducts] = useState([]);
  const [selectedMasterProductIds, setSelectedMasterProductIds] = useState([]);
  const [loadingMasterProducts, setLoadingMasterProducts] = useState(false);
  
  // Variant draft state
  const [variantDrafts, setVariantDrafts] = useState({});
  const [availableVariantGroups, setAvailableVariantGroups] = useState([]);
  const [groupValuesCache, setGroupValuesCache] = useState({});

  const [defaultPrice, setDefaultPrice] = useState("");
  const [defaultTiming, setDefaultTiming] = useState("");
  const [defaultType, setDefaultType] = useState("");
  const [appliedPrice, setAppliedPrice] = useState("");
  const [appliedTiming, setAppliedTiming] = useState("");

  const [isSaving, setIsSaving] = useState(false);

  /**
   * Backend mapping result.
   * null = result screen not shown
   */
  const [mappingResult, setMappingResult] = useState(null);

  const hasPreselectedProducts = Array.isArray(selectedProducts) && selectedProducts.length > 0;
  const products = hasPreselectedProducts
    ? selectedProducts
    : masterProducts.filter((product) =>
      selectedMasterProductIds.includes(Number(product.masterProductId || product.productId || product.id))
    );

  // ============================================================
  // DEBUG
  // ============================================================

  console.log("Products received:", products);

  // ============================================================
  // FETCH OUTLETS & VARIANT GROUPS
  // ============================================================

  const fetchOutlets = async () => {
    try {
      const response = await getAllOutlets();
      console.log("Outlets response:", response.data);
      setOutlets(response.data?.data || []);
    } catch (error) {
      console.error("Failed to fetch outlets:", error);
      alert("Failed to load outlets.");
    }
  };

  const fetchVariantGroupsList = async () => {
    try {
      const response = await getAllVariantGroups();
      console.log("Variant Groups Response:", response.data);
      const data = response.data?.data || response.data || [];
      setAvailableVariantGroups(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch variant groups:", error);
    }
  };

  const fetchGroupValuesList = async (groupId) => {
    if (!groupId || groupValuesCache[groupId]) return;
    try {
      const response = await getVariantGroupValues(groupId);
      console.log(`Variant Group ${groupId} Values Response:`, response.data);
      const data = response.data?.data || response.data || [];
      setGroupValuesCache((prev) => ({
        ...prev,
        [groupId]: Array.isArray(data) ? data : [],
      }));
    } catch (error) {
      console.error(`Failed to fetch values for group ${groupId}:`, error);
    }
  };

  useEffect(() => {
    fetchOutlets();
    fetchVariantGroupsList();
  }, []);

  useEffect(() => {
    if (initialOutletId) setOutlet(String(initialOutletId));
  }, [initialOutletId]);

  useEffect(() => {
    if (initialOutletCategoryId) setOutletCategoryId(String(initialOutletCategoryId));
    if (initialCategoryId) setCategoryId(String(initialCategoryId));
  }, [initialOutletCategoryId, initialCategoryId]);

  useEffect(() => {
    if (!asModal || initialOutletCategoryId || !initialOutletId) return;

    let isActive = true;
    const fetchOutletCategory = async () => {
      try {
        const response = await getAdminOutletDetails(Number(initialOutletId));
        const outletDetails = response?.data ?? response ?? {};
        const categories = Array.isArray(outletDetails.categories)
          ? outletDetails.categories
          : [];
        const selectedProduct = selectedProducts?.[0];
        const selectedProductId = Number(
          selectedProduct?.productId ?? selectedProduct?.masterProductId ?? selectedProduct?.id
        );
        const selectedCategoryId = Number(selectedProduct?.categoryId);
        const matchedCategory = categories.find((category) => {
          const categoryIdValue = Number(category?.categoryId ?? category?.id);
          const containsProduct = Array.isArray(category?.products) && category.products.some(
            (product) =>
              Number(product?.productId ?? product?.masterProductId ?? product?.id) === selectedProductId
          );
          return containsProduct || (selectedCategoryId > 0 && categoryIdValue === selectedCategoryId);
        });

        const resolvedOutletCategoryId =
          matchedCategory?.outletCategoryId ??
          matchedCategory?.outlet_category_id ??
          outletDetails?.outletCategoryId ??
          outletDetails?.outlet_category_id;

        if (isActive && Number(resolvedOutletCategoryId) > 0) {
          setOutletCategoryId(String(resolvedOutletCategoryId));
        }
      } catch (error) {
        console.error("Failed to fetch outlet category:", error);
      }
    };

    fetchOutletCategory();
    return () => {
      isActive = false;
    };
  }, [asModal, initialOutletCategoryId, initialOutletId, selectedProducts]);

  useEffect(() => {
    if (categoryId) return;

    const categoryIds = products
      .map((product) => Number(product?.categoryId))
      .filter((value) => Number.isInteger(value) && value > 0);

    const uniqueCategoryIds = [...new Set(categoryIds)];

    if (uniqueCategoryIds.length === 1) {
      setCategoryId(String(uniqueCategoryIds[0]));
    }
  }, [products, categoryId]);

  useEffect(() => {
    if (hasPreselectedProducts) return;

    const fetchMasterProducts = async () => {
      setLoadingMasterProducts(true);
      try {
        const response = await getAllMasterProducts(0, 100);
        const data = response?.data?.data ?? response?.data ?? {};
        const list = Array.isArray(data)
          ? data
          : data.content || data.products || [];
        setMasterProducts(list);
      } catch (error) {
        console.error("Failed to fetch master products:", error);
        alert("Failed to load master products.");
      } finally {
        setLoadingMasterProducts(false);
      }
    };

    fetchMasterProducts();
  }, [hasPreselectedProducts]);

  // Pre-fetch values for any pre-existing group IDs
  useEffect(() => {
    Object.values(variantDrafts).forEach((groups) => {
      if (Array.isArray(groups)) {
        groups.forEach((g) => {
          if (g.productVariantGroupsId) {
            fetchGroupValuesList(g.productVariantGroupsId);
          }
        });
      }
    });
  }, [variantDrafts]);

  // ============================================================
  // OUTLET SELECT OPTIONS
  // ============================================================

  const outletOptions = outlets.map((o) => ({
    value: String(o.outletId || o.id),
    label: o.outletName || o.name || `Outlet ${o.outletId || o.id}`,
  }));

  const selectedOutlet = outletOptions.find((o) => o.value === outlet) || null;

  // ============================================================
  // CLOSE POPUP
  // ============================================================

  const handleClose = () => {
    if (typeof setShowOutletPopup === "function") {
      setShowOutletPopup(false);
    } else if (typeof setActivePage === "function") {
      setActivePage("masterProducts");
    }
  };

  const toggleMasterProduct = (product) => {
    const productId = Number(product.masterProductId || product.productId || product.id);
    if (!productId) return;

    setSelectedMasterProductIds((current) => {
      const isSelected = current.includes(productId);
      if (!isSelected) {
        setVariantDrafts((drafts) => ({
          ...drafts,
          [productId]: drafts[productId] || toVariantGroups(product),
        }));
      }
      return isSelected ? current.filter((id) => id !== productId) : [...current, productId];
    });
  };

  const toVariantGroups = (product) => {
    return normalizeVariantGroups(product.variantGroups || product.productVariantGroups || []);
  };

  const normalizeVariantGroups = (groups) => {
    return Array.isArray(groups)
      ? groups
        .map((group) => {
          const groupId = Number(group.productVariantGroupsId || group.variantGroupId || group.id || group.groupId);
          if (groupId > 0) {
            fetchGroupValuesList(groupId);
          }
          const groupName = group.groupName || group.name || group.group_name || "";
          const calculatedPriceType = getPriceTypeForGroup(
            { groupName, productVariantGroupsId: groupId },
            availableVariantGroups
          );
          return {
            productVariantGroupsId: groupId || "",
            groupName,
            options: Array.isArray(group.options || group.values || group.variantGroupValues)
              ? (group.options || group.values || group.variantGroupValues)
                .map((option) => ({
                  productVariantOptionsId: Number(
                    option.productVariantOptionsId || option.variantOptionId || option.id || option.productVariantGroupValuesId || option.valueId
                  ) || "",
                  productVariantGroupValuesId: Number(
                    option.productVariantGroupValuesId || option.variantGroupValueId || option.valueId || option.id
                  ) || "",
                  optionName: option.variantName || option.optionName || option.name || option.valueName || "",
                  priceType: calculatedPriceType,
                  variantPrice: Number(option.variantPrice ?? option.price ?? 0),
                }))
              : [],
          };
        })
        .filter(
          (group) => group.productVariantGroupsId > 0 || group.options.length > 0
        )
      : [];
  };

  const getMasterProductId = (product) =>
    Number(product.masterProductId || product.productId || product.id);

  const emptyVariantOption = (priceType = "MAIN") => ({
    productVariantOptionsId: "",
    productVariantGroupValuesId: "",
    optionName: "",
    priceType,
    variantPrice: "",
  });

  const addVariantGroup = (product) => {
    const productId = getMasterProductId(product);
    setVariantDrafts((drafts) => ({
      ...drafts,
      [productId]: [
        ...(drafts[productId] || toVariantGroups(product)),
        { productVariantGroupsId: "", groupName: "", options: [emptyVariantOption()] },
      ],
    }));
  };

  const updateVariantGroup = (product, groupIndex, groupIdValue) => {
    const productId = getMasterProductId(product);
    const selectedGroupObj = availableVariantGroups.find(
      (g) => String(g.productVariantGroupsId || g.groupId || g.id) === String(groupIdValue)
    );
    const groupName = selectedGroupObj?.groupName || selectedGroupObj?.name || selectedGroupObj?.group_name || "";
    
    if (groupIdValue) {
      fetchGroupValuesList(groupIdValue);
    }

    const calculatedPriceType = getPriceTypeForGroup(
      { groupName, productVariantGroupsId: groupIdValue },
      availableVariantGroups
    );

    setVariantDrafts((drafts) => ({
      ...drafts,
      [productId]: (drafts[productId] || toVariantGroups(product)).map((group, index) =>
        index === groupIndex
          ? {
              ...group,
              productVariantGroupsId: groupIdValue ? Number(groupIdValue) : "",
              groupName,
              options: (group.options || []).map((option) => ({
                ...option,
                priceType: calculatedPriceType,
              })),
            }
          : group
      ),
    }));
  };

  const removeVariantGroup = (product, groupIndex) => {
    const productId = getMasterProductId(product);
    setVariantDrafts((drafts) => ({
      ...drafts,
      [productId]: (drafts[productId] || toVariantGroups(product)).filter((_, index) => index !== groupIndex),
    }));
  };

  const updateVariantOptionValue = (product, groupIndex, optionIndex, valueIdValue) => {
    const productId = getMasterProductId(product);
    const currentGroups = variantDrafts[productId] || toVariantGroups(product);
    const currentGroup = currentGroups[groupIndex];
    const groupId = currentGroup?.productVariantGroupsId;
    const groupValuesList = groupValuesCache[groupId] || [];
    
    const selectedValObj = groupValuesList.find(
      (v) => String(v.productVariantGroupValuesId || v.valueId || v.id) === String(valueIdValue)
    );
    
    const optionName = selectedValObj?.variantName || selectedValObj?.valueName || selectedValObj?.name || selectedValObj?.value || "";

    setVariantDrafts((drafts) => ({
      ...drafts,
      [productId]: (drafts[productId] || toVariantGroups(product)).map((group, gIdx) => {
        if (gIdx !== groupIndex) return group;
        return {
          ...group,
          options: (group.options || []).map((option, oIdx) => {
            if (oIdx !== optionIndex) return option;
            return {
              ...option,
              productVariantGroupValuesId: valueIdValue ? Number(valueIdValue) : "",
              productVariantOptionsId: valueIdValue ? Number(valueIdValue) : "",
              optionName,
            };
          }),
        };
      }),
    }));
  };

  const updateVariantOption = (product, groupIndex, optionIndex, field, value) => {
    const productId = getMasterProductId(product);
    setVariantDrafts((drafts) => ({
      ...drafts,
      [productId]: (drafts[productId] || toVariantGroups(product)).map((group, index) => {
        if (index !== groupIndex) return group;
        return {
          ...group,
          options: (group.options || []).map((option, optionPosition) =>
            optionPosition === optionIndex ? { ...option, [field]: value } : option
          ),
        };
      }),
    }));
  };

  const addVariantOption = (product, groupIndex) => {
    const productId = getMasterProductId(product);
    setVariantDrafts((drafts) => {
      const currentGroups = drafts[productId] || toVariantGroups(product);
      const targetGroup = currentGroups[groupIndex];
      const calculatedPriceType = getPriceTypeForGroup(targetGroup, availableVariantGroups);
      return {
        ...drafts,
        [productId]: currentGroups.map((group, index) =>
          index === groupIndex
            ? { ...group, options: [...(group.options || []), emptyVariantOption(calculatedPriceType)] }
            : group
        ),
      };
    });
  };

  const removeVariantOption = (product, groupIndex, optionIndex) => {
    const productId = getMasterProductId(product);
    setVariantDrafts((drafts) => ({
      ...drafts,
      [productId]: (drafts[productId] || toVariantGroups(product)).map((group, index) =>
        index === groupIndex
          ? { ...group, options: group.options.filter((_, position) => position !== optionIndex) }
          : group
      ),
    }));
  };

  // ============================================================
  // SAVE PRODUCTS
  // ============================================================

  const handleSaveProducts = async () => {
    if (!outlet) {
      alert("Please select an outlet.");
      return;
    }

    if (!products || products.length === 0) {
      alert("Please select at least one master product.");
      return;
    }

    const invalidProducts = products.filter(
      (product) =>
        !getMasterProductId(product) ||
        getMasterProductId(product) <= 0
    );

    if (invalidProducts.length > 0) {
      alert("One or more selected products do not have a valid Master Product ID.");
      return;
    }

    const hasIncompleteVariantDraft = products.some((product) => {
      const draftGroups = variantDrafts[getMasterProductId(product)];
      if (!draftGroups) return false;

      return draftGroups.some(
        (group) =>
          !Number(group.productVariantGroupsId) ||
          !Array.isArray(group.options) ||
          group.options.length === 0 ||
          group.options.some(
            (option) =>
              !Number(option.productVariantGroupValuesId) ||
              option.variantPrice === "" ||
              option.variantPrice === null ||
              Number.isNaN(Number(option.variantPrice))
          )
      );
    });

    if (hasIncompleteVariantDraft) {
      alert("Complete every variant group and option, including its price, before saving.");
      return;
    }

    setMappingResult(null);
    setIsSaving(true);

    const serializeVariantGroups = (groups) =>
      groups.map((group) => {
        const calculatedPriceType = getPriceTypeForGroup(group, availableVariantGroups);
        return {
          productVariantGroupsId: Number(group.productVariantGroupsId),
          options: (group.options || []).map((option) => ({
            productVariantOptionsId: Number(option.productVariantOptionsId || option.productVariantGroupValuesId),
            productVariantGroupValuesId: Number(option.productVariantGroupValuesId),
            priceType: calculatedPriceType,
            variantPrice: Number(option.variantPrice),
          })),
        };
      });

    const payload = {
      outletCategoryId: Number(outletCategoryId),
      outletId: Number(outlet),
      categoryId: Number(categoryId),
      products: products.map((product) => {
        const masterProductId = getMasterProductId(product);

        let isVeg = null;
        if (defaultType === "Veg") {
          isVeg = true;
        } else if (defaultType === "Non Veg") {
          isVeg = false;
        } else if (product.veg !== undefined && product.veg !== null) {
          isVeg = Number(product.veg) === 1;
        } else if (product.nonVeg !== undefined && product.nonVeg !== null) {
          isVeg = Number(product.nonVeg) !== 1;
        } else if (typeof product.isVeg === "boolean") {
          isVeg = product.isVeg;
        }

        const rawXlsPrice =
          product.xlsMerchantPrice ??
          product.csvMerchantPrice ??
          product.csvPrice ??
          product.merchantPrice ??
          null;

        const hasXlsPrice =
          rawXlsPrice !== null &&
          rawXlsPrice !== undefined &&
          rawXlsPrice !== "" &&
          !Number.isNaN(Number(rawXlsPrice));

        const merchantPrice = hasXlsPrice
          ? Number(rawXlsPrice)
          : appliedPrice !== ""
            ? Number(appliedPrice)
            : 0;

        const variantGroups = serializeVariantGroups(
          variantDrafts[masterProductId] ?? toVariantGroups(product)
        );

        return {
          masterProductId,
          productName: product.masterProductName || product.productName || "",
          description: product.description || "",
          categoryId:
            product.categoryId !== undefined && product.categoryId !== null
              ? Number(product.categoryId)
              : null,
          productType: product.productType || product.type || "",
          isVeg: isVeg !== null ? isVeg : false,
          hasProductVariants: variantGroups.length > 0,
          merchantPrice,
          variantGroups,
        };
      }),
    };

    const existingProduct = products.find((p) => p.productId || (asModal && p.id));

    try {
      if (existingProduct && (existingProduct.productId || existingProduct.id)) {
        const productId = Number(existingProduct.productId || existingProduct.id);
        const masterProductId = getMasterProductId(existingProduct);
        const draftGroups = variantDrafts[masterProductId] ?? toVariantGroups(existingProduct);

        let isVeg = null;
        if (defaultType === "Veg") isVeg = true;
        else if (defaultType === "Non Veg") isVeg = false;
        else if (existingProduct.veg !== undefined && existingProduct.veg !== null) isVeg = Number(existingProduct.veg) === 1;
        else if (existingProduct.nonVeg !== undefined && existingProduct.nonVeg !== null) isVeg = Number(existingProduct.nonVeg) !== 1;
        else if (typeof existingProduct.isVeg === "boolean") isVeg = existingProduct.isVeg;

        const variantGroups = draftGroups.map((group) => {
          const calculatedPriceType = getPriceTypeForGroup(group, availableVariantGroups);
          return {
            productVariantGroupsId: Number(group.productVariantGroupsId),
            options: (group.options || []).map((option) => ({
              productVariantOptionsId:
                option.productVariantOptionsId &&
                Number(option.productVariantOptionsId) > 0 &&
                Number(option.productVariantOptionsId) !== Number(option.productVariantGroupValuesId)
                  ? Number(option.productVariantOptionsId)
                  : null,
              productVariantGroupValuesId: Number(option.productVariantGroupValuesId),
              priceType: calculatedPriceType,
              variantPrice: Number(option.variantPrice),
            })),
          };
        });

        const updatePayload = {
          productName: existingProduct.productName || existingProduct.masterProductName || "",
          outletCategoryId: Number(outletCategoryId || existingProduct.outletCategoryId || 1),
          description: existingProduct.description || "",
          isVeg: isVeg !== null ? isVeg : false,
          hasProductVariants: variantGroups.length > 0,
          merchantPrice: Number(existingProduct.merchantPrice || appliedPrice || 0),
          imageLink: existingProduct.imageLink || "",
          photos: existingProduct.photos || "",
          thumbnail: existingProduct.thumbnail || "",
          productType: existingProduct.productType || existingProduct.type || "",
          timings: (existingProduct.timings || existingProduct.productTimings || []).map((t) => ({
            productAvailableTimingId: t.productAvailableTimingId || t.id || null,
            dayOfWeekId: t.dayOfWeekId || t.dayId || 1,
            startTime: t.startTime || "09:00",
            endTime: t.endTime || "22:00",
          })),
          variantGroups,
        };

        console.log("[UPDATE-PRODUCT] PUT /api/fm/products/updateproduct Payload:", JSON.stringify(updatePayload, null, 2));

        const response = await updateProductDetails(productId, updatePayload);
        console.log("[UPDATE-PRODUCT] Response:", response);

        setMappingResult({
          savedCount: 1,
          skippedCount: 0,
          savedNames: [existingProduct.productName || "Product"],
          savedProducts: [{
            productName: existingProduct.productName || "Product",
            merchantPrice: existingProduct.merchantPrice,
            timing: "",
            dayOfWeek: "",
          }],
          skippedNames: [],
          skippedProducts: [],
        });
      } else {
        console.log("MASTER PRODUCT → OUTLET PRODUCT PAYLOAD:", JSON.stringify(payload, null, 2));

        const response = await mapProductsFromMaster(payload);
        const result = response.data?.data || response.data || {};
        const savedCount = Number(result?.savedCount ?? 0);
        const skippedCount = Number(result?.skippedCount ?? 0);
        const savedNames = Array.isArray(result?.savedNames) ? result.savedNames : [];
        const skippedNames = Array.isArray(result?.skippedNames) ? result.skippedNames : [];

        let skippedProducts = Array.isArray(result?.skippedProducts)
          ? result.skippedProducts
          : [];

        if (skippedProducts.length === 0 && skippedNames.length > 0) {
          skippedProducts = skippedNames.map((name) => ({
            productName: String(name).replace(" (Already Exists)", ""),
            reason: String(name).includes("Already Exists")
              ? "Product already exists in this outlet and category"
              : "Product was skipped by the backend",
          }));
        }

        const backendSavedProducts = Array.isArray(result?.savedProducts)
          ? result.savedProducts
          : Array.isArray(result?.savedProductDetails)
            ? result.savedProductDetails
            : [];

        const normalizeName = (value) => String(value || "").trim().toLowerCase();

        const savedProductsList = backendSavedProducts.length > 0
          ? backendSavedProducts.map((item) => ({
            productName: item?.productName || item?.masterProductName || "",
            merchantPrice: item?.merchantPrice ?? item?.csvMerchantPrice ?? item?.xlsMerchantPrice ?? item?.csvPrice ?? null,
            timing: item?.csvTiming ?? item?.xlsTiming ?? item?.timing ?? "",
            dayOfWeek: item?.csvDayOfWeek ?? item?.xlsDayOfWeek ?? item?.dayOfWeek ?? "",
          }))
          : savedNames.map((savedName) => {
            const cleanSavedName = String(savedName || "").replace(" (Already Exists)", "").trim();
            const matchedProduct = products.find(
              (product) => normalizeName(product?.masterProductName || product?.productName) === normalizeName(cleanSavedName)
            );
            return {
              productName: cleanSavedName,
              merchantPrice: matchedProduct?.xlsMerchantPrice ?? matchedProduct?.csvMerchantPrice ?? matchedProduct?.csvPrice ?? matchedProduct?.merchantPrice ?? null,
              timing: matchedProduct?.xlsTiming ?? matchedProduct?.csvTiming ?? matchedProduct?.timing ?? "",
              dayOfWeek: matchedProduct?.xlsDayOfWeek ?? matchedProduct?.csvDayOfWeek ?? matchedProduct?.dayOfWeek ?? "",
            };
          });

        setMappingResult({
          savedCount,
          skippedCount,
          savedNames,
          savedProducts: savedProductsList,
          skippedNames,
          skippedProducts,
        });
      }
    } catch (error) {
      console.error("Failed to add products to outlet:", error);
      const message = error?.response?.data?.message || error?.response?.data?.error || "Failed to add products.";
      alert(message);
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================================
  // RESULT SCREEN
  // ============================================================

  if (mappingResult) {
    const {
      savedCount,
      skippedCount,
      savedNames,
      savedProducts = [],
      skippedProducts,
    } = mappingResult;

    return (
      <div className="outlet-page outlet-mapping-result-overlay">
        <div className="outlet-card mapping-result-card">
          <div className="outlet-header">
            <h2>📊 Product Mapping Result</h2>
            <button type="button" className="close-btn" onClick={handleClose}>✕</button>
          </div>

          <div className="mapping-summary">
            <div className="mapping-summary-card mapping-summary-success">
              <div className="mapping-summary-icon">✅</div>
              <div className="mapping-summary-count">{savedCount}</div>
              <div className="mapping-summary-label">Successfully Added</div>
            </div>

            <div className="mapping-summary-card mapping-summary-skipped">
              <div className="mapping-summary-icon">⏭️</div>
              <div className="mapping-summary-count">{skippedCount}</div>
              <div className="mapping-summary-label">Skipped</div>
            </div>
          </div>

          {savedCount > 0 && savedNames.length > 0 && (
            <div className="mapping-saved-section">
              <h3>✅ Successfully Added Products</h3>
              <div className="mapping-saved-list">
                {(savedProducts.length > 0
                  ? savedProducts
                  : savedNames.map((name) => ({ productName: name, merchantPrice: null, timing: "", dayOfWeek: "" }))
                ).map((item, index) => (
                  <div key={`${item?.productName || "product"}-${index}`} className={`mapping-saved-item ${index < (savedProducts.length > 0 ? savedProducts.length : savedNames.length) - 1 ? "has-divider" : ""}`}>
                    <div className="mapping-saved-name">
                      <span className="mapping-check">✓</span>
                      <span className="mapping-product-name">{item?.productName || "Unknown Product"}</span>
                    </div>
                    <div className="mapping-saved-meta">
                      <span className="mapping-saved-price">
                        {item?.merchantPrice !== null && item?.merchantPrice !== undefined && item?.merchantPrice !== ""
                          ? `₹${Number(item.merchantPrice).toFixed(2)}`
                          : "₹0.00"}
                      </span>
                      {item?.timing && <span className="mapping-saved-time">{item.timing}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {skippedCount > 0 && (
            <div>
              <h3>⏭️ Skipped Products</h3>
              <div className="mapping-skipped-list">
                {skippedProducts.length > 0 ? (
                  skippedProducts.map((item, index) => (
                    <div key={`${item?.productName}-${index}`} className={`mapping-skipped-item ${index % 2 === 0 ? "mapping-skipped-alt" : ""} ${index < skippedProducts.length - 1 ? "has-divider" : ""}`}>
                      <div className="mapping-skipped-name">⏭️ {item?.productName || "Unknown Product"}</div>
                      <div className="mapping-skipped-reason"><strong>Reason:</strong> {item?.reason || "Product was skipped"}</div>
                    </div>
                  ))
                ) : (
                  <div className="mapping-skipped-empty">Products were skipped, but no detailed reason was returned by the backend.</div>
                )}
              </div>
            </div>
          )}

          {skippedCount === 0 && (
            <div className="mapping-all-saved">🎉 All selected products were successfully added.</div>
          )}

          <div className="outlet-footer">
            <button type="button" className="outlet-cancel-btn" onClick={handleClose}>Close</button>
            <button type="button" className="outlet-save-btn" onClick={() => setMappingResult(null)}>← Back</button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // MAIN FORM
  // ============================================================

  return (
    <div className={`outlet-page ${asModal ? "outlet-variant-modal" : ""}`}>
      <div className="outlet-card variant-popup-card">
        <div className="outlet-header">
          <h2>📂 Add to Outlet Products</h2>
          <button type="button" className="close-btn" onClick={handleClose}>✕</button>
        </div>

        <div className="outlet-body">
          {asModal && initialOutletName && (
            <div className="mapping-info-bar">
              <div className="mapping-info-item">
                <span className="mapping-info-label">Outlet</span>
                <span className="mapping-info-value">{initialOutletName}</span>
              </div>
              {outletCategoryId && (
                <div className="mapping-info-item">
                  <span className="mapping-info-label">Outlet Category ID</span>
                  <span className="mapping-info-value">{outletCategoryId}</span>
                </div>
              )}
            </div>
          )}

          {!asModal && (
            <>
              <div className="outlet-info">
                <div className="outlet-icon">📦</div>
                <div>
                  <h3>Map selected products to an outlet</h3>
                  <p>Choose the outlet, set a default price and timing, then save. Selected master products will be mapped to their corresponding outlet categories automatically.</p>
                </div>
              </div>

              {!hasPreselectedProducts && (
                <div className="outlet-form master-product-picker">
                  <div className="form-group full">
                    <label>Master Products *</label>
                    <div className="master-product-list">
                      {loadingMasterProducts ? (
                        <p className="master-product-empty">Loading master products...</p>
                      ) : masterProducts.length === 0 ? (
                        <p className="master-product-empty">No master products available.</p>
                      ) : (
                        masterProducts.map((product, index) => {
                          const productId = Number(product.masterProductId || product.productId || product.id);
                          const productName = product.masterProductName || product.productName || `Product ${productId}`;
                          return (
                            <label key={productId || index} className={`master-product-option ${index < masterProducts.length - 1 ? "master-product-divider" : ""}`}>
                              <input
                                type="checkbox"
                                checked={selectedMasterProductIds.includes(productId)}
                                onChange={() => toggleMasterProduct(product)}
                              />
                              <span>
                                {productName}
                                <small className="master-product-meta">
                                  ID: {productId} {product.variantGroups?.length ? `• ${product.variantGroups.length} variant group(s)` : ""}
                                </small>
                              </span>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="outlet-form">
                <div className="form-group full">
                  <label>Outlet *</label>
                  <Select
                    classNamePrefix="outlet-select"
                    options={outletOptions}
                    value={selectedOutlet}
                    onChange={(selected) => setOutlet(selected ? selected.value : "")}
                    placeholder="Select Outlet..."
                    isSearchable
                    isDisabled={isSaving}
                  />
                </div>
                <div className="row outlet-category-row">
                  <div className="form-group">
                    <label>Outlet Category ID <span>(required)</span></label>
                    <input type="number" min="1" placeholder="e.g. 1" value={outletCategoryId} disabled={isSaving} onChange={(event) => setOutletCategoryId(event.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Category ID <span>(required)</span></label>
                    <input type="number" min="1" placeholder="e.g. 1" value={categoryId} disabled={isSaving} onChange={(event) => setCategoryId(event.target.value)} />
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="products-header">
            <h4>{asModal ? "PRODUCT DETAILS" : "PRODUCTS TO MAP"}</h4>
          </div>

          <div className="products-list">
            {products.map((product, index) => {
              const isVeg =
                typeof product.isVeg === "boolean"
                  ? product.isVeg
                  : product.veg === 1 || product.veg === true;
              const productId = getMasterProductId(product);
              const variantGroups = variantDrafts[productId] ?? toVariantGroups(product);

              const displayPrice =
                product.merchantPrice ??
                product.xlsMerchantPrice ??
                product.csvMerchantPrice ??
                product.csvPrice ??
                appliedPrice ??
                "—";

              return (
                <div key={productId || index} className="food-item-card">
                  {/* ---- Product Summary ---- */}
                  <div className="product-summary-card">
                    <div className="product-summary-top">
                      <div className="product-summary-name">
                        <h5>
                          {product.masterProductName || product.productName}
                          <span className={`product-veg-badge ${isVeg ? "veg" : "nonveg"}`}>
                            {isVeg ? "VEG" : "NON-VEG"}
                          </span>
                        </h5>
                        {product.description && <p className="product-summary-desc">{product.description}</p>}
                      </div>
                      {product.imageLink && product.imageLink.startsWith("http") && (
                        <img src={product.imageLink} alt="" className="product-summary-img" />
                      )}
                    </div>
                  </div>

                  {/* ---- Variant Editor ---- */}
                  <section className="variant-editor">
                    <div className="variant-editor-header">
                      <div>
                        <h5>Variant Groups ({variantGroups.length})</h5>
                        <p>Select variant group & value names. Set the price type (MAIN / ADD) and price for each option.</p>
                      </div>
                      <button type="button" className="add-variant-group-btn" onClick={() => addVariantGroup(product)} disabled={isSaving}>
                        + Add group
                      </button>
                    </div>

                    {variantGroups.length === 0 ? (
                      <div className="no-variants">No variant groups on this product. Click "+ Add group" to create one.</div>
                    ) : (
                      variantGroups.map((group, groupIndex) => {
                        const currentGroupId = group.productVariantGroupsId;
                        const groupValuesList = groupValuesCache[currentGroupId] || [];

                        return (
                          <div className="variant-group-editor" key={`${productId}-${groupIndex}`}>
                            <div className="variant-group-toolbar">
                              <div className="variant-group-label" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <span className="variant-group-name" style={{ fontWeight: "600" }}>Variant Group:</span>
                                
                                {/* Group Name / ID Dropdown */}
                                <select
                                  value={group.productVariantGroupsId ?? ""}
                                  disabled={isSaving}
                                  onChange={(event) => updateVariantGroup(product, groupIndex, event.target.value)}
                                  style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", minWidth: "180px" }}
                                >
                                  <option value="">Select Variant Group...</option>
                                  {availableVariantGroups.map((g) => {
                                    const gId = g.productVariantGroupsId || g.groupId || g.id;
                                    const gName = g.groupName || g.name || g.group_name || `Group ${gId}`;
                                    return (
                                      <option key={gId} value={gId}>
                                        {gName}
                                      </option>
                                    );
                                  })}
                                </select>
                              </div>
                            </div>

                            <div className="variant-options-heading" style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 1fr 40px", gap: "10px", padding: "8px 0", fontWeight: "600", fontSize: "13px" }}>
                              <span>Option Value</span>
                              <span>Price Type</span>
                              <span>Price (₹)</span>
                              <span />
                            </div>

                            {group.options?.map((option, optionIndex) => (
                              <div className="variant-option-row" key={optionIndex} style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 1fr 40px", gap: "10px", marginBottom: "8px", alignItems: "center" }}>
                                
                                {/* Group Value / Option Name Dropdown */}
                                <select
                                  value={option.productVariantGroupValuesId ?? ""}
                                  disabled={isSaving || !currentGroupId}
                                  onChange={(event) => updateVariantOptionValue(product, groupIndex, optionIndex, event.target.value)}
                                  style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                >
                                  <option value="">Select Value...</option>
                                  {groupValuesList.map((val) => {
                                    const vId = val.productVariantGroupValuesId || val.valueId || val.id;
                                    const vName = val.variantName || val.valueName || val.name || val.value || `Value ${vId}`;
                                    return (
                                      <option key={vId} value={vId}>
                                        {vName}
                                      </option>
                                    );
                                  })}
                                </select>

                                 {/* Price Type (Read-only: ADD for Add-ons group, MAIN for everything else) */}
                                <input
                                  type="text"
                                  readOnly
                                  value={getPriceTypeForGroup(group, availableVariantGroups)}
                                  style={{
                                    padding: "6px 10px",
                                    borderRadius: "6px",
                                    border: "1px solid #cbd5e1",
                                    backgroundColor: "#f1f5f9",
                                    color: "#334155",
                                    fontWeight: "600",
                                    cursor: "not-allowed",
                                  }}
                                />

                                {/* Variant Price Input */}
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="Price"
                                  value={option.variantPrice ?? ""}
                                  disabled={isSaving}
                                  onChange={(event) => updateVariantOption(product, groupIndex, optionIndex, "variantPrice", event.target.value)}
                                  style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                />
                              </div>
                            ))}

                            <button type="button" className="add-option-btn" style={{ marginTop: "10px" }} onClick={() => addVariantOption(product, groupIndex)} disabled={isSaving}>
                              + Add option
                            </button>
                            <br />
                          </div>
                        );
                      })
                    )}
                    <span className="variant-message-span">If you want to remove variant Conatact Admin</span>
                  </section>
                </div>
              );
            })}
          </div>
        </div>

        <div className="outlet-footer">
          <button
            type="button"
            className="outlet-cancel-btn"
            disabled={isSaving}
            onClick={handleClose}
          >
            Cancel
          </button>

          <button
            type="button"
            className="outlet-save-btn"
            onClick={handleSaveProducts}
            disabled={products.length === 0 || isSaving}
          >
            {isSaving ? "⏳ Saving..." : "Save variants"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddToOutletProducts;