import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getOutletById } from "../../services/outletService";
import "../../styles/ViewOutlet.css";

const ViewOutlet = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [outlet, setOutlet] = useState(null);
  
  // State to track which category accordions are open
  const [openCategories, setOpenCategories] = useState({});

  useEffect(() => {
    loadOutlet();
  }, [id]);

  const loadOutlet = async () => {
    try {
      const response = await getOutletById(id);
      const data = response.data || response;
      setOutlet(data);

      // Default expand all categories initially
      if (data?.categories) {
        const initialAccordions = {};
        data.categories.forEach((cat) => {
          initialAccordions[cat.categoryId] = true;
        });
        setOpenCategories(initialAccordions);
      }
    } catch (error) {
      console.error("Error loading outlet details:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryId) => {
    setOpenCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const formatTime = (time) => {
    if (!time) return "N/A";
    if (typeof time === "string") return time;
    if (typeof time === "object") {
      const pad = (num) => String(num).padStart(2, "0");
      const hour = time.hour !== undefined ? pad(time.hour) : "00";
      const minute = time.minute !== undefined ? pad(time.minute) : "00";
      return `${hour}:${minute}`;
    }
    return String(time);
  };

  const formatBoolean = (val) => {
    if (val === true) return "Yes";
    if (val === false) return "No";
    return "N/A";
  };

  if (loading) {
    return <div className="loading-box">Loading outlet details...</div>;
  }

  if (!outlet) {
    return <div className="empty-box">Outlet details not found.</div>;
  }

  return (
    <div className="view-outlet-container">
      {/* Top Header */}
      <div className="view-outlet-header">
        <button className="back-btn" onClick={() => navigate("/outlets")}>
          ← Back
        </button>
        <h2 className="view-outlet-title">{outlet.outletName || "Outlet Details"}</h2>
      </div>

      {/* Row 1: Side-by-Side Cards (Outlet Info & Address) */}
      <div className="info-grid">
        {/* Outlet Information */}
        <div className="outlet-card">
          <h3>Outlet Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Outlet Name</span>
              <span className="info-value">{outlet.outletName || "N/A"}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Outlet ID</span>
              <span className="info-value">{outlet.outletId || "N/A"}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Email</span>
              <span className="info-value">{outlet.outletEmail || "N/A"}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Phone</span>
              <span className="info-value">{outlet.outletPhone || "N/A"}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Alternate Phone</span>
              <span className="info-value">{outlet.alternateOutletPhone || "N/A"}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Cuisine</span>
              <span className="info-value">{outlet.cuisineType || "N/A"}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Favourite</span>
              <span className="info-value">{formatBoolean(outlet.isFavourite)}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Available</span>
              <span className={`info-value ${outlet.isAvailable ? "status-active" : "status-inactive"}`}>
                {formatBoolean(outlet.isAvailable)}
              </span>
            </div>
          </div>
        </div>

        {/* Address Details */}
        <div className="outlet-card">
          <h3>Address Details</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Building Number</span>
              <span className="info-value">{outlet.buildingNumber || "N/A"}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Road</span>
              <span className="info-value">{outlet.road || "N/A"}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Landmark</span>
              <span className="info-value">{outlet.landmark || "N/A"}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Area</span>
              <span className="info-value">{outlet.areaName || "N/A"}</span>
            </div>
            <div className="info-item">
              <span className="info-label">City</span>
              <span className="info-value">{outlet.cityName || "N/A"}</span>
            </div>
            <div className="info-item">
              <span className="info-label">State</span>
              <span className="info-value">{outlet.stateName || "N/A"}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Latitude</span>
              <span className="info-value">{outlet.latitude ?? "N/A"}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Longitude</span>
              <span className="info-value">{outlet.longitude ?? "N/A"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Bank Details */}
      <div className="outlet-card">
        <h3>Bank Details</h3>
        <div className="info-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          <div className="info-item">
            <span className="info-label">Account Holder</span>
            <span className="info-value">{outlet.accountHolderName || "N/A"}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Bank Name</span>
            <span className="info-value">{outlet.bankName || "N/A"}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Account Number</span>
            <span className="info-value">{outlet.accountNumber || "N/A"}</span>
          </div>
          <div className="info-item">
            <span className="info-label">IFSC Code</span>
            <span className="info-value">{outlet.ifscCode || "N/A"}</span>
          </div>
        </div>
      </div>

      {/* Row 3: Outlet Timings Table */}
      {outlet.outletTimings && outlet.outletTimings.length > 0 && (
        <div className="outlet-card">
          <h3>Outlet Timings</h3>
          <div className="table-wrapper">
            <table className="outlet-table">
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Status</th>
                  <th>Opening Time</th>
                  <th>Closing Time</th>
                </tr>
              </thead>
              <tbody>
                {outlet.outletTimings.map((timing, index) => (
                  <tr key={index}>
                    <td>{timing.day || "N/A"}</td>
                    <td>
                      <span className={timing.isOpen ? "status-open" : "status-closed"}>
                        {timing.isOpen ? "Open" : "Closed"}
                      </span>
                    </td>
                    <td>{formatTime(timing.openingTime)}</td>
                    <td>{formatTime(timing.closingTime)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Row 4: Categories Accordions */}
      {outlet.categories && outlet.categories.length > 0 && (
        <div className="outlet-card">
          <h3>Categories</h3>
          {outlet.categories.map((cat) => {
            const isOpen = openCategories[cat.categoryId];
            return (
              <div key={cat.categoryId} className="category-card">
                {/* Accordion Header */}
                <div
                  className="category-header"
                  onClick={() => toggleCategory(cat.categoryId)}
                >
                  <span style={{ fontSize: "18px", color: "#222" }}>
                    {isOpen ? "▼" : "▶"} &nbsp; {cat.categoryName}
                  </span>
                  <span className={cat.isAvailable ? "status-open" : "status-closed"}>
                    {cat.isAvailable ? "Available" : "Unavailable"}
                  </span>
                </div>

                {/* Accordion Body */}
                {isOpen && (
                  <div style={{ padding: "10px" }}>
                    {cat.products && cat.products.length > 0 ? (
                      cat.products.map((prod) => (
                        <div key={prod.productId} className="product-card">
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                            <span className="product-title">{prod.productName}</span>
                            <span style={{ fontSize: "18px", fontWeight: "700", color: "#222" }}>
                              ₹{prod.price}
                            </span>
                          </div>

                          <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "8px" }}>
                            <span className={prod.isVeg ? "status-open" : "status-closed"}>
                              {prod.isVeg ? "🟢 Veg" : "🔴 Non-Veg"}
                            </span>
                            <span className={prod.isAvailable ? "status-active" : "status-inactive"}>
                              {prod.isAvailable ? "Available" : "Out of Stock"}
                            </span>
                          </div>

                          {prod.description && (
                            <p style={{ fontSize: "13px", color: "#666", margin: "6px 0" }}>
                              {prod.description}
                            </p>
                          )}

                          {/* Variants section */}
                          {prod.hasProductVariants && prod.variants && prod.variants.length > 0 && (
                            <div className="variant-title" style={{ fontSize: "14px", marginTop: "10px" }}>
                              Variants:
                              <ul style={{ margin: "4px 0", paddingLeft: "20px", color: "#444", fontWeight: "normal" }}>
                                {prod.variants.map((v) => (
                                  <li key={v.variantId}>
                                    {v.variantName} — ₹{v.price}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Product Timings */}
                          {prod.productTimings && prod.productTimings.length > 0 && (
                            <div className="timing-box" style={{ marginTop: "10px" }}>
                              <span className="day-name">Timings:</span>
                              <div className="day-time">
                                {prod.productTimings.map((pt, ptIdx) => (
                                  <span key={ptIdx} style={{ marginRight: "12px" }}>
                                    {pt.day}: {formatTime(pt.startTime)} - {formatTime(pt.endTime)}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p style={{ color: "#888", padding: "10px" }}>No products in this category.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ViewOutlet;