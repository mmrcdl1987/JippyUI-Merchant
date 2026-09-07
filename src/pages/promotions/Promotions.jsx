import React, { useEffect, useState } from "react";
import {
  FaCalendarAlt,
  FaPercentage,
  FaGift,
  FaTags,
  FaChartLine,
} from "react-icons/fa";

import api from "../../services/api";

import PercentOffPlan from "./PercentOffPlan";
import FlatOffer from "./FlatOffer";
import BuyOneGetOne from "./BuyOneGetOne";
import SlotBooking from "./SlotBooking";
import FestivalOffer from "./FestivalOffer";
import PlansStatus from "./PlansStatus";

import "../../styles/Promotions.css";

import { getPromotionPlanTypes } from "../../services/promotionService";




const Promotions = () => {
  const [activeType, setActiveType] = useState(null);
  const [promotionTypes, setPromotionTypes] = useState([]);
const [loadingPromotionTypes, setLoadingPromotionTypes] = useState(true);


  const [outlets, setOutlets] = useState([]);
  const [loadingOutlets, setLoadingOutlets] = useState(true);
  const [outletError, setOutletError] = useState("");

  useEffect(() => {
    fetchMerchantOutlets();
    fetchPromotionTypes();
  }, []);

  const fetchMerchantOutlets = async () => {
    try {
      setLoadingOutlets(true);
      setOutletError("");

      const merchantId = localStorage.getItem("merchantId");

      if (!merchantId) {
        throw new Error("Merchant ID not found. Please login again.");
      }

      const response = await api.get(
        "/api/fm/outlets/getOutletsByMerchant",
        {
          params: {
            merchantId,
          },
        }
      );

      const result = response.data;

      let outletList = [];

      if (Array.isArray(result)) {
        outletList = result;
      } else if (Array.isArray(result?.data)) {
        outletList = result.data;
      } else if (Array.isArray(result?.data?.content)) {
        outletList = result.data.content;
      } else if (Array.isArray(result?.content)) {
        outletList = result.content;
      }

      setOutlets(outletList);
    } catch (error) {
      console.error("Error loading merchant outlets:", error);
      setOutletError(
        error.response?.data?.message ||
          error.message ||
          "Unable to load merchant outlets."
      );
    } finally {
      setLoadingOutlets(false);
    }
  };

  const fetchPromotionTypes = async () => {
  try {
    setLoadingPromotionTypes(true);

    const data = await getPromotionPlanTypes();

    if (Array.isArray(data)) {
      setPromotionTypes(data);
    } else {
      setPromotionTypes([]);
    }
  } catch (error) {
    console.error("Error loading promotion plan types:", error);
    setPromotionTypes([]);
  } finally {
    setLoadingPromotionTypes(false);
  }
};

const getPromotionConfig = (id) => {
  switch (id) {
    case 1:
      return {
        key: "percentage",
        icon: <FaPercentage />,
      };

    case 2:
      return {
        key: "flat",
        icon: <FaTags />,
      };

    case 3:
      return {
        key: "buyOneGetOne",
        icon: <FaGift />,
      };

    case 4:
      return {
        key: "slot",
        icon: <FaCalendarAlt />,
      };

    case 15:
      return {
        key: "festival",
        icon: <FaGift />,
      };

    default:
      return {
        key: "",
        icon: <FaTags />,
      };
  }
};

  const getOutletId = (outlet) => {
    return (
      outlet?.outletId ??
      outlet?.id ??
      outlet?.outletID
    );
  };

  const renderPromotionForm = () => {
    if (!activeType) {
      return (
        <div className="promotion-dashboard-empty">
          <div className="promotion-dashboard-empty-icon">
            <FaChartLine />
          </div>

          <h3>Select a Promotion</h3>

          <p>
            Choose a promotion type above to create a promotional offer.
          </p>
        </div>
      );
    }

    const commonProps = {
      promotionTypeId: activeType.id,
      promotionTypeName: activeType.title,
      outlets,
      loadingOutlets,
      outletError,
    };

    switch (activeType.key) {
      case "percentage":
        return <PercentOffPlan {...commonProps} />;

      case "flat":
        return <FlatOffer {...commonProps} />;

      case "buyOneGetOne":
        return <BuyOneGetOne {...commonProps} />;

      case "slot":
        return <SlotBooking {...commonProps} />;

      case "festival":
        return <FestivalOffer {...commonProps} />;

      default:
        return null;
    }
  };

  return (
    <div className="merchant-promotions-page">

      <div className="merchant-promotions-header">
        <div>
          <h1>Promotions</h1>
          <p>
            Create and manage promotional offers for your outlets.
          </p>
        </div>
      </div>

      {outletError && (
        <div className="promotion-error">
          {outletError}
        </div>
      )}

      <div className="merchant-promotion-cards">

       {promotionTypes.map((type) => {
  const config = getPromotionConfig(
    type.promotionPlanTypesId
  );

  return (
    <button
      key={type.promotionPlanTypesId}
      type="button"
      className={`merchant-promotion-card ${
        activeType?.id === type.promotionPlanTypesId
          ? "merchant-promotion-card-active"
          : ""
      }`}
      onClick={() =>
        setActiveType({
          id: type.promotionPlanTypesId,
          key: config.key,
          title: type.planName,
        })
      }
      disabled={loadingOutlets || loadingPromotionTypes}
    >
      <div className="merchant-promotion-card-icon">
        {config.icon}
      </div>

      <span>{type.planName}</span>
    </button>
  );
})}

        <button
          type="button"
          className={`merchant-promotion-card merchant-promotion-status-card ${
            activeType?.key === "status"
              ? "merchant-promotion-card-active"
              : ""
          }`}
          onClick={() =>
            setActiveType({
              id: "status",
              key: "status",
              title: "Plans Status",
            })
          }
          disabled={loadingOutlets}
        >
          <div className="merchant-promotion-card-icon">
            <FaChartLine />
          </div>

          <span>Plans Status</span>
        </button>

      </div>

      <div className="merchant-promotion-content">
        {activeType?.key === "status" ? (
          <PlansStatus
            outlets={outlets}
            loadingOutlets={loadingOutlets}
            outletError={outletError}
          />
        ) : (
          renderPromotionForm()
        )}
      </div>
    </div>
  );
};

export default Promotions;