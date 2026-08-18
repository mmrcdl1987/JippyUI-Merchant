import { useState } from "react";
import "../../styles/Promotions.css";
import {
  FaCalendarAlt,
  FaPercentage,
  FaGift,
  FaTags,
  FaPlusCircle,
  FaChartLine,
} from "react-icons/fa";

import SlotBooking from "./SlotBooking";
import PercentOffPlan from "./PercentOffPlan";
import BuyOneGetOne from "./BuyOneGetOne";
import FlatOffer from "./FlatOffer";
import CreatePlan from "./CreatePlan";
import PlansStatus from "./PlansStatus";




const Coupons = () => {
  const [activeCard, setActiveCard] = useState("slotBooking");

  // const promotionCards = [
  //   {
  //     id: "slotBooking",
  //     title: "Slot Booking",
  //     icon: "📅",
  //   },
  //   {
  //     id: "percentageOffer",
  //     title: "% Off Plan",
  //     icon: "🏷️",
  //   },
  //   {
  //     id: "buyOneGetOne",
  //     title: "1+1 Offer",
  //     icon: "🎁",
  //   },
  //   {
  //     id: "flatOffer",
  //     title: "Flat Offer",
  //     icon: "💰",
  //   },
  //   {
  //     id: "createPlan",
  //     title: "Create Plan",
  //     icon: "➕",
  //   },
  //   {
  //     id: "plansStatus",
  //     title: "Plans Status",
  //     icon: "📊",
  //   },
  // ];

  const promotionCards = [
  {
    id: "slotBooking",
    title: "Slot Booking",
    icon: <FaCalendarAlt />,
  },
  {
    id: "percentageOffer",
    title: "% Off Plan",
    icon: <FaPercentage />,
  },
  {
    id: "buyOneGetOne",
    title: "1+1 Offer",
    icon: <FaGift />,
  },
  {
    id: "flatOffer",
    title: "Flat Offer",
    icon: <FaTags />,
  },
  {
    id: "createPlan",
    title: "Create Plan",
    icon: <FaPlusCircle />,
  },
  {
    id: "plansStatus",
    title: "Plans Status",
    icon: <FaChartLine />,
  },
];
  return (
    <div className="merchant-coupons-page">
      <h2 className="merchant-coupons-heading">Promotions</h2>

      <div className="merchant-coupons-cards-container">
        {promotionCards.map((card) => (
          <div
            key={card.id}
            className={`merchant-coupons-card ${
              activeCard === card.id
                ? "merchant-coupons-card-active"
                : ""
            }`}
            onClick={() => setActiveCard(card.id)}
          >
            <div className="merchant-coupons-card-icon">{card.icon}</div>

            <div className="merchant-coupons-card-title">
              {card.title}
            </div>
          </div>
        ))}
      </div>

  <div className="merchant-coupons-content">
{activeCard === "slotBooking" && <SlotBooking />}

  {activeCard === "percentageOffer" && (
    <PercentOffPlan />
  )}

  {activeCard === "buyOneGetOne" && (
    <BuyOneGetOne />
  )}

  {activeCard === "flatOffer" && (
    <FlatOffer />
  )}

  {activeCard === "createPlan" && (
    <CreatePlan />
  )}

  {activeCard === "plansStatus" && (
   <PlansStatus/>
  )}
</div>
    </div>
  );
};

export default Coupons;