import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import {
  FaArrowLeft,
  FaShoppingCart,
  FaUser,
  FaStore,
  FaTruck,
  FaUtensils,
  FaMoneyBillWave,
  FaUndo,
  FaCheckCircle,
  FaClock,
} from "react-icons/fa";

import { getOrderCompleteDetails } from "../../services/orderService";
import "../../styles/OrderDetails.css";

function OrderDetails() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadOrder = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getOrderCompleteDetails(
          String(orderId)
        );

        const data = response?.data || response;

        console.log("ORDER DETAILS PAGE:", data);

        setOrder(data);
      } catch (err) {
        console.error("FAILED TO LOAD ORDER:", err);
        setError("Unable to load order details.");
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      loadOrder();
    } else {
      setLoading(false);
      setError("No order selected.");
    }
  }, [orderId]);

  const formatDate = (value) => {
    if (!value) return "-";

    return new Date(value).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (value) => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "₹0.00";
    }

    return `₹${Number(value).toFixed(2)}`;
  };

  const formatStatus = (status) => {
    if (!status) return "-";

    return status
      .replace("ORDER_", "")
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  const formatOrderType = (type) => {
    if (!type) return "-";

    return type
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "ORDER_PLACED":
        return "order-details-status-placed";

      case "ORDER_CONFIRMED":
        return "order-details-status-confirmed";

      case "ORDER_SHIPPED":
        return "order-details-status-shipped";

      case "ORDER_COMPLETED":
        return "order-details-status-completed";

      case "ORDER_REJECTED":
        return "order-details-status-rejected";

      default:
        return "order-details-status-default";
    }
  };

  if (loading) {
    return (
      <div className="order-details-page">
        <div className="order-details-loading">
          Loading order details...
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="order-details-page">
        <div className="order-details-error">
          {error || "Order not found."}
        </div>
      </div>
    );
  }

  const customer = order.customer;
  const outlet = order.outlet;
  const driver = order.driver;
  const price = order.priceBreakup;
  const refund = order.refund;

  /*
   * Order Timeline
   *
   * createdAt is used for Order Placed because
   * the complete-order API does not provide a separate
   * orderCompletedTime field.
   */
  const timeline = [
    {
      title: "Order Placed",
      value: order.createdAt,
    },
    {
      title: "Merchant Accepted",
      value: order.merchantAcceptedTime,
    },
    {
      title: "Food Preparation Completed",
      value: order.foodPreparationCompletedTime,
    },
    {
      title: "Driver Order Accepted",
      value: order.driverOrderAcceptedTime,
    },
    {
      title: "Driver Reached Outlet",
      value: order.driverOutletReachedTime,
    },
    {
      title: "Food Picked Up",
      value: order.driverFoodPickupTime,
    },
    {
      title: "Food Delivered",
      value: order.driverFoodDeliveredTime,
    },
  ];

  /*
   * The API does not expose a separate orderCompletedTime.
   * Therefore we show the final status separately without
   * inventing a timestamp.
   */
  const orderCompleted =
    order.orderStatus === "ORDER_COMPLETED";

  return (
    <div className="order-details-page">

      {/* =====================================================
          PAGE HEADER
          ===================================================== */}

      <div className="order-details-page-header">

        <div>
          <h1>Orders</h1>

          <div className="order-details-breadcrumb">

            <span
              onClick={() => navigate("/orders")}
            >
              Dashboard
            </span>

            <span>›</span>

            <span
  onClick={() => navigate("/orders")}
>
  Orders
</span>

            <span>›</span>

            <strong>Order Details</strong>

          </div>
        </div>

        <button
          type="button"
          className="order-details-back-button"
          onClick={() => navigate("/orders")}
        >
          <FaArrowLeft />
          Back to Orders
        </button>

      </div>


      {/* =====================================================
          ORDER HEADER
          ===================================================== */}

      <div className="order-details-title-card">

        <div className="order-details-title-left">

          <div className="order-details-main-icon">
            <FaShoppingCart />
          </div>

          <div>

            <h2>Order Details</h2>

            <p>
              Order ID:{" "}
              <strong>{order.orderId}</strong>
            </p>

          </div>

        </div>

        <span
          className={`order-details-status ${getStatusClass(
            order.orderStatus
          )}`}
        >
          {formatStatus(order.orderStatus)}
        </span>

      </div>


      {/* =====================================================
          TOP GRID
          ===================================================== */}

      <div className="order-details-top-grid">

        {/* GENERAL DETAILS */}

        <div className="order-details-card">

          <div className="order-details-card-header">
            <FaShoppingCart />
            <h3>General Details</h3>
          </div>

          <div className="order-details-fields">

            <InfoRow
              label="Order ID"
              value={order.orderId}
            />

            <InfoRow
              label="Date Created"
              value={formatDate(order.createdAt)}
            />

            <InfoRow
              label="Order Type"
              value={formatOrderType(order.orderType)}
            />

            <InfoRow
              label="Payment Method"
              value={order.paymentMode || "-"}
            />

            <InfoRow
              label="Order Status"
              value={formatStatus(order.orderStatus)}
            />

          </div>

        </div>


        {/* CUSTOMER DETAILS */}

        <div className="order-details-card">

          <div className="order-details-card-header">
            <FaUser />
            <h3>Customer Details</h3>
          </div>

          <div className="order-details-fields">

            <InfoRow
              label="Customer ID"
              value={customer?.customerId}
            />

            <InfoRow
              label="Name"
              value={customer?.customerName}
            />

            <InfoRow
              label="Email"
              value={customer?.email}
            />

            <InfoRow
              label="Phone"
              value={customer?.phoneNumber}
            />

            <InfoRow
              label="Building"
              value={customer?.buildingName}
            />

          </div>

        </div>


        {/* DRIVER DETAILS */}

        <div className="order-details-card">

          <div className="order-details-card-header">
            <FaTruck />
            <h3>Driver Details</h3>
          </div>

          <div className="order-details-fields">

            <InfoRow
              label="Driver ID"
              value={driver?.driverId}
            />

            <InfoRow
              label="Driver Name"
              value={driver?.driverName}
            />

            <InfoRow
              label="Mobile Number"
              value={driver?.driverMobileNumber}
            />

          </div>

        </div>


        {/* RESTAURANT */}

        <div className="order-details-card">

          <div className="order-details-card-header">
            <FaStore />
            <h3>Restaurant</h3>
          </div>

          <div className="order-details-fields">

            <InfoRow
              label="Outlet ID"
              value={outlet?.outletId}
            />

            <InfoRow
              label="Outlet Name"
              value={outlet?.outletName}
            />

            <InfoRow
              label="Outlet Phone"
              value={outlet?.outletPhone}
            />

            <InfoRow
              label="Building Number"
              value={outlet?.buildingNumber}
            />

            <InfoRow
              label="Image URL"
              value={outlet?.outletPicUrl}
            />

          </div>

        </div>

      </div>


      {/* =====================================================
          ITEMS
          ===================================================== */}

      <div className="order-details-card">

        <div className="order-details-card-header">
          <FaUtensils />
          <h3>Items</h3>
        </div>

        {Array.isArray(order.items) &&
        order.items.length > 0 ? (

          <div className="order-details-table-wrapper">

            <table className="order-details-table">

              <thead>
                <tr>
                  <th>Product ID</th>
                  <th>Variant</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>

              <tbody>

                {order.items.map((item, index) => (

                  <tr key={index}>

                    <td>
                      {item.productId || "-"}
                    </td>

                    <td>
                      {item.variantOptionId || "-"}
                    </td>

                    <td>
                      {item.quantity || 0}
                    </td>

                    <td>
                      {formatCurrency(
                        item.onlineUnitPrice
                      )}
                    </td>

                    <td>
                      {formatCurrency(
                        item.onlinePriceTotal
                      )}
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        ) : (

          <div className="order-details-empty">
            No items available for this order.
          </div>

        )}

      </div>


      {/* =====================================================
          BOTTOM GRID
          PRICE BREAKUP | TIMELINE | REFUND
          ===================================================== */}

      <div className="order-details-bottom-grid">


        {/* =================================================
            PRICE BREAKUP
            ================================================= */}

        <div className="order-details-card">

          <div className="order-details-card-header">
            <FaMoneyBillWave />
            <h3>Price Breakup</h3>
          </div>

          {price ? (

            <div className="order-details-price-list">

              <InfoRow
                label="Order Amount"
                value={formatCurrency(
                  price.orderAmount
                )}
              />

              <InfoRow
                label="Discounted Amount"
                value={formatCurrency(
                  price.orderAmountDiscounted
                )}
              />

              <InfoRow
                label="Pickup Distance"
                value={`${price.pickUpDistanceKms ?? 0} km`}
              />

              <InfoRow
                label="Delivery Distance"
                value={`${price.deliveryDistanceKms ?? 0} km`}
              />

              <InfoRow
                label="Pickup Charges"
                value={formatCurrency(
                  price.pickUpCharges
                )}
              />

              <InfoRow
                label="Driver Delivery Fee"
                value={formatCurrency(
                  price.driverDeliveryFee
                )}
              />

              <InfoRow
                label="Customer Delivery Fee"
                value={formatCurrency(
                  price.customerDeliveryFee
                )}
              />

              <InfoRow
                label="Total Delivery Fee"
                value={formatCurrency(
                  price.totalDeliveryFee
                )}
              />

              <InfoRow
                label="Platform Fee"
                value={formatCurrency(
                  price.platformFee
                )}
              />

              <InfoRow
                label="Surge Fee"
                value={formatCurrency(
                  price.surgeFee
                )}
              />

              <InfoRow
                label="Packaging Fee"
                value={formatCurrency(
                  price.packagingFee
                )}
              />

              <InfoRow
                label="Food Tax"
                value={formatCurrency(
                  price.foodTax
                )}
              />

              <InfoRow
                label="Total Tax"
                value={formatCurrency(
                  price.totalTax
                )}
              />

              <InfoRow
                label="Tip"
                value={formatCurrency(
                  price.tip
                )}
              />

              <InfoRow
                label="Coupon Discount"
                value={formatCurrency(
                  price.couponDiscount
                )}
              />

              <InfoRow
                label="Wallet Amount"
                value={formatCurrency(
                  price.walletAmount
                )}
              />

              <div className="order-details-total-row">

                <span>Order Total</span>

                <strong>
                  {formatCurrency(
                    price.orderTotalAmount
                  )}
                </strong>

              </div>

            </div>

          ) : (

            <div className="order-details-empty">
              No price breakup available.
            </div>

          )}

        </div>


        {/* =================================================
            ORDER TIMELINE
            ================================================= */}

        <div className="order-details-card order-details-timeline-card">

          <div className="order-details-card-header">
            <FaClock />
            <h3>Order Timeline</h3>
          </div>

          <div className="order-details-timeline">

            {timeline.map((item, index) => {

              const completed = Boolean(item.value);

              return (
                <div
                  className={`order-details-timeline-item ${
                    completed ? "completed" : ""
                  }`}
                  key={index}
                >

                  <div className="order-details-timeline-icon">

                    {completed ? (
                      <FaCheckCircle />
                    ) : (
                      <FaClock />
                    )}

                  </div>

                  <div className="order-details-timeline-content">

                    <strong>
                      {item.title}
                    </strong>

                    <span>
                      {item.value
                        ? formatDate(item.value)
                        : "Not reached"}
                    </span>

                  </div>

                </div>
              );
            })}


            {/* ORDER COMPLETED */}

            <div
              className={`order-details-timeline-item ${
                orderCompleted ? "completed" : ""
              }`}
            >

              <div className="order-details-timeline-icon">

                {orderCompleted ? (
                  <FaCheckCircle />
                ) : (
                  <FaClock />
                )}

              </div>

              <div className="order-details-timeline-content">

                <strong>
                  Order Completed
                </strong>

                <span>
                  {orderCompleted
                    ? "Completed"
                    : "Not completed"}
                </span>

              </div>

            </div>

          </div>

        </div>


        {/* =================================================
            REFUND
            ================================================= */}

        <div className="order-details-card order-details-refund-card">

          <div className="order-details-card-header">
            <FaUndo />
            <h3>Refund Details</h3>
          </div>

          {refund ? (

            <div className="order-details-fields">

              <InfoRow
                label="Application Order ID"
                value={refund.applicationOrderId}
              />

              <InfoRow
                label="Transaction ID"
                value={refund.paymentTransactionsId}
              />

              <InfoRow
                label="Amount"
                value={formatCurrency(
                  refund.amountInRupees
                )}
              />

              <InfoRow
                label="Refund Status"
                value={refund.refundStatus}
              />

              <InfoRow
                label="Reason"
                value={refund.reason}
              />

              <InfoRow
                label="Created At"
                value={formatDate(
                  refund.createdAt
                )}
              />

            </div>

          ) : (

            <div className="order-details-empty order-details-refund-empty">
              No refund information available.
            </div>

          )}

        </div>

      </div>


      {/* =====================================================
          FOOTER
          ===================================================== */}

      <div className="order-details-footer">
<button
  type="button"
  className="order-details-cancel-button"
  onClick={() => navigate("/orders")}
>
  Cancel
</button>

        <button
  type="button"
  className="order-details-save-button"
  onClick={() => navigate("/orders")}
>
  Save
</button>

      </div>

    </div>
  );
}


/* =========================================================
   INFO ROW
   ========================================================= */

function InfoRow({ label, value }) {
  return (
    <div className="order-details-info-row">

      <span>
        {label}
      </span>

      <strong>
        {value !== null &&
        value !== undefined &&
        value !== ""
          ? value
          : "-"}
      </strong>

    </div>
  );
}

export default OrderDetails;