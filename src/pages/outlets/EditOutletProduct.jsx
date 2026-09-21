import React, { useState, useEffect, useMemo } from "react";
import "../../styles/EditOutletProduct.css";
import {
  getCompleteProductDetails,
  updateCategoryAndProductDetails,
} from "../../services/productDetailService";
import {
  getAllVariantGroups,
  getVariantGroupById,
  saveVariantGroup,
  deleteVariantGroup,
  getVariantGroupValues,
  saveVariantGroupValue,
  getVariantGroupValueById,
  deleteVariantGroupValue,
  getProductVariantOptions,
  saveProductVariantOption,
  getProductVariantOptionById,
  deleteProductVariantOption,
} from "../../services/productVariantGroupService";
import {
  FiArrowLeft,
  FiSave,
  FiLoader,
  FiClock,
  FiLayers,
  FiPlus,
  FiTrash2,
  FiCheck,
  FiInfo,
  FiDollarSign,
  FiTag,
  FiEdit3,
  FiCalendar,
  FiX,
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

const createTimeSlot = (
  startTime = "09:00",
  endTime = "22:00",
  productAvailableTimingId = null
) => ({
  startTime,
  endTime,
  productAvailableTimingId,
});

const createDayTiming = (
  enabled = true,
  timeSlots = [createTimeSlot()]
) => ({
  enabled,
  timeSlots,
});

const getPriceTypeForGroup = (groupName) => {
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

function EditOutletProduct({
  product,
  outlet,
  outletCategories = [],
  onClose,
  onProductUpdated,
}) {
  const productId = Number(product?.productId || product?.id);
  const outletId = outlet?.outletId ?? outlet?.id;
  const outletName = outlet?.outletName ?? outlet?.name ?? "Outlet";

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Product fields
  const [productName, setProductName] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [outletCategoryId, setOutletCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [merchantPrice, setMerchantPrice] = useState("");
  const [isVeg, setIsVeg] = useState(true);
  const [productType, setProductType] = useState("FOOD");
  const [imageLink, setImageLink] = useState("");
  const [photos, setPhotos] = useState("");
  const [thumbnail, setThumbnail] = useState("");

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

  // Variant Groups
  const [variantGroups, setVariantGroups] = useState([]);
  const [availableGroups, setAvailableGroups] = useState([]);
  const [groupValuesCache, setGroupValuesCache] = useState({});
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [selectedNewGroupId, setSelectedNewGroupId] = useState("");
  const [newOptionDrafts, setNewOptionDrafts] = useState({});

  // 1. Fetch initial product details and variant groups using variant APIs
  useEffect(() => {
    if (!productId) return;

    const initData = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        // Fetch complete product details
        const res = await getCompleteProductDetails(productId);
        const data = res?.data?.data || res?.data || res || {};

        setProductName(data.productName || product?.productName || "");
        setCategoryName(data.categoryName || product?.categoryName || "");
        setOutletCategoryId(
          data.outletCategoryId ||
            data.categoryId ||
            product?.outletCategoryId ||
            product?.categoryId ||
            ""
        );
        setDescription(data.description || product?.description || "");
        setMerchantPrice(
          data.merchantPrice !== undefined && data.merchantPrice !== null
            ? String(data.merchantPrice)
            : product?.merchantPrice !== undefined && product?.merchantPrice !== null
            ? String(product.merchantPrice)
            : ""
        );

        const vegVal =
          data.isVeg !== undefined
            ? data.isVeg
            : product?.isVeg !== undefined
            ? product.isVeg
            : true;
        setIsVeg(
          vegVal === true ||
            vegVal === "true" ||
            vegVal === "Y" ||
            vegVal === "Yes" ||
            vegVal === 1
        );

        setProductType(data.productType || product?.productType || "FOOD");
        setImageLink(data.imageLink || product?.imageLink || "");
        setPhotos(data.photos || product?.photos || "");
        setThumbnail(data.thumbnail || product?.thumbnail || "");

        // Process timings into per-day schedule
        const rawTimings =
          data.timings ||
          data.productTimings ||
          data.productAvailableTimings ||
          product?.timings ||
          product?.productTimings ||
          [];

        if (Array.isArray(rawTimings) && rawTimings.length > 0) {
          const updated = {
            1: createDayTiming(false),
            2: createDayTiming(false),
            3: createDayTiming(false),
            4: createDayTiming(false),
            5: createDayTiming(false),
            6: createDayTiming(false),
            7: createDayTiming(false),
          };
          rawTimings.forEach((t) => {
            const dId = Number(t.dayOfWeekId || t.dayId || t.day || t.dayOfWeek);
            if (dId >= 1 && dId <= 7) {
              updated[dId].enabled = true;
              updated[dId].timeSlots.push(
                createTimeSlot(
                  t.startTime ? String(t.startTime).substring(0, 5) : "09:00",
                  t.endTime ? String(t.endTime).substring(0, 5) : "22:00",
                  t.productAvailableTimingId || t.id || null
                )
              );
            }
          });
          Object.values(updated).forEach((dayTiming) => {
            if (dayTiming.timeSlots.length > 1 && !dayTiming.timeSlots[0].productAvailableTimingId) {
              dayTiming.timeSlots.shift();
            }
          });
          setDaySpecificTimings(updated);
        }

        // Process variant groups from complete details
        const rawGroups =
          data.variantGroups ||
          data.productVariantGroups ||
          data.productVariants ||
          product?.variantGroups ||
          product?.productVariantGroups ||
          [];

        let initialGroups = [];
        if (Array.isArray(rawGroups) && rawGroups.length > 0) {
          const groupMap = new Map();

          rawGroups.forEach((g) => {
            const gId = Number(g.productVariantGroupsId || g.groupId || g.id);
            if (!gId) return;

            if (!groupMap.has(gId)) {
              groupMap.set(gId, {
                productVariantGroupsId: gId,
                groupName: g.groupName || g.name || `Variant Group ${gId}`,
                options: [],
              });
            }

            const currentGroup = groupMap.get(gId);
            const rawOpts = g.options || g.productVariantOptions || g.values || [];

            if (Array.isArray(rawOpts)) {
              rawOpts.forEach((opt) => {
                const optId =
                  opt.productVariantOptionsId !== undefined && opt.productVariantOptionsId !== null
                    ? Number(opt.productVariantOptionsId)
                    : null;
                const valId =
                  opt.productVariantGroupValuesId !== undefined && opt.productVariantGroupValuesId !== null
                    ? Number(opt.productVariantGroupValuesId)
                    : null;
                const vName =
                  (opt.variantName || opt.optionName || opt.value || opt.name || "").trim();

                // Deduplicate within the group
                const alreadyExists = currentGroup.options.some((existing) => {
                  if (optId && existing.productVariantOptionsId && Number(existing.productVariantOptionsId) === optId) {
                    return true;
                  }
                  if (valId && existing.productVariantGroupValuesId && Number(existing.productVariantGroupValuesId) === valId) {
                    return true;
                  }
                  if (vName && existing.variantName && existing.variantName.toLowerCase().trim() === vName.toLowerCase().trim()) {
                    return true;
                  }
                  return false;
                });

                if (!alreadyExists) {
                  currentGroup.options.push({
                    productVariantOptionsId: optId && optId > 0 ? optId : null,
                    productVariantGroupValuesId: valId && valId > 0 ? valId : null,
                    variantName: vName || "Option",
                    priceType: opt.priceType || getPriceTypeForGroup(currentGroup.groupName),
                    variantPrice:
                      opt.variantPrice !== undefined && opt.variantPrice !== null
                        ? String(opt.variantPrice)
                        : "0",
                  });
                }
              });
            }
          });

          initialGroups = Array.from(groupMap.values());
        }

        // Only fallback to getProductVariantOptions if initialGroups is empty
        if (initialGroups.length === 0) {
          try {
            const optRes = await getProductVariantOptions(productId);
            const optList = optRes?.data?.data || optRes?.data || optRes || [];
            if (Array.isArray(optList) && optList.length > 0) {
              const groupedMap = new Map();

              optList.forEach((opt) => {
                const gId = Number(opt.productVariantGroupsId || opt.groupId || 1);
                const gName = opt.groupName || opt.variantGroupName || `Variant Group ${gId}`;

                if (!groupedMap.has(gId)) {
                  groupedMap.set(gId, {
                    productVariantGroupsId: gId,
                    groupName: gName,
                    options: [],
                  });
                }

                const currentGroup = groupedMap.get(gId);
                const optId =
                  opt.productVariantOptionsId !== undefined && opt.productVariantOptionsId !== null
                    ? Number(opt.productVariantOptionsId)
                    : null;
                const valId =
                  opt.productVariantGroupValuesId !== undefined && opt.productVariantGroupValuesId !== null
                    ? Number(opt.productVariantGroupValuesId)
                    : null;
                const vName = (opt.variantName || opt.value || opt.name || "").trim();

                const alreadyExists = currentGroup.options.some((existing) => {
                  if (optId && existing.productVariantOptionsId && Number(existing.productVariantOptionsId) === optId) {
                    return true;
                  }
                  if (valId && existing.productVariantGroupValuesId && Number(existing.productVariantGroupValuesId) === valId) {
                    return true;
                  }
                  if (vName && existing.variantName && existing.variantName.toLowerCase().trim() === vName.toLowerCase().trim()) {
                    return true;
                  }
                  return false;
                });

                if (!alreadyExists) {
                  currentGroup.options.push({
                    productVariantOptionsId: optId && optId > 0 ? optId : null,
                    productVariantGroupValuesId: valId && valId > 0 ? valId : null,
                    variantName: vName || "Option",
                    priceType: opt.priceType || getPriceTypeForGroup(gName),
                    variantPrice: String(opt.variantPrice ?? "0"),
                  });
                }
              });

              initialGroups = Array.from(groupedMap.values());
            }
          } catch (optErr) {
            console.warn("[EditOutletProduct] getProductVariantOptions fallback warning:", optErr);
          }
        }

        // Load available variant groups master list using GET /api/fm/product-variant-groups
        let vgList = [];
        try {
          const vgRes = await getAllVariantGroups();
          const rawVgList = vgRes.data?.data || vgRes.data || [];
          const seenGroupIds = new Set();
          vgList = (Array.isArray(rawVgList) ? rawVgList : []).filter((g) => {
            const id = Number(g.productVariantGroupsId || g.id || g.groupId);
            if (!id || seenGroupIds.has(id)) return false;
            seenGroupIds.add(id);
            return true;
          });
          setAvailableGroups(vgList);
        } catch (vgErr) {
          console.warn("Could not load variant groups master list:", vgErr);
        }

        // Preload values for all initial groups and available groups so dropdowns are immediately ready
        const allGroupsToPreload = [...initialGroups, ...vgList];
        const cacheMap = {};
        await Promise.all(
          allGroupsToPreload.map(async (g) => {
            const gId = Number(g.productVariantGroupsId || g.id || g.groupId);
            if (gId && !cacheMap[gId]) {
              try {
                const valRes = await getVariantGroupValues(gId);
                const data = valRes.data?.data || valRes.data || [];
                cacheMap[gId] = Array.isArray(data) ? data : [];
              } catch (e) {
                console.warn(`[EditOutletProduct] Failed to load values for group ${gId}:`, e);
              }
            }
          })
        );
        setGroupValuesCache((prev) => ({ ...prev, ...cacheMap }));

        // Enrich option names in initialGroups with the cached master option values
        initialGroups.forEach((g) => {
          const vals = cacheMap[g.productVariantGroupsId] || [];
          g.options.forEach((opt) => {
            if (opt.productVariantGroupValuesId) {
              const matchedVal = vals.find(
                (v) =>
                  Number(v.productVariantGroupValuesId || v.id || v.valueId) ===
                  Number(opt.productVariantGroupValuesId)
              );
              if (matchedVal && (matchedVal.value || matchedVal.variantName)) {
                opt.variantName = matchedVal.value || matchedVal.variantName;
              }
            }
          });
        });

        setVariantGroups(initialGroups);
      } catch (err) {
        console.error("Error loading product detail:", err);
        setErrorMessage(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to load product details."
        );
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, [productId]);

  // Timings Handlers
  const handleDayToggle = (dayId) => {
    setDaySpecificTimings((prev) => ({
      ...prev,
      [dayId]: {
        ...prev[dayId],
        enabled: !prev[dayId]?.enabled,
      },
    }));
  };
  const toggleDayEnabled = handleDayToggle;

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

  const handleApplyBulkTimeToAll = () => {
    setDaySpecificTimings((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((dayId) => {
        if (updated[dayId].enabled) {
          updated[dayId] = {
            ...updated[dayId],
            timeSlots: [createTimeSlot(bulkStartTime, bulkEndTime)],
          };
        }
      });
      return updated;
    });
  };

  const handleApplyPreset = (presetType) => {
    if (presetType === "ALL_DAYS") {
      setDaySpecificTimings((prev) => {
        const updated = {};
        for (let i = 1; i <= 7; i++) {
          updated[i] = {
            ...prev[i],
            enabled: true,
            timeSlots: [createTimeSlot()],
          };
        }
        return updated;
      });
      setBulkStartTime("09:00");
      setBulkEndTime("22:00");
    } else if (presetType === "FULL_DAY") {
      setDaySpecificTimings((prev) => {
        const updated = {};
        for (let i = 1; i <= 7; i++) {
          updated[i] = {
            ...prev[i],
            enabled: true,
            timeSlots: [createTimeSlot("00:00", "23:59")],
          };
        }
        return updated;
      });
      setBulkStartTime("00:00");
      setBulkEndTime("23:59");
    } else if (presetType === "WEEKDAYS") {
      setDaySpecificTimings((prev) => {
        const updated = {};
        for (let i = 1; i <= 5; i++) {
          updated[i] = {
            ...prev[i],
            enabled: true,
            timeSlots: [createTimeSlot()],
          };
        }
        for (let i = 6; i <= 7; i++) {
          updated[i] = {
            ...prev[i],
            enabled: false,
          };
        }
        return updated;
      });
    } else if (presetType === "WEEKENDS") {
      setDaySpecificTimings((prev) => {
        const updated = {};
        for (let i = 1; i <= 5; i++) {
          updated[i] = {
            ...prev[i],
            enabled: false,
          };
        }
        for (let i = 6; i <= 7; i++) {
          updated[i] = {
            ...prev[i],
            enabled: true,
            timeSlots: [createTimeSlot("10:00", "23:00")],
          };
        }
        return updated;
      });
    }
  };

  // Variant Group Management using GET /api/fm/product-variant-groups/{groupId}/values
  // Variant Group Management using GET /api/fm/product-variant-groups/{groupId}/values
  const handleAddGroupClick = async (groupIdToAdd) => {
    const targetGroupId = groupIdToAdd || selectedNewGroupId;
    if (!targetGroupId) return;
    const matchedGroup = availableGroups.find(
      (g) =>
        String(g.productVariantGroupsId || g.id || g.groupId) ===
        String(targetGroupId)
    );
    if (!matchedGroup) return;

    // Check if group is already present
    const gId = Number(
      matchedGroup.productVariantGroupsId || matchedGroup.id || matchedGroup.groupId
    );
    if (variantGroups.some((g) => g.productVariantGroupsId === gId)) {
      alert("This variant group has already been added.");
      return;
    }

    try {
      // Fetch options for this group to populate the dropdown
      let optionsList = groupValuesCache[gId];
      if (!optionsList) {
        const valRes = await getVariantGroupValues(gId);
        const data = valRes.data?.data || valRes.data || [];
        optionsList = Array.isArray(data) ? data : [];
        setGroupValuesCache((prev) => ({ ...prev, [gId]: optionsList }));
      }

      const calculatedPriceType = getPriceTypeForGroup(
        matchedGroup.groupName || matchedGroup.name
      );

      // Do not automatically show all options; initialize with empty options list
      // User will add options one by one using the "Add Option" button
      const newGroupObj = {
        productVariantGroupsId: gId,
        groupName: matchedGroup.groupName || matchedGroup.name || "Group",
        options: [],
      };

      setVariantGroups((prev) => [...prev, newGroupObj]);
      setNewOptionDrafts((prev) => ({
        ...prev,
        [gId]: {
          groupValueId: "",
          priceType: calculatedPriceType,
          variantPrice: "0",
        },
      }));
      setShowAddGroupModal(false);
      setSelectedNewGroupId("");
    } catch (err) {
      console.error("Failed to load options for group:", err);
      alert("Failed to load options for the selected group.");
    }
  };

  const handleRemoveGroup = (groupId) => {
    setVariantGroups((prev) =>
      prev.filter((g) => g.productVariantGroupsId !== groupId)
    );
  };

  const handleOptionPriceChange = (groupId, optIndex, price) => {
    setVariantGroups((prev) =>
      prev.map((g) => {
        if (g.productVariantGroupsId !== groupId) return g;
        const newOpts = [...g.options];
        newOpts[optIndex] = { ...newOpts[optIndex], variantPrice: price };
        return { ...g, options: newOpts };
      })
    );
  };

  const handleOptionValueChange = (groupId, optIndex, newGroupValueId) => {
    const availableValues = groupValuesCache[groupId] || [];
    const selectedVal = availableValues.find(
      (v) =>
        String(v.productVariantGroupValuesId || v.id || v.valueId) ===
        String(newGroupValueId)
    );
    if (!selectedVal) return;

    setVariantGroups((prev) =>
      prev.map((g) => {
        if (g.productVariantGroupsId !== groupId) return g;
        const newOpts = [...g.options];
        newOpts[optIndex] = {
          ...newOpts[optIndex],
          productVariantGroupValuesId: Number(newGroupValueId),
          variantName:
            selectedVal.value ||
            selectedVal.variantName ||
            selectedVal.name ||
            "Option",
        };
        return { ...g, options: newOpts };
      })
    );
  };

  const handleOptionPriceTypeChange = (groupId, optIndex, newPriceType) => {
    setVariantGroups((prev) =>
      prev.map((g) => {
        if (g.productVariantGroupsId !== groupId) return g;
        const newOpts = [...g.options];
        newOpts[optIndex] = { ...newOpts[optIndex], priceType: newPriceType };
        return { ...g, options: newOpts };
      })
    );
  };

  const handleDraftChange = (groupId, field, value) => {
    const group = variantGroups.find((g) => g.productVariantGroupsId === groupId);
    const defaultPriceType = getPriceTypeForGroup(group?.groupName);
    setNewOptionDrafts((prev) => {
      const currentDraft = prev[groupId] || {
        groupValueId: "",
        priceType: defaultPriceType,
        variantPrice: "0",
      };
      return {
        ...prev,
        [groupId]: {
          ...currentDraft,
          [field]: value,
        },
      };
    });
  };

  const handleAddOptionToGroup = (groupId) => {
    const group = variantGroups.find(
      (g) => g.productVariantGroupsId === groupId
    );
    const expectedPriceType = getPriceTypeForGroup(group?.groupName);
    const draft = newOptionDrafts[groupId] || {
      groupValueId: "",
      priceType: expectedPriceType,
      variantPrice: "0",
    };

    if (!draft.groupValueId) {
      alert("Please select a variant option from the dropdown.");
      return;
    }

    const availableValues = groupValuesCache[groupId] || [];
    const selectedVal = availableValues.find(
      (v) =>
        String(v.productVariantGroupValuesId || v.id || v.valueId) ===
        String(draft.groupValueId)
    );

    const valName =
      selectedVal?.value ||
      selectedVal?.variantName ||
      selectedVal?.name ||
      "Option";
    const valId = Number(draft.groupValueId);

    if (
      group?.options?.some(
        (opt) => Number(opt.productVariantGroupValuesId) === valId
      )
    ) {
      alert("This option has already been added to this group.");
      return;
    }

    const newOpt = {
      productVariantOptionsId: null, // Always null for new option
      productVariantGroupValuesId: valId,
      variantName: valName,
      priceType: draft.priceType || expectedPriceType,
      variantPrice: String(draft.variantPrice || "0"),
    };

    setVariantGroups((prev) =>
      prev.map((g) => {
        if (g.productVariantGroupsId !== groupId) return g;
        return { ...g, options: [...g.options, newOpt] };
      })
    );

    setNewOptionDrafts((prev) => ({
      ...prev,
      [groupId]: {
        groupValueId: "",
        priceType: expectedPriceType,
        variantPrice: "0",
      },
    }));
  };

  // Remove option from product using DELETE /api/fm/products/{productId}/variant-options/{optionId}
  const handleRemoveOption = async (groupId, optIndex) => {
    const group = variantGroups.find((g) => g.productVariantGroupsId === groupId);
    const targetOption = group?.options?.[optIndex];
    if (targetOption?.productVariantOptionsId && productId) {
      try {
        await deleteProductVariantOption(productId, targetOption.productVariantOptionsId);
        console.log(`[EditOutletProduct] Deleted option ${targetOption.productVariantOptionsId} via deleteProductVariantOption`);
      } catch (delErr) {
        console.warn("[EditOutletProduct] deleteProductVariantOption warning:", delErr);
      }
    }
    setVariantGroups((prev) =>
      prev.map((g) => {
        if (g.productVariantGroupsId !== groupId) return g;
        const newOpts = g.options.filter((_, i) => i !== optIndex);
        return { ...g, options: newOpts };
      })
    );
  };

  // 2. Save product updates
  const handleSave = async () => {
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
      setSuccessMessage("");

      // Timings array (different hours per day, preserving timing IDs)
      const timingsList = enabledDays.flatMap(([dayId, timing]) =>
        timing.timeSlots.map((slot) => ({
          ...(slot.productAvailableTimingId
            ? { productAvailableTimingId: Number(slot.productAvailableTimingId) }
            : {}),
          dayOfWeekId: Number(dayId),
          startTime: slot.startTime || "09:00",
          endTime: slot.endTime || "22:00",
        }))
      );

      // Variant groups array
      const formattedVariantGroups = variantGroups.map((g) => {
        const calculatedPriceType = getPriceTypeForGroup(g.groupName);
        return {
          productVariantGroupsId: Number(g.productVariantGroupsId),
          options: (g.options || []).map((opt) => {
            const optId =
              opt.productVariantOptionsId !== undefined &&
              opt.productVariantOptionsId !== null &&
              Number(opt.productVariantOptionsId) > 0
                ? Number(opt.productVariantOptionsId)
                : null;
            const valId = Number(
              opt.productVariantGroupValuesId || opt.valueId || opt.id
            );
            return {
              productVariantOptionsId: optId, // null for new options, valid ID for existing
              productVariantGroupValuesId: valId > 0 ? valId : null,
              priceType: opt.priceType || calculatedPriceType || "FIXED",
              variantPrice: Number(opt.variantPrice || 0),
            };
          }),
        };
      });

      const hasVariants = formattedVariantGroups.length > 0;

      let finalOutletCatId = Number(outletCategoryId);
      if (!finalOutletCatId || isNaN(finalOutletCatId) || finalOutletCatId <= 0) {
        finalOutletCatId = Number(
          product?.outletCategoryId ||
            product?.categoryId ||
            (outletCategories && outletCategories.length > 0
              ? outletCategories[0].outletCategoryId || outletCategories[0].id
              : 1)
        );
      }

      const payload = {
        productName: productName.trim(),
        outletCategoryId: finalOutletCatId,
        description: description.trim(),
        isVeg: Boolean(isVeg),
        hasProductVariants: hasVariants,
        merchantPrice: Number(merchantPrice),
        imageLink: imageLink || "",
        photos: photos || "",
        thumbnail: thumbnail || "",
        productType: productType || "FOOD",
        timings: timingsList,
        variantGroups: hasVariants ? formattedVariantGroups : [],
      };

      console.log(
        `[EditOutletProduct] Updating product ${productId} via PUT /api/fm/products/updateCategoryAndProductDetails/${productId}:`,
        payload
      );

      await updateCategoryAndProductDetails(productId, payload);

      setSuccessMessage("Product details updated successfully!");

      setTimeout(() => {
        if (onProductUpdated) {
          onProductUpdated();
        } else if (onClose) {
          onClose();
        }
      }, 700);
    } catch (err) {
      console.error("[EditOutletProduct] Update error:", err);
      setErrorMessage(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to update product details. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  // Prefetch group values for all variant groups
  useEffect(() => {
    variantGroups.forEach((g) => {
      const gId = g.productVariantGroupsId;
      if (gId && !groupValuesCache[gId]) {
        getVariantGroupValues(gId)
          .then((res) => {
            const list = res.data?.data || res.data || [];
            setGroupValuesCache((prev) => ({
              ...prev,
              [gId]: Array.isArray(list) ? list : [],
            }));
          })
          .catch((err) =>
            console.warn(`Could not load values for group ${gId}:`, err)
          );
      }
    });
  }, [variantGroups]);

  if (loading) {
    return (
      <div className="eop-fullpage">
        <div className="eop-loading-container">
          <div className="eop-loader" />
          <p>Loading product details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="eop-fullpage">
      {/* Sticky Header */}
      <div className="eop-fullpage-header">
        <div className="eop-fullpage-header-left">
          <button
            type="button"
            className="eop-back-btn"
            onClick={onClose}
            title="Back to Foods"
            disabled={saving}
          >
            <FiArrowLeft />
          </button>
          <div className="eop-fullpage-header-text">
            <h2>
              <FiEdit3 className="eop-header-icon" /> Edit Outlet Product
            </h2>
          </div>
        </div>

        <div className="eop-fullpage-header-actions">
          <button
            type="button"
            className="eop-btn-cancel"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="button"
            className="eop-btn-submit"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <FiLoader className="spin" /> Saving...
              </>
            ) : (
              <>
                <FiSave /> Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="eop-scroll-container">
        {errorMessage && (
          <div className="eop-error-banner">{errorMessage}</div>
        )}
        {successMessage && (
          <div className="eop-success-banner">
            <FiCheck style={{ marginRight: 8 }} /> {successMessage}
          </div>
        )}

        {/* CARD 1: PRODUCT DETAILS */}
        <div className="eop-card">
          <div className="eop-card-header">
            <div className="eop-card-header-left">
              <FiInfo className="eop-card-icon" />
              <div>
                <h3>Product Information</h3>
                <p>Basic details and classification of the item</p>
              </div>
            </div>
          </div>

          <div className="eop-card-body">
            <div className="eop-form-grid">
              {/* Product Name */}
              <div className="eop-form-group span-full">
                <label className="eop-label">Product Name</label>
                <input
                  type="text"
                  className="eop-input"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="Enter product name"
                  disabled={saving}
                />
              </div>

              {/* Category */}
              <div className="eop-form-group">
                <label className="eop-label">Category</label>
                <input
                  type="text"
                  className="eop-input eop-input-readonly"
                  value={categoryName || "Food Category"}
                  readOnly
                  disabled
                />
              </div>

              {/* Food Classification (Read-only) */}
              <div className="eop-form-group">
                <label className="eop-label">Food Type</label>
                <div className="eop-readonly-type-badge-wrap">
                  <div className={`eop-readonly-type-badge ${isVeg ? "is-veg" : "is-nonveg"}`}>
                    <span className={`eop-veg-dot ${isVeg ? "veg" : "nonveg"}`} />
                    <span className="eop-type-label">
                      {isVeg ? "Vegetarian (Veg)" : "Non-Vegetarian (Non-Veg)"}
                    </span>
                  </div>
                  {productType && (
                    <span className="eop-product-type-pill">{productType}</span>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="eop-form-group span-full">
                <label className="eop-label">Description</label>
                <textarea
                  className="eop-textarea"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter product description"
                  disabled={saving}
                />
              </div>
            </div>
          </div>
        </div>

        {/* CARD 2: PRICING */}
        <div className="eop-card">
          <div className="eop-card-header">
            <div className="eop-card-header-left">
              <FiDollarSign className="eop-card-icon" />
              <div>
                <h3>Pricing</h3>
                <p>Set the selling price for this outlet</p>
              </div>
            </div>
          </div>

          <div className="eop-card-body">
            <div className="eop-form-group" style={{ maxWidth: 320 }}>
              <label className="eop-label">Merchant Price (₹)</label>
              <div className="eop-price-input-wrap">
                <span className="eop-currency-symbol">₹</span>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  className="eop-input eop-price-input"
                  placeholder="0.00"
                  value={merchantPrice}
                  onChange={(e) => setMerchantPrice(e.target.value)}
                  disabled={saving}
                />
              </div>
            </div>
          </div>
        </div>

        {/* CARD 3: AVAILABILITY TIMINGS (DIFFERENT HOURS FOR DIFFERENT DAYS) */}
        <div className="eop-card">
          <div className="eop-card-header">
            <div className="eop-card-header-left">
              <FiClock className="eop-card-icon" />
              <div>
                <h3>Availability Schedule (Days & Hours)</h3>
                <p>Configure distinct opening and closing hours for each day of the week</p>
              </div>
            </div>
          </div>

          <div className="eop-card-body">
            {/* Quick Presets */}
            <div className="eop-timings-presets">
              <button
                type="button"
                className="eop-preset-btn"
                onClick={() => handleApplyPreset("ALL_DAYS")}
                disabled={saving}
              >
                All Days (09:00 - 22:00)
              </button>
              <button
                type="button"
                className="eop-preset-btn"
                onClick={() => handleApplyPreset("FULL_DAY")}
                disabled={saving}
              >
                24 Hours (00:00 - 23:59)
              </button>
              <button
                type="button"
                className="eop-preset-btn"
                onClick={() => handleApplyPreset("WEEKDAYS")}
                disabled={saving}
              >
                Mon - Fri Only
              </button>
              <button
                type="button"
                className="eop-preset-btn"
                onClick={() => handleApplyPreset("WEEKENDS")}
                disabled={saving}
              >
                Sat - Sun Only
              </button>
            </div>

            {/* Bulk Timing Bar */}
            <div className="eop-bulk-time-bar">
              <span className="eop-bulk-title">Bulk Apply Hours:</span>
              <div className="eop-bulk-inputs">
                <input
                  type="time"
                  className="eop-time-input-sm"
                  value={bulkStartTime}
                  onChange={(e) => setBulkStartTime(e.target.value)}
                  disabled={saving}
                />
                <span className="eop-time-sep">to</span>
                <input
                  type="time"
                  className="eop-time-input-sm"
                  value={bulkEndTime}
                  onChange={(e) => setBulkEndTime(e.target.value)}
                  disabled={saving}
                />
                <button
                  type="button"
                  className="eop-btn-bulk-apply"
                  onClick={handleApplyBulkTimeToAll}
                  disabled={saving}
                >
                  Apply to Selected Days
                </button>
              </div>
            </div>

            {/* Per-Day Timings Schedule Table */}
            <div className="eop-per-day-schedule">
              {DAYS_OF_WEEK.map((day) => {
                const isDayEnabled = daySpecificTimings[day.id]?.enabled || false;
                const timeSlots =
                  daySpecificTimings[day.id]?.timeSlots || [createTimeSlot()];

                return (
                  <div
                    key={day.id}
                    className={`eop-day-schedule-row ${isDayEnabled ? "active" : "disabled"}`}
                  >
                    <div className="eop-day-toggle-cell">
                      <label className="eop-day-checkbox-label">
                        <input
                          type="checkbox"
                          checked={isDayEnabled}
                          onChange={() => handleDayToggle(day.id)}
                          disabled={saving}
                        />
                        <span className="eop-day-name">{day.name}</span>
                        <span className="eop-day-short-tag">({day.short})</span>
                      </label>
                    </div>

                    <div className="eop-day-hours-cell">
                      {isDayEnabled ? (
                        <div className="eop-day-time-slots">
                          {timeSlots.map((slot, slotIndex) => (
                            <div className="eop-day-time-inputs" key={`${day.id}-${slotIndex}`}>
                              <div className="eop-time-field">
                                <span className="eop-time-sublabel">Opens</span>
                                <input
                                  type="time"
                                  className="eop-time-input"
                                  value={slot.startTime}
                                  onChange={(e) =>
                                    handleDayTimeChange(day.id, `${slotIndex}.startTime`, e.target.value)
                                  }
                                  disabled={saving}
                                />
                              </div>
                              <span className="eop-time-range-divider">—</span>
                              <div className="eop-time-field">
                                <span className="eop-time-sublabel">Closes</span>
                                <input
                                  type="time"
                                  className="eop-time-input"
                                  value={slot.endTime}
                                  onChange={(e) =>
                                    handleDayTimeChange(day.id, `${slotIndex}.endTime`, e.target.value)
                                  }
                                  disabled={saving}
                                />
                              </div>
                              {timeSlots.length > 1 && (
                                <button
                                  type="button"
                                  className="eop-remove-time-slot"
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
                                  className="eop-add-time-slot"
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
                        <div className="eop-day-closed-msg">
                          <span className="eop-day-off-pill">Closed / Off</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* CARD 4: PRODUCT VARIANTS */}
        <div className="eop-card">
          <div className="eop-card-header">
            <div className="eop-card-header-left">
              <FiLayers className="eop-card-icon" />
              <div>
                <h3>Product Variants & Groups</h3>
              </div>
            </div>

            {/* Quick Add Variant Group Dropdown */}
            <div className="eop-variants-header-actions">
              <div className="eop-group-select-inline">
                <select
                  className="eop-group-dropdown"
                  value={selectedNewGroupId}
                  onChange={(e) => setSelectedNewGroupId(e.target.value)}
                  disabled={saving || availableGroups.length === 0}
                >
                  <option value="">-- Choose Variant Group to Add --</option>
                  {availableGroups.map((g) => {
                    const gId = g.productVariantGroupsId || g.id || g.groupId;
                    const isAdded = variantGroups.some(
                      (vg) => Number(vg.productVariantGroupsId) === Number(gId)
                    );
                    return (
                      <option key={gId} value={gId} disabled={isAdded}>
                        {g.groupName || g.name} {isAdded ? "(Already Added)" : ""}
                      </option>
                    );
                  })}
                </select>
                <button
                  type="button"
                  className="eop-btn-add-group"
                  onClick={() => handleAddGroupClick(selectedNewGroupId)}
                  disabled={saving || !selectedNewGroupId}
                >
                  <FiPlus /> Add Group
                </button>
              </div>
            </div>
          </div>

          <div className="eop-card-body">
            {variantGroups.length === 0 ? (
              <div className="eop-no-variants">
                <FiLayers style={{ fontSize: "2rem", color: "#cbd5e1", marginBottom: 8 }} />
                <p style={{ fontWeight: 600, color: "#475569", margin: "4px 0" }}>
                  No variant groups configured for this item.
                </p>
                <p style={{ fontSize: "0.82rem", color: "#94a3b8", margin: 0 }}>
                  Select a variant group from the dropdown selector above to add sizes, portions, or add-ons.
                </p>
              </div>
            ) : (
              <div className="eop-variant-groups-list">
                {variantGroups.map((group) => {
                  const gId = Number(group.productVariantGroupsId);
                  const availableOptions = groupValuesCache[gId] || [];
                  const defaultPriceType = getPriceTypeForGroup(group.groupName);
                  const draft = newOptionDrafts[gId] || {
                    groupValueId: "",
                    priceType: defaultPriceType,
                    variantPrice: "0",
                  };

                  return (
                    <div
                      key={gId}
                      className="eop-variant-group-card"
                    >
                      <div className="eop-vg-top">
                        <div className="eop-vg-title">
                          <FiTag color="#ff5722" />
                          <span>{group.groupName}</span>
                          <span className="eop-vg-type-badge">
                            {getPriceTypeForGroup(group.groupName)}
                          </span>
                        </div>

                        <button
                          type="button"
                          className="eop-btn-remove-group"
                          onClick={() => handleRemoveGroup(gId)}
                          title="Remove Variant Group"
                        >
                          <FiTrash2 /> Remove Group
                        </button>
                      </div>

                      {/* Options Table */}
                      {group.options && group.options.length > 0 ? (
                        <div className="eop-table-wrapper">
                          <table className="eop-options-table">
                            <thead>
                              <tr>
                                <th style={{ minWidth: 220 }}>Variant Option</th>
                                <th style={{ minWidth: 160 }}>Price Type</th>
                                <th style={{ minWidth: 130 }}>Variant Price (₹)</th>
                                <th style={{ width: 44, textAlign: "center" }}></th>
                              </tr>
                            </thead>
                            <tbody>
                              {group.options.map((opt, optIdx) => (
                                <tr key={optIdx}>
                                  <td>
                                    {availableOptions.length > 0 ? (
                                      <select
                                        className="eop-table-dropdown"
                                        value={
                                          opt.productVariantGroupValuesId || ""
                                        }
                                        onChange={(e) =>
                                          handleOptionValueChange(
                                            gId,
                                            optIdx,
                                            e.target.value
                                          )
                                        }
                                        disabled={saving}
                                      >
                                        <option value="">
                                          {opt.variantName || "-- Select Option --"}
                                        </option>
                                        {availableOptions.map((v) => {
                                          const valId =
                                            v.productVariantGroupValuesId ||
                                            v.id ||
                                            v.valueId;
                                          const valText =
                                            v.value ||
                                            v.variantName ||
                                            v.name;
                                          return (
                                            <option key={valId} value={valId}>
                                              {valText}
                                            </option>
                                          );
                                        })}
                                      </select>
                                    ) : (
                                      <span className="eop-option-name-tag">
                                        {opt.variantName}
                                      </span>
                                    )}
                                  </td>
                                  <td>
                                    <span className={`eop-readonly-pt-badge ${defaultPriceType === "ADD" ? "add" : "main"}`}>
                                      {defaultPriceType}
                                    </span>
                                  </td>
                                  <td>
                                    <div className="eop-table-price-wrap">
                                      <span className="eop-table-rupee">₹</span>
                                      <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        className="eop-option-price-input"
                                        value={opt.variantPrice}
                                        onChange={(e) =>
                                          handleOptionPriceChange(
                                            gId,
                                            optIdx,
                                            e.target.value
                                          )
                                        }
                                        disabled={saving}
                                        placeholder="0.00"
                                      />
                                    </div>
                                  </td>
                                  <td style={{ textAlign: "center" }}>
                                    <button
                                      type="button"
                                      className="eop-btn-remove-opt"
                                      onClick={() =>
                                        handleRemoveOption(gId, optIdx)
                                      }
                                      title="Remove option"
                                    >
                                      <FiTrash2 />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="eop-no-opts-msg">
                          No options added to this group yet. Select an option from the dropdown below to add one.
                        </p>
                      )}

                      {/* Add Option Toolbar with Dropdowns */}
                      <div className="eop-add-opt-bar">
                        <div className="eop-add-opt-field option-select">
                          <label className="eop-add-opt-label">Option</label>
                          <select
                            className="eop-add-opt-select"
                            value={draft.groupValueId || ""}
                            onChange={(e) =>
                              handleDraftChange(gId, "groupValueId", e.target.value)
                            }
                            disabled={saving || availableOptions.length === 0}
                          >
                            <option value="">
                              {availableOptions.length === 0
                                ? "-- Loading Options... --"
                                : "-- Select Option --"}
                            </option>
                            {availableOptions.map((v) => {
                              const valId =
                                v.productVariantGroupValuesId ||
                                v.id ||
                                v.valueId;
                              const valText =
                                v.value || v.variantName || v.name;
                              const isAlreadyAdded = group.options?.some(
                                (o) =>
                                  Number(o.productVariantGroupValuesId) ===
                                  Number(valId)
                              );
                              return (
                                <option
                                  key={valId}
                                  value={valId}
                                  disabled={isAlreadyAdded}
                                >
                                  {valText} {isAlreadyAdded ? "(Added)" : ""}
                                </option>
                              );
                            })}
                          </select>
                        </div>

                        <div className="eop-add-opt-field pricetype-select">
                          <label className="eop-add-opt-label">Price Type</label>
                          <input
                            type="text"
                            className="eop-add-opt-select eop-readonly-pt-field"
                            value={defaultPriceType}
                            readOnly
                            disabled
                          />
                        </div>

                        <div className="eop-add-opt-field price-input">
                          <label className="eop-add-opt-label">Price (₹)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="eop-add-opt-price-input"
                            value={draft.variantPrice}
                            onChange={(e) =>
                              handleDraftChange(gId, "variantPrice", e.target.value)
                            }
                            disabled={saving}
                            placeholder="0.00"
                          />
                        </div>

                        <button
                          type="button"
                          className="eop-btn-add-opt"
                          onClick={() => handleAddOptionToGroup(gId)}
                          disabled={saving || !draft.groupValueId}
                        >
                          <FiPlus /> Add Option
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Variant Group Modal */}
      {showAddGroupModal && (
        <div className="eop-modal-backdrop">
          <div className="eop-modal-card">
            <div className="eop-modal-header">
              <h3>Add Variant Group</h3>
              <button
                type="button"
                className="eop-modal-close-btn"
                onClick={() => setShowAddGroupModal(false)}
              >
                <FiX />
              </button>
            </div>

            <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: 16 }}>
              Select a variant group from catalog to add to this product:
            </p>

            <select
              className="eop-input"
              style={{ width: "100%", marginBottom: "20px" }}
              value={selectedNewGroupId}
              onChange={(e) => setSelectedNewGroupId(e.target.value)}
            >
              <option value="">-- Choose Variant Group --</option>
              {availableGroups.map((g) => (
                <option
                  key={g.productVariantGroupsId || g.id || g.groupId}
                  value={g.productVariantGroupsId || g.id || g.groupId}
                >
                  {g.groupName || g.name}
                </option>
              ))}
            </select>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                className="eop-btn-cancel"
                onClick={() => setShowAddGroupModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="eop-btn-submit"
                onClick={() => handleAddGroupClick(selectedNewGroupId)}
                disabled={!selectedNewGroupId}
              >
                Add Group
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EditOutletProduct;
