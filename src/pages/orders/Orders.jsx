import "../../styles/Orders.css";
import { useEffect, useState } from "react";
import { FaSearch, FaEye, FaPrint } from "react-icons/fa";
import {
  getOrderById,
  getRejectedOrdersCount,
} from "../../services/ordersService";



const Orders = () => {

  const [search, setSearch] = useState("");

const [statusFilter, setStatusFilter] = useState("All");

const [orders, setOrders] = useState([]);

const [rejectedOrdersCount, setRejectedOrdersCount] = useState(0);
 useEffect(() => {

  fetchOrder();
  fetchRejectedOrdersCount();

}, []);

  const fetchOrder = async () => {

    try {

      const response = await getOrderById("ORD1001");

      setOrders([response]);

    } catch (error) {

      console.error(error);

    }

  };
  const fetchRejectedOrdersCount = async () => {

  try {

    const response = await getRejectedOrdersCount("008");

    setRejectedOrdersCount(response);

  } catch (error) {

    console.error(error);

  }

};

  const filteredOrders = orders.filter((order) => {

    const matchesSearch =
      order.orderId
        ?.toLowerCase()
        .includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "All" ||
      order.orderStatus === statusFilter.toUpperCase();

    return matchesSearch && matchesStatus;

  });

  return (

    <div className="merchant-orders-container">

      <div className="merchant-orders-header">

        <div>

          <h2 className="merchant-orders-title">
            Orders
          </h2>

          <p className="merchant-orders-subtitle">
            Manage and monitor all restaurant orders.
          </p>

        </div>

      </div>

      <div className="merchant-orders-status-container">

        <button
          className={`merchant-orders-status-card ${
            statusFilter === "All"
              ? "merchant-orders-status-active"
              : ""
          }`}
          onClick={() => setStatusFilter("All")}
        >
          All
        </button>

        <button
          className={`merchant-orders-status-card merchant-orders-placed ${
            statusFilter === "Placed"
              ? "merchant-orders-status-active"
              : ""
          }`}
          onClick={() => setStatusFilter("Placed")}
        >
          Placed
        </button>

        <button
          className={`merchant-orders-status-card merchant-orders-accepted ${
            statusFilter === "Accepted"
              ? "merchant-orders-status-active"
              : ""
          }`}
          onClick={() => setStatusFilter("Accepted")}
        >
          Accepted
        </button>

        <button
          className={`merchant-orders-status-card merchant-orders-rejected ${
            statusFilter === "Rejected"
              ? "merchant-orders-status-active"
              : ""
          }`}
          onClick={() => setStatusFilter("Rejected")}
        >
          Rejected
        </button>

        <button
          className={`merchant-orders-status-card merchant-orders-cancelled ${
            statusFilter === "Cancelled"
              ? "merchant-orders-status-active"
              : ""
          }`}
          onClick={() => setStatusFilter("Cancelled")}
        >
          Cancelled
        </button>

        <button
          className={`merchant-orders-status-card merchant-orders-completed ${
            statusFilter === "Completed"
              ? "merchant-orders-status-active"
              : ""
          }`}
          onClick={() => setStatusFilter("Completed")}
        >
          Completed
        </button>

      </div>

      <div className="merchant-orders-toolbar">

        <div className="merchant-orders-search">

          <FaSearch />

          <input
            type="text"
            placeholder="Search Order ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

        </div>

        <div className="merchant-orders-count-container">

  <div className="merchant-orders-count">
    Total Orders :
    <span>{filteredOrders.length}</span>
  </div>

  <div className="merchant-orders-count merchant-orders-rejected-count">
    Rejected Orders :
    <span>{rejectedOrdersCount}</span>
  </div>

</div>

      </div>
            <div className="merchant-orders-table-wrapper">

        <table className="merchant-orders-table">

          <thead>

            <tr>

              <th style={{ width: "15%" }}>Order ID</th>

              <th style={{ width: "18%" }}>Customer</th>

              <th style={{ width: "15%" }}>Driver</th>

              <th style={{ width: "12%" }}>Status</th>

              <th style={{ width: "10%" }}>Amount</th>

              <th style={{ width: "15%" }}>Order Type</th>

              <th style={{ width: "15%" }}>Date</th>

              <th style={{ width: "10%" }}>Actions</th>

            </tr>

          </thead>

          <tbody>

            {filteredOrders.length > 0 ? (

              filteredOrders.map((order, index) => (

                <tr key={index}>

                  <td>{order.orderId}</td>

                  <td>-</td>

                  <td>{order.driverId ?? "-"}</td>

                  <td>

                    <span
                      className={`merchant-orders-status-pill ${order.orderStatus.toLowerCase()}`}
                    >
                      {order.orderStatus}
                    </span>

                  </td>

                  <td>-</td>

                  <td>-</td>

                  <td>-</td>

                  <td>

                    <div className="merchant-orders-actions">

                      <button className="merchant-orders-view-btn">

                        <FaEye />

                      </button>

                      <button className="merchant-orders-print-btn">

                        <FaPrint />

                      </button>

                    </div>

                  </td>

                </tr>

              ))

            ) : (

              <tr>

                <td
                  colSpan="8"
                  className="merchant-orders-no-data"
                >
                  No Orders Found
                </td>

              </tr>

            )}

          </tbody>

        </table>

      </div>
          </div>

  );

};

export default Orders;