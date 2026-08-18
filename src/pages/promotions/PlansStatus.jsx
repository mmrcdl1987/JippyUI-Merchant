import "../../styles/PlansStatus.css";
import { useState } from "react";
import {
  FaPercent,
  FaGift,
  FaTag,
  FaCalendarAlt,
  FaChevronRight,
} from "react-icons/fa";

const PlansStatus = () => {

  const [activeTab, setActiveTab] = useState("Active");

  const plans = [
    {
      id: 1,
      type: "percent",
      title: "20% OFF on all orders",
      subtitle: "All Days • 11:00 AM - 02:00 PM",
      status: "Active",
    },
    {
      id: 2,
      type: "bogo",
      title: "Buy 1 Get 1 Free",
      subtitle: "Mon, Wed, Fri • All Day",
      status: "Active",
    },
    {
      id: 3,
      type: "flat",
      title: "Flat ₹100 OFF",
      subtitle: "Min. Order ₹499 • All Days",
      status: "Scheduled",
    },
    {
      id: 4,
      type: "slot",
      title: "Slot Booking Offer",
      subtitle: "5:00 PM - 8:00 PM • All Days",
      status: "Ended",
    },
  ];

  const filteredPlans =
    activeTab === "Active"
      ? plans.filter((plan) => plan.status === "Active")
      : activeTab === "Scheduled"
      ? plans.filter((plan) => plan.status === "Scheduled")
      : plans.filter((plan) => plan.status === "Ended");

  const getIcon = (type) => {
    switch (type) {
      case "percent":
        return <FaPercent />;
      case "bogo":
        return <FaGift />;
      case "flat":
        return <FaTag />;
      default:
        return <FaCalendarAlt />;
    }
  };

  return (
    <div className="merchant-plans-status-container">

      <h2 className="merchant-plans-status-title">
        Plans Status
      </h2>

      <p className="merchant-plans-status-description">
        View all active, scheduled and ended promotion plans.
      </p>

      <div className="merchant-plans-status-tabs">

        <button
          className={activeTab === "Active"
            ? "merchant-plans-status-tab active"
            : "merchant-plans-status-tab"}
          onClick={() => setActiveTab("Active")}
        >
          Active (
          {plans.filter(p => p.status === "Active").length}
          )
        </button>

        <button
          className={activeTab === "Scheduled"
            ? "merchant-plans-status-tab active"
            : "merchant-plans-status-tab"}
          onClick={() => setActiveTab("Scheduled")}
        >
          Scheduled (
          {plans.filter(p => p.status === "Scheduled").length}
          )
        </button>

        <button
          className={activeTab === "Ended"
            ? "merchant-plans-status-tab active"
            : "merchant-plans-status-tab"}
          onClick={() => setActiveTab("Ended")}
        >
          Ended (
          {plans.filter(p => p.status === "Ended").length}
          )
        </button>

      </div>

      <div className="merchant-plans-status-list">  
                {filteredPlans.map((plan) => (

          <div
            key={plan.id}
            className="merchant-plans-status-card"
          >

            <div className="merchant-plans-status-icon">
              {getIcon(plan.type)}
            </div>

            <div className="merchant-plans-status-content">

              <h4>{plan.title}</h4>

              <p>{plan.subtitle}</p>

            </div>

            <span
              className={`merchant-plans-status-badge ${plan.status.toLowerCase()}`}
            >
              {plan.status}
            </span>

            <button
              className="merchant-plans-status-arrow"
            >
              <FaChevronRight />
            </button>

          </div>

        ))}

      </div>

    </div>

  );
};

export default PlansStatus;