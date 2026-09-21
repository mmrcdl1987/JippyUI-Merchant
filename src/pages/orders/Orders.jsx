import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";

import {
  FaShoppingCart,
  FaEye,
  FaTimes,
  FaTruck,
  FaClipboardList,
  FaCheckCircle,
  FaCheck,
  FaSearch,
} from "react-icons/fa";

import {
  getCompleteOrdersFlowCounts,
 getOrdersByMerchant,
  getStates,
  getCitiesByState,
  getAreasByCity, 
  getOrderCompleteDetails,
} from "../../services/orderService";

import "../../styles/Orders.css";

function Orders() {
  const navigate = useNavigate();
  /* =========================================================
     PAGINATION
     ========================================================= */

  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(30);

  /* =========================================================
     ORDER STATUS OPTIONS
     ========================================================= */

  const ORDER_STATUS_OPTIONS = [
    {
      value: "",
      label: "All Status",
    },
    {
      value: "ORDER_PLACED",
      label: "Order Placed",
    },
    {
      value: "ORDER_CONFIRMED",
      label: "Order Confirmed",
    },
    {
      value: "ORDER_SHIPPED",
      label: "Order Shipped",
    },
    {
      value: "ORDER_COMPLETED",
      label: "Order Completed",
    },
    {
      value: "ORDER_REJECTED",
      label: "Order Rejected",
    },
  ];

  /* =========================================================
     LOCATION FILTERS
     ========================================================= */

  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [areas, setAreas] = useState([]);


  const [showColumns, setShowColumns] = useState(false);

const [visibleColumns, setVisibleColumns] = useState({
  orderId: true,
  restaurant: true,
  driver: true,
  customer: true,
  date: true,
  amount: true,
  orderStatus: true,
  area: true,
  actions: true,
});

const orderColumns = [
  {
    key: "orderId",
    label: "Order ID",
  },
  {
    key: "restaurant",
    label: "Restaurant",
  },
  {
    key: "driver",
    label: "Driver",
  },
  {
    key: "customer",
    label: "Customer",
  },
  {
    key: "date",
    label: "Date",
  },
  {
    key: "amount",
    label: "Amount",
  },
  {
    key: "orderStatus",
    label: "Order Status",
  },
  {
    key: "area",
    label: "Area",
  },
  {
    key: "actions",
    label: "Actions",
  },
];
const handleColumnToggle = (columnKey) => {
  setVisibleColumns((prev) => ({
    ...prev,
    [columnKey]: !prev[columnKey],
  }));
};

  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedArea, setSelectedArea] = useState("");

  const stateOptions = states.map((state) => ({
    value: state.stateId,
    label: state.stateName,
  }));

  const cityOptions = cities.map((city) => ({
    value: city.cityId,
    label: city.cityName,
  }));

  const areaOptions = areas.map((area) => ({
    value: area.areaId,
    label: area.areaName,
  }));

  /* =========================================================
     FETCH STATES
     ========================================================= */

  useEffect(() => {
    const fetchStates = async () => {
      try {
        const response = await getStates();
        setStates(response.data || []);
      } catch (error) {
        console.error("Failed to fetch states:", error);
      }
    };

    fetchStates();
  }, []);

  /* =========================================================
     STATE CHANGE
     ========================================================= */

  const handleStateChange = async (selected) => {
    const stateId = selected?.value || "";

    setSelectedState(stateId);
    setSelectedCity("");
    setSelectedArea("");

    setCities([]);
    setAreas([]);

    if (!stateId) {
      return;
    }

    try {
      const response = await getCitiesByState(stateId);
      setCities(response.data || []);
    } catch (error) {
      console.error("Failed to fetch cities:", error);
    }
  };

  /* =========================================================
     CITY CHANGE
     ========================================================= */

  const handleCityChange = async (selected) => {
    const cityId = selected?.value || "";

    setSelectedCity(cityId);
    setSelectedArea("");

    setAreas([]);

    if (!cityId) {
      return;
    }

    try {
      const response = await getAreasByCity(cityId);
      setAreas(response.data || []);
    } catch (error) {
      console.error("Failed to fetch areas:", error);
    }
  };

  /* =========================================================
     AREA CHANGE
     ========================================================= */

  const handleAreaChange = (selected) => {
    setSelectedArea(selected?.value || "");
  };

  /* =========================================================
     FILTER STATES
     ========================================================= */

  const [selectedOrderStatus, setSelectedOrderStatus] =
    useState("");

  const [searchTerm, setSearchTerm] = useState("");

  const [orderTypeFilter, setOrderTypeFilter] =
    useState("");

  const [paymentFilter, setPaymentFilter] =
    useState("");

  /* =========================================================
     ORDERS
     ========================================================= */

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  /* =========================================================
     FETCH ORDERS
     ========================================================= */

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);

        let ordersData = [];

        if (!selectedOrderStatus) {
          const statuses = [
            "ORDER_PLACED",
            "ORDER_CONFIRMED",
            "ORDER_SHIPPED",
            "ORDER_COMPLETED",
            "ORDER_REJECTED",
          ];

          const responses = await Promise.all(
            statuses.map((status) =>
              getOrdersByMerchant(status)
            )
          );

          ordersData = responses.flat();


          const ordersWithCreatedAt = await Promise.all(
  ordersData.map(async (order) => {
  try {
  const details = await getOrderCompleteDetails(order.orderId);

  const detailData = details?.data || details;

  return {
    ...order,
    createdAt: detailData?.createdAt || null,
  };
} catch (error) {
  console.error(
    `Failed to fetch date for order ${order.orderId}:`,
    error
  );

  return {
    ...order,
    createdAt: null,
  };
}
  })
);

ordersData = ordersWithCreatedAt;


        } else {
          ordersData =
            await getOrdersByMerchant(
              selectedOrderStatus
            );
        }

        setOrders(
          Array.isArray(ordersData)
            ? ordersData
            : []
        );

        setCurrentPage(1);

        console.log(
          "================================="
        );

        console.log(
          "FINAL ORDERS FOR TABLE:",
          ordersData
        );

        console.log(
          "TOTAL ORDERS FOR TABLE:",
          ordersData.length
        );

        console.log(
          "================================="
        );
      } catch (error) {
        console.error(
          "Failed to fetch orders:",
          error
        );

        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [selectedOrderStatus]);

  /* =========================================================
     ORDER FLOW COUNTS
     ========================================================= */

  const [orderFlowCounts, setOrderFlowCounts] =
    useState({
      totalOrdersCount: 0,
      ordersPlaced: 0,
      ordersConfirmed: 0,
      ordersShipped: 0,
      ordersCompleted: 0,
      ordersRejected: 0,
    });

  const [loadingOrderCounts, setLoadingOrderCounts] =
    useState(false);

  useEffect(() => {
    const fetchOrderFlowCounts = async () => {
      try {
        setLoadingOrderCounts(true);

        const data =
          await getCompleteOrdersFlowCounts();

        setOrderFlowCounts({
          totalOrdersCount:
            data?.totalOrdersCount ?? 0,

          ordersPlaced:
            data?.ordersPlaced ?? 0,

          ordersConfirmed:
            data?.ordersConfirmed ?? 0,

          ordersShipped:
            data?.ordersShipped ?? 0,

          ordersCompleted:
            data?.ordersCompleted ?? 0,

          ordersRejected:
            data?.ordersRejected ?? 0,
        });
      } catch (error) {
        console.error(
          "Failed to fetch order flow counts:",
          error
        );
      } finally {
        setLoadingOrderCounts(false);
      }
    };

    fetchOrderFlowCounts();
  }, []);

  /* =========================================================
     FILTER ORDERS
     ========================================================= */

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const search =
        searchTerm.trim().toLowerCase();

      /* SEARCH */

      if (search) {
        const searchableText =
          `${order.orderId || ""} ${
            order.outletName || ""
          } ${
            order.driverName || ""
          } ${
            order.customerName || ""
          } ${
            order.areaName || ""
          }`.toLowerCase();

        if (!searchableText.includes(search)) {
          return false;
        }
      }

      /* ORDER TYPE */

      if (
        orderTypeFilter &&
        order.orderType &&
        order.orderType !== orderTypeFilter
      ) {
        return false;
      }

      /* PAYMENT */

      if (
        paymentFilter &&
        order.paymentMode &&
        order.paymentMode !== paymentFilter
      ) {
        return false;
      }

      return true;
    });
  }, [
    orders,
    searchTerm,
    orderTypeFilter,
    paymentFilter,
  ]);

  /* =========================================================
     PAGINATION
     ========================================================= */

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredOrders.length /
        entriesPerPage
    )
  );

  const paginatedOrders = useMemo(() => {
    const startIndex =
      (currentPage - 1) *
      entriesPerPage;

    const endIndex =
      startIndex + entriesPerPage;

    return filteredOrders.slice(
      startIndex,
      endIndex
    );
  }, [
    filteredOrders,
    currentPage,
    entriesPerPage,
  ]);

  /* =========================================================
     RESET PAGE WHEN FILTERS CHANGE
     ========================================================= */

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    selectedOrderStatus,
    orderTypeFilter,
    paymentFilter,
    selectedState,
    selectedCity,
    selectedArea,
    entriesPerPage,
  ]);

  /* =========================================================
     FORMAT DATE
     ========================================================= */

  const formatDate = (value) => {
    if (!value) {
      return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  /* =========================================================
     FORMAT CURRENCY
     ========================================================= */

  const formatCurrency = (value) => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "-";
    }

    const amount = Number(value);

    if (Number.isNaN(amount)) {
      return "-";
    }

    return `₹${amount.toFixed(2)}`;
  };

  /* =========================================================
     STATUS CLASS
     ========================================================= */

  const getStatusClass = (status) => {
    switch (status) {
      case "ORDER_PLACED":
        return "orders-status-placed";

      case "ORDER_CONFIRMED":
        return "orders-status-confirmed";

      case "ORDER_SHIPPED":
        return "orders-status-shipped";

      case "ORDER_COMPLETED":
        return "orders-status-completed";

      case "ORDER_REJECTED":
        return "orders-status-rejected";

      default:
        return "orders-status-default";
    }
  };

  /* =========================================================
     FORMAT STATUS
     ========================================================= */

  const formatOrderStatus = (status) => {
    if (!status) {
      return "-";
    }

    const statusMap = {
      ORDER_PLACED: "Placed",
      ORDER_CONFIRMED: "Confirmed",
      ORDER_SHIPPED: "Shipped",
      ORDER_COMPLETED: "Completed",
      ORDER_REJECTED: "Rejected",
    };

    return statusMap[status] || status;
  };

  /* =========================================================
     RENDER
     ========================================================= */

  return (
    <div className="orders-page">

      {/* ==================================================
          PAGE HEADER
          ================================================== */}

      <div className="orders-page-header">

        <div>
          <h1>Orders</h1>
        </div>

        <div className="orders-breadcrumb">
          <span>Dashboard</span>
          <span>›</span>
          <span>Orders list</span>
        </div>

      </div>

      {/* ==================================================
          PAGE CONTENT
          ================================================== */}

      <div className="orders-content">

        {/* ==================================================
            TITLE + FILTERS
            ================================================== */}

        <div className="orders-title-row">

          <div className="orders-title">

            <div className="orders-title-icon">
              <FaShoppingCart />
            </div>

            <h2>Orders</h2>

            <span className="orders-count">
              {orders.length}
            </span>

          </div>

          {/* FILTERS */}

          <div className="orders-filters">

            {/* STATE */}

            <div className="orders-filter-wrapper">

              <Select
                className="orders-location-select"
                classNamePrefix="orders-location"
                options={stateOptions}
                value={
                  stateOptions.find(
                    (option) =>
                      Number(option.value) ===
                      Number(selectedState)
                  ) || null
                }
                onChange={handleStateChange}
                isSearchable
                isClearable
                placeholder="Select State"
                menuPlacement="auto"
                menuPosition="absolute"
              />

            </div>

            {/* CITY */}

            <div className="orders-filter-wrapper">

              <Select
                className="orders-location-select"
                classNamePrefix="orders-location"
                options={cityOptions}
                value={
                  cityOptions.find(
                    (option) =>
                      Number(option.value) ===
                      Number(selectedCity)
                  ) || null
                }
                onChange={handleCityChange}
                isSearchable
                isClearable
                isDisabled={!selectedState}
                placeholder="Select City"
                menuPlacement="auto"
                menuPosition="absolute"
              />

            </div>

            {/* AREA */}

            <div className="orders-filter-wrapper">

              <Select
                className="orders-location-select"
                classNamePrefix="orders-location"
                options={areaOptions}
                value={
                  areaOptions.find(
                    (option) =>
                      Number(option.value) ===
                      Number(selectedArea)
                  ) || null
                }
                onChange={handleAreaChange}
                isSearchable
                isClearable
                isDisabled={!selectedCity}
                placeholder="Select Area"
                menuPlacement="auto"
                menuPosition="absolute"
              />

            </div>

            {/* STATUS */}

            <div className="orders-filter-wrapper">

              <Select
                className="orders-location-select"
                classNamePrefix="orders-location"
                options={ORDER_STATUS_OPTIONS}
                value={
                  selectedOrderStatus
                    ? ORDER_STATUS_OPTIONS.find(
                        (option) =>
                          option.value ===
                          selectedOrderStatus
                      )
                    : null
                }
                onChange={(selected) =>
                  setSelectedOrderStatus(
                    selected?.value || ""
                  )
                }
                isSearchable
                isClearable
                placeholder="All Status"
                menuPlacement="auto"
                menuPosition="absolute"
              />

            </div>

            {/* ORDER TYPE */}

            <div className="orders-filter-wrapper">

              <Select
                className="orders-location-select"
                classNamePrefix="orders-location"
                options={[
                  {
                    value: "DELIVERY",
                    label: "Delivery",
                  },
                  {
                    value: "PICKUP",
                    label: "Pickup",
                  },
                ]}
                value={
                  orderTypeFilter
                    ? {
                        value:
                          orderTypeFilter,
                        label:
                          orderTypeFilter ===
                          "DELIVERY"
                            ? "Delivery"
                            : "Pickup",
                      }
                    : null
                }
                onChange={(selected) =>
                  setOrderTypeFilter(
                    selected?.value || ""
                  )
                }
                isSearchable
                isClearable
                placeholder="Order Type"
                menuPlacement="auto"
                menuPosition="absolute"
              />

            </div>

            {/* PAYMENT TYPE */}

            <div className="orders-filter-wrapper">

              <Select
                className="orders-location-select"
                classNamePrefix="orders-location"
                options={[
                  {
                    value: "ONLINE",
                    label: "Online",
                  },
                  {
                    value: "COD",
                    label: "Cash on Delivery",
                  },
                  {
                    value: "WALLET",
                    label: "Wallet",
                  },
                ]}
                value={
                  paymentFilter
                    ? {
                        value:
                          paymentFilter,
                        label:
                          paymentFilter ===
                          "ONLINE"
                            ? "Online"
                            : paymentFilter ===
                              "COD"
                            ? "Cash on Delivery"
                            : "Wallet",
                      }
                    : null
                }
                onChange={(selected) =>
                  setPaymentFilter(
                    selected?.value || ""
                  )
                }
                isSearchable
                isClearable
                placeholder="Payment Type"
                menuPlacement="auto"
                menuPosition="absolute"
              />

            </div>

            {/* DATE RANGE */}

            <div className="orders-filter-wrapper">

              <Select
                className="orders-location-select"
                classNamePrefix="orders-location"
                options={[
                  {
                    value: "TODAY",
                    label: "Today",
                  },
                  {
                    value: "LAST_7_DAYS",
                    label: "Last 7 days",
                  },
                  {
                    value: "LAST_30_DAYS",
                    label: "Last 30 days",
                  },
                ]}
                isSearchable={false}
                isClearable
                placeholder="Select range"
                menuPlacement="auto"
                menuPosition="absolute"
              />

            </div>

          </div>
        </div>

        {/* ==================================================
            ORDER FLOW COUNT CARDS
            ================================================== */}

        <div className="orders-flow-cards">

          {/* TOTAL */}

          <div className="orders-flow-card orders-flow-total">

            <div className="orders-flow-card-content">

              <h3>
                {loadingOrderCounts
                  ? "..."
                  : orderFlowCounts.totalOrdersCount}
              </h3>

              <p>Total Orders</p>

            </div>

            <div className="orders-flow-card-icon">
              <FaShoppingCart />
            </div>

          </div>

          {/* PLACED */}

          <div className="orders-flow-card orders-flow-placed">

            <div className="orders-flow-card-content">

              <h3>
                {loadingOrderCounts
                  ? "..."
                  : orderFlowCounts.ordersPlaced}
              </h3>

              <p>Orders Placed</p>

            </div>

            <div className="orders-flow-card-icon">
              <FaClipboardList />
            </div>

          </div>

          {/* CONFIRMED */}

          <div className="orders-flow-card orders-flow-confirmed">

            <div className="orders-flow-card-content">

              <h3>
                {loadingOrderCounts
                  ? "..."
                  : orderFlowCounts.ordersConfirmed}
              </h3>

              <p>Orders Confirmed</p>

            </div>

            <div className="orders-flow-card-icon">
              <FaCheckCircle />
            </div>

          </div>

          {/* SHIPPED */}

          <div className="orders-flow-card orders-flow-shipped">

            <div className="orders-flow-card-content">

              <h3>
                {loadingOrderCounts
                  ? "..."
                  : orderFlowCounts.ordersShipped}
              </h3>

              <p>Orders Shipped</p>

            </div>

            <div className="orders-flow-card-icon">
              <FaTruck />
            </div>

          </div>

          {/* COMPLETED  */}

          <div className="orders-flow-card orders-flow-completed">

            <div className="orders-flow-card-content">

              <h3>
                {loadingOrderCounts
                  ? "..."
                  : orderFlowCounts.ordersCompleted}
              </h3>

              <p>Orders Completed</p>

            </div>

            <div className="orders-flow-card-icon">
              <FaCheck />
            </div>

          </div>

          {/* REJECTED */}

          <div className="orders-flow-card orders-flow-rejected">

            <div className="orders-flow-card-content">

              <h3>
                {loadingOrderCounts
                  ? "..."
                  : orderFlowCounts.ordersRejected}
              </h3>

              <p>Orders Rejected</p>

            </div>

            <div className="orders-flow-card-icon">
              <FaTimes />
            </div>

          </div>

        </div>

        {/* ==================================================
            ORDERS LIST CARD
            ================================================== */}

        <div className="orders-list-card">

          {/* LIST HEADER */}

          <div className="orders-list-header">

            <div>

              <h2>Orders list</h2>

              <p>
                View and manage all the orders
              </p>

            </div>

        <div className="orders-columns-wrapper">

  <button
    type="button"
    className="orders-columns-button"
    onClick={() => setShowColumns((prev) => !prev)}
  >
    Columns ▾
  </button>

  {showColumns && (
    <div className="orders-columns-dropdown">

      <div className="orders-columns-title">
        <span>General</span>
      </div>

      {orderColumns.map((column) => (
        <label
          key={column.key}
          className="orders-column-option"
        >
          <input
            type="checkbox"
            checked={visibleColumns[column.key]}
            onChange={() =>
              handleColumnToggle(column.key)
            }
          />

          <span>{column.label}</span>
        </label>
      ))}

    </div>
  )}

</div>

          </div>

          {/* ==================================================
              TABLE CONTROLS
              ================================================== */}

          <div className="orders-table-controls">

            <div className="orders-show-entries">

              <span>Show</span>

              <select
                value={entriesPerPage}
                onChange={(e) => {
                  setEntriesPerPage(
                    Number(e.target.value)
                  );
                  setCurrentPage(1);
                }}
              >
                <option value={10}>10</option>
                <option value={30}>30</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>

              <span>entries</span>

            </div>

            <div className="orders-right-controls">

              <div className="orders-search">

                <input
                  type="text"
                  placeholder="Search here..."
                  value={searchTerm}
                  onChange={(e) =>
                    setSearchTerm(
                      e.target.value
                    )
                  }
                />

                <FaSearch />

              </div>

              <button
                type="button"
                className="orders-export-button"
              >
                ⬇ Export as ▾
              </button>

            </div>

          </div>

          {/* ==================================================
              ORDERS TABLE
              ================================================== */}

          <div className="orders-table-wrapper">

            <table className="orders-table">

             <thead>
  <tr>

    <th>
      <input type="checkbox" />
      <span>All</span>
    </th>

    {visibleColumns.orderId && (
      <th>Order ID</th>
    )}

    {visibleColumns.restaurant && (
      <th>Restaurant</th>
    )}

    {visibleColumns.driver && (
      <th>Driver</th>
    )}

    {visibleColumns.customer && (
      <th>Customer</th>
    )}

    {visibleColumns.date && (
      <th>Date</th>
    )}

    {visibleColumns.amount && (
      <th>Amount</th>
    )}

    {visibleColumns.orderStatus && (
      <th>Order Status</th>
    )}

    {visibleColumns.area && (
      <th>Area</th>
    )}

    {visibleColumns.actions && (
      <th>Actions</th>
    )}

  </tr>
</thead>

              <tbody>

                {loading ? (

                  <tr>

                    <td
                      colSpan="10"
                      className="orders-empty"
                    >
                      Loading orders...
                    </td>

                  </tr>

                ) : filteredOrders.length === 0 ? (

                  <tr>

                    <td
                      colSpan="10"
                      className="orders-empty"
                    >
                      No Record Found
                    </td>

                  </tr>

                ) : (

                  paginatedOrders.map(
                    (order) => (

                   <tr key={order.orderId}>

  {/* CHECKBOX - ALWAYS VISIBLE */}
  <td>
    <input type="checkbox" />
  </td>

  {/* ORDER ID */}
  {visibleColumns.orderId && (
    <td>
      {order.orderId || "-"}
    </td>
  )}

  {/* RESTAURANT */}
  {visibleColumns.restaurant && (
    <td>
      {order.outletName || "-"}
    </td>
  )}

  {/* DRIVER */}
  {visibleColumns.driver && (
    <td>
      {order.driverName || "-"}
    </td>
  )}

  {/* CUSTOMER */}
  {visibleColumns.customer && (
    <td>
      {order.customerName || "-"}
    </td>
  )}

  {/* DATE */}
  {visibleColumns.date && (
    <td>
      {formatDate(order.createdAt)}
    </td>
  )}

  {/* AMOUNT */}
  {visibleColumns.amount && (
    <td>
      {formatCurrency(order.orderAmount)}
    </td>
  )}

  {/* STATUS */}
  {visibleColumns.orderStatus && (
    <td>
      <span
        className={`orders-status ${getStatusClass(
          order.orderStatus
        )}`}
      >
        {formatOrderStatus(order.orderStatus)}
      </span>
    </td>
  )}

  {/* AREA */}
  {visibleColumns.area && (
    <td>
      {order.areaName || "-"}
    </td>
  )}

  {/* ACTIONS */}
  {visibleColumns.actions && (
    <td>
      <button
        type="button"
        className="orders-view-button"
        onClick={() => navigate(`/orders/details/${order.orderId}`)}
      >
        <FaEye />
        View
      </button>
    </td>
  )}

</tr>

                    )
                  )

                )}

              </tbody>

            </table>

          </div>

          {/* ==================================================
              TABLE FOOTER + PAGINATION
              ================================================== */}

          <div className="orders-table-footer">

            <span>

              Showing{" "}

              {filteredOrders.length === 0
                ? 0
                : (currentPage - 1) *
                    entriesPerPage +
                  1}

              {" - "}

              {Math.min(
                currentPage * entriesPerPage,
                filteredOrders.length
              )}

              {" of "}

              {filteredOrders.length} entries

            </span>

            <div className="orders-pagination">

              <button
                type="button"
                onClick={() =>
                  setCurrentPage(
                    (prev) =>
                      Math.max(
                        prev - 1,
                        1
                      )
                  )
                }
                disabled={
                  currentPage === 1
                }
              >
                Prev
              </button>

              {Array.from(
                { length: totalPages },
                (_, index) => index + 1
              ).map((page) => (

                <button
                  type="button"
                  key={page}
                  className={
                    currentPage === page
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setCurrentPage(page)
                  }
                >
                  {page}
                </button>

              ))}

              <button
                type="button"
                onClick={() =>
                  setCurrentPage(
                    (prev) =>
                      Math.min(
                        prev + 1,
                        totalPages
                      )
                  )
                }
                disabled={
                  currentPage === totalPages
                }
              >
                Next
              </button>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Orders;