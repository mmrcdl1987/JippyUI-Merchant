import React, { useEffect, useState } from "react";

import {
  FaChevronDown,
  FaChevronUp,
  FaClock,
  FaImage,
  FaCalendarAlt,
  FaTag,
  FaUtensils,
} from "react-icons/fa";

import "../styles/OutletSubscriptionHistory.css";

import {
  getOutletSubscriptionStatus,
} from "../services/outletListService";

const OutletSubscriptionHistory = ({ outletId }) => {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(false);

  // ============================================================
  // FETCH SUBSCRIPTION
  // ============================================================

  useEffect(() => {
    if (!outletId) {
      setLoading(false);
      return;
    }

    fetchSubscription();
  }, [outletId]);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      setError("");

      console.log(
        "Fetching subscription for outlet:",
        outletId
      );

      const response =
        await getOutletSubscriptionStatus(outletId);

      console.log(
        "SUBSCRIPTION STATUS RESPONSE:",
        response
      );

      /*
        API RESPONSE:

        {
          "success": true,
          "message": "Subscription status fetched successfully",
          "data": {
            "outletId": 183,
            "outletName": "Test Outlet 10",
            "subscriptionPlanId": 1,
            "planName": "Premium Gold",
            "subscriptionStatus": null,
            "subscriptionFromDate": null,
            "subscriptionToDate": null,
            "bannerFromDate": "2026-08-20",
            "bannerToDate": "2026-08-24",
            "bannerSlotDaysId": 64,
            "mealTypeTimings": [],
            "bannerSlot": 5,
            "bestRestaurantSlot": 5,
            "dealsSlot": 5,
            "mainBannerUrl": "...",
            "bestRestaurantBannerUrl": "...",
            "dealsBannerUrl": "...",
            "priceModelType": "FLAT",
            "offerAmount": 50
          }
        }
      */

      const data = response?.data || null;

      setSubscription(data);

    } catch (err) {
      console.error(
        "Failed to fetch subscription history:",
        err
      );

      setError(
        "Failed to fetch subscription information."
      );

      setSubscription(null);

    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // FORMAT DATE
  // ============================================================

  const formatDate = (date) => {
    if (!date) {
      return "N/A";
    }

    try {
      return new Date(date).toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      );
    } catch {
      return date;
    }
  };

  // ============================================================
  // FORMAT TIME
  // ============================================================

  const formatTime = (time) => {
    if (!time) {
      return "N/A";
    }

    const parts = time.split(":");

    if (parts.length < 2) {
      return time;
    }

    let hour = Number(parts[0]);
    const minute = parts[1];

    const ampm = hour >= 12 ? "PM" : "AM";

    hour = hour % 12 || 12;

    return `${hour}:${minute} ${ampm}`;
  };

  // ============================================================
  // DISPLAY VALUE
  // ============================================================

  const displayValue = (value) => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "N/A";
    }

    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }

    return value;
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="jippy-outlet-subscription-history-loading">

        <div className="jippy-outlet-subscription-history-spinner">
          <FaClock />
        </div>

        <p>
          Loading subscription history...
        </p>

      </div>
    );
  }

  // ============================================================
  // ERROR
  // ============================================================

  if (error) {
    return (
      <div className="jippy-outlet-subscription-history-error">
        {error}
      </div>
    );
  }

  // ============================================================
  // NO DATA
  // ============================================================

  if (!subscription) {
    return (
      <div className="jippy-outlet-subscription-history-empty">

        <FaTag />

        <h3>
          No Subscription Found
        </h3>

        <p>
          No subscription information is
          available for this outlet.
        </p>

      </div>
    );
  }

  // ============================================================
  // MAIN UI
  // ============================================================

  return (
    <div className="jippy-outlet-subscription-history-wrapper">

      {/* ========================================================
          HEADER CARD
          ======================================================== */}

      <div className="jippy-outlet-subscription-history-card">

        <div className="jippy-outlet-subscription-history-header">

          <div className="jippy-outlet-subscription-history-header-left">

            <div className="jippy-outlet-subscription-history-icon">
              <FaTag />
            </div>

            <div>
              <h3>
                {displayValue(
                  subscription.planName
                )}
              </h3>

              <span>
                Outlet ID:{" "}
                {displayValue(
                  subscription.outletId
                )}
              </span>

            </div>

          </div>

          <button
            type="button"
            className="jippy-outlet-subscription-history-expand-btn"
            onClick={() =>
              setExpanded(!expanded)
            }
          >
            {expanded ? (
              <>
                Hide Details
                <FaChevronUp />
              </>
            ) : (
              <>
                View Details
                <FaChevronDown />
              </>
            )}
          </button>

        </div>

        {/* ======================================================
            SUMMARY
            ====================================================== */}

        <div className="jippy-outlet-subscription-history-summary">

          <div className="jippy-outlet-subscription-history-summary-item">
            <span>
              Plan Name
            </span>

            <strong>
              {displayValue(
                subscription.planName
              )}
            </strong>
          </div>

          <div className="jippy-outlet-subscription-history-summary-item">
            <span>
              Price Model
            </span>

            <strong>
              {displayValue(
                subscription.priceModelType
              )}
            </strong>
          </div>

          <div className="jippy-outlet-subscription-history-summary-item">
            <span>
              Offer Amount
            </span>

            <strong>
              {subscription.offerAmount !== null &&
              subscription.offerAmount !== undefined
                ? `₹${subscription.offerAmount}`
                : "N/A"}
            </strong>
          </div>

          <div className="jippy-outlet-subscription-history-summary-item">
            <span>
              Banner Slot
            </span>

            <strong>
              {displayValue(
                subscription.bannerSlot
              )}
            </strong>
          </div>

        </div>

        {/* ======================================================
            EXPANDED DETAILS
            ====================================================== */}

        {expanded && (
          <div className="jippy-outlet-subscription-history-details">

            {/* ==================================================
                OUTLET INFORMATION
                ================================================== */}

            <div className="jippy-outlet-subscription-history-section">

              <div className="jippy-outlet-subscription-history-section-title">
                <FaUtensils />
                <span>
                  Outlet Information
                </span>
              </div>

              <div className="jippy-outlet-subscription-history-grid">

                <div>
                  <span>
                    Outlet ID
                  </span>

                  <strong>
                    {displayValue(
                      subscription.outletId
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Outlet Name
                  </span>

                  <strong>
                    {displayValue(
                      subscription.outletName
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Subscription Plan ID
                  </span>

                  <strong>
                    {displayValue(
                      subscription.subscriptionPlanId
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Plan Name
                  </span>

                  <strong>
                    {displayValue(
                      subscription.planName
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Subscription Status
                  </span>

                  <strong
                    className={
                      subscription.subscriptionStatus
                        ? "jippy-outlet-subscription-status-value"
                        : "jippy-outlet-subscription-na-value"
                    }
                  >
                    {displayValue(
                      subscription.subscriptionStatus
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Price Model Type
                  </span>

                  <strong>
                    {displayValue(
                      subscription.priceModelType
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Offer Amount
                  </span>

                  <strong>
                    {subscription.offerAmount !== null &&
                    subscription.offerAmount !== undefined
                      ? `₹${subscription.offerAmount}`
                      : "N/A"}
                  </strong>
                </div>

              </div>

            </div>

            {/* ==================================================
                SUBSCRIPTION DATES
                ================================================== */}

            <div className="jippy-outlet-subscription-history-section">

              <div className="jippy-outlet-subscription-history-section-title">
                <FaCalendarAlt />

                <span>
                  Subscription Dates
                </span>
              </div>

              <div className="jippy-outlet-subscription-history-grid">

                <div>
                  <span>
                    Subscription From Date
                  </span>

                  <strong>
                    {formatDate(
                      subscription.subscriptionFromDate
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Subscription To Date
                  </span>

                  <strong>
                    {formatDate(
                      subscription.subscriptionToDate
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Banner From Date
                  </span>

                  <strong>
                    {formatDate(
                      subscription.bannerFromDate
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Banner To Date
                  </span>

                  <strong>
                    {formatDate(
                      subscription.bannerToDate
                    )}
                  </strong>
                </div>

              </div>

            </div>

            {/* ==================================================
                SLOT INFORMATION
                ================================================== */}

            <div className="jippy-outlet-subscription-history-section">

              <div className="jippy-outlet-subscription-history-section-title">
                <FaTag />

                <span>
                  Slot Information
                </span>
              </div>

              <div className="jippy-outlet-subscription-history-grid">

                <div>
                  <span>
                    Banner Slot
                  </span>

                  <strong>
                    {displayValue(
                      subscription.bannerSlot
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Best Restaurant Slot
                  </span>

                  <strong>
                    {displayValue(
                      subscription.bestRestaurantSlot
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Deals Slot
                  </span>

                  <strong>
                    {displayValue(
                      subscription.dealsSlot
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Banner Slot Days ID
                  </span>

                  <strong>
                    {displayValue(
                      subscription.bannerSlotDaysId
                    )}
                  </strong>
                </div>

              </div>

            </div>

            {/* ==================================================
                MEAL TYPE TIMINGS
                ================================================== */}

            <div className="jippy-outlet-subscription-history-section">

              <div className="jippy-outlet-subscription-history-section-title">
                <FaClock />

                <span>
                  Meal Type Timings
                </span>
              </div>

              {subscription.mealTypeTimings &&
              subscription.mealTypeTimings.length > 0 ? (

                <div className="jippy-outlet-subscription-meal-table-wrapper">

                  <table className="jippy-outlet-subscription-meal-table">

                    <thead>
                      <tr>
                        <th>
                          Timing ID
                        </th>

                        <th>
                          Meal Type
                        </th>

                        <th>
                          From Time
                        </th>

                        <th>
                          To Time
                        </th>
                      </tr>
                    </thead>

                    <tbody>

                      {subscription.mealTypeTimings.map(
                        (meal) => (
                          <tr
                            key={
                              meal.mealTypeTimingsId
                            }
                          >

                            <td>
                              {displayValue(
                                meal.mealTypeTimingsId
                              )}
                            </td>

                            <td className="jippy-outlet-subscription-meal-name">
                              {displayValue(
                                meal.mealType
                              )}
                            </td>

                            <td>
                              {formatTime(
                                meal.fromTime
                              )}
                            </td>

                            <td>
                              {formatTime(
                                meal.toTime
                              )}
                            </td>

                          </tr>
                        )
                      )}

                    </tbody>

                  </table>

                </div>

              ) : (

                <div className="jippy-outlet-subscription-no-inner-data">
                  No meal timing information available.
                </div>

              )}

            </div>

            {/* ==================================================
                BANNER INFORMATION
                ================================================== */}

            <div className="jippy-outlet-subscription-history-section">

              <div className="jippy-outlet-subscription-history-section-title">
                <FaImage />

                <span>
                  Banner Information
                </span>
              </div>

              <div className="jippy-outlet-subscription-banner-grid">

                {/* MAIN BANNER */}

                <div className="jippy-outlet-subscription-banner-item">

                  <span>
                    Main Banner URL
                  </span>

                  {subscription.mainBannerUrl ? (
                    <a
                      href={
                        subscription.mainBannerUrl
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View Main Banner
                    </a>
                  ) : (
                    <strong>
                      N/A
                    </strong>
                  )}

                </div>

                {/* BEST RESTAURANT */}

                <div className="jippy-outlet-subscription-banner-item">

                  <span>
                    Best Restaurant Banner URL
                  </span>

                  {subscription.bestRestaurantBannerUrl ? (
                    <a
                      href={
                        subscription.bestRestaurantBannerUrl
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View Best Restaurant Banner
                    </a>
                  ) : (
                    <strong>
                      N/A
                    </strong>
                  )}

                </div>

                {/* DEALS */}

                <div className="jippy-outlet-subscription-banner-item">

                  <span>
                    Deals Banner URL
                  </span>

                  {subscription.dealsBannerUrl ? (
                    <a
                      href={
                        subscription.dealsBannerUrl
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View Deals Banner
                    </a>
                  ) : (
                    <strong>
                      N/A
                    </strong>
                  )}

                </div>

              </div>

            </div>

          </div>
        )}

      </div>

    </div>
  );
};

export default OutletSubscriptionHistory;