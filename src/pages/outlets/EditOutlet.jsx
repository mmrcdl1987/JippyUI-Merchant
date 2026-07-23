import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getOutletById,
  updateOutlet,
  getStates,
  getCities,
  getAreas,
} from "../../services/outletService";
import "../../styles/EditOutlet.css";

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const EditOutlet = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [areas, setAreas] = useState([]);

  // Main Form Data State
  const [formData, setFormData] = useState({
    outletName: "",
    outletId: "",
    outletEmail: "",
    outletPhone: "",
    alternateOutletPhone: "",
    cuisineType: "",
    favourite: false,
    available: true,

    // Address
    buildingNo: "",
    streetName: "",
    landmark: "",
    stateId: "",
    cityId: "",
    areaId: "",
    latitude: "",
    longitude: "",

    // Bank Details
    accountHolderName: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",

    // Timings
    timings: daysOfWeek.map((day) => ({
      day,
      isOpen: true,
      startTime: "09:00",
      endTime: "22:00",
    })),

    // Categories & Nested Products
    categories: [
      {
        categoryId: "cat_1",
        categoryName: "Chicken",
        isCategoryAvailable: true,
        expanded: true,
        products: [
          {
            productId: "prod_1",
            productName: "Chicken Grill",
            price: 250,
            description: "Juicy grilled chicken",
            isVeg: false,
            isAvailable: true,
            variants: [
              { name: "Small", price: 120 },
              { name: "Medium", price: 180 },
              { name: "Large", price: 250 },
            ],
            productTimings: daysOfWeek.map((day) => ({
              day,
              startTime: "09:00",
              endTime: "18:00",
            })),
          },
        ],
      },
    ],
  });

  useEffect(() => {
    fetchInitialData();
  }, [id]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);

      // Fetch states list
      const statesRes = await getStates();
      setStates(statesRes || []);

      // Fetch outlet details
      const response = await getOutletById(id);
      const outlet = response.data?.data || response.data || response;

      setFormData((prev) => ({
        ...prev,
        ...outlet,
        outletId: outlet.outletId || id,
        // Pre-fill building / road mappings if backend returns buildingNumber / road
        buildingNo: outlet.buildingNumber || outlet.buildingNo || "",
        streetName: outlet.road || outlet.streetName || "",
      }));

      // Cascade fetch cities and areas if present
      if (outlet.stateId) {
        const citiesRes = await getCities(outlet.stateId);
        setCities(citiesRes || []);
      }
      if (outlet.cityId) {
        const areasRes = await getAreas(outlet.cityId);
        setAreas(areasRes || []);
      }
    } catch (error) {
      console.error("Error loading outlet data:", error);
    } finally {
      setLoading(false);
    }
  };

  // General Top-Level Field Handler
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Location Dropdown Handlers
  const handleStateChange = async (e) => {
    const stateId = e.target.value;
    setFormData((prev) => ({ ...prev, stateId, cityId: "", areaId: "" }));
    setCities([]);
    setAreas([]);
    if (stateId) {
      const res = await getCities(stateId);
      setCities(res || []);
    }
  };

  const handleCityChange = async (e) => {
    const cityId = e.target.value;
    setFormData((prev) => ({ ...prev, cityId, areaId: "" }));
    setAreas([]);
    if (cityId) {
      const res = await getAreas(cityId);
      setAreas(res || []);
    }
  };

  // Outlet Timings Handler
  const handleTimingChange = (index, field, value) => {
    const updatedTimings = [...formData.timings];
    updatedTimings[index][field] = value;
    setFormData((prev) => ({ ...prev, timings: updatedTimings }));
  };

  // Category Handlers
  const handleCategoryChange = (catIndex, field, value) => {
    const updatedCategories = [...formData.categories];
    updatedCategories[catIndex][field] = value;
    setFormData((prev) => ({ ...prev, categories: updatedCategories }));
  };

  const toggleCategoryExpand = (catIndex) => {
    const updatedCategories = [...formData.categories];
    updatedCategories[catIndex].expanded = !updatedCategories[catIndex].expanded;
    setFormData((prev) => ({ ...prev, categories: updatedCategories }));
  };

  // Product Field Handlers
  const handleProductChange = (catIndex, prodIndex, field, value) => {
    const updatedCategories = [...formData.categories];
    updatedCategories[catIndex].products[prodIndex][field] = value;
    setFormData((prev) => ({ ...prev, categories: updatedCategories }));
  };

  // Product Variant Price Handler
  const handleVariantChange = (catIndex, prodIndex, variantIndex, value) => {
    const updatedCategories = [...formData.categories];
    updatedCategories[catIndex].products[prodIndex].variants[variantIndex].price = value;
    setFormData((prev) => ({ ...prev, categories: updatedCategories }));
  };

  // Product Timing Handler
  const handleProductTimingChange = (catIndex, prodIndex, timingIndex, field, value) => {
    const updatedCategories = [...formData.categories];
    updatedCategories[catIndex].products[prodIndex].productTimings[timingIndex][field] = value;
    setFormData((prev) => ({ ...prev, categories: updatedCategories }));
  };

  // Submit Handler mapped to API requirements
const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const payload = {
      outletId: Number(id),

      outletName: formData.outletName,
      outletEmail: formData.outletEmail,
      outletPhone: formData.outletPhone,
      alternateOutletPhone: formData.alternateOutletPhone,
      cuisineType: formData.cuisineType,

      latitude: Number(formData.latitude),
      longitude: Number(formData.longitude),

      accountNumber: formData.accountNumber,
      ifscCode: formData.ifscCode,
      bankName: formData.bankName,
      accountHolderName: formData.accountHolderName,

      buildingNumber: formData.buildingNo,
      road: formData.streetName,
      landmark: formData.landmark,

      stateId: Number(formData.stateId),
      stateName:
        states.find((s) => s.stateId === Number(formData.stateId))
          ?.stateName || "",

      cityId: Number(formData.cityId),
      cityName:
        cities.find((c) => c.cityId === Number(formData.cityId))
          ?.cityName || "",

      areaId: Number(formData.areaId),
      areaName:
        areas.find((a) => a.areaId === Number(formData.areaId))
          ?.areaName || "",

      isFavourite: formData.favourite,
      isAvailable: formData.available,

      outletTimings: formData.timings.map((item) => ({
        day: item.day,
        isOpen: item.isOpen,

        openingTime: {
          hour: Number(item.startTime.split(":")[0]),
          minute: Number(item.startTime.split(":")[1]),
          second: 0,
          nano: 0,
        },

        closingTime: {
          hour: Number(item.endTime.split(":")[0]),
          minute: Number(item.endTime.split(":")[1]),
          second: 0,
          nano: 0,
        },
      })),

      categories: formData.categories.map((cat) => ({
        categoryId: cat.categoryId,
        categoryName: cat.categoryName,
        isAvailable: cat.isCategoryAvailable,

        products: cat.products.map((prod) => ({
          productId: prod.productId,
          productName: prod.productName,
          description: prod.description,

          merchantPrice: Number(prod.price),
          price: Number(prod.price),

          isVeg: prod.isVeg,
          isAvailable: prod.isAvailable,
          hasProductVariants: !!prod.variants?.length,
          isProductFavourite: false,

          variants:
            prod.variants?.map((v) => ({
              variantId: v.variantId,
              variantName: v.variantName || v.name,
              merchantPrice: Number(v.price),
              price: Number(v.price),
            })) || [],

          productTimings:
            prod.productTimings?.map((t) => ({
              day: t.day,

              startTime: {
                hour: Number(t.startTime.split(":")[0]),
                minute: Number(t.startTime.split(":")[1]),
                second: 0,
                nano: 0,
              },

              endTime: {
                hour: Number(t.endTime.split(":")[0]),
                minute: Number(t.endTime.split(":")[1]),
                second: 0,
                nano: 0,
              },
            })) || [],
        })),
      })),
    };

    console.log("Update Payload", payload);

    await updateOutlet(payload);

    alert("Outlet Updated Successfully");

    navigate(`/outlets/view/${id}`);
  } catch (error) {
    console.error(error);
    alert("Failed to update outlet");
  }
};

  if (loading) return <div className="loading-spinner">Loading Outlet Details...</div>;

  return (
    <div className="edit-outlet-container">
      {/* Top Header */}
      <div className="header-bar">
        <button className="back-btn" type="button" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h2>Edit Outlet</h2>
      </div>

      <form onSubmit={handleSubmit}>
        {/* --- 1. Outlet Information --- */}
        <div className="form-section">
          <h3>Outlet Information</h3>
          <hr />
          <div className="form-grid">
            <div className="form-group">
              <label>Outlet Name</label>
              <input
                type="text"
                name="outletName"
                value={formData.outletName || ""}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Outlet ID</label>
              <input type="text" value={formData.outletId || ""} disabled className="read-only" />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="outletEmail"
                value={formData.outletEmail || ""}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                name="outletPhone"
                value={formData.outletPhone || ""}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Alternate Phone</label>
              <input
                type="tel"
                name="alternateOutletPhone"
                value={formData.alternateOutletPhone || ""}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Cuisine</label>
              <select name="cuisineType" value={formData.cuisineType || ""} onChange={handleChange}>
                <option value="">Select Cuisine</option>
                <option value="Italian">Italian</option>
                <option value="Indian">Indian</option>
                <option value="Chinese">Chinese</option>
                <option value="Fast Food">Fast Food</option>
              </select>
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="favourite"
                  checked={!!formData.favourite}
                  onChange={handleChange}
                />
                Favourite
              </label>
              <label>
                <input
                  type="checkbox"
                  name="available"
                  checked={!!formData.available}
                  onChange={handleChange}
                />
                Available
              </label>
            </div>
          </div>
        </div>

        {/* --- 2. Address Details --- */}
        <div className="form-section">
          <h3>Address Details</h3>
          <hr />
          <div className="form-grid">
            <div className="form-group">
              <label>Building Number</label>
              <input
                type="text"
                name="buildingNo"
                value={formData.buildingNo || ""}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Road / Street Name</label>
              <input
                type="text"
                name="streetName"
                value={formData.streetName || ""}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Landmark</label>
              <input
                type="text"
                name="landmark"
                value={formData.landmark || ""}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>State</label>
              <select value={formData.stateId || ""} onChange={handleStateChange}>
                <option value="">Select State</option>
                {states.map((st) => (
                  <option key={st.stateId} value={st.stateId}>
                    {st.stateName}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>City</label>
              <select value={formData.cityId || ""} onChange={handleCityChange}>
                <option value="">Select City</option>
                {cities.map((ct) => (
                  <option key={ct.cityId} value={ct.cityId}>
                    {ct.cityName}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Area</label>
              <select name="areaId" value={formData.areaId || ""} onChange={handleChange}>
                <option value="">Select Area</option>
                {areas.map((ar) => (
                  <option key={ar.areaId} value={ar.areaId}>
                    {ar.areaName}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Latitude</label>
              <input
                type="text"
                name="latitude"
                value={formData.latitude || ""}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Longitude</label>
              <input
                type="text"
                name="longitude"
                value={formData.longitude || ""}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* --- 3. Bank Details --- */}
        <div className="form-section">
          <h3>Bank Details</h3>
          <hr />
          <div className="form-grid">
            <div className="form-group">
              <label>Account Holder</label>
              <input
                type="text"
                name="accountHolderName"
                value={formData.accountHolderName || ""}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Bank Name</label>
              <input
                type="text"
                name="bankName"
                value={formData.bankName || ""}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Account Number</label>
              <input
                type="text"
                name="accountNumber"
                value={formData.accountNumber || ""}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>IFSC Code</label>
              <input
                type="text"
                name="ifscCode"
                value={formData.ifscCode || ""}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* --- 4. Outlet Timings --- */}
        <div className="form-section">
          <h3>Outlet Timings</h3>
          <hr />
          <table className="timings-table">
            <thead>
              <tr>
                <th>Day</th>
                <th>Open</th>
                <th>Start Time</th>
                <th>End Time</th>
              </tr>
            </thead>
            <tbody>
              {formData.timings.map((item, index) => (
                <tr key={item.day}>
                  <td>{item.day}</td>
                  <td>
                    <input
                      type="checkbox"
                      checked={item.isOpen}
                      onChange={(e) => handleTimingChange(index, "isOpen", e.target.checked)}
                    />
                  </td>
                  <td>
                    <input
                      type="time"
                      value={item.startTime}
                      disabled={!item.isOpen}
                      onChange={(e) => handleTimingChange(index, "startTime", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="time"
                      value={item.endTime}
                      disabled={!item.isOpen}
                      onChange={(e) => handleTimingChange(index, "endTime", e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* --- 5. Categories & Nested Products --- */}
        <div className="form-section">
          <h3>Categories</h3>
          <hr />
          {formData.categories.map((category, catIdx) => (
            <div key={category.categoryId || catIdx} className="category-block">
              <div className="category-header">
                <button
                  type="button"
                  className="accordion-toggle"
                  onClick={() => toggleCategoryExpand(catIdx)}
                >
                  {category.expanded ? "▼" : "►"} {category.categoryName}
                </button>

                <label className="category-availability">
                  <input
                    type="checkbox"
                    checked={category.isCategoryAvailable}
                    onChange={(e) =>
                      handleCategoryChange(catIdx, "isCategoryAvailable", e.target.checked)
                    }
                  />
                  Category Available
                </label>
              </div>

              {category.expanded && (
                <div className="products-container">
                  {category.products?.map((product, prodIdx) => (
                    <div key={product.productId || prodIdx} className="product-card">
                      <div className="form-grid">
                        <div className="form-group">
                          <label>Product Name</label>
                          <input
                            type="text"
                            value={product.productName || ""}
                            onChange={(e) =>
                              handleProductChange(catIdx, prodIdx, "productName", e.target.value)
                            }
                          />
                        </div>

                        <div className="form-group">
                          <label>Price</label>
                          <input
                            type="number"
                            value={product.price || ""}
                            onChange={(e) =>
                              handleProductChange(catIdx, prodIdx, "price", e.target.value)
                            }
                          />
                        </div>

                        <div className="form-group full-width">
                          <label>Description</label>
                          <textarea
                            rows={2}
                            value={product.description || ""}
                            onChange={(e) =>
                              handleProductChange(catIdx, prodIdx, "description", e.target.value)
                            }
                          />
                        </div>

                        <div className="form-group checkbox-group">
                          <label>
                            <input
                              type="checkbox"
                              checked={!!product.isVeg}
                              onChange={(e) =>
                                handleProductChange(catIdx, prodIdx, "isVeg", e.target.checked)
                              }
                            />
                            Veg
                          </label>
                          <label>
                            <input
                              type="checkbox"
                              checked={!!product.isAvailable}
                              onChange={(e) =>
                                handleProductChange(catIdx, prodIdx, "isAvailable", e.target.checked)
                              }
                            />
                            Available
                          </label>
                        </div>
                      </div>

                      {/* Variants Subsection */}
                      <div className="subsection">
                        <h4>Variants</h4>
                        <div className="variants-grid">
                          {product.variants?.map((variant, vIdx) => (
                            <div key={variant.name} className="form-group inline">
                              <label>{variant.name}</label>
                              <input
                                type="number"
                                value={variant.price || ""}
                                onChange={(e) =>
                                  handleVariantChange(catIdx, prodIdx, vIdx, e.target.value)
                                }
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Product Timings Subsection */}
                      <div className="subsection">
                        <h4>Product Timings</h4>
                        <table className="timings-table sub-table">
                          <thead>
                            <tr>
                              <th>Day</th>
                              <th>Timing Window</th>
                            </tr>
                          </thead>
                          <tbody>
                            {product.productTimings?.map((timing, tIdx) => (
                              <tr key={timing.day}>
                                <td>{timing.day}</td>
                                <td>
                                  <input
                                    type="time"
                                    value={timing.startTime || "09:00"}
                                    onChange={(e) =>
                                      handleProductTimingChange(
                                        catIdx,
                                        prodIdx,
                                        tIdx,
                                        "startTime",
                                        e.target.value
                                      )
                                    }
                                  />
                                  {" - "}
                                  <input
                                    type="time"
                                    value={timing.endTime || "18:00"}
                                    onChange={(e) =>
                                      handleProductTimingChange(
                                        catIdx,
                                        prodIdx,
                                        tIdx,
                                        "endTime",
                                        e.target.value
                                      )
                                    }
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* --- Action Buttons --- */}
        <div className="form-actions">
          <button type="button" className="cancel-btn" onClick={() => navigate(-1)}>
            Cancel
          </button>
          <button type="submit" className="submit-btn">
            Update Outlet
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditOutlet;