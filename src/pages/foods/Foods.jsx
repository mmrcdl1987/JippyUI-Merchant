import "../../styles/Foods.css";
import { useEffect, useState } from "react";
import {
  FaSearch,
  FaStore,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaUtensils,
  FaArrowRight,
  FaArrowLeft,
  FaChevronRight,
  FaChevronDown,
  FaEdit,
  FaTrash,
} from "react-icons/fa";

import {
  getAllOutlets,
  getOutletFoods,
  editAndUpdateOutletProducts,
} from "../../services/outletService";

const Foods = () => {
  const [outlets, setOutlets] = useState([]);
  const [foods, setFoods] = useState([]);
  const [selectedOutlet, setSelectedOutlet] = useState(null);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [foodsLoading, setFoodsLoading] = useState(false);

  const [expandedCategory, setExpandedCategory] = useState(null);

  // Edit States
  const [editOpen, setEditOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);

  useEffect(() => {
    fetchOutlets();
  }, []);

  const fetchOutlets = async () => {
    try {
      setLoading(true);

      const response = await getAllOutlets();

      if (response?.success) {
        setOutlets(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch outlets", error);
    } finally {
      setLoading(false);
    }
  };

  const openOutletFoods = async (outlet) => {
    try {
      setFoodsLoading(true);

      setSelectedOutlet(outlet);

      const response = await getOutletFoods(outlet.outletId);

      setFoods(response.categories || []);

      setExpandedCategory(null);
    } catch (error) {
      console.error("Failed to fetch foods", error);
      setFoods([]);
    } finally {
      setFoodsLoading(false);
    }
  };

  const toggleCategory = (categoryId) => {
    if (expandedCategory === categoryId) {
      setExpandedCategory(null);
    } else {
      setExpandedCategory(categoryId);
    }
  };

  const handleEdit = (product, category) => {
    setEditProduct({
      ...product,
      categoryId: category.categoryId,
    });

    setEditOpen(true);
  };

  const filteredOutlets = outlets.filter((outlet) =>
    outlet.outletName?.toLowerCase().includes(search.toLowerCase())
  );

  return (

    <div className="merchant-foods-container">

  {!selectedOutlet ? (

    <>

      <div className="merchant-foods-header">

        <div>

          <h2 className="merchant-foods-title">
            Food Management
          </h2>

          <p className="merchant-foods-subtitle">
            Select an outlet to manage categories and foods.
          </p>

        </div>

        <div className="merchant-foods-search">

          <FaSearch />

          <input
            type="text"
            placeholder="Search outlet..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

        </div>

      </div>

      <div className="merchant-foods-count">
        Total Outlets : {filteredOutlets.length}
      </div>

      <div className="merchant-foods-outlets-grid">

        {loading ? (

          <div className="merchant-foods-loading">
            Loading Outlets...
          </div>

        ) : (

          filteredOutlets.map((outlet) => (

            <div
              key={outlet.outletId}
              className="merchant-foods-outlet-card"
            >

              <div className="merchant-foods-outlet-icon">
                <FaStore />
              </div>

              <h3 className="merchant-foods-outlet-name">
                {outlet.outletName}
              </h3>

              <div className="merchant-foods-info-row">

                <FaUtensils />

                <span>
                  <strong>Cuisine :</strong> {outlet.cuisineType}
                </span>

              </div>

              <div className="merchant-foods-info-row">

                <FaPhoneAlt />

                <span>{outlet.outletPhone}</span>

              </div>

              <div className="merchant-foods-info-row">

                <FaMapMarkerAlt />

                <span>
                  {outlet.buildingNumber},{" "}
                  {outlet.road},{" "}
                  {outlet.landmark}
                </span>

              </div>

              <div className="merchant-foods-menu-count">
                Menu Items : {outlet.menuItemCount}
              </div>

              <span
                className={`merchant-foods-status ${
                  outlet.isActive === "Y"
                    ? "active"
                    : "inactive"
                }`}
              >
                {outlet.isActive === "Y"
                  ? "Active"
                  : "Inactive"}
              </span>

              <button
                className="merchant-foods-open-btn"
                onClick={() => openOutletFoods(outlet)}
              >
                Manage Foods
                <FaArrowRight />
              </button>

            </div>

          ))

        )}

      </div>

    </>

  ) : (
    <div className="merchant-foods-selected-outlet">

  <button
    className="merchant-foods-back-btn"
    onClick={() => {
      setSelectedOutlet(null);
      setFoods([]);
      setExpandedCategory(null);
    }}
  >
    <FaArrowLeft />
    Back To Outlets
  </button>

  <h2 className="merchant-foods-selected-title">
    {selectedOutlet.outletName}
  </h2>

  {foodsLoading ? (

    <div className="merchant-foods-loading">
      Loading Foods...
    </div>

  ) : (

    foods.map((category) => (

      <div
        key={category.categoryId}
        className="merchant-foods-category-card"
      >

        <div
          className="merchant-foods-category-header"
          onClick={() =>
            toggleCategory(category.categoryId)
          }
        >

          <div className="merchant-foods-category-left">

            <FaUtensils />

            <span>{category.categoryName}</span>

          </div>

          <button
            className="merchant-foods-expand-btn"
            type="button"
          >
            {expandedCategory === category.categoryId ? (
              <FaChevronDown />
            ) : (
              <FaChevronRight />
            )}
          </button>

        </div>

        {expandedCategory === category.categoryId && (

          <div className="merchant-foods-table-wrapper">

            <table className="merchant-foods-table">

              <thead>

                <tr>

                  <th style={{ width: "18%" }}>
                    Food Name
                  </th>

                  <th style={{ width: "34%" }}>
                    Description
                  </th>

                  <th style={{ width: "10%" }}>
                    Price
                  </th>

                  <th style={{ width: "14%" }}>
                    Food Type
                  </th>

                  <th style={{ width: "12%" }}>
                    Status
                  </th>

                  <th style={{ width: "12%" }}>
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody>

                {category.products.map((product) => (

                  <tr key={product.productId}>

                    <td>{product.productName}</td>

                    <td>{product.description}</td>

                    <td>₹ {product.price}</td>

                    <td>
                      {product.isVeg
                        ? "🟢 Veg"
                        : "🔴 Non Veg"}
                    </td>

                    <td>

                      <span
                        className={`merchant-foods-pill ${
                          product.isAvailable
                            ? "available"
                            : "unavailable"
                        }`}
                      >
                        {product.isAvailable
                          ? "Available"
                          : "Unavailable"}
                      </span>

                    </td>

                    <td>

                      <div className="merchant-foods-actions">

                        <button
                          className="merchant-foods-edit-btn"
                          onClick={() =>
                            handleEdit(product, category)
                          }
                        >
                          <FaEdit />
                        </button>

                        <button className="merchant-foods-delete-btn">
                          <FaTrash />
                        </button>

                      </div>

                    </td>

                  </tr>

                                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>

    ))

  )}

</div>

)}

</div>

  );

};

export default Foods;